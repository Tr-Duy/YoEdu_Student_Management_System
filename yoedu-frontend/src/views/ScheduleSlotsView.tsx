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
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Layers
} from 'lucide-react';
import { scheduleSlotsApi } from '../features/schedule-slots/schedule-slots.api';
import type { ScheduleSlotResponse } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const slotFormSchema = z.object({
  slotCode: z.string().min(2, 'Mã ca học tối thiểu 2 ký tự'),
  weekday: z.any(), // Coerced on submit
  startTime: z.string().min(4, 'Giờ bắt đầu là bắt buộc'),
  endTime: z.string().min(4, 'Giờ kết thúc là bắt buộc'),
  note: z.string(),
});

type SlotFormValues = z.infer<typeof slotFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const ScheduleSlotsView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [weekdayFilter, setWeekdayFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Dialog & Modal States
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlotResponse | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);

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
  
  // Fetch Schedule Slots
  const { data: slotsData, isLoading } = useQuery<ScheduleSlotResponse[]>({
    queryKey: ['scheduleSlots', debouncedSearch],
    queryFn: async () => {
      return scheduleSlotsApi.getAll({ search: debouncedSearch });
    },
  });

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================
  
  // 1. Create/Update Slot Mutation
  const upsertMutation = useMutation({
    mutationFn: async (values: SlotFormValues) => {
      const weekdayVal = Number(values.weekday) || 2;
      
      // Pad seconds if hours input yields HH:mm
      let start = values.startTime;
      if (start.length === 5) start = `${start}:00`;
      
      let end = values.endTime;
      if (end.length === 5) end = `${end}:00`;

      const payload = {
        slotCode: values.slotCode,
        weekday: weekdayVal,
        startTime: start,
        endTime: end,
        note: values.note,
      };

      if (editingSlotId) {
        return scheduleSlotsApi.update(editingSlotId, payload);
      } else {
        return scheduleSlotsApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleSlots'] });
      addToast(editingSlotId ? 'Cập nhật ca học thành công!' : 'Tạo mới ca học thành công!', 'success');
      setIsUpsertOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.', 'error');
    }
  });

  // 2. Delete Slot Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return scheduleSlotsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduleSlots'] });
      addToast('Đã xóa ca học thành công!', 'success');
      setIsConfirmDeleteOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi xóa ca học.', 'error');
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
  } = useForm<SlotFormValues>({
    resolver: zodResolver(slotFormSchema),
    defaultValues: {
      slotCode: '',
      weekday: 2,
      startTime: '18:00',
      endTime: '19:30',
      note: '',
    }
  });

  const onSubmitForm = (values: SlotFormValues) => {
    const day = Number(values.weekday);
    if (isNaN(day) || day < 2 || day > 8) {
      addToast('Ngày học không hợp lệ (nhận giá trị từ Thứ 2 đến Chủ nhật)!', 'error');
      return;
    }
    upsertMutation.mutate(values);
  };

  const handleEditClick = (slot: ScheduleSlotResponse) => {
    setEditingSlotId(slot.id);
    
    // Trim seconds for cleaner UI display in HTML time inputs
    const cleanStart = slot.startTime.substring(0, 5);
    const cleanEnd = slot.endTime.substring(0, 5);

    reset({
      slotCode: slot.slotCode,
      weekday: slot.weekday,
      startTime: cleanStart,
      endTime: cleanEnd,
      note: slot.note || '',
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingSlotId(null);
    reset({
      slotCode: `CA${Math.floor(10 + Math.random() * 90)}`,
      weekday: 2,
      startTime: '18:00',
      endTime: '19:30',
      note: '',
    });
    setIsUpsertOpen(true);
  };

  // Weekday to vi-VN Text Converter
  const formatWeekday = (day: number) => {
    if (day === 8) return 'Chủ Nhật';
    if (day >= 2 && day <= 7) return `Thứ ${day}`;
    return `Thứ ${day}`;
  };

  const rawSlotsList = slotsData || [];
  
  // Apply visual filter by Weekday if active
  const filteredSlotsList = rawSlotsList.filter(slot => {
    if (weekdayFilter === 'ALL') return true;
    return slot.weekday === Number(weekdayFilter);
  });
  
  // Client-side pagination
  const totalItems = filteredSlotsList.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedSlots = filteredSlotsList.slice(page * pageSize, (page + 1) * pageSize);

  // Compute Stats
  const activeWeekdaysCount = new Set(rawSlotsList.map(s => s.weekday)).size;

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
            <Clock size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Cấu hình Ca học (Schedule Slots)</h2>
            <p className="text-slate-400 text-sm mt-1">
              Thiết lập các ca học cố định trong tuần phục vụ việc xếp lịch dạy cho giáo viên và lịch học cho học viên.
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm Ca học</span>
        </button>
      </div>

      {/* Stats Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng số ca học</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{rawSlotsList.length} ca</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Số ngày có lịch</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{activeWeekdaysCount} ngày / tuần</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400">
            <Calendar size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Thời lượng tiêu chuẩn</span>
            <h3 className="text-2xl font-black text-brand-300 mt-1">90 - 120 phút</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-300">
            <Layers size={20} />
          </div>
        </div>
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
            placeholder="Tìm theo mã ca hoặc ghi chú..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => { setWeekdayFilter('ALL'); setPage(0); }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
              weekdayFilter === 'ALL'
                ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            Tất cả
          </button>
          {[2, 3, 4, 5, 6, 7, 8].map((day) => (
            <button
              key={day}
              onClick={() => {
                setWeekdayFilter(day.toString());
                setPage(0);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
                weekdayFilter === day.toString()
                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                  : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              {day === 8 ? 'CN' : `T${day}`}
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
                <th className="py-4 px-6">Mã Ca học</th>
                <th className="py-4 px-6">Ngày học trong tuần</th>
                <th className="py-4 px-6">Khung thời gian</th>
                <th className="py-4 px-6">Mô tả / Ghi chú</th>
                <th className="py-4 px-6 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
              {isLoading && (
                [...Array(pageSize)].map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-24"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-48"></div></td>
                    <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              )}

              {!isLoading && paginatedSlots.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-500">
                    Không tìm thấy ca học nào thỏa mãn.
                  </td>
                </tr>
              )}

              {!isLoading && paginatedSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                    {slot.slotCode}
                  </td>
                  <td className="py-4 px-6 font-bold">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      slot.weekday === 8
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <Calendar size={12} />
                      {formatWeekday(slot.weekday)}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-200 font-bold">
                    <span className="inline-flex items-center gap-1.5 text-slate-100">
                      <Clock size={14} className="text-slate-500" />
                      {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    {slot.note || 'Chưa ghi chú'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedSlot(slot);
                          setIsDetailsOpen(true);
                        }}
                        title="Chi tiết"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditClick(slot)}
                        title="Sửa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSlot(slot);
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
                className="rounded-xl border border-slate-800/80 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => prev + 1)}
                className="rounded-xl border border-slate-800/80 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
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
      {isDetailsOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedSlot.slotCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Chi tiết Ca học</h3>
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
                  <span className="text-slate-500 text-xs block">Lịch học trong tuần</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold mt-1.5 ${
                    selectedSlot.weekday === 8
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {formatWeekday(selectedSlot.weekday)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block">Khung thời gian cố định</span>
                  <span className="text-slate-100 font-bold flex items-center gap-1.5 mt-1 text-base font-mono">
                    <Clock size={16} className="text-brand-400" />
                    {selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-xs block mb-1">Ghi chú & Phân loại học tập</span>
                <p className="text-slate-300 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 leading-relaxed font-medium">
                  {selectedSlot.note || 'Không có mô tả hoặc ghi chú phụ nào.'}
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
                {editingSlotId ? 'Cập nhật Ca học' : 'Thêm mới Ca học'}
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
                  Thời khóa biểu ca học
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mã ca học *</label>
                  <input
                    type="text"
                    {...register('slotCode')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  {errors.slotCode && <p className="text-red-400 text-xs mt-1">{errors.slotCode.message}</p>}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày học trong tuần *</label>
                  <select
                    {...register('weekday')}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                  >
                    <option value={2}>Thứ Hai</option>
                    <option value={3}>Thứ Ba</option>
                    <option value={4}>Thứ Tư</option>
                    <option value={5}>Thứ Năm</option>
                    <option value={6}>Thứ Sáu</option>
                    <option value={7}>Thứ Bảy</option>
                    <option value={8}>Chủ Nhật</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Giờ bắt đầu *</label>
                    <input
                      type="time"
                      {...register('startTime')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.startTime && <p className="text-red-400 text-xs mt-1">{errors.startTime.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Giờ kết thúc *</label>
                    <input
                      type="time"
                      {...register('endTime')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.endTime && <p className="text-red-400 text-xs mt-1">{errors.endTime.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ghi chú ca học</label>
                  <input
                    type="text"
                    {...register('note')}
                    placeholder="Ví dụ: Ca tối cơ bản, ca tăng cường, v.v."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  />
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
                    'Lưu ca học'
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
      {isConfirmDeleteOpen && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Xóa ca học</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa ca học <span className="font-bold text-red-400">"{selectedSlot.slotCode}"</span> ({formatWeekday(selectedSlot.weekday)} {selectedSlot.startTime.substring(0, 5)} - {selectedSlot.endTime.substring(0, 5)})? Lịch học của lớp sử dụng ca này có thể bị lỗi.
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
                onClick={() => deleteMutation.mutate(selectedSlot.id)}
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

export default ScheduleSlotsView;
