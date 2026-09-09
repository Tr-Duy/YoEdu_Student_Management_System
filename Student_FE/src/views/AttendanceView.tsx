import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck, Calendar, ChevronLeft, ChevronRight, Search,
  CheckCircle, AlertCircle, Clock, BookOpen, X, Check, Users,
  CheckCheck, RefreshCw, Edit3, CalendarDays, Percent, ListFilter
} from 'lucide-react';
import { attendanceApi } from '../features/attendance/attendance.api';
import { classesApi } from '../features/classes/classes.api';
import type {
  ClassAttendanceDailyDto, AttendanceStatus, StudentResponse,
  AttendanceResponse, StudentAttendanceRowDto
} from '../types/yoedu';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';

interface StudentAttendanceFormItem {
  studentId: number;
  studentCode: string;
  fullName: string;
  status: AttendanceStatus;
  note: string;
}

export const AttendanceView: React.FC = () => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'daily' | 'matrix'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNATTENDED' | 'ATTENDED'>('ALL');

  const [activeClass, setActiveClass] = useState<ClassAttendanceDailyDto | null>(null);
  const [attendanceForm, setAttendanceForm] = useState<StudentAttendanceFormItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [matrixClassId, setMatrixClassId] = useState<number | null>(null);
  const [matrixYear, setMatrixYear] = useState<number>(() => new Date().getFullYear());
  const [matrixMonth, setMatrixMonth] = useState<number>(() => new Date().getMonth() + 1);

  const shiftDate = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    dateObj.setDate(dateObj.getDate() + days);
    setSelectedDate(`${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`);
  };
  const setDateToday = () => {
    const now = new Date();
    setSelectedDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
  };

  const formattedDateVietnamese = useMemo(() => {
    try {
      const parts = selectedDate.split('-').map(Number);
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const weekdayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      return `${weekdayNames[dateObj.getDay()]}, ngày ${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const { data: dailyClasses = [], isLoading: isLoadingDailyClasses, refetch: refetchDailyClasses } = useQuery({
    queryKey: ['attendance-classes-by-date', selectedDate],
    queryFn: () => attendanceApi.getClassesByDate(selectedDate),
    staleTime: 30000,
  });

  const kpis = useMemo(() => {
    const totalClasses = dailyClasses.length;
    const attendedClasses = dailyClasses.filter((c) => c.isAttended).length;
    const unattendedClasses = totalClasses - attendedClasses;
    const totalStudentsInClasses = dailyClasses.reduce((sum, c) => sum + c.totalStudents, 0);
    const totalPresent = dailyClasses.reduce((sum, c) => sum + c.presentCount, 0);
    const totalAttendedStudents = dailyClasses.reduce((sum, c) => sum + c.attendedCount, 0);
    const attendanceRate = totalAttendedStudents > 0 ? ((totalPresent / totalAttendedStudents) * 100).toFixed(1) : null;
    return { totalClasses, attendedClasses, unattendedClasses, totalStudentsInClasses, totalPresent, attendanceRate };
  }, [dailyClasses]);

  const filteredClasses = useMemo(() => {
    return dailyClasses.filter((c) => {
      if (statusFilter === 'UNATTENDED' && c.isAttended) return false;
      if (statusFilter === 'ATTENDED' && !c.isAttended) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        return c.classCode.toLowerCase().includes(kw) || c.className.toLowerCase().includes(kw) || 
               (c.courseName && c.courseName.toLowerCase().includes(kw)) || 
               (c.teacherName && c.teacherName.toLowerCase().includes(kw));
      }
      return true;
    });
  }, [dailyClasses, statusFilter, searchKeyword]);

  const activeClassId = activeClass?.classId ?? null;

  const { data: eligibleStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['attendance-eligible-students', activeClassId],
    queryFn: () => attendanceApi.getEligibleStudents(activeClassId!),
    enabled: !!activeClassId && isModalOpen,
  });

  const { data: existingAttendances = [], isLoading: isLoadingExisting } = useQuery({
    queryKey: ['attendance-class-date', activeClassId, selectedDate],
    queryFn: () => attendanceApi.getByClassId(activeClassId!, { attendanceDate: selectedDate }),
    enabled: !!activeClassId && isModalOpen,
  });

  React.useEffect(() => {
    if (!isModalOpen || !activeClassId) return;
    const existingMap = new Map<number, AttendanceResponse>();
    existingAttendances.forEach(att => existingMap.set(att.studentId, att));

    const initialFormItems: StudentAttendanceFormItem[] = eligibleStudents.map(st => {
      const existing = existingMap.get(st.id);
      return {
        studentId: st.id,
        studentCode: st.studentCode,
        fullName: st.fullName,
        status: existing ? (existing.status as AttendanceStatus) : 'PRESENT',
        note: existing?.note || '',
      };
    });
    setAttendanceForm(initialFormItems);
  }, [isModalOpen, activeClassId, eligibleStudents, existingAttendances]);

  const handleOpenAttendanceWorkspace = (cls: ClassAttendanceDailyDto) => { setActiveClass(cls); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setActiveClass(null); setAttendanceForm([]); };

  const handleMarkAllPresent = () => setAttendanceForm(prev => prev.map(item => ({ ...item, status: 'PRESENT' })));
  const handleStatusChange = (studentId: number, status: AttendanceStatus) => setAttendanceForm(prev => prev.map(item => item.studentId === studentId ? { ...item, status } : item));
  const handleNoteChange = (studentId: number, note: string) => setAttendanceForm(prev => prev.map(item => item.studentId === studentId ? { ...item, note } : item));

  const saveBatchMutation = useMutation({
    mutationFn: async () => {
      if (!activeClass || attendanceForm.length === 0) return;
      return attendanceApi.createBatch({
        courseClassId: activeClass.classId,
        attendanceDate: selectedDate,
        items: attendanceForm.map(item => ({ studentId: item.studentId, status: item.status, note: item.note?.trim() })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-classes-by-date', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendance-class-date', activeClass?.classId, selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['attendance-matrix'] });
      handleCloseModal();
    }
  });

  const { data: allClassesData } = useQuery({
    queryKey: ['reference-classes-matrix'],
    queryFn: () => classesApi.search({ size: 100 }),
    enabled: activeTab === 'matrix',
  });
  const availableClasses = allClassesData?.content || [];

  React.useEffect(() => {
    if (activeTab === 'matrix' && !matrixClassId && availableClasses.length > 0) setMatrixClassId(availableClasses[0].id);
  }, [activeTab, matrixClassId, availableClasses]);

  const { data: matrixData = [], isLoading: isLoadingMatrix } = useQuery({
    queryKey: ['attendance-matrix', matrixClassId, matrixYear, matrixMonth],
    queryFn: () => attendanceApi.getMatrix(matrixClassId!, matrixYear, matrixMonth),
    enabled: activeTab === 'matrix' && !!matrixClassId,
  });

  const daysInMonth = useMemo(() => Array.from({ length: new Date(matrixYear, matrixMonth, 0).getDate() }, (_, i) => i + 1), [matrixYear, matrixMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Điểm danh Chuyên cần</h2>
          <p className="text-sm text-slate-400 mt-1">Theo dõi và cập nhật tình trạng chuyên cần của học viên theo từng lớp học.</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-1.5 flex items-center gap-1 w-max">
           <button onClick={() => setActiveTab('daily')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'daily' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>Theo ngày</button>
           <button onClick={() => setActiveTab('matrix')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'matrix' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>Ma trận</button>
        </div>
      </div>

      {activeTab === 'daily' ? (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="flex items-center gap-2 w-full md:w-auto">
                <Button variant="secondary" onClick={() => shiftDate(-1)}><ChevronLeft size={16}/></Button>
                <input type="date" value={selectedDate} onChange={(e) => e.target.value && setSelectedDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-brand-500" />
                <Button variant="secondary" onClick={() => shiftDate(1)}><ChevronRight size={16}/></Button>
                <Button variant="ghost" className="text-brand-400" onClick={setDateToday}>Hôm nay</Button>
             </div>
             <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-brand-400">{formattedDateVietnamese}</span>
                <Button variant="ghost" onClick={() => refetchDailyClasses()}><RefreshCw size={16}/></Button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-slate-800 text-slate-300 p-3 rounded-lg"><BookOpen size={20}/></div>
                <div><div className="text-sm text-slate-400">Cần điểm danh</div><div className="text-xl font-bold text-slate-200">{kpis.totalClasses} lớp</div></div>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-lg"><CheckCircle size={20}/></div>
                <div><div className="text-sm text-slate-400">Đã điểm danh</div><div className="text-xl font-bold text-emerald-400">{kpis.attendedClasses} lớp</div></div>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-amber-500/10 text-amber-400 p-3 rounded-lg"><Clock size={20}/></div>
                <div><div className="text-sm text-slate-400">Chưa điểm danh</div><div className="text-xl font-bold text-amber-400">{kpis.unattendedClasses} lớp</div></div>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-brand-500/10 text-brand-400 p-3 rounded-lg"><Percent size={20}/></div>
                <div><div className="text-sm text-slate-400">Tỉ lệ có mặt</div><div className="text-xl font-bold text-brand-400">{kpis.attendanceRate !== null ? `${kpis.attendanceRate}%` : '--'}</div></div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="relative w-full md:w-96">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="Tìm lớp, môn, giáo viên..." className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-brand-500" />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
               {['ALL', 'UNATTENDED', 'ATTENDED'].map(filter => (
                  <button key={filter} onClick={() => setStatusFilter(filter as any)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === filter ? 'bg-brand-500/10 text-brand-400' : 'text-slate-400 hover:bg-slate-800'}`}>
                     {filter === 'ALL' && `Tất cả (${kpis.totalClasses})`}
                     {filter === 'UNATTENDED' && `Chưa điểm danh (${kpis.unattendedClasses})`}
                     {filter === 'ATTENDED' && `Đã điểm danh (${kpis.attendedClasses})`}
                  </button>
               ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Mã Lớp</TableHead>
                   <TableHead>Thông tin Lớp</TableHead>
                   <TableHead>Ca & Phòng</TableHead>
                   <TableHead>Giáo viên</TableHead>
                   <TableHead className="text-center">Sĩ số</TableHead>
                   <TableHead className="text-center">Trạng thái</TableHead>
                   <TableHead className="text-right">Thao tác</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoadingDailyClasses ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">Đang tải...</TableCell></TableRow>
                 ) : filteredClasses.length === 0 ? (
                    <TableRow>
                       <TableCell colSpan={7} className="py-8"><EmptyState title="Không có lớp" description="Không có lớp học nào trong ngày này." /></TableCell>
                    </TableRow>
                 ) : (
                    filteredClasses.map(c => (
                       <TableRow key={c.classId}>
                          <TableCell className="font-mono text-brand-400 font-medium">{c.classCode}</TableCell>
                          <TableCell>
                             <div className="font-medium text-slate-200">{c.className}</div>
                             <div className="text-xs text-slate-500">{c.courseName}</div>
                          </TableCell>
                          <TableCell>
                             <div className="text-sm text-slate-300">{c.scheduleLabel}</div>
                             <div className="text-xs text-slate-500">{c.roomName}</div>
                          </TableCell>
                          <TableCell className="text-slate-300">{c.teacherName}</TableCell>
                          <TableCell className="text-center">
                             {c.isAttended ? (
                                <div className="text-xs font-semibold text-emerald-400">{c.presentCount} / {c.attendedCount}</div>
                             ) : (
                                <div className="text-xs text-slate-500">{c.totalStudents} HV</div>
                             )}
                          </TableCell>
                          <TableCell className="text-center">
                             <Badge variant={c.isAttended ? 'success' : 'warning'}>{c.isAttended ? 'Đã điểm danh' : 'Chưa điểm danh'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                             <Button size="sm" variant={c.isAttended ? 'secondary' : 'primary'} onClick={() => handleOpenAttendanceWorkspace(c)}>
                                {c.isAttended ? 'Sửa' : 'Điểm danh'}
                             </Button>
                          </TableCell>
                       </TableRow>
                    ))
                 )}
               </TableBody>
             </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap gap-4 items-end">
             <div className="w-full md:w-64">
                <Select label="Chọn Lớp" value={matrixClassId || ''} onChange={(e) => setMatrixClassId(Number(e.target.value))}>
                   {availableClasses.map(c => <option key={c.id} value={c.id}>{c.classCode} - {c.name}</option>)}
                </Select>
             </div>
             <div className="w-1/2 md:w-32">
                <Select label="Tháng" value={matrixMonth} onChange={(e) => setMatrixMonth(Number(e.target.value))}>
                   {Array.from({ length: 12 }).map((_, i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                </Select>
             </div>
             <div className="w-1/2 md:w-32">
                <Select label="Năm" value={matrixYear} onChange={(e) => setMatrixYear(Number(e.target.value))}>
                   {Array.from({ length: 5 }).map((_, i) => { const y = new Date().getFullYear() - 2 + i; return <option key={y} value={y}>{y}</option>; })}
                </Select>
             </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
             <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                   <tr className="bg-slate-800 border-b border-slate-700">
                      <th className="py-3 px-4 font-semibold text-slate-300 sticky left-0 bg-slate-800 z-10 w-48">Học viên</th>
                      {daysInMonth.map(d => <th key={d} className="py-3 px-2 text-center text-xs font-semibold text-slate-400 min-w-[32px]">{d}</th>)}
                      <th className="py-3 px-4 text-center font-semibold text-emerald-400">Có mặt</th>
                      <th className="py-3 px-4 text-center font-semibold text-rose-400">Vắng</th>
                      <th className="py-3 px-4 text-center font-semibold text-brand-300">Tỉ lệ</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                   {isLoadingMatrix ? (
                      <tr><td colSpan={daysInMonth.length + 4} className="py-8 text-center text-slate-500">Đang tải...</td></tr>
                   ) : matrixData.length === 0 ? (
                      <tr><td colSpan={daysInMonth.length + 4} className="py-8"><EmptyState title="Không có dữ liệu" description="Chưa có dữ liệu điểm danh trong tháng này." /></td></tr>
                   ) : (
                      matrixData.map(row => {
                         const present = row.days.filter(d => d.status === 'PRESENT' || d.status === 'LATE').length;
                         const absent = row.days.filter(d => d.status === 'ABSENT').length;
                         const excused = row.days.filter(d => d.status === 'EXCUSED').length;
                         const total = present + absent + excused;
                         const rate = total > 0 ? Math.round((present / total) * 100) : 0;
                         return (
                            <tr key={row.studentId} className="hover:bg-slate-800/50">
                               <td className="py-2 px-4 sticky left-0 bg-slate-900 hover:bg-slate-800/50 z-10 font-medium truncate max-w-[200px]" title={`${row.studentCode} - ${row.studentName}`}>
                                  {row.studentName}
                               </td>
                               {daysInMonth.map(d => {
                                  const ds = row.days.find(x => parseInt(x.date.split('-')[2]) === d);
                                  return (
                                     <td key={d} className="py-2 px-1 text-center font-mono text-xs">
                                        {!ds ? <span className="text-slate-700">-</span> : 
                                         ds.status === 'PRESENT' ? <span className="text-emerald-400 font-bold">P</span> :
                                         ds.status === 'LATE' ? <span className="text-amber-400 font-bold">L</span> :
                                         ds.status === 'EXCUSED' ? <span className="text-blue-400 font-bold">E</span> :
                                         <span className="text-rose-400 font-bold">A</span>}
                                     </td>
                                  );
                               })}
                               <td className="py-2 px-4 text-center font-bold text-emerald-400">{present}</td>
                               <td className="py-2 px-4 text-center font-bold text-rose-400">{absent + excused}</td>
                               <td className="py-2 px-4 text-center font-bold text-brand-300">{rate}%</td>
                            </tr>
                         );
                      })
                   )}
                </tbody>
             </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Điểm danh: ${activeClass?.className}`} maxWidth="3xl">
         <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700">
               <div className="text-sm text-slate-300">
                  <span className="font-semibold">{attendanceForm.length}</span> học viên
               </div>
               <Button size="sm" variant="secondary" onClick={handleMarkAllPresent}>Có mặt tất cả</Button>
            </div>
            
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
               {attendanceForm.map((item, idx) => (
                  <div key={item.studentId} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono w-5">{idx + 1}</span>
                        <div>
                           <div className="font-medium text-slate-200">{item.fullName}</div>
                           <div className="text-xs text-brand-400 font-mono">{item.studentCode}</div>
                        </div>
                     </div>
                     <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end sm:items-center">
                        <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
                           <button onClick={() => handleStatusChange(item.studentId, 'PRESENT')} className={`px-2 py-1 text-xs rounded-md font-medium ${item.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>Có mặt</button>
                           <button onClick={() => handleStatusChange(item.studentId, 'LATE')} className={`px-2 py-1 text-xs rounded-md font-medium ${item.status === 'LATE' ? 'bg-amber-500 text-slate-900' : 'text-slate-400'}`}>Đi muộn</button>
                           <button onClick={() => handleStatusChange(item.studentId, 'EXCUSED')} className={`px-2 py-1 text-xs rounded-md font-medium ${item.status === 'EXCUSED' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Phép</button>
                           <button onClick={() => handleStatusChange(item.studentId, 'ABSENT')} className={`px-2 py-1 text-xs rounded-md font-medium ${item.status === 'ABSENT' ? 'bg-rose-600 text-white' : 'text-slate-400'}`}>Vắng</button>
                        </div>
                        {(item.status !== 'PRESENT') && (
                           <input type="text" value={item.note} onChange={(e) => handleNoteChange(item.studentId, e.target.value)} placeholder="Ghi chú..." className="w-full sm:w-32 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-brand-500" />
                        )}
                     </div>
                  </div>
               ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
               <Button variant="secondary" onClick={handleCloseModal}>Hủy</Button>
               <Button variant="primary" onClick={() => saveBatchMutation.mutate()} isLoading={saveBatchMutation.isPending}>Lưu Điểm danh</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default AttendanceView;
