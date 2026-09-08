import { api, cleanParams } from '../../lib/api';
import type {
  AttendanceResponse,
  AttendanceCreateRequest,
  AttendanceBatchRequest,
  StudentAttendanceRowDto,
  StudentResponse
} from '../../types/yoedu';

export interface AttendanceSearchParams {
  attendanceDate?: string;
}

export const attendanceApi = {
  create: async (data: AttendanceCreateRequest): Promise<AttendanceResponse> => {
    return api.post('/api/attendances', data);
  },

  createBatch: async (data: AttendanceBatchRequest): Promise<AttendanceResponse[]> => {
    return api.post('/api/attendances/batch', data);
  },

  getByClassId: async (classId: number, params?: AttendanceSearchParams): Promise<AttendanceResponse[]> => {
    const reqParameters = cleanParams({ attendanceDate: params?.attendanceDate });
    return api.get(`/api/attendances/class/${classId}`, { params: reqParameters });
  },

  getMatrix: async (classId: number, year: number, month: number): Promise<StudentAttendanceRowDto[]> => {
    return api.get(`/api/attendances/matrix/${classId}`, {
      params: { year, month }
    });
  },

  getEligibleStudents: async (classId: number): Promise<StudentResponse[]> => {
    return api.get(`/api/attendances/eligible-students/${classId}`);
  }
};
export default attendanceApi;
