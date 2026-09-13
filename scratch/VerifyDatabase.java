import java.sql.*;

public class VerifyDatabase {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("=== 1. SCHEMA VERIFICATION ===");
            ResultSet rs = stmt.executeQuery("DESCRIBE learning_results");
            while (rs.next()) {
                System.out.printf("%-18s | %-15s | Nullable: %-3s | Key: %-3s | Default: %s%n",
                    rs.getString(1), rs.getString(2), rs.getString(3), rs.getString(4), rs.getString(5));
            }

            System.out.println("\n=== 2. ROW COUNT & SCORES INTEGRITY ===");
            rs = stmt.executeQuery("SELECT COUNT(*) FROM learning_results");
            rs.next();
            System.out.println("Total learning_results: " + rs.getInt(1));

            rs = stmt.executeQuery("SELECT COUNT(*) FROM learning_results WHERE process_score < 0 OR process_score > 10");
            rs.next();
            System.out.println("Invalid process_score (<0 or >10): " + rs.getInt(1));

            rs = stmt.executeQuery("SELECT COUNT(*) FROM learning_results WHERE midterm_score < 0 OR midterm_score > 10");
            rs.next();
            System.out.println("Invalid midterm_score (<0 or >10): " + rs.getInt(1));

            rs = stmt.executeQuery("SELECT COUNT(*) FROM learning_results WHERE final_score < 0 OR final_score > 10");
            rs.next();
            System.out.println("Invalid final_score (<0 or >10): " + rs.getInt(1));

            rs = stmt.executeQuery("SELECT COUNT(*) FROM learning_results WHERE total_score < 0 OR total_score > 10");
            rs.next();
            System.out.println("Invalid total_score (<0 or >10): " + rs.getInt(1));

            System.out.println("\n=== 3. ORPHAN CHECK ===");
            rs = stmt.executeQuery("""
                SELECT COUNT(*) FROM learning_results lr
                LEFT JOIN students s ON lr.student_id = s.id
                WHERE s.id IS NULL
            """);
            rs.next();
            System.out.println("Orphan students: " + rs.getInt(1));

            rs = stmt.executeQuery("""
                SELECT COUNT(*) FROM learning_results lr
                LEFT JOIN course_classes c ON lr.course_class_id = c.id
                WHERE c.id IS NULL
            """);
            rs.next();
            System.out.println("Orphan course classes: " + rs.getInt(1));

            rs = stmt.executeQuery("""
                SELECT COUNT(*) FROM learning_results lr
                LEFT JOIN enrollments e ON lr.student_id = e.student_id AND lr.course_class_id = e.course_class_id AND e.status = 'ACTIVE'
                WHERE e.id IS NULL
            """);
            rs.next();
            System.out.println("Learning results without active enrollment: " + rs.getInt(1));

            System.out.println("\n=== 4. DUPLICATE (student_id, course_class_id) CHECK ===");
            rs = stmt.executeQuery("""
                SELECT student_id, course_class_id, COUNT(*)
                FROM learning_results
                GROUP BY student_id, course_class_id
                HAVING COUNT(*) > 1
            """);
            boolean hasDup = false;
            while (rs.next()) {
                hasDup = true;
                System.out.println("DUPLICATE: student=" + rs.getInt(1) + ", class=" + rs.getInt(2));
            }
            if (!hasDup) {
                System.out.println("No duplicates! UNIQUE(student_id, course_class_id) strictly held.");
            }

            System.out.println("\n=== 5. BACKUP TABLE CHECK ===");
            rs = stmt.executeQuery("SELECT COUNT(*) FROM legacy_learning_results_backup");
            rs.next();
            System.out.println("legacy_learning_results_backup row count: " + rs.getInt(1));

            System.out.println("\n=== 6. CURRENT DATA IN learning_results ===");
            rs = stmt.executeQuery("""
                SELECT lr.id, lr.student_id, s.student_code, s.full_name, lr.course_class_id, cc.name as class_name,
                       lr.process_score, lr.midterm_score, lr.final_score, lr.total_score, lr.classification, lr.status
                FROM learning_results lr
                JOIN students s ON lr.student_id = s.id
                JOIN course_classes cc ON lr.course_class_id = cc.id
                ORDER BY lr.id
            """);
            while (rs.next()) {
                System.out.printf("ID:%d | %s (%s) | %s | Process:%s | Midterm:%s | Final:%s | Total:%s | Classif:%s | Status:%s%n",
                    rs.getInt("id"), rs.getString("full_name"), rs.getString("student_code"), rs.getString("class_name"),
                    rs.getString("process_score"), rs.getString("midterm_score"), rs.getString("final_score"),
                    rs.getString("total_score"), rs.getString("classification"), rs.getString("status"));
            }
        }
    }
}
