"""
AST-based controlled dependency extractor for DBScope.
Traces database column changes through SQLAlchemy models, Pydantic schemas, and FastAPI routes.
Guarantees static, read-only analysis without executing source code.
"""

import ast
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple


def _get_call_name(node: ast.AST) -> str:
    """Helper to extract callable name from an AST Call node."""
    if isinstance(node, ast.Name):
        return node.id
    elif isinstance(node, ast.Attribute):
        return node.attr
    return ""


class DependencyExtractor:
    """
    Extracts application-level dependencies affected by database column changes.

    Analyzes:
    1. SQLAlchemy ORM models matching the altered table and column.
    2. Pydantic schemas referencing the column name.
    3. FastAPI route handlers whose response_model or inputs consume the affected schema.

    Safety:
    - Pure static AST parsing with Python's built-in `ast` module.
    - Never executes or imports the target source code.
    - Zero modifications to source files.
    """

    def __init__(self, sample_app_dir: Optional[Path] = None):
        if sample_app_dir is None:
            # Default to dbscope/sample_app directory
            self.sample_app_dir = Path(__file__).resolve().parent.parent / "sample_app"
        else:
            self.sample_app_dir = Path(sample_app_dir)

    def extract_dependencies(self, changed_object: str) -> Dict[str, Any]:
        """
        Extract code dependencies for a changed database column.

        Args:
            changed_object: A string formatted as 'table.column' (e.g. 'users.email').

        Returns:
            Structured dictionary listing all affected code components.
        """
        if not changed_object or not isinstance(changed_object, str):
            raise ValueError("changed_object cannot be empty.")

        cleaned = changed_object.strip()
        if not cleaned:
            raise ValueError("changed_object cannot be empty.")

        if "." not in cleaned:
            raise ValueError("changed_object must be in 'table.column' format (e.g., 'users.email').")

        parts = cleaned.split(".", 1)
        table_name = parts[0].strip()
        column_name = parts[1].strip()

        if not table_name or not column_name:
            raise ValueError("Both table and column must be specified in 'table.column' format, e.g. 'users.email'.")

        dependencies: List[Dict[str, Any]] = []

        # Step 1: Scan SQLAlchemy ORM models
        affected_models = self._scan_orm_models(table_name, column_name, dependencies)

        # Step 2: Scan Pydantic schemas
        affected_schemas = self._scan_pydantic_schemas(column_name, dependencies)

        # Step 3: Scan FastAPI route handlers
        self._scan_fastapi_routes(affected_schemas, affected_models, dependencies)

        return {
            "changed_object": f"{table_name}.{column_name}",
            "dependencies": dependencies,
        }

    def _scan_orm_models(
        self,
        table_name: str,
        column_name: str,
        dependencies: List[Dict[str, Any]],
    ) -> Set[str]:
        """Scan models.py for SQLAlchemy classes matching table_name and column_name."""
        affected_models: Set[str] = set()
        models_file = self.sample_app_dir / "models.py"

        if not models_file.exists():
            return affected_models

        content = models_file.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(models_file))

        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                # Check for __tablename__ assignment
                class_table: Optional[str] = None
                for item in node.body:
                    if isinstance(item, ast.Assign):
                        for target in item.targets:
                            if isinstance(target, ast.Name) and target.id == "__tablename__":
                                if isinstance(item.value, ast.Constant):
                                    class_table = str(item.value.value)

                if class_table == table_name:
                    # Now search for column attribute
                    for item in node.body:
                        if isinstance(item, ast.Assign):
                            for target in item.targets:
                                if isinstance(target, ast.Name) and target.id == column_name:
                                    # Verify it is a Column definition
                                    if isinstance(item.value, ast.Call):
                                        call_func = _get_call_name(item.value.func)
                                        if call_func in ("Column", "mapped_column"):
                                            affected_models.add(node.name)
                                            dependencies.append(
                                                {
                                                    "name": f"{node.name}.{column_name}",
                                                    "type": "orm_model",
                                                    "file": models_file.name,
                                                    "line": item.lineno,
                                                }
                                            )

        return affected_models

    def _scan_pydantic_schemas(
        self,
        column_name: str,
        dependencies: List[Dict[str, Any]],
    ) -> Set[str]:
        """Scan schemas.py for Pydantic models containing column_name field."""
        affected_schemas: Set[str] = set()
        schemas_file = self.sample_app_dir / "schemas.py"

        if not schemas_file.exists():
            return affected_schemas

        content = schemas_file.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(schemas_file))

        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                # Check if it has fields matching column_name
                for item in node.body:
                    matched = False
                    lineno = item.lineno
                    # Check typed attribute: `email: str`
                    if isinstance(item, ast.AnnAssign):
                        if isinstance(item.target, ast.Name) and item.target.id == column_name:
                            matched = True
                    # Check assignment: `email = Field(...)`
                    elif isinstance(item, ast.Assign):
                        for target in item.targets:
                            if isinstance(target, ast.Name) and target.id == column_name:
                                matched = True

                    if matched:
                        affected_schemas.add(node.name)
                        dependencies.append(
                            {
                                "name": f"{node.name}.{column_name}",
                                "type": "pydantic_schema",
                                "file": schemas_file.name,
                                "line": lineno,
                            }
                        )

        return affected_schemas

    def _scan_fastapi_routes(
        self,
        affected_schemas: Set[str],
        affected_models: Set[str],
        dependencies: List[Dict[str, Any]],
    ) -> None:
        """Scan routes.py for endpoints consuming affected schemas or models."""
        routes_file = self.sample_app_dir / "routes.py"
        if not routes_file.exists() or (not affected_schemas and not affected_models):
            return

        target_names = affected_schemas.union(affected_models)

        content = routes_file.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(routes_file))

        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                route_method: Optional[str] = None
                route_path: Optional[str] = None
                is_affected = False

                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call):
                        # Detect router.get(...) or app.post(...)
                        if isinstance(decorator.func, ast.Attribute):
                            method_name = decorator.func.attr.lower()
                            if method_name in ("get", "post", "put", "delete", "patch"):
                                route_method = method_name.upper()

                                # First arg is typically the route path
                                if decorator.args and isinstance(decorator.args[0], ast.Constant):
                                    route_path = str(decorator.args[0].value)

                                # Check response_model keyword arg
                                for kw in decorator.keywords:
                                    if kw.arg == "response_model":
                                        val_name = _get_call_name(kw.value)
                                        if val_name in target_names:
                                            is_affected = True

                # Also inspect parameters and return type annotations
                if not is_affected:
                    for arg in node.args.args:
                        if arg.annotation and _get_call_name(arg.annotation) in target_names:
                            is_affected = True

                if is_affected and route_method and route_path:
                    dependencies.append(
                        {
                            "name": f"{route_method} {route_path}",
                            "type": "fastapi_route",
                            "file": routes_file.name,
                            "line": node.lineno,
                        }
                    )
