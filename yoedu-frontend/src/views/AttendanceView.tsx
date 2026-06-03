import React from 'react';
import { ModulePlaceholder } from '../components/ModulePlaceholder';
import { CalendarCheck } from 'lucide-react';

export const AttendanceView: React.FC = () => {
  return (
    <ModulePlaceholder
      title="Nghiệp vụ Điểm danh"
      description="Điểm danh chuyên cần hàng ngày cho học viên trong lớp và xem bảng ma trận điểm danh tổng quát theo tháng."
      icon={<CalendarCheck size={28} />}
      stats={[
        { label: 'Lớp đã điểm danh hôm nay', value: '12 / 18 lớp' },
        { label: 'Tỉ lệ đi học trung bình', value: '94.2 %' },
        { label: 'Học viên vắng có phép', value: '8 em' },
      ]}
      actions={[
        'Điểm danh lớp học theo ngày (Batch Attendance)',
        'Tra cứu ma trận điểm danh của lớp theo tháng',
        'Lọc danh sách học viên hợp lệ được phép điểm danh',
        'Ghi chú lý do vắng học của học viên (Có phép/Không phép)',
      ]}
    />
  );
};
export default AttendanceView;
