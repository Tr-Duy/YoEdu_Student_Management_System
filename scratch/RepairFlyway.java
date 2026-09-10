import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class RepairFlyway {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        String user = "root";
        String password = "password"; // Wait, I need the actual password. Let's check application.properties

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE version = '12' AND success = 0");
            System.out.println("Flyway history repaired.");
            
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
