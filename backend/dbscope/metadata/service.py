"""
PostgreSQL read-only metadata service.
Extracts schema definition metadata exclusively from PostgreSQL information_schema catalogs.
Guarantees zero database modifications and ensures database credentials are never leaked.
"""

import re
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urlparse, urlunparse

from dbscope.metadata.queries import COLUMNS_QUERY, PRIMARY_KEYS_QUERY


def mask_connection_url(url: str) -> str:
    """
    Mask password in a database connection URL for safe logging and error reporting.

    Example:
        'postgresql://postgres:secret123@localhost:5432/mydb'
        -> 'postgresql://postgres:****@localhost:5432/mydb'
    """
    if not url:
        return ""

    try:
        parsed = urlparse(url)
        if parsed.password:
            # Reconstruct netloc with masked password
            netloc = f"{parsed.username}:****@{parsed.hostname}"
            if parsed.port:
                netloc += f":{parsed.port}"
            masked = parsed._replace(netloc=netloc)
            return urlunparse(masked)
        return url
    except Exception:
        # Fallback regex masking if URL parsing fails
        return re.sub(r":([^@/]+)@", r":****@", url)


def normalize_schema_metadata(
    column_rows: List[Dict[str, Any]],
    pk_rows: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Transform raw PostgreSQL catalog records into clean, structured schema metadata.

    Args:
        column_rows: Raw records from information_schema.columns containing
                     table_name, column_name, data_type, is_nullable, ordinal_position.
        pk_rows: Optional raw records from information_schema constraints containing
                 table_name and column_name of primary keys.

    Returns:
        Structured dictionary matching:
        {
            "tables": [
                {
                    "name": "users",
                    "columns": [
                        {
                            "name": "id",
                            "data_type": "integer",
                            "is_nullable": False,
                            "is_primary_key": True
                        },
                        ...
                    ]
                }
            ]
        }
    """
    # Build set of (table_name, column_name) for primary keys
    pk_set: Set[tuple] = set()
    if pk_rows:
        for row in pk_rows:
            table = row.get("table_name")
            col = row.get("column_name")
            if table and col:
                pk_set.add((table, col))

    # Group columns by table while maintaining discovery order
    tables_map: Dict[str, List[Dict[str, Any]]] = {}

    for row in column_rows:
        table_name = row.get("table_name")
        column_name = row.get("column_name")
        data_type = row.get("data_type")
        raw_nullable = row.get("is_nullable", "YES")

        if not table_name or not column_name:
            continue

        if table_name not in tables_map:
            tables_map[table_name] = []

        is_nullable = str(raw_nullable).strip().upper() == "YES"
        is_pk = (table_name, column_name) in pk_set

        tables_map[table_name].append(
            {
                "name": column_name,
                "data_type": str(data_type).lower() if data_type else "unknown",
                "is_nullable": is_nullable,
                "is_primary_key": is_pk,
            }
        )

    tables_list = [
        {"name": tbl_name, "columns": cols}
        for tbl_name, cols in tables_map.items()
    ]

    return {"tables": tables_list}


class PostgresMetadataService:
    """
    Service responsible for safe, read-only extraction of PostgreSQL schema metadata.

    Safety:
    - Never executes user-provided SQL.
    - Never executes migration scripts.
    - Never executes DDL, INSERT, UPDATE, or DELETE statements.
    - Never queries application data rows.
    - Always sanitizes and masks connection passwords in logs and errors.
    """

    def __init__(self, connection_url: Optional[str] = None):
        self.connection_url = connection_url or ""
        self.masked_url = mask_connection_url(self.connection_url)

    def inspect_schema(self, schema_name: str = "public") -> Dict[str, Any]:
        """
        Inspect PostgreSQL schema metadata for the given schema using catalog queries.

        Attempts connection through psycopg/psycopg2 if available.
        If no driver or database instance is available, raises a safe, informative error.
        """
        if not self.connection_url:
            raise ValueError("Database connection URL was not provided.")

        masked = mask_connection_url(self.connection_url)

        # Attempt to import postgres driver
        try:
            import psycopg2
            import psycopg2.extras
        except ImportError:
            try:
                import psycopg
                psycopg2 = None
            except ImportError:
                raise RuntimeError(
                    f"PostgreSQL driver (psycopg2 or psycopg) is not installed. "
                    f"A running PostgreSQL instance and driver are required for live inspection. "
                    f"Target connection: {masked}"
                )

        try:
            if psycopg2:
                # Enforce read-only connection option
                conn = psycopg2.connect(
                    self.connection_url,
                    options="-c default_transaction_read_only=on",
                )
                try:
                    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                        cur.execute("SET TRANSACTION READ ONLY;")

                        # Execute read-only columns catalog query
                        cur.execute(COLUMNS_QUERY, {"schema": schema_name})
                        col_rows = [dict(r) for r in cur.fetchall()]

                        # Execute read-only primary keys catalog query
                        cur.execute(PRIMARY_KEYS_QUERY, {"schema": schema_name})
                        pk_rows = [dict(r) for r in cur.fetchall()]

                        return normalize_schema_metadata(col_rows, pk_rows)
                finally:
                    conn.close()
            else:
                # psycopg (v3) branch
                import psycopg.rows
                with psycopg.connect(self.connection_url) as conn:
                    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
                        cur.execute("SET TRANSACTION READ ONLY;")
                        cur.execute(COLUMNS_QUERY, {"schema": schema_name})
                        col_rows = cur.fetchall()

                        cur.execute(PRIMARY_KEYS_QUERY, {"schema": schema_name})
                        pk_rows = cur.fetchall()

                        return normalize_schema_metadata(col_rows, pk_rows)

        except Exception as e:
            # Mask any credentials that might be inside error message
            safe_error = mask_connection_url(str(e))
            raise RuntimeError(
                f"Failed to inspect PostgreSQL schema at {masked}: {safe_error}. "
                f"A running PostgreSQL database is required for live inspection."
            )
