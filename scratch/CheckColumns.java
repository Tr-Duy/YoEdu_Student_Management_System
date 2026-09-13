import java.sql.*;

public class CheckColumns {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            String[] tables = {
                "users", "parents", "students", "teachers", "courses", "rooms",
                "schedule_slots", "course_classes", "enrollments", "attendances",
                "learning_results", "tuition_invoices", "payments", "promotions",
                "notifications"
            };

            for (String t : tables) {
                System.out.println("\n=== TABLE: " + t + " ===");
                ResultSet rs = stmt.executeQuery("DESCRIBE " + t);
                while (rs.next()) {
                    System.out.printf("  %-25s %-20s %-10s %-10s %-10s%n",
                        rs.getString("Field"),
                        rs.getString("Type"),
                        rs.getString("Null"),
                        rs.getString("Key"),
                        rs.getString("Default"));
                }
            }
        }
    }
}
