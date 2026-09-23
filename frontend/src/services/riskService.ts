import { mockRiskAssessment } from '../mock/risk';
import type { RiskAssessment } from '../types';

export const riskService = {
  async getRiskAssessment(changedObject: string = 'users.email'): Promise<RiskAssessment> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      ...mockRiskAssessment,
      changed_object: changedObject,
    };
  },
};
