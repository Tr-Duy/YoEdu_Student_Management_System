import { api, cleanParams } from '../../lib/api';
import type {
  StudentResponse,
  StudentUpsertRequest,
  StudentWithParentUpsertRequest,
  StudentStatus
} from '../../types/yoedu';

export interface StudentSearchParams {
  search?: string;
  keyword?: string; // mapping fallback
  status?: StudentStatus;
  gradeLevel?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const studentsApi = {
  search: async (params?: StudentSearchParams): Promise<{ content: StudentResponse[], totalElements: number, totalPages: number }> => {
    // Backend search endpoint is paginated, returns Page<StudentResponse>
    // Map keyword to search if search is not provided
    const searchVal = params?.search || params?.keyword;
    const reqParameters = cleanParams({
      search: searchVal,
      status: params?.status,
      gradeLevel: params?.gradeLevel,
      page: params?.page,
      size: params?.size,
      sort: params?.sort,
    });
    return api.get('/api/students', { params: reqParameters });
  },

  getById: async (id: number): Promise<StudentResponse> => {
    return api.get(`/api/students/${id}`);
  },

  create: async (data: StudentUpsertRequest): Promise<StudentResponse> => {
    return api.post('/api/students', data);
  },

  createWithParent: async (data: StudentWithParentUpsertRequest): Promise<StudentResponse> => {
    return api.post('/api/students/with-parent', data);
  },

  update: async (id: number, data: StudentUpsertRequest): Promise<StudentResponse> => {
    return api.put(`/api/students/${id}`, data);
  },

  updateWithParent: async (id: number, data: StudentWithParentUpsertRequest): Promise<StudentResponse> => {
    return api.put(`/api/students/${id}/with-parent`, data);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/students/${id}`);
  },

  changeStatus: async (id: number, status: StudentStatus, note?: string): Promise<StudentResponse> => {
    return api.patch(`/api/students/${id}/status`, { status, note });
  },

  getStatusHistory: async (id: number): Promise<any[]> => {
    return api.get(`/api/students/${id}/status-history`);
  }
};
export default studentsApi;
