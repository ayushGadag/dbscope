"""
Migration parser module for DBScope.

Parses raw SQL migration statements and extracts structured change operations.
For Day 1, supports detection of DROP COLUMN statements:
    ALTER TABLE <table> DROP COLUMN <column>;
"""

import re
from typing import Any, Dict, Optional

# Regex pattern to detect: ALTER TABLE <table> DROP COLUMN <column>;
# Handles case insensitivity, varying whitespace, optional quotes, and optional trailing semicolon.
DROP_COLUMN_PATTERN = re.compile(
    r"^\s*ALTER\s+TABLE\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+DROP\s+COLUMN\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s*;?\s*$",
    re.IGNORECASE,
)


def parse_migration(sql: str) -> Optional[Dict[str, Any]]:
    """
    Parse a SQL migration statement and return structured information about the change.

    Args:
        sql: A string containing the SQL migration statement.

    Returns:
        A dictionary containing:
            - operation: The detected operation (e.g., 'DROP_COLUMN')
            - table: The target table name
            - column: The target column name
        Returns None if the statement is invalid or unsupported.
    """
    if not isinstance(sql, str):
        return None

    cleaned_sql = sql.strip()
    if not cleaned_sql:
        return None

    match = DROP_COLUMN_PATTERN.match(cleaned_sql)
    if match:
        table_name = match.group(1)
        column_name = match.group(2)
        return {
            "operation": "DROP_COLUMN",
            "table": table_name,
            "column": column_name,
        }

    return None
