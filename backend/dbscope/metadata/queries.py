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

# Query foreign key constraints for a given schema.
FOREIGN_KEYS_QUERY = """
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN
    information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE
    tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = %(schema)s;
"""

# Query general table constraints for a given schema.
CONSTRAINTS_QUERY = """
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM
    information_schema.table_constraints tc
LEFT JOIN
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE
    tc.table_schema = %(schema)s
ORDER BY
    tc.table_name, tc.constraint_name;
"""

# Query available schemas in the database excluding internal catalogs.
SCHEMAS_QUERY = """
SELECT
    schema_name
FROM
    information_schema.schemata
WHERE
    schema_name NOT IN ('pg_catalog', 'information_schema')
ORDER BY
    schema_name;
"""
