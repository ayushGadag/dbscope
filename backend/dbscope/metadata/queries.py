"""
Parameterized read-only queries targeting PostgreSQL information_schema catalogs.
"""

# Query column metadata for a given schema.
# Targets exclusively information_schema.columns.
COLUMNS_QUERY = """
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    ordinal_position
FROM
    information_schema.columns
WHERE
    table_schema = %(schema)s
ORDER BY
    table_name,
    ordinal_position;
"""

# Query primary key constraint columns for a given schema.
# Targets exclusively information_schema constraints and key usages.
PRIMARY_KEYS_QUERY = """
SELECT
    tc.table_name,
    kcu.column_name
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE
    tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = %(schema)s;
"""
