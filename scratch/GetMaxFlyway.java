import java.sql.*;

public class GetMaxFlyway {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery("SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5");
            while (rs.next()) {
                System.out.println("Version: " + rs.getString(1) + " | " + rs.getString(2) + " | Success: " + rs.getBoolean(3));
            }
        }
    }
}
