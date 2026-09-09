-- V8__sync_schema_drift_and_enhance_integrity.sql
-- Synchronize schema drift from Hibernate into Flyway, standardize currency data types,
-- remove obsolete columns, and add missing business integrity constraints and indexes.

DROP PROCEDURE IF EXISTS yoedu_v8_migration;
DELIMITER //
CREATE PROCEDURE yoedu_v8_migration()
BEGIN
    -- -------------------------------------------------------------
    -- 1. FORMALIZE SCHEMA DRIFT TABLES & COLUMNS
    -- -------------------------------------------------------------
    
    -- Table: student_status_history
    CREATE TABLE IF NOT EXISTS student_status_history (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        student_id BIGINT NOT NULL,
        old_status ENUM('ACTIVE', 'DROPPED', 'PAUSED'),
        new_status ENUM('ACTIVE', 'DROPPED', 'PAUSED') NOT NULL,
        reason VARCHAR(255),
        changed_by_user_id BIGINT,
        changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        CONSTRAINT fk_status_history_student FOREIGN KEY (student_id) REFERENCES students(id)
    );

    -- Foreign Key: student_status_history.changed_by_user_id -> users(id)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'student_status_history' 
          AND CONSTRAINT_NAME = 'fk_status_history_user'
    ) THEN
        ALTER TABLE student_status_history 
            ADD CONSTRAINT fk_status_history_user 
            FOREIGN KEY (changed_by_user_id) REFERENCES users(id);
    END IF;

    -- Teachers drifted columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'deleted') THEN
        ALTER TABLE teachers ADD COLUMN deleted BIT(1) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'status') THEN
        ALTER TABLE teachers ADD COLUMN status ENUM('ACTIVE', 'INACTIVE', 'RESIGNED') NOT NULL DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'date_of_birth') THEN
        ALTER TABLE teachers ADD COLUMN date_of_birth DATE NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'salary') THEN
        ALTER TABLE teachers ADD COLUMN salary DECIMAL(12,2) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'weekly_slots') THEN
        ALTER TABLE teachers ADD COLUMN weekly_slots INT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'address') THEN
        ALTER TABLE teachers ADD COLUMN address VARCHAR(255) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'description') THEN
        ALTER TABLE teachers ADD COLUMN description VARCHAR(255) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'work_unit') THEN
        ALTER TABLE teachers ADD COLUMN work_unit VARCHAR(100) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'experience') THEN
        ALTER TABLE teachers ADD COLUMN experience VARCHAR(500) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teachers' AND COLUMN_NAME = 'achievement') THEN
        ALTER TABLE teachers ADD COLUMN achievement VARCHAR(500) NULL;
    END IF;

    -- Parents drifted columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parents' AND COLUMN_NAME = 'gender') THEN
        ALTER TABLE parents ADD COLUMN gender ENUM('FEMALE', 'MALE', 'OTHER') NOT NULL DEFAULT 'OTHER';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'parents' AND COLUMN_NAME = 'relationship') THEN
        ALTER TABLE parents ADD COLUMN relationship VARCHAR(50) NULL;
    END IF;

    -- Students drifted columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'description') THEN
        ALTER TABLE students ADD COLUMN description VARCHAR(255) NULL;
    END IF;

    -- RefreshTokenSessions drifted columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_token_sessions' AND COLUMN_NAME = 'is_revoked') THEN
        ALTER TABLE refresh_token_sessions ADD COLUMN is_revoked BIT(1) NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_token_sessions' AND COLUMN_NAME = 'ip_address') THEN
        ALTER TABLE refresh_token_sessions ADD COLUMN ip_address VARCHAR(50) NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_token_sessions' AND COLUMN_NAME = 'user_agent') THEN
        ALTER TABLE refresh_token_sessions ADD COLUMN user_agent VARCHAR(255) NULL;
    END IF;

    -- -------------------------------------------------------------
    -- 2. DROP OBSOLETE UNUSED COLUMNS IN COURSES
    -- -------------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'course_name') THEN
        ALTER TABLE courses DROP COLUMN course_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND COLUMN_NAME = 'course_description') THEN
        ALTER TABLE courses DROP COLUMN course_description;
    END IF;

    -- -------------------------------------------------------------
    -- 3. STANDARDIZE CURRENCY, PRECISION & NULLABILITY
    -- -------------------------------------------------------------
    -- courses.tuition_fee: double -> DECIMAL(12,2)
    ALTER TABLE courses MODIFY COLUMN tuition_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00;
    ALTER TABLE courses MODIFY COLUMN course_code VARCHAR(20) NOT NULL;
    
    -- promotions.discount_value: float -> DECIMAL(12,2)
    ALTER TABLE promotions MODIFY COLUMN discount_value DECIMAL(12,2) NOT NULL DEFAULT 0.00;

    -- learning_results.teacher_comment: tinytext -> TEXT
    ALTER TABLE learning_results MODIFY COLUMN teacher_comment TEXT NULL;

    -- parents.full_name: ensure NOT NULL
    ALTER TABLE parents MODIFY COLUMN full_name VARCHAR(100) NOT NULL;

    -- -------------------------------------------------------------
    -- 4. ADD BUSINESS CHECK CONSTRAINTS
    -- -------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND CONSTRAINT_NAME = 'chk_courses_tuition_fee') THEN
        ALTER TABLE courses ADD CONSTRAINT chk_courses_tuition_fee CHECK (tuition_fee >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'courses' AND CONSTRAINT_NAME = 'chk_courses_total_sessions') THEN
        ALTER TABLE courses ADD CONSTRAINT chk_courses_total_sessions CHECK (total_sessions > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'promotions' AND CONSTRAINT_NAME = 'chk_promotions_discount') THEN
        ALTER TABLE promotions ADD CONSTRAINT chk_promotions_discount CHECK (discount_value > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'rooms' AND CONSTRAINT_NAME = 'chk_rooms_capacity') THEN
        ALTER TABLE rooms ADD CONSTRAINT chk_rooms_capacity CHECK (capacity > 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND CONSTRAINT_NAME = 'chk_students_latest_score') THEN
        ALTER TABLE students ADD CONSTRAINT chk_students_latest_score CHECK (latest_score IS NULL OR (latest_score >= 0 AND latest_score <= 10));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'learning_results' AND CONSTRAINT_NAME = 'chk_learning_results_score') THEN
        ALTER TABLE learning_results ADD CONSTRAINT chk_learning_results_score CHECK (score IS NULL OR (score >= 0 AND score <= 10));
    END IF;

    -- -------------------------------------------------------------
    -- 5. HIGH-PERFORMANCE SECONDARY INDEXES
    -- -------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND INDEX_NAME = 'idx_students_status') THEN
        CREATE INDEX idx_students_status ON students(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_classes' AND INDEX_NAME = 'idx_course_classes_status') THEN
        CREATE INDEX idx_course_classes_status ON course_classes(status);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_classes' AND INDEX_NAME = 'idx_course_classes_main_teacher') THEN
        CREATE INDEX idx_course_classes_main_teacher ON course_classes(main_teacher_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_classes' AND INDEX_NAME = 'idx_course_classes_room') THEN
        CREATE INDEX idx_course_classes_room ON course_classes(room_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND INDEX_NAME = 'idx_payments_paid_at') THEN
        CREATE INDEX idx_payments_paid_at ON payments(paid_at);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tuition_invoices' AND INDEX_NAME = 'idx_invoices_billing_month') THEN
        CREATE INDEX idx_invoices_billing_month ON tuition_invoices(billing_month);
    END IF;

END //
DELIMITER ;

-- Execute migration
CALL yoedu_v8_migration();

-- Cleanup procedure
DROP PROCEDURE IF EXISTS yoedu_v8_migration;
