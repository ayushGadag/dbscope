import type { RiskAssessment } from '../types';

export const mockRiskAssessment: RiskAssessment = {
  changed_object: 'users.email',
  riskLevel: 'HIGH',
  score: 88,
  factors: [
    'Database column is being permanently removed with physical data truncation.',
    'SQLAlchemy ORM model User defines active attribute email mapped to this column.',
    'Pydantic schema UserResponse exposes email in standard client payloads.',
    'FastAPI route GET /users/{id} declares UserResponse as public response_model contract.',
    'Downstream consumers and frontends expecting email will experience undefined attributes or 500 errors.',
  ],
  evidence: [
    {
      title: 'Destructive Schema Operation',
      detail: 'ALTER TABLE users DROP COLUMN email irreversibly purges all stored email data from disk in PostgreSQL.',
      category: 'Database Catalog',
    },
    {
      title: 'ORM Deserialization Fault',
      detail: 'Class User in models.py:17 queries table users. If email is dropped without updating Python models, query execution raises UndefinedColumn.',
      category: 'SQLAlchemy ORM',
    },
    {
      title: 'API Serialization Contract Violation',
      detail: 'UserResponse in schemas.py:12 requires or includes email. Pydantic validation fails or drops key, breaking public contract.',
      category: 'Pydantic / FastAPI',
    },
  ],
  recommendation: 'REVIEW REQUIRED — DO NOT EXECUTE DIRECTLY. Follow the 9-step safe migration plan to stage model deprecations before database execution.',
};
