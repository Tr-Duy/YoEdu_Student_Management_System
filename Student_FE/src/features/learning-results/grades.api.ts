import { api } from '../../lib/api';

export interface Grade {
  id: number;
  studentId: number;
  studentName: string;
  studentCode: string;
  courseClassId: number;
  courseClassName?: string;
  className: string;
  processScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  totalScore?: number | null;
  classification?: 'GIOI' | 'KHA' | 'TRUNG_BINH' | 'YEU' | null;
  status: 'DRAFT' | 'LOCKED';
  attendanceRate?: number | null;
  teacherComment?: string | null;
  createdByUserId?: number;
  createdByUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradeSearchParams {
  studentName?: string;
  courseClassId?: number;
  courseId?: number;
  teacherId?: number;
  classification?: string;
  status?: string;
}

export interface GradeCreateData {
  studentId: number;
  courseClassId: number;
  processScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
  teacherComment?: string;
}

export interface GradeUpdateData {
  processScore?: number | null;
  midtermScore?: number | null;
  finalScore?: number | null;
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
