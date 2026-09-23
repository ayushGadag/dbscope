import { mockMigrationPlan, mockReports } from '../mock/reports';
import type { MigrationPlan, Report } from '../types';

export const reportService = {
  async getReports(): Promise<Report[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockReports];
  },

  async getMigrationPlan(changedObject: string = 'users.email'): Promise<MigrationPlan> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      ...mockMigrationPlan,
      changed_object: changedObject,
    };
  },
};
