import { requestJson } from './api';
import type { DatabaseConfig, Migration, MigrationAnalysis, UnifiedAnalysisResult } from '../types';

export const migrationService = {
  async getMigrations(): Promise<Migration[]> {
    await new Promise((r) => setTimeout(r, 50));
    try {
      const stored = localStorage.getItem('dbscope_analysis_history');
      if (stored) {
        const history = JSON.parse(stored);
        if (Array.isArray(history)) {
          return history.map((item, idx) => ({
            id: String(item.id || `mig-${idx}`),
            title: `${item.operation || 'MIGRATION'} ${item.target_object || ''}`.trim(),
            sql: item.sql_statement || '',
            description: `Risk: ${item.risk_score || 0}/10 (${item.risk_level || 'LOW'})`,
            createdAt: item.timestamp || new Date().toISOString(),
          }));
        }
      }
    } catch {}
    return [];
  },

  /**
   * Analyze SQL migration statement.
   * Calls real backend POST /api/migrations/analyze.
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

    return {
      operation: null,
      status: res.status === 422 ? 'Unsupported' : 'Invalid',
      message: res.error || 'Failed to parse migration statement on DBScope backend.',
    };
  },

  getLastAnalyzedSql(): string | null {
    try {
      return localStorage.getItem('dbscope_last_analyzed_sql');
    } catch {
      return null;
    }
  },

  setLastAnalyzedSql(sql: string): void {
    try {
      if (sql && sql.trim()) {
        localStorage.setItem('dbscope_last_analyzed_sql', sql.trim());
      } else {
        localStorage.removeItem('dbscope_last_analyzed_sql');
      }
    } catch {}
  },

  getLastTargetObject(): string {
    try {
      return localStorage.getItem('dbscope_last_target_object') || 'users.email';
    } catch {
      return 'users.email';
    }
  },

  setLastTargetObject(target: string): void {
    try {
      if (target && target.trim()) {
        localStorage.setItem('dbscope_last_target_object', target.trim());
      } else {
        localStorage.removeItem('dbscope_last_target_object');
      }
    } catch {}
  },

  getLastAnalysis(): UnifiedAnalysisResult | null {
    try {
      const stored = localStorage.getItem('dbscope_last_analysis_result');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  setLastAnalysis(result: UnifiedAnalysisResult | null): void {
    try {
      if (result) {
        localStorage.setItem('dbscope_last_analysis_result', JSON.stringify(result));
      } else {
        localStorage.removeItem('dbscope_last_analysis_result');
      }
    } catch {}
  },

  /**
   * Perform unified multi-tier change analysis across DB catalog and application AST.
   */
  async analyzeUnified(sql: string, dbConfig?: DatabaseConfig): Promise<UnifiedAnalysisResult> {
    const trimmed = sql.trim();
    this.setLastAnalyzedSql(trimmed);

    const payload = {
      sql: trimmed,
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
      const target =
        res.data.graph?.changed_object ||
        (res.data.migration?.table && res.data.migration?.column
          ? `${res.data.migration.table}.${res.data.migration.column}`
          : 'users.email');
      this.setLastTargetObject(target);
      this.setLastAnalysis(res.data);

      // Record to analysis history for Reports
      try {
        const histRaw = localStorage.getItem('dbscope_analysis_history');
        const history = histRaw ? JSON.parse(histRaw) : [];
        const isAdd = res.data.migration?.operation === 'ADD_COLUMN';
        const isAlter = res.data.migration?.operation === 'ALTER_COLUMN';
        const isRename = res.data.migration?.operation === 'RENAME_COLUMN';
        const opType = isAdd ? 'additive' : isAlter ? 'modification' : isRename ? 'rename' : 'destructive';
        const riskLevel =
          res.data.risk_assessment?.risk_level ||
          (res.data.potential_impact?.severity === 'High'
            ? 'HIGH'
            : res.data.potential_impact?.severity === 'Medium'
            ? 'MEDIUM'
            : 'LOW');

        history.unshift({
          id: `rep-${Date.now()}`,
          projectName: localStorage.getItem('dbscope_active_source')
            ? JSON.parse(localStorage.getItem('dbscope_active_source')!).name
            : 'Connected Repository',
          targetDatabase: dbConfig?.database || 'PostgreSQL',
          proposedMigration: trimmed,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
          dependenciesCount: res.data.application_dependencies?.length ?? 0,
          riskLevel: riskLevel,
          planStepsCount: isAdd ? 7 : 9,
          summary: `Static analysis of ${opType} migration targeting ${target}. Evaluated PostgreSQL catalogs, SQLAlchemy ORM bindings, Pydantic schemas, and FastAPI endpoints.`,
        });
        localStorage.setItem('dbscope_analysis_history', JSON.stringify(history.slice(0, 30)));
      } catch {}

      return res.data;
    }

    throw new Error(res.error || 'Failed to analyze migration on DBScope backend server.');
  },
};
