-- ============================================================
-- V15: Enforce Full System Data Consistency & Business Integrity
-- ============================================================

-- 1. Enforce weekday standardization on schedule_slots (2 = Monday, ..., 8 = Sunday)
ALTER TABLE schedule_slots
    ADD CONSTRAINT chk_schedule_weekday CHECK (weekday BETWEEN 2 AND 8);

-- 2. Enforce positive maximum students capacity on course_classes
ALTER TABLE course_classes
    ADD CONSTRAINT chk_class_max_students CHECK (max_students > 0);

-- 3. Enforce promotion date validity
ALTER TABLE promotions
    ADD CONSTRAINT chk_promotions_date CHECK (end_date >= start_date);

-- 4. Enforce financial consistency: amount paid cannot exceed final amount
ALTER TABLE tuition_invoices
    ADD CONSTRAINT chk_invoice_paid_not_exceed CHECK (amount_paid <= final_amount);
