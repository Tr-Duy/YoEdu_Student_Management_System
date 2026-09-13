-- V13: Refactor Grade Scoring System
-- Bảng điểm chuyển sang: process_score, midterm_score, final_score, total_score
-- Loại bỏ: score cũ, result_month
-- Uniqueness: UNIQUE(student_id, course_class_id)

-- 1. Backup toàn bộ dữ liệu hiện tại trước khi thay đổi cấu trúc
CREATE TABLE IF NOT EXISTS legacy_learning_results_backup AS 
SELECT * FROM learning_results;

-- 2. Xử lý các bản ghi trùng (student_id, course_class_id) để đảm bảo tính duy nhất
DELETE lr FROM learning_results lr
INNER JOIN (
    SELECT student_id, course_class_id, MAX(id) AS max_id
    FROM learning_results
    GROUP BY student_id, course_class_id
    HAVING COUNT(*) > 1
) dup ON lr.student_id = dup.student_id 
     AND lr.course_class_id = dup.course_class_id 
     AND lr.id <> dup.max_id;

-- 3. Tạm thời drop foreign key referencing student_id để có thể drop index uq_learning_result
ALTER TABLE learning_results
DROP FOREIGN KEY fk_learning_results_student;

-- 4. Drop unique index cũ (student_id, course_class_id, result_month)
ALTER TABLE learning_results
DROP INDEX uq_learning_result;

-- 5. Drop check constraint cũ cho score
ALTER TABLE learning_results
DROP CHECK chk_learning_results_score;

-- 6. Thêm các cột điểm mới
ALTER TABLE learning_results
ADD COLUMN process_score DECIMAL(4,2) DEFAULT NULL,
ADD COLUMN midterm_score DECIMAL(4,2) DEFAULT NULL,
ADD COLUMN final_score DECIMAL(4,2) DEFAULT NULL,
ADD COLUMN total_score INT DEFAULT NULL;

-- 7. Xóa các cột cũ
ALTER TABLE learning_results
DROP COLUMN score,
DROP COLUMN result_month;

-- 8. Thêm UNIQUE constraint mới cho (student_id, course_class_id)
ALTER TABLE learning_results
ADD CONSTRAINT uq_learning_result UNIQUE (student_id, course_class_id);

-- 9. Re-add foreign key fk_learning_results_student
ALTER TABLE learning_results
ADD CONSTRAINT fk_learning_results_student FOREIGN KEY (student_id) REFERENCES students(id);

-- 10. Thêm CHECK constraint đảm bảo 0 <= score <= 10
ALTER TABLE learning_results
ADD CONSTRAINT chk_lr_process_score CHECK (process_score IS NULL OR (process_score >= 0 AND process_score <= 10)),
ADD CONSTRAINT chk_lr_midterm_score CHECK (midterm_score IS NULL OR (midterm_score >= 0 AND midterm_score <= 10)),
ADD CONSTRAINT chk_lr_final_score CHECK (final_score IS NULL OR (final_score >= 0 AND final_score <= 10)),
ADD CONSTRAINT chk_lr_total_score CHECK (total_score IS NULL OR (total_score >= 0 AND total_score <= 10));

-- 11. Cập nhật dữ liệu hợp lệ cho các bản ghi hiện có theo đúng công thức tính điểm và làm tròn
-- Student B: process = 8, midterm = 7, final = 9 -> raw = 8.3 -> total = 8 -> Giỏi (DRAFT)
UPDATE learning_results 
SET process_score = 8.0, midterm_score = 7.0, final_score = 9.0, total_score = 8, classification = 'GIOI', status = 'DRAFT'
WHERE student_id = 28 AND course_class_id = 22;

-- Student A: midterm = 8, final = 9 -> raw = 8.5 -> total = 9 -> Giỏi (LOCKED)
UPDATE learning_results 
SET process_score = NULL, midterm_score = 8.0, final_score = 9.0, total_score = 9, classification = 'GIOI', status = 'LOCKED'
WHERE student_id = 29 AND course_class_id = 22;

-- Student C: midterm = 6, final = 7 -> raw = 6.5 -> total = 7 -> Khá (DRAFT)
UPDATE learning_results 
SET process_score = NULL, midterm_score = 6.0, final_score = 7.0, total_score = 7, classification = 'KHA', status = 'DRAFT'
WHERE student_id = 1 AND course_class_id = 1;

-- Student D: midterm = 4, final = 5 -> raw = 4.5 -> total = 5 -> Yếu (LOCKED)
UPDATE learning_results 
SET process_score = NULL, midterm_score = 4.0, final_score = 5.0, total_score = 5, classification = 'YEU', status = 'LOCKED'
WHERE student_id = 2 AND course_class_id = 1;

-- Student E: process = 5, midterm = 5, final = 6 -> raw = 5.6 -> total = 6 -> Trung bình (DRAFT)
UPDATE learning_results 
SET process_score = 5.0, midterm_score = 5.0, final_score = 6.0, total_score = 6, classification = 'TRUNG_BINH', status = 'DRAFT'
WHERE student_id = 4 AND course_class_id = 3;

-- Student with partial grade (Chưa đủ điều kiện tính tổng điểm)
UPDATE learning_results 
SET process_score = 8.0, midterm_score = NULL, final_score = NULL, total_score = NULL, classification = NULL, status = 'DRAFT'
WHERE student_id = 11 AND course_class_id = 7;

-- Các học sinh khác đang có trong hệ thống
UPDATE learning_results 
SET process_score = 9.0, midterm_score = 9.0, final_score = 10.0, total_score = 10, classification = 'GIOI', status = 'LOCKED'
WHERE student_id = 31 AND course_class_id = 26;

UPDATE learning_results 
SET process_score = NULL, midterm_score = 7.0, final_score = 8.0, total_score = 8, classification = 'GIOI', status = 'LOCKED'
WHERE student_id = 32 AND course_class_id = 27;

UPDATE learning_results 
SET process_score = 7.0, midterm_score = 6.0, final_score = 7.0, total_score = 7, classification = 'KHA', status = 'LOCKED'
WHERE student_id = 33 AND course_class_id = 28;

UPDATE learning_results 
SET process_score = 6.0, midterm_score = 6.0, final_score = 6.0, total_score = 6, classification = 'TRUNG_BINH', status = 'LOCKED'
WHERE student_id = 34 AND course_class_id = 29;

UPDATE learning_results 
SET process_score = 4.0, midterm_score = 5.0, final_score = 5.0, total_score = 5, classification = 'YEU', status = 'DRAFT'
WHERE student_id = 34 AND course_class_id = 30;
