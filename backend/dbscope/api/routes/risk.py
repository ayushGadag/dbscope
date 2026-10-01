"""
FastAPI route for DBScope Risk Assessment.
Provides the POST /api/risk/analyze endpoint.
"""

from fastapi import APIRouter, HTTPException, status

from dbscope.api.schemas.risk import RiskAssessmentRequest, RiskAssessmentResponse
from dbscope.migration_parser import parse_migration
from dbscope.risk.service import RiskAssessmentService

router = APIRouter(prefix="/api/risk", tags=["Risk Assessment"])


@router.post(
    "/analyze",
    response_model=RiskAssessmentResponse,
    responses={
        200: {"description": "Risk assessment completed successfully"},
        400: {"description": "Invalid input format or missing required parameters"},
        422: {"description": "Unsupported SQL migration operation"},
    },
)
def analyze_risk(request: RiskAssessmentRequest):
    """
    Perform database change risk assessment:
    - Answers: 'HOW SERIOUS is the impact of this database change?'
    - Evaluates Impact (1–5) and Likelihood (1–5) deterministically based on Impact Analysis evidence.
    - Calculates overall Risk Score out of 10: (Impact × Likelihood) / 2.5.
    - Determines categorical Risk Level: LOW, MEDIUM, HIGH, CRITICAL.
    - Provides Recommended Action: ALLOW (for LOW) or REVIEW (for MEDIUM, HIGH, CRITICAL).
    - Provides human-readable, evidence-based explainability reasons.

    Safety:
    - Pure static analysis; never executes migration SQL.
    - Does not modify any database objects.
    - Recommended action is informational; migration execution is not triggered.
    """
    sql = request.sql or request.migration
    changed_object = request.changed_object
    impact_report = request.impact_report

    # Input validation
    if request.sql is not None and not request.sql.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL migration statement cannot be empty.",
        )

    if request.migration is not None and not request.migration.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SQL migration statement cannot be empty.",
        )

    if not sql and not changed_object and impact_report is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either 'sql', 'changed_object', or 'impact_report' must be provided.",
        )

    # Validate SQL migration syntax if SQL is supplied
    if sql is not None:
        parsed = parse_migration(sql)
        if parsed is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Unsupported migration statement. DBScope currently supports ALTER TABLE <table> DROP/ADD/ALTER/RENAME COLUMN.",
            )

    service = RiskAssessmentService()
    try:
        result = service.analyze(
            sql=sql,
            changed_object=changed_object,
            impact_report=impact_report,
            connection_url=request.connection_url,
            host=request.host,
            port=request.port,
            database=request.database,
            username=request.username,
            password=request.password,
            schema_name=request.schema_name or "public",
            github_url=request.github_url,
        )
        return result
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )
