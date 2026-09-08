import { api, cleanParams } from '../../lib/api';
import type { TeacherResponse, TeacherUpsertRequest, TeacherRole } from '../../types/yoedu';

export interface TeacherSearchParams {
  search?: string;
  keyword?: string; // fallback
  status?: string;
  role?: TeacherRole;
  isActive?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export const teachersApi = {
  search: async (params?: TeacherSearchParams): Promise<{ content: TeacherResponse[], totalElements: number, totalPages: number }> => {
    const searchVal = params?.search || params?.keyword;
    const reqParameters = cleanParams({
      search: searchVal,
      status: params?.status,
      role: params?.role,
      isActive: params?.isActive,
      page: params?.page,
      size: params?.size,
      sort: params?.sort
    });
    return api.get('/api/teachers', { params: reqParameters });
  },

  getById: async (id: number): Promise<TeacherResponse> => {
    return api.get(`/api/teachers/${id}`);
  },

  create: async (data: TeacherUpsertRequest): Promise<TeacherResponse> => {
    return api.post('/api/teachers', data);
  },

  update: async (id: number, data: TeacherUpsertRequest): Promise<TeacherResponse> => {
    return api.put(`/api/teachers/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/teachers/${id}`);
  }
};
export default teachersApi;
