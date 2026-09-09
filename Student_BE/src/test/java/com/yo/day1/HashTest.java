package com.yo.day1;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashTest {
    @Test
    public void printHash() {
        System.out.println("MYHASH={bcrypt}" + new BCryptPasswordEncoder().encode("123456"));
    }
}
