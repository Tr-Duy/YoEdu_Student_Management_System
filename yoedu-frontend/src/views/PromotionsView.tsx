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
  Percent,
  AlertCircle,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Gift,
  Coins
} from 'lucide-react';
import { promotionsApi } from '../features/promotions/promotions.api';
import type { PromotionResponse } from '../types/yoedu';

// ==========================================
// FORM VALIDATION SCHEMA WITH ZOD
// ==========================================
const promotionFormSchema = z.object({
  promoCode: z.string().min(2, 'Mã khuyến mãi tối thiểu 2 ký tự'),
  name: z.string().min(2, 'Tên chương trình tối thiểu 2 ký tự'),
  discountType: z.enum(['PERCENTAGE', 'FIXED', 'PERCENT', 'AMOUNT', 'FIXED_AMOUNT']),
  discountValue: z.any(), // Handled programmatically
  startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  isActive: z.boolean(),
  note: z.string().optional(),
});

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const PromotionsView: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, ACTIVE, INACTIVE
  const [page, setPage] = useState(0);
  const pageSize = 8;

  // Dialog & Modal States
  const [isUpsertOpen, setIsUpsertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<PromotionResponse | null>(null);
  const [editingPromotionId, setEditingPromotionId] = useState<number | null>(null);

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
  
  // Fetch Promotions (getAll returns PromotionResponse[] directly)
  const { data: promotionsData, isLoading } = useQuery<PromotionResponse[]>({
    queryKey: ['promotions', debouncedSearch],
    queryFn: async () => {
      return promotionsApi.getAll({ search: debouncedSearch });
    },
  });

  // ==========================================
  // TANSTACK QUERY - MUTATIONS
  // ==========================================
  
  // 1. Create/Update Promotion Mutation
  const upsertMutation = useMutation({
    mutationFn: async (values: PromotionFormValues) => {
      const discountValueNum = Number(values.discountValue) || 0;

      const payload = {
        promoCode: values.promoCode,
        name: values.name,
        discountType: values.discountType,
        discountValue: discountValueNum,
        startDate: values.startDate,
        endDate: values.endDate,
        isActive: values.isActive,
        note: values.note || '',
      };

      if (editingPromotionId) {
        return promotionsApi.update(editingPromotionId, payload);
      } else {
        return promotionsApi.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      addToast(editingPromotionId ? 'Cập nhật mã ưu đãi thành công!' : 'Tạo mới mã ưu đãi thành công!', 'success');
      setIsUpsertOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.', 'error');
    }
  });

  // 2. Delete Promotion Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return promotionsApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      addToast('Đã xóa chương trình ưu đãi thành công!', 'success');
      setIsConfirmDeleteOpen(false);
    },
    onError: (err: any) => {
      addToast(err?.message || 'Lỗi khi xóa chương trình ưu đãi.', 'error');
    }
  });

  // ==========================================
  // REACT HOOK FORM SETUP
  // ==========================================
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      promoCode: '',
      name: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      note: '',
    }
  });

  const watchDiscountType = watch('discountType');

  const onSubmitForm = (values: PromotionFormValues) => {
    const val = Number(values.discountValue);
    if (isNaN(val) || val <= 0) {
      addToast('Giá trị chiết khấu phải lớn hơn 0!', 'error');
      return;
    }
    if ((values.discountType === 'PERCENTAGE' || values.discountType === 'PERCENT') && val > 100) {
      addToast('Giá trị chiết khấu theo phần trăm không được vượt quá 100%!', 'error');
      return;
    }
    
    // Check dates order
    if (new Date(values.startDate) > new Date(values.endDate)) {
      addToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'error');
      return;
    }

    upsertMutation.mutate(values);
  };

  const handleEditClick = (promo: PromotionResponse) => {
    setEditingPromotionId(promo.id);
    reset({
      promoCode: promo.promoCode,
      name: promo.name,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      startDate: promo.startDate,
      endDate: promo.endDate,
      isActive: promo.isActive !== false,
      note: promo.note || '',
    });
    setIsUpsertOpen(true);
  };

  const handleCreateClick = () => {
    setEditingPromotionId(null);
    reset({
      promoCode: `KM${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      note: '',
    });
    setIsUpsertOpen(true);
  };

  // Format Helper for currency
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Format Helper for dates (YYYY-MM-DD -> DD/MM/YYYY)
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const promotionsList = promotionsData || [];
  
  // Status filter locally since API fetches all
  const filteredPromotions = promotionsList.filter((promo) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return promo.isActive === true;
    if (statusFilter === 'INACTIVE') return promo.isActive === false;
    return true;
  });

  // Client-side pagination
  const totalItems = filteredPromotions.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedPromotions = filteredPromotions.slice(page * pageSize, (page + 1) * pageSize);

  // Compute Stats
  const activePromoCount = promotionsList.filter(p => p.isActive).length;

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
            <Percent size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Quản lý Khuyến mãi & Ưu đãi</h2>
            <p className="text-slate-400 text-sm mt-1">
              Thiết lập các chương trình ưu đãi, mã giảm giá học phí theo dạng phần trăm (%) hoặc số tiền cố định (VND).
            </p>
          </div>
        </div>

        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 hover:scale-[1.02] active:scale-95 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>Thêm Mã ưu đãi</span>
        </button>
      </div>

      {/* Stats Cards Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tổng chương trình</span>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{promotionsList.length} chương trình</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-400">
            <Gift size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Mã đang kích hoạt</span>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{activePromoCount} chương trình</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hình thức chiết khấu</span>
            <h3 className="text-2xl font-black text-brand-300 mt-1">% / Cố định</h3>
          </div>
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-white/5 text-brand-300">
            <Coins size={20} />
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
            placeholder="Tìm theo mã KM hoặc tên chương trình..."
            className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'ACTIVE', 'INACTIVE'].map((filter) => (
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
              {filter === 'ACTIVE' && 'Đang hoạt động'}
              {filter === 'INACTIVE' && 'Tạm ngưng / Hết hạn'}
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
                <th className="py-4 px-6">Mã Ưu đãi</th>
                <th className="py-4 px-6">Tên Chương trình</th>
                <th className="py-4 px-6">Hình thức</th>
                <th className="py-4 px-6">Giá trị chiết khấu</th>
                <th className="py-4 px-6">Thời hạn áp dụng</th>
                <th className="py-4 px-6">Trạng thái</th>
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
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                    <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-36"></div></td>
                    <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded-full w-24"></div></td>
                    <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-24 mx-auto"></div></td>
                  </tr>
                ))
              )}

              {!isLoading && paginatedPromotions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-500">
                    Không tìm thấy chương trình ưu đãi nào.
                  </td>
                </tr>
              )}

              {!isLoading && paginatedPromotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-slate-900/25 transition-all duration-150">
                  <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                    {promo.promoCode}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-100">
                    {promo.name}
                  </td>
                  <td className="py-4 px-6 font-medium text-slate-300">
                    {promo.discountType === 'PERCENTAGE' || promo.discountType === 'PERCENT' ? 'Theo Phần trăm (%)' : 'Số tiền cố định'}
                  </td>
                  <td className="py-4 px-6 font-mono font-extrabold text-emerald-400">
                    {promo.discountType === 'PERCENTAGE' || promo.discountType === 'PERCENT'
                      ? `${promo.discountValue}%`
                      : formatVND(promo.discountValue)}
                  </td>
                  <td className="py-4 px-6 text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={14} className="text-slate-500" />
                      {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      promo.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {promo.isActive ? 'Đang áp dụng' : 'Tạm ngưng'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPromotion(promo);
                          setIsDetailsOpen(true);
                        }}
                        title="Chi tiết"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleEditClick(promo)}
                        title="Sửa"
                        className="rounded-lg p-2 bg-slate-800/40 text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-all cursor-pointer"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPromotion(promo);
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
      {isDetailsOpen && selectedPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-black bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-1 rounded">
                  {selectedPromotion.promoCode}
                </span>
                <h3 className="text-lg font-bold text-slate-50">Chi tiết Mã ưu đãi</h3>
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
                  <span className="text-slate-500 text-xs">Tên chương trình khuyến mãi</span>
                  <h4 className="text-lg font-extrabold text-slate-100 mt-0.5">{selectedPromotion.name}</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 text-xs block">Hình thức</span>
                    <span className="text-slate-200 font-bold mt-1 text-sm block">
                      {selectedPromotion.discountType === 'PERCENTAGE' || selectedPromotion.discountType === 'PERCENT'
                        ? 'Giảm Phần trăm (%)'
                        : 'Giảm tiền mặt trực tiếp'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 text-xs block">Giá trị giảm giá</span>
                    <span className="text-emerald-400 font-black text-lg block mt-0.5">
                      {selectedPromotion.discountType === 'PERCENTAGE' || selectedPromotion.discountType === 'PERCENT'
                        ? `${selectedPromotion.discountValue}%`
                        : formatVND(selectedPromotion.discountValue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4.5 rounded-2xl bg-slate-900/40 border border-white/5 space-y-3 text-sm">
                <div>
                  <span className="text-slate-500 text-xs block">Hạn sử dụng</span>
                  <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-1">
                    <Calendar size={15} className="text-slate-400" />
                    Từ {formatDate(selectedPromotion.startDate)} đến {formatDate(selectedPromotion.endDate)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block">Trạng thái phát hành</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold mt-1.5 ${
                    selectedPromotion.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {selectedPromotion.isActive ? 'Đang kích hoạt áp dụng' : 'Đang tạm dừng / Ngưng áp dụng'}
                  </span>
                </div>
              </div>

              {selectedPromotion.note && (
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Mô tả chi tiết áp dụng</span>
                  <p className="text-slate-300 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800 leading-relaxed font-medium">
                    {selectedPromotion.note}
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
          <div className="glass rounded-3xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-lg font-bold text-slate-50">
                {editingPromotionId ? 'Cập nhật Mã ưu đãi' : 'Thêm mới Mã ưu đãi'}
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
                  Chi tiết chương trình ưu đãi
                </h4>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Mã ưu đãi (Promo Code) *</label>
                  <input
                    type="text"
                    {...register('promoCode')}
                    placeholder="Ví dụ: HE2026, YOEDU10"
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  {errors.promoCode && <p className="text-red-400 text-xs mt-1">{errors.promoCode.message}</p>}
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Tên chương trình *</label>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Ví dụ: Giảm giá hè 10%, Ưu đãi đặc biệt..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Hình thức chiết khấu *</label>
                    <select
                      {...register('discountType')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
                    >
                      <option value="PERCENTAGE">Theo Phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (VND)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                      {watchDiscountType === 'PERCENTAGE' || watchDiscountType === 'PERCENT'
                        ? 'Giá trị giảm (%) *'
                        : 'Giá trị giảm (VND) *'}
                    </label>
                    <input
                      type="number"
                      {...register('discountValue')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    {errors.discountValue && <p className="text-red-400 text-xs mt-1">{errors.discountValue.message?.toString()}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày bắt đầu *</label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate.message}</p>}
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5 font-medium">Ngày kết thúc *</label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500"
                    />
                    {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Trạng thái *</label>
                  <select
                    id="isActive"
                    {...register('isActive', {
                      setValueAs: (v) => v === 'true' || v === true
                    })}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Tạm ngưng / Hết hạn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Điều kiện áp dụng & Ghi chú</label>
                  <textarea
                    rows={3}
                    {...register('note')}
                    placeholder="Mô tả chi tiết đối tượng áp dụng hoặc ghi chú chương trình..."
                    className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 leading-relaxed"
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
                    'Lưu mã ưu đãi'
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
      {isConfirmDeleteOpen && selectedPromotion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 mx-auto">
              <Trash2 size={22} />
            </div>
            
            <div>
              <h3 className="text-slate-100 font-extrabold text-base">Xóa chương trình ưu đãi</h3>
              <p className="text-slate-400 text-xs mt-2 font-medium leading-relaxed">
                Bạn có chắc chắn muốn xóa mã ưu đãi <span className="font-bold text-red-400">"{selectedPromotion.promoCode}"</span>? Các hóa đơn đang áp dụng mã này có thể bị ảnh hưởng.
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
                onClick={() => deleteMutation.mutate(selectedPromotion.id)}
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

export default PromotionsView;
