import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UserCheck,
  GraduationCap,
  FileText,
  Bell,
  Coins,
  Sparkles,
  Calendar,
  CheckCircle,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { parentApi } from '../features/parent/parent.api';
import type { ParentDashboardResponse, InvoiceCard } from '../types/yoedu';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export const ParentPortalView: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceCard | null>(null);

  // Add Toast helper
  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // ----------------------------------------------------
  // DATA FETCHING (React Query)
  // ----------------------------------------------------
  // Fetch Parent Portal Dashboard (GET /api/parent/dashboard)
  const { data: dashboardData, isLoading: isDashboardLoading, refetch } = useQuery<ParentDashboardResponse>({
    queryKey: ['parent-dashboard'],
    queryFn: async () => parentApi.getDashboard()
  });

  // Mock Payment Action
  const payInvoiceMock = (invoice: InvoiceCard) => {
    setSelectedInvoice(invoice);
  };

  const submitMockPayment = () => {
    if (!selectedInvoice) return;
    addToast(`Yêu cầu thanh toán hóa đơn ${selectedInvoice.invoiceCode} đang được chuyển tiếp tới cổng ngân hàng liên kết...`, 'success');
    setTimeout(() => {
      addToast(`Giao dịch thanh toán thử nghiệm thành công cho học viên: ${selectedInvoice.studentName}!`, 'success');
      setSelectedInvoice(null);
      refetch();
    }, 1500);
  };

  // ----------------------------------------------------
  // HELPERS
  // ----------------------------------------------------
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    // Format LocalDate YYYY-MM-DD -> DD/MM/YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatMonth = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length >= 2) {
      return `Tháng ${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getStatusBadge = (status?: string) => {
    let cleanStatus = status || 'UNPAID';
    if (cleanStatus === 'PARTIALLY_PAID') cleanStatus = 'PARTIAL';

    switch (cleanStatus) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold">
            Đã thanh toán
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 text-xs font-bold">
            Đóng một phần
          </span>
        );
      case 'UNPAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/25 px-2.5 py-0.5 text-xs font-bold">
            Chưa đóng tiền
          </span>
        );
      case 'OVERPAID':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 px-2.5 py-0.5 text-xs font-bold">
            Đóng dư học phí
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/25 px-2.5 py-0.5 text-xs font-bold">
            {cleanStatus}
          </span>
        );
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TUITION':
      case 'INVOICE':
      case 'BILLING':
        return <Coins size={16} className="text-emerald-400" />;
      case 'LEARNING':
      case 'SCORE':
        return <GraduationCap size={16} className="text-violet-400" />;
      default:
        return <Bell size={16} className="text-brand-400" />;
    }
  };

  const getStudentStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'PAUSE':
      case 'PAUSED':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
    }
  };

  const getStudentStatusLabel = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang học';
      case 'PAUSE':
      case 'PAUSED':
        return 'Bảo lưu';
      default:
        return 'Nghỉ học';
    }
  };

  if (isDashboardLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-brand-500/25"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin"></div>
        </div>
        <span className="text-sm text-slate-450 animate-pulse">Đang đồng bộ hóa cổng phụ huynh YOEDU...</span>
      </div>
    );
  }

  const studentsList = dashboardData?.students || [];
  const invoicesList = dashboardData?.invoices || [];
  const notificationsList = dashboardData?.notifications || [];

  return (
    <div className="space-y-6 relative">
      {/* Toast notifications */}
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

      {/* Welcome Panel */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-white/5 bg-gradient-to-r from-brand-950/20 to-slate-900/60">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            <UserCheck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">
              Xin chào Phụ huynh, {dashboardData?.parentName || 'Quý phụ huynh'}!
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Chào mừng bạn đến với Cổng thông tin gia đình YOEDU. Dưới đây là thông tin học vụ, học tập và tài chính của con em bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Linked Children (Student Cards Grid) */}
      <div className="space-y-4">
        <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap size={16} className="text-violet-400" />
          Thông tin học tập của các con ({studentsList.length})
        </h4>

        {studentsList.length === 0 && (
          <div className="glass rounded-2xl p-8 border border-white/5 text-center text-slate-500">
            Chưa liên kết học sinh nào với tài khoản phụ huynh này. Vui lòng liên hệ văn phòng để cập nhật.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentsList.map((stu) => (
            <div
              key={stu.id}
              className="glass rounded-2xl p-5 border border-white/5 relative overflow-hidden group hover:border-brand-500/20 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-350 border border-slate-700 shadow-inner group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-slate-100 font-extrabold text-base tracking-wide leading-tight">
                      {stu.fullName}
                    </h4>
                    <span className="text-xs text-slate-450 block font-mono mt-1">
                      Mã số: {stu.studentCode}
                    </span>
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${getStudentStatusBadge(stu.status)}`}>
                  {getStudentStatusLabel(stu.status)}
                </span>
              </div>

              {/* Latest test grade score representation */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-450 font-medium">Bảng điểm kiểm tra gần nhất:</span>
                <span className="inline-flex items-center gap-1 rounded bg-violet-500/10 border border-violet-500/25 px-2 py-1 text-xs font-mono font-black text-violet-400">
                  <Sparkles size={11} />
                  {stu.latestScore ? `${stu.latestScore.toFixed(1)} / 10` : 'Chưa có điểm'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linked Children Invoices panel */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl lg:col-span-2 flex flex-col">
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <FileText size={16} className="text-emerald-400" />
              Sổ theo dõi Học phí của con em
            </h4>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Học sinh</th>
                  <th className="py-4 px-6">Lớp học</th>
                  <th className="py-4 px-6">Tháng hóa đơn</th>
                  <th className="py-4 px-6 text-right">Phải đóng</th>
                  <th className="py-4 px-6 text-right">Còn nợ</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-center">Thanh toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm text-slate-350">
                {invoicesList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-500">
                      Gia đình không có hóa đơn học phí nào cần thanh toán tồn đọng.
                    </td>
                  </tr>
                )}

                {invoicesList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/25 transition-all duration-150">
                    <td className="py-4 px-6 font-bold text-slate-100">{inv.studentName}</td>
                    <td className="py-4 px-6 text-slate-300 font-medium">{inv.className}</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">{formatMonth(inv.billingMonth)}</td>
                    <td className="py-4 px-6 font-mono font-extrabold text-right text-slate-200">{formatVND(inv.finalAmount)}</td>
                    <td className="py-4 px-6 font-mono font-extrabold text-right text-red-400">{formatVND(inv.balanceAmount)}</td>
                    <td className="py-4 px-6">{getStatusBadge(inv.status)}</td>
                    <td className="py-4 px-6 text-center">
                      {inv.status !== 'PAID' ? (
                        <button
                          onClick={() => payInvoiceMock(inv)}
                          className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 transition-all cursor-pointer shadow-md mx-auto"
                        >
                          <CreditCard size={12} />
                          <span>Đóng phí</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500 font-semibold block">Đã đóng đủ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications list */}
        <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[400px] lg:h-auto">
          <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/30">
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Bell size={16} className="text-brand-400 animate-swing" />
              Bảng thông báo Học vụ & Tài chính
            </h4>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {notificationsList.length === 0 && (
              <div className="text-center py-16 text-slate-500 text-xs">
                Không ghi nhận thông báo nào mới từ văn phòng nhà trường.
              </div>
            )}

            {notificationsList.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 bg-slate-950/20 border border-slate-900 rounded-xl space-y-2 hover:border-slate-800 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-450 uppercase flex items-center gap-1.5">
                    {getNotificationIcon(notif.type)}
                    {notif.type}
                  </span>
                  <span className="text-[9px] text-slate-550 font-mono flex items-center gap-0.5">
                    <Calendar size={10} />
                    {formatDate(notif.createdAt)}
                  </span>
                </div>
                <h5 className="text-slate-100 font-bold text-xs tracking-wide leading-snug">
                  {notif.title}
                </h5>
                <p className="text-slate-400 text-[11px] leading-relaxed font-medium">
                  {notif.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==========================================
          MODAL: PAYMENT GATEWAY MOCK
          ========================================== */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-sm p-6 shadow-2xl animate-zoom-in text-center space-y-5">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mx-auto">
              <CreditCard size={22} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-slate-50 font-extrabold text-base">Thanh toán học phí trực tuyến</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">
                Bạn đang thực hiện thanh toán học phí cho con: <span className="font-bold text-slate-200">{selectedInvoice.studentName}</span>
                <br />
                Mã hóa đơn: <span className="font-mono text-brand-400 font-bold">{selectedInvoice.invoiceCode}</span>
                <br />
                Số dư học phí cần đóng: <span className="font-mono text-red-400 font-black text-sm">{formatVND(selectedInvoice.balanceAmount)}</span>
              </p>
            </div>

            {/* Simulated Payment Gateway QR/Info box */}
            <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900 text-left space-y-2 text-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Thông tin chuyển khoản nhanh:</span>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="text-slate-200 font-bold">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Số tài khoản:</span>
                <span className="text-slate-200 font-bold">1900 8888 9999</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-400">Nội dung CK:</span>
                <span className="text-slate-200 font-bold">YOEDU {selectedInvoice.invoiceCode}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-350 rounded-xl text-xs font-semibold px-4 py-2.5 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={submitMockPayment}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold px-5 py-2.5 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle size={14} />
                <span>Xác nhận đã chuyển</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortalView;
