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
  BookOpen,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { coursesApi } from '../features/courses/courses.api';
import type { CourseResponse } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const courseFormSchema = z.object({
  courseCode: z.string().min(2, 'Mã môn học tối thiểu 2 ký tự'),
  name: z.string().min(2, 'Tên môn học tối thiểu 2 ký tự'),
  description: z.string().min(1, 'Mô tả môn học là bắt buộc'),
  durationMonths: z.any(), // Coerced on submit
  basePrice: z.any(), // Coerced on submit
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const CoursesView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Dialog & Modal States
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

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
  
  // Fetch Courses (getAll returns CourseResponse[] directly)
  const { data: coursesData, isLoading } = useQuery<CourseResponse[]>({
    queryKey: ['courses', debouncedSearch],
    queryFn: async () => {
      return coursesApi.getAll({ search: debouncedSearch });
    },
  });

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================
  
  // 1. Create/Update Course Mutation
  const upsertMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const durationVal = Number(values.durationMonths) || 0;
      const basePriceVal = Number(values.basePrice) || 0;

      const payload = {
        courseCode: values.courseCode,
        name: values.name,
        description: values.description,
        durationMonths: durationVal,
        basePrice: basePriceVal,
      };

      if (editingCourseId) {
        return coursesApi.update(editingCourseId, payload);
      } else {
        return coursesApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast(editingCourseId ? 'Cập nhật khóa học thành công!' : 'Tạo mới khóa học thành công!', 'success');
      setIsUpsertOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.', 'error');
    }
  });

  // 2. Delete Course Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return coursesApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast('Đã xóa khóa học thành công!', 'success');
      setIsConfirmDeleteOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi xóa khóa học.', 'error');
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
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      courseCode: '',
      name: '',
      description: '',
      durationMonths: 3,
      basePrice: 1500000,
    }
  });

  const onSubmitForm = (values: CourseFormValues) => {
    const dur = Number(values.durationMonths);
    if (isNaN(dur) || dur <= 0) {
      addToast('Thời lượng khóa học (tháng) phải lớn hơn 0!', 'error');
      return;
    }
    const price = Number(values.basePrice);
    if (isNaN(price) || price < 0) {
      addToast('Học phí cơ bản phải lớn hơn hoặc bằng 0!', 'error');
      return;
    }
    upsertMutation.mutate(values);
  };

  const handleEditClick = (course: CourseResponse) => {
    setEditingCourseId(course.id);
    reset({
      courseCode: course.courseCode,
      name: course.name,
      description: course.description || '',
      durationMonths: course.durationMonths,
      basePrice: course.basePrice,
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingCourseId(null);
    reset({
      courseCode: `KH${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      description: '',
      durationMonths: 3,
      basePrice: 1500000,
    });
    setIsUpsertOpen(true);
  };

  // Formatting currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const coursesList = coursesData || [];
  
  // Client-side pagination since getAll returns a flat list
  const totalItems = coursesList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedCourses = coursesList.slice(page * pageSize, (page + 1) * pageSize);

  // Compute Stats
  const lowestPrice = coursesList.length > 0 ? Math.min(...coursesList.map(c => c.basePrice)) : 0;
  const highestPrice = coursesList.length > 0 ? Math.max(...coursesList.map(c => c.basePrice)) : 0;

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
            <BookOpen size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Quản lý Môn học (Khóa học)</h2>
            <p className="text-slate-400 text-sm mt-1">
              Thiết lập danh mục khóa học, mô tả chuyên môn, số tháng đào tạo và đơn giá học phí tiêu chuẩn.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm Khóa học</span>
        </button>
      </div>

      {/* Stats Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng số khóa học</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{totalItems} khóa</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-400">
            <BookOpen size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Học phí thấp nhất</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{formatVND(lowestPrice)}</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Học phí cao nhất</span>
            <h3 className="text-2xl font-black text-brand-300 mt-1">{formatVND(highestPrice)}</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-300">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass rounded-2xl p-4 flex items-center gap-4 justify-between border border-white/5">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã môn học..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6">Mã Khóa học</th>
                <th className="py-4 px-6">Tên Khóa học</th>
                <th className="py-4 px-6">Thời lượng</th>
                <th className="py-4 px-6">Học phí cơ bản</th>
                <th className="py-4 px-6">Mô tả giới thiệu</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
              {isLoading && (
                [...Array(pageSize)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-44"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-56"></div></td>
                    <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              )}

              {!isLoading && paginatedCourses.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    Không tìm thấy khóa học nào phù hợp.
                  </td>
                </tr>
              )}

              {!isLoading && paginatedCourses.map((course) => (
                <tr key={course.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                    {course.courseCode}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    {course.name}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={14} className="text-slate-500" />
                      {course.durationMonths} tháng
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-brand-300 font-bold">
                    {formatVND(course.basePrice)}
                  </td>
                  <td className="py-4 px-6 text-slate-400 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                    {course.description || 'Không có mô tả'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          setIsDetailsOpen(true);
                        }}
                        title="Chi tiết"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditClick(course)}
                        title="Sửa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
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
      {isDetailsOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedCourse.courseCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Chi tiết Khóa học</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="p-4.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-4">
                <div>
                  <span className="text-slate-500 text-xs">Tên môn học</span>
                  <h4 className="text-lg font-extrabold text-slate-100 mt-0.5">{selectedCourse.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-xs block">Thời lượng khóa học</span>
                    <span className="text-slate-200 font-bold flex items-center gap-1.5 mt-1">
                      <Clock size={15} className="text-slate-400" />
                      {selectedCourse.durationMonths} tháng
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-xs block">Học phí cơ bản</span>
                    <span className="text-brand-300 font-black flex items-center gap-0.5 mt-1">
                      {formatVND(selectedCourse.basePrice)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-xs block mb-1">Mô tả giáo trình & Mục tiêu khóa học</span>
                <p className="text-slate-300 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 leading-relaxed font-medium">
                  {selectedCourse.description || 'Không có mô tả chi tiết cho môn học này.'}
                </p>
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
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">
                {editingCourseId ? 'Cập nhật Khóa học' : 'Thêm mới Khóa học'}
              </h3>
              <button
                onClick={() => setIsUpsertOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Thông tin cơ bản khóa học
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mã khóa học *</label>
                  <input
                    type="text"
                    {...register('courseCode')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  {errors.courseCode && <p className="text-red-400 text-xs mt-1">{errors.courseCode.message}</p>}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Tên khóa học *</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Nhập tên môn học / khóa học"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Thời lượng (Tháng) *</label>
                    <input
                      type="number"
                      {...register('durationMonths')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.durationMonths && <p className="text-red-400 text-xs mt-1">{errors.durationMonths.message?.toString()}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Học phí cơ bản (VND) *</label>
                    <input
                      type="number"
                      {...register('basePrice')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.basePrice && <p className="text-red-400 text-xs mt-1">{errors.basePrice.message?.toString()}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mô tả giáo trình *</label>
                  <textarea
                    rows={4}
                    {...register('description')}
                    placeholder="Nhập giới thiệu, mục tiêu đầu ra và giáo trình cơ bản của môn học..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 leading-relaxed"
                  />
                  {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
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
                    'Lưu khóa học'
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
      {isConfirmDeleteOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Xóa khóa học</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa khóa học <span className="font-bold text-red-400">"{selectedCourse.name}"</span>? Thao tác này không thể thu hồi.
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
                onClick={() => deleteMutation.mutate(selectedCourse.id)}
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

export default CoursesView;
