"""
PostgreSQL read-only metadata service.
Extracts schema definition metadata exclusively from PostgreSQL information_schema catalogs.
Guarantees zero database modifications and ensures database credentials are never leaked.
"""

import re
from typing import Any, Dict, List, Optional, Set
from urllib.parse import quote_plus, urlparse, urlunparse

from dbscope.metadata.queries import (
    COLUMNS_QUERY,
    CONSTRAINTS_QUERY,
    FOREIGN_KEYS_QUERY,
    PRIMARY_KEYS_QUERY,
    SCHEMAS_QUERY,
)


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


def build_connection_url(
    host: Optional[str] = None,
    port: Optional[int] = 5432,
    database: Optional[str] = None,
    username: Optional[str] = None,
    password: Optional[str] = None,
    connection_url: Optional[str] = None,
) -> str:
    """
    Safely construct a PostgreSQL connection URL from discrete parameters.
    """
    if connection_url and connection_url.strip():
        return connection_url.strip()

    if not host or not database:
        return ""

    user = quote_plus(username.strip()) if username else "postgres"
    port_val = port if port else 5432
    db = database.strip().lstrip("/")

    if password:
        pwd = quote_plus(password)
        return f"postgresql://{user}:{pwd}@{host.strip()}:{port_val}/{db}"
    return f"postgresql://{user}@{host.strip()}:{port_val}/{db}"


def normalize_schema_metadata(
    column_rows: List[Dict[str, Any]],
    pk_rows: Optional[List[Dict[str, Any]]] = None,
    fk_rows: Optional[List[Dict[str, Any]]] = None,
    constraint_rows: Optional[List[Dict[str, Any]]] = None,
    schema_rows: Optional[List[Dict[str, Any]]] = None,
    schema_name: str = "public",
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

    # Group foreign keys by table
    fk_map: Dict[str, List[Dict[str, Any]]] = {}
    if fk_rows:
        for row in fk_rows:
            table = row.get("table_name")
            if not table:
                continue
            if table not in fk_map:
                fk_map[table] = []
            fk_map[table].append(
                {
                    "column": row.get("column_name", ""),
                    "foreign_table": row.get("foreign_table_name", ""),
                    "foreign_column": row.get("foreign_column_name", ""),
                    "constraint_name": row.get("constraint_name"),
                }
            )

    # Group constraints by table
    constraint_map: Dict[str, List[Dict[str, Any]]] = {}
    if constraint_rows:
        for row in constraint_rows:
            table = row.get("table_name")
            if not table:
                continue
            if table not in constraint_map:
                constraint_map[table] = []
            constraint_map[table].append(
                {
                    "name": row.get("constraint_name", ""),
                    "type": row.get("constraint_type", ""),
                    "column": row.get("column_name"),
                }
            )

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
        {
            "name": tbl_name,
            "columns": cols,
            "foreign_keys": fk_map.get(tbl_name, []),
            "constraints": constraint_map.get(tbl_name, []),
        }
        for tbl_name, cols in tables_map.items()
    ]

    discovered_schemas = (
        [r.get("schema_name") for r in schema_rows if r.get("schema_name")]
        if schema_rows
        else [schema_name]
    )

    return {
        "tables": tables_list,
        "schemas": discovered_schemas,
        "schema_name": schema_name,
        "total_tables": len(tables_list),
        "total_columns": sum(len(t["columns"]) for t in tables_list),
    }


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

    def __init__(
        self,
        connection_url: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = 5432,
        database: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
    ):
        if not connection_url and host and database:
            self.connection_url = build_connection_url(
                host=host,
                port=port,
                database=database,
                username=username,
                password=password,
            )
        else:
            self.connection_url = connection_url or ""
        self.masked_url = mask_connection_url(self.connection_url)

    def _get_driver(self):
        """Helper to get available PostgreSQL driver."""
        try:
            import psycopg2
            import psycopg2.extras
            return "psycopg2", psycopg2
        except ImportError:
            try:
                import psycopg
                import psycopg.rows
                return "psycopg", psycopg
            except ImportError:
                masked = self.masked_url
                raise RuntimeError(
                    f"PostgreSQL driver (psycopg2 or psycopg) is not installed. "
                    f"A running PostgreSQL instance and driver are required for live inspection. "
                    f"Target connection: {masked}"
                )

    def test_connection(self) -> Dict[str, Any]:
        """
        Safely test PostgreSQL connection in strict read-only mode without executing migrations or modifying state.
        """
        if not self.connection_url:
            raise ValueError("Database connection URL or host/database was not provided.")

        driver_type, driver = self._get_driver()
        masked = self.masked_url

        try:
            parsed = urlparse(self.connection_url)
            db_name = parsed.path.lstrip("/") or "PostgreSQL"
            server_version = "PostgreSQL"

            if driver_type == "psycopg2":
                conn = driver.connect(
                    self.connection_url,
                    connect_timeout=3,
                    options="-c default_transaction_read_only=on",
                )
                try:
                    with conn.cursor() as cur:
                        cur.execute("SET TRANSACTION READ ONLY;")
                        cur.execute("SELECT version();")
                        row = cur.fetchone()
                        if row:
                            server_version = str(row[0]).split(",")[0]
                finally:
                    conn.close()
            else:
                with driver.connect(self.connection_url, connect_timeout=3) as conn:
                    with conn.cursor() as cur:
                        cur.execute("SET TRANSACTION READ ONLY;")
                        cur.execute("SELECT version();")
                        row = cur.fetchone()
                        if row:
                            server_version = str(row[0]).split(",")[0]

            return {
                "success": True,
                "message": "Connection successful",
                "details": f"Connected to {server_version} (Read-only session enforced). Target: {masked}",
                "database": db_name,
                "server_version": server_version,
            }
        except Exception as e:
            safe_error = mask_connection_url(str(e))
            raise RuntimeError(
                f"Failed to connect to PostgreSQL at {masked}: {safe_error}. "
                f"A running PostgreSQL database is required for live inspection."
            )

    def inspect_schema(self, schema_name: str = "public") -> Dict[str, Any]:
        """
        Inspect PostgreSQL schema metadata for the given schema using catalog queries.

        Guarantees:
        - Never queries application rows.
        - Only queries information_schema catalogs.
        - Enforces read-only transaction.
        """
        if not self.connection_url:
            raise ValueError("Database connection URL was not provided.")

        driver_type, driver = self._get_driver()
        masked = self.masked_url

        try:
            if driver_type == "psycopg2":
                import psycopg2.extras
                conn = driver.connect(
                    self.connection_url,
                    connect_timeout=3,
                    options="-c default_transaction_read_only=on",
                )
                try:
                    with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                        cur.execute("SET TRANSACTION READ ONLY;")

                        cur.execute(COLUMNS_QUERY, {"schema": schema_name})
                        col_rows = [dict(r) for r in cur.fetchall()]

                        cur.execute(PRIMARY_KEYS_QUERY, {"schema": schema_name})
                        pk_rows = [dict(r) for r in cur.fetchall()]

                        cur.execute(FOREIGN_KEYS_QUERY, {"schema": schema_name})
                        fk_rows = [dict(r) for r in cur.fetchall()]

                        cur.execute(CONSTRAINTS_QUERY, {"schema": schema_name})
                        constraint_rows = [dict(r) for r in cur.fetchall()]

                        cur.execute(SCHEMAS_QUERY)
                        schema_rows = [dict(r) for r in cur.fetchall()]

                        return normalize_schema_metadata(
                            column_rows=col_rows,
                            pk_rows=pk_rows,
                            fk_rows=fk_rows,
                            constraint_rows=constraint_rows,
                            schema_rows=schema_rows,
                            schema_name=schema_name,
                        )
                finally:
                    conn.close()
            else:
                import psycopg.rows
                with driver.connect(self.connection_url, connect_timeout=3) as conn:
                    with conn.cursor(row_factory=psycopg.rows.dict_row) as cur:
                        cur.execute("SET TRANSACTION READ ONLY;")

                        cur.execute(COLUMNS_QUERY, {"schema": schema_name})
                        col_rows = cur.fetchall()

                        cur.execute(PRIMARY_KEYS_QUERY, {"schema": schema_name})
                        pk_rows = cur.fetchall()

                        cur.execute(FOREIGN_KEYS_QUERY, {"schema": schema_name})
                        fk_rows = cur.fetchall()

                        cur.execute(CONSTRAINTS_QUERY, {"schema": schema_name})
                        constraint_rows = cur.fetchall()

                        cur.execute(SCHEMAS_QUERY)
                        schema_rows = cur.fetchall()

                        return normalize_schema_metadata(
                            column_rows=col_rows,
                            pk_rows=pk_rows,
                            fk_rows=fk_rows,
                            constraint_rows=constraint_rows,
                            schema_rows=schema_rows,
                            schema_name=schema_name,
                        )

        except Exception as e:
            safe_error = mask_connection_url(str(e))
            raise RuntimeError(
                f"Failed to inspect PostgreSQL schema at {masked}: {safe_error}. "
                f"A running PostgreSQL database is required for live inspection."
            )
