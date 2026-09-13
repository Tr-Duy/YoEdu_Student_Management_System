import java.sql.*;

public class AuditDetailedData {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("=== 1. SCHEDULE SLOTS WEEKDAYS ===");
            ResultSet rsSlot = stmt.executeQuery("SELECT id, slot_code, weekday, start_time, end_time FROM schedule_slots ORDER BY id");
            while (rsSlot.next()) {
                System.out.println("id: " + rsSlot.getInt("id") +
                                   ", code: " + rsSlot.getString("slot_code") +
                                   ", weekday: " + rsSlot.getInt("weekday") +
                                   ", time: " + rsSlot.getTime("start_time") + " - " + rsSlot.getTime("end_time"));
            }

            System.out.println("\n=== 2. ATTENDANCE ID 3 ===");
            ResultSet rsAtt = stmt.executeQuery("SELECT a.*, s.full_name as student_name, cc.name as class_name FROM attendances a LEFT JOIN students s ON a.student_id = s.id LEFT JOIN course_classes cc ON a.course_class_id = cc.id WHERE a.id = 3");
            while (rsAtt.next()) {
                System.out.println("Attendance id 3: student=" + rsAtt.getString("student_name") + " (id=" + rsAtt.getLong("student_id") + "), class=" + rsAtt.getString("class_name") + " (id=" + rsAtt.getLong("course_class_id") + ")");
            }
            ResultSet rsEnr = stmt.executeQuery("SELECT * FROM enrollments WHERE student_id = 3");
            System.out.println("Enrollments for student 3:");
            while (rsEnr.next()) {
                System.out.println("  enrollment id=" + rsEnr.getLong("id") + ", class_id=" + rsEnr.getLong("course_class_id") + ", status=" + rsEnr.getString("status"));
            }

            System.out.println("\n=== 3. TEACHER ID 1 ===");
            ResultSet rsT = stmt.executeQuery("SELECT id, teacher_code, full_name, deleted, is_active FROM teachers WHERE id = 1");
            while (rsT.next()) {
                System.out.println("Teacher 1: " + rsT.getString("full_name") + ", deleted=" + rsT.getInt("deleted") + ", is_active=" + rsT.getInt("is_active"));
            }
            ResultSet rsTClasses = stmt.executeQuery("SELECT id, class_code, name, status, main_teacher_id, assistant_teacher_id FROM course_classes WHERE main_teacher_id = 1 OR assistant_teacher_id = 1");
            System.out.println("Classes taught by teacher 1:");
            while (rsTClasses.next()) {
                System.out.println("  class: " + rsTClasses.getString("class_code") + ", name=" + rsTClasses.getString("name") + ", status=" + rsTClasses.getString("status") + ", mainTeacher=" + rsTClasses.getLong("main_teacher_id"));
            }

            System.out.println("\n=== 4. INVOICES & PAYMENTS CONSISTENCY ===");
            ResultSet rsInv = stmt.executeQuery("SELECT id, invoice_code, student_id, course_class_id, original_amount, discount_amount, final_amount, amount_paid, balance_amount, status FROM tuition_invoices");
            while (rsInv.next()) {
                System.out.println("Invoice: " + rsInv.getString("invoice_code") +
                                   ", orig=" + rsInv.getBigDecimal("original_amount") +
                                   ", disc=" + rsInv.getBigDecimal("discount_amount") +
                                   ", final=" + rsInv.getBigDecimal("final_amount") +
                                   ", paid=" + rsInv.getBigDecimal("amount_paid") +
                                   ", balance=" + rsInv.getBigDecimal("balance_amount") +
                                   ", status=" + rsInv.getString("status"));
            }
        }
    }
}
