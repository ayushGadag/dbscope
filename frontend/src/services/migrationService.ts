import { requestJson } from './api';
import { mockAnalysisResults, mockMigrations } from '../mock/migrations';
import { mockDependencyGraph } from '../mock/dependencies';
import type { DatabaseConfig, Migration, MigrationAnalysis, UnifiedAnalysisResult } from '../types';

export const migrationService = {
  async getMigrations(): Promise<Migration[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockMigrations];
  },

  /**
   * Analyze SQL migration statement.
   * Calls real backend POST /api/migrations/analyze with fallback to mock parser if offline.
   */
  async analyzeMigration(sql: string): Promise<MigrationAnalysis> {
    const trimmed = sql.trim();
    if (!trimmed) {
      return {
        operation: null,
        status: 'Invalid',
        message: 'SQL statement cannot be empty.',
      };
    }

    const res = await requestJson<{
      operation: 'DROP_COLUMN' | 'ADD_COLUMN' | 'ALTER_COLUMN' | 'RENAME_COLUMN' | null;
      table?: string;
      column?: string;
      data_type?: string;
      clause?: string;
      new_type?: string;
      old_column?: string;
      new_column?: string;
      message?: string;
    }>('/api/migrations/analyze', {
      method: 'POST',
      body: JSON.stringify({ sql: trimmed }),
    });

    if (res.ok && res.data && res.data.operation) {
      const d = res.data;
      const targetCol = d.column || d.old_column || '';
      return {
        operation: d.operation,
        table: d.table,
        column: targetCol,
        data_type: d.data_type,
        clause: d.clause,
        new_type: d.new_type,
        old_column: d.old_column,
        new_column: d.new_column,
        changed_object: d.table && targetCol ? `${d.table}.${targetCol}` : undefined,
        status: 'Detected',
        message: d.message || `${d.operation} detected on table '${d.table}'.`,
      };
    }

    if (!res.isBackendOffline && res.status === 422) {
      return {
        operation: null,
        status: 'Unsupported',
        message: res.error || 'Unsupported migration operation.',
      };
    }

    // Fallback: mock heuristics for offline/demo operation
    if (mockAnalysisResults[trimmed]) {
      return mockAnalysisResults[trimmed];
    }

    const upper = trimmed.toUpperCase();
    if (upper.includes('DROP COLUMN')) {
      const match = trimmed.match(/ALTER\s+TABLE\s+([^\s]+)\s+DROP\s+COLUMN\s+([^\s;]+)/i);
      const table = match ? match[1].replace(/[`"']/g, '') : 'users';
      const col = match ? match[2].replace(/[`"']/g, '') : 'column_name';
      return {
        operation: 'DROP_COLUMN',
        table,
        column: col,
        changed_object: `${table}.${col}`,
        status: 'Detected',
        message: `Destructive DROP COLUMN operation detected on table '${table}' (Demo Mode).`,
      };
    } else if (upper.includes('ADD COLUMN')) {
      const match = trimmed.match(/ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+COLUMN\s+([^\s]+)\s+([^;]+)/i);
      const table = match ? match[1].replace(/[`"']/g, '') : 'users';
      const col = match ? match[2].replace(/[`"']/g, '') : 'new_col';
      const dataType = match ? match[3].trim() : 'VARCHAR';
      return {
        operation: 'ADD_COLUMN',
        table,
        column: col,
        data_type: dataType,
        changed_object: `${table}.${col}`,
        status: 'Detected',
        message: `Additive ADD COLUMN operation detected on table '${table}' (Demo Mode).`,
      };
    } else if (upper.includes('ALTER COLUMN')) {
      const match = trimmed.match(/ALTER\s+TABLE\s+([^\s]+)\s+ALTER\s+COLUMN\s+([^\s]+)\s+([^;]+)/i);
      const table = match ? match[1].replace(/[`"']/g, '') : 'users';
      const col = match ? match[2].replace(/[`"']/g, '') : 'col';
      return {
        operation: 'ALTER_COLUMN',
        table,
        column: col,
        clause: match ? match[3].trim() : 'TYPE BIGINT',
        changed_object: `${table}.${col}`,
        status: 'Detected',
        message: `Modification of column '${col}' on table '${table}' (Demo Mode).`,
      };
    } else if (upper.includes('RENAME COLUMN')) {
      const match = trimmed.match(/ALTER\s+TABLE\s+([^\s]+)\s+RENAME\s+COLUMN\s+([^\s]+)\s+TO\s+([^\s;]+)/i);
      const table = match ? match[1].replace(/[`"']/g, '') : 'users';
      return {
        operation: 'RENAME_COLUMN',
        table,
        old_column: match ? match[2] : 'old_col',
        new_column: match ? match[3] : 'new_col',
        changed_object: `${table}.${match ? match[2] : 'col'}`,
        status: 'Detected',
        message: `Column rename operation detected on table '${table}' (Demo Mode).`,
      };
    }

    return {
      operation: null,
      status: 'Unsupported',
      message: 'Unsupported migration operation. Supported in prototype: DROP COLUMN, ADD COLUMN, ALTER COLUMN, RENAME COLUMN.',
    };
  },

  /**
   * Perform unified multi-tier change analysis across DB catalog and application AST.
   */
  async analyzeUnified(sql: string, dbConfig?: DatabaseConfig): Promise<UnifiedAnalysisResult> {
    const payload = {
      sql: sql.trim(),
      host: dbConfig?.host,
      port: dbConfig?.port,
      database: dbConfig?.database,
      username: dbConfig?.username,
      password: dbConfig?.password && !dbConfig.password.startsWith('•') ? dbConfig.password : undefined,
    };

    const res = await requestJson<UnifiedAnalysisResult>('/api/dependencies/unified', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    // Offline / Demo fallback
    const parsed = await this.analyzeMigration(sql);
    const changedObj = parsed.changed_object || 'users.email';
    const isAdd = parsed.operation === 'ADD_COLUMN';

    return {
      migration: parsed,
      database_verification: {
        is_live_db: false,
        table: parsed.table || 'users',
        table_exists: true,
        column: parsed.column || 'email',
        column_exists: !isAdd,
        data_type: parsed.data_type || 'VARCHAR(255)',
        status: 'Reference Verified',
        message: `Table '${parsed.table || 'users'}' verified against reference schema (Backend offline / Demo mode).`,
      },
      application_dependencies: isAdd
        ? []
        : [
            {
              name: 'User.email',
              type: 'orm_model',
              file: 'models.py',
              line: 17,
              relationship: 'Maps to users.email column',
              description: 'SQLAlchemy Column attribute defined on class User',
            },
            {
              name: 'UserResponse.email',
              type: 'pydantic_schema',
              file: 'schemas.py',
              line: 12,
              relationship: 'Serializes users.email attribute',
              description: 'Pydantic BaseModel attribute used for serialization',
            },
            {
              name: 'GET /users/{id}',
              type: 'fastapi_route',
              file: 'routes.py',
              line: 12,
              relationship: 'Declares response_model=UserResponse',
              description: 'FastAPI route handler declaring response_model=UserResponse',
            },
          ],
      potential_impact: {
        severity: isAdd ? 'Low' : 'High',
        summary: isAdd
          ? `Additive column '${parsed.column}' has no existing application dependencies.`
          : `Destructive DROP COLUMN operation affects 3 downstream application components.`,
        affected_count: isAdd ? 0 : 3,
        updates: {
          orm_model: isAdd
            ? `User.${parsed.column} may need to be added if queried.`
            : `Remove User.email attribute from models.py`,
          pydantic_schema: isAdd
            ? `Add ${parsed.column} to UserResponse if exposed through the API.`
            : `Remove email field or mark Optional in schemas.py`,
          fastapi_route: isAdd
            ? 'No current endpoint dependency detected.'
            : 'Update GET /users/{id} API response contract.',
        },
      },
      graph: {
        ...mockDependencyGraph,
        changed_object: changedObj,
      },
      is_live_db: false,
    };
  },
};
