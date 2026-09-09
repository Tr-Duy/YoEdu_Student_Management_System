-- V10: Fix schedule_slots data consistency and enforce business rules.
-- This script fixes incorrect weekday assignments and ensures data integrity.

-- 1. Fix incorrect weekday for T2-1730 (id=1) which was mistakenly set to 3 instead of 2.
UPDATE schedule_slots 
SET weekday = 2 
WHERE id = 1 AND slot_code = 'T2-1730' AND weekday = 3;

-- 2. Remove dirty attendance data for LH338 on 2026-09-09 to ensure correct verification
DELETE FROM attendances WHERE course_class_id = (SELECT id FROM course_classes WHERE class_code = 'LH338') AND attendance_date = '2026-09-09';

