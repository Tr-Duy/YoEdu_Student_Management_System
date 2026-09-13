import java.sql.*;

public class DetailedAudit {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("=== 1. FLYWAY SCHEMA HISTORY ===");
            ResultSet rs = stmt.executeQuery("SELECT installed_rank, version, description, script, type, installed_on, success FROM flyway_schema_history ORDER BY installed_rank");
            while (rs.next()) {
                System.out.printf("Rank: %d | Version: %s | Desc: %s | Script: %s | Success: %b%n",
                    rs.getInt("installed_rank"), rs.getString("version"), rs.getString("description"), rs.getString("script"), rs.getBoolean("success"));
            }

            System.out.println("\n=== 2. LEARNING RESULTS AUDIT WITH ENROLLMENT STATUS ===");
            rs = stmt.executeQuery("""
                SELECT lr.id, lr.student_id, s.student_code, s.full_name, lr.course_class_id, cc.name as class_name,
                       lr.result_month, lr.score, lr.classification, lr.status, lr.teacher_comment,
                       e.id as enrollment_id, e.status as enrollment_status
                FROM learning_results lr
                LEFT JOIN students s ON lr.student_id = s.id
                LEFT JOIN course_classes cc ON lr.course_class_id = cc.id
                LEFT JOIN enrollments e ON e.student_id = lr.student_id AND e.course_class_id = lr.course_class_id
                ORDER BY lr.student_id, lr.course_class_id, lr.result_month
            """);
            while (rs.next()) {
                System.out.printf("ID:%d | Student:[%d, %s, %s] | Class:[%d, %s] | Month:%s | Score:%s | Status:%s | Enrollment:[id=%s, status=%s]%n",
                    rs.getInt("id"), rs.getInt("student_id"), rs.getString("student_code"), rs.getString("full_name"),
                    rs.getInt("course_class_id"), rs.getString("class_name"), rs.getString("result_month"),
                    rs.getString("score"), rs.getString("status"), rs.getString("enrollment_id"), rs.getString("enrollment_status"));
            }

            System.out.println("\n=== 3. MULTIPLE ROWS FOR SAME (student_id, course_class_id) ===");
            rs = stmt.executeQuery("""
                SELECT student_id, course_class_id, COUNT(*) as cnt, GROUP_CONCAT(id ORDER BY id) as ids, GROUP_CONCAT(result_month ORDER BY id) as months
                FROM learning_results
                GROUP BY student_id, course_class_id
                HAVING COUNT(*) > 1
            """);
            while (rs.next()) {
                System.out.printf("Student ID: %d | Class ID: %d | Count: %d | IDs: %s | Months: %s%n",
                    rs.getInt("student_id"), rs.getInt("course_class_id"), rs.getInt("cnt"), rs.getString("ids"), rs.getString("months"));
            }

            System.out.println("\n=== 4. ORPHAN CHECK (Students or Classes that do not exist or not enrolled) ===");
            rs = stmt.executeQuery("""
                SELECT lr.id, lr.student_id, lr.course_class_id
                FROM learning_results lr
                LEFT JOIN students s ON lr.student_id = s.id
                LEFT JOIN course_classes cc ON lr.course_class_id = cc.id
                LEFT JOIN enrollments e ON e.student_id = lr.student_id AND e.course_class_id = lr.course_class_id AND e.status = 'ACTIVE'
                WHERE s.id IS NULL OR cc.id IS NULL OR e.id IS NULL
            """);
            boolean hasOrphans = false;
            while (rs.next()) {
                hasOrphans = true;
                System.out.printf("Orphan Grade ID: %d | Student ID: %d | Class ID: %d%n", rs.getInt("id"), rs.getInt("student_id"), rs.getInt("course_class_id"));
            }
            if (!hasOrphans) {
                System.out.println("No orphan learning results found. All records belong to existing, actively enrolled students.");
            }
        }
    }
}
