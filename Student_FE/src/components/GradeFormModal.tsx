import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { gradesApi } from '../features/learning-results/grades.api';

interface GradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

export const GradeFormModal: React.FC<GradeFormModalProps> = ({ isOpen, onClose, editData }) => {
  const isEdit = !!editData;
  const queryClient = useQueryClient();
  
  const [studentId, setStudentId] = useState<string>('');
  const [courseClassId, setCourseClassId] = useState<string>('');
  const [resultMonth, setResultMonth] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const [teacherComment, setTeacherComment] = useState<string>('');
  
  useEffect(() => {
    if (isOpen && editData) {
      setStudentId(editData.studentId?.toString() || '');
      setCourseClassId(editData.courseClassId?.toString() || '');
      
      // resultMonth could be YYYY-MM-DD or YYYY-MM
      let monthVal = editData.resultMonth || '';
      if (monthVal && monthVal.length > 7) {
        monthVal = monthVal.substring(0, 7);
      }
      setResultMonth(monthVal);
      setScore(editData.score?.toString() || '');
      setTeacherComment(editData.teacherComment || '');
    } else if (isOpen && !editData) {
      setStudentId('');
      setCourseClassId('');
      setResultMonth(new Date().toISOString().substring(0, 7));
      setScore('');
      setTeacherComment('');
    }
  }, [isOpen, editData]);

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: async () => {
      const res = await api.get('/api/course-classes');
      return res.data;
    }
  });

  // Fetch enrolled students based on selected class
  const { data: enrolledStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['enrolled-students', courseClassId],
    queryFn: async () => {
      if (!courseClassId) return [];
      const res = await api.get(`/api/enrollments/class/${courseClassId}`);
      // Return student objects from enrollment
      return res.map((e: any) => ({
        id: e.studentId,
        studentName: e.studentName || e.student?.fullName || `Học viên #${e.studentId}`,
        studentCode: e.studentCode || e.student?.studentCode || ''
      }));
    },
    enabled: !!courseClassId && !isEdit,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return gradesApi.update(editData.id, data);
      } else {
        return gradesApi.create(data);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật điểm thành công' : 'Thêm điểm thành công');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      onClose();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!courseClassId || !studentId || !resultMonth || score === '') {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 10) {
      toast.error('Điểm số phải từ 0 đến 10');
      return;
    }
    
    const payload = isEdit ? {
      score: numScore,
      teacherComment
    } : {
      courseClassId: parseInt(courseClassId),
      studentId: parseInt(studentId),
      resultMonth: `${resultMonth}-01`, // Backend needs YYYY-MM-DD Date
      score: numScore,
      teacherComment
    };
    
    mutation.mutate(payload);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => !mutation.isPending && onClose()} 
      title={isEdit ? 'Cập nhật điểm' : 'Thêm điểm học viên'}
      maxWidth="lg"
    >
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium text-foreground">Lớp học *</label>
              <div className="col-span-3">
                <Select value={courseClassId} onChange={(e: any) => setCourseClassId(e.target.value)} disabled={isEdit}>
                  <option value="" disabled hidden>Chọn lớp học</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id.toString()}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium text-foreground">Học viên *</label>
              <div className="col-span-3">
                {isEdit ? (
                  <Input value={editData.studentName} disabled className="bg-muted" />
                ) : (
                  <Select value={studentId} onChange={(e: any) => setStudentId(e.target.value)} disabled={!courseClassId || isLoadingStudents}>
                    <option value="" disabled hidden>{!courseClassId ? "Vui lòng chọn lớp trước" : "Chọn học viên"}</option>
                    {enrolledStudents.length === 0 && courseClassId ? (
                      <option disabled>Không có học viên nào</option>
                    ) : (
                      enrolledStudents.map((s: any) => (
                        <option key={s.id} value={s.id.toString()}>
                          {s.studentName} {s.studentCode ? `(${s.studentCode})` : ''}
                        </option>
                      ))
                    )}
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium text-foreground">Tháng *</label>
              <div className="col-span-3">
                <Input 
                  type="month" 
                  value={resultMonth} 
                  onChange={(e) => setResultMonth(e.target.value)} 
                  disabled={isEdit}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium text-foreground">Điểm số *</label>
              <div className="col-span-3">
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0" 
                  max="10" 
                  value={score} 
                  onChange={(e) => setScore(e.target.value)} 
                  placeholder="0.0 - 10.0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium text-foreground">Nhận xét</label>
              <div className="col-span-3">
                <Input 
                  value={teacherComment} 
                  onChange={(e) => setTeacherComment(e.target.value)} 
                  placeholder="Nhận xét của giáo viên (tùy chọn)"
                />
              </div>
            </div>
            
            {isEdit && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium text-foreground text-muted-foreground">Xếp loại</label>
                <div className="col-span-3">
                  <Input value={editData.classification || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Hệ thống sẽ tự động tính lại xếp loại khi lưu.</p>
                </div>
              </div>
            )}

          </div>
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Hủy
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </div>
        </form>
    </Modal>
  );
};
