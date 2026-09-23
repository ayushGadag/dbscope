import { mockDependencyGraph } from '../mock/dependencies';
import type { DependencyGraphData } from '../types';

export const dependencyService = {
  async getDependencyGraph(changedObject: string = 'users.email'): Promise<DependencyGraphData> {
    await new Promise((r) => setTimeout(r, 250));
    return {
      ...mockDependencyGraph,
      changed_object: changedObject,
    };
  },
};
