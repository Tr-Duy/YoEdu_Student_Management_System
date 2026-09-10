import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search, Plus, Edit, Trash2, Eye, Mail, Phone, MapPin, Calendar, Activity, X, Award
} from 'lucide-react';
import { studentsApi } from '../features/students/students.api';
import { api } from '../lib/api';
import type { StudentResponse, StudentStatus } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StudentGradesModal } from '../components/StudentGradesModal';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const studentFormSchema = z.object({
  studentCode: z.string().min(2, 'Mã tối thiểu 2 ký tự'),
  fullName: z.string().min(2, 'Tên tối thiểu 2 ký tự'),
  dateOfBirth: z.string().min(1, 'Ngày sinh là bắt buộc'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  gradeLevel: z.string().min(1, 'Cấp lớp/Lớp học là bắt buộc'),
  schoolName: z.string(),
  phone: z.string(),
  description: z.string(),
  status: z.enum(['ACTIVE', 'PAUSE', 'PAUSED', 'DROPPED']),
  latestScore: z.any(),
  note: z.string(),
  parentId: z.any(),
  withParent: z.boolean(),
  parentFullName: z.string(),
  parentEmail: z.string(),
  parentPhone: z.string(),
  parentAddress: z.string(),
  parentGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  parentRelationship: z.string(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export const StudentsView: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isGradesOpen, setIsGradesOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const { data, isLoading } = useQuery({
    queryKey: ['students', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const activeStatus = statusFilter !== 'ALL' ? (statusFilter as StudentStatus) : undefined;
      return studentsApi.search({ search: debouncedSearch, status: activeStatus, page, size: pageSize });
    },
  });

  const { data: parentsList } = useQuery<any[]>({
    queryKey: ['parents'],
    queryFn: async () => api.get('/api/parents'),
    enabled: isUpsertOpen,
  });

  const { data: statusHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['student-history', selectedStudent?.id],
    queryFn: async () => selectedStudent ? studentsApi.getStatusHistory(selectedStudent.id) : [],
    enabled: !!selectedStudent && isDetailsOpen,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const payloadBase = {
        studentCode: values.studentCode,
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth,
        gender: values.gender,
        gradeLevel: values.gradeLevel,
        schoolName: values.schoolName,
        phone: values.phone,
        description: values.description,
        status: values.status,
        latestScore: values.latestScore,
        note: values.note,
      };

      if (editingStudentId) {
        if (values.withParent) {
          return studentsApi.updateWithParent(editingStudentId, { ...payloadBase, studentNote: values.note, parentFullName: values.parentFullName, parentEmail: values.parentEmail, parentPhone: values.parentPhone, parentAddress: values.parentAddress, parentGender: values.parentGender, parentRelationship: values.parentRelationship } as any);
        } else {
          return studentsApi.update(editingStudentId, { ...payloadBase, parentId: values.parentId || null });
        }
      } else {
        if (values.withParent) {
          return studentsApi.createWithParent({ ...payloadBase, studentNote: values.note, parentFullName: values.parentFullName, parentEmail: values.parentEmail, parentPhone: values.parentPhone, parentAddress: values.parentAddress, parentGender: values.parentGender, parentRelationship: values.parentRelationship } as any);
        } else {
          return studentsApi.create({ ...payloadBase, parentId: values.parentId || null });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      setIsUpsertOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => studentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsConfirmDeleteOpen(false);
    }
  });

  const changeStatusMutation = useMutation({
    mutationFn: async (payload: { id: number, status: StudentStatus, note: string }) => studentsApi.changeStatus(payload.id, payload.status, payload.note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      refetchHistory();
    }
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { gender: 'OTHER', status: 'ACTIVE', latestScore: 0, withParent: false, parentId: null }
  });
  const watchWithParent = watch('withParent');

  const onSubmitForm = (values: StudentFormValues) => {
    const score = Number(values.latestScore);
    if (isNaN(score) || score < 0 || score > 10) return;
    upsertMutation.mutate({ ...values, latestScore: score, parentId: values.parentId ? Number(values.parentId) : null });
  };

  const handleEditClick = (student: StudentResponse) => {
    setEditingStudentId(student.id);
    reset({
      studentCode: student.studentCode, fullName: student.fullName, dateOfBirth: student.dateOfBirth,
      gender: student.gender, gradeLevel: student.gradeLevel, schoolName: student.schoolName || '',
      phone: student.phone || '', description: student.description || '', status: student.status,
      latestScore: student.latestScore, note: student.note || '', parentId: student.parent?.id || null,
      withParent: false, parentFullName: '', parentEmail: '', parentPhone: '', parentAddress: '', parentGender: 'OTHER', parentRelationship: 'FATHER'
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingStudentId(null);
    reset({
      studentCode: `HV${Math.floor(1000 + Math.random() * 9000)}`, fullName: '', dateOfBirth: '',
      gender: 'OTHER', gradeLevel: '', schoolName: '', phone: '', description: '', status: 'ACTIVE',
      latestScore: 0, note: '', parentId: null, withParent: false, parentFullName: '', parentEmail: '',
      parentPhone: '', parentAddress: '', parentGender: 'OTHER', parentRelationship: 'FATHER'
    });
    setIsUpsertOpen(true);
  };

  const studentsList = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Quản lý Học viên</h2>
          <p className="text-sm text-foreground-muted mt-1">Tra cứu danh sách học viên và hồ sơ cá nhân.</p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus size={16} /> Thêm Học viên
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-surface border border-border p-4 rounded-xl shadow-sm transition-colors">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm mã hoặc tên học viên..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'ACTIVE', 'PAUSED', 'DROPPED'].map((filter) => (
            <button
              key={filter}
              onClick={() => { setStatusFilter(filter); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold' : 'text-foreground-muted hover:bg-surface-hover hover:text-foreground'
              }`}
            >
              {filter === 'ALL' && 'Tất cả'}
              {filter === 'ACTIVE' && 'Đang học'}
              {filter === 'PAUSED' && 'Bảo lưu'}
              {filter === 'DROPPED' && 'Đã nghỉ'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm transition-colors">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã HV</TableHead>
              <TableHead>Họ Tên</TableHead>
              <TableHead>Lớp</TableHead>
              <TableHead>Phụ Huynh</TableHead>
              <TableHead>Trạng Thái</TableHead>
              <TableHead className="text-right">Thao Tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
            ) : studentsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8">
                  <EmptyState title="Không có học viên" description="Không tìm thấy học viên nào khớp với tìm kiếm." isSearch />
                </TableCell>
              </TableRow>
            ) : (
              studentsList.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-brand-600 dark:text-brand-400 font-medium">{student.studentCode}</TableCell>
                  <TableCell className="font-medium text-foreground">{student.fullName}</TableCell>
                  <TableCell>{student.gradeLevel}</TableCell>
                  <TableCell>
                    {student.parent ? (
                      <div className="text-xs">
                        <div className="font-medium text-foreground">{student.parent.fullName}</div>
                        <div className="text-foreground-muted">{student.parent.phone}</div>
                      </div>
                    ) : <span className="text-foreground-muted text-xs italic">Chưa liên kết</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.status === 'ACTIVE' ? 'success' : student.status === 'PAUSED' ? 'warning' : 'danger'}>
                      {student.status === 'ACTIVE' ? 'Đang học' : student.status === 'PAUSED' ? 'Bảo lưu' : 'Đã nghỉ'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" title="Kết quả học tập" onClick={() => { setSelectedStudent(student); setIsGradesOpen(true); }}><Award size={16}/></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(student); setIsDetailsOpen(true); }}><Eye size={16}/></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(student)}><Edit size={16}/></Button>
                      <Button variant="ghost" size="sm" className="text-rose-600 dark:text-rose-400 hover:text-rose-500" onClick={() => { setSelectedStudent(student); setIsConfirmDeleteOpen(true); }}><Trash2 size={16}/></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-border flex justify-between items-center bg-surface-hover/30">
            <span className="text-sm text-foreground-muted">Trang {page + 1} / {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Trước</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Chi tiết Học viên" maxWidth="2xl">
        {selectedStudent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-hover/50 border border-border">
              <div className="h-12 w-12 rounded-full bg-brand-600 flex items-center justify-center font-bold text-white text-xl">
                {selectedStudent.fullName.charAt(0)}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">{selectedStudent.fullName}</h4>
                <div className="text-sm text-foreground-muted mt-1 flex gap-3">
                  <span>{selectedStudent.studentCode}</span>
                  <span>{selectedStudent.gradeLevel}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <h5 className="font-semibold text-foreground border-b border-border pb-2">Thông tin cá nhân</h5>
                <div className="flex justify-between"><span className="text-foreground-muted">Ngày sinh:</span><span className="text-foreground">{selectedStudent.dateOfBirth}</span></div>
                <div className="flex justify-between"><span className="text-foreground-muted">Giới tính:</span><span className="text-foreground">{selectedStudent.gender === 'MALE' ? 'Nam' : selectedStudent.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</span></div>
                <div className="flex justify-between"><span className="text-foreground-muted">SĐT:</span><span className="text-foreground">{selectedStudent.phone || 'N/A'}</span></div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-foreground border-b border-border pb-2">Thông tin phụ huynh</h5>
                {selectedStudent.parent ? (
                  <>
                    <div className="flex justify-between"><span className="text-foreground-muted">Họ tên:</span><span className="text-foreground">{selectedStudent.parent.fullName}</span></div>
                    <div className="flex justify-between"><span className="text-foreground-muted">SĐT:</span><span className="text-foreground">{selectedStudent.parent.phone}</span></div>
                  </>
                ) : <div className="text-foreground-muted italic">Chưa liên kết</div>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Upsert Modal */}
      <Modal isOpen={isUpsertOpen} onClose={() => setIsUpsertOpen(false)} title={editingStudentId ? 'Cập nhật Học viên' : 'Thêm Học viên mới'} maxWidth="2xl">
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Mã HV *" {...register('studentCode')} error={errors.studentCode?.message} />
            <Input label="Họ Tên *" {...register('fullName')} error={errors.fullName?.message} />
            <Input label="Ngày Sinh *" type="date" {...register('dateOfBirth')} error={errors.dateOfBirth?.message} />
            <Select label="Giới tính *" {...register('gender')} error={errors.gender?.message}>
              <option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option>
            </Select>
            <Input label="Cấp lớp *" {...register('gradeLevel')} error={errors.gradeLevel?.message} />
            <Input label="Điểm số" type="number" step="0.1" {...register('latestScore', {valueAsNumber:true})} error={errors.latestScore?.message as string} />
            <Select label="Trạng thái *" {...register('status')} error={errors.status?.message}>
              <option value="ACTIVE">Đang học</option><option value="PAUSED">Bảo lưu</option><option value="DROPPED">Đã nghỉ</option>
            </Select>
          </div>

          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('withParent')} className="w-4 h-4 rounded border-border bg-surface text-brand-500 focus:ring-brand-500/50" />
              <span className="text-sm font-medium text-foreground-secondary">Liên kết với Phụ huynh mới</span>
            </label>
            
            {watchWithParent && (
              <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-surface-hover/50 rounded-xl border border-border">
                <Input label="Họ tên Phụ huynh *" {...register('parentFullName')} error={errors.parentFullName?.message} />
                <Input label="Số điện thoại *" {...register('parentPhone')} error={errors.parentPhone?.message} />
                <Input label="Email" type="email" {...register('parentEmail')} error={errors.parentEmail?.message} />
                <Select label="Mối quan hệ" {...register('parentRelationship')}>
                  <option value="FATHER">Bố</option><option value="MOTHER">Mẹ</option><option value="OTHER">Khác</option>
                </Select>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsUpsertOpen(false)}>Hủy</Button>
            <Button variant="primary" type="submit" isLoading={upsertMutation.isPending}>Lưu</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => selectedStudent && deleteMutation.mutate(selectedStudent.id)}
        title="Xóa học viên"
        description={`Bạn có chắc chắn muốn xóa học viên ${selectedStudent?.fullName}? Hành động này không thể hoàn tác.`}
        isDanger
        isLoading={deleteMutation.isPending}
      />

      <StudentGradesModal
        isOpen={isGradesOpen}
        onClose={() => setIsGradesOpen(false)}
        studentName={selectedStudent?.fullName || null}
      />
    </div>
  );
};
