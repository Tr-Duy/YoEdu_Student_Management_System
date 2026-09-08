-- YOEDU Demo Schema (simplified for teaching)
-- Target: Spring Boot 4 + React + project-based teaching
-- DBMS: MySQL 8+

-- 1) Parents
CREATE TABLE parents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    address VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2) Teachers
CREATE TABLE teachers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    teacher_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100),
    teacher_role ENUM('TEACHER', 'ASSISTANT', 'BOTH') NOT NULL DEFAULT 'TEACHER',
    cccd_image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3) Students
CREATE TABLE students (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL DEFAULT 'OTHER',
    grade_level VARCHAR(30),
    school_name VARCHAR(100),
    phone VARCHAR(20),
    parent_id BIGINT,
    status ENUM('ACTIVE', 'PAUSED', 'DROPPED') NOT NULL DEFAULT 'ACTIVE',
    latest_score DECIMAL(5,2) DEFAULT 0,
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_students_parent FOREIGN KEY (parent_id) REFERENCES parents(id)
);

-- 4) Users (simplified auth table)
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    role ENUM('ADMIN', 'ACADEMIC_STAFF', 'CASHIER', 'PARENT') NOT NULL,
    parent_id BIGINT NULL,
    teacher_id BIGINT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_parent FOREIGN KEY (parent_id) REFERENCES parents(id),
    CONSTRAINT fk_users_teacher FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 5) Courses
CREATE TABLE courses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    tuition_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_sessions INT NOT NULL DEFAULT 24,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6) Physical rooms
CREATE TABLE rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL DEFAULT 25,
    description VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7) Weekly schedule slot
CREATE TABLE schedule_slots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slot_code VARCHAR(20) NOT NULL UNIQUE,
    weekday TINYINT NOT NULL COMMENT '2=Mon ... 8=Sun',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_schedule_time CHECK (start_time < end_time)
);

-- 8) Class opened from a course
CREATE TABLE course_classes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    class_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    course_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    schedule_slot_id BIGINT NOT NULL,
    main_teacher_id BIGINT NOT NULL,
    assistant_teacher_id BIGINT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    max_students INT NOT NULL DEFAULT 25,
    tuition_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('OPEN', 'ONGOING', 'CLOSED', 'FULL') NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_classes_course FOREIGN KEY (course_id) REFERENCES courses(id),
    CONSTRAINT fk_course_classes_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_course_classes_schedule FOREIGN KEY (schedule_slot_id) REFERENCES schedule_slots(id),
    CONSTRAINT fk_course_classes_main_teacher FOREIGN KEY (main_teacher_id) REFERENCES teachers(id),
    CONSTRAINT fk_course_classes_assistant_teacher FOREIGN KEY (assistant_teacher_id) REFERENCES teachers(id)
);

-- 9) Student joins class
CREATE TABLE enrollments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_class_id BIGINT NOT NULL,
    enrolled_at DATE NOT NULL,
    status ENUM('ACTIVE', 'PAUSED', 'DROPPED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_enrollment UNIQUE (student_id, course_class_id),
    CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_enrollments_class FOREIGN KEY (course_class_id) REFERENCES course_classes(id)
);

-- 10) Attendance by student and date
CREATE TABLE attendances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    course_class_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL,
    note VARCHAR(255),
    recorded_by_user_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance UNIQUE (course_class_id, student_id, attendance_date),
    CONSTRAINT fk_attendances_class FOREIGN KEY (course_class_id) REFERENCES course_classes(id),
    CONSTRAINT fk_attendances_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_attendances_user FOREIGN KEY (recorded_by_user_id) REFERENCES users(id)
);

-- 11) Monthly comment / test result
CREATE TABLE learning_results (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id BIGINT NOT NULL,
    course_class_id BIGINT NOT NULL,
    result_month DATE NOT NULL COMMENT 'Use first day of month, e.g. 2026-09-01',
    score DECIMAL(5,2),
    teacher_comment TEXT,
    created_by_user_id BIGINT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_learning_result UNIQUE (student_id, course_class_id, result_month),
    CONSTRAINT fk_learning_results_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_learning_results_class FOREIGN KEY (course_class_id) REFERENCES course_classes(id),
    CONSTRAINT fk_learning_results_user FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- 12) Promotions
CREATE TABLE promotions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    promo_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    discount_type ENUM('PERCENT', 'AMOUNT') NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 13) One invoice per student / class / billing month
CREATE TABLE tuition_invoices (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_code VARCHAR(30) NOT NULL UNIQUE,
    student_id BIGINT NOT NULL,
    course_class_id BIGINT NOT NULL,
    billing_month DATE NOT NULL COMMENT 'Use first day of month, e.g. 2026-09-01',
    original_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(12,2) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    balance_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    status ENUM('UNPAID', 'PARTIAL', 'PAID', 'OVERPAID') NOT NULL DEFAULT 'UNPAID',
    promotion_id BIGINT NULL,
    due_date DATE,
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_invoice UNIQUE (student_id, course_class_id, billing_month),
    CONSTRAINT fk_invoices_student FOREIGN KEY (student_id) REFERENCES students(id),
    CONSTRAINT fk_invoices_class FOREIGN KEY (course_class_id) REFERENCES course_classes(id),
    CONSTRAINT fk_invoices_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

-- 14) Payments for invoice
CREATE TABLE payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    invoice_id BIGINT NOT NULL,
    payment_code VARCHAR(30) NOT NULL UNIQUE,
    paid_amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('CASH', 'BANK_TRANSFER') NOT NULL,
    paid_at DATETIME NOT NULL,
    cashier_user_id BIGINT,
    note VARCHAR(255),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) REFERENCES tuition_invoices(id),
    CONSTRAINT fk_payments_cashier FOREIGN KEY (cashier_user_id) REFERENCES users(id)
);

-- 15) Simplified notification log
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recipient_type ENUM('PARENT', 'STUDENT', 'STAFF') NOT NULL,
    recipient_ref_id BIGINT NOT NULL,
    student_id BIGINT NULL,
    type ENUM('ABSENCE', 'TUITION', 'GENERAL') NOT NULL,
    title VARCHAR(150) NOT NULL,
    content VARCHAR(500) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_student FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Helpful indexes
CREATE INDEX idx_students_parent_id ON students(parent_id);
CREATE INDEX idx_course_classes_course_id ON course_classes(course_id);
CREATE INDEX idx_course_classes_schedule_id ON course_classes(schedule_slot_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(course_class_id);
CREATE INDEX idx_attendances_date ON attendances(attendance_date);
CREATE INDEX idx_invoices_status ON tuition_invoices(status);
CREATE INDEX idx_invoices_due_date ON tuition_invoices(due_date);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_ref_id);