import { api } from '../../lib/api';

export interface Grade {
  id: number;
  studentName: string;
  className: string;
  resultMonth: string;
  score: number;
  classification: string;
  status: string;
  attendanceRate: number;
  studentId?: number;
  courseClassId?: number;
  teacherComment?: string;
}

export interface GradeSearchParams {
  studentName?: string;
  courseClassId?: number;
  courseId?: number;
  teacherId?: number;
  month?: string;
  classification?: string;
  status?: string;
}

export interface GradeCreateData {
  studentId: number;
  courseClassId: number;
  resultMonth: string;
  score: number;
  teacherComment?: string;
}

export interface GradeUpdateData {
  score?: number;
  teacherComment?: string;
}

export const gradesApi = {
  search: (params: GradeSearchParams) => {
    return api.post('/api/learning-results/search', params);
  },
  
  create: (data: GradeCreateData) => {
    return api.post('/api/learning-results', data);
  },
  
  update: (id: number, data: GradeUpdateData) => {
    return api.put(`/api/learning-results/${id}`, data);
  },
  
  delete: (id: number) => {
    return api.delete(`/api/learning-results/${id}`);
  },
  
  lock: (id: number) => {
    return api.patch(`/api/learning-results/${id}/lock`);
  },
  
  unlock: (id: number) => {
    return api.patch(`/api/learning-results/${id}/unlock`);
  }
};
