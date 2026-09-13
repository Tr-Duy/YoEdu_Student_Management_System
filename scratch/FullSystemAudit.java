import java.sql.*;
import java.util.*;

public class FullSystemAudit {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("============================================================");
            System.out.println("YOEDU FULL SYSTEM DATA AUDIT");
            System.out.println("============================================================");

            String[] tables = {
                "users", "parents", "students", "teachers", "courses", "rooms",
                "schedule_slots", "course_classes", "enrollments", "attendances",
                "learning_results", "tuition_invoices", "payments", "promotions",
                "notifications", "student_status_histories", "refresh_token_sessions"
            };

            System.out.println("\n--- 1. TABLE ROW COUNTS ---");
            for (String t : tables) {
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + t)) {
                    if (rs.next()) {
                        System.out.printf("%-25s : %d rows%n", t, rs.getInt(1));
                    }
                } catch (Exception e) {
                    System.out.printf("%-25s : ERROR (%s)%n", t, e.getMessage());
                }
            }

            System.out.println("\n--- 2. ORPHAN RECORD AUDIT ---");
            checkQuery(stmt, "Students without valid Parent (parent_id IS NULL or not in parents)",
                "SELECT id, student_code, full_name, parent_id FROM students WHERE parent_id IS NULL OR parent_id NOT IN (SELECT id FROM parents)");

            checkQuery(stmt, "CourseClasses without valid Course",
                "SELECT id, class_code FROM course_classes WHERE course_id NOT IN (SELECT id FROM courses)");

            checkQuery(stmt, "CourseClasses without valid Room",
                "SELECT id, class_code FROM course_classes WHERE room_id NOT IN (SELECT id FROM rooms)");

            checkQuery(stmt, "CourseClasses without valid ScheduleSlot",
                "SELECT id, class_code FROM course_classes WHERE schedule_slot_id NOT IN (SELECT id FROM schedule_slots)");

            checkQuery(stmt, "CourseClasses without valid MainTeacher",
                "SELECT id, class_code FROM course_classes WHERE main_teacher_id NOT IN (SELECT id FROM teachers)");

            checkQuery(stmt, "Enrollments without valid Student",
                "SELECT id FROM enrollments WHERE student_id NOT IN (SELECT id FROM students)");

            checkQuery(stmt, "Enrollments without valid CourseClass",
                "SELECT id FROM enrollments WHERE course_class_id NOT IN (SELECT id FROM course_classes)");

            checkQuery(stmt, "Attendances without valid Student",
                "SELECT id FROM attendances WHERE student_id NOT IN (SELECT id FROM students)");

            checkQuery(stmt, "Attendances without valid CourseClass",
                "SELECT id FROM attendances WHERE course_class_id NOT IN (SELECT id FROM course_classes)");

            checkQuery(stmt, "Attendances where Student is NOT actively enrolled in the CourseClass",
                "SELECT a.id, a.student_id, a.course_class_id FROM attendances a " +
                "WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = a.student_id AND e.course_class_id = a.course_class_id AND e.status = 'ACTIVE')");

            checkQuery(stmt, "LearningResults without valid Student",
                "SELECT id FROM learning_results WHERE student_id NOT IN (SELECT id FROM students)");

            checkQuery(stmt, "LearningResults without valid CourseClass",
                "SELECT id FROM learning_results WHERE course_class_id NOT IN (SELECT id FROM course_classes)");

            checkQuery(stmt, "LearningResults where Student is NOT enrolled in the CourseClass",
                "SELECT lr.id, lr.student_id, lr.course_class_id FROM learning_results lr " +
                "WHERE NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.student_id = lr.student_id AND e.course_class_id = lr.course_class_id)");

            checkQuery(stmt, "TuitionInvoices without valid Student",
                "SELECT id FROM tuition_invoices WHERE student_id NOT IN (SELECT id FROM students)");

            checkQuery(stmt, "Payments without valid Invoice",
                "SELECT id FROM payments WHERE invoice_id NOT IN (SELECT id FROM tuition_invoices)");

            checkQuery(stmt, "Notifications without valid User",
                "SELECT id FROM notifications WHERE user_id NOT IN (SELECT id FROM users)");

            System.out.println("\n--- 3. DUPLICATE AUDIT ---");
            checkQuery(stmt, "Duplicate Student Codes",
                "SELECT student_code, COUNT(*) c FROM students GROUP BY student_code HAVING c > 1");

            checkQuery(stmt, "Duplicate Teacher Codes",
                "SELECT teacher_code, COUNT(*) c FROM teachers GROUP BY teacher_code HAVING c > 1");

            checkQuery(stmt, "Duplicate Course Codes",
                "SELECT course_code, COUNT(*) c FROM courses GROUP BY course_code HAVING c > 1");

            checkQuery(stmt, "Duplicate Room Codes",
                "SELECT room_code, COUNT(*) c FROM rooms GROUP BY room_code HAVING c > 1");

            checkQuery(stmt, "Duplicate Active Enrollments for same Student + CourseClass",
                "SELECT student_id, course_class_id, COUNT(*) c FROM enrollments WHERE status = 'ACTIVE' GROUP BY student_id, course_class_id HAVING c > 1");

            checkQuery(stmt, "Duplicate LearningResults for same Student + CourseClass",
                "SELECT student_id, course_class_id, COUNT(*) c FROM learning_results GROUP BY student_id, course_class_id HAVING c > 1");

            checkQuery(stmt, "Duplicate Payments with same transaction_code",
                "SELECT transaction_code, COUNT(*) c FROM payments WHERE transaction_code IS NOT NULL GROUP BY transaction_code HAVING c > 1");

            System.out.println("\n--- 4. BUSINESS LOGIC & NUMERICAL INTEGRITY AUDIT ---");
            checkQuery(stmt, "Rooms with capacity <= 0",
                "SELECT id, name, capacity FROM rooms WHERE capacity <= 0");

            checkQuery(stmt, "Classes where max_students > room capacity",
                "SELECT cc.id, cc.class_code, cc.max_students, r.name, r.capacity " +
                "FROM course_classes cc JOIN rooms r ON cc.room_id = r.id WHERE cc.max_students > r.capacity");

            checkQuery(stmt, "Classes where main_teacher_id = assistant_teacher_id",
                "SELECT id, class_code, main_teacher_id, assistant_teacher_id FROM course_classes WHERE main_teacher_id = assistant_teacher_id AND assistant_teacher_id IS NOT NULL");

            checkQuery(stmt, "LearningResults with invalid scores (<0 or >10)",
                "SELECT id, student_id, course_class_id, process_score, midterm_score, final_score, total_score " +
                "FROM learning_results WHERE process_score < 0 OR process_score > 10 OR midterm_score < 0 OR midterm_score > 10 OR final_score < 0 OR final_score > 10 OR total_score < 0 OR total_score > 10");

            checkQuery(stmt, "TuitionInvoices with invalid financial balance (balance != final_amount - paid_amount or paid_amount > final_amount)",
                "SELECT id, total_amount, final_amount, paid_amount, balance FROM tuition_invoices WHERE balance != (final_amount - paid_amount) OR paid_amount > final_amount");

            checkQuery(stmt, "Payments with amount <= 0",
                "SELECT id, invoice_id, amount FROM payments WHERE amount <= 0");

            checkQuery(stmt, "Promotions with invalid discount (percentage < 0 or > 100, or end_date < start_date)",
                "SELECT id, code, discount_percentage, start_date, end_date FROM promotions WHERE (discount_percentage IS NOT NULL AND (discount_percentage < 0 OR discount_percentage > 100)) OR (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date < start_date)");

            checkQuery(stmt, "Soft-deleted Teachers assigned to OPEN/ONGOING classes",
                "SELECT cc.id, cc.class_code, cc.status, t.id, t.full_name, t.deleted, t.is_active " +
                "FROM course_classes cc JOIN teachers t ON (cc.main_teacher_id = t.id OR cc.assistant_teacher_id = t.id) " +
                "WHERE cc.status IN ('OPEN', 'ONGOING') AND (t.deleted = 1 OR t.is_active = 0)");

            System.out.println("\n============================================================");
            System.out.println("AUDIT COMPLETE");
            System.out.println("============================================================");
        }
    }

    private static void checkQuery(Statement stmt, String title, String sql) {
        try (ResultSet rs = stmt.executeQuery(sql)) {
            ResultSetMetaData meta = rs.getMetaData();
            int cols = meta.getColumnCount();
            int count = 0;
            List<String> rows = new ArrayList<>();
            while (rs.next()) {
                count++;
                StringBuilder sb = new StringBuilder();
                for (int i = 1; i <= cols; i++) {
                    if (i > 1) sb.append(", ");
                    sb.append(meta.getColumnLabel(i)).append(": ").append(rs.getString(i));
                }
                rows.add(sb.toString());
            }
            if (count == 0) {
                System.out.println("[OK] " + title);
            } else {
                System.out.println("[VIOLATION - " + count + " items] " + title + ":");
                for (String r : rows) {
                    System.out.println("   -> " + r);
                }
            }
        } catch (Exception e) {
            System.out.println("[ERROR] " + title + " -> " + e.getMessage());
        }
    }
}
