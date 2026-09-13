-- ============================================================
-- V14: Fix Course Class Capacity and Status Consistency
-- ============================================================

-- If a course class has status 'FULL' but active enrollments < max_students, reset to 'OPEN'
UPDATE course_classes cc
SET cc.status = 'OPEN'
WHERE cc.status = 'FULL'
  AND (
      SELECT COUNT(*)
      FROM enrollments e
      WHERE e.course_class_id = cc.id
        AND e.status = 'ACTIVE'
  ) < cc.max_students;

-- If a course class has status 'OPEN' but active enrollments >= max_students, set to 'FULL'
UPDATE course_classes cc
SET cc.status = 'FULL'
WHERE cc.status = 'OPEN'
  AND (
      SELECT COUNT(*)
      FROM enrollments e
      WHERE e.course_class_id = cc.id
        AND e.status = 'ACTIVE'
  ) >= cc.max_students;
