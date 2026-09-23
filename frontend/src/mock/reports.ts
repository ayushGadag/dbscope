import type { MigrationPlan, Report } from '../types';

export const mockMigrationPlan: MigrationPlan = {
  changed_object: 'users.email',
  summary: 'Safe, coordinated engineering readiness procedure for removing users.email without downtime or breaking client API contracts.',
  steps: [
    {
      id: 1,
      title: 'Identify Application References',
      description: 'Audit AST dependency trace across SQLAlchemy models, Pydantic schemas, and FastAPI route handlers to confirm all references.',
      role: 'Backend Engineering',
      completed: true,
    },
    {
      id: 2,
      title: 'Update SQLAlchemy Model',
      description: 'Modify User class in models.py:17 to deprecate the email Column attribute or configure deferred loading.',
      role: 'Backend Engineering',
      completed: false,
    },
    {
      id: 3,
      title: 'Update Pydantic Schema',
      description: 'Update UserResponse schema in schemas.py:12 to mark email as optional or transition to API schema v2.',
      role: 'API Engineering',
      completed: false,
    },
    {
      id: 4,
      title: 'Update FastAPI Endpoint',
      description: 'Adjust GET /users/{id} handler in routes.py:12 to remove dependence on User.email or serve cached fallback.',
      role: 'API Engineering',
      completed: false,
    },
    {
      id: 5,
      title: 'Update Affected Automated Tests',
      description: 'Update unit and integration test fixtures expecting email in User model responses and pytest test cases.',
      role: 'QA / Engineering',
      completed: false,
    },
    {
      id: 6,
      title: 'Validate Application Staging Behavior',
      description: 'Deploy code adjustments to staging environment and verify end-to-end user fetching flows without schema errors.',
      role: 'DevOps / QA',
      completed: false,
    },
    {
      id: 7,
      title: 'Follow Database Backup & Maintenance Policy',
      description: 'Create PostgreSQL physical snapshot or pg_dump before applying schema alterations.',
      role: 'Database Administration',
      completed: false,
    },
    {
      id: 8,
      title: 'Apply Migration via Standard Deployment Process',
      description: 'Apply ALTER TABLE users DROP COLUMN email via scheduled migration pipeline or DBA maintenance window.',
      role: 'Database Administration',
      completed: false,
    },
    {
      id: 9,
      title: 'Post-Deployment Validation & Telemetry',
      description: 'Verify PostgreSQL catalog status, observe error rates on GET /users/{id}, and confirm zero 500 exceptions.',
      role: 'DevOps / SRE',
      completed: false,
    },
  ],
};

export const mockReports: Report[] = [
  {
    id: 'rep-ecommerce-001',
    projectName: 'E-Commerce Demo',
    targetDatabase: 'PostgreSQL',
    proposedMigration: 'ALTER TABLE users DROP COLUMN email;',
    timestamp: '2026-09-23 16:45 UTC',
    dependenciesCount: 3,
    riskLevel: 'HIGH',
    planStepsCount: 9,
    summary: 'Comprehensive analysis of destructive column drop on users.email. Detected 3 critical downstream code dependencies across SQLAlchemy ORM, Pydantic, and FastAPI. High risk classification assigned. Safe 9-step remediation plan generated.',
  },
];
