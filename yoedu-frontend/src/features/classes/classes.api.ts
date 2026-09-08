import { api, cleanParams } from '../../lib/api';
import type { CourseClassResponse, CourseClassCreateRequest, ClassStatus } from '../../types/yoedu';

export interface ClassSearchParams {
  search?: string;
  keyword?: string; // fallback
  status?: ClassStatus;
  courseId?: number;
  teacherId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

export const classesApi = {
  search: async (params?: ClassSearchParams): Promise<{ content: CourseClassResponse[], totalElements: number, totalPages: number }> => {
    const searchVal = params?.search || params?.keyword;
    const reqParameters = cleanParams({
      search: searchVal,
      status: params?.status,
      courseId: params?.courseId,
      teacherId: params?.teacherId,
      page: params?.page,
      size: params?.size,
      sort: params?.sort
    });
    return api.get('/api/course-classes', { params: reqParameters });
  },

  getById: async (id: number): Promise<CourseClassResponse> => {
    return api.get(`/api/course-classes/${id}`);
  },

  getByCourseId: async (courseId: number): Promise<CourseClassResponse[]> => {
    return api.get(`/api/course-classes/course/${courseId}`);
  },

  getByStudentId: async (studentId: number): Promise<CourseClassResponse[]> => {
    return api.get(`/api/course-classes/student/${studentId}`);
  },

  create: async (data: CourseClassCreateRequest): Promise<CourseClassResponse> => {
    return api.post('/api/course-classes', data);
  },

  update: async (id: number, data: CourseClassCreateRequest): Promise<CourseClassResponse> => {
    return api.put(`/api/course-classes/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/course-classes/${id}`);
  }
};
export default classesApi;
