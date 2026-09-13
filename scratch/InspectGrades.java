import java.sql.*;

public class InspectGrades {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("--- FOREIGN KEYS REFERENCING learning_results ---");
            ResultSet rs = stmt.executeQuery("""
                SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                WHERE REFERENCED_TABLE_SCHEMA = 'yoedu_demo'
                  AND REFERENCED_TABLE_NAME = 'learning_results'
            """);
            boolean found = false;
            while (rs.next()) {
                found = true;
                System.out.println(rs.getString(1) + "." + rs.getString(2) + " -> " + rs.getString(3));
            }
            if (!found) {
                System.out.println("None! No other table references learning_results.");
            }
        }
    }
}
