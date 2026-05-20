package com.yo.day1;

import com.yo.day1.config.AppJwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppJwtProperties.class)
public class Day1Application {

    public static void main(String[] args) {
        SpringApplication.run(Day1Application.class, args);
    }

}
