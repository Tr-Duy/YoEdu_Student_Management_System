import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class Hash {
    public static void main(String[] args) {
        System.out.println("{bcrypt}" + new BCryptPasswordEncoder().encode("123456"));
    }
}
