import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestReportsApi {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        String loginBody = "{\"username\":\"admin\",\"password\":\"123456\"}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:8080/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(loginBody))
                .build();
        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        String body = resp.body();
        int tokenIdx = body.indexOf("\"accessToken\":\"");
        String token = body.substring(tokenIdx + 15, body.indexOf("\"", tokenIdx + 15));

        req = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:8080/api/reports/learning/summary?year=2026&month=9"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        System.out.println("Reports learning summary status: " + resp.statusCode());
        System.out.println("Reports response body: " + resp.body());
    }
}
