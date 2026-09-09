-- V9: Seed complete demo data ensuring referential integrity and business rules.
-- This script is idempotent based on business keys and does not disrupt V2 data.

-- ---------------------------------------------------------
-- 1. PARENTS
-- ---------------------------------------------------------
INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Lê Văn Tùng', '0901000010', 'tung.parent@example.com', 'Q1, TP.HCM', 'MALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000010');

INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Đặng Thị Mai', '0901000011', 'mai.parent@example.com', 'Q3, TP.HCM', 'FEMALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000011');

INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Bùi Quốc Bảo', '0901000012', 'bao.parent@example.com', 'Q5, TP.HCM', 'MALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000012');

INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Hồ Thị Ngọc', '0901000013', 'ngoc.parent@example.com', 'Q7, TP.HCM', 'FEMALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000013');

INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Ngô Văn Tịnh', '0901000014', 'tinh.parent@example.com', 'Q10, TP.HCM', 'MALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000014');

INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Đỗ Xuân Hòa', '0901000015', 'hoa.parent@example.com', 'Tân Bình, TP.HCM', 'MALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000015');

INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Trịnh Thảo', '0901000016', 'thao.parent@example.com', 'Gò Vấp, TP.HCM', 'FEMALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000016');

INSERT INTO parents (full_name, phone, email, address, gender)
SELECT 'Vũ Thành Luân', '0901000017', 'luan.parent@example.com', 'Bình Thạnh, TP.HCM', 'MALE'
WHERE NOT EXISTS (SELECT 1 FROM parents WHERE phone = '0901000017');

-- ---------------------------------------------------------
-- 2. TEACHERS
-- ---------------------------------------------------------
INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV010', 'Nguyễn Quỳnh Anh', '0911000010', 'quynhanh.t@example.com', 'TEACHER', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1995-02-15', 15000000, 20
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV010');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV011', 'Trần Hữu Khang', '0911000011', 'khang.t@example.com', 'TEACHER', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1990-08-20', 18000000, 24
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV011');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV012', 'Phạm Tuấn Minh', '0911000012', 'minh.t@example.com', 'ASSISTANT', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1998-11-05', 8000000, 15
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV012');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV013', 'Lê Bích Phương', '0911000013', 'phuong.t@example.com', 'BOTH', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1992-04-12', 16000000, 25
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV013');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV014', 'Hoàng Thái Tuấn', '0911000014', 'tuan.t@example.com', 'TEACHER', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1988-12-30', 20000000, 22
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV014');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV015', 'Ngô Thu Thủy', '0911000015', 'thuy.t@example.com', 'ASSISTANT', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1999-07-22', 7500000, 12
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV015');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV016', 'Bùi Xuân Huy', '0911000016', 'huy.t@example.com', 'BOTH', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1994-09-18', 15500000, 20
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV016');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV017', 'Đặng Cẩm Ly', '0911000017', 'ly.t@example.com', 'TEACHER', 'files/cccd.jpg', 1, 'ACTIVE', 0, '1991-03-25', 17000000, 24
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV017');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV018', 'Vũ Hồng Nam', '0911000018', 'namh.t@example.com', 'TEACHER', 'files/cccd.jpg', 0, 'INACTIVE', 1, '1985-05-10', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV018');

INSERT INTO teachers (teacher_code, full_name, phone, email, teacher_role, cccd_image_url, is_active, status, deleted, date_of_birth, salary, weekly_slots)
SELECT 'GV019', 'Lý Hải Yến', '0911000019', 'yen.t@example.com', 'ASSISTANT', 'files/cccd.jpg', 0, 'RESIGNED', 1, '1997-10-02', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_code = 'GV019');

-- ---------------------------------------------------------
-- 3. USERS (Roles: ADMIN, ACADEMIC_STAFF, CASHIER, PARENT)
-- Using pre-computed bcrypt hash for '123456'
-- ---------------------------------------------------------
INSERT INTO users (username, password_hash, full_name, phone, email, role, parent_id, teacher_id, is_active)
SELECT 'demo_admin', '{bcrypt}$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'Demo Administrator', '0909999001', 'admin.demo@yoedu.local', 'ADMIN', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo_admin');

INSERT INTO users (username, password_hash, full_name, phone, email, role, parent_id, teacher_id, is_active)
SELECT 'demo_staff', '{bcrypt}$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'Demo Academic Staff', '0909999002', 'staff.demo@yoedu.local', 'ACADEMIC_STAFF', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo_staff');

INSERT INTO users (username, password_hash, full_name, phone, email, role, parent_id, teacher_id, is_active)
SELECT 'demo_cashier', '{bcrypt}$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'Demo Cashier', '0909999003', 'cashier.demo@yoedu.local', 'CASHIER', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo_cashier');

INSERT INTO users (username, password_hash, full_name, phone, email, role, parent_id, teacher_id, is_active)
SELECT 'demo_parent', '{bcrypt}$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'Lê Văn Tùng', '0901000010', 'tung.parent@example.com', 'PARENT', 
       (SELECT id FROM parents WHERE phone = '0901000010'), NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo_parent');

INSERT INTO users (username, password_hash, full_name, phone, email, role, parent_id, teacher_id, is_active)
SELECT 'demo_teacher', '{bcrypt}$2a$10$hKDVYxLefVHV/vtuPhWD3OigtRyOykRLDdUAp80Z1crSoS1lFqaFS', 'Nguyễn Quỳnh Anh', '0911000010', 'quynhanh.t@example.com', 'ACADEMIC_STAFF', 
       NULL, (SELECT id FROM teachers WHERE teacher_code = 'GV010'), 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'demo_teacher');

-- ---------------------------------------------------------
-- 4. STUDENTS
-- ---------------------------------------------------------
-- Parent: 0901000010 (Lê Văn Tùng) -> 3 students
INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV010', 'Lê Tùng Lâm', '2013-05-10', 'MALE', 'Lớp 7', 'THCS Chu Văn An', '0933000010', (SELECT id FROM parents WHERE phone = '0901000010'), 'ACTIVE', 8.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV010');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV011', 'Lê Tùng Sơn', '2015-08-12', 'MALE', 'Lớp 5', 'Tiểu học Kết Đoàn', '0933000011', (SELECT id FROM parents WHERE phone = '0901000010'), 'ACTIVE', 7.2
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV011');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV012', 'Lê Hà Nhi', '2017-12-01', 'FEMALE', 'Lớp 3', 'Tiểu học Kết Đoàn', '0933000012', (SELECT id FROM parents WHERE phone = '0901000010'), 'ACTIVE', 9.0
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV012');

-- Parent: 0901000011 (Đặng Thị Mai) -> 2 students
INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV013', 'Hoàng Bảo Vy', '2014-04-20', 'FEMALE', 'Lớp 6', 'THCS Lê Quý Đôn', '0933000013', (SELECT id FROM parents WHERE phone = '0901000011'), 'ACTIVE', 8.0
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV013');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV014', 'Hoàng Hải Đăng', '2016-09-15', 'MALE', 'Lớp 4', 'Tiểu học Bàu Sen', '0933000014', (SELECT id FROM parents WHERE phone = '0901000011'), 'ACTIVE', 6.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV014');

-- Parent: 0901000012 (Bùi Quốc Bảo) -> 3 students
INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV015', 'Bùi Gia Khang', '2012-02-14', 'MALE', 'Lớp 8', 'THCS Nguyễn Trãi', '0933000015', (SELECT id FROM parents WHERE phone = '0901000012'), 'ACTIVE', 7.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV015');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV016', 'Bùi Gia Hưng', '2015-06-25', 'MALE', 'Lớp 5', 'Tiểu học Trần Hưng Đạo', '0933000016', (SELECT id FROM parents WHERE phone = '0901000012'), 'ACTIVE', 8.2
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV016');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, phone, parent_id, status, latest_score)
SELECT 'HV017', 'Bùi Gia Hân', '2018-03-30', 'FEMALE', 'Lớp 2', 'Tiểu học Trần Hưng Đạo', '0933000017', (SELECT id FROM parents WHERE phone = '0901000012'), 'ACTIVE', 9.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV017');

-- Additional students spread across other parents
INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV018', 'Nguyễn Hữu Trí', '2013-07-19', 'MALE', 'Lớp 7', 'THCS Hồng Bàng', (SELECT id FROM parents WHERE phone = '0901000013'), 'ACTIVE', 7.0
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV018');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV019', 'Ngô Thanh Tú', '2014-11-05', 'FEMALE', 'Lớp 6', 'THCS Võ Trường Toản', (SELECT id FROM parents WHERE phone = '0901000014'), 'ACTIVE', 8.8
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV019');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV020', 'Đỗ Minh Tuấn', '2015-01-22', 'MALE', 'Lớp 5', 'Tiểu học Nguyễn Thái Học', (SELECT id FROM parents WHERE phone = '0901000015'), 'ACTIVE', 6.8
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV020');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV021', 'Trịnh Nhật Anh', '2016-10-10', 'MALE', 'Lớp 4', 'Tiểu học Lương Định Của', (SELECT id FROM parents WHERE phone = '0901000016'), 'ACTIVE', 9.2
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV021');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV022', 'Vũ Cát Tiên', '2017-08-08', 'FEMALE', 'Lớp 3', 'Tiểu học Lê Đình Chinh', (SELECT id FROM parents WHERE phone = '0901000017'), 'ACTIVE', 8.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV022');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV023', 'Vũ Cát Tường', '2019-02-14', 'FEMALE', 'Lớp 1', 'Tiểu học Lê Đình Chinh', (SELECT id FROM parents WHERE phone = '0901000017'), 'ACTIVE', 9.0
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV023');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV024', 'Trịnh Gia Huy', '2012-05-17', 'MALE', 'Lớp 8', 'THCS Đồng Khởi', (SELECT id FROM parents WHERE phone = '0901000016'), 'PAUSED', 7.3
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV024');

INSERT INTO students (student_code, full_name, date_of_birth, gender, grade_level, school_name, parent_id, status, latest_score)
SELECT 'HV025', 'Đỗ Xuân Lộc', '2013-09-09', 'MALE', 'Lớp 7', 'THCS Nguyễn Gia Thiều', (SELECT id FROM parents WHERE phone = '0901000015'), 'DROPPED', 5.5
WHERE NOT EXISTS (SELECT 1 FROM students WHERE student_code = 'HV025');

-- ---------------------------------------------------------
-- 5. COURSES
-- ---------------------------------------------------------
INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS010', 'Lập trình Python Cơ Bản', 'Ngôn ngữ lập trình dễ học cho học sinh', 2000000, 24, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS010');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS011', 'Lập trình Web Frontend', 'HTML, CSS và JS cơ bản', 2500000, 30, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS011');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS012', 'Lập trình C++ Nâng Cao', 'Dành cho thi học sinh giỏi', 3000000, 36, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS012');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS013', 'Toán Rời Rạc', 'Nền tảng thuật toán', 1800000, 20, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS013');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS014', 'IELTS Foundation', 'Tiếng Anh nền tảng IELTS', 4000000, 48, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS014');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS015', 'Giao tiếp tiếng Anh', 'Tập trung luyện nói', 2200000, 24, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS015');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS016', 'Robotics Level 1', 'Lắp ráp và lập trình Robot cơ bản', 3500000, 20, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS016');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS017', 'Thiết kế Đồ Họa 2D', 'Photoshop và Illustrator cơ bản', 2800000, 24, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS017');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS018', 'Lập trình Game Unity', 'Làm game 2D với Unity', 4500000, 36, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS018');

INSERT INTO courses (course_code, name, description, tuition_fee, total_sessions, is_active)
SELECT 'CS019', 'Lập trình App Flutter', 'Làm app đa nền tảng', 4200000, 36, 1
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE course_code = 'CS019');

-- ---------------------------------------------------------
-- 6. ROOMS
-- ---------------------------------------------------------
INSERT INTO rooms (room_code, name, capacity, description)
SELECT 'LAB-01', 'Phòng Máy Thực Hành 1', 20, 'Trang bị iMac'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'LAB-01');

INSERT INTO rooms (room_code, name, capacity, description)
SELECT 'LAB-02', 'Phòng Máy Thực Hành 2', 25, 'Trang bị Windows PC'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'LAB-02');

INSERT INTO rooms (room_code, name, capacity, description)
SELECT 'ROOM-A01', 'Phòng Học Lý Thuyết A01', 30, 'Phòng chuẩn, máy chiếu'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'ROOM-A01');

INSERT INTO rooms (room_code, name, capacity, description)
SELECT 'ROOM-A02', 'Phòng Học Lý Thuyết A02', 35, 'Phòng chuẩn, màn hình LED'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'ROOM-A02');

INSERT INTO rooms (room_code, name, capacity, description)
SELECT 'ROOM-B01', 'Phòng Học Nhóm B01', 15, 'Phòng thiết kế linh hoạt'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'ROOM-B01');

INSERT INTO rooms (room_code, name, capacity, description)
SELECT 'ROOM-B02', 'Phòng Học Lớn B02', 50, 'Hội trường mini'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_code = 'ROOM-B02');

-- ---------------------------------------------------------
-- 7. SCHEDULE SLOTS
-- ---------------------------------------------------------
-- We will use weekday + time slots
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T2-0800', 2, '08:00:00', '09:30:00', 'Thứ 2 sáng' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T2-0800');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T2-0945', 2, '09:45:00', '11:15:00', 'Thứ 2 sáng ca 2' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T2-0945');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T3-1730', 3, '17:30:00', '19:00:00', 'Thứ 3 chiều' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T3-1730');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T3-1915', 3, '19:15:00', '20:45:00', 'Thứ 3 tối' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T3-1915');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T5-1730', 5, '17:30:00', '19:00:00', 'Thứ 5 chiều' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T5-1730');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T5-1915', 5, '19:15:00', '20:45:00', 'Thứ 5 tối' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T5-1915');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T6-1730', 6, '17:30:00', '19:00:00', 'Thứ 6 chiều' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T6-1730');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T6-1915', 6, '19:15:00', '20:45:00', 'Thứ 6 tối' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T6-1915');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T7-0945', 7, '09:45:00', '11:15:00', 'Thứ 7 sáng ca 2' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T7-0945');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T7-1330', 7, '13:30:00', '15:00:00', 'Thứ 7 chiều' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T7-1330');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'T7-1515', 7, '15:15:00', '16:45:00', 'Thứ 7 chiều ca 2' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'T7-1515');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'CN-0800', 8, '08:00:00', '09:30:00', 'CN sáng' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'CN-0800');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'CN-0945', 8, '09:45:00', '11:15:00', 'CN sáng ca 2' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'CN-0945');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'CN-1330', 8, '13:30:00', '15:00:00', 'CN chiều' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'CN-1330');
INSERT INTO schedule_slots (slot_code, weekday, start_time, end_time, note)
SELECT 'CN-1515', 8, '15:15:00', '16:45:00', 'CN chiều ca 2' WHERE NOT EXISTS (SELECT 1 FROM schedule_slots WHERE slot_code = 'CN-1515');

-- ---------------------------------------------------------
-- 8. COURSE CLASSES
-- Guarantee no conflicts (each room/slot combo is unique per active class)
-- Guarantee max_students <= room.capacity
-- Guarantee main_teacher != assistant_teacher
-- ---------------------------------------------------------
-- CLS-PY-01: Python 01, LAB-01 (cap 20), Slot: T3-1730, Teacher: GV010 (main), GV012 (assistant)
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-PY-01', 'Python Cơ Bản 01', 
  (SELECT id FROM courses WHERE course_code = 'CS010'), 
  (SELECT id FROM rooms WHERE room_code = 'LAB-01'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T3-1730'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV010'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV012'), 
  '2026-06-01', '2026-08-31', 20, 2000000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-PY-01');

-- CLS-PY-02: Python 02, LAB-02 (cap 25), Slot: T3-1915, Teacher: GV010 (main), GV015 (assistant)
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-PY-02', 'Python Cơ Bản 02', 
  (SELECT id FROM courses WHERE course_code = 'CS010'), 
  (SELECT id FROM rooms WHERE room_code = 'LAB-02'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T3-1915'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV010'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV015'), 
  '2026-06-01', '2026-08-31', 25, 2000000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-PY-02');

-- CLS-WEB-01: Web 01, LAB-01 (cap 20), Slot: T5-1730, Teacher: GV011 (main), NULL
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-WEB-01', 'Web Frontend 01', 
  (SELECT id FROM courses WHERE course_code = 'CS011'), 
  (SELECT id FROM rooms WHERE room_code = 'LAB-01'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T5-1730'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV011'), 
  NULL, 
  '2026-06-01', '2026-09-30', 20, 2500000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-WEB-01');

-- CLS-WEB-02: Web 02, LAB-02 (cap 25), Slot: T5-1915, Teacher: GV011 (main), NULL
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-WEB-02', 'Web Frontend 02', 
  (SELECT id FROM courses WHERE course_code = 'CS011'), 
  (SELECT id FROM rooms WHERE room_code = 'LAB-02'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T5-1915'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV011'), 
  NULL, 
  '2026-06-01', '2026-09-30', 25, 2500000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-WEB-02');

-- CLS-CPP-01: C++ 01, LAB-01 (cap 20), Slot: T7-0945, Teacher: GV013 (main), GV015 (assistant)
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-CPP-01', 'C++ Nâng Cao 01', 
  (SELECT id FROM courses WHERE course_code = 'CS012'), 
  (SELECT id FROM rooms WHERE room_code = 'LAB-01'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T7-0945'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV013'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV015'), 
  '2026-06-01', '2026-10-30', 20, 3000000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-CPP-01');

-- CLS-TOAN-01: Toán, ROOM-A01 (cap 30), Slot: CN-0800, Teacher: GV014 (main), NULL
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-TOAN-01', 'Toán Rời Rạc 01', 
  (SELECT id FROM courses WHERE course_code = 'CS013'), 
  (SELECT id FROM rooms WHERE room_code = 'ROOM-A01'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'CN-0800'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV014'), 
  NULL, 
  '2026-06-01', '2026-08-31', 30, 1800000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-TOAN-01');

-- CLS-IELTS-01: IELTS, ROOM-A02 (cap 35), Slot: T7-1330, Teacher: GV016 (main), NULL
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-IELTS-01', 'IELTS Foundation 01', 
  (SELECT id FROM courses WHERE course_code = 'CS014'), 
  (SELECT id FROM rooms WHERE room_code = 'ROOM-A02'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T7-1330'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV016'), 
  NULL, 
  '2026-06-01', '2026-11-30', 35, 4000000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-IELTS-01');

-- CLS-IELTS-02: IELTS, ROOM-A02 (cap 35), Slot: T7-1515, Teacher: GV016 (main), NULL
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-IELTS-02', 'IELTS Foundation 02', 
  (SELECT id FROM courses WHERE course_code = 'CS014'), 
  (SELECT id FROM rooms WHERE room_code = 'ROOM-A02'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T7-1515'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV016'), 
  NULL, 
  '2026-06-01', '2026-11-30', 35, 4000000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-IELTS-02');

-- CLS-GT-01: Giao Tiếp, ROOM-B01 (cap 15), Slot: T6-1730, Teacher: GV017 (main), NULL
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-GT-01', 'Giao tiếp TA 01', 
  (SELECT id FROM courses WHERE course_code = 'CS015'), 
  (SELECT id FROM rooms WHERE room_code = 'ROOM-B01'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'T6-1730'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV017'), 
  NULL, 
  '2026-06-01', '2026-08-31', 15, 2200000, 'ONGOING'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-GT-01');

-- CLS-ROBO-01: Robotics, LAB-01 (cap 20), Slot: CN-1330, Teacher: GV013 (main), GV015 (assistant)
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-ROBO-01', 'Robotics 01', 
  (SELECT id FROM courses WHERE course_code = 'CS016'), 
  (SELECT id FROM rooms WHERE room_code = 'LAB-01'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'CN-1330'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV013'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV015'), 
  '2026-07-01', '2026-09-30', 20, 3500000, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-ROBO-01');

-- CLS-DH-01: Đồ Họa, LAB-02 (cap 25), Slot: CN-0945, Teacher: GV014 (main), NULL
INSERT INTO course_classes (class_code, name, course_id, room_id, schedule_slot_id, main_teacher_id, assistant_teacher_id, start_date, end_date, max_students, tuition_fee, status)
SELECT 'CLS-DH-01', 'Thiết kế ĐH 01', 
  (SELECT id FROM courses WHERE course_code = 'CS017'), 
  (SELECT id FROM rooms WHERE room_code = 'LAB-02'), 
  (SELECT id FROM schedule_slots WHERE slot_code = 'CN-0945'), 
  (SELECT id FROM teachers WHERE teacher_code = 'GV014'), 
  NULL, 
  '2026-07-01', '2026-09-30', 25, 2800000, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM course_classes WHERE class_code = 'CLS-DH-01');

-- ---------------------------------------------------------
-- 9. ENROLLMENTS
-- Guarantee no duplicate (student_id, course_class_id)
-- ---------------------------------------------------------
-- Insert multiple enrollments. 
-- Student 10 -> CLS-PY-01 (T3-1730), CLS-WEB-01 (T5-1730)
INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV010'), (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), '2026-05-20', 'ACTIVE', 'Seed demo'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV010') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'));

INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV010'), (SELECT id FROM course_classes WHERE class_code = 'CLS-WEB-01'), '2026-05-20', 'ACTIVE', 'Seed demo'
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV010') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-WEB-01'));

-- Student 11 -> CLS-PY-01
INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV011'), (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), '2026-05-21', 'ACTIVE', ''
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV011') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'));

-- Student 12 -> CLS-WEB-02
INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV012'), (SELECT id FROM course_classes WHERE class_code = 'CLS-WEB-02'), '2026-05-22', 'ACTIVE', ''
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV012') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-WEB-02'));

-- Student 13 -> CLS-CPP-01
INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV013'), (SELECT id FROM course_classes WHERE class_code = 'CLS-CPP-01'), '2026-05-23', 'ACTIVE', ''
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV013') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-CPP-01'));

-- Student 14 -> CLS-TOAN-01
INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV014'), (SELECT id FROM course_classes WHERE class_code = 'CLS-TOAN-01'), '2026-05-24', 'ACTIVE', ''
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV014') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-TOAN-01'));

-- Student 15 -> CLS-IELTS-01
INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV015'), (SELECT id FROM course_classes WHERE class_code = 'CLS-IELTS-01'), '2026-05-25', 'ACTIVE', ''
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV015') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-IELTS-01'));

-- Student 16 -> CLS-IELTS-02, CLS-GT-01
INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV016'), (SELECT id FROM course_classes WHERE class_code = 'CLS-IELTS-02'), '2026-05-26', 'ACTIVE', ''
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV016') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-IELTS-02'));

INSERT INTO enrollments (student_id, course_class_id, enrolled_at, status, note)
SELECT (SELECT id FROM students WHERE student_code = 'HV016'), (SELECT id FROM course_classes WHERE class_code = 'CLS-GT-01'), '2026-05-26', 'ACTIVE', ''
WHERE NOT EXISTS (SELECT 1 FROM enrollments WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV016') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-GT-01'));

-- ---------------------------------------------------------
-- 10. ATTENDANCES
-- (course_class_id, student_id, attendance_date) UNIQUE
-- Use valid weekday dates matching schedule. 
-- CLS-PY-01 is T3-1730 (Tuesday). First Tuesday in June 2026 is 2026-06-02
-- ---------------------------------------------------------
INSERT INTO attendances (course_class_id, student_id, attendance_date, status, recorded_by_user_id)
SELECT (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), (SELECT id FROM students WHERE student_code = 'HV010'), '2026-06-02', 'PRESENT', (SELECT id FROM users WHERE username = 'demo_teacher')
WHERE NOT EXISTS (SELECT 1 FROM attendances WHERE course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01') AND student_id = (SELECT id FROM students WHERE student_code = 'HV010') AND attendance_date = '2026-06-02');

INSERT INTO attendances (course_class_id, student_id, attendance_date, status, recorded_by_user_id)
SELECT (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), (SELECT id FROM students WHERE student_code = 'HV011'), '2026-06-02', 'PRESENT', (SELECT id FROM users WHERE username = 'demo_teacher')
WHERE NOT EXISTS (SELECT 1 FROM attendances WHERE course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01') AND student_id = (SELECT id FROM students WHERE student_code = 'HV011') AND attendance_date = '2026-06-02');

INSERT INTO attendances (course_class_id, student_id, attendance_date, status, recorded_by_user_id)
SELECT (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), (SELECT id FROM students WHERE student_code = 'HV010'), '2026-06-09', 'ABSENT', (SELECT id FROM users WHERE username = 'demo_teacher')
WHERE NOT EXISTS (SELECT 1 FROM attendances WHERE course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01') AND student_id = (SELECT id FROM students WHERE student_code = 'HV010') AND attendance_date = '2026-06-09');

-- CLS-WEB-01 is T5-1730 (Thursday). First Thursday in June 2026 is 2026-06-04
INSERT INTO attendances (course_class_id, student_id, attendance_date, status, recorded_by_user_id)
SELECT (SELECT id FROM course_classes WHERE class_code = 'CLS-WEB-01'), (SELECT id FROM students WHERE student_code = 'HV010'), '2026-06-04', 'PRESENT', (SELECT id FROM users WHERE username = 'demo_teacher')
WHERE NOT EXISTS (SELECT 1 FROM attendances WHERE course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-WEB-01') AND student_id = (SELECT id FROM students WHERE student_code = 'HV010') AND attendance_date = '2026-06-04');

-- ---------------------------------------------------------
-- 11. LEARNING RESULTS
-- Result month must be first day of month. (student, class, month)
-- ---------------------------------------------------------
INSERT INTO learning_results (student_id, course_class_id, result_month, score, teacher_comment, created_by_user_id)
SELECT (SELECT id FROM students WHERE student_code = 'HV010'), (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), '2026-06-01', 8.5, 'Tốt', (SELECT id FROM users WHERE username = 'demo_teacher')
WHERE NOT EXISTS (SELECT 1 FROM learning_results WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV010') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01') AND result_month = '2026-06-01');

INSERT INTO learning_results (student_id, course_class_id, result_month, score, teacher_comment, created_by_user_id)
SELECT (SELECT id FROM students WHERE student_code = 'HV011'), (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), '2026-06-01', 7.0, 'Cần cố gắng', (SELECT id FROM users WHERE username = 'demo_teacher')
WHERE NOT EXISTS (SELECT 1 FROM learning_results WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV011') AND course_class_id = (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01') AND result_month = '2026-06-01');

-- ---------------------------------------------------------
-- 12. PROMOTIONS
-- ---------------------------------------------------------
INSERT INTO promotions (promo_code, name, discount_type, discount_value, start_date, end_date, is_active, note)
SELECT 'SUMMER2026', 'Khuyến mãi Hè 2026', 'PERCENT', 15, '2026-06-01', '2026-08-31', 1, 'Hè 2026'
WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE promo_code = 'SUMMER2026');

INSERT INTO promotions (promo_code, name, discount_type, discount_value, start_date, end_date, is_active, note)
SELECT 'MINUS500K', 'Giảm 500k', 'AMOUNT', 500000, '2026-01-01', '2026-12-31', 1, 'Ưu đãi đặc biệt'
WHERE NOT EXISTS (SELECT 1 FROM promotions WHERE promo_code = 'MINUS500K');

-- ---------------------------------------------------------
-- 13. TUITION INVOICES
-- balance_amount = final_amount - amount_paid
-- ---------------------------------------------------------
-- HV010, CLS-PY-01, tuition = 2000000. Use SUMMER2026 (15% = 300000). final = 1700000. PAID
INSERT INTO tuition_invoices (invoice_code, student_id, course_class_id, billing_month, original_amount, discount_amount, final_amount, amount_paid, balance_amount, status, promotion_id)
SELECT 'INV-202606-010', (SELECT id FROM students WHERE student_code = 'HV010'), (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), '2026-06-01', 2000000, 300000, 1700000, 1700000, 0, 'PAID', (SELECT id FROM promotions WHERE promo_code = 'SUMMER2026')
WHERE NOT EXISTS (SELECT 1 FROM tuition_invoices WHERE invoice_code = 'INV-202606-010');

-- HV010, CLS-WEB-01, tuition = 2500000. No promo. final = 2500000. PARTIAL
INSERT INTO tuition_invoices (invoice_code, student_id, course_class_id, billing_month, original_amount, discount_amount, final_amount, amount_paid, balance_amount, status)
SELECT 'INV-202606-011', (SELECT id FROM students WHERE student_code = 'HV010'), (SELECT id FROM course_classes WHERE class_code = 'CLS-WEB-01'), '2026-06-01', 2500000, 0, 2500000, 1000000, 1500000, 'PARTIAL'
WHERE NOT EXISTS (SELECT 1 FROM tuition_invoices WHERE invoice_code = 'INV-202606-011');

-- HV011, CLS-PY-01, tuition = 2000000. No promo. final = 2000000. UNPAID
INSERT INTO tuition_invoices (invoice_code, student_id, course_class_id, billing_month, original_amount, discount_amount, final_amount, amount_paid, balance_amount, status)
SELECT 'INV-202606-012', (SELECT id FROM students WHERE student_code = 'HV011'), (SELECT id FROM course_classes WHERE class_code = 'CLS-PY-01'), '2026-06-01', 2000000, 0, 2000000, 0, 2000000, 'UNPAID'
WHERE NOT EXISTS (SELECT 1 FROM tuition_invoices WHERE invoice_code = 'INV-202606-012');

-- ---------------------------------------------------------
-- 14. PAYMENTS
-- amount > 0
-- ---------------------------------------------------------
INSERT INTO payments (invoice_id, payment_code, paid_amount, payment_method, paid_at, cashier_user_id)
SELECT (SELECT id FROM tuition_invoices WHERE invoice_code = 'INV-202606-010'), 'PAY-010', 1700000, 'BANK_TRANSFER', '2026-06-05 10:00:00', (SELECT id FROM users WHERE username = 'demo_cashier')
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE payment_code = 'PAY-010');

INSERT INTO payments (invoice_id, payment_code, paid_amount, payment_method, paid_at, cashier_user_id)
SELECT (SELECT id FROM tuition_invoices WHERE invoice_code = 'INV-202606-011'), 'PAY-011', 1000000, 'CASH', '2026-06-06 14:00:00', (SELECT id FROM users WHERE username = 'demo_cashier')
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE payment_code = 'PAY-011');

-- ---------------------------------------------------------
-- 15. NOTIFICATIONS
-- ---------------------------------------------------------
INSERT INTO notifications (recipient_type, recipient_ref_id, type, title, content)
SELECT 'PARENT', (SELECT id FROM parents WHERE phone = '0901000010'), 'GENERAL', 'Chào mừng', 'Chào mừng gia nhập YOEDU'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Chào mừng' AND recipient_ref_id = (SELECT id FROM parents WHERE phone = '0901000010'));

-- ---------------------------------------------------------
-- 16. STUDENT STATUS HISTORY
-- ---------------------------------------------------------
INSERT INTO student_status_history (student_id, old_status, new_status, reason, changed_by_user_id, changed_at)
SELECT (SELECT id FROM students WHERE student_code = 'HV024'), 'ACTIVE', 'PAUSED', 'Tạm ngưng học kỳ 1', (SELECT id FROM users WHERE username = 'demo_staff'), NOW()
WHERE NOT EXISTS (SELECT 1 FROM student_status_history WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV024'));

INSERT INTO student_status_history (student_id, old_status, new_status, reason, changed_by_user_id, changed_at)
SELECT (SELECT id FROM students WHERE student_code = 'HV025'), 'ACTIVE', 'DROPPED', 'Nghỉ luôn', (SELECT id FROM users WHERE username = 'demo_staff'), NOW()
WHERE NOT EXISTS (SELECT 1 FROM student_status_history WHERE student_id = (SELECT id FROM students WHERE student_code = 'HV025'));

