import { mockImpactResult } from '../mock/impact';
import type { ImpactResult } from '../types';

export const impactService = {
  async getImpactAnalysis(changedObject: string = 'users.email'): Promise<ImpactResult> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      ...mockImpactResult,
      changed_object: changedObject,
    };
  },
};
