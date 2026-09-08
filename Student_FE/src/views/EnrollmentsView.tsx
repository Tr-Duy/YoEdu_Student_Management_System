import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Trash2,
  X,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Calendar,
  Users,
  Clock,
  DoorOpen,
  DollarSign,
  GraduationCap,
  ArrowRightLeft
} from 'lucide-react';
import { enrollmentsApi } from '../features/enrollments/enrollments.api';
import { classesApi } from '../features/classes/classes.api';
import { studentsApi } from '../features/students/students.api';
import type { EnrollmentResponse, EnrollmentStatus } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMAS WITH ZOD
// ==========================================
const enrollmentFormSchema = z.object({
  studentId: z.any(), // Coerced on submit
  courseClassId: z.any(), // Coerced on submit
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

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const EnrollmentsView: React.FC = () => {
  const queryClient = useQueryClient();

  // Active Tab: 'class' (By Class) or 'student' (By Student)
  const [activeTab, setActiveTab] = useState<'class' | 'student'>('class');

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Dialog & Modal States
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isConfirmDropOpen, setIsConfirmDropOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentResponse | null>(null);

  // Custom Toasts State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add Toast helper
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ==========================================
  // TANSTACK QUERY - DATA FETCHING
  // ==========================================

  // 1. Fetch Students (for dropdown list)
  const { data: studentsData } = useQuery({
    queryKey: ['enrollment-students'],
    queryFn: () => studentsApi.search({ size: 150 }),
  });
  const studentsList = studentsData?.content || [];

  // 2. Fetch Classes (for dropdown list)
  const { data: classesData } = useQuery({
    queryKey: ['enrollment-classes'],
    queryFn: () => classesApi.search({ size: 100 }),
  });
  const classesList = classesData?.content || [];

  // 3. Fetch enrollments by selected Class
  const { data: classEnrollments, isLoading: isClassEnrollmentsLoading } = useQuery<EnrollmentResponse[]>({
    queryKey: ['class-enrollments', selectedClassId],
    queryFn: () => enrollmentsApi.getByClassId(Number(selectedClassId)),
    enabled: activeTab === 'class' && !!selectedClassId,
  });

  // 4. Fetch enrollments by selected Student
  const { data: studentEnrollments, isLoading: isStudentEnrollmentsLoading } = useQuery<EnrollmentResponse[]>({
    queryKey: ['student-enrollments', selectedStudentId],
    queryFn: () => enrollmentsApi.getByStudentId(Number(selectedStudentId)),
    enabled: activeTab === 'student' && !!selectedStudentId,
  });

  // Find info of the currently selected class
  const activeClassDetails = classesList.find(c => c.id === Number(selectedClassId));
  // Find info of the currently selected student
  const activeStudentDetails = studentsList.find(s => s.id === Number(selectedStudentId));

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================

  // 1. Enroll Student Mutation
  const enrollMutation = useMutation({
    mutationFn: (values: EnrollmentFormValues) => {
      const payload = {
        studentId: Number(values.studentId),
        courseClassId: Number(values.courseClassId),
        enrolledAt: values.enrolledAt,
        status: values.status as EnrollmentStatus,
        note: values.note || '',
      };
      return enrollmentsApi.enroll(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      addToast('Ghi danh học viên thành công!', 'success');
      setIsEnrollOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra khi đăng ký ghi danh.', 'error');
    }
  });

  // 2. Transfer Student Mutation
  const transferMutation = useMutation({
    mutationFn: (values: TransferFormValues) => {
      const payload = {
        studentId: Number(values.studentId),
        fromClassId: Number(values.fromClassId),
        toClassId: Number(values.toClassId),
        note: values.note || '',
      };
      return enrollmentsApi.transfer(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      addToast('Chuyển lớp học thành công!', 'success');
      setIsTransferOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra khi chuyển lớp.', 'error');
    }
  });

  // 3. Drop Student Mutation
  const dropMutation = useMutation({
    mutationFn: (id: number) => {
      return enrollmentsApi.drop(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
      addToast('Rút tên (Drop) học viên khỏi lớp thành công!', 'success');
      setIsConfirmDropOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi rút tên học viên.', 'error');
    }
  });

  // ==========================================
  // FORMS CONFIGURATIONS
  // ==========================================
  const enrollForm = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentFormSchema),
    defaultValues: {
      studentId: '',
      courseClassId: '',
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      note: '',
    }
  });

  const transferForm = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      studentId: '',
      fromClassId: '',
      toClassId: '',
      note: '',
    }
  });

  const onEnrollSubmit = (values: EnrollmentFormValues) => {
    if (!values.studentId || values.studentId === '') {
      addToast('Vui lòng chọn học viên!', 'error');
      return;
    }
    if (!values.courseClassId || values.courseClassId === '') {
      addToast('Vui lòng chọn lớp học!', 'error');
      return;
    }
    enrollMutation.mutate(values);
  };

  const onTransferSubmit = (values: TransferFormValues) => {
    if (!values.toClassId || values.toClassId === '') {
      addToast('Vui lòng chọn lớp học mới!', 'error');
      return;
    }
    if (Number(values.fromClassId) === Number(values.toClassId)) {
      addToast('Lớp học mới phải khác lớp học hiện tại!', 'error');
      return;
    }
    transferMutation.mutate(values);
  };

  const handleOpenEnrollDialog = () => {
    enrollForm.reset({
      studentId: activeTab === 'student' ? selectedStudentId : '',
      courseClassId: activeTab === 'class' ? selectedClassId : '',
      enrolledAt: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      note: '',
    });
    setIsEnrollOpen(true);
  };

  const handleOpenTransferDialog = (enrollment: EnrollmentResponse) => {
    setSelectedEnrollment(enrollment);
    transferForm.reset({
      studentId: enrollment.studentId.toString(),
      fromClassId: enrollment.courseClassId.toString(),
      toClassId: '',
      note: '',
    });
    setIsTransferOpen(true);
  };

  // Currency & Date formatting helpers
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="space-y-6 relative">
      {/* Toasts */}
      <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`glass px-5 py-4 rounded-2xl flex items-center gap-3 shadow-xl border animate-slide-in max-w-sm ${
              toast.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-950/40 text-emerald-400'
                : 'border-red-500/25 bg-red-950/40 text-red-400'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} className="shrink-0" />
            ) : (
              <AlertCircle size={20} className="shrink-0" />
            )}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Header Panel */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            <UserPlus size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Ghi danh & Đăng ký Lớp</h2>
            <p className="text-slate-400 text-sm mt-1">
              Thực hiện ghi danh học viên mới vào lớp, quản lý điều phối chuyên môn chuyển lớp và hủy ghi danh.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenEnrollDialog}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Ghi danh Học viên</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('class')}
          className={`pb-4 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'class' ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Theo Lớp học
          {activeTab === 'class' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"></div>
          )}
        </button>

        <button
          onClick={() => setActiveTab('student')}
          className={`pb-4 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'student' ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Theo Học viên
          {activeTab === 'student' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"></div>
          )}
        </button>
      </div>

      {/* Dynamic Filter selector and Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector Panel */}
        <div className="lg:col-span-1 glass rounded-2xl p-5 border border-white/5 space-y-4 h-fit">
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide pb-2 border-b border-slate-800">
            {activeTab === 'class' ? 'Chọn lớp học vận hành' : 'Chọn học viên cần tra cứu'}
          </h4>

          {activeTab === 'class' ? (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Lớp học *</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Chọn lớp học --</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.classCode})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Học viên *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Chọn học viên --</option>
                {studentsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Details Overview if selected */}
          {activeTab === 'class' && activeClassDetails && (
            <div className="pt-2.5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                <span className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Chi tiết lớp</span>
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <GraduationCap size={14} className="text-slate-400" />
                  Môn: {activeClassDetails.courseName}
                </div>
                <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
                  <DoorOpen size={14} className="text-slate-400" />
                  Phòng: {activeClassDetails.roomName}
                </div>
                <div className="flex items-center gap-1.5 text-brand-300 font-bold">
                  <Clock size={14} className="text-brand-400" />
                  Ca: {activeClassDetails.scheduleLabel}
                </div>
                <div className="flex items-center gap-1.5 text-slate-200">
                  <Users size={14} className="text-slate-400" />
                  Sĩ số tối đa: {activeClassDetails.maxStudents} học viên
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                  <DollarSign size={14} className="text-emerald-500" />
                  Học phí: {formatVND(activeClassDetails.tuitionFee)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'student' && activeStudentDetails && (
            <div className="pt-2.5 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                <span className="block text-slate-500 uppercase tracking-wider text-[10px] font-bold">Chi tiết học viên</span>
                <div className="text-slate-100 font-extrabold text-sm">{activeStudentDetails.fullName}</div>
                <div className="text-slate-400">Mã HV: <span className="font-mono text-brand-400 font-bold">{activeStudentDetails.studentCode}</span></div>
                <div className="text-slate-400">Lớp học: <span className="text-slate-200 font-semibold">{activeStudentDetails.gradeLevel}</span></div>
                <div className="text-slate-400">Trạng thái: 
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 ml-1.5 text-[10px] font-bold ${
                    activeStudentDetails.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {activeStudentDetails.status === 'ACTIVE' ? 'Đang học' : 'Tạm dừng'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data List Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-5 bg-slate-900/30 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {activeTab === 'class' ? 'Học viên đã ghi danh vào lớp' : 'Danh sách lớp học đã ghi danh'}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">
                      {activeTab === 'class' ? 'Học viên' : 'Lớp học'}
                    </th>
                    <th className="py-4 px-6">Ngày Ghi danh</th>
                    <th className="py-4 px-6">Trạng thái</th>
                    <th className="py-4 px-6">Ghi chú</th>
                    <th className="py-4 px-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                  {/* Class flow loading states */}
                  {activeTab === 'class' && isClassEnrollmentsLoading && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 animate-pulse">
                        Đang tải danh sách học viên...
                      </td>
                    </tr>
                  )}

                  {/* Student flow loading states */}
                  {activeTab === 'student' && isStudentEnrollmentsLoading && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 animate-pulse">
                        Đang tải danh sách lớp học...
                      </td>
                    </tr>
                  )}

                  {/* Selection required prompts */}
                  {activeTab === 'class' && !selectedClassId && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Vui lòng chọn một lớp học để xem danh sách học viên.
                      </td>
                    </tr>
                  )}

                  {activeTab === 'student' && !selectedStudentId && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500">
                        Vui lòng chọn một học viên để xem danh sách lớp học đã đăng ký.
                      </td>
                    </tr>
                  )}

                  {/* Empty data lists */}
                  {activeTab === 'class' && selectedClassId && !isClassEnrollmentsLoading && classEnrollments?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-500 font-medium">
                        Lớp học chưa có học viên nào ghi danh.
                      </td>
                    </tr>
                  )}

                  {activeTab === 'student' && selectedStudentId && !isStudentEnrollmentsLoading && studentEnrollments?.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-500 font-medium">
                        Học viên chưa ghi danh vào lớp học nào.
                      </td>
                    </tr>
                  )}

                  {/* Render class-based enrollment lists */}
                  {activeTab === 'class' && selectedClassId && !isClassEnrollmentsLoading && classEnrollments?.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-slate-900/20 transition-all duration-150">
                      <td className="py-4.5 px-6 font-bold text-slate-100">
                        {enrollment.studentName}
                      </td>
                      <td className="py-4.5 px-6 font-mono text-xs text-slate-400 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} className="text-slate-500" />
                          {formatDate(enrollment.enrolledAt)}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          enrollment.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : enrollment.status === 'PAUSED' || enrollment.status === 'PAUSE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : enrollment.status === 'COMPLETED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {enrollment.status === 'ACTIVE' && 'Đang học'}
                          {(enrollment.status === 'PAUSED' || enrollment.status === 'PAUSE') && 'Tạm ngưng'}
                          {enrollment.status === 'COMPLETED' && 'Hoàn thành'}
                          {enrollment.status === 'DROPPED' && 'Hủy học (Dropped)'}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-slate-400 text-xs max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {enrollment.note || '-'}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenTransferDialog(enrollment)}
                            disabled={enrollment.status === 'DROPPED' || enrollment.status === 'COMPLETED'}
                            title="Chuyển lớp"
                            className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 disabled:opacity-20 transition-all cursor-pointer"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setIsConfirmDropOpen(true);
                            }}
                            disabled={enrollment.status === 'DROPPED'}
                            title="Rút học (Drop)"
                            className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-red-400 hover:bg-slate-800 disabled:opacity-20 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Render student-based enrollment lists */}
                  {activeTab === 'student' && selectedStudentId && !isStudentEnrollmentsLoading && studentEnrollments?.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-slate-900/20 transition-all duration-150">
                      <td className="py-4.5 px-6 font-bold text-slate-100">
                        {enrollment.className}
                      </td>
                      <td className="py-4.5 px-6 font-mono text-xs text-slate-400 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} className="text-slate-500" />
                          {formatDate(enrollment.enrolledAt)}
                        </span>
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          enrollment.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : enrollment.status === 'PAUSED' || enrollment.status === 'PAUSE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : enrollment.status === 'COMPLETED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {enrollment.status === 'ACTIVE' && 'Đang học'}
                          {(enrollment.status === 'PAUSED' || enrollment.status === 'PAUSE') && 'Tạm ngưng'}
                          {enrollment.status === 'COMPLETED' && 'Hoàn thành'}
                          {enrollment.status === 'DROPPED' && 'Hủy học (Dropped)'}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-slate-400 text-xs max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {enrollment.note || '-'}
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenTransferDialog(enrollment)}
                            disabled={enrollment.status === 'DROPPED' || enrollment.status === 'COMPLETED'}
                            title="Chuyển lớp"
                            className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 disabled:opacity-20 transition-all cursor-pointer"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setIsConfirmDropOpen(true);
                            }}
                            disabled={enrollment.status === 'DROPPED'}
                            title="Rút học (Drop)"
                            className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-red-400 hover:bg-slate-800 disabled:opacity-20 transition-all cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL: NEW ENROLLMENT FORM
          ========================================== */}
      {isEnrollOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">Ghi danh Học viên vào Lớp</h3>
              <button
                onClick={() => setIsEnrollOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={enrollForm.handleSubmit(onEnrollSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Khai báo đăng ký học tập
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Học viên đăng ký *</label>
                  <select
                    {...enrollForm.register('studentId')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Chọn Học viên --</option>
                    {studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Lớp học ghi danh *</label>
                  <select
                    {...enrollForm.register('courseClassId')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Chọn Lớp học --</option>
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.classCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày ghi danh học *</label>
                    <input
                      type="date"
                      {...enrollForm.register('enrolledAt')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trạng thái đăng ký *</label>
                    <select
                      {...enrollForm.register('status')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="ACTIVE">Đang học (ACTIVE)</option>
                      <option value="PAUSED">Tạm ngưng (PAUSE)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ghi chú khóa học</label>
                  <textarea
                    rows={3}
                    {...enrollForm.register('note')}
                    placeholder="Ví dụ: Học bổng 10%, đóng học phí trước..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsEnrollOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-3 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={enrollMutation.isPending}
                  className="bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-xl text-xs font-bold px-6 py-3 transition-all cursor-pointer flex items-center gap-2"
                >
                  {enrollMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Đăng ký Ghi danh'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: TRANSFER CLASS FORM
          ========================================== */}
      {isTransferOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50 flex items-center gap-1.5">
                <ArrowRightLeft size={20} className="text-brand-400" />
                Thủ tục chuyển lớp học
              </h3>
              <button
                onClick={() => setIsTransferOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={transferForm.handleSubmit(onTransferSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-xl text-xs space-y-1.5">
                  <div className="text-slate-400">Học viên thực hiện: <span className="text-slate-200 font-bold">{selectedEnrollment.studentName}</span></div>
                  <div className="text-slate-400">Lớp hiện tại: <span className="text-slate-200 font-semibold">{selectedEnrollment.className}</span></div>
                </div>

                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Điều phối chuyển lớp mới
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Lớp học mới chuyển đến *</label>
                  <select
                    {...transferForm.register('toClassId')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value="">-- Chọn lớp học mới --</option>
                    {classesList
                      .filter(c => c.id !== selectedEnrollment.courseClassId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.classCode})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Lý do chuyển lớp học</label>
                  <textarea
                    rows={3}
                    {...transferForm.register('note')}
                    placeholder="Nhập lý do chuyển đổi lớp học..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-3 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-xl text-xs font-bold px-6 py-3 transition-all cursor-pointer flex items-center gap-2"
                >
                  {transferMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Xác nhận Chuyển lớp'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CONFIRM DROP ENROLLMENT
          ========================================== */}
      {isConfirmDropOpen && selectedEnrollment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Rút tên học viên (Drop)</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
                Bạn có chắc chắn muốn rút học viên <span className="font-bold text-red-400">"{selectedEnrollment.studentName}"</span> khỏi lớp <span className="font-bold text-slate-200">"{selectedEnrollment.className}"</span>? Trạng thái ghi danh của học viên sẽ chuyển thành Hủy học (DROPPED).
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmDropOpen(false)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={dropMutation.isPending}
                onClick={() => dropMutation.mutate(selectedEnrollment.id)}
                className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {dropMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Xác nhận Rút'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentsView;
