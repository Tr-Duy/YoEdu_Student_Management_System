INSERT IGNORE INTO parents (full_name, phone, email, address) VALUES
('Nguyễn Văn Minh', '0901000001', 'minh.parent@example.com', 'Tân Phú, TP.HCM'),
('Trần Thị Lan', '0901000002', 'lan.parent@example.com', 'Bình Tân, TP.HCM');

INSERT IGNORE INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url) VALUES
('GV001', 'Lê Hoàng Nam', '0911000001', 'nam.teacher@example.com', 'TEACHER', 'files/cccd-nam.jpg'),
('GV002', 'Phạm Thu Hà', '0911000002', 'ha.teacher@example.com', 'ASSISTANT', 'files/cccd-ha.jpg'),
('GV003', 'Nguyễn Tuấn Anh', '0911000003', 'anh.teacher@example.com', 'BOTH', 'files/cccd-anh.jpg');

INSERT IGNORE INTO users (username, password_hash, full_name, phone, email, role, parent_id, teacher_id) VALUES
('admin', '{noop}123456', 'System Admin', '0909000001', 'admin@yoedu.local', 'ADMIN', NULL, NULL),
('hocvu01', '{noop}123456', 'Nhân viên Học vụ', '0909000002', 'hocvu@yoedu.local', 'ACADEMIC_STAFF', NULL, NULL),
('thungan01', '{noop}123456', 'Nhân viên Thu ngân', '0909000003', 'cashier@yoedu.local', 'CASHIER', NULL, NULL),
('phhuynh01', '{noop}123456', 'Nguyễn Văn Minh', '0901000001', 'minh.parent@example.com', 'PARENT', 1, NULL);

INSERT IGNORE INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score, note) VALUES
('HV001', 'Nguyễn Gia Hân', '2014-03-10', 'FEMALE', 'Lớp 6', 'THCS Nguyễn Du', '0933000001', 1, 'ACTIVE', 8.50, 'Học viên tích cực'),
('HV002', 'Trần Minh Khang', '2013-09-21', 'MALE', 'Lớp 7', 'THCS Lê Quý Đôn', '0933000002', 1, 'ACTIVE', 7.80, NULL),
('HV003', 'Lê Khánh Linh', '2015-01-05', 'FEMALE', 'Lớp 5', 'Tiểu học Trần Quốc Toản', '0933000003', 2, 'PAUSED', 9.10, 'Tạm ngưng 2 tuần'),
('HV004', 'Phạm Quốc Bảo', '2014-11-12', 'MALE', 'Lớp 6', 'THCS Nguyễn Du', '0933000004', 2, 'ACTIVE', 6.90, NULL);

INSERT IGNORE INTO courses (course_code, name, description, tuition_fee, total_sessions) VALUES
('C001', 'Anh văn thiếu nhi 1', 'Khóa nền tảng tiếng Anh cho học sinh tiểu học', 1200000, 24),
('C002', 'Lập trình Scratch cơ bản', 'Làm quen tư duy lập trình cho học sinh', 1500000, 20),
('C003', 'Toán tư duy lớp 6', 'Phát triển tư duy logic và giải quyết vấn đề', 1300000, 24);

INSERT IGNORE INTO rooms (room_code, name, capacity, description) VALUES
('P101', 'Phòng 101', 25, 'Phòng học tiêu chuẩn'),
('P102', 'Phòng 102', 30, 'Phòng học có máy chiếu');

INSERT IGNORE INTO schedule_slots (slot_code, weekday, start_time, end_time, note) VALUES
('T2-1730', 2, '17:30:00', '19:00:00', 'Thứ 2 chiều'),
('T4-1730', 4, '17:30:00', '19:00:00', 'Thứ 4 chiều'),
('T7-0800', 7, '08:00:00', '09:30:00', 'Thứ 7 sáng');

INSERT IGNORE INTO course_classes (
    class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id,
    start_date, end_date, max_students, tuition_fee, status
) VALUES
('AVTN1-A', 'Anh văn thiếu nhi 1A', 1, 1, 1, 1, 2, '2026-05-05', '2026-07-30', 25, 1200000, 'OPEN'),
('SCRATCH-B', 'Scratch cơ bản B', 2, 2, 3, 3, NULL, '2026-05-10', '2026-07-10', 20, 1500000, 'OPEN'),
('TOAN6-C', 'Toán tư duy 6C', 3, 1, 2, 1, NULL, '2026-05-06', '2026-08-01', 25, 1300000, 'ONGOING');

INSERT IGNORE INTO enrollments (student_id, course_class_id, enrolled_at, status, note) VALUES
(1, 1, '2026-05-01', 'ACTIVE', NULL),
(2, 1, '2026-05-01', 'ACTIVE', NULL),
(3, 2, '2026-05-02', 'PAUSED', 'Tạm ngưng do bận lịch gia đình'),
(4, 3, '2026-05-03', 'ACTIVE', NULL);

INSERT IGNORE INTO attendances (course_class_id, student_id, attendance_date, status, note, recorded_by_user_id) VALUES
(1, 1, '2026-05-05', 'PRESENT', NULL, 2),
(1, 2, '2026-05-05', 'ABSENT', 'Xin nghỉ có phép', 2),
(2, 3, '2026-05-10', 'EXCUSED', 'Đã báo tạm ngưng', 2),
(3, 4, '2026-05-06', 'LATE', 'Đến muộn 10 phút', 2);

INSERT IGNORE INTO learning_results (student_id, course_class_id, result_month, score, teacher_comment, created_by_user_id) VALUES
(1, 1, '2026-05-01', 8.80, 'Tiến bộ tốt, phát âm rõ hơn.', 2),
(2, 1, '2026-05-01', 7.20, 'Cần luyện thêm phần từ vựng.', 2),
(4, 3, '2026-05-01', 7.50, 'Có tiềm năng, cần đều đặn hơn.', 2);

INSERT IGNORE INTO promotions (promo_code, name, discount_type, discount_value, start_date, end_date, is_active, note) VALUES
('KM10', 'Giảm 10% học phí tháng đầu', 'PERCENT', 10, '2026-05-01', '2026-05-31', TRUE, 'Áp dụng học viên mới'),
('KM200K', 'Giảm trực tiếp 200.000', 'AMOUNT', 200000, '2026-05-01', '2026-06-30', TRUE, 'Áp dụng lớp Scratch');

INSERT IGNORE INTO tuition_invoices (
    invoice_code, student_id, course_class_id, billing_month, original_amount, discount_amount,
    final_amount, amount_paid, balance_amount, status, promotion_id, due_date, note
) VALUES
('INV-202605-001', 1, 1, '2026-05-01', 1200000, 120000, 1080000, 1080000, 0, 'PAID', 1, '2026-05-10', 'Đã thanh toán đủ'),
('INV-202605-002', 2, 1, '2026-05-01', 1200000, 0, 1200000, 600000, 600000, 'PARTIAL', NULL, '2026-05-10', 'Phụ huynh hẹn đóng phần còn lại'),
('INV-202605-003', 4, 3, '2026-05-01', 1300000, 0, 1300000, 0, 1300000, 'UNPAID', NULL, '2026-05-12', 'Chưa thu');

INSERT IGNORE INTO payments (invoice_id, payment_code, paid_amount, payment_method, paid_at, cashier_user_id, note) VALUES
(1, 'PAY-0001', 1080000, 'BANK_TRANSFER', '2026-05-08 09:00:00', 3, 'Chuyển khoản'),
(2, 'PAY-0002', 600000, 'CASH', '2026-05-08 10:30:00', 3, 'Thu lần 1');

INSERT IGNORE INTO notifications (
    recipient_type, recipient_ref_id, student_id, type, title, content, related_entity_type, related_entity_id, is_read
) VALUES
('PARENT', 1, 2, 'ABSENCE', 'Thông báo vắng học', 'Học viên Trần Minh Khang vắng buổi học ngày 2026-05-05.', 'attendance', 2, FALSE),
('PARENT', 1, 1, 'TUITION', 'Phiếu báo học phí', 'Học viên Nguyễn Gia Hân đã thanh toán đủ học phí tháng 05/2026.', 'invoice', 1, TRUE),
('PARENT', 2, 4, 'TUITION', 'Nhắc đóng học phí', 'Học viên Phạm Quốc Bảo chưa thanh toán học phí tháng 05/2026.', 'invoice', 3, FALSE);