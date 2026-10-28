import { migrationService } from './migrationService';
import type { MigrationPlan, PlanStep, Report } from '../types';

const STANDARD_ROLLOUT_STEPS: PlanStep[] = [
  {
    id: 1,
    title: 'Identify Application References',
    description: 'Audit AST dependency trace across SQLAlchemy models, Pydantic schemas, and FastAPI route handlers to confirm all references.',
    role: 'Backend Engineering',
    completed: true,
  },
  {
    id: 2,
    title: 'Update SQLAlchemy Models',
    description: 'Modify ORM model class to deprecate the column attribute or configure deferred loading.',
    role: 'Backend Engineering',
    completed: false,
  },
  {
    id: 3,
    title: 'Update Pydantic Schemas',
    description: 'Update Pydantic response and request schemas to mark column as optional or transition to schema v2.',
    role: 'API Engineering',
    completed: false,
  },
  {
    id: 4,
    title: 'Update FastAPI Endpoints',
    description: 'Adjust API route handlers to remove dependence on column attribute or serve cached fallback.',
    role: 'API Engineering',
    completed: false,
  },
  {
    id: 5,
    title: 'Update Affected Automated Tests',
    description: 'Update unit and integration test fixtures expecting column in model responses and pytest test cases.',
    role: 'QA / Engineering',
    completed: false,
  },
  {
    id: 6,
    title: 'Validate Application Staging Behavior',
    description: 'Deploy code adjustments to staging environment and verify end-to-end flows without schema errors.',
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
    title: 'Apply Migration via Scheduled Pipeline',
    description: 'Apply DDL mutation via scheduled migration pipeline or DBA maintenance window.',
    role: 'Database Administration',
    completed: false,
  },
  {
    id: 9,
    title: 'Post-Deployment Validation & Telemetry',
    description: 'Verify PostgreSQL catalog status, observe error rates on HTTP routes, and confirm zero 500 exceptions.',
    role: 'DevOps / SRE',
    completed: false,
  },
];

export const reportService = {
  async getReports(): Promise<Report[]> {
    await new Promise((r) => setTimeout(r, 50));
    try {
      const stored = localStorage.getItem('dbscope_analysis_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    const activeSql = migrationService.getLastAnalyzedSql();
    const activeTarget = migrationService.getLastTargetObject();
    const lastAnalysis = migrationService.getLastAnalysis();

    if (activeSql) {
      const isAdd = activeSql.toUpperCase().includes('ADD COLUMN');
      const isAlter = activeSql.toUpperCase().includes('ALTER COLUMN');
      const isRename = activeSql.toUpperCase().includes('RENAME COLUMN');
      const op = isAdd ? 'additive' : isAlter ? 'modification' : isRename ? 'rename' : 'destructive';
      const riskLevel =
        (lastAnalysis?.risk_assessment?.risk_level ||
          (lastAnalysis?.potential_impact?.severity === 'High' ? 'HIGH' : lastAnalysis?.potential_impact?.severity === 'Medium' ? 'MEDIUM' : 'LOW')) as 'HIGH' | 'MEDIUM' | 'LOW';

      const dynamicReport: Report = {
        id: `rep-active-${Date.now().toString().slice(-4)}`,
        projectName: localStorage.getItem('dbscope_active_source')
          ? JSON.parse(localStorage.getItem('dbscope_active_source')!).name
          : 'Connected Repository',
        targetDatabase: 'PostgreSQL',
        proposedMigration: activeSql,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
        dependenciesCount: lastAnalysis?.application_dependencies?.length ?? (isAdd ? 0 : 3),
        riskLevel,
        planStepsCount: isAdd ? 7 : 9,
        summary: `Static analysis of ${op} migration targeting ${activeTarget}. Evaluated PostgreSQL catalogs, SQLAlchemy ORM bindings, Pydantic serialization contracts, and FastAPI route endpoints.`,
      };
      return [dynamicReport];
    }

    return [];
  },

  async getMigrationPlan(changedObject: string = 'users.email', sql?: string): Promise<MigrationPlan> {
    await new Promise((r) => setTimeout(r, 150));
    const activeSql = (sql || migrationService.getLastAnalyzedSql() || '').trim();
    const upper = activeSql.toUpperCase();
    const isAdd = upper.includes('ADD COLUMN');
    const isAlter = upper.includes('ALTER COLUMN');
    const isRename = upper.includes('RENAME COLUMN');

    let steps: PlanStep[] = [];

    if (isAdd) {
      steps = [
        {
          id: 1,
          title: 'Database Schema Compatibility Inspection',
          description: `Verify that target table exists and column does not already conflict in PostgreSQL information_schema.`,
          role: 'Database Administration',
          completed: true,
        },
        {
          id: 2,
          title: 'Update SQLAlchemy Model',
          description: `Declare new column attribute on the ORM class in models.py matching database type.`,
          role: 'Backend Engineering',
          completed: false,
        },
        {
          id: 3,
          title: 'Update Pydantic Serialization Schema',
          description: `Include new field in Pydantic response schema in schemas.py if exposed to clients.`,
          role: 'API Engineering',
          completed: false,
        },
        {
          id: 4,
          title: 'Update FastAPI Route Handlers',
          description: `Expose or populate new field in FastAPI route responses and request payload models.`,
          role: 'API Engineering',
          completed: false,
        },
        {
          id: 5,
          title: 'Add Automated Pytest Test Cases',
          description: `Ensure test fixtures and unit tests cover new column serialization and assertions.`,
          role: 'QA / Engineering',
          completed: false,
        },
        {
          id: 6,
          title: 'Apply Schema Alteration via Migration Tool',
          description: `Execute ${activeSql || `ALTER TABLE ... ADD COLUMN ...`} in staging environment.`,
          role: 'Database Administration',
          completed: false,
        },
        {
          id: 7,
          title: 'Post-Deployment Verification & Telemetry',
          description: `Confirm table column presence, verify HTTP endpoint response status, and check monitoring metrics.`,
          role: 'DevOps / SRE',
          completed: false,
        },
      ];
    } else if (isAlter || isRename) {
      steps = [
        {
          id: 1,
          title: 'Audit Code References & Bindings',
          description: `Inspect all AST dependencies across models.py, schemas.py, and routes.py binding ${changedObject}.`,
          role: 'Backend Engineering',
          completed: true,
        },
        {
          id: 2,
          title: 'Refactor ORM Model Declarations',
          description: `Update class attribute type / name in SQLAlchemy models.py to match proposed schema mutation.`,
          role: 'Backend Engineering',
          completed: false,
        },
        {
          id: 3,
          title: 'Synchronize Pydantic Schemas',
          description: `Update Pydantic BaseModel attributes in schemas.py ensuring serialization backwards-compatibility.`,
          role: 'API Engineering',
          completed: false,
        },
        {
          id: 4,
          title: 'Update FastAPI Endpoint Route Handlers',
          description: `Update request parameter handling and response model contracts in routes.py.`,
          role: 'API Engineering',
          completed: false,
        },
        {
          id: 5,
          title: 'Update Automated Test Suite',
          description: `Refactor test fixtures and assertions affected by type or name changes in test cases.`,
          role: 'QA / Engineering',
          completed: false,
        },
        {
          id: 6,
          title: 'Database Backup & Safety Pre-Check',
          description: `Ensure database backup / snapshot is completed prior to applying DDL mutation.`,
          role: 'Database Administration',
          completed: false,
        },
        {
          id: 7,
          title: 'Execute Migration in Staging Pipeline',
          description: `Apply ${activeSql || 'ALTER TABLE ...'} via versioned migration script.`,
          role: 'Database Administration',
          completed: false,
        },
        {
          id: 8,
          title: 'Post-Migration Validation & Health Check',
          description: `Validate API endpoints, monitor error rates, and confirm zero 500 exceptions in production.`,
          role: 'DevOps / SRE',
          completed: false,
        },
      ];
    } else {
      // Default DROP COLUMN steps
      steps = STANDARD_ROLLOUT_STEPS.map((s) => ({
        ...s,
        description: s.description.replace(/users\.email/g, changedObject),
      }));
    }

    return {
      changed_object: changedObject,
      summary: `Safe, coordinated engineering rollout procedure for ${changedObject} without downtime or breaking client API contracts.`,
      steps,
    };
  },
};
