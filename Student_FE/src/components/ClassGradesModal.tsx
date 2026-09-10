import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Modal } from './ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface Grade {
  id: number;
  studentName: string;
  resultMonth: string;
  score: number;
  classification: string;
  status: string;
  attendanceRate: number;
}

export const ClassGradesModal: React.FC<{ isOpen: boolean; onClose: () => void; classId: number | null; className: string }> = ({ isOpen, onClose, classId, className }) => {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: grades, isLoading } = useQuery<Grade[]>({
    queryKey: ['class-grades', classId, month],
    queryFn: async () => {
      if (!classId) return [];
      const response = await api.post('/api/learning-results/search', {
        courseClassId: classId,
        month: month
      });
      return response as any;
    },
    enabled: isOpen && !!classId,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Bảng điểm lớp: ${className}`} maxWidth="4xl">
      <div className="space-y-4">
        <div className="flex justify-end mb-4">
          <input 
            type="month" 
            value={month} 
            onChange={(e) => setMonth(e.target.value)} 
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-sm"
          />
        </div>
        
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Tháng</TableHead>
                <TableHead align="center">Chuyên cần</TableHead>
                <TableHead align="center">Điểm số</TableHead>
                <TableHead>Xếp loại</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4">Đang tải...</TableCell></TableRow>
              ) : !grades || grades.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4 text-foreground-muted">Chưa có dữ liệu điểm.</TableCell></TableRow>
              ) : (
                grades.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.studentName}</TableCell>
                    <TableCell>{g.resultMonth}</TableCell>
                    <TableCell align="center">{g.attendanceRate != null ? `${g.attendanceRate.toFixed(0)}%` : '-'}</TableCell>
                    <TableCell align="center" className="font-bold">{g.score}</TableCell>
                    <TableCell>
                      <Badge variant={g.classification === 'XUAT_SAC' ? 'success' : g.classification === 'GIOI' ? 'primary' : g.classification === 'KHA' ? 'info' : g.classification === 'TRUNG_BINH' ? 'warning' : 'danger'}>
                        {g.classification}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={g.status === 'LOCKED' ? 'default' : 'secondary'}>{g.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
};
