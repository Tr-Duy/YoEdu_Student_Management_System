import java.sql.*;

public class CheckUniqueConstraints {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("=== UNIQUE & CHECK CONSTRAINTS IN YOEDU_DEMO ===");
            ResultSet rs = stmt.executeQuery("""
                SELECT 
                    TABLE_NAME, 
                    CONSTRAINT_NAME, 
                    CONSTRAINT_TYPE
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = 'yoedu_demo' 
                  AND CONSTRAINT_TYPE IN ('UNIQUE', 'CHECK')
                ORDER BY TABLE_NAME, CONSTRAINT_TYPE, CONSTRAINT_NAME
            """);

            while (rs.next()) {
                System.out.printf("%-22s | %-10s | %s%n",
                    rs.getString("TABLE_NAME"),
                    rs.getString("CONSTRAINT_TYPE"),
                    rs.getString("CONSTRAINT_NAME"));
            }
        }
    }
}
