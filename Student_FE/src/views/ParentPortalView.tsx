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
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover text-foreground-muted border border-border px-2.5 py-0.5 text-xs font-bold">
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
        <span className="text-sm text-foreground-muted animate-pulse">Đang đồng bộ hóa cổng phụ huynh YOEDU...</span>
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
            className={`px-5 py-4 rounded-xl flex items-center gap-3 shadow-xl border animate-slide-in max-w-sm ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-surface text-emerald-600 dark:text-emerald-400'
                : 'border-red-500/30 bg-surface text-red-600 dark:text-red-400'
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
      <div className="bg-surface rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-border shadow-sm">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 shadow-xs">
            <UserCheck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-wide">
              Xin chào Phụ huynh, {dashboardData?.parentName || 'Quý phụ huynh'}!
            </h2>
            <p className="text-foreground-muted text-sm mt-1">
              Chào mừng bạn đến với Cổng thông tin gia đình YOEDU. Dưới đây là thông tin học vụ, học tập và tài chính của con em bạn.
            </p>
          </div>
        </div>
      </div>

      {/* Linked Children (Student Cards Grid) */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <GraduationCap size={16} className="text-violet-500" />
          Thông tin học tập của các con ({studentsList.length})
        </h4>

        {studentsList.length === 0 && (
          <div className="bg-surface rounded-xl p-8 border border-border text-center text-foreground-muted">
            Chưa liên kết học sinh nào với tài khoản phụ huynh này. Vui lòng liên hệ văn phòng để cập nhật.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studentsList.map((stu) => (
            <div
              key={stu.id}
              className="bg-surface rounded-xl p-5 border border-border relative overflow-hidden group hover:border-brand-500/30 transition-all duration-300 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-hover text-foreground-secondary border border-border shadow-xs group-hover:bg-brand-500/10 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-foreground font-bold text-base tracking-wide leading-tight">
                      {stu.fullName}
                    </h4>
                    <span className="text-xs text-foreground-muted block font-mono mt-1">
                      Mã số: {stu.studentCode}
                    </span>
                  </div>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${getStudentStatusBadge(stu.status)}`}>
                  {getStudentStatusLabel(stu.status)}
                </span>
              </div>

              {/* Latest test grade score representation */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs text-foreground-muted font-medium">Bảng điểm kiểm tra gần nhất:</span>
                <span className="inline-flex items-center gap-1 rounded bg-violet-500/10 border border-violet-500/25 px-2 py-1 text-xs font-mono font-bold text-violet-600 dark:text-violet-400">
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
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm lg:col-span-2 flex flex-col">
          <div className="px-6 py-4 border-b border-border bg-surface-hover/30 flex items-center justify-between">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <FileText size={16} className="text-emerald-500" />
              Sổ theo dõi Học phí của con em
            </h4>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-hover/20 text-foreground-muted text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Học sinh</th>
                  <th className="py-4 px-6">Lớp học</th>
                  <th className="py-4 px-6">Tháng hóa đơn</th>
                  <th className="py-4 px-6 text-right">Phải đóng</th>
                  <th className="py-4 px-6 text-right">Còn nợ</th>
                  <th className="py-4 px-6">Trạng thái</th>
                  <th className="py-4 px-6 text-center">Thanh toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-foreground-secondary">
                {invoicesList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-foreground-muted">
                      Gia đình không có hóa đơn học phí nào cần thanh toán tồn đọng.
                    </td>
                  </tr>
                )}

                {invoicesList.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-hover/40 transition-colors">
                    <td className="py-4 px-6 font-semibold text-foreground">{inv.studentName}</td>
                    <td className="py-4 px-6 text-foreground-secondary font-medium">{inv.className}</td>
                    <td className="py-4 px-6 text-foreground-muted text-xs">{formatMonth(inv.billingMonth)}</td>
                    <td className="py-4 px-6 font-mono font-bold text-right text-foreground">{formatVND(inv.finalAmount)}</td>
                    <td className="py-4 px-6 font-mono font-bold text-right text-red-500">{formatVND(inv.balanceAmount)}</td>
                    <td className="py-4 px-6">{getStatusBadge(inv.status)}</td>
                    <td className="py-4 px-6 text-center">
                      {inv.status !== 'PAID' ? (
                        <button
                          onClick={() => payInvoiceMock(inv)}
                          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-1.5 transition-colors cursor-pointer shadow-sm mx-auto"
                        >
                          <CreditCard size={12} />
                          <span>Đóng phí</span>
                        </button>
                      ) : (
                        <span className="text-xs text-foreground-muted font-medium block">Đã đóng đủ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notifications list */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm flex flex-col h-[400px] lg:h-auto">
          <div className="px-6 py-4 border-b border-border bg-surface-hover/30">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
              <Bell size={16} className="text-brand-500 animate-swing" />
              Bảng thông báo Học vụ & Tài chính
            </h4>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {notificationsList.length === 0 && (
              <div className="text-center py-16 text-foreground-muted text-xs">
                Không ghi nhận thông báo nào mới từ văn phòng nhà trường.
              </div>
            )}

            {notificationsList.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 bg-surface-hover/30 border border-border rounded-xl space-y-2 hover:border-brand-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-foreground-muted uppercase flex items-center gap-1.5">
                    {getNotificationIcon(notif.type)}
                    {notif.type}
                  </span>
                  <span className="text-[9px] text-foreground-muted font-mono flex items-center gap-0.5">
                    <Calendar size={10} />
                    {formatDate(notif.createdAt)}
                  </span>
                </div>
                <h5 className="text-foreground font-bold text-xs tracking-wide leading-snug">
                  {notif.title}
                </h5>
                <p className="text-foreground-secondary text-[11px] leading-relaxed font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-xl border border-border w-full max-w-sm p-6 shadow-xl animate-zoom-in text-center space-y-5">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 mx-auto">
              <CreditCard size={22} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-foreground font-bold text-base">Thanh toán học phí trực tuyến</h3>
              <p className="text-foreground-muted text-xs leading-relaxed font-medium">
                Bạn đang thực hiện thanh toán học phí cho con: <span className="font-bold text-foreground">{selectedInvoice.studentName}</span>
                <br />
                Mã hóa đơn: <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">{selectedInvoice.invoiceCode}</span>
                <br />
                Số dư học phí cần đóng: <span className="font-mono text-red-500 font-bold text-sm">{formatVND(selectedInvoice.balanceAmount)}</span>
              </p>
            </div>

            {/* Simulated Payment Gateway QR/Info box */}
            <div className="p-4 bg-surface-hover/40 rounded-xl border border-border text-left space-y-2 text-xs">
              <span className="text-[10px] text-foreground-muted font-bold uppercase tracking-wider">Thông tin chuyển khoản nhanh:</span>
              <div className="flex justify-between font-mono">
                <span className="text-foreground-muted">Ngân hàng:</span>
                <span className="text-foreground font-bold">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-foreground-muted">Số tài khoản:</span>
                <span className="text-foreground font-bold">1900 8888 9999</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-foreground-muted">Nội dung CK:</span>
                <span className="text-foreground font-bold">YOEDU {selectedInvoice.invoiceCode}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="bg-surface border border-border hover:bg-surface-hover text-foreground-secondary rounded-lg text-xs font-medium px-4 py-2 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={submitMockPayment}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold px-4 py-2 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
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
