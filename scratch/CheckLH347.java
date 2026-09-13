import java.sql.*;

public class CheckLH347 {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:mysql://localhost:3306/yoedu_demo";
        try (Connection conn = DriverManager.getConnection(url, "root", "123456");
             Statement stmt = conn.createStatement()) {

            System.out.println("=== LH347 CLASS DETAILS ===");
            ResultSet rsClass = stmt.executeQuery("SELECT * FROM course_classes WHERE class_code = 'LH347'");
            while (rsClass.next()) {
                System.out.println("id: " + rsClass.getInt("id") +
                                   ", class_code: " + rsClass.getString("class_code") +
                                   ", name: " + rsClass.getString("name") +
                                   ", max_students: " + rsClass.getInt("max_students") +
                                   ", status: " + rsClass.getString("status"));
            }

            System.out.println("\n=== LH347 ENROLLMENTS ===");
            ResultSet rsEnroll = stmt.executeQuery("SELECT e.*, s.full_name FROM enrollments e LEFT JOIN students s ON e.student_id = s.id WHERE e.course_class_id = 9");
            boolean found = false;
            while (rsEnroll.next()) {
                found = true;
                System.out.println("enrollment_id: " + rsEnroll.getInt("id") +
                                   ", student: " + rsEnroll.getString("full_name") +
                                   ", status: " + rsEnroll.getString("status") +
                                   ", enrolled_at: " + rsEnroll.getDate("enrolled_at"));
            }
            if (!found) {
                System.out.println("NO ENROLLMENTS FOUND FOR LH347 (total = 0)");
            }
        }
    }
}
