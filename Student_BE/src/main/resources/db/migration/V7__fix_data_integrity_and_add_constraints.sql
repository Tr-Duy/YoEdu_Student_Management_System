-- V7: Fix data integrity violations, remove legacy empty tables, and add integrity constraints

-- 1) Fix duplicate assistant teacher on test class LH461 (id=8)
UPDATE course_classes SET assistant_teacher_id = NULL WHERE id = 8;

-- 2) Rebalance room and schedule allocations for recent test classes (id: 7, 8, 9, 10)
-- to resolve room 1 and teacher 11 multiple-booking on slot 1
UPDATE course_classes SET room_id = 2 WHERE id = 7;
UPDATE course_classes SET schedule_slot_id = 2 WHERE id = 8;
UPDATE course_classes SET schedule_slot_id = 3, room_id = 2 WHERE id = 9;
UPDATE course_classes SET schedule_slot_id = 3, room_id = 1, main_teacher_id = 2 WHERE id = 10;

-- 3) Complete cashier audit trail on payment id 7
UPDATE payments SET cashier_user_id = 3 WHERE id = 7 AND cashier_user_id IS NULL;

-- 4) Add business integrity constraints
-- Rule: assistant teacher cannot be the same as main teacher
ALTER TABLE course_classes ADD CONSTRAINT chk_teacher_different 
CHECK (assistant_teacher_id IS NULL OR assistant_teacher_id != main_teacher_id);

-- Rule: invoice balance cannot be negative
ALTER TABLE tuition_invoices ADD CONSTRAINT chk_invoice_balance 
CHECK (balance_amount >= 0);

-- Rule: payment amount must be positive
ALTER TABLE payments ADD CONSTRAINT chk_payment_amount 
CHECK (paid_amount > 0);

-- 5) Drop unused legacy tables verified to have 0 rows and 0 FK references
DROP TABLE IF EXISTS course;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS payment_records;
