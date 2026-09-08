import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  X,
  Check,
  Users,
  CheckCheck,
  RefreshCw,
  Edit3,
  CalendarDays,
  Percent,
  ListFilter
} from 'lucide-react';
import { attendanceApi } from '../features/attendance/attendance.api';
import { classesApi } from '../features/classes/classes.api';
import type {
  ClassAttendanceDailyDto,
  AttendanceStatus,
  StudentResponse,
  AttendanceResponse,
  StudentAttendanceRowDto
} from '../types/yoedu';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface StudentAttendanceFormItem {
  studentId: number;
  studentCode: string;
  fullName: string;
  status: AttendanceStatus;
  note: string;
}

export const AttendanceView: React.FC = () => {
  const queryClient = useQueryClient();

  // Mode: Daily Workspace vs Monthly Matrix
  const [activeTab, setActiveTab] = useState<'daily' | 'matrix'>('daily');

  // Selected Date (defaults to today in local timezone YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Filter & Search states for daily classes list
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNATTENDED' | 'ATTENDED'>('ALL');

  // Attendance Workspace Modal states
  const [activeClass, setActiveClass] = useState<ClassAttendanceDailyDto | null>(null);
  const [attendanceForm, setAttendanceForm] = useState<StudentAttendanceFormItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Monthly Matrix states
  const [matrixClassId, setMatrixClassId] = useState<number | null>(null);
  const [matrixYear, setMatrixYear] = useState<number>(() => new Date().getFullYear());
  const [matrixMonth, setMatrixMonth] = useState<number>(() => new Date().getMonth() + 1);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Helper date navigation
  const shiftDate = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    dateObj.setDate(dateObj.getDate() + days);
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const setDateToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const formattedDateVietnamese = useMemo(() => {
    try {
      const parts = selectedDate.split('-').map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const weekdayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const weekday = weekdayNames[dateObj.getDay()];
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      return `${weekday}, ngày ${dd}/${mm}/${yyyy}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // ==========================================
  // QUERY: CLASSES FOR SELECTED DATE
  // ==========================================
  const {
    data: dailyClasses = [],
    isLoading: isLoadingDailyClasses,
    isError: isErrorDailyClasses,
    refetch: refetchDailyClasses
  } = useQuery<ClassAttendanceDailyDto[]>({
    queryKey: ['attendance-classes-by-date', selectedDate],
    queryFn: () => attendanceApi.getClassesByDate(selectedDate),
    staleTime: 30000,
  });

  // Calculate Real KPIs
  const kpis = useMemo(() => {
    const totalClasses = dailyClasses.length;
    const attendedClasses = dailyClasses.filter((c) => c.isAttended).length;
    const unattendedClasses = totalClasses - attendedClasses;

    const totalStudentsInClasses = dailyClasses.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalPresent = dailyClasses.reduce((sum, c) => sum + c.presentCount, 0);
    const totalAttendedStudents = dailyClasses.reduce((sum, c) => sum + c.attendedCount, 0);

    const attendanceRate = totalAttendedStudents > 0
      ? ((totalPresent / totalAttendedStudents) * 100).toFixed(1)
      : null;

    return {
      totalClasses,
      attendedClasses,
      unattendedClasses,
      totalStudentsInClasses,
      totalPresent,
      attendanceRate
    };
  }, [dailyClasses]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return dailyClasses.filter((c) => {
      // Status filter
      if (statusFilter === 'UNATTENDED' && c.isAttended) return false;
      if (statusFilter === 'ATTENDED' && !c.isAttended) return false;

      // Keyword search
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const matchCode = c.classCode.toLowerCase().includes(kw);
        const matchName = c.className.toLowerCase().includes(kw);
        const matchCourse = c.courseName ? c.courseName.toLowerCase().includes(kw) : false;
        const matchTeacher = c.teacherName ? c.teacherName.toLowerCase().includes(kw) : false;
        return matchCode || matchName || matchCourse || matchTeacher;
      }
      return true;
    });
  }, [dailyClasses, statusFilter, searchKeyword]);

  // ==========================================
  // QUERY: ELIGIBLE STUDENTS & EXISTING ATTENDANCE FOR ACTIVE CLASS
  // ==========================================
  const activeClassId = activeClass?.classId ?? null;

  const { data: eligibleStudents = [], isLoading: isLoadingStudents } = useQuery<StudentResponse[]>({
    queryKey: ['attendance-eligible-students', activeClassId],
    queryFn: () => attendanceApi.getEligibleStudents(activeClassId!),
    enabled: !!activeClassId && isModalOpen,
  });

  const { data: existingAttendances = [], isLoading: isLoadingExisting } = useQuery<AttendanceResponse[]>({
    queryKey: ['attendance-class-date', activeClassId, selectedDate],
    queryFn: () => attendanceApi.getByClassId(activeClassId!, { attendanceDate: selectedDate }),
    enabled: !!activeClassId && isModalOpen,
  });

  // Sync form when eligible students or existing attendances change
  React.useEffect(() => {
    if (!isModalOpen || !activeClassId) return;

    // Map existing attendance by studentId
    const existingMap = new Map<number, AttendanceResponse>();
    existingAttendances.forEach((att) => {
      existingMap.set(att.studentId, att);
    });

    const initialFormItems: StudentAttendanceFormItem[] = eligibleStudents.map((st) => {
      const existing = existingMap.get(st.id);
      if (existing) {
        return {
          studentId: st.id,
          studentCode: st.studentCode,
          fullName: st.fullName,
          status: (existing.status as AttendanceStatus) || 'PRESENT',
          note: existing.note || '',
        };
      }
      return {
        studentId: st.id,
        studentCode: st.studentCode,
        fullName: st.fullName,
        status: 'PRESENT', // default to PRESENT
        note: '',
      };
    });

    setAttendanceForm(initialFormItems);
  }, [isModalOpen, activeClassId, eligibleStudents, existingAttendances]);

  // Open modal handler
  const handleOpenAttendanceWorkspace = (cls: ClassAttendanceDailyDto) => {
    setActiveClass(cls);
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveClass(null);
    setAttendanceForm([]);
  };

  // Quick Action: Có mặt tất cả
  const handleMarkAllPresent = () => {
    setAttendanceForm((prev) =>
      prev.map((item) => ({
        ...item,
        status: 'PRESENT',
      }))
    );
    addToast('Đã đánh dấu Có mặt cho toàn bộ học viên', 'success');
  };

  // Change individual student status
  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setAttendanceForm((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, status } : item))
    );
  };

  // Change individual student note
  const handleNoteChange = (studentId: number, note: string) => {
    setAttendanceForm((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, note } : item))
    );
  };

  // ==========================================
  // MUTATION: SAVE BATCH ATTENDANCE
  // ==========================================
  const saveBatchMutation = useMutation({
    mutationFn: async () => {
      if (!activeClass) throw new Error('Không có lớp học được chọn');
      if (attendanceForm.length === 0) {
        throw new Error('Lớp học không có học viên để điểm danh');
      }

      const payload = {
        courseClassId: activeClass.classId,
        attendanceDate: selectedDate,
        items: attendanceForm.map((item) => ({
          studentId: item.studentId,
          status: item.status,
          note: item.note ? item.note.trim() : undefined,
        })),
      };

      return attendanceApi.createBatch(payload);
    },
    onSuccess: () => {
      addToast(`Lưu điểm danh lớp ${activeClass?.classCode} thành công!`, 'success');
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['attendance-classes-by-date', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendance-class-date', activeClass?.classId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendance-matrix'] });
      handleCloseModal();
    },
    onError: (err: any) => {
      addToast(err?.message || 'Có lỗi xảy ra khi lưu điểm danh.', 'error');
    },
  });

  // ==========================================
  // MONTHLY MATRIX DATA
  // ==========================================
  const { data: allClassesData } = useQuery({
    queryKey: ['reference-classes-matrix'],
    queryFn: () => classesApi.search({ size: 100 }),
    enabled: activeTab === 'matrix',
  });

  const availableClasses = allClassesData?.content || [];

  // Auto-select first class if none selected in matrix view
  React.useEffect(() => {
    if (activeTab === 'matrix' && !matrixClassId && availableClasses.length > 0) {
      setMatrixClassId(availableClasses[0].id);
    }
  }, [activeTab, matrixClassId, availableClasses]);

  const {
    data: matrixData = [],
    isLoading: isLoadingMatrix,
    isError: isErrorMatrix,
    refetch: refetchMatrix
  } = useQuery<StudentAttendanceRowDto[]>({
    queryKey: ['attendance-matrix', matrixClassId, matrixYear, matrixMonth],
    queryFn: () => attendanceApi.getMatrix(matrixClassId!, matrixYear, matrixMonth),
    enabled: activeTab === 'matrix' && !!matrixClassId,
  });

  // Calculate days in selected month for matrix header
  const daysInMonth = useMemo(() => {
    const total = new Date(matrixYear, matrixMonth, 0).getDate();
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [matrixYear, matrixMonth]);

  return (
    <div className="space-y-6 relative pb-12">
      {/* Toast Notification Container */}
      <div className="fixed top-5 right-5 z-[110] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`glass px-5 py-4 rounded-2xl flex items-center gap-3 shadow-2xl border animate-slide-in max-w-sm pointer-events-auto ${
              toast.type === 'success'
                ? 'border-emerald-500/25 bg-emerald-950/80 text-emerald-300'
                : 'border-red-500/25 bg-red-950/80 text-red-300'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={20} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={20} className="shrink-0 text-red-400" />
            )}
            <span className="text-sm font-semibold leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main Header Panel */}
      <div className="glass rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border border-white/5 shadow-xl">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shadow-md">
            <CalendarCheck size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-wide">Điểm danh Chuyên cần</h2>
            <p className="text-slate-400 text-sm mt-1">
              Theo dõi và cập nhật tình trạng chuyên cần của học viên theo từng lớp học.
            </p>
          </div>
        </div>

        {/* Tab Selector: Daily Workspace vs Monthly Matrix */}
        <div className="flex items-center bg-slate-900/60 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CalendarCheck size={16} />
            <span>Điểm danh theo ngày</span>
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <CalendarDays size={16} />
            <span>Ma trận theo tháng</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: DAILY WORKSPACE
          ========================================== */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Navigation Controller */}
          <div className="glass rounded-3xl p-5 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => shiftDate(-1)}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                title="Ngày trước"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="relative flex-1 md:w-48">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-brand-500 transition-all text-center cursor-pointer"
                />
              </div>

              <button
                onClick={() => shiftDate(1)}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
                title="Ngày tiếp theo"
              >
                <ChevronRight size={18} />
              </button>

              <button
                onClick={setDateToday}
                className="ml-2 px-4 py-2.5 rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                Hôm nay
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-extrabold text-brand-300 capitalize tracking-wide">
                {formattedDateVietnamese}
              </span>
              <button
                onClick={() => refetchDailyClasses()}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all cursor-pointer"
                title="Tải lại danh sách"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Real KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lớp cần điểm danh</span>
                <h3 className="text-2xl font-black text-slate-100 mt-1">
                  {isLoadingDailyClasses ? '...' : `${kpis.totalClasses} lớp`}
                </h3>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5 text-brand-400">
                <BookOpen size={20} />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Đã điểm danh</span>
                <h3 className="text-2xl font-black text-emerald-400 mt-1">
                  {isLoadingDailyClasses ? '...' : `${kpis.attendedClasses} lớp`}
                </h3>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5 text-emerald-400">
                <CheckCircle size={20} />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Chưa điểm danh</span>
                <h3 className="text-2xl font-black text-amber-400 mt-1">
                  {isLoadingDailyClasses ? '...' : `${kpis.unattendedClasses} lớp`}
                </h3>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5 text-amber-400">
                <Clock size={20} />
              </div>
            </div>

            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tỉ lệ có mặt</span>
                <h3 className="text-2xl font-black text-brand-300 mt-1">
                  {isLoadingDailyClasses ? '...' : kpis.attendanceRate !== null ? `${kpis.attendanceRate}%` : 'Chưa có'}
                </h3>
              </div>
              <div className="p-3 bg-slate-800/40 rounded-xl border border-white/5 text-brand-300">
                <Percent size={20} />
              </div>
            </div>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="glass rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
            <div className="relative flex-1 w-full md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo mã lớp, tên lớp, môn học, giáo viên..."
                className="w-full bg-slate-900/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Tất cả ({kpis.totalClasses})
              </button>
              <button
                onClick={() => setStatusFilter('UNATTENDED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'UNATTENDED'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Chưa điểm danh ({kpis.unattendedClasses})
              </button>
              <button
                onClick={() => setStatusFilter('ATTENDED')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'ATTENDED'
                    ? 'bg-emerald-600 text-white font-black'
                    : 'bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Đã điểm danh ({kpis.attendedClasses})
              </button>
            </div>
          </div>

          {/* Classes Table */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-4 px-6">Mã lớp</th>
                    <th className="py-4 px-6">Lớp học</th>
                    <th className="py-4 px-6">Môn học</th>
                    <th className="py-4 px-6">Ca học</th>
                    <th className="py-4 px-6">Phòng</th>
                    <th className="py-4 px-6">Giáo viên</th>
                    <th className="py-4 px-6 text-center">Số HV</th>
                    <th className="py-4 px-6 text-center">Trạng thái</th>
                    <th className="py-4 px-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                  {isLoadingDailyClasses && (
                    [...Array(4)].map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-40"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-28"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-12 mx-auto"></div></td>
                        <td className="py-4 px-6"><div className="h-6 bg-slate-800 rounded-full w-28 mx-auto"></div></td>
                        <td className="py-4 px-6"><div className="h-8 bg-slate-800 rounded-xl w-24 mx-auto"></div></td>
                      </tr>
                    ))
                  )}

                  {!isLoadingDailyClasses && isErrorDailyClasses && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <AlertCircle size={32} className="text-red-400" />
                          <p className="text-slate-300 text-sm font-semibold">
                            Không thể tải dữ liệu điểm danh cho ngày này.
                          </p>
                          <button
                            onClick={() => refetchDailyClasses()}
                            className="mt-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
                          >
                            Thử lại
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoadingDailyClasses && !isErrorDailyClasses && filteredClasses.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Calendar size={36} className="text-slate-600 mb-1" />
                          <p className="text-slate-400 font-semibold text-sm">
                            {searchKeyword.trim() || statusFilter !== 'ALL'
                              ? 'Không tìm thấy lớp học nào phù hợp với bộ lọc.'
                              : `Không có lớp học nào có lịch trong ngày ${selectedDate}.`}
                          </p>
                          <p className="text-slate-500 text-xs">
                            Hãy thử chuyển ngày hoặc chọn [Hôm nay] để kiểm tra lịch học.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {!isLoadingDailyClasses && !isErrorDailyClasses && filteredClasses.map((cls) => (
                    <tr key={cls.classId} className="hover:bg-slate-900/30 transition-all duration-150">
                      <td className="py-4 px-6 font-mono font-bold text-brand-400 text-xs">
                        {cls.classCode}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-100">
                        {cls.className}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-300 text-xs">
                        {cls.courseName || '—'}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} className="text-slate-500" />
                          {cls.scheduleLabel || '—'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-300">
                        {cls.roomName || '—'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-300 font-medium">
                        {cls.teacherName || 'Chưa gán'}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-200">
                        {cls.totalStudents}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {cls.isAttended ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={13} />
                            Đã điểm danh ({cls.attendedCount}/{cls.totalStudents})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock size={13} />
                            Chưa điểm danh
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenAttendanceWorkspace(cls)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md ${
                            cls.isAttended
                              ? 'bg-slate-800 hover:bg-slate-700 text-brand-300 border border-brand-500/30'
                              : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30'
                          }`}
                        >
                          {cls.isAttended ? (
                            <>
                              <Edit3 size={14} />
                              <span>Chỉnh sửa</span>
                            </>
                          ) : (
                            <>
                              <CheckCheck size={14} />
                              <span>Điểm danh</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: MONTHLY ATTENDANCE MATRIX
          ========================================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Matrix Controls Toolbar */}
          <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <div className="w-full sm:w-64">
                <label className="block text-xs font-bold text-slate-400 mb-1">Chọn lớp học *</label>
                <select
                  value={matrixClassId || ''}
                  onChange={(e) => setMatrixClassId(Number(e.target.value))}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 font-semibold focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id} className="bg-slate-900 text-slate-200">
                      {cls.classCode} - {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Tháng</label>
                <select
                  value={matrixMonth}
                  onChange={(e) => setMatrixMonth(Number(e.target.value))}
                  className="bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 font-semibold focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-slate-900 text-slate-200">
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Năm</label>
                <input
                  type="number"
                  value={matrixYear}
                  onChange={(e) => setMatrixYear(Number(e.target.value))}
                  className="w-24 bg-slate-900/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 font-semibold focus:outline-none focus:border-brand-500 text-center"
                />
              </div>
            </div>

            {/* Matrix Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-900/40 px-4 py-2.5 rounded-2xl border border-white/5">
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
                Có mặt
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-amber-500/20 text-amber-400 font-bold">L</span>
                Đi muộn
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-blue-500/20 text-blue-400 font-bold">P</span>
                Vắng phép
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <span className="w-5 h-5 rounded flex items-center justify-center bg-red-500/20 text-red-400 font-bold">A</span>
                Vắng KP
              </span>
            </div>
          </div>

          {/* Matrix Grid Container */}
          <div className="glass rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 sticky left-0 z-20 bg-slate-900 min-w-[180px]">Học viên</th>
                    {daysInMonth.map((day) => (
                      <th key={day} className="py-3 px-2 text-center min-w-[34px] font-mono text-[11px]">
                        {String(day).padStart(2, '0')}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center min-w-[70px] bg-slate-900">Có mặt</th>
                    <th className="py-3 px-4 text-center min-w-[70px] bg-slate-900">Vắng</th>
                    <th className="py-3 px-4 text-center min-w-[80px] bg-slate-900">Tỉ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                  {isLoadingMatrix && (
                    <tr>
                      <td colSpan={daysInMonth.length + 4} className="py-16 text-center text-slate-400">
                        Đang tải ma trận điểm danh...
                      </td>
                    </tr>
                  )}

                  {!isLoadingMatrix && isErrorMatrix && (
                    <tr>
                      <td colSpan={daysInMonth.length + 4} className="py-16 text-center text-red-400">
                        Không thể tải ma trận điểm danh cho lớp học này.
                      </td>
                    </tr>
                  )}

                  {!isLoadingMatrix && !isErrorMatrix && matrixData.length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth.length + 4} className="py-16 text-center text-slate-500">
                        Chưa có dữ liệu điểm danh trong Tháng {matrixMonth}/{matrixYear} cho lớp này.
                      </td>
                    </tr>
                  )}

                  {!isLoadingMatrix && !isErrorMatrix && matrixData.map((row) => {
                    // Compute totals for row
                    let present = 0;
                    let absent = 0;
                    let late = 0;
                    let excused = 0;

                    Object.values(row.attendanceByDate || {}).forEach((st) => {
                      if (st === 'PRESENT') present++;
                      else if (st === 'ABSENT') absent++;
                      else if (st === 'LATE') late++;
                      else if (st === 'EXCUSED') excused++;
                    });

                    const totalRecorded = present + absent + late + excused;
                    const rate = totalRecorded > 0 ? ((present / totalRecorded) * 100).toFixed(0) : '0';

                    return (
                      <tr key={row.studentId} className="hover:bg-slate-900/30 transition-all">
                        <td className="py-3 px-4 font-bold text-slate-100 sticky left-0 bg-slate-950/90 z-10 border-r border-slate-800">
                          {row.studentName}
                        </td>
                        {daysInMonth.map((day) => {
                          const dateKey = `${matrixYear}-${String(matrixMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const st = row.attendanceByDate?.[dateKey];

                          return (
                            <td key={day} className="py-2.5 px-1 text-center font-bold">
                              {st === 'PRESENT' && (
                                <span className="inline-block w-6 h-6 leading-6 rounded bg-emerald-500/20 text-emerald-400">
                                  ✓
                                </span>
                              )}
                              {st === 'LATE' && (
                                <span className="inline-block w-6 h-6 leading-6 rounded bg-amber-500/20 text-amber-400">
                                  L
                                </span>
                              )}
                              {st === 'EXCUSED' && (
                                <span className="inline-block w-6 h-6 leading-6 rounded bg-blue-500/20 text-blue-400">
                                  P
                                </span>
                              )}
                              {st === 'ABSENT' && (
                                <span className="inline-block w-6 h-6 leading-6 rounded bg-red-500/20 text-red-400">
                                  A
                                </span>
                              )}
                              {!st && <span className="text-slate-700 font-mono">-</span>}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center font-black text-emerald-400">
                          {present}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-rose-400">
                          {absent + excused}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-brand-300">
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ATTENDANCE WORKSPACE
          ========================================== */}
      {isModalOpen && activeClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="glass rounded-3xl border border-white/10 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-zoom-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-500/10 text-brand-400 rounded-2xl border border-brand-500/20">
                  <CheckCheck size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-black bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded">
                      {activeClass.classCode}
                    </span>
                    <h3 className="text-lg font-bold text-slate-50">
                      Điểm danh: {activeClass.className}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} className="text-slate-500" />
                      {formattedDateVietnamese}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-500" />
                      Ca: {activeClass.scheduleLabel || 'Tiêu chuẩn'}
                    </span>
                    {activeClass.roomName && (
                      <span>Phòng: {activeClass.roomName}</span>
                    )}
                    {activeClass.teacherName && (
                      <span>GV: {activeClass.teacherName}</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Quick Actions Bar */}
            <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  disabled={attendanceForm.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Check size={14} />
                  <span>Có mặt tất cả</span>
                </button>
                <span className="text-xs text-slate-400">
                  Tổng số: <strong className="text-slate-200">{attendanceForm.length}</strong> học viên
                </span>
              </div>

              {/* Status summary counters */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-400 font-semibold">
                  Có mặt:{' '}
                  <strong>{attendanceForm.filter((i) => i.status === 'PRESENT').length}</strong>
                </span>
                <span className="text-amber-400 font-semibold">
                  Đi muộn:{' '}
                  <strong>{attendanceForm.filter((i) => i.status === 'LATE').length}</strong>
                </span>
                <span className="text-blue-400 font-semibold">
                  Vắng phép:{' '}
                  <strong>{attendanceForm.filter((i) => i.status === 'EXCUSED').length}</strong>
                </span>
                <span className="text-rose-400 font-semibold">
                  Vắng KP:{' '}
                  <strong>{attendanceForm.filter((i) => i.status === 'ABSENT').length}</strong>
                </span>
              </div>
            </div>

            {/* Modal Student List Form */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingStudents || isLoadingExisting ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-semibold">Đang tải danh sách học viên trong lớp...</span>
                </div>
              ) : attendanceForm.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Users size={36} className="mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-sm text-slate-400">
                    Lớp học này chưa có học viên nào hợp lệ để điểm danh.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Học viên phải có trạng thái Đăng ký (Enrollment) và Học viên đều là ACTIVE.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {attendanceForm.map((item, idx) => {
                    const isAbsentOrLate =
                      item.status === 'EXCUSED' || item.status === 'ABSENT' || item.status === 'LATE';

                    return (
                      <div
                        key={item.studentId}
                        className="rounded-2xl bg-slate-900/50 border border-slate-800/80 p-4 hover:border-slate-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        {/* Student Info */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <span className="w-6 text-center text-xs font-mono font-bold text-slate-500">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-mono text-xs font-bold text-brand-400 mr-2">
                              {item.studentCode}
                            </span>
                            <span className="font-bold text-slate-100 text-sm">
                              {item.fullName}
                            </span>
                          </div>
                        </div>

                        {/* Segmented Status Buttons & Reason Input */}
                        <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-3">
                          {/* Segmented Status Selector */}
                          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.studentId, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                item.status === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Có mặt
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.studentId, 'LATE')}
                              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                item.status === 'LATE'
                                  ? 'bg-amber-500 text-slate-950 shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Đi muộn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.studentId, 'EXCUSED')}
                              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                item.status === 'EXCUSED'
                                  ? 'bg-blue-600 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Vắng phép
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(item.studentId, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                                item.status === 'ABSENT'
                                  ? 'bg-red-600 text-white shadow'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              Vắng KP
                            </button>
                          </div>

                          {/* Dynamic Reason Field */}
                          {isAbsentOrLate ? (
                            <div className="w-full sm:w-64 animate-fade-in">
                              <input
                                type="text"
                                value={item.note}
                                onChange={(e) => handleNoteChange(item.studentId, e.target.value)}
                                placeholder="Nhập lý do vắng / muộn..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
                              />
                            </div>
                          ) : (
                            item.note && (
                              <div className="text-xs text-slate-500 italic max-w-[180px] truncate">
                                {item.note}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={saveBatchMutation.isPending}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold px-5 py-3 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => saveBatchMutation.mutate()}
                disabled={saveBatchMutation.isPending || attendanceForm.length === 0}
                className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold px-6 py-3 transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-brand-600/30"
              >
                {saveBatchMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck size={16} />
                    <span>Lưu điểm danh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;
