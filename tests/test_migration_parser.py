"""
Unit tests for dbscope.migration_parser.
Tests DROP COLUMN, ADD COLUMN, ALTER COLUMN, RENAME COLUMN, and invalid inputs.
"""

import pytest
from dbscope.migration_parser import parse_migration


class TestMigrationParser:
    """Tests for SQL migration operation detection in migration_parser."""

    # -------------------------------------------------------------------------
    # 1. DROP COLUMN Tests
    # -------------------------------------------------------------------------

    def test_valid_drop_column_users(self):
        """Test standard DROP COLUMN on users table."""
        sql = "ALTER TABLE users DROP COLUMN email;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "DROP_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "email"

    def test_valid_drop_column_products(self):
        """Test standard DROP COLUMN on products table."""
        sql = "ALTER TABLE products DROP COLUMN price;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "DROP_COLUMN"
        assert result["table"] == "products"
        assert result["column"] == "price"

    def test_valid_drop_column_without_semicolon(self):
        """Test DROP COLUMN without trailing semicolon."""
        sql = "ALTER TABLE orders DROP COLUMN tracking_code"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "DROP_COLUMN"
        assert result["table"] == "orders"
        assert result["column"] == "tracking_code"

    def test_valid_drop_column_case_insensitive(self):
        """Test lowercase ALTER TABLE statement."""
        sql = "alter table customers drop column phone_number;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "DROP_COLUMN"
        assert result["table"] == "customers"
        assert result["column"] == "phone_number"

    def test_valid_drop_column_with_extra_spaces(self):
        """Test statement with irregular spaces and tabs."""
        sql = "   ALTER    TABLE   accounts    DROP   COLUMN   balance ;   "
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "DROP_COLUMN"
        assert result["table"] == "accounts"
        assert result["column"] == "balance"

    def test_valid_drop_column_quoted_identifiers(self):
        """Test statement with quoted identifiers."""
        sql = 'ALTER TABLE "users" DROP COLUMN "email";'
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "DROP_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "email"

    # -------------------------------------------------------------------------
    # 2. ADD COLUMN Tests
    # -------------------------------------------------------------------------

    def test_valid_add_column_integer(self):
        """Test ADD COLUMN with INTEGER data type."""
        sql = "ALTER TABLE users ADD COLUMN age INTEGER;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ADD_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "age"
        assert result["data_type"] == "INTEGER"

    def test_valid_add_column_varchar(self):
        """Test ADD COLUMN with parameterized data type (VARCHAR(255))."""
        sql = "ALTER TABLE products ADD COLUMN description VARCHAR(255);"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ADD_COLUMN"
        assert result["table"] == "products"
        assert result["column"] == "description"
        assert result["data_type"] == "VARCHAR(255)"

    def test_valid_add_column_without_semicolon(self):
        """Test ADD COLUMN without trailing semicolon."""
        sql = "ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100)"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ADD_COLUMN"
        assert result["table"] == "orders"
        assert result["column"] == "tracking_number"
        assert result["data_type"] == "VARCHAR(100)"

    def test_valid_add_column_case_insensitive(self):
        """Test ADD COLUMN with lowercase keywords."""
        sql = "alter table customers add column is_verified boolean;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ADD_COLUMN"
        assert result["table"] == "customers"
        assert result["column"] == "is_verified"
        assert result["data_type"] == "boolean"

    def test_valid_add_column_quoted_identifiers(self):
        """Test ADD COLUMN with quoted identifiers."""
        sql = 'ALTER TABLE "users" ADD COLUMN "created_at" TIMESTAMP;'
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ADD_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "created_at"
        assert result["data_type"] == "TIMESTAMP"

    # -------------------------------------------------------------------------
    # 3. ALTER COLUMN Tests
    # -------------------------------------------------------------------------

    def test_valid_alter_column_type(self):
        """Test ALTER COLUMN changing type to BIGINT."""
        sql = "ALTER TABLE users ALTER COLUMN age TYPE BIGINT;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ALTER_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "age"
        assert result["new_type"] == "BIGINT"

    def test_valid_alter_column_set_data_type(self):
        """Test ALTER COLUMN using SET DATA TYPE syntax."""
        sql = "ALTER TABLE products ALTER COLUMN price SET DATA TYPE NUMERIC(10,2);"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ALTER_COLUMN"
        assert result["table"] == "products"
        assert result["column"] == "price"
        assert result["new_type"] == "NUMERIC(10,2)"

    def test_valid_alter_column_set_not_null(self):
        """Test ALTER COLUMN with non-type clause (SET NOT NULL)."""
        sql = "ALTER TABLE users ALTER COLUMN email SET NOT NULL;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ALTER_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "email"
        assert result["clause"] == "SET NOT NULL"

    def test_valid_alter_column_without_semicolon(self):
        """Test ALTER COLUMN without semicolon and lowercase."""
        sql = "alter table accounts alter column balance type decimal"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ALTER_COLUMN"
        assert result["table"] == "accounts"
        assert result["column"] == "balance"
        assert result["new_type"] == "decimal"

    def test_valid_alter_column_quoted_identifiers(self):
        """Test ALTER COLUMN with quoted identifiers."""
        sql = 'ALTER TABLE "users" ALTER COLUMN "status" TYPE VARCHAR(50);'
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "ALTER_COLUMN"
        assert result["table"] == "users"
        assert result["column"] == "status"
        assert result["new_type"] == "VARCHAR(50)"

    # -------------------------------------------------------------------------
    # 4. RENAME COLUMN Tests
    # -------------------------------------------------------------------------

    def test_valid_rename_column(self):
        """Test RENAME COLUMN standard syntax."""
        sql = "ALTER TABLE users RENAME COLUMN email TO email_address;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "RENAME_COLUMN"
        assert result["table"] == "users"
        assert result["old_column"] == "email"
        assert result["new_column"] == "email_address"

    def test_valid_rename_column_without_semicolon(self):
        """Test RENAME COLUMN without trailing semicolon."""
        sql = "ALTER TABLE products RENAME COLUMN cost TO wholesale_price"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "RENAME_COLUMN"
        assert result["table"] == "products"
        assert result["old_column"] == "cost"
        assert result["new_column"] == "wholesale_price"

    def test_valid_rename_column_case_insensitive(self):
        """Test RENAME COLUMN with lowercase keywords."""
        sql = "alter table employees rename column dept to department;"
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "RENAME_COLUMN"
        assert result["table"] == "employees"
        assert result["old_column"] == "dept"
        assert result["new_column"] == "department"

    def test_valid_rename_column_quoted_identifiers(self):
        """Test RENAME COLUMN with quoted identifiers."""
        sql = 'ALTER TABLE "orders" RENAME COLUMN "qty" TO "quantity";'
        result = parse_migration(sql)

        assert result is not None
        assert result["operation"] == "RENAME_COLUMN"
        assert result["table"] == "orders"
        assert result["old_column"] == "qty"
        assert result["new_column"] == "quantity"

    # -------------------------------------------------------------------------
    # 5. Invalid / Unsupported Input Tests
    # -------------------------------------------------------------------------

    def test_invalid_arbitrary_string(self):
        """Test arbitrary text input."""
        sql = "hello world"
        result = parse_migration(sql)

        assert result is None

    def test_invalid_select_statement(self):
        """Test non-DDL SQL statement (SELECT)."""
        sql = "SELECT * FROM users;"
        result = parse_migration(sql)

        assert result is None

    def test_invalid_unsupported_ddl(self):
        """Test other DDL operations not supported in Day 2."""
        assert parse_migration("CREATE TABLE users (id INT);") is None
        assert parse_migration("DROP TABLE users;") is None
        assert parse_migration("TRUNCATE TABLE users;") is None

    def test_empty_or_whitespace_input(self):
        """Test empty and whitespace-only inputs."""
        assert parse_migration("") is None
        assert parse_migration("   ") is None
        assert parse_migration("\n\t") is None
