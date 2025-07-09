package com.example.backend.config;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TestUserConfig {

    @Bean
    public CommandLineRunner insertTestUser(UserRepository userRepo) {
        return args -> {
            if (userRepo.findByUsername("test").isEmpty()) {
                User testUser = new User();
                testUser.setUsername("test");
                testUser.setPassword("test");
                userRepo.save(testUser);
            }
        };
    }
}
