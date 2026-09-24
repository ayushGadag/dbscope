import { requestJson } from './api';
import { mockDependencyGraph } from '../mock/dependencies';
import type { DependencyGraphData, DependencyItem } from '../types';

export const dependencyService = {
  /**
   * Fetch interactive dependency graph nodes & edges.
   * Calls backend POST /api/dependencies/graph with fallback to mock data if offline.
   */
  async getDependencyGraph(changedObject: string = 'users.email'): Promise<DependencyGraphData> {
    const res = await requestJson<DependencyGraphData>('/api/dependencies/graph', {
      method: 'POST',
      body: JSON.stringify({ changed_object: changedObject }),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    // Fallback: mock prototype graph
    return {
      ...mockDependencyGraph,
      changed_object: changedObject,
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

    // Fallback mock dependencies
    return {
      changed_object: changedObject,
      dependencies: [
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
    };
  },
};
