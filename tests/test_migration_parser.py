"""
Unit tests for dbscope.migration_parser.
"""

import pytest
from dbscope.migration_parser import parse_migration


class TestMigrationParser:
    """Tests for DROP COLUMN detection in migration_parser."""

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

    def test_invalid_arbitrary_string(self):
        """Test arbitrary text input."""
        sql = "hello world"
        result = parse_migration(sql)

        assert result is None

    def test_invalid_select_statement(self):
        """Test non-DROP SQL statement (SELECT)."""
        sql = "SELECT * FROM users;"
        result = parse_migration(sql)

        assert result is None

    def test_invalid_unsupported_ddl(self):
        """Test other DDL operations not yet supported in Day 1."""
        assert parse_migration("CREATE TABLE users (id INT);") is None
        assert parse_migration("DROP TABLE users;") is None
        assert parse_migration("ALTER TABLE users ADD COLUMN age INT;") is None

    def test_empty_or_whitespace_input(self):
        """Test empty and whitespace-only inputs."""
        assert parse_migration("") is None
        assert parse_migration("   ") is None
        assert parse_migration("\n\t") is None
