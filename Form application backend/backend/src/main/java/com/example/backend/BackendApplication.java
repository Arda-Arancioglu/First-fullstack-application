// src/main/java/com/example/backend/BackendApplication.java
package com.example.backend;

import com.example.backend.model.ERole;
import com.example.backend.model.Role;
import com.example.backend.model.Question;
import com.example.backend.model.User; // NEW IMPORT for User model
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.QuestionRepository;
import com.example.backend.repository.UserRepository; // NEW IMPORT for UserRepository
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder; // NEW IMPORT for PasswordEncoder

import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    /**
     * CommandLineRunner to pre-populate roles and a test user in the database.
     * This runs first to ensure roles are available before user creation.
     *
     * @param roleRepository The repository for Role entities.
     * @param userRepository The repository for User entities.
     * @param passwordEncoder The PasswordEncoder to hash the test user's password.
     * @return A CommandLineRunner instance.
     */
    @Bean
    @Order(1) // This CommandLineRunner will run first
    public CommandLineRunner initialDataSetup(RoleRepository roleRepository,
                                              UserRepository userRepository,
                                              PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Ensure Roles Exist First
            Role userRole = null;
            Role adminRole = null;

            if (roleRepository.findByName(ERole.ROLE_USER).isEmpty()) {
                userRole = roleRepository.save(new Role(null, ERole.ROLE_USER));
                System.out.println("Added ROLE_USER to database.");
            } else {
                userRole = roleRepository.findByName(ERole.ROLE_USER).get();
            }

            if (roleRepository.findByName(ERole.ROLE_ADMIN).isEmpty()) {
                adminRole = roleRepository.save(new Role(null, ERole.ROLE_ADMIN));
                System.out.println("Added ROLE_ADMIN to database.");
            } else {
                adminRole = roleRepository.findByName(ERole.ROLE_ADMIN).get();
            }

            // 2. Create Test User (only if not already present)
            if (userRepository.findByUsername("test").isEmpty()) {
                User testUser = new User();
                testUser.setUsername("test");
                testUser.setPassword(passwordEncoder.encode("test")); // Hash "test" before storing

                Set<Role> roles = new HashSet<>();
                if (userRole != null) { // Ensure userRole was found/created
                    roles.add(userRole);
                }
                testUser.setRoles(roles);

                userRepository.save(testUser);
                System.out.println("Test user 'test' inserted with hashed password and ROLE_USER.");
            } else {
                System.out.println("Test user 'test' already exists.");
            }
        };
    }

    /**
     * CommandLineRunner to insert sample question data into the database.
     * This runs after roles and test user are ensured to be present.
     *
     * @param questionRepository The repository for Question entities.
     * @return A CommandLineRunner instance.
     */
    @Bean
    @Order(2) // This CommandLineRunner will run second
    CommandLineRunner runner(QuestionRepository questionRepository) {
        return args -> {
            if (questionRepository.count() == 0) {
                questionRepository.save(new Question(null, "What is your name?", "text"));
                questionRepository.save(new Question(null, "What is your gender?", "radio"));
                System.out.println("Added sample questions to database.");
            } else {
                System.out.println("Sample questions already exist.");
            }
        };
    }
}
