import java.sql.*;

public class CheckConstraintDefs {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery("""
                SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
                FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS 
                WHERE CONSTRAINT_SCHEMA = 'yoedu_demo'
            """);

            while (rs.next()) {
                System.out.printf("%-30s : %s%n",
                    rs.getString("CONSTRAINT_NAME"),
                    rs.getString("CHECK_CLAUSE"));
            }
        }
    }
}
