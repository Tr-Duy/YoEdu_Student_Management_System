import { api, cleanParams } from '../../lib/api';
import type { ScheduleSlotResponse, ScheduleSlotUpsertRequest } from '../../types/yoedu';

export interface ScheduleSlotSearchParams {
  search?: string;
  keyword?: string;
}

export const scheduleSlotsApi = {
  getAll: async (params?: ScheduleSlotSearchParams): Promise<ScheduleSlotResponse[]> => {
    const searchVal = params?.search || params?.keyword;
    const reqParameters = cleanParams({ search: searchVal });
    return api.get('/api/schedule-slots', { params: reqParameters });
  },

  getById: async (id: number): Promise<ScheduleSlotResponse> => {
    return api.get(`/api/schedule-slots/${id}`);
  },

  create: async (data: ScheduleSlotUpsertRequest): Promise<ScheduleSlotResponse> => {
    return api.post('/api/schedule-slots', data);
  },

  update: async (id: number, data: ScheduleSlotUpsertRequest): Promise<ScheduleSlotResponse> => {
    return api.put(`/api/schedule-slots/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/schedule-slots/${id}`);
  }
};
export default scheduleSlotsApi;
