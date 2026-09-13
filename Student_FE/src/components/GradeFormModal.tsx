import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { gradesApi, type Grade } from '../features/learning-results/grades.api';

interface GradeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: Grade;
}

export const GradeFormModal: React.FC<GradeFormModalProps> = ({ isOpen, onClose, editData }) => {
  const isEdit = !!editData;
  const queryClient = useQueryClient();

  const [studentId, setStudentId] = useState<string>('');
  const [courseClassId, setCourseClassId] = useState<string>('');
  const [processScore, setProcessScore] = useState<string>('');
  const [midtermScore, setMidtermScore] = useState<string>('');
  const [finalScore, setFinalScore] = useState<string>('');
  const [teacherComment, setTeacherComment] = useState<string>('');

  useEffect(() => {
    if (isOpen && editData) {
      setStudentId(editData.studentId?.toString() || '');
      setCourseClassId(editData.courseClassId?.toString() || '');
      setProcessScore(editData.processScore != null ? editData.processScore.toString() : '');
      setMidtermScore(editData.midtermScore != null ? editData.midtermScore.toString() : '');
      setFinalScore(editData.finalScore != null ? editData.finalScore.toString() : '');
      setTeacherComment(editData.teacherComment || '');
    } else if (isOpen && !editData) {
      setStudentId('');
      setCourseClassId('');
      setProcessScore('');
      setMidtermScore('');
      setFinalScore('');
      setTeacherComment('');
    }
  }, [isOpen, editData]);

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['classes-lookup'],
    queryFn: async () => {
      const res = await api.get('/api/course-classes');
      return res.data;
    },
    enabled: isOpen
  });

  // Fetch enrolled students based on selected class
  const { data: enrolledStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['enrolled-students', courseClassId],
    queryFn: async () => {
      if (!courseClassId) return [];
      const res = await api.get(`/api/enrollments/class/${courseClassId}`);
      return res.map((e: any) => ({
        id: e.studentId,
        studentName: e.studentName || e.student?.fullName || `Học viên #${e.studentId}`,
        studentCode: e.studentCode || e.student?.studentCode || ''
      }));
    },
    enabled: !!courseClassId && !isEdit && isOpen,
  });

  // UX Preview of Total Score and Classification (exact backend formula & HALF_UP rounding)
  const preview = useMemo(() => {
    const p = processScore !== '' ? parseFloat(processScore) : null;
    const m = midtermScore !== '' ? parseFloat(midtermScore) : null;
    const f = finalScore !== '' ? parseFloat(finalScore) : null;

    if (m === null || f === null || isNaN(m) || isNaN(f)) {
      return { total: null, classification: null, text: 'Chưa đủ điều kiện tính tổng' };
    }

    let raw: number;
    if (p === null || isNaN(p)) {
      raw = (m + f) / 2.0;
    } else {
      raw = p * 0.10 + m * 0.30 + f * 0.60;
    }

    // Rounding: < 0.5 round down, >= 0.5 round up (Math.round in JS handles standard half-up for positives)
    const rounded = Math.round(raw);
    const total = Math.max(0, Math.min(10, rounded));

    let classification: string;
    let label: string;
    if (total <= 5) {
      classification = 'YEU';
      label = 'Yếu';
    } else if (total < 7) {
      classification = 'TRUNG_BINH';
      label = 'Trung bình';
    } else if (total < 8) {
      classification = 'KHA';
      label = 'Khá';
    } else {
      classification = 'GIOI';
      label = 'Giỏi';
    }

    return { total, classification, label, raw: raw.toFixed(2) };
  }, [processScore, midtermScore, finalScore]);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEdit && editData) {
        return gradesApi.update(editData.id, payload);
      } else {
        return gradesApi.create(payload);
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật kết quả học tập thành công' : 'Thêm kết quả học tập thành công');
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['student-grades'] });
      queryClient.invalidateQueries({ queryKey: ['class-grades'] });
      queryClient.invalidateQueries({ queryKey: ['reports-learning-summary'] });
      onClose();
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu';
      toast.error(msg);
    }
  });

  const parseScore = (val: string): number | null => {
    if (val === '') return null;
    const num = parseFloat(val);
    return isNaN(num) ? null : num;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEdit && (!courseClassId || !studentId)) {
      toast.error('Vui lòng chọn lớp học và học viên');
      return;
    }

    const p = parseScore(processScore);
    const m = parseScore(midtermScore);
    const f = parseScore(finalScore);

    if (p !== null && (p < 0 || p > 10)) {
      toast.error('Điểm quá trình phải từ 0 đến 10');
      return;
    }
    if (m !== null && (m < 0 || m > 10)) {
      toast.error('Điểm giữa kỳ phải từ 0 đến 10');
      return;
    }
    if (f !== null && (f < 0 || f > 10)) {
      toast.error('Điểm cuối kỳ phải từ 0 đến 10');
      return;
    }

    const payload = isEdit ? {
      processScore: p,
      midtermScore: m,
      finalScore: f,
      teacherComment: teacherComment.trim() || undefined
    } : {
      courseClassId: parseInt(courseClassId),
      studentId: parseInt(studentId),
      processScore: p,
      midtermScore: m,
      finalScore: f,
      teacherComment: teacherComment.trim() || undefined
    };

    mutation.mutate(payload);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => !mutation.isPending && onClose()} 
      title={isEdit ? 'Cập nhật kết quả học tập' : 'Thêm kết quả học tập'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Lớp học */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right font-medium text-foreground text-sm">Lớp học *</label>
          <div className="col-span-3">
            {isEdit ? (
              <Input value={editData?.className || editData?.courseClassName || ''} disabled className="bg-surface-hover cursor-not-allowed text-foreground font-medium" />
            ) : (
              <Select 
                value={courseClassId} 
                onChange={(e: any) => {
                  setCourseClassId(e.target.value);
                  setStudentId('');
                }}
                required
              >
                <option value="" disabled hidden>Chọn lớp học</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name} ({c.classCode})
                  </option>
                ))}
              </Select>
            )}
          </div>
        </div>

        {/* Học viên */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right font-medium text-foreground text-sm">Học viên *</label>
          <div className="col-span-3">
            {isEdit ? (
              <Input value={`${editData?.studentName || ''} (${editData?.studentCode || ''})`} disabled className="bg-surface-hover cursor-not-allowed text-foreground font-medium" />
            ) : (
              <Select 
                value={studentId} 
                onChange={(e: any) => setStudentId(e.target.value)} 
                disabled={!courseClassId || isLoadingStudents}
                required
              >
                <option value="" disabled hidden>{!courseClassId ? 'Vui lòng chọn lớp học trước' : 'Chọn học viên enrolled'}</option>
                {enrolledStudents.length === 0 && courseClassId ? (
                  <option disabled>Không có học viên nào trong lớp này</option>
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

        {/* Điểm quá trình */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right font-medium text-foreground text-sm">Điểm quá trình</label>
          <div className="col-span-3">
            <Input 
              type="number" 
              step="0.1" 
              min="0" 
              max="10" 
              value={processScore} 
              onChange={(e) => setProcessScore(e.target.value)} 
              placeholder="0.0 - 10.0 (tùy chọn)"
            />
          </div>
        </div>

        {/* Điểm giữa kỳ */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right font-medium text-foreground text-sm">Điểm giữa kỳ</label>
          <div className="col-span-3">
            <Input 
              type="number" 
              step="0.1" 
              min="0" 
              max="10" 
              value={midtermScore} 
              onChange={(e) => setMidtermScore(e.target.value)} 
              placeholder="0.0 - 10.0 (tùy chọn)"
            />
          </div>
        </div>

        {/* Điểm cuối kỳ */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right font-medium text-foreground text-sm">Điểm cuối kỳ</label>
          <div className="col-span-3">
            <Input 
              type="number" 
              step="0.1" 
              min="0" 
              max="10" 
              value={finalScore} 
              onChange={(e) => setFinalScore(e.target.value)} 
              placeholder="0.0 - 10.0 (tùy chọn)"
            />
          </div>
        </div>

        {/* Nhận xét */}
        <div className="grid grid-cols-4 items-center gap-4">
          <label className="text-right font-medium text-foreground text-sm">Nhận xét</label>
          <div className="col-span-3">
            <Input 
              value={teacherComment} 
              onChange={(e) => setTeacherComment(e.target.value)} 
              placeholder="Nhận xét của giáo viên (tùy chọn)"
            />
          </div>
        </div>

        {/* Preview tự động: Tổng điểm & Xếp loại */}
        <div className="bg-surface-hover/50 border border-border rounded-xl p-4 mt-4 space-y-2">
          <div className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
            Xem trước kết quả tính (Preview)
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-foreground-muted block text-xs">Tổng điểm:</span>
              <span className="font-bold text-lg text-foreground">
                {preview.total !== null ? preview.total : <span className="text-sm font-normal text-foreground-muted">Chưa nhập đủ</span>}
              </span>
              {preview.raw && <span className="text-xs text-foreground-muted block">Điểm raw: {preview.raw}</span>}
            </div>
            <div>
              <span className="text-foreground-muted block text-xs">Xếp loại:</span>
              <div className="mt-1">
                {preview.classification ? (
                  <Badge 
                    variant={
                      preview.classification === 'GIOI' ? 'primary' :
                      preview.classification === 'KHA' ? 'info' :
                      preview.classification === 'TRUNG_BINH' ? 'warning' : 'danger'
                    }
                  >
                    {preview.label}
                  </Badge>
                ) : (
                  <span className="text-foreground-muted text-sm">-</span>
                )}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-foreground-muted italic pt-1 border-t border-border/50">
            * Tổng điểm được hệ thống tự động làm tròn thành số nguyên theo quy tắc (&ge; 0.5 làm tròn lên, &lt; 0.5 làm tròn xuống).
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Hủy
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Đang lưu...' : 'Lưu kết quả'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
