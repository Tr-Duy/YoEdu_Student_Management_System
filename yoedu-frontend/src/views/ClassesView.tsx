import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  School,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  DoorOpen,
  UserCheck
} from 'lucide-react';
import { classesApi } from '../features/classes/classes.api';
import { referenceApi } from '../features/reference/reference.api';
import { coursesApi } from '../features/courses/courses.api';
import type { CourseClassResponse, ClassStatus } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const classFormSchema = z.object({
  classCode: z.string().min(2, 'Mã lớp học tối thiểu 2 ký tự'),
  name: z.string().min(2, 'Tên lớp học tối thiểu 2 ký tự'),
  courseId: z.any(), // Coerced on submit
  roomId: z.any(), // Coerced on submit
  scheduleSlotId: z.any(), // Coerced on submit
  mainTeacherId: z.any(), // Coerced on submit
  assistantTeacherId: z.any(), // Coerced or null
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  maxStudents: z.any(), // Coerced
  tuitionFee: z.any(), // Coerced
  status: z.enum(['OPEN', 'ONGOING', 'CLOSED', 'FULL']),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const ClassesView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Dialog & Modal States
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<CourseClassResponse | null>(null);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);

  // Custom Toasts State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Debounce Search Term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset page on search
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
  
  // 1. Fetch Course Classes (search uses pageable object)
  const { data: classesData, isLoading } = useQuery({
    queryKey: ['courseClasses', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const activeStatus = statusFilter !== 'ALL' ? (statusFilter as ClassStatus) : undefined;
      return classesApi.search({
        search: debouncedSearch,
        status: activeStatus,
        page,
        size: pageSize,
      });
    },
  });

  // 2. Fetch Reference Data (Only active when form is open)
  const { data: coursesList } = useQuery({
    queryKey: ['reference-courses'],
    queryFn: () => coursesApi.getAll(),
    enabled: isUpsertOpen,
  });

  const { data: teachersList } = useQuery({
    queryKey: ['reference-teachers'],
    queryFn: () => referenceApi.getTeachers(),
    enabled: isUpsertOpen,
  });

  const { data: roomsList } = useQuery({
    queryKey: ['reference-rooms'],
    queryFn: () => referenceApi.getRooms(),
    enabled: isUpsertOpen,
  });

  const { data: scheduleSlotsList } = useQuery({
    queryKey: ['reference-scheduleSlots'],
    queryFn: () => referenceApi.getScheduleSlots(),
    enabled: isUpsertOpen,
  });

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================
  
  // 1. Create/Update Class Mutation
  const upsertMutation = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      const courseIdNum = Number(values.courseId) || 0;
      const roomIdNum = Number(values.roomId) || 0;
      const scheduleSlotIdNum = Number(values.scheduleSlotId) || 0;
      const mainTeacherIdNum = Number(values.mainTeacherId) || 0;
      const assistantTeacherIdNum = values.assistantTeacherId && values.assistantTeacherId !== 'null'
        ? Number(values.assistantTeacherId)
        : null;
      const maxStudentsNum = Number(values.maxStudents) || 20;
      const tuitionFeeNum = Number(values.tuitionFee) || 0;

      const payload = {
        classCode: values.classCode,
        name: values.name,
        courseId: courseIdNum,
        roomId: roomIdNum,
        scheduleSlotId: scheduleSlotIdNum,
        mainTeacherId: mainTeacherIdNum,
        assistantTeacherId: assistantTeacherIdNum,
        startDate: values.startDate,
        endDate: values.endDate,
        maxStudents: maxStudentsNum,
        tuitionFee: tuitionFeeNum,
        status: values.status,
      };

      if (editingClassId) {
        return classesApi.update(editingClassId, payload);
      } else {
        return classesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseClasses'] });
      addToast(editingClassId ? 'Cập nhật lớp học thành công!' : 'Tạo mới lớp học thành công!', 'success');
      setIsUpsertOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.', 'error');
    }
  });

  // 2. Delete Class Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return classesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseClasses'] });
      addToast('Đã xóa lớp học thành công!', 'success');
      setIsConfirmDeleteOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi xóa lớp học.', 'error');
    }
  });

  // ==========================================
  // REACT HOOK FORM SETUP
  // ==========================================
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      classCode: '',
      name: '',
      courseId: '',
      roomId: '',
      scheduleSlotId: '',
      mainTeacherId: '',
      assistantTeacherId: 'null',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxStudents: 20,
      tuitionFee: 1500000,
      status: 'OPEN',
    }
  });

  const onSubmitForm = (values: ClassFormValues) => {
    if (!values.courseId || values.courseId === '') {
      addToast('Môn học là bắt buộc!', 'error');
      return;
    }
    if (!values.roomId || values.roomId === '') {
      addToast('Phòng học là bắt buộc!', 'error');
      return;
    }
    if (!values.scheduleSlotId || values.scheduleSlotId === '') {
      addToast('Ca học là bắt buộc!', 'error');
      return;
    }
    if (!values.mainTeacherId || values.mainTeacherId === '') {
      addToast('Giáo viên chủ nhiệm là bắt buộc!', 'error');
      return;
    }

    const maxStd = Number(values.maxStudents);
    if (isNaN(maxStd) || maxStd <= 0) {
      addToast('Sĩ số tối đa phải lớn hơn 0!', 'error');
      return;
    }

    const fee = Number(values.tuitionFee);
    if (isNaN(fee) || fee < 0) {
      addToast('Học phí lớp học phải lớn hơn hoặc bằng 0!', 'error');
      return;
    }

    // Check dates order
    if (new Date(values.startDate) > new Date(values.endDate)) {
      addToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'error');
      return;
    }

    upsertMutation.mutate(values);
  };

  const handleEditClick = (cClass: CourseClassResponse) => {
    setEditingClassId(cClass.id);
    reset({
      classCode: cClass.classCode,
      name: cClass.name,
      courseId: cClass.courseId.toString(),
      roomId: cClass.roomId.toString(),
      scheduleSlotId: cClass.scheduleSlotId.toString(),
      mainTeacherId: cClass.mainTeacherId.toString(),
      assistantTeacherId: cClass.assistantTeacherId ? cClass.assistantTeacherId.toString() : 'null',
      startDate: cClass.startDate,
      endDate: cClass.endDate,
      maxStudents: cClass.maxStudents,
      tuitionFee: cClass.tuitionFee,
      status: cClass.status,
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingClassId(null);
    reset({
      classCode: `LH${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      courseId: '',
      roomId: '',
      scheduleSlotId: '',
      mainTeacherId: '',
      assistantTeacherId: 'null',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      maxStudents: 20,
      tuitionFee: 1500000,
      status: 'OPEN',
    });
    setIsUpsertOpen(true);
  };

  // Currency & Date formatting helpers
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const classesList = classesData?.content || [];
  const totalPages = classesData?.totalPages || 0;



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
            <School size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Quản lý Lớp học</h2>
            <p className="text-slate-400 text-sm mt-1">
              Quản lý thời khóa biểu các lớp học, chỉ định phòng học, bố trí giáo viên chủ nhiệm và trợ giảng.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Mở Lớp học</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between border border-white/5">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã lớp học..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'OPEN', 'ONGOING', 'CLOSED', 'FULL'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatusFilter(filter);
                setPage(0);
              }}
              className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                  : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              {filter === 'ALL' && 'Tất cả'}
              {filter === 'OPEN' && 'Sắp mở (OPEN)'}
              {filter === 'ONGOING' && 'Đang dạy (ONGOING)'}
              {filter === 'CLOSED' && 'Đã kết thúc (CLOSED)'}
              {filter === 'FULL' && 'Đã đầy (FULL)'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Mã Lớp</th>
                <th className="py-4 px-6">Tên Lớp học</th>
                <th className="py-4 px-6">Môn học</th>
                <th className="py-4 px-6">Phòng & Ca</th>
                <th className="py-4 px-6">Giảng viên</th>
                <th className="py-4 px-6">Thời hạn</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
              {isLoading && (
                [...Array(pageSize)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-36"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-24"></div></td>
                    <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              )}

              {!isLoading && classesList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    Không tìm thấy lớp học nào phù hợp.
                  </td>
                </tr>
              )}

              {!isLoading && classesList.map((cClass) => (
                <tr key={cClass.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                    {cClass.classCode}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    {cClass.name}
                    <span className="block text-[11px] text-slate-400 font-semibold mt-0.5">
                      Sĩ số tối đa: {cClass.maxStudents} học viên
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    <div>
                      <span className="block text-slate-200 font-semibold">{cClass.courseName}</span>
                      <span className="block text-[11px] text-slate-500 font-mono font-bold">{formatVND(cClass.tuitionFee)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <span className="block text-slate-200 text-xs font-semibold flex items-center gap-1">
                        <DoorOpen size={13} className="text-slate-400 shrink-0" />
                        {cClass.roomName}
                      </span>
                      <span className="block text-[11px] text-brand-300 font-bold flex items-center gap-1 mt-0.5">
                        <Clock size={12} className="text-brand-400/80 shrink-0" />
                        {cClass.scheduleLabel}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <div>
                      <span className="block text-slate-200 text-xs font-medium">{cClass.mainTeacherName}</span>
                      {cClass.assistantTeacherName && (
                        <span className="block text-[10px] text-slate-500">Trợ giảng: {cClass.assistantTeacherName}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-400 text-xs font-semibold">
                    <span className="block">{formatDate(cClass.startDate)}</span>
                    <span className="block text-slate-500 font-normal">đến {formatDate(cClass.endDate)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      cClass.status === 'OPEN'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : cClass.status === 'ONGOING'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : cClass.status === 'FULL'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {cClass.status === 'OPEN' && 'Sắp mở (OPEN)'}
                      {cClass.status === 'ONGOING' && 'Đang dạy'}
                      {cClass.status === 'FULL' && 'Đã đầy (FULL)'}
                      {cClass.status === 'CLOSED' && 'Đã kết thúc'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedClass(cClass);
                          setIsDetailsOpen(true);
                        }}
                        title="Chi tiết"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditClick(cClass)}
                        title="Sửa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClass(cClass);
                          setIsConfirmDeleteOpen(true);
                        }}
                        title="Xóa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-900/15">
            <span className="text-xs text-slate-500">
              Trang <span className="font-bold text-slate-400">{page + 1}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => prev + 1)}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL: VIEW DETAILS
          ========================================== */}
      {isDetailsOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedClass.classCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Hồ sơ Lớp học</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-4.5 rounded-2xl bg-slate-900/40 border border-white/5">
                <span className="text-slate-500 text-xs block">Tên lớp học</span>
                <h4 className="text-lg font-extrabold text-slate-100 mt-0.5">{selectedClass.name}</h4>
                <div className="mt-2.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                    selectedClass.status === 'OPEN'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      : selectedClass.status === 'ONGOING'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : selectedClass.status === 'FULL'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {selectedClass.status === 'OPEN' && 'Sắp khai giảng'}
                    {selectedClass.status === 'ONGOING' && 'Đang giảng dạy'}
                    {selectedClass.status === 'FULL' && 'Đã đủ sĩ số (FULL)'}
                    {selectedClass.status === 'CLOSED' && 'Đã kết thúc'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                    Thông tin Đào tạo
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 text-xs block">Khóa học đăng ký</span>
                      <span className="text-slate-200 font-bold block mt-0.5">{selectedClass.courseName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Học phí định mức</span>
                      <span className="text-brand-300 font-black block mt-0.5">{formatVND(selectedClass.tuitionFee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Thời gian học tập</span>
                      <span className="text-slate-300 font-semibold block mt-0.5 flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-500" />
                        Từ {formatDate(selectedClass.startDate)} đến {formatDate(selectedClass.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                    Bố trí Thời khóa biểu
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 text-xs block">Phòng học được bố trí</span>
                      <span className="text-slate-200 font-bold block mt-0.5 flex items-center gap-1.5">
                        <DoorOpen size={14} className="text-slate-400" />
                        {selectedClass.roomName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Khung ca học dạy</span>
                      <span className="text-slate-200 font-bold block mt-0.5 flex items-center gap-1.5">
                        <Clock size={14} className="text-brand-400" />
                        {selectedClass.scheduleLabel}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">Giáo viên chủ nhiệm</span>
                      <span className="text-slate-200 font-bold block mt-0.5 flex items-center gap-1.5">
                        <UserCheck size={14} className="text-slate-400" />
                        {selectedClass.mainTeacherName}
                      </span>
                    </div>
                    {selectedClass.assistantTeacherName && (
                      <div>
                        <span className="text-slate-500 text-xs block">Trợ giảng đồng hành</span>
                        <span className="text-slate-300 font-medium block mt-0.5">{selectedClass.assistantTeacherName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30 flex justify-end">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-2.5 transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CREATE / UPDATE FORM
          ========================================== */}
      {isUpsertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">
                {editingClassId ? 'Cập nhật Lớp học' : 'Khai báo Mở lớp học'}
              </h3>
              <button
                onClick={() => setIsUpsertOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Cấu hình hành chính lớp học
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mã lớp học *</label>
                    <input
                      type="text"
                      {...register('classCode')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    {errors.classCode && <p className="text-red-400 text-xs mt-1">{errors.classCode.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Tên lớp học *</label>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Ví dụ: Scratch A, IELTS C1, v.v."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Môn học / Khóa học *</label>
                    <select
                      {...register('courseId')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Chọn Khóa học --</option>
                      {coursesList?.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.name} ({course.courseCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Học phí lớp học (VND) *</label>
                    <input
                      type="number"
                      {...register('tuitionFee')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Phòng học được bố trí *</label>
                    <select
                      {...register('roomId')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Chọn Phòng học --</option>
                      {roomsList?.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} (Sức chứa: {room.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ca học cố định *</label>
                    <select
                      {...register('scheduleSlotId')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Chọn Ca học --</option>
                      {scheduleSlotsList?.map((slot) => {
                        const dayLabel = slot.weekday === 8 ? 'Chủ Nhật' : `Thứ ${slot.weekday}`;
                        return (
                          <option key={slot.id} value={slot.id}>
                            {slot.slotCode} ({dayLabel}: {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Giáo viên chủ nhiệm *</label>
                    <select
                      {...register('mainTeacherId')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Chọn Giáo viên --</option>
                      {teachersList?.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.fullName} ({teacher.teacherCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trợ giảng đồng hành</label>
                    <select
                      {...register('assistantTeacherId')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="null">-- Không có trợ giảng --</option>
                      {teachersList?.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.fullName} ({teacher.teacherCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày bắt đầu lớp học *</label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày kết thúc dự kiến *</label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Sĩ số tối đa *</label>
                    <input
                      type="number"
                      {...register('maxStudents')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trạng thái vận hành *</label>
                    <select
                      {...register('status')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="OPEN">Sắp mở (OPEN)</option>
                      <option value="ONGOING">Đang giảng dạy (ONGOING)</option>
                      <option value="FULL">Đã đầy sĩ số (FULL)</option>
                      <option value="CLOSED">Đã kết thúc (CLOSED)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsUpsertOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-3 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending}
                  className="bg-brand-600 hover:bg-brand-500 disabled:bg-brand-800 text-white rounded-xl text-xs font-bold px-6 py-3 transition-all cursor-pointer flex items-center gap-2"
                >
                  {upsertMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    'Lưu lớp học'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: DELETE CONFIRMATION
          ========================================== */}
      {isConfirmDeleteOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Xóa lớp học</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa lớp học <span className="font-bold text-red-400">"{selectedClass.name}"</span>? Các lịch sử đăng ký học viên có thể bị xóa hoặc mất liên kết.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selectedClass.id)}
                className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'Xác nhận Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassesView;
