"""
AST-based controlled dependency extractor for DBScope.
Traces database column changes through SQLAlchemy models, Pydantic schemas, and FastAPI routes.
Guarantees static, read-only analysis without executing source code.
"""

import ast
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from dbscope.dependencies.graph_builder import GraphBuilder
from dbscope.source.connector import collect_python_files, get_active_source_dir


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

    def __init__(
        self,
        sample_app_dir: Optional[Path] = None,
        source_dir: Optional[Path] = None,
    ):
        if source_dir is not None:
            self.source_dir = Path(source_dir)
        elif sample_app_dir is not None:
            self.source_dir = Path(sample_app_dir)
        else:
            self.source_dir = Path(__file__).resolve().parent.parent / "sample_app"

        # Retain self.sample_app_dir for full backwards compatibility
        self.sample_app_dir = self.source_dir

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

    def _format_path(self, path: Path) -> str:
        """Format path relative to source directory for clean reporting."""
        if path.parent == self.source_dir:
            return path.name
        try:
            return str(path.relative_to(self.source_dir)).replace("\\", "/")
        except ValueError:
            return path.name

    def _get_target_files(self, preferred_name: str) -> List[Path]:
        """Return preferred file if it exists, along with all scanned Python files."""
        preferred = self.source_dir / preferred_name
        all_py = collect_python_files(self.source_dir)
        files: List[Path] = []
        if preferred.exists():
            files.append(preferred)
        for f in all_py:
            if f not in files:
                files.append(f)
        return files

    def _is_orm_class(self, node: ast.ClassDef) -> bool:
        """Check if an AST ClassDef is an ORM model."""
        for item in node.body:
            if isinstance(item, ast.Assign):
                for t in item.targets:
                    if isinstance(t, ast.Name) and t.id == "__tablename__":
                        return True
        for base in node.bases:
            bname = _get_call_name(base)
            if bname in ("Base", "DeclarativeBase") and bname != "BaseModel":
                return True
        return False

    def _is_pydantic_class(self, node: ast.ClassDef, fpath: Path) -> bool:
        """Check if an AST ClassDef is a Pydantic schema."""
        for base in node.bases:
            bname = _get_call_name(base)
            if bname in ("BaseModel", "Schema") or "BaseModel" in bname:
                return True
        if "schema" in fpath.name.lower():
            # In a schema file, ensure it's not an ORM model
            return not self._is_orm_class(node)
        return False

    def _scan_orm_models(
        self,
        table_name: str,
        column_name: str,
        dependencies: List[Dict[str, Any]],
    ) -> Set[str]:
        """Scan Python source files for SQLAlchemy classes matching table_name and column_name."""
        affected_models: Set[str] = set()
        files = self._get_target_files("models.py")

        for fpath in files:
            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
                tree = ast.parse(content, filename=str(fpath))
            except Exception:
                continue

            for node in tree.body:
                if isinstance(node, ast.ClassDef) and self._is_orm_class(node):
                    # Check for __tablename__ assignment
                    class_table: Optional[str] = None
                    for item in node.body:
                        if isinstance(item, ast.Assign):
                            for target in item.targets:
                                if isinstance(target, ast.Name) and target.id == "__tablename__":
                                    if isinstance(item.value, ast.Constant):
                                        class_table = str(item.value.value)

                    # Match table_name or convention (e.g. users -> User)
                    table_matches = class_table == table_name
                    if not table_matches and class_table is None:
                        table_matches = node.name.lower() in (table_name.lower(), table_name.lower().rstrip("s"))

                    if table_matches:
                        for item in node.body:
                            col_matched = False
                            lineno = item.lineno

                            if isinstance(item, ast.Assign):
                                for target in item.targets:
                                    if isinstance(target, ast.Name) and target.id == column_name:
                                        if isinstance(item.value, ast.Call):
                                            call_func = _get_call_name(item.value.func)
                                            if call_func in ("Column", "mapped_column"):
                                                col_matched = True
                                        else:
                                            col_matched = True

                            elif isinstance(item, ast.AnnAssign):
                                if isinstance(item.target, ast.Name) and item.target.id == column_name:
                                    col_matched = True

                            if col_matched:
                                affected_models.add(node.name)
                                dependencies.append(
                                    {
                                        "name": f"{node.name}.{column_name}",
                                        "type": "orm_model",
                                        "file": self._format_path(fpath),
                                        "line": lineno,
                                        "relationship": f"Maps to {table_name}.{column_name} column",
                                        "description": f"SQLAlchemy Column attribute defined on class {node.name}",
                                    }
                                )

        return affected_models

    def _scan_pydantic_schemas(
        self,
        column_name: str,
        dependencies: List[Dict[str, Any]],
    ) -> Set[str]:
        """Scan Python source files for Pydantic models containing column_name field."""
        affected_schemas: Set[str] = set()
        files = self._get_target_files("schemas.py")

        for fpath in files:
            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
                tree = ast.parse(content, filename=str(fpath))
            except Exception:
                continue

            for node in tree.body:
                if isinstance(node, ast.ClassDef) and self._is_pydantic_class(node, fpath):
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
                                    "file": self._format_path(fpath),
                                    "line": lineno,
                                    "relationship": f"Serializes {column_name} attribute",
                                    "description": f"Pydantic schema attribute used for serialization in {node.name}",
                                }
                            )

        return affected_schemas

    def _scan_fastapi_routes(
        self,
        affected_schemas: Set[str],
        affected_models: Set[str],
        dependencies: List[Dict[str, Any]],
    ) -> None:
        """Scan Python source files for endpoints consuming affected schemas or models."""
        target_names = affected_schemas.union(affected_models)
        if not target_names:
            return

        files = self._get_target_files("routes.py")

        for fpath in files:
            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
                tree = ast.parse(content, filename=str(fpath))
            except Exception:
                continue

            for node in tree.body:
                if isinstance(node, ast.FunctionDef):
                    route_method: Optional[str] = None
                    route_path: Optional[str] = None
                    is_affected = False
                    matched_target: Optional[str] = None

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
                                                matched_target = val_name

                    # Also inspect parameters and return type annotations
                    if not is_affected:
                        for arg in node.args.args:
                            if arg.annotation:
                                ann_name = _get_call_name(arg.annotation)
                                if ann_name in target_names:
                                    is_affected = True
                                    matched_target = ann_name

                    if is_affected and route_method and route_path:
                        dependencies.append(
                            {
                                "name": f"{route_method} {route_path}",
                                "type": "fastapi_route",
                                "file": self._format_path(fpath),
                                "line": node.lineno,
                                "relationship": f"Declares response_model={matched_target}" if matched_target else "Consumes affected schema",
                                "description": f"FastAPI route handler declaring response_model={matched_target}" if matched_target else "FastAPI route handler",
                            }
                        )

    def build_dependency_graph(
        self,
        changed_object: str,
        dependencies: Optional[List[Dict[str, Any]]] = None,
        db_type: str = "PostgreSQL",
    ) -> Dict[str, Any]:
        """
        Build a structured graph representation (nodes & edges) mapping database objects
        to application code components.
        """
        if dependencies is None:
            extracted = self.extract_dependencies(changed_object)
            dependencies = extracted["dependencies"]

        builder = GraphBuilder(db_type=db_type)
        return builder.build_graph(changed_object=changed_object, dependencies=dependencies)

