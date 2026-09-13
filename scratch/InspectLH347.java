import java.sql.*;

public class InspectLH347 {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            ResultSet rs = stmt.executeQuery("SELECT * FROM course_classes WHERE id = 9");
            ResultSetMetaData meta = rs.getMetaData();
            if (rs.next()) {
                for (int i = 1; i <= meta.getColumnCount(); i++) {
                    System.out.println(meta.getColumnName(i) + ": " + rs.getString(i));
                }
            }
        }
    }
}
