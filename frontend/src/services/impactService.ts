import { requestJson } from './api';
import { mockImpactResult } from '../mock/impact';
import type { DatabaseConfig, ImpactComponent, ImpactResult } from '../types';

export const impactService = {
  /**
   * Perform database change impact analysis.
   * Calls real backend POST /api/impact/analyze with fallback to mock data if offline.
   */
  async getImpactAnalysis(
    changedObject: string = 'users.email',
    dbConfig?: DatabaseConfig
  ): Promise<ImpactResult> {
    const payload = {
      changed_object: changedObject,
      host: dbConfig?.host,
      port: dbConfig?.port,
      database: dbConfig?.database,
      username: dbConfig?.username,
      password: dbConfig?.password && !dbConfig.password.startsWith('••••') ? dbConfig.password : undefined,
    };

    const res = await requestJson<{
      operation: string;
      database_object: string;
      changed_object: string;
      table: string;
      column?: string;
      dependency_count: number;
      explanation: string;
      dependencies: Array<{
        name: string;
        type: 'orm_model' | 'pydantic_schema' | 'fastapi_route';
        file: string;
        line: number;
        relationship?: string;
        description?: string;
      }>;
    }>('/api/impact/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      const deps = res.data.dependencies || [];
      const components: ImpactComponent[] = deps.map((d) => ({
        component: d.name,
        type: (d.type as 'orm_model' | 'pydantic_schema' | 'fastapi_route') || 'orm_model',
        file: d.file || 'models.py',
        line: d.line || 1,
        relationship: d.relationship || d.description || 'Code reference binding',
        severity: (d.type === 'fastapi_route' || d.type === 'orm_model' ? 'High' : 'Medium') as 'High' | 'Medium' | 'Low',
      }));

      return {
        changed_object: res.data.changed_object || changedObject,
        affectedCount: res.data.dependency_count ?? components.length,
        components,
      };
    }

    // Fallback prototype mock data
    return {
      ...mockImpactResult,
      changed_object: changedObject,
    };
  },
};
