import java.sql.*;

public class CheckTable {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery("SHOW CREATE TABLE learning_results");
            if (rs.next()) {
                System.out.println(rs.getString(2));
            }
        }
    }
}
