import { mockAnalysisResults, mockMigrations } from '../mock/migrations';
import type { Migration, MigrationAnalysis } from '../types';

export const migrationService = {
  async getMigrations(): Promise<Migration[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockMigrations];
  },

  async analyzeMigration(sql: string): Promise<MigrationAnalysis> {
    await new Promise((r) => setTimeout(r, 350));
    const trimmed = sql.trim();

    if (!trimmed) {
      return {
        operation: null,
        status: 'Invalid',
        message: 'SQL statement cannot be empty.',
      };
    }

    if (mockAnalysisResults[trimmed]) {
      return mockAnalysisResults[trimmed];
    }

    // Dynamic heuristic fallback for other ALTER TABLE statements in mock prototype
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
        message: `Destructive DROP COLUMN operation detected on table '${table}'.`,
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
        message: `Additive ADD COLUMN operation detected on table '${table}'.`,
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
        message: `Modification of column '${col}' on table '${table}'.`,
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
        message: `Column rename operation detected on table '${table}'.`,
      };
    }

    return {
      operation: null,
      status: 'Unsupported',
      message: 'Unsupported migration operation. Supported in prototype: DROP COLUMN, ADD COLUMN, ALTER COLUMN, RENAME COLUMN.',
    };
  },
};
