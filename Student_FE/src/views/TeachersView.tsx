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
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  DollarSign,
  Award
} from 'lucide-react';
import { teachersApi } from '../features/teachers/teachers.api';
import type { TeacherResponse } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const teacherFormSchema = z.object({
  teacherCode: z.string().min(2, 'Mã giáo viên tối thiểu 2 ký tự'),
  fullName: z.string().min(2, 'Họ tên giáo viên tối thiểu 2 ký tự'),
  phone: z.string().min(9, 'Số điện thoại tối thiểu 9 số'),
  email: z.string().email('Email không đúng định dạng'),
  teacherRole: z.enum(['TEACHER', 'ASSISTANT', 'BOTH', 'MAIN']),
  status: z.string().min(1, 'Trạng thái là bắt buộc'),
  isActive: z.boolean(),
  dateOfBirth: z.string().min(1, 'Ngày sinh là bắt buộc'),
  salary: z.any(), // Handled programmatically
  weeklySlots: z.any(),
  address: z.string(),
  description: z.string(),
  workUnit: z.string(),
  experience: z.string(),
  achievement: z.string(),
  cccdImageUrl: z.string(),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const TeachersView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Modals States
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherResponse | null>(null);
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);

  // Custom Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

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
  const { data, isLoading } = useQuery({
    queryKey: ['teachers', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const activeStatus = statusFilter !== 'ALL' ? statusFilter : undefined;
      return teachersApi.search({
        search: debouncedSearch,
        status: activeStatus,
        page,
        size: pageSize,
      });
    },
  });

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================
  const upsertMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      const salVal = Number(values.salary) || 0;
      const slotsVal = Number(values.weeklySlots) || 0;

      const payload = {
        ...values,
        salary: salVal,
        weeklySlots: slotsVal,
      };

      if (editingTeacherId) {
        return teachersApi.update(editingTeacherId, payload);
      } else {
        return teachersApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      addToast(editingTeacherId ? 'Cập nhật giáo viên thành công!' : 'Tạo giáo viên thành công!', 'success');
      setIsUpsertOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi lưu thông tin.', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return teachersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      addToast('Đã xóa giáo viên thành công!', 'success');
      setIsConfirmDeleteOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi xóa giáo viên.', 'error');
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
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      teacherRole: 'TEACHER',
      status: 'ACTIVE',
      isActive: true,
      salary: 0,
      weeklySlots: 0,
    }
  });

  const onSubmitForm = (values: TeacherFormValues) => {
    const sal = Number(values.salary);
    if (isNaN(sal) || sal < 0) {
      addToast('Mức lương không hợp lệ!', 'error');
      return;
    }
    const slots = Number(values.weeklySlots);
    if (isNaN(slots) || slots < 0) {
      addToast('Số ca dạy/tuần không hợp lệ!', 'error');
      return;
    }
    upsertMutation.mutate(values);
  };

  const handleEditClick = (teacher: TeacherResponse) => {
    setEditingTeacherId(teacher.id);
    reset({
      teacherCode: teacher.teacherCode,
      fullName: teacher.fullName,
      phone: teacher.phone,
      email: teacher.email,
      teacherRole: teacher.teacherRole,
      status: teacher.status || 'ACTIVE',
      isActive: teacher.isActive !== false,
      dateOfBirth: teacher.dateOfBirth,
      salary: teacher.salary,
      weeklySlots: teacher.weeklySlots,
      address: teacher.address || '',
      description: teacher.description || '',
      workUnit: teacher.workUnit || '',
      experience: teacher.experience || '',
      achievement: teacher.achievement || '',
      cccdImageUrl: teacher.cccdImageUrl || '',
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingTeacherId(null);
    reset({
      teacherCode: `GV${Math.floor(100 + Math.random() * 900)}`,
      fullName: '',
      phone: '',
      email: '',
      teacherRole: 'TEACHER',
      status: 'ACTIVE',
      isActive: true,
      dateOfBirth: '',
      salary: 0,
      weeklySlots: 0,
      address: '',
      description: '',
      workUnit: '',
      experience: '',
      achievement: '',
      cccdImageUrl: '',
    });
    setIsUpsertOpen(true);
  };

  // Formatting currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const teachersList = data?.content || [];
  const totalPages = data?.totalPages || 0;

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
            <GraduationCap size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Quản lý Giáo viên</h2>
            <p className="text-slate-400 text-sm mt-1">
              Quản lý hồ sơ giáo viên, điều phối ca dạy học và theo dõi bảng lương giảng dạy.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm Giáo viên</span>
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
            placeholder="Tìm theo tên hoặc mã giáo viên..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'ACTIVE', 'RESIGNED'].map((filter) => (
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
              {filter === 'ACTIVE' && 'Đang làm việc'}
              {filter === 'RESIGNED' && 'Đã nghỉ việc'}
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
                <th className="py-4 px-6">Mã GV</th>
                <th className="py-4 px-6">Họ và Tên</th>
                <th className="py-4 px-6">Liên hệ</th>
                <th className="py-4 px-6">Vai trò</th>
                <th className="py-4 px-6">Lương cơ bản</th>
                <th className="py-4 px-6">Số ca/tuần</th>
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
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-10"></div></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-24"></div></td>
                    <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              )}

              {!isLoading && teachersList.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    Không tìm thấy giáo viên tương thích.
                  </td>
                </tr>
              )}

              {!isLoading && teachersList.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                    {teacher.teacherCode}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    {teacher.fullName}
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <div>
                      <span className="block text-slate-200 text-xs">{teacher.phone}</span>
                      <span className="block text-[11px] text-slate-500 overflow-hidden text-ellipsis max-w-[150px]">{teacher.email}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold">
                    {teacher.teacherRole === 'MAIN' || teacher.teacherRole === 'TEACHER' ? 'Giáo viên chính' : teacher.teacherRole === 'ASSISTANT' ? 'Trợ giảng' : 'Cả hai'}
                  </td>
                  <td className="py-4 px-6 font-mono text-brand-300 font-bold">
                    {formatVND(teacher.salary)}
                  </td>
                  <td className="py-4 px-6 text-center font-bold">
                    {teacher.weeklySlots} ca
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      teacher.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {teacher.status === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ việc'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setIsDetailsOpen(true);
                        }}
                        title="Chi tiết"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditClick(teacher)}
                        title="Sửa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTeacher(teacher);
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
      {isDetailsOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedTeacher.teacherCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Hồ sơ năng lực Giáo viên</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                {selectedTeacher.cccdImageUrl ? (
                  <img
                    src={selectedTeacher.cccdImageUrl}
                    alt="CCCD"
                    className="h-20 w-28 rounded-xl object-cover border border-white/10 shadow-lg shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                    <GraduationCap size={28} />
                  </div>
                )}
                <div className="text-center sm:text-left">
                  <h4 className="text-lg font-extrabold text-slate-100">{selectedTeacher.fullName}</h4>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Định mức giảng dạy: <span className="font-semibold text-brand-400">{selectedTeacher.weeklySlots} ca/tuần</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                    Thông tin liên hệ
                  </h5>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Ngày sinh</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar size={14} className="text-slate-400" />
                        {selectedTeacher.dateOfBirth}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Số điện thoại</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                        <Phone size={14} className="text-slate-400" />
                        {selectedTeacher.phone}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Email giảng viên</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5 overflow-hidden text-ellipsis">
                        <Mail size={14} className="text-slate-400" />
                        {selectedTeacher.email}
                      </span>
                    </div>
                    {selectedTeacher.address && (
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Địa chỉ</span>
                        <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                          <MapPin size={14} className="text-slate-400 shrink-0" />
                          {selectedTeacher.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                    Thông tin hợp đồng & Năng lực
                  </h5>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Mức lương cơ bản</span>
                      <span className="text-brand-400 font-extrabold flex items-center gap-1 mt-0.5 text-base">
                        <DollarSign size={15} />
                        {formatVND(selectedTeacher.salary)}
                      </span>
                    </div>
                    {selectedTeacher.workUnit && (
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Đơn vị công tác</span>
                        <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                          <Briefcase size={14} className="text-slate-400" />
                          {selectedTeacher.workUnit}
                        </span>
                      </div>
                    )}
                    {selectedTeacher.experience && (
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Kinh nghiệm giảng dạy</span>
                        <span className="text-slate-200 font-medium mt-0.5">{selectedTeacher.experience}</span>
                      </div>
                    )}
                    {selectedTeacher.achievement && (
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Chứng chỉ & Thành tích</span>
                        <span className="text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                          <Award size={14} className="text-emerald-400" />
                          {selectedTeacher.achievement}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedTeacher.description && (
                <div className="pt-4 border-t border-slate-800">
                  <span className="text-slate-500 text-xs block mb-1">Mô tả giới thiệu</span>
                  <p className="text-slate-300 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
                    {selectedTeacher.description}
                  </p>
                </div>
              )}
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
                {editingTeacherId ? 'Cập nhật Thông tin Giáo viên' : 'Thêm mới Giáo viên'}
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
                  Thông tin hồ sơ giảng viên
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mã giáo viên *</label>
                    <input
                      type="text"
                      {...register('teacherCode')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    {errors.teacherCode && <p className="text-red-400 text-xs mt-1">{errors.teacherCode.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Họ và Tên *</label>
                    <input
                      type="text"
                      {...register('fullName')}
                      placeholder="Nhập họ và tên giáo viên"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Số điện thoại *</label>
                    <input
                      type="text"
                      {...register('phone')}
                      placeholder="Số điện thoại cá nhân"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email liên lạc *</label>
                    <input
                      type="text"
                      {...register('email')}
                      placeholder="Địa chỉ Email"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày sinh *</label>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Vai trò giảng dạy *</label>
                    <select
                      {...register('teacherRole')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="TEACHER">Giáo viên chính</option>
                      <option value="ASSISTANT">Trợ giảng</option>
                      <option value="BOTH">Cả hai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mức lương cơ bản (VND) *</label>
                    <input
                      type="number"
                      {...register('salary')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Số ca dạy tiêu chuẩn/tuần *</label>
                    <input
                      type="number"
                      {...register('weeklySlots')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Đơn vị công tác chính</label>
                    <input
                      type="text"
                      {...register('workUnit')}
                      placeholder="Trường Đại học / Đơn vị cũ"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trạng thái công tác *</label>
                    <select
                      {...register('status')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="ACTIVE">Đang làm việc</option>
                      <option value="RESIGNED">Đã nghỉ việc</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Đường dẫn ảnh thẻ / CCCD</label>
                    <input
                      type="text"
                      {...register('cccdImageUrl')}
                      placeholder="https://..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Địa chỉ thường trú</label>
                    <input
                      type="text"
                      {...register('address')}
                      placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Kinh nghiệm giảng dạy</label>
                    <input
                      type="text"
                      {...register('experience')}
                      placeholder="Ví dụ: 3 năm giảng dạy IELTS tại đại học..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Chứng chỉ & Thành tích</label>
                    <input
                      type="text"
                      {...register('achievement')}
                      placeholder="Ví dụ: IELTS 8.5, TESOL Cert, Giáo viên dạy giỏi..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Giới thiệu bản thân</label>
                    <textarea
                      rows={2}
                      {...register('description')}
                      placeholder="Giới thiệu nhanh về phương pháp giảng dạy..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
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
                    'Lưu hồ sơ'
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
      {isConfirmDeleteOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Xóa hồ sơ giáo viên</h3>
              <p className="text-slate-400 text-xs mt-2">
                Bạn có chắc chắn muốn xóa hồ sơ của <span className="font-bold text-red-400">"{selectedTeacher.fullName}"</span>? Dữ liệu lịch dạy có thể bị ảnh hưởng.
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
                onClick={() => deleteMutation.mutate(selectedTeacher.id)}
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
export default TeachersView;
