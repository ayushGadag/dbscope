"""
Migration parser module for DBScope.

Parses raw SQL migration statements and extracts structured change operations.
Supported operations (Day 2):
    - DROP COLUMN:   ALTER TABLE <table> DROP COLUMN <column>;
    - ADD COLUMN:    ALTER TABLE <table> ADD COLUMN <column> <data_type>;
    - ALTER COLUMN:  ALTER TABLE <table> ALTER COLUMN <column> <clause/type>;
    - RENAME COLUMN: ALTER TABLE <table> RENAME COLUMN <old_col> TO <new_col>;
"""

import re
from typing import Any, Dict, Optional

# Regex patterns for supported migration operations.
# All patterns handle optional quotes/backticks, case-insensitivity, whitespace, and optional trailing semicolon.

DROP_COLUMN_PATTERN = re.compile(
    r"^\s*ALTER\s+TABLE\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+DROP\s+COLUMN\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s*;?\s*$",
    re.IGNORECASE,
)

ADD_COLUMN_PATTERN = re.compile(
    r"^\s*ALTER\s+TABLE\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+ADD\s+COLUMN\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+([^;]+?)\s*;?\s*$",
    re.IGNORECASE,
)

ALTER_COLUMN_PATTERN = re.compile(
    r"^\s*ALTER\s+TABLE\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+ALTER\s+COLUMN\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+([^;]+?)\s*;?\s*$",
    re.IGNORECASE,
)

RENAME_COLUMN_PATTERN = re.compile(
    r"^\s*ALTER\s+TABLE\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+RENAME\s+COLUMN\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s+TO\s+[`\"']?([a-zA-Z0-9_]+)[`\"']?\s*;?\s*$",
    re.IGNORECASE,
)


def parse_migration(sql: str) -> Optional[Dict[str, Any]]:
    """
    Parse a SQL migration statement and return structured information about the change.

    Args:
        sql: A string containing the SQL migration statement.

    Returns:
        A dictionary containing structured operation details, or None if unsupported/invalid.
    """
    if not isinstance(sql, str):
        return None

    cleaned_sql = sql.strip()
    if not cleaned_sql:
        return None

    # 1. Check DROP COLUMN
    match_drop = DROP_COLUMN_PATTERN.match(cleaned_sql)
    if match_drop:
        return {
            "operation": "DROP_COLUMN",
            "table": match_drop.group(1),
            "column": match_drop.group(2),
        }

    # 2. Check ADD COLUMN
    match_add = ADD_COLUMN_PATTERN.match(cleaned_sql)
    if match_add:
        return {
            "operation": "ADD_COLUMN",
            "table": match_add.group(1),
            "column": match_add.group(2),
            "data_type": match_add.group(3).strip(),
        }

    # 3. Check ALTER COLUMN
    match_alter = ALTER_COLUMN_PATTERN.match(cleaned_sql)
    if match_alter:
        table_name = match_alter.group(1)
        column_name = match_alter.group(2)
        clause = match_alter.group(3).strip()

        result: Dict[str, Any] = {
            "operation": "ALTER_COLUMN",
            "table": table_name,
            "column": column_name,
            "clause": clause,
        }

        # If TYPE or SET DATA TYPE is specified, extract the new type
        clause_upper = clause.upper()
        if clause_upper.startswith("TYPE "):
            result["new_type"] = clause[5:].strip()
        elif clause_upper.startswith("SET DATA TYPE "):
            result["new_type"] = clause[14:].strip()

        return result

    # 4. Check RENAME COLUMN
    match_rename = RENAME_COLUMN_PATTERN.match(cleaned_sql)
    if match_rename:
        return {
            "operation": "RENAME_COLUMN",
            "table": match_rename.group(1),
            "old_column": match_rename.group(2),
            "new_column": match_rename.group(3),
        }

    return None
