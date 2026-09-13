import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TestLH347Api {
    private static final String BASE_URL = "http://localhost:8080";
    private static final HttpClient client = HttpClient.newHttpClient();

    public static void main(String[] args) throws Exception {
        String loginBody = "{\"username\":\"admin\",\"password\":\"123456\"}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(loginBody))
                .build();
        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200) {
            System.out.println("Login failed: " + resp.body());
            return;
        }

        String body = resp.body();
        int tokenIdx = body.indexOf("\"accessToken\":\"");
        int endIdx = body.indexOf("\"", tokenIdx + 15);
        String token = body.substring(tokenIdx + 15, endIdx);

        HttpRequest getReq = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/api/course-classes?search=LH347"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> getResp = client.send(getReq, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status: " + getResp.statusCode());
        System.out.println("Body: " + getResp.body());
    }
}
