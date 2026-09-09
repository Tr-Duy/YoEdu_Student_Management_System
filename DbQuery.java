import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbQuery {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        String user = "root";
        String password = "123456";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            String[] tables = {
                "users", "parents", "students", "teachers", "courses", 
                "rooms", "schedule_slots", "course_classes", "enrollments", 
                "attendances", "learning_results", "tuition_invoices", 
                "payments", "promotions", "notifications", "flyway_schema_history"
            };

            System.out.println("--- DB COUNTS ---");
            for (String table : tables) {
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM " + table)) {
                    if (rs.next()) {
                        System.out.println(table + ": " + rs.getInt(1));
                    }
                } catch (Exception e) {
                    System.out.println(table + ": ERROR " + e.getMessage());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
