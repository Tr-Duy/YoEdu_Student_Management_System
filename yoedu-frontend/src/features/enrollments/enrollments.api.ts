import { api } from '../../lib/api';
import type { EnrollmentResponse, EnrollmentCreateRequest, TransferRequest } from '../../types/yoedu';

export const enrollmentsApi = {
  enroll: async (data: EnrollmentCreateRequest): Promise<EnrollmentResponse> => {
    return api.post('/api/enrollments', data);
  },

  getByClassId: async (classId: number): Promise<EnrollmentResponse[]> => {
    return api.get(`/api/enrollments/class/${classId}`);
  },

  getByStudentId: async (studentId: number): Promise<EnrollmentResponse[]> => {
    return api.get(`/api/enrollments/student/${studentId}`);
  },

  drop: async (id: number): Promise<EnrollmentResponse> => {
    return api.patch(`/api/enrollments/${id}/drop`);
  },

  transfer: async (data: TransferRequest): Promise<EnrollmentResponse> => {
    return api.post('/api/enrollments/transfer', data);
  }
};
export default enrollmentsApi;
