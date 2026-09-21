"""
Command Line Interface (CLI) for DBScope v0.2.
"""

import sys
from dbscope.migration_parser import parse_migration


def format_operation_name(operation_code: str) -> str:
    """Format an internal operation code (e.g., DROP_COLUMN) for user display."""
    return operation_code.replace("_", " ")


def main() -> None:
    """Entry point for DBScope CLI."""
    print("========================================")
    print("              DBSCOPE v0.2")
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

    if analysis and "operation" in analysis:
        op = analysis["operation"]
        formatted_op = format_operation_name(op)
        print(f"Operation : {formatted_op}")
        print(f"Table     : {analysis['table']}")

        if op == "DROP_COLUMN":
            print(f"Column    : {analysis['column']}")
        elif op == "ADD_COLUMN":
            print(f"Column    : {analysis['column']}")
            print(f"Data Type : {analysis['data_type']}")
        elif op == "ALTER_COLUMN":
            print(f"Column    : {analysis['column']}")
            if "new_type" in analysis:
                print(f"New Type  : {analysis['new_type']}")
            elif "clause" in analysis:
                print(f"Details   : {analysis['clause']}")
        elif op == "RENAME_COLUMN":
            print(f"Old Column: {analysis['old_column']}")
            print(f"New Column: {analysis['new_column']}")

        print("Status    : Change detected")
    else:
        print("Status    : Unsupported or invalid migration.")


if __name__ == "__main__":
    main()
