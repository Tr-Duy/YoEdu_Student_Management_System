import java.sql.*;

public class AuditClasses {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("=== AUDIT ALL COURSE CLASSES ===");
            ResultSet rs = stmt.executeQuery("""
                SELECT cc.id, cc.class_code, cc.name, cc.max_students, cc.status,
                       COUNT(CASE WHEN e.status = 'ACTIVE' THEN 1 END) as active_enrollments,
                       COUNT(e.id) as total_enrollments
                FROM course_classes cc
                LEFT JOIN enrollments e ON cc.id = e.course_class_id
                GROUP BY cc.id, cc.class_code, cc.name, cc.max_students, cc.status
                ORDER BY cc.id
            """);

            System.out.printf("%-5s | %-12s | %-25s | %-4s | %-8s | %-12s | %-10s | %s%n",
                "ID", "CODE", "NAME", "MAX", "ACTIVE", "DB_STATUS", "CAPACITY", "CONSISTENCY");
            System.out.println("---------------------------------------------------------------------------------------------------------");

            while (rs.next()) {
                int id = rs.getInt("id");
                String code = rs.getString("class_code");
                String name = rs.getString("name");
                int max = rs.getInt("max_students");
                String dbStatus = rs.getString("status");
                int active = rs.getInt("active_enrollments");
                int total = rs.getInt("total_enrollments");

                boolean isFull = active >= max;
                String expectedCapacity = isFull ? "FULL" : "AVAILABLE";
                boolean inconsistent = "FULL".equalsIgnoreCase(dbStatus) && !isFull;

                System.out.printf("%-5d | %-12s | %-25s | %-4d | %-8d | %-12s | %-10s | %s%n",
                    id, code, name, max, active, dbStatus, expectedCapacity, (inconsistent ? ">>> INVALID <<<" : "OK"));
            }
        }
    }
}
