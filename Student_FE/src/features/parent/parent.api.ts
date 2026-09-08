import { api } from '../../lib/api';
import type { ParentDashboardResponse } from '../../types/yoedu';

export const parentApi = {
  getDashboard: async (): Promise<ParentDashboardResponse> => {
    return api.get('/api/parent/dashboard');
  }
};
export default parentApi;
