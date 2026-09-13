import java.sql.*;

public class CheckForeignKeys {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("=== FOREIGN KEYS IN YOEDU_DEMO ===");
            ResultSet rs = stmt.executeQuery("""
                SELECT 
                    TABLE_NAME, 
                    COLUMN_NAME, 
                    CONSTRAINT_NAME, 
                    REFERENCED_TABLE_NAME, 
                    REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE TABLE_SCHEMA = 'yoedu_demo' 
                  AND REFERENCED_TABLE_NAME IS NOT NULL
                ORDER BY TABLE_NAME, COLUMN_NAME
            """);

            while (rs.next()) {
                System.out.printf("%-20s.%-22s -> %-20s.%-10s (%s)%n",
                    rs.getString("TABLE_NAME"),
                    rs.getString("COLUMN_NAME"),
                    rs.getString("REFERENCED_TABLE_NAME"),
                    rs.getString("REFERENCED_COLUMN_NAME"),
                    rs.getString("CONSTRAINT_NAME"));
            }
        }
    }
}
