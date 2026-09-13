import java.sql.*;

public class CleanFailedFlyway {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            int deleted = stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE version = '13'");
            System.out.println("Deleted failed V13 rows from flyway_schema_history: " + deleted);
        }
    }
}
