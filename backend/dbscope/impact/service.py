"""
Dedicated Impact Analysis Service for DBScope.
Converts SQL migrations, database changes, and AST-extracted dependencies
into a structured change impact analysis report.

Important Conceptual Boundary:
- Impact Analysis: "What application/database components are affected by this change?"
- Risk Assessment: "How serious/risky is that impact?" (handled in a separate phase)
"""

from pathlib import Path
import tempfile
from typing import Any, Dict, List, Optional

from dbscope.dependencies.extractor import DependencyExtractor
from dbscope.dependencies.graph_builder import GraphBuilder
from dbscope.metadata.service import PostgresMetadataService
from dbscope.migration_parser import parse_migration
from dbscope.source.connector import (
    cleanup_source_dir,
    fetch_github_repository,
    get_active_source_dir,
    validate_and_extract_zip,
)


class ImpactAnalysisService:
    """
    Dedicated service for computing database change impact analysis.

    Responsibilities:
    - Parse and inspect database migration operations.
    - Extract affected application components across ORM models, Pydantic schemas, and API routes.
    - Build interactive evidence graph connecting database objects to application code.
    - Categorize affected layers (DATABASE, ORM_MODEL, PYDANTIC_SCHEMA, FASTAPI_ROUTE).
    - Generate human-readable explanations of impact.
    """

    def __init__(self, default_source_dir: Optional[Path] = None):
        self.default_source_dir = default_source_dir

    def compute_impact(
        self,
        parsed_migration: Optional[Dict[str, Any]],
        changed_object: str,
        dependencies: List[Dict[str, Any]],
        graph: Optional[Dict[str, Any]] = None,
        data_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Pure transformation step that constructs the structured impact analysis report.

        Args:
            parsed_migration: Structured migration details from migration_parser.
            changed_object: Target database object in 'table.column' format.
            dependencies: List of extracted dependency items from DependencyExtractor.
            graph: Optional dependency graph data from GraphBuilder.
            data_type: Optional database column data type.

        Returns:
            Dictionary matching the ImpactAnalysisResponse schema.
        """
        if dependencies is None:
            dependencies = []

        # 1. Determine table, column, operation, and affected database elements
        if parsed_migration:
            operation = parsed_migration.get("operation") or "UNKNOWN"
            table = parsed_migration.get("table", "")
            if operation == "RENAME_COLUMN":
                old_col = parsed_migration.get("old_column", "")
                new_col = parsed_migration.get("new_column", "")
                column = old_col
                affected_columns = [c for c in [old_col, new_col] if c]
                affected_tables = [table] if table else []
                database_object = f"{table}.{old_col}" if table and old_col else changed_object
            else:
                col = parsed_migration.get("column", "")
                column = col
                affected_columns = [col] if col else []
                affected_tables = [table] if table else []
                database_object = f"{table}.{col}" if table and col else changed_object
        else:
            operation = "DROP_COLUMN"
            parts = changed_object.split(".", 1) if "." in changed_object else [changed_object, ""]
            table = parts[0].strip()
            column = parts[1].strip() if len(parts) > 1 else ""
            affected_tables = [table] if table else []
            affected_columns = [column] if column else []
            database_object = changed_object

        # 2. Categorize dependencies into ORM models, Pydantic schemas, and FastAPI routes
        orm_deps = [d for d in dependencies if d.get("type") in ("orm_model", "ORM_MODEL")]
        schema_deps = [d for d in dependencies if d.get("type") in ("pydantic_schema", "PYDANTIC_SCHEMA")]
        route_deps = [d for d in dependencies if d.get("type") in ("fastapi_route", "FASTAPI_ROUTE")]

        affected_orm_models = list(dict.fromkeys(d["name"] for d in orm_deps if "name" in d))
        affected_pydantic_schemas = list(dict.fromkeys(d["name"] for d in schema_deps if "name" in d))
        affected_fastapi_routes = list(dict.fromkeys(d["name"] for d in route_deps if "name" in d))
        dependency_count = len(dependencies)

        # 3. Determine impact categories based on affected layers
        impact_categories: List[str] = ["DATABASE"]
        if affected_orm_models:
            impact_categories.append("ORM_MODEL")
        if affected_pydantic_schemas:
            impact_categories.append("PYDANTIC_SCHEMA")
        if affected_fastapi_routes:
            impact_categories.append("FASTAPI_ROUTE")

        # 4. Generate clear, human-readable explanation
        explanation = self._generate_explanation(
            operation=operation,
            table=table,
            column=column,
            database_object=database_object,
            parsed_migration=parsed_migration,
            dependency_count=dependency_count,
            affected_orm_models=affected_orm_models,
            affected_pydantic_schemas=affected_pydantic_schemas,
            affected_fastapi_routes=affected_fastapi_routes,
            data_type=data_type,
        )

        return {
            "operation": operation,
            "database_object": database_object,
            "changed_object": database_object,
            "table": table,
            "column": column,
            "affected_tables": affected_tables,
            "affected_columns": affected_columns,
            "affected_orm_models": affected_orm_models,
            "affected_pydantic_schemas": affected_pydantic_schemas,
            "affected_fastapi_routes": affected_fastapi_routes,
            "dependency_count": dependency_count,
            "impact_categories": impact_categories,
            "explanation": explanation,
            "dependencies": dependencies,
            "graph": graph,
            "migration": parsed_migration,
        }

    def _generate_explanation(
        self,
        operation: str,
        table: str,
        column: Optional[str],
        database_object: str,
        parsed_migration: Optional[Dict[str, Any]],
        dependency_count: int,
        affected_orm_models: List[str],
        affected_pydantic_schemas: List[str],
        affected_fastapi_routes: List[str],
        data_type: Optional[str] = None,
    ) -> str:
        """Construct a human-readable explanation explaining the impact of the change."""
        comp_parts: List[str] = []
        if affected_orm_models:
            comp_parts.append(f"ORM model(s): {', '.join(affected_orm_models)}")
        if affected_pydantic_schemas:
            comp_parts.append(f"Pydantic schema(s): {', '.join(affected_pydantic_schemas)}")
        if affected_fastapi_routes:
            comp_parts.append(f"API route(s): {', '.join(affected_fastapi_routes)}")
        components_summary = "; ".join(comp_parts) if comp_parts else "none"

        col_display = column or "column"

        if operation == "DROP_COLUMN":
            if dependency_count > 0:
                return (
                    f"Dropping column '{col_display}' from table '{table}' affects {dependency_count} application component(s): {components_summary}. "
                    f"Removing this column may cause database query failures in ORM models, missing field errors during schema validation, "
                    f"and broken API responses for dependent endpoints."
                )
            else:
                return (
                    f"Dropping column '{col_display}' from table '{table}' removes it from the database catalog. "
                    f"No application dependencies were detected in source code referencing '{database_object}'."
                )

        elif operation == "ADD_COLUMN":
            col_type = (parsed_migration.get("data_type") if parsed_migration else None) or data_type
            dt_str = f" of type '{col_type}'" if col_type else ""
            if dependency_count == 0:
                return (
                    f"Adding column '{col_display}'{dt_str} to table '{table}' is an additive database change. "
                    f"No application dependencies were detected in source code referencing '{database_object}'. "
                    f"Existing application models, schemas, and endpoints are unaffected. "
                    f"To utilize the new column, define the attribute in the corresponding ORM model and expose it in API schemas as needed."
                )
            else:
                return (
                    f"Adding column '{col_display}'{dt_str} to table '{table}' introduces a new database column. "
                    f"Detected {dependency_count} existing application component(s) referencing '{database_object}': {components_summary}. "
                    f"Verify that model definitions and validation schemas align with the new column definition."
                )

        elif operation == "ALTER_COLUMN":
            clause = parsed_migration.get("clause") if parsed_migration else None
            clause_str = f" with clause '{clause}'" if clause else ""
            if dependency_count > 0:
                return (
                    f"Altering column '{col_display}' in table '{table}'{clause_str} modifies the database column definition. "
                    f"This affects {dependency_count} application component(s): {components_summary}. "
                    f"Changes to data type or constraints may lead to type conversion errors, validation mismatches, "
                    f"or serialization failures in dependent models, schemas, and routes."
                )
            else:
                return (
                    f"Altering column '{col_display}' in table '{table}'{clause_str} modifies the database column definition. "
                    f"No application dependencies were detected in source code referencing '{database_object}'."
                )

        elif operation == "RENAME_COLUMN":
            old_c = (parsed_migration.get("old_column") if parsed_migration else None) or col_display
            new_c = (parsed_migration.get("new_column") if parsed_migration else None) or "new_column"
            if dependency_count > 0:
                return (
                    f"Renaming column '{old_c}' to '{new_c}' in table '{table}' changes the database column identifier. "
                    f"This affects {dependency_count} application component(s) currently referencing '{table}.{old_c}': {components_summary}. "
                    f"Without updating these models and schemas to reference '{new_c}' (or configuring an explicit column mapping), "
                    f"database queries and API serialization will fail at runtime."
                )
            else:
                return (
                    f"Renaming column '{old_c}' to '{new_c}' in table '{table}' modifies the database column identifier. "
                    f"No application dependencies were detected in source code referencing '{table}.{old_c}'."
                )

        else:
            if dependency_count > 0:
                return (
                    f"Operation '{operation}' on '{database_object}' affects {dependency_count} application component(s): "
                    f"{components_summary}."
                )
            else:
                return (
                    f"Operation '{operation}' on '{database_object}' modifies the database catalog. "
                    f"No application dependencies were detected in source code."
                )

    def analyze(
        self,
        sql: Optional[str] = None,
        changed_object: Optional[str] = None,
        source_dir: Optional[Path] = None,
        connection_url: Optional[str] = None,
        host: Optional[str] = None,
        port: Optional[int] = 5432,
        database: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        schema_name: str = "public",
        zip_bytes: Optional[bytes] = None,
        github_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        End-to-end execution of Impact Analysis.

        Steps:
        1. Parse migration SQL (or validate changed_object).
        2. Identify target database object.
        3. Verify against database catalog if credentials provided.
        4. Extract application AST dependencies.
        5. Build interactive dependency graph.
        6. Compute structured impact report.
        """
        temp_dir_to_clean: Optional[Path] = None
        target_source = source_dir or self.default_source_dir or get_active_source_dir()

        try:
            # Handle temporary source archives if supplied
            if zip_bytes:
                temp_dir_to_clean = Path(tempfile.mkdtemp(prefix="dbscope_impact_zip_"))
                validate_and_extract_zip(zip_bytes, temp_dir_to_clean)
                target_source = temp_dir_to_clean
            elif github_url:
                temp_dir_to_clean = Path(tempfile.mkdtemp(prefix="dbscope_impact_gh_"))
                fetch_github_repository(github_url, temp_dir_to_clean)
                target_source = temp_dir_to_clean

            # 1. Parse migration SQL or validate changed_object
            parsed_info: Optional[Dict[str, Any]] = None
            if sql is not None:
                if not isinstance(sql, str) or not sql.strip():
                    raise ValueError("SQL migration statement cannot be empty.")
                parsed_info = parse_migration(sql)
                if not parsed_info:
                    raise ValueError(
                        "Unsupported migration statement. DBScope currently supports "
                        "ALTER TABLE <table> DROP/ADD/ALTER/RENAME COLUMN."
                    )
                table_name = parsed_info.get("table") or "unknown_table"
                operation = parsed_info.get("operation")
                if operation == "RENAME_COLUMN":
                    column_name = parsed_info.get("old_column") or "unknown_col"
                else:
                    column_name = parsed_info.get("column") or "unknown_col"
                target_object = f"{table_name}.{column_name}"
            elif changed_object is not None:
                if not isinstance(changed_object, str) or not changed_object.strip():
                    raise ValueError("changed_object cannot be empty.")
                cleaned = changed_object.strip()
                if "." not in cleaned:
                    raise ValueError("changed_object must be in 'table.column' format (e.g., 'users.email').")
                parts = cleaned.split(".", 1)
                table_name = parts[0].strip()
                column_name = parts[1].strip()
                if not table_name or not column_name:
                    raise ValueError("Both table and column must be specified in 'table.column' format, e.g. 'users.email'.")
                target_object = cleaned
                operation = "DROP_COLUMN"
                parsed_info = {
                    "operation": "DROP_COLUMN",
                    "table": table_name,
                    "column": column_name,
                }
            else:
                raise ValueError("Either SQL migration statement or changed_object must be provided.")

            # 2. Database catalog inspection (read-only verification)
            table_exists = True
            column_exists = True
            data_type = parsed_info.get("data_type") if parsed_info else None
            db_name = database or "PostgreSQL"

            has_creds = bool((connection_url and connection_url.strip()) or (host and database))
            if has_creds:
                try:
                    meta_service = PostgresMetadataService(
                        connection_url=connection_url,
                        host=host,
                        port=port,
                        database=database,
                        username=username,
                        password=password,
                    )
                    metadata = meta_service.inspect_schema(schema_name=schema_name)
                    db_name = meta_service.masked_url.split("/")[-1].split("?")[0] or "PostgreSQL"
                    table_exists = False
                    column_exists = False
                    for tbl in metadata.get("tables", []):
                        if tbl["name"].lower() == table_name.lower():
                            table_exists = True
                            for col in tbl.get("columns", []):
                                if col["name"].lower() == column_name.lower():
                                    column_exists = True
                                    data_type = col.get("data_type")
                                    break
                            break
                except Exception:
                    # Keep safe defaults if database server is unavailable
                    pass

            # 3. Application AST dependency extraction
            extractor = DependencyExtractor(source_dir=target_source)
            dependencies_result = extractor.extract_dependencies(target_object)
            dependencies = dependencies_result.get("dependencies", [])

            # 4. Dependency graph construction
            graph_builder = GraphBuilder(db_type="PostgreSQL")
            graph = graph_builder.build_graph(
                changed_object=target_object,
                dependencies=dependencies,
                db_name=db_name,
                table_exists=table_exists,
                column_exists=column_exists,
                data_type=data_type,
            )

            # 5. Compute structured impact report
            impact_report = self.compute_impact(
                parsed_migration=parsed_info,
                changed_object=target_object,
                dependencies=dependencies,
                graph=graph,
                data_type=data_type,
            )

            return impact_report

        finally:
            if temp_dir_to_clean is not None:
                cleanup_source_dir(temp_dir_to_clean)
