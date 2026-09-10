-- Seed 10 valid grades using existing students and classes

-- Insert IGNORE avoids duplicate and avoids deleting existing data
INSERT IGNORE INTO learning_results (student_id, course_class_id, result_month, score, classification, status, teacher_comment, created_by_user_id, created_at, updated_at)
SELECT 
    s.id as student_id,
    e.course_class_id as course_class_id,
    '2026-09-01' as result_month,
    8.5 as score,
    'GIOI' as classification,
    'DRAFT' as status,
    'Good' as teacher_comment,
    1 as created_by_user_id,
    NOW(), NOW()
FROM students s
JOIN enrollments e ON e.student_id = s.id
WHERE e.status = 'ACTIVE'
LIMIT 5;

INSERT IGNORE INTO learning_results (student_id, course_class_id, result_month, score, classification, status, teacher_comment, created_by_user_id, created_at, updated_at)
SELECT 
    s.id as student_id,
    e.course_class_id as course_class_id,
    '2026-08-01' as result_month,
    9.5 as score,
    'XUAT_SAC' as classification,
    'LOCKED' as status,
    'Excellent' as teacher_comment,
    1 as created_by_user_id,
    NOW(), NOW()
FROM students s
JOIN enrollments e ON e.student_id = s.id
WHERE e.status = 'ACTIVE'
ORDER BY s.id DESC
LIMIT 5;
