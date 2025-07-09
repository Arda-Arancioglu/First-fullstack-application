package com.example.backend.config;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder; // NEW IMPORT: Required to inject PasswordEncoder

@Configuration
public class TestUserConfig {

    // Inject PasswordEncoder into the CommandLineRunner bean
    @Bean
    public CommandLineRunner insertTestUser(UserRepository userRepo, PasswordEncoder passwordEncoder) {
        return args -> {
            // Only insert if the user 'test' does not already exist
            if (userRepo.findByUsername("test").isEmpty()) {
                User testUser = new User();
                testUser.setUsername("test");
                // *** CRITICAL CHANGE: Encode the password before saving ***
                testUser.setPassword(passwordEncoder.encode("test")); // Hash "test" before storing
                userRepo.save(testUser);
                System.out.println("Test user 'test' inserted with hashed password.");
            } else {
                System.out.println("Test user 'test' already exists.");
            }
        };
    }
}