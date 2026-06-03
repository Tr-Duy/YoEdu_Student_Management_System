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
  User,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { studentsApi } from '../features/students/students.api';
import { api } from '../lib/api';
import type { StudentResponse, StudentStatus } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const studentFormSchema = z.object({
  studentCode: z.string().min(2, 'Mã học viên tối thiểu 2 ký tự'),
  fullName: z.string().min(2, 'Họ tên học viên tối thiểu 2 ký tự'),
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

  // Toggle for parent registration
  withParent: z.boolean(),
  parentFullName: z.string(),
  parentEmail: z.string(),
  parentPhone: z.string(),
  parentAddress: z.string(),
  parentGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  parentRelationship: z.string(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

// ==========================================
// TOAST NOTIFICATIONS STATE
// ==========================================
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const StudentsView: React.FC = () => {
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
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

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
  
  // 1. Fetch Students
  const { data, isLoading } = useQuery({
    queryKey: ['students', debouncedSearch, statusFilter, page],
    queryFn: async () => {
      const activeStatus = statusFilter !== 'ALL' ? (statusFilter as StudentStatus) : undefined;
      return studentsApi.search({
        search: debouncedSearch,
        status: activeStatus,
        page,
        size: pageSize,
      });
    },
  });

  // 2. Fetch Parents (for association list)
  const { data: parentsList } = useQuery<any[]>({
    queryKey: ['parents'],
    queryFn: async () => {
      return api.get('/api/parents');
    },
    enabled: isUpsertOpen, // Only fetch when form is open
  });

  // 3. Fetch Status History
  const { data: statusHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['student-history', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent) return [];
      return studentsApi.getStatusHistory(selectedStudent.id);
    },
    enabled: !!selectedStudent && isDetailsOpen,
  });

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================
  
  // 1. Create/Update Student Mutation
  const upsertMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      if (editingStudentId) {
        // Update logic
        if (values.withParent) {
          // Put with parent
          const payload = {
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
            studentNote: values.note,
            parentFullName: values.parentFullName || '',
            parentEmail: values.parentEmail || '',
            parentPhone: values.parentPhone || '',
            parentAddress: values.parentAddress || '',
            parentGender: values.parentGender || 'OTHER',
            parentRelationship: values.parentRelationship || 'FATHER',
          };
          return studentsApi.updateWithParent(editingStudentId, payload as any);
        } else {
          // Put standard
          const payload = {
            studentCode: values.studentCode,
            fullName: values.fullName,
            dateOfBirth: values.dateOfBirth,
            gender: values.gender,
            gradeLevel: values.gradeLevel,
            schoolName: values.schoolName,
            phone: values.phone,
            description: values.description,
            parentId: values.parentId || null,
            status: values.status,
            latestScore: values.latestScore,
            note: values.note,
          };
          return studentsApi.update(editingStudentId, payload);
        }
      } else {
        // Create logic
        if (values.withParent) {
          // Post with parent
          const payload = {
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
            studentNote: values.note,
            parentFullName: values.parentFullName || '',
            parentEmail: values.parentEmail || '',
            parentPhone: values.parentPhone || '',
            parentAddress: values.parentAddress || '',
            parentGender: values.parentGender || 'OTHER',
            parentRelationship: values.parentRelationship || 'FATHER',
          };
          return studentsApi.createWithParent(payload as any);
        } else {
          // Post standard
          const payload = {
            studentCode: values.studentCode,
            fullName: values.fullName,
            dateOfBirth: values.dateOfBirth,
            gender: values.gender,
            gradeLevel: values.gradeLevel,
            schoolName: values.schoolName,
            phone: values.phone,
            description: values.description,
            parentId: values.parentId || null,
            status: values.status,
            latestScore: values.latestScore,
            note: values.note,
          };
          return studentsApi.create(payload);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['parents'] });
      addToast(editingStudentId ? 'Cập nhật học viên thành công!' : 'Tạo mới học viên thành công!', 'success');
      setIsUpsertOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.', 'error');
    }
  });

  // 2. Delete Student Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return studentsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      addToast('Đã xóa học viên thành công!', 'success');
      setIsConfirmDeleteOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi xóa học viên.', 'error');
    }
  });

  // 3. Status Change Mutation
  const changeStatusMutation = useMutation({
    mutationFn: async (payload: { id: number, status: StudentStatus, note: string }) => {
      return studentsApi.changeStatus(payload.id, payload.status, payload.note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      refetchHistory();
      addToast('Cập nhật trạng thái thành công!', 'success');
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi cập nhật trạng thái.', 'error');
    }
  });

  // ==========================================
  // REACT HOOK FORM SETUP
  // ==========================================
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      gender: 'OTHER',
      status: 'ACTIVE',
      latestScore: 0,
      withParent: false,
      parentId: null,
    }
  });

  const watchWithParent = watch('withParent');

  const onSubmitForm = (values: StudentFormValues) => {
    // 1. Programmatic validation for score
    const score = Number(values.latestScore);
    if (isNaN(score) || score < 0 || score > 10) {
      addToast('Điểm số học viên không hợp lệ (phải từ 0 đến 10)!', 'error');
      return;
    }

    // 2. Programmatic validation for parent registration
    if (values.withParent) {
      if (!values.parentFullName || values.parentFullName.trim().length < 2) {
        addToast('Họ tên phụ huynh tối thiểu phải 2 ký tự!', 'error');
        return;
      }
      if (!values.parentPhone || values.parentPhone.trim().length < 9) {
        addToast('Số điện thoại phụ huynh không hợp lệ!', 'error');
        return;
      }
    }

    // 3. Cast cleaned parameters
    const cleanedValues: StudentFormValues = {
      ...values,
      latestScore: score,
      parentId: values.parentId ? Number(values.parentId) : null
    };

    upsertMutation.mutate(cleanedValues);
  };

  // Triggered when clicking Edit
  const handleEditClick = (student: StudentResponse) => {
    setEditingStudentId(student.id);
    reset({
      studentCode: student.studentCode,
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      gradeLevel: student.gradeLevel,
      schoolName: student.schoolName || '',
      phone: student.phone || '',
      description: student.description || '',
      status: student.status,
      latestScore: student.latestScore,
      note: student.note || '',
      parentId: student.parent?.id || null,
      withParent: false,
      parentFullName: '',
      parentEmail: '',
      parentPhone: '',
      parentAddress: '',
      parentGender: 'OTHER',
      parentRelationship: 'FATHER'
    });
    setIsUpsertOpen(true);
  };

  // Triggered when clicking Create
  const handleCreateClick = () => {
    setEditingStudentId(null);
    reset({
      studentCode: `HV${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: '',
      dateOfBirth: '',
      gender: 'OTHER',
      gradeLevel: '',
      schoolName: '',
      phone: '',
      description: '',
      status: 'ACTIVE',
      latestScore: 0,
      note: '',
      parentId: null,
      withParent: false,
      parentFullName: '',
      parentEmail: '',
      parentPhone: '',
      parentAddress: '',
      parentGender: 'OTHER',
      parentRelationship: 'FATHER'
    });
    setIsUpsertOpen(true);
  };

  // ==========================================
  // UTILITIES
  // ==========================================
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Đang học
          </span>
        );
      case 'PAUSE':
      case 'PAUSED':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Bảo lưu
          </span>
        );
      case 'DROPPED':
        return (
          <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-500/25">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
            Đã nghỉ
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-slate-500/10 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-500/25">
            Không rõ
          </span>
        );
    }
  };

  const getGenderText = (gender: string) => {
    if (gender === 'MALE') return 'Nam';
    if (gender === 'FEMALE') return 'Nữ';
    return 'Khác';
  };

  const studentsList = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Notifications */}
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

      {/* Header Cards & Stats */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            <User size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Quản lý Học viên</h2>
            <p className="text-slate-400 text-sm mt-1">
              Tra cứu danh sách học viên, quản lý hồ sơ và cập nhật thông tin liên kết phụ huynh.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm Học viên</span>
        </button>
      </div>

      {/* Control Bar (Filters & Search) */}
      <div className="glass rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 justify-between border border-white/5">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên hoặc mã học viên..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'ACTIVE', 'PAUSED', 'DROPPED'].map((filter) => (
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
              {filter === 'ACTIVE' && 'Đang học'}
              {filter === 'PAUSED' && 'Bảo lưu'}
              {filter === 'DROPPED' && 'Đã nghỉ'}
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
                <th className="py-4 px-6">Mã Học Viên</th>
                <th className="py-4 px-6">Họ và Tên</th>
                <th className="py-4 px-6">Ngày sinh</th>
                <th className="py-4 px-6">Giới tính</th>
                <th className="py-4 px-6">Lớp học</th>
                <th className="py-4 px-6">Phụ huynh</th>
                <th className="py-4 px-6">Trạng thái</th>
                <th className="py-4 px-6">Điểm số</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
              
              {/* Loading State */}
              {isLoading && (
                [...Array(pageSize)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-10"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-24"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-8"></div></td>
                    <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              )}

              {/* Empty State */}
              {!isLoading && studentsList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 mx-auto text-slate-400">
                        <AlertCircle size={22} />
                      </div>
                      <div>
                        <h4 className="text-slate-200 font-bold text-base">Không tìm thấy học viên</h4>
                        <p className="text-slate-500 text-xs mt-1">
                          Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc điều kiện lọc trạng thái.
                        </p>
                      </div>
                      {(searchTerm !== '' || statusFilter !== 'ALL') && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                          }}
                          className="rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data Rows */}
              {!isLoading && studentsList.map((student) => (
                <tr key={student.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                    {student.studentCode}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    {student.fullName}
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    {student.dateOfBirth}
                  </td>
                  <td className="py-4 px-6">
                    {getGenderText(student.gender)}
                  </td>
                  <td className="py-4 px-6 text-slate-300 font-medium">
                    {student.gradeLevel}
                  </td>
                  <td className="py-4 px-6 text-slate-300">
                    {student.parent ? (
                      <div>
                        <span className="block font-semibold text-slate-200">{student.parent.fullName}</span>
                        <span className="block text-[11px] text-slate-500">{student.parent.phone}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Chưa liên kết</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(student.status)}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs ${
                      student.latestScore >= 8.0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : student.latestScore >= 5.0
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {student.latestScore?.toFixed(1) || '0.0'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsDetailsOpen(true);
                        }}
                        title="Xem chi tiết"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditClick(student)}
                        title="Sửa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
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

        {/* Pagination Panel */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-slate-800/80 px-6 py-4 flex items-center justify-between bg-slate-900/15">
            <span className="text-xs text-slate-500">
              Trang <span className="font-bold text-slate-400">{page + 1}</span> / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => prev + 1)}
                className="rounded-xl border border-slate-800 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
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
      {isDetailsOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedStudent.studentCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Chi tiết Hồ sơ Học viên</h3>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Profile Card Summary */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5">
                <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center font-bold text-white shadow-md shadow-brand-500/15">
                  {selectedStudent.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-100">{selectedStudent.fullName}</h4>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Cấp lớp: <span className="font-semibold text-brand-400">{selectedStudent.gradeLevel}</span> • Giới tính: {getGenderText(selectedStudent.gender)}
                  </span>
                </div>
              </div>

              {/* Two Column details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Academic/Student details */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                    Thông tin học viên
                  </h5>
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Ngày sinh</span>
                      <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                        <Calendar size={14} className="text-slate-400" />
                        {selectedStudent.dateOfBirth}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 text-xs">Điểm số hiện tại</span>
                      <span className="text-slate-200 font-bold mt-0.5">
                        {selectedStudent.latestScore?.toFixed(1)} / 10
                      </span>
                    </div>
                    {selectedStudent.schoolName && (
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Trường học đang theo học</span>
                        <span className="text-slate-200 font-medium mt-0.5">{selectedStudent.schoolName}</span>
                      </div>
                    )}
                    {selectedStudent.note && (
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Ghi chú học vụ</span>
                        <span className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-xs mt-0.5">
                          {selectedStudent.note}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Parent details */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800">
                    Thông tin phụ huynh liên hệ
                  </h5>
                  {selectedStudent.parent ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Họ và Tên</span>
                        <span className="text-slate-200 font-semibold mt-0.5">
                          {selectedStudent.parent.fullName}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Mối quan hệ</span>
                        <span className="text-slate-300 font-medium mt-0.5">
                          {selectedStudent.parent.relationship === 'FATHER' ? 'Bố' : selectedStudent.parent.relationship === 'MOTHER' ? 'Mẹ' : selectedStudent.parent.relationship}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs">Số điện thoại</span>
                        <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                          <Phone size={14} className="text-slate-400" />
                          {selectedStudent.parent.phone}
                        </span>
                      </div>
                      {selectedStudent.parent.email && (
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-xs">Địa chỉ Email</span>
                          <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5 overflow-hidden text-ellipsis">
                            <Mail size={14} className="text-slate-400" />
                            {selectedStudent.parent.email}
                          </span>
                        </div>
                      )}
                      {selectedStudent.parent.address && (
                        <div className="flex flex-col">
                          <span className="text-slate-500 text-xs">Địa chỉ nhà</span>
                          <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                            <MapPin size={14} className="text-slate-400 shrink-0" />
                            {selectedStudent.parent.address}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic text-sm py-4 flex flex-col items-center gap-2 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
                      <AlertCircle size={18} />
                      <span>Học viên chưa liên kết tài khoản Phụ huynh</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Status History Timeline */}
              {statusHistory && statusHistory.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                    <Activity size={14} />
                    Lịch sử cập nhật trạng thái
                  </h5>
                  <div className="space-y-3.5 pl-3">
                    {statusHistory.map((history: any, index: number) => (
                      <div key={index} className="relative pl-5 border-l border-slate-800 last:border-transparent pb-1">
                        <div className="absolute left-[-4.5px] top-1.5 h-2 w-2 rounded-full bg-brand-500"></div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                          <span className="font-semibold text-slate-300">
                            Thay đổi thành: {getStatusBadge(history.status)}
                          </span>
                          <span className="text-slate-500">
                            {new Date(history.changedAt || Date.now()).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-slate-400 text-xs mt-1 italic">
                            Lý do: "{history.note}"
                          </p>
                        )}
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          Thực hiện bởi ID: {history.changedByUserId}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with fast Status Update Panel */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">Đổi nhanh trạng thái:</span>
                <select
                  defaultValue={selectedStudent.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as StudentStatus;
                    const note = prompt('Nhập lý do thay đổi trạng thái:') || 'Cập nhật từ màn hình chi tiết';
                    changeStatusMutation.mutate({
                      id: selectedStudent.id,
                      status: newStatus,
                      note
                    });
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="ACTIVE">Đang học</option>
                  <option value="PAUSED">Bảo lưu</option>
                  <option value="DROPPED">Đã nghỉ</option>
                </select>
              </div>
              
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-2.5 transition-all cursor-pointer text-center"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: CREATE / UPDATE STUDENT FORM
          ========================================== */}
      {isUpsertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">
                {editingStudentId ? 'Cập nhật Thông tin Học viên' : 'Đăng ký Học viên mới'}
              </h3>
              <button
                onClick={() => setIsUpsertOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleSubmit(onSubmitForm)} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* STUDENT PROFILE SECTION */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider pb-1.5 border-b border-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Thông tin học viên
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Student Code */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mã học viên (Hệ thống)</label>
                    <input
                      type="text"
                      {...register('studentCode')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    {errors.studentCode && <p className="text-red-400 text-xs mt-1">{errors.studentCode.message}</p>}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Họ và Tên *</label>
                    <input
                      type="text"
                      {...register('fullName')}
                      placeholder="Nhập họ và tên"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                    {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày sinh *</label>
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth.message}</p>}
                  </div>

                  {/* Gender Select */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Giới tính *</label>
                    <select
                      {...register('gender')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                    {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>}
                  </div>

                  {/* Status Select */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trạng thái *</label>
                    <select
                      {...register('status')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="ACTIVE">Đang học</option>
                      <option value="PAUSED">Bảo lưu</option>
                      <option value="DROPPED">Đã nghỉ</option>
                    </select>
                    {errors.status && <p className="text-red-400 text-xs mt-1">{errors.status.message}</p>}
                  </div>

                  {/* Grade Level */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Cấp lớp / Trình độ *</label>
                    <input
                      type="text"
                      {...register('gradeLevel')}
                      placeholder="Ví dụ: Pre-IELTS, Starter, Level 3"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                    {errors.gradeLevel && <p className="text-red-400 text-xs mt-1">{errors.gradeLevel.message}</p>}
                  </div>

                  {/* Latest Score */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Điểm kiểm tra (Mới nhất) *</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('latestScore', { valueAsNumber: true })}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.latestScore && <p className="text-red-400 text-xs mt-1">{String(errors.latestScore.message || '')}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Số điện thoại liên lạc</label>
                    <input
                      type="text"
                      {...register('phone')}
                      placeholder="Số điện thoại cá nhân"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* School Name */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trường học (Đang học chính quy)</label>
                    <input
                      type="text"
                      {...register('schoolName')}
                      placeholder="Tên trường học"
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Description */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mô tả đặc điểm / Sức học học viên</label>
                    <textarea
                      rows={2}
                      {...register('description')}
                      placeholder="Nhận định nhanh..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  {/* Notes */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ghi chú riêng của Trung tâm</label>
                    <input
                      type="text"
                      {...register('note')}
                      placeholder="Các ghi chú đặc biệt..."
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* PARENT SECTION */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <h4 className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User size={14} className="text-brand-400" />
                    Liên kết phụ huynh học viên
                  </h4>
                  
                  {/* Parent Registration toggle */}
                  {!editingStudentId && (
                    <label className="flex items-center gap-2 text-xs text-slate-300 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        {...register('withParent')}
                        className="rounded accent-brand-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <span>Đăng ký cùng Phụ huynh mới</span>
                    </label>
                  )}
                </div>

                {/* Form Option 1: Create with Parent */}
                {watchWithParent && !editingStudentId ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/25 p-4 rounded-2xl border border-slate-800/80 animate-fade-in">
                    
                    {/* Parent Name */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Họ tên Phụ huynh *</label>
                      <input
                        type="text"
                        {...register('parentFullName')}
                        placeholder="Nhập đầy đủ tên phụ huynh"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                      />
                      {errors.parentFullName && <p className="text-red-400 text-xs mt-1">{errors.parentFullName.message}</p>}
                    </div>

                    {/* Parent Phone */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Số điện thoại phụ huynh *</label>
                      <input
                        type="text"
                        {...register('parentPhone')}
                        placeholder="Số điện thoại"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                      />
                    </div>

                    {/* Parent Email */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email phụ huynh</label>
                      <input
                        type="text"
                        {...register('parentEmail')}
                        placeholder="Địa chỉ Email"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                      />
                      {errors.parentEmail && <p className="text-red-400 text-xs mt-1">{errors.parentEmail.message}</p>}
                    </div>

                    {/* Relation */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mối quan hệ *</label>
                      <select
                        {...register('parentRelationship')}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                      >
                        <option value="FATHER">Bố</option>
                        <option value="MOTHER">Mẹ</option>
                        <option value="GUARDIAN">Người giám hộ</option>
                        <option value="OTHER">Mối quan hệ khác</option>
                      </select>
                    </div>

                    {/* Parent Gender */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Giới tính phụ huynh</label>
                      <select
                        {...register('parentGender')}
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                      >
                        <option value="MALE">Nam</option>
                        <option value="FEMALE">Nữ</option>
                        <option value="OTHER">Khác</option>
                      </select>
                    </div>

                    {/* Parent Address */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1.5 font-medium">Địa chỉ thường trú</label>
                      <input
                        type="text"
                        {...register('parentAddress')}
                        placeholder="Địa chỉ cư trú"
                        className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* Form Option 2: Link with Existing Parent */
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Chọn phụ huynh liên kết (Có sẵn)</label>
                    <select
                      {...register('parentId')}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        setValue('parentId', val);
                      }}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="">-- Chưa liên kết phụ huynh / Để trống --</option>
                      {parentsList?.map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.fullName} ({parent.phone} • {parent.relationship === 'FATHER' ? 'Bố' : parent.relationship === 'MOTHER' ? 'Mẹ' : 'Người nuôi dưỡng'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
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
                    'Lưu cấu hình'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: DELETE CONFIRMATION DIALOG
          ========================================== */}
      {isConfirmDeleteOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Xác nhận xóa học viên</h3>
              <p className="text-slate-400 text-xs mt-2">
                Bạn có chắc chắn muốn xóa học viên <span className="font-bold text-red-400">"{selectedStudent.fullName}"</span>? Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(selectedStudent.id)}
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
export default StudentsView;
