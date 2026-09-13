import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus, Trash2, UserPlus, ArrowRightLeft, BookOpen, User
} from 'lucide-react';
import { enrollmentsApi } from '../features/enrollments/enrollments.api';
import { classesApi } from '../features/classes/classes.api';
import { studentsApi } from '../features/students/students.api';
import type { EnrollmentResponse, EnrollmentStatus } from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// ==========================================
// FORM VALIDATION SCHEMAS WITH ZOD
// ==========================================
const enrollmentFormSchema = z.object({
  studentId: z.any(),
  courseClassId: z.any(),
  enrolledAt: z.string().min(1, 'Ngày ghi danh là bắt buộc'),
  status: z.enum(['ACTIVE', 'PAUSE', 'PAUSED', 'DROPPED', 'COMPLETED']),
  note: z.string().optional(),
});

type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;

const transferFormSchema = z.object({
  studentId: z.any(),
  fromClassId: z.any(),
  toClassId: z.any(),
  note: z.string().optional(),
});

type TransferFormValues = z.infer<typeof transferFormSchema>;

export const EnrollmentsView: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'class' | 'student'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isConfirmDropOpen, setIsConfirmDropOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentResponse | null>(null);

  const { data: studentsData } = useQuery({ queryKey: ['enrollment-students'], queryFn: () => studentsApi.search({ size: 150 }) });
  const studentsList = studentsData?.content || [];

  const { data: classesData } = useQuery({ queryKey: ['enrollment-classes'], queryFn: () => classesApi.search({ size: 100 }) });
  const classesList = classesData?.content || [];

  const { data: classEnrollments, isLoading: isClassEnrollmentsLoading } = useQuery<EnrollmentResponse[]>({
    queryKey: ['class-enrollments', selectedClassId],
    queryFn: () => enrollmentsApi.getByClassId(Number(selectedClassId)),
    enabled: activeTab === 'class' && !!selectedClassId,
  });

  const { data: studentEnrollments, isLoading: isStudentEnrollmentsLoading } = useQuery<EnrollmentResponse[]>({
    queryKey: ['student-enrollments', selectedStudentId],
    queryFn: () => enrollmentsApi.getByStudentId(Number(selectedStudentId)),
    enabled: activeTab === 'student' && !!selectedStudentId,
  });

  const enrollMutation = useMutation({
    mutationFn: (values: EnrollmentFormValues) => {
      return enrollmentsApi.enroll({
        studentId: Number(values.studentId),
        courseClassId: Number(values.courseClassId),
        enrolledAt: values.enrolledAt,
        status: values.status as EnrollmentStatus,
        note: values.note || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseClasses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
      queryClient.invalidateQueries({ queryKey: ['classes-lookup'] });
      setIsEnrollOpen(false);
    }
  });

  const transferMutation = useMutation({
    mutationFn: (values: TransferFormValues) => {
      return enrollmentsApi.transfer({
        studentId: Number(values.studentId),
        fromClassId: Number(values.fromClassId),
        toClassId: Number(values.toClassId),
        note: values.note || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseClasses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
      queryClient.invalidateQueries({ queryKey: ['classes-lookup'] });
      setIsTransferOpen(false);
    }
  });

  const dropMutation = useMutation({
    mutationFn: (id: number) => enrollmentsApi.drop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courseClasses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-classes'] });
      queryClient.invalidateQueries({ queryKey: ['classes-list'] });
      queryClient.invalidateQueries({ queryKey: ['classes-lookup'] });
      setIsConfirmDropOpen(false);
    }
  });

  const enrollForm = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: { studentId: '', courseClassId: '', enrolledAt: new Date().toISOString().split('T')[0], status: 'ACTIVE', note: '' }
  });

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: { studentId: '', fromClassId: '', toClassId: '', note: '' }
  });

  const onEnrollSubmit = (values: EnrollmentFormValues) => {
    if (!values.studentId || !values.courseClassId) return;
    enrollMutation.mutate(values);
  };

  const onTransferSubmit = (values: TransferFormValues) => {
    if (!values.toClassId || Number(values.fromClassId) === Number(values.toClassId)) return;
    transferMutation.mutate(values);
  };

  const handleOpenEnrollDialog = () => {
    enrollForm.reset({
      studentId: activeTab === 'student' ? selectedStudentId : '',
      courseClassId: activeTab === 'class' ? selectedClassId : '',
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE', note: '',
    });
    setIsEnrollOpen(true);
  };

  const handleOpenTransferDialog = (enrollment: EnrollmentResponse) => {
    setSelectedEnrollment(enrollment);
    transferForm.reset({
      studentId: enrollment.studentId.toString(),
      fromClassId: enrollment.courseClassId.toString(),
      toClassId: '', note: '',
    });
    setIsTransferOpen(true);
  };

  const formatVND = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PAUSE':
      case 'PAUSED': return 'warning';
      case 'DROPPED': return 'danger';
      case 'COMPLETED': return 'brand';
      default: return 'neutral';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Đang học';
      case 'PAUSE':
      case 'PAUSED': return 'Bảo lưu';
      case 'DROPPED': return 'Rút tên';
      case 'COMPLETED': return 'Hoàn thành';
      default: return 'Không rõ';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ghi danh & Chuyển lớp</h2>
          <p className="text-sm text-foreground-muted mt-1">Quản lý xếp lớp, điều chuyển học viên và theo dõi lịch sử học tập.</p>
        </div>
        <Button onClick={handleOpenEnrollDialog} className="gap-2">
          <UserPlus size={16} /> Ghi danh mới
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-xl p-2 flex items-center gap-2 w-max">
         <button onClick={() => setActiveTab('class')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'class' ? 'bg-brand-600 text-white' : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'}`}>Tra cứu theo Lớp</button>
         <button onClick={() => setActiveTab('student')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'student' ? 'bg-brand-600 text-white' : 'text-foreground-secondary hover:text-foreground hover:bg-surface-hover'}`}>Tra cứu theo Học viên</button>
      </div>

      {activeTab === 'class' ? (
         <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-4">
               <label className="block text-sm font-medium text-foreground-secondary mb-2">Chọn Lớp học để xem danh sách</label>
               <select
                 value={selectedClassId}
                 onChange={(e) => setSelectedClassId(e.target.value)}
                 className="w-full md:w-1/2 bg-surface border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-brand-500"
               >
                 <option value="">-- Chọn Lớp học --</option>
                 {classesList.map(c => <option key={c.id} value={c.id}>{c.classCode} - {c.name}</option>)}
               </select>
            </div>
            
            {selectedClassId && (
               <div className="bg-surface border border-border rounded-xl overflow-hidden">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Mã HV</TableHead>
                       <TableHead>Họ Tên HV</TableHead>
                       <TableHead>Ngày Ghi Danh</TableHead>
                       <TableHead>Học Phí Áp Dụng</TableHead>
                       <TableHead>Trạng Thái</TableHead>
                       <TableHead className="text-right">Thao Tác</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {isClassEnrollmentsLoading ? (
                       <TableRow><TableCell colSpan={6} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
                     ) : !classEnrollments || classEnrollments.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="py-8">
                           <EmptyState title="Lớp chưa có học viên" description="Hãy thêm học viên vào lớp này." />
                         </TableCell>
                       </TableRow>
                     ) : (
                       classEnrollments.map((e) => (
                         <TableRow key={e.id}>
                           <TableCell className="font-mono text-brand-600 dark:text-brand-400 font-medium">{e.studentCode}</TableCell>
                           <TableCell className="font-semibold text-foreground">{e.studentName}</TableCell>
                           <TableCell className="text-foreground-muted">{e.enrolledAt}</TableCell>
                           <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{formatVND(e.appliedFee || 0)}</TableCell>
                           <TableCell>
                             <Badge variant={getStatusBadgeVariant(e.status)}>{getStatusText(e.status)}</Badge>
                           </TableCell>
                           <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="sm" onClick={() => handleOpenTransferDialog(e)} title="Chuyển lớp"><ArrowRightLeft size={16}/></Button>
                               <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => { setSelectedEnrollment(e); setIsConfirmDropOpen(true); }} title="Rút tên"><Trash2 size={16}/></Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </div>
            )}
         </div>
      ) : (
         <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-4">
               <label className="block text-sm font-medium text-foreground-secondary mb-2">Chọn Học viên để xem lịch sử</label>
               <select
                 value={selectedStudentId}
                 onChange={(e) => setSelectedStudentId(e.target.value)}
                 className="w-full md:w-1/2 bg-surface border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-brand-500"
               >
                 <option value="">-- Chọn Học viên --</option>
                 {studentsList.map(s => <option key={s.id} value={s.id}>{s.studentCode} - {s.fullName}</option>)}
               </select>
            </div>
            
            {selectedStudentId && (
               <div className="bg-surface border border-border rounded-xl overflow-hidden">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Mã Lớp</TableHead>
                       <TableHead>Tên Lớp</TableHead>
                       <TableHead>Ngày Ghi Danh</TableHead>
                       <TableHead>Trạng Thái Lớp</TableHead>
                       <TableHead>Trạng Thái Học</TableHead>
                       <TableHead className="text-right">Thao Tác</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {isStudentEnrollmentsLoading ? (
                       <TableRow><TableCell colSpan={6} className="text-center py-8 text-foreground-muted">Đang tải...</TableCell></TableRow>
                     ) : !studentEnrollments || studentEnrollments.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={6} className="py-8">
                           <EmptyState title="Học viên chưa ghi danh" description="Học viên này chưa tham gia lớp học nào." />
                         </TableCell>
                       </TableRow>
                     ) : (
                       studentEnrollments.map((e) => (
                         <TableRow key={e.id}>
                           <TableCell className="font-mono text-brand-600 dark:text-brand-400 font-medium">{e.classCode}</TableCell>
                           <TableCell className="font-semibold text-foreground">{e.className}</TableCell>
                           <TableCell className="text-foreground-muted">{e.enrolledAt}</TableCell>
                           <TableCell>
                             <Badge variant="neutral">{e.classStatus || 'N/A'}</Badge>
                           </TableCell>
                           <TableCell>
                             <Badge variant={getStatusBadgeVariant(e.status)}>{getStatusText(e.status)}</Badge>
                           </TableCell>
                           <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                               <Button variant="ghost" size="sm" onClick={() => handleOpenTransferDialog(e)} title="Chuyển lớp"><ArrowRightLeft size={16}/></Button>
                               <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => { setSelectedEnrollment(e); setIsConfirmDropOpen(true); }} title="Rút tên"><Trash2 size={16}/></Button>
                             </div>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </div>
            )}
         </div>
      )}

      {/* Enroll Modal */}
      <Modal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} title="Đăng ký Ghi danh mới" maxWidth="lg">
        <form onSubmit={enrollForm.handleSubmit(onEnrollSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Select label="Học viên *" {...enrollForm.register('studentId')} error={enrollForm.formState.errors.studentId?.message as string}>
              <option value="">-- Chọn Học viên --</option>
              {studentsList.map(s => <option key={s.id} value={s.id}>{s.studentCode} - {s.fullName}</option>)}
            </Select>
            <Select label="Lớp học *" {...enrollForm.register('courseClassId')} error={enrollForm.formState.errors.courseClassId?.message as string}>
              <option value="">-- Chọn Lớp học --</option>
              {classesList.filter(c => c.status === 'OPEN' || c.status === 'ONGOING').map(c => <option key={c.id} value={c.id}>{c.classCode} - {c.name}</option>)}
            </Select>
            <Input label="Ngày ghi danh *" type="date" {...enrollForm.register('enrolledAt')} error={enrollForm.formState.errors.enrolledAt?.message} />
            <Select label="Trạng thái ban đầu *" {...enrollForm.register('status')} error={enrollForm.formState.errors.status?.message}>
              <option value="ACTIVE">Đang học (Active)</option>
              <option value="PAUSE">Bảo lưu tạm thời</option>
            </Select>
            <Input label="Ghi chú thêm" {...enrollForm.register('note')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsEnrollOpen(false)}>Hủy</Button>
            <Button variant="primary" type="submit" isLoading={enrollMutation.isPending}>Lưu Ghi danh</Button>
          </div>
        </form>
      </Modal>

      {/* Transfer Modal */}
      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Chuyển lớp cho Học viên" maxWidth="lg">
        <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="p-3 bg-surface-hover/50 border border-border rounded-lg text-sm text-foreground-secondary">
               <div className="flex justify-between mb-1"><span className="text-foreground-muted">Học viên:</span> <span className="font-semibold text-foreground">{selectedEnrollment?.studentName} ({selectedEnrollment?.studentCode})</span></div>
               <div className="flex justify-between"><span className="text-foreground-muted">Lớp hiện tại:</span> <span className="font-semibold text-foreground">{selectedEnrollment?.className} ({selectedEnrollment?.classCode})</span></div>
            </div>
            
            <Select label="Lớp học mới (Chuyển đến) *" {...transferForm.register('toClassId')} error={transferForm.formState.errors.toClassId?.message as string}>
              <option value="">-- Chọn Lớp mới --</option>
              {classesList.filter(c => (c.status === 'OPEN' || c.status === 'ONGOING') && c.id !== selectedEnrollment?.courseClassId).map(c => <option key={c.id} value={c.id}>{c.classCode} - {c.name}</option>)}
            </Select>
            <Input label="Lý do chuyển lớp" {...transferForm.register('note')} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsTransferOpen(false)}>Hủy</Button>
            <Button variant="primary" type="submit" isLoading={transferMutation.isPending}>Thực hiện Chuyển</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmDropOpen}
        onClose={() => setIsConfirmDropOpen(false)}
        onConfirm={() => selectedEnrollment && dropMutation.mutate(selectedEnrollment.id)}
        title="Xác nhận Rút tên (Drop)"
        description={`Bạn có chắc chắn muốn rút tên học viên ${selectedEnrollment?.studentName} khỏi lớp ${selectedEnrollment?.className}? Học viên sẽ bị mất quyền lợi truy cập lớp này.`}
        isDanger
        isLoading={dropMutation.isPending}
      />
    </div>
  );
};
