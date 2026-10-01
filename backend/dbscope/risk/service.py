"""
Dedicated Risk Assessment Service for DBScope.
Computes deterministic, explainable risk scores and recommended actions
based strictly on evidence produced by Impact Analysis.

Important Conceptual Boundary:
- Impact Analysis: "WHERE is the change affecting the system, and WHY is that component affected?"
- Risk Assessment: "HOW SERIOUS is that impact?"

Risk Model:
- Impact Factor: 1 to 5 (Severity of technical/architectural effect)
- Likelihood Factor: 1 to 5 (Probability of application failure/breakage)
- Formula: RiskScore = (Impact × Likelihood) / 2.5  (Range: 0.0 to 10.0)
- Risk Levels:
    0.0 – 2.9  → LOW
    3.0 – 5.9  → MEDIUM
    6.0 – 7.9  → HIGH
    8.0 – 10.0 → CRITICAL
- Recommended Actions:
    LOW       → ALLOW
    MEDIUM    → REVIEW
    HIGH      → REVIEW
    CRITICAL  → REVIEW
"""

from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dbscope.impact.service import ImpactAnalysisService


class RiskLevel(str, Enum):
    """Categorical risk level classification."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RecommendedAction(str, Enum):
    """Recommended workflow action for proposed migration."""
    ALLOW = "ALLOW"
    REVIEW = "REVIEW"


# Centralized threshold configuration
# Enables adjusting classification cutoffs without rewriting evaluation logic.
DEFAULT_RISK_THRESHOLDS: List[Tuple[float, RiskLevel, RecommendedAction]] = [
    (2.9, RiskLevel.LOW, RecommendedAction.ALLOW),
    (5.9, RiskLevel.MEDIUM, RecommendedAction.REVIEW),
    (7.9, RiskLevel.HIGH, RecommendedAction.REVIEW),
    (10.0, RiskLevel.CRITICAL, RecommendedAction.REVIEW),
]


class RiskAssessmentService:
    """
    Dedicated service for computing deterministic, explainable risk assessments.

    Responsibilities:
    - Ingest structured impact evidence (operation, affected layers, dependencies, routes).
    - Evaluate Impact Factor (1–5) based on operation destructiveness and blast radius.
    - Evaluate Likelihood Factor (1–5) based on dependency volume and public API exposure.
    - Calculate normalized Risk Score (0.0–10.0).
    - Map score to centralized Risk Level and Recommended Action.
    - Generate transparent reasons, factor breakdowns, and boundary limitations.
    """

    def __init__(
        self,
        default_source_dir: Optional[Path] = None,
        thresholds: Optional[List[Tuple[float, RiskLevel, RecommendedAction]]] = None,
    ):
        self.default_source_dir = default_source_dir
        self.thresholds = thresholds or DEFAULT_RISK_THRESHOLDS
        self.impact_service = ImpactAnalysisService(default_source_dir=default_source_dir)

    def determine_risk_level_and_action(
        self, score: float
    ) -> Tuple[RiskLevel, RecommendedAction]:
        """
        Map a numeric risk score (0.0 to 10.0) to RiskLevel and RecommendedAction
        using centralized thresholds.
        """
        for upper_bound, level, action in self.thresholds:
            if score <= upper_bound:
                return level, action
        return RiskLevel.CRITICAL, RecommendedAction.REVIEW

    def compute_impact_score(
        self, impact_data: Dict[str, Any]
    ) -> Tuple[int, List[str]]:
        """
        Compute the Impact factor (1–5) representing:
        "How serious is the technical/application effect of this database change?"

        Deterministic Rules:
        1. Operation Baseline:
           - DROP_COLUMN: Base = 3 if dependencies > 0, else 2 (permanent catalog removal).
           - RENAME_COLUMN: Base = 3 if dependencies > 0 (breaks existing queries), else 2.
           - ALTER_COLUMN: Base = 2 if dependencies > 0 (type/constraint shift), else 1.
           - ADD_COLUMN: Base = 2 if dependencies > 0, else 1 (additive non-breaking change).
           - UNKNOWN / OTHER: Base = 2.
        2. Layer Spread Modifier:
           - If 4 or more layers affected (DATABASE, ORM_MODEL, PYDANTIC_SCHEMA, FASTAPI_ROUTE): +1
        3. Blast Radius Modifier:
           - If dependency_count >= 6: +2
           - Else if dependency_count >= 3: +1
           - Else: +0
        4. Clamping:
           - Score is clamped between 1 and 5.

        Returns:
            Tuple of (impact_score, factors_list)
        """
        operation = (impact_data.get("operation") or "UNKNOWN").upper()
        dep_count = int(impact_data.get("dependency_count") or 0)
        layers = impact_data.get("impact_categories") or []
        num_layers = len(layers)

        factors: List[str] = []

        # 1. Base score by operation & presence of dependencies
        if operation == "DROP_COLUMN":
            if dep_count > 0:
                base = 3
                factors.append("Destructive operation: DROP_COLUMN permanently deletes database column and data with active application dependencies (Base Impact: 3).")
            else:
                base = 2
                factors.append("Destructive operation: DROP_COLUMN permanently removes column from database catalog, but has zero application references (Base Impact: 2).")
        elif operation == "RENAME_COLUMN":
            if dep_count > 0:
                base = 3
                factors.append("Identifier modification: RENAME_COLUMN changes column name, breaking queries referencing the old identifier (Base Impact: 3).")
            else:
                base = 2
                factors.append("Identifier modification: RENAME_COLUMN modifies column name with no detected application references (Base Impact: 2).")
        elif operation == "ALTER_COLUMN":
            if dep_count > 0:
                base = 2
                factors.append("Schema modification: ALTER_COLUMN alters column definition, risking type conversion or constraint errors (Base Impact: 2).")
            else:
                base = 1
                factors.append("Schema modification: ALTER_COLUMN modifies column definition with no detected application references (Base Impact: 1).")
        elif operation == "ADD_COLUMN":
            if dep_count > 0:
                base = 2
                factors.append("Additive operation: ADD_COLUMN introduces new column where application components already reference the name (Base Impact: 2).")
            else:
                base = 1
                factors.append("Non-destructive operation: ADD_COLUMN introduces a new database column without modifying existing data (Base Impact: 1).")
        else:
            base = 2
            factors.append(f"Operation: '{operation}' (Base Impact: 2).")

        # 2. Layer Spread Modifier
        layer_mod = 0
        if dep_count > 0 and num_layers >= 4:
            layer_mod = 1
            factors.append(f"Deep layer penetration: Change cascades across all {num_layers} system layers ({', '.join(layers)}) (+1 Impact).")

        # 3. Blast Radius Modifier
        blast_mod = 0
        if dep_count >= 6:
            blast_mod = 2
            factors.append(f"Extensive blast radius: {dep_count} application components affected (+2 Impact).")
        elif dep_count >= 3:
            blast_mod = 1
            factors.append(f"Broad blast radius: {dep_count} application components affected (+1 Impact).")
        elif dep_count > 0:
            factors.append(f"Limited blast radius: {dep_count} application component(s) affected (+0 Impact).")
        else:
            factors.append("Zero application dependencies detected (+0 Impact).")

        raw_score = base + layer_mod + blast_mod
        impact_score = max(1, min(5, raw_score))
        return impact_score, factors

    def compute_likelihood_score(
        self, impact_data: Dict[str, Any]
    ) -> Tuple[int, List[str]]:
        """
        Compute the Likelihood factor (1–5) representing:
        "How likely is this change to cause application problems?"

        Deterministic Rules:
        1. Dependency Presence & Volume Baseline:
           - 0 dependencies: Base = 1 (no application references detected in AST).
           - 1 dependency: Base = 2 (localized component reference).
           - 2–3 dependencies: Base = 3 (multiple component references).
           - 4–5 dependencies: Base = 4 (high component concentration).
           - 6+ dependencies: Base = 5 (widespread component references).
        2. API Route Exposure Modifier:
           - If dependency_count > 0 and FastAPI routes are affected: +1
             (Direct risk to public HTTP endpoint contracts and user-facing 500 errors).
        3. Clamping:
           - Score is clamped between 1 and 5.
           - If 0 dependencies, Likelihood is strictly 1.

        Returns:
            Tuple of (likelihood_score, factors_list)
        """
        dep_count = int(impact_data.get("dependency_count") or 0)
        route_deps = impact_data.get("affected_fastapi_routes") or []
        has_routes = bool(route_deps or "FASTAPI_ROUTE" in (impact_data.get("impact_categories") or []))

        factors: List[str] = []

        if dep_count == 0:
            factors.append("Zero detected application dependencies: minimal likelihood of application breakage (Likelihood: 1).")
            return 1, factors

        # 1. Base likelihood from dependency count
        if dep_count == 1:
            base = 2
            factors.append(f"Single application component references this column (Base Likelihood: 2).")
        elif 2 <= dep_count <= 3:
            base = 3
            factors.append(f"Multiple application components ({dep_count}) reference this column (Base Likelihood: 3).")
        elif 4 <= dep_count <= 5:
            base = 4
            factors.append(f"High concentration of application dependencies ({dep_count}) reference this column (Base Likelihood: 4).")
        else:
            base = 5
            factors.append(f"Widespread application dependencies ({dep_count}) reference this column (Base Likelihood: 5).")

        # 2. Exposure modifier (API routes)
        route_mod = 0
        if has_routes:
            route_mod = 1
            factors.append(f"Public API exposure: {len(route_deps)} FastAPI route(s) affected ({', '.join(route_deps)}), increasing likelihood of runtime 500 errors (+1 Likelihood).")

        raw_score = base + route_mod
        likelihood_score = max(1, min(5, raw_score))
        return likelihood_score, factors

    def assess_risk(self, impact_report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Pure transformation step that evaluates an existing Impact Analysis report
        and produces a complete, explainable Risk Assessment report.

        Args:
            impact_report: Structured dictionary output from ImpactAnalysisService.

        Returns:
            Structured risk assessment dictionary matching RiskAssessmentResponse schema.

        Raises:
            ValueError: If impact_report is missing required fields or invalid.
        """
        if not impact_report or not isinstance(impact_report, dict):
            raise ValueError("Invalid impact analysis report: payload must be a non-empty dictionary.")

        # Validate essential impact information
        operation = impact_report.get("operation")
        database_object = impact_report.get("database_object") or impact_report.get("changed_object")
        table = impact_report.get("table")

        if not operation or not database_object:
            raise ValueError(
                "Invalid impact analysis report: missing required fields 'operation' or 'database_object'."
            )

        column = impact_report.get("column")
        dep_count = int(impact_report.get("dependency_count") or 0)
        affected_orm = impact_report.get("affected_orm_models") or []
        affected_schemas = impact_report.get("affected_pydantic_schemas") or []
        affected_routes = impact_report.get("affected_fastapi_routes") or []
        affected_layers = impact_report.get("impact_categories") or ["DATABASE"]

        # Aggregate affected application components
        affected_components: List[str] = []
        for comp in affected_orm:
            if comp not in affected_components:
                affected_components.append(comp)
        for comp in affected_schemas:
            if comp not in affected_components:
                affected_components.append(comp)
        for comp in affected_routes:
            if comp not in affected_components:
                affected_components.append(comp)

        # 1. Compute Impact Score (1 to 5)
        impact_score, impact_factors = self.compute_impact_score(impact_report)

        # 2. Compute Likelihood Score (1 to 5)
        likelihood_score, likelihood_factors = self.compute_likelihood_score(impact_report)

        # 3. Calculate Risk Score out of 10: (Impact × Likelihood) / 2.5
        risk_score = round((impact_score * likelihood_score) / 2.5, 1)

        # 4. Map to Risk Level & Recommended Action
        risk_level, recommended_action = self.determine_risk_level_and_action(risk_score)

        # 5. Build human-readable explainability reasons
        reasons = self._generate_reasons(
            operation=operation,
            database_object=database_object,
            table=table or "unknown",
            column=column,
            dep_count=dep_count,
            affected_components=affected_components,
            affected_layers=affected_layers,
            affected_routes=affected_routes,
            impact_score=impact_score,
            likelihood_score=likelihood_score,
            risk_score=risk_score,
            risk_level=risk_level,
            recommended_action=recommended_action,
        )

        # 6. Document transparent prototype limitations
        limitations = [
            "PostgreSQL catalog inspection is strictly read-only; migration SQL is never executed against the database.",
            "Static AST dependency analysis evaluates explicit Python references; dynamic SQL strings and uninspected external services are not tracked.",
            "Runtime traffic metrics, table row volumes, and database lock durations are not currently evaluated.",
        ]

        return {
            "risk_score": risk_score,
            "impact_score": impact_score,
            "likelihood_score": likelihood_score,
            "risk_level": risk_level.value,
            "recommended_action": recommended_action.value,
            "affected_components": affected_components,
            "affected_layers": affected_layers,
            "reasons": reasons,
            "operation": operation,
            "database_object": database_object,
            "table": table or "",
            "column": column,
            "dependency_count": dep_count,
            "impact_factors": impact_factors,
            "likelihood_factors": likelihood_factors,
            "limitations": limitations,
            "impact_analysis": impact_report,
        }

    def _generate_reasons(
        self,
        operation: str,
        database_object: str,
        table: str,
        column: Optional[str],
        dep_count: int,
        affected_components: List[str],
        affected_layers: List[str],
        affected_routes: List[str],
        impact_score: int,
        likelihood_score: int,
        risk_score: float,
        risk_level: RiskLevel,
        recommended_action: RecommendedAction,
    ) -> List[str]:
        """Generate concise, evidence-grounded explanatory justifications."""
        reasons: List[str] = []
        col_disp = column or database_object

        # Reason 1: Operation effect
        if operation == "DROP_COLUMN":
            if dep_count > 0:
                reasons.append(
                    f"Destructive operation: Column '{col_disp}' is being removed from table '{table}', permanently deleting the database object and stored data."
                )
            else:
                reasons.append(
                    f"Destructive operation: Column '{col_disp}' is being removed from table '{table}', but no application code references were detected."
                )
        elif operation == "RENAME_COLUMN":
            if dep_count > 0:
                reasons.append(
                    f"Identifier modification: Column '{col_disp}' in table '{table}' is being renamed, which invalidates existing queries referencing the original name."
                )
            else:
                reasons.append(
                    f"Identifier modification: Column '{col_disp}' in table '{table}' is being renamed with zero detected application dependencies."
                )
        elif operation == "ALTER_COLUMN":
            if dep_count > 0:
                reasons.append(
                    f"Schema modification: Column '{col_disp}' definition is being altered, which may introduce type mismatches or serialization issues."
                )
            else:
                reasons.append(
                    f"Schema modification: Column '{col_disp}' in table '{table}' is being altered with no detected application dependencies."
                )
        elif operation == "ADD_COLUMN":
            if dep_count > 0:
                reasons.append(
                    f"Additive change: Introducing column '{col_disp}' to table '{table}' touches existing application components."
                )
            else:
                reasons.append(
                    f"Non-destructive operation: Introducing column '{col_disp}' to table '{table}' is purely additive and modifies no existing data."
                )
        else:
            reasons.append(f"Operation '{operation}' modifies database object '{database_object}'.")

        # Reason 2: Dependency blast radius
        if dep_count == 0:
            reasons.append("Zero application components depend on this column in source code.")
        elif dep_count == 1:
            reasons.append(f"Single application component depends on this column: {affected_components[0]}.")
        else:
            reasons.append(
                f"{dep_count} application component(s) depend on this column: {', '.join(affected_components)}."
            )

        # Reason 3: Layer penetration and API exposure
        if affected_routes:
            reasons.append(
                f"Direct API exposure: {len(affected_routes)} public endpoint(s) ({', '.join(affected_routes)}) are affected, presenting immediate risk of runtime HTTP errors."
            )
        elif len(affected_layers) > 1:
            reasons.append(
                f"Multi-layer impact: Change affects {len(affected_layers)} layers ({', '.join(affected_layers)})."
            )
        else:
            reasons.append("Change is confined to the Database catalog layer.")

        # Reason 4: Final score and action recommendation
        reasons.append(
            f"Risk Score: {risk_score}/10 ({risk_level.value}) derived from Impact={impact_score}/5 and Likelihood={likelihood_score}/5. Recommended action: {recommended_action.value}."
        )

        return reasons

    def analyze(
        self,
        sql: Optional[str] = None,
        changed_object: Optional[str] = None,
        impact_report: Optional[Dict[str, Any]] = None,
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
        End-to-end execution of Risk Assessment.

        Flow:
        1. If pre-computed impact_report is provided, evaluate it directly.
        2. Otherwise, run ImpactAnalysisService to obtain the structured impact report.
        3. Pass impact report into pure assess_risk evaluation.
        4. Return structured risk assessment.
        """
        # Case 1: Pre-computed impact report supplied
        if impact_report is not None:
            return self.assess_risk(impact_report)

        # Case 2: Run Impact Analysis pipeline first
        target_dir = source_dir or self.default_source_dir
        impact_data = self.impact_service.analyze(
            sql=sql,
            changed_object=changed_object,
            source_dir=target_dir,
            connection_url=connection_url,
            host=host,
            port=port,
            database=database,
            username=username,
            password=password,
            schema_name=schema_name,
            zip_bytes=zip_bytes,
            github_url=github_url,
        )

        # Assess risk on the resulting impact data
        return self.assess_risk(impact_data)
