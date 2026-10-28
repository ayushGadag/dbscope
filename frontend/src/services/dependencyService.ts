import { requestJson } from './api';
import type { DatabaseConfig, DependencyGraphData, DependencyItem } from '../types';

export const dependencyService = {
  /**
   * Fetch interactive dependency graph nodes & edges.
   * Calls backend POST /api/dependencies/graph with safe empty fallback if offline.
   */
  async getDependencyGraph(
    changedObject: string = 'users.email',
    dbConfig?: DatabaseConfig,
    sql?: string
  ): Promise<DependencyGraphData> {
    const payload: Record<string, unknown> = {
      changed_object: changedObject,
      sql: sql ? sql.trim() : undefined,
      host: dbConfig?.host,
      port: dbConfig?.port,
      database: dbConfig?.database,
      username: dbConfig?.username,
      password: dbConfig?.password && !dbConfig.password.startsWith('•') ? dbConfig.password : undefined,
    };

    const res = await requestJson<DependencyGraphData>('/api/dependencies/graph', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    return {
      changed_object: changedObject,
      nodes: [],
      edges: [],
    };
  },

  /**
   * Extract raw code dependencies for a changed database object.
   */
  async getDependencies(changedObject: string = 'users.email'): Promise<{ changed_object: string; dependencies: DependencyItem[] }> {
    const res = await requestJson<{ changed_object: string; dependencies: DependencyItem[] }>('/api/dependencies/extract', {
      method: 'POST',
      body: JSON.stringify({ changed_object: changedObject }),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    return {
      changed_object: changedObject,
      dependencies: [],
    };
  },

  /**
   * Get dynamically discovered tables and columns from the active codebase.
   */
  async getDiscoveredObjects(): Promise<Array<{ table: string; model: string; file: string; columns: string[] }>> {
    const res = await requestJson<{ objects: Array<{ table: string; model: string; file: string; columns: string[] }> }>(
      '/api/dependencies/discovered-objects'
    );
    if (res.ok && res.data && res.data.objects) {
      return res.data.objects;
    }
    return [];
  },
};
