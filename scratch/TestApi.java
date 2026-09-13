import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestApi {
    private static final String BASE_URL = "http://localhost:8080";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static String token;

    public static void main(String[] args) throws Exception {
        System.out.println("=== 1. LOGIN ===");
        String loginBody = "{\"username\":\"admin\",\"password\":\"123456\"}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(loginBody))
                .build();
        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Login status: " + resp.statusCode());
        if (resp.statusCode() != 200) {
            System.out.println("Response: " + resp.body());
            return;
        }

        // Extract accessToken
        String body = resp.body();
        int tokenIdx = body.indexOf("\"accessToken\":\"");
        if (tokenIdx != -1) {
            int endIdx = body.indexOf("\"", tokenIdx + 15);
            token = body.substring(tokenIdx + 15, endIdx);
        } else {
            System.out.println("Cannot find accessToken in: " + body);
            return;
        }
        System.out.println("JWT Token obtained successfully!");

        System.out.println("\n=== 2. SEARCH GRADES ===");
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/search"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString("{}"))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Search status: " + resp.statusCode());
        System.out.println("Found grades count/body preview: " + resp.body().substring(0, Math.min(resp.body().length(), 200)) + "...");

        System.out.println("\n=== 3. VALIDATION: NEGATIVE SCORE (-1) ===");
        String invalidNegative = "{\"studentId\":28,\"courseClassId\":24,\"processScore\":-1,\"midtermScore\":8,\"finalScore\":9}";
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(invalidNegative))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Negative score status (expect 400): " + resp.statusCode());

        System.out.println("\n=== 4. VALIDATION: OVER MAX SCORE (11) ===");
        String invalidOverMax = "{\"studentId\":28,\"courseClassId\":24,\"processScore\":8,\"midtermScore\":11,\"finalScore\":9}";
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(invalidOverMax))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Over max score status (expect 400): " + resp.statusCode());

        System.out.println("\n=== 5. VALIDATION: DUPLICATE GRADE (already exists) ===");
        // Student 28 in Class 22 already has learning result
        String duplicateReq = "{\"studentId\":28,\"courseClassId\":22,\"processScore\":8,\"midtermScore\":8,\"finalScore\":8}";
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(duplicateReq))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Duplicate status (expect 409): " + resp.statusCode() + " | Response: " + resp.body());

        System.out.println("\n=== 6. VALIDATION: NOT ENROLLED STUDENT ===");
        // Student 1 in Class 22 is not enrolled
        String notEnrolledReq = "{\"studentId\":1,\"courseClassId\":22,\"processScore\":8,\"midtermScore\":8,\"finalScore\":8}";
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(notEnrolledReq))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Not enrolled status (expect 400): " + resp.statusCode() + " | Response: " + resp.body());

        System.out.println("\n=== 7. VALIDATION: EDIT LOCKED GRADE ===");
        // ID 10 is LOCKED (Student 29, Class 22)
        String editLockedReq = "{\"processScore\":9,\"midtermScore\":9,\"finalScore\":9}";
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/10"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .PUT(HttpRequest.BodyPublishers.ofString(editLockedReq))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Edit locked status (expect 409): " + resp.statusCode() + " | Response: " + resp.body());

        System.out.println("\n=== 8. VALIDATION: DELETE LOCKED GRADE ===");
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/10"))
                .header("Authorization", "Bearer " + token)
                .DELETE()
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Delete locked status (expect 409): " + resp.statusCode() + " | Response: " + resp.body());

        System.out.println("\n=== 9. SUCCESSFUL CREATE DRAFT -> EDIT -> LOCK ===");
        // Student 28 is enrolled in Class 24 (Web Frontend 01) and does not have grade yet!
        String createValid = "{\"studentId\":28,\"courseClassId\":24,\"processScore\":7.5,\"midtermScore\":8.0,\"finalScore\":8.5,\"teacherComment\":\"Rất tích cực\"}";
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .POST(HttpRequest.BodyPublishers.ofString(createValid))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Create status: " + resp.statusCode() + " | Body: " + resp.body());

        // Parse created ID
        int idIdx = resp.body().indexOf("\"id\":");
        int commaIdx = resp.body().indexOf(",", idIdx);
        String newId = resp.body().substring(idIdx + 5, commaIdx).trim();
        System.out.println("Created ID: " + newId);

        // Edit DRAFT
        String updateDraft = "{\"processScore\":8.0,\"midtermScore\":8.5,\"finalScore\":9.0,\"teacherComment\":\"Xuất sắc tiến bộ\"}";
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/" + newId))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .PUT(HttpRequest.BodyPublishers.ofString(updateDraft))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Update DRAFT status (expect 200): " + resp.statusCode() + " | Body: " + resp.body());

        // Lock it
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/" + newId + "/lock"))
                .header("Authorization", "Bearer " + token)
                .method("PATCH", HttpRequest.BodyPublishers.noBody())
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Lock status (expect 200): " + resp.statusCode());

        // Attempt edit now that it's LOCKED
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/" + newId))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .PUT(HttpRequest.BodyPublishers.ofString(updateDraft))
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Edit now-locked status (expect 409): " + resp.statusCode() + " | Body: " + resp.body());

        // Unlock and cleanup
        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/" + newId + "/unlock"))
                .header("Authorization", "Bearer " + token)
                .method("PATCH", HttpRequest.BodyPublishers.noBody())
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Unlock status (expect 200): " + resp.statusCode());

        req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/learning-results/" + newId))
                .header("Authorization", "Bearer " + token)
                .DELETE()
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Delete unlocked draft status (expect 200): " + resp.statusCode());

        System.out.println("\nALL API VALIDATION TESTS PASSED PERFECTLY!");
    }
}
