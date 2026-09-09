# BÁO CÁO FULL DATABASE AUDIT & DATA INTEGRITY — YOEDU SYSTEM
**Tài liệu thẩm định toàn diện: Frontend ↔ API ↔ Controller ↔ Service ↔ Repository ↔ JPA Entity ↔ Flyway ↔ MySQL Actual Database**

---

## 1. CURRENT SCHEMA (17 ACTIVE TABLES + 1 METADATA TABLE)
Database thực tế: `yoedu_demo` (MySQL 8.0.44):
1. `attendances`: 9 cột, PK: `id`, FK: `course_class_id`, `student_id`, `recorded_by_user_id`. Unique: `(course_class_id, student_id, attendance_date)`.
2. `course_classes`: 14 cột, PK: `id`, FK: `course_id`, `room_id`, `schedule_slot_id`, `main_teacher_id`, `assistant_teacher_id`. Unique: `class_code`. Check: `chk_teacher_different`.
3. `courses`: 10 cột, PK: `id`, Unique: `course_code`. Cột tiền `tuition_fee` đang là `double`. Tồn tại 2 cột rác do Hibernate ddl sinh ra: `course_name`, `course_description`.
4. `enrollments`: 8 cột, PK: `id`, FK: `student_id`, `course_class_id`. Unique: `(student_id, course_class_id)`.
5. `learning_results`: 9 cột, PK: `id`, FK: `student_id`, `course_class_id`, `created_by_user_id`. Unique: `(student_id, course_class_id, result_month)`. Cột `teacher_comment` đang là `tinytext` (giới hạn 255 bytes).
6. `notifications`: 11 cột, PK: `id`, FK: `student_id`. Index: `(recipient_type, recipient_ref_id)`.
7. `parents`: 8 cột, PK: `id`, Unique: `phone`. Cột `gender`, `relationship` tồn tại trong DB nhưng chưa có trong Flyway.
8. `payments`: 10 cột, PK: `id`, FK: `invoice_id`, `cashier_user_id`. Unique: `payment_code`. Check: `chk_payment_amount`.
9. `promotions`: 11 cột, PK: `id`, Unique: `promo_code`. Cột `discount_value` đang là `float`.
10. `refresh_token_sessions`: 11 cột, PK: `id`, FK: `user_id`. Unique: `jti`. Cột `is_revoked`, `ip_address`, `user_agent` tồn tại trong DB nhưng chưa có trong Flyway.
11. `rooms`: 7 cột, PK: `id`, Unique: `room_code`.
12. `schedule_slots`: 8 cột, PK: `id`, Unique: `slot_code`. Check: `chk_schedule_time (start_time < end_time)`.
13. `student_status_history`: 7 cột, PK: `id`, FK: `student_id`. **Toàn bộ bảng này chưa từng được định nghĩa trong Flyway!**
14. `students`: 14 cột, PK: `id`, FK: `parent_id`. Unique: `student_code`. Cột `description` chưa có trong Flyway.
15. `teachers`: 20 cột, PK: `id`, Unique: `teacher_code`, `phone`. Cột `achievement`, `address`, `date_of_birth`, `description`, `experience`, `salary`, `status`, `weekly_slots`, `work_unit`, `deleted` tồn tại trong DB nhưng chưa có trong Flyway.
16. `tuition_invoices`: 16 cột, PK: `id`, FK: `student_id`, `course_class_id`, `promotion_id`. Unique: `invoice_code`, `(student_id, course_class_id, billing_month)`. Check: `chk_invoice_balance`.
17. `users`: 12 cột, PK: `id`, FK: `parent_id`, `teacher_id`. Unique: `username`.
18. `flyway_schema_history`: Metadata bảng quản lý lịch sử Flyway (đang ở Version 7).

---

## 2. CURRENT FLYWAY V1–V7 AUDIT
- **`V1__create_schema.sql`**: Tạo 15 bảng ban đầu (`parents`, `teachers`, `students`, `users`, `courses`, `rooms`, `schedule_slots`, `course_classes`, `enrollments`, `attendances`, `learning_results`, `promotions`, `tuition_invoices`, `payments`, `notifications`).
- **`V2__seed_demo_data.sql`**: Dữ liệu seed mẫu cho hệ thống demo.
- **`V3__create_refresh_token_sessions.sql`**: Tạo bảng `refresh_token_sessions` (chỉ có 8 cột ban đầu).
- **`V4__add_updated_at_to_notifications.sql`**: Thêm cột `updated_at` cho `notifications`.
- **`V5__drop_old_total_session_column.sql`**: Xóa cột `total_session` thừa trên `courses`.
- **`V6__fix_seed_discount_type.sql`**: Migration rỗng để đồng bộ enum DiscountType.
- **`V7__fix_data_integrity_and_add_constraints.sql`**: Sửa dữ liệu test xung đột, thêm 3 CHECK constraints (`chk_teacher_different`, `chk_invoice_balance`, `chk_payment_amount`), xóa an toàn 3 bảng legacy rỗng (`course`, `room`, `payment_records`).

> **Hiện tượng Schema Drift**: Bảng `student_status_history` và hàng loạt cột mới trên `teachers`, `parents`, `students`, `refresh_token_sessions` được Hibernate `ddl-auto: update` sinh ra trong database runtime, nhưng **hoàn toàn vắng bóng trong các file Flyway migration**. Nếu triển khai môi trường mới hoặc CI/CD chỉ chạy Flyway, hệ thống sẽ thiếu bảng và thiếu cột ngay lập tức!

---

## 3. ENTITY LIST (17 JPA ENTITIES)
1. `Attendence.java` $\leftrightarrow$ `attendances` *(Tên class typo `Attendence` thay vì `Attendance`)*
2. `Course.java` $\leftrightarrow$ `courses`
3. `CourseClass.java` $\leftrightarrow$ `course_classes`
4. `Enrollment.java` $\leftrightarrow$ `enrollments`
5. `LearningResult.java` $\leftrightarrow$ `learning_results`
6. `Notification.java` $\leftrightarrow$ `notifications`
7. `Parent.java` $\leftrightarrow$ `parents`
8. `Payment.java` $\leftrightarrow$ `payments`
9. `Promotion.java` $\leftrightarrow$ `promotions`
10. `RefreshTokenSession.java` $\leftrightarrow$ `refresh_token_sessions`
11. `Room.java` $\leftrightarrow$ `rooms`
12. `ScheduleSlot.java` $\leftrightarrow$ `schedule_slots`
13. `Student.java` $\leftrightarrow$ `students`
14. `StudentStatusHistory.java` $\leftrightarrow$ `student_status_history`
15. `Teacher.java` $\leftrightarrow$ `teachers`
16. `TuitionInvoice.java` $\leftrightarrow$ `tuition_invoices`
17. `Users.java` $\leftrightarrow$ `users`

*(Lưu ý: `StudentCard.java` trong package entity không phải `@Entity`, chỉ là POJO thừa trùng lặp với DTO `com.yo.day1.dto.parent.StudentCard`).*

---

## 4. MISSING TABLES
- **Trong Database thực tế hiện tại**: 0 bảng thiếu (toàn bộ 17 Entity đều có bảng).
- **Trong bộ kịch bản Flyway**: **Thiếu bảng `student_status_history`**. Cần phải bổ sung định nghĩa DDL vào Flyway V8.

---

## 5. MISSING COLUMNS
1. **Trong Flyway V1–V7 (có trong DB và Entity nhưng chưa có trong Flyway)**:
   - Bảng `teachers`: `achievement` VARCHAR(500), `address` VARCHAR(255), `date_of_birth` DATE, `description` VARCHAR(255), `experience` VARCHAR(500), `salary` DECIMAL(12,2), `status` ENUM('ACTIVE','INACTIVE','RESIGNED'), `weekly_slots` INT, `work_unit` VARCHAR(100), `deleted` BIT(1).
   - Bảng `parents`: `gender` ENUM('FEMALE','MALE','OTHER'), `relationship` VARCHAR(50).
   - Bảng `students`: `description` VARCHAR(255).
   - Bảng `refresh_token_sessions`: `is_revoked` BIT(1), `ip_address` VARCHAR(50), `user_agent` VARCHAR(255).
2. **Trong JPA Entity (có trong DB nhưng Entity thiếu)**:
   - `Notification.java`: Thiếu trường `updatedAt` (được tạo bởi V4 trong DB).
   - `StudentStatusHistory.java`: Trường `changedByUserId` là kiểu `Long` nguyên thủy, chưa map `@ManyToOne` đến `Users`.

---

## 6. OBSOLETE TABLES
- 3 bảng cũ `course`, `room`, `payment_records` đã được thẩm định an toàn (0 rows, 0 references) và xóa thành công trong V7. Hiện tại **0 bảng obsolete**.

---

## 7. DUPLICATE TABLES & COLUMNS
1. **Trùng lặp code**:
   - `CoreClassRepository.java`: Interface repository bị gõ sai tên, không hề được inject hay sử dụng ở bất kỳ đâu (thừa so với `CourseClassRepository.java`).
   - `com.yo.day1.domain.entity.StudentCard`: File POJO thừa không có annotation JPA, trùng với `com.yo.day1.dto.parent.StudentCard`.
2. **Cột thừa / rác trong bảng `courses`**:
   - `courses.course_name`: VARCHAR(100) NULL, toàn bộ 4 dòng đều NULL.
   - `courses.course_description`: TEXT NULL, toàn bộ 4 dòng đều NULL.
   *(Dữ liệu thật đang nằm tại cột chuẩn `name` và `description`).*

---

## 8. MISSING FOREIGN KEYS
- `student_status_history.changed_by_user_id`: Chưa có FK liên kết tới `users(id)`.

---

## 9. WRONG FOREIGN KEYS
- Không phát hiện FK nào trỏ sai bảng hoặc sai cột. Tất cả 23 FK hiện có đều trỏ chính xác đến khóa chính `id` của bảng liên kết.

---

## 10. MISSING / MISMATCHED UNIQUE CONSTRAINTS
- **`parents`**: Trong DB, `phone` là UNIQUE, `email` KHÔNG UNIQUE. Trong `Parent.java`, lại đặt `@Column(unique = true)` ở `email` nhưng không đặt ở `phone`.
- **`courses.course_code`**: Đã có Unique Index ở DB, nhưng Entity `Course.java` chưa khai báo `unique = true`.
- **`rooms.room_code`**: Đã có Unique Index ở DB, nhưng Entity `Room.java` chưa khai báo `unique = true`.
- **`schedule_slots.slot_code`**: Đã có Unique Index ở DB, nhưng Entity `ScheduleSlot.java` chưa khai báo `unique = true`.

---

## 11. MISSING CHECK CONSTRAINTS
Cần bổ sung vào DB:
1. `promotions`: `CHECK (discount_value > 0 AND (discount_type != 'PERCENT' OR discount_value <= 100))`.
2. `courses`: `CHECK (tuition_fee >= 0 AND total_sessions > 0)`.
3. `rooms`: `CHECK (capacity > 0)`.
4. `students`: `CHECK (latest_score >= 0 AND latest_score <= 10)`.
5. `learning_results`: `CHECK (score IS NULL OR (score >= 0 AND score <= 10))`.

---

## 12. MISSING INDEXES (PERFORMANCE OPTIMIZATION)
Các truy vấn thực tế của Service/Controller đang filter thường xuyên nhưng chưa có index tối ưu:
1. `students(status)`: Dùng trong lọc danh sách học viên active và điểm danh.
2. `teachers(status, is_active, deleted)`: Dùng trong việc chọn giáo viên phân công lớp.
3. `course_classes(status)`: Dùng liên tục trong ScheduleConflictService và tìm kiếm lớp mở.
4. `course_classes(main_teacher_id)`: Dùng kiểm tra lịch dạy và chặn xóa giáo viên.
5. `course_classes(room_id)`: Dùng kiểm tra trùng phòng.
6. `payments(paid_at)`: Dùng thống kê doanh thu theo ngày/tháng.
7. `tuition_invoices(billing_month)`: Dùng tìm kiếm hóa đơn theo tháng.
8. `tuition_invoices(student_id)`: Dùng hiển thị lịch sử học phí của học viên.

---

## 13. WRONG NULLABLE
- `parents.full_name`: Trong DB hiện tại cho phép `YES` (NULL) do Hibernate cập nhật trước đó, trong khi V1 ban đầu là `NOT NULL`. Họ tên phụ huynh bắt buộc phải là `NOT NULL`.
- `courses.course_code`: Trong DB đang là `YES` nullable, cần đưa về `NOT NULL`.

---

## 14. WRONG DATA TYPES & PRECISION RISKS
1. **`courses.tuition_fee`**: Đang dùng kiểu `DOUBLE` trong DB và Java. Tiền tệ dùng floating point sẽ gây sai số làm tròn (rounding error). Cần chuyển sang `DECIMAL(12,2)` đồng bộ với `course_classes.tuition_fee` và `tuition_invoices.final_amount`.
2. **`promotions.discount_value`**: Đang dùng kiểu `FLOAT` trong DB và Java. Khi giảm giá theo số tiền cố định (ví dụ 500.000 VNĐ), float chỉ có 7 chữ số chính xác, gây lệch tiền. Cần chuyển sang `DECIMAL(12,2)`.
3. **`learning_results.teacher_comment`**: DB hiện tại đang là `TINYTEXT` (tối đa 255 bytes), trong khi nhận xét của giáo viên hàng tháng cần độ dài lớn hơn. Cần chuyển thành `TEXT` (tối đa 65.535 bytes).

---

## 15. ENUM MISMATCH
- `notifications.recipient_type`: V1 ghi `ENUM('PARENT', 'STUDENT', 'STAFF')`, nhưng Java `NotificationRecipientType` và DB thực tế đang là `ENUM('PARENT', 'STUDENT', 'TEACHER')`. Cần đồng bộ hóa rõ ràng trong Flyway.

---

## 16. BUSINESS RULE MISMATCH & ENFORCEMENT MATRIX
| Business Rule | Enforce ở Database | Enforce ở Service / Transaction |
| :--- | :---: | :---: |
| Trùng mã học sinh / giáo viên / lớp / khóa học / phòng / hóa đơn | **CÓ** (`UNIQUE` index) | **CÓ** (Kiểm tra trước khi save) |
| Giáo viên chính $\ne$ Trợ giảng | **CÓ** (`CHECK` constraint) | **CÓ** (Validate tạo/sửa lớp) |
| Số dư hóa đơn $\ge 0$, Số tiền thanh toán $> 0$ | **CÓ** (`CHECK` constraint) | **CÓ** (Validate transaction) |
| Điểm danh không trùng cùng ngày | **CÓ** (`UNIQUE (class, student, date)`) | **CÓ** (Kiểm tra enrollment active) |
| Hóa đơn không trùng cùng tháng | **CÓ** (`UNIQUE (student, class, month)`) | **CÓ** (Kiểm tra tồn tại) |
| Sĩ số lớp $\le$ Sức chứa phòng | **KHÔNG** (Dữ liệu 2 bảng khác nhau) | **CÓ** (Validate khi tạo/sửa lớp) |
| Trùng lịch phòng / giáo viên / học viên | **KHÔNG** (Khoảng thời gian giao nhau) | **CÓ** (`ScheduleConflictService`) |
| Học viên DROPPED được re-enroll | **KHÔNG** (UNIQUE chặn duplicate row) | **CÓ** (Reactivate bản ghi cũ) |
| Chống vượt sĩ số khi concurrent request | **KHÔNG** (Locking không làm ở DDL) | **CÓ** (Pessimistic Lock `findByIdWithLock`) |

---

## 17. DATA INTEGRITY VIOLATIONS
- **Dữ liệu thực tế hiện tại**: Đã được làm sạch 100% (0 orphan records, 0 negative balance, 0 payment vượt số dư, 0 trùng giáo viên trong lớp).
- **Dữ liệu schema rác cần dọn dẹp**: 2 cột rác `course_name`, `course_description` trên bảng `courses` chứa giá trị NULL, cần DROP để tránh nhầm lẫn.

---

## 18. MIGRATION PLAN (FLYWAY V8)
Tạo tập tin: `V8__sync_schema_drift_and_enhance_integrity.sql`:
1. **Drop duplicate columns**:
   - `ALTER TABLE courses DROP COLUMN IF EXISTS course_name;`
   - `ALTER TABLE courses DROP COLUMN IF EXISTS course_description;`
2. **Fix data types & precision**:
   - `ALTER TABLE courses MODIFY COLUMN tuition_fee DECIMAL(12,2) NOT NULL DEFAULT 0;`
   - `ALTER TABLE courses MODIFY COLUMN course_code VARCHAR(20) NOT NULL;`
   - `ALTER TABLE promotions MODIFY COLUMN discount_value DECIMAL(12,2) NOT NULL;`
   - `ALTER TABLE learning_results MODIFY COLUMN teacher_comment TEXT;`
   - `ALTER TABLE parents MODIFY COLUMN full_name VARCHAR(100) NOT NULL;`
3. **Formalize drifted schema objects in Flyway**:
   - Tạo bảng `student_status_history` nếu chưa tồn tại (với đầy đủ FK sang `students` và `users`).
   - Bổ sung FK `fk_status_history_user` từ `student_status_history(changed_by_user_id)` $\rightarrow$ `users(id)`.
   - Bổ sung các cột schema drift trên `teachers`, `parents`, `students`, `refresh_token_sessions` một cách an toàn / idempotent.
4. **Add business check constraints**:
   - CHECK cho `promotions` (discount_value > 0).
   - CHECK cho `courses` (tuition_fee >= 0, total_sessions > 0).
   - CHECK cho `rooms` (capacity > 0).
   - CHECK cho `students` (latest_score >= 0 AND latest_score <= 10).
   - CHECK cho `learning_results` (score IS NULL OR (score >= 0 AND score <= 10)).
5. **Add performance indexes**:
   - Index cho `students(status)`.
   - Index cho `course_classes(status)`.
   - Index cho `course_classes(main_teacher_id)`.
   - Index cho `course_classes(room_id)`.
   - Index cho `payments(paid_at)`.
   - Index cho `tuition_invoices(billing_month)`.

---

## 19. RISK LEVEL & MITIGATION
- **Mức độ rủi ro**: **THẤP (LOW)**.
- **Biện pháp giảm thiểu**:
  - Không DROP bất kỳ bảng nào đang sử dụng dữ liệu.
  - Chỉ DROP 2 cột `course_name` và `course_description` trên bảng `courses` sau khi đã xác nhận 100% giá trị đều là NULL và Entity mapping vào cột `name`/`description`.
  - Giữ nguyên toàn bộ 100% dữ liệu lịch sử và các quan hệ khóa ngoại hiện có.
