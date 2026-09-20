"""
Command Line Interface (CLI) for DBScope v0.1.
"""

import sys
from dbscope.migration_parser import parse_migration


def format_operation_name(operation_code: str) -> str:
    """Format an internal operation code (e.g., DROP_COLUMN) for user display."""
    return operation_code.replace("_", " ")


def main() -> None:
    """Entry point for DBScope CLI."""
    print("========================================")
    print("              DBSCOPE v0.1")
    print("========================================")
    print()

    try:
        sql = input("Enter SQL migration:\n> ").strip()
    except (KeyboardInterrupt, EOFError):
        print("\nOperation cancelled.")
        sys.exit(0)

    print()
    print("----------------------------------------")
    print("MIGRATION ANALYSIS")
    print("----------------------------------------")

    analysis = parse_migration(sql)

    if analysis and analysis.get("operation") == "DROP_COLUMN":
        formatted_op = format_operation_name(analysis["operation"])
        print(f"Operation : {formatted_op}")
        print(f"Table     : {analysis['table']}")
        print(f"Column    : {analysis['column']}")
        print("Status    : Change detected")
    else:
        print("Status    : Unsupported or invalid migration.")


if __name__ == "__main__":
    main()
