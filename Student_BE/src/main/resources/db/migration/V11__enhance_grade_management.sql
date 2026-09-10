-- V11: Enhance Grade Management System
-- Thêm classification và status vào learning_results

ALTER TABLE learning_results
ADD COLUMN classification VARCHAR(20) DEFAULT NULL,
ADD COLUMN status VARCHAR(20) DEFAULT 'LOCKED';

-- Backfill data: Update existing records to calculate classification dynamically
UPDATE learning_results
SET classification = 
    CASE 
        WHEN score >= 9.0 AND score <= 10.0 THEN 'XUAT_SAC'
        WHEN score >= 8.0 AND score < 9.0 THEN 'GIOI'
        WHEN score >= 6.5 AND score < 8.0 THEN 'KHA'
        WHEN score >= 5.0 AND score < 6.5 THEN 'TRUNG_BINH'
        WHEN score >= 0 AND score < 5.0 THEN 'YEU'
        ELSE NULL
    END
WHERE score IS NOT NULL;

-- Thêm check constraint để giới hạn điểm số từ 0 - 10
ALTER TABLE learning_results
ADD CONSTRAINT chk_learning_results_score CHECK (score >= 0 AND score <= 10);
