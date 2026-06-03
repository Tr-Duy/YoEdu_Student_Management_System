import { api, cleanParams } from '../../lib/api';
import type { CourseResponse, CourseUpsertRequest } from '../../types/yoedu';

export interface CourseSearchParams {
  keyword?: string;
  search?: string;
}

export const coursesApi = {
  getAll: async (params?: CourseSearchParams): Promise<CourseResponse[]> => {
    // Backend controller maps to /api/course (singular)
    const searchVal = params?.search || params?.keyword;
    const reqParameters = cleanParams({ search: searchVal });
    const response: any[] = await api.get('/api/course', { params: reqParameters });
    return response.map((item: any) => ({
      id: item.id,
      courseCode: item.courseCode,
      name: item.courseName,
      description: item.courseDescription,
      durationMonths: item.totalSession,
      basePrice: item.tuitionFee,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
  },

  getById: async (id: number): Promise<CourseResponse> => {
    const item: any = await api.get(`/api/course/${id}`);
    return {
      id: item.id,
      courseCode: item.courseCode,
      name: item.courseName,
      description: item.courseDescription,
      durationMonths: item.totalSession,
      basePrice: item.tuitionFee,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  },

  create: async (data: CourseUpsertRequest): Promise<CourseResponse> => {
    const payload = {
      courseCode: data.courseCode,
      courseName: data.name,
      courseDescription: data.description,
      totalSession: data.durationMonths,
      tuitionFee: data.basePrice,
      isActive: 1
    };
    const item: any = await api.post('/api/course', payload);
    return {
      id: item.id,
      courseCode: item.courseCode,
      name: item.courseName,
      description: item.courseDescription,
      durationMonths: item.totalSession,
      basePrice: item.tuitionFee,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  },

  update: async (id: number, data: CourseUpsertRequest): Promise<CourseResponse> => {
    const payload = {
      courseCode: data.courseCode,
      courseName: data.name,
      courseDescription: data.description,
      totalSession: data.durationMonths,
      tuitionFee: data.basePrice,
      isActive: 1
    };
    const item: any = await api.put(`/api/course/${id}`, payload);
    return {
      id: item.id,
      courseCode: item.courseCode,
      name: item.courseName,
      description: item.courseDescription,
      durationMonths: item.totalSession,
      basePrice: item.tuitionFee,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/course/${id}`);
  }
};
export default coursesApi;
