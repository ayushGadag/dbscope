"""
Graph Builder service for DBScope.
Transforms database metadata and AST-extracted application dependencies
into a structured dependency graph dataset (nodes, edges, summary).
"""

from typing import Any, Dict, List, Optional


class GraphBuilder:
    """
    Constructs deterministic, structured dependency graphs mapping database objects
    to application source code references (SQLAlchemy models, Pydantic schemas, FastAPI routes).

    Guarantees:
    - Pure data transformation; does not execute code or connect to external networks.
    - Strictly deterministic matching and edge linking.
    - Produces normalized JSON-serializable node and edge datasets.
    """

    def __init__(self, db_type: str = "PostgreSQL"):
        self.db_type = db_type

    def build_graph(
        self,
        changed_object: str,
        dependencies: Optional[List[Dict[str, Any]]] = None,
        db_verified: bool = True,
        db_name: Optional[str] = None,
        table_exists: bool = True,
        column_exists: bool = True,
        data_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Build structured graph data (nodes & edges) for a target database object.

        Args:
            changed_object: String in 'table.column' format (e.g. 'users.email').
            dependencies: List of extracted dependency dictionaries (from DependencyExtractor).
            db_verified: Whether the database was verified.
            db_name: Optional database name.
            table_exists: Whether table was confirmed in catalog.
            column_exists: Whether column was confirmed in catalog.
            data_type: Data type of column if known.

        Returns:
            Dictionary matching:
            {
                "changed_object": "users.email",
                "nodes": [...],
                "edges": [...],
                "summary": {
                    "total_nodes": int,
                    "total_edges": int
                }
            }
        """
        if dependencies is None:
            dependencies = []

        parts = changed_object.split(".", 1) if "." in changed_object else [changed_object, "unknown"]
        table_name = parts[0].strip()
        column_name = parts[1].strip() if len(parts) > 1 else ""

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        # 1. Database Root Node
        db_id = "db:postgresql"
        nodes.append({
            "id": db_id,
            "label": self.db_type,
            "type": "DATABASE",
            "category": "Database",
            "source": "Catalog: information_schema",
            "relationship": "Root database catalog",
            "blastRadius": "Root",
            "accentColor": "#3b82f6",
            "x": 40.0,
            "y": 160.0,
            "metadata": {
                "db_type": self.db_type,
                "database": db_name or "PostgreSQL",
                "verified": db_verified,
            },
        })

        # 2. Table Node
        table_id = f"table:{table_name}"
        nodes.append({
            "id": table_id,
            "label": table_name,
            "type": "TABLE",
            "category": "Table",
            "source": f"public.{table_name}",
            "relationship": "Contains table schema",
            "blastRadius": "High",
            "accentColor": "#6366f1",
            "x": 260.0,
            "y": 160.0,
            "metadata": {
                "table": table_name,
                "schema": "public",
                "exists": table_exists,
            },
        })
        edges.append({
            "id": f"e:{db_id}->{table_id}",
            "source": db_id,
            "target": table_id,
            "relationship": "contains table",
        })

        # 3. Column Node
        col_id = f"column:{table_name}.{column_name}"
        nodes.append({
            "id": col_id,
            "label": changed_object,
            "type": "COLUMN",
            "category": "Column",
            "source": f"public.{table_name}.{column_name}",
            "relationship": "Target column being modified",
            "blastRadius": "High",
            "accentColor": "#d97706",
            "x": 480.0,
            "y": 160.0,
            "metadata": {
                "table": table_name,
                "column": column_name,
                "exists": column_exists,
                "data_type": data_type or "unknown",
            },
        })
        edges.append({
            "id": f"e:{table_id}->{col_id}",
            "source": table_id,
            "target": col_id,
            "relationship": "contains column",
        })

        # Filter dependencies by tier
        orm_deps = [d for d in dependencies if d.get("type") in ("orm_model", "ORM_MODEL")]
        schema_deps = [d for d in dependencies if d.get("type") in ("pydantic_schema", "PYDANTIC_SCHEMA")]
        route_deps = [d for d in dependencies if d.get("type") in ("fastapi_route", "FASTAPI_ROUTE")]

        # 4. ORM Model Nodes
        orm_node_ids: List[str] = []
        for i, dep in enumerate(orm_deps):
            node_id = f"orm:{dep['name']}"
            orm_node_ids.append(node_id)
            source_loc = f"{dep.get('file', '')}:{dep.get('line', '')}".rstrip(":")
            nodes.append({
                "id": node_id,
                "label": dep["name"],
                "type": "ORM_MODEL",
                "category": "ORM Model",
                "source": source_loc,
                "file": dep.get("file"),
                "line": dep.get("line"),
                "relationship": dep.get("relationship", "maps to ORM attribute"),
                "description": dep.get("description", f"SQLAlchemy attribute {dep['name']}"),
                "blastRadius": "High",
                "accentColor": "#a855f7",
                "x": 700.0,
                "y": 160.0 + (i * 90.0),
                "metadata": {
                    "component": dep["name"],
                    "file": dep.get("file"),
                    "line": dep.get("line"),
                },
            })
            edges.append({
                "id": f"e:{col_id}->{node_id}",
                "source": col_id,
                "target": node_id,
                "relationship": "maps to ORM attribute",
            })

        # 5. Pydantic Schema Nodes
        schema_node_ids: List[str] = []
        for i, dep in enumerate(schema_deps):
            node_id = f"schema:{dep['name']}"
            schema_node_ids.append(node_id)
            source_loc = f"{dep.get('file', '')}:{dep.get('line', '')}".rstrip(":")
            nodes.append({
                "id": node_id,
                "label": dep["name"],
                "type": "PYDANTIC_SCHEMA",
                "category": "Pydantic Schema",
                "source": source_loc,
                "file": dep.get("file"),
                "line": dep.get("line"),
                "relationship": dep.get("relationship", "represented by Pydantic field"),
                "description": dep.get("description", f"Pydantic schema field {dep['name']}"),
                "blastRadius": "High",
                "accentColor": "#10b981",
                "x": 920.0,
                "y": 160.0 + (i * 90.0),
                "metadata": {
                    "component": dep["name"],
                    "file": dep.get("file"),
                    "line": dep.get("line"),
                },
            })
            # Connect from first ORM model if available, else from column
            prev_source = orm_node_ids[0] if orm_node_ids else col_id
            edges.append({
                "id": f"e:{prev_source}->{node_id}",
                "source": prev_source,
                "target": node_id,
                "relationship": "represented by Pydantic field",
            })

        # 6. FastAPI Route Nodes
        for i, dep in enumerate(route_deps):
            node_id = f"route:{dep['name']}"
            source_loc = f"{dep.get('file', '')}:{dep.get('line', '')}".rstrip(":")
            nodes.append({
                "id": node_id,
                "label": dep["name"],
                "type": "FASTAPI_ROUTE",
                "category": "FastAPI Route",
                "source": source_loc,
                "file": dep.get("file"),
                "line": dep.get("line"),
                "relationship": dep.get("relationship", "used by FastAPI response model"),
                "description": dep.get("description", f"FastAPI route handler {dep['name']}"),
                "blastRadius": "High",
                "accentColor": "#e11d48",
                "x": 1140.0,
                "y": 160.0 + (i * 90.0),
                "metadata": {
                    "component": dep["name"],
                    "file": dep.get("file"),
                    "line": dep.get("line"),
                },
            })
            # Connect from schema node if available, else from ORM model or column
            prev_source = (
                schema_node_ids[0]
                if schema_node_ids
                else (orm_node_ids[0] if orm_node_ids else col_id)
            )
            edges.append({
                "id": f"e:{prev_source}->{node_id}",
                "source": prev_source,
                "target": node_id,
                "relationship": "used by FastAPI response model",
            })

        return {
            "changed_object": changed_object,
            "nodes": nodes,
            "edges": edges,
            "summary": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
            },
        }
