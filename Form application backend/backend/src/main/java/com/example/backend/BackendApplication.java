// src/main/java/com/example/backend/BackendApplication.java
package com.example.backend;

import com.example.backend.model.ERole;
import com.example.backend.model.Role;
import com.example.backend.model.Question;
import com.example.backend.model.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.QuestionRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    @Bean
    @Order(1) // Ensure roles and basic users are set up first
    public CommandLineRunner initialUserAndRoleSetup(RoleRepository roleRepository,
                                                     UserRepository userRepository,
                                                     PasswordEncoder passwordEncoder) {
        return args -> {
            Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                    .orElseGet(() -> roleRepository.save(new Role(null, ERole.ROLE_USER)));
            System.out.println("Ensured ROLE_USER exists.");

            Role adminRole = roleRepository.findByName(ERole.ROLE_ADMIN)
                    .orElseGet(() -> roleRepository.save(new Role(null, ERole.ROLE_ADMIN)));
            System.out.println("Ensured ROLE_ADMIN exists.");

            if (userRepository.findByUsername("test").isEmpty()) {
                User testUser = new User();
                testUser.setUsername("test");
                testUser.setPassword(passwordEncoder.encode("test"));
                Set<Role> roles = new HashSet<>();
                roles.add(userRole);
                testUser.setRoles(roles);
                userRepository.save(testUser);
                System.out.println("Test user 'test' inserted with hashed password and ROLE_USER.");
            } else {
                System.out.println("Test user 'test' already exists.");
            }

            if (userRepository.findByUsername("admin").isEmpty()) {
                User adminUser = new User();
                adminUser.setUsername("admin");
                adminUser.setPassword(passwordEncoder.encode("admin1234"));
                Set<Role> roles = new HashSet<>();
                roles.add(adminRole);
                roles.add(userRole); // Admins usually also have user role for general access
                adminUser.setRoles(roles);
                userRepository.save(adminUser);
                System.out.println("Admin user 'admin' inserted with hashed password and ROLE_ADMIN, ROLE_USER.");
            } else {
                System.out.println("Admin user 'admin' already exists.");
            }
        };
    }

    @Bean
    @Order(2) // Run after user/role setup
    CommandLineRunner initialQuestionSetup(QuestionRepository questionRepository) {
        return args -> {
            if (questionRepository.count() == 0) {
                questionRepository.save(new Question(null, "What is your favorite color?", "text", Arrays.asList(), null)); // Text question, no options, no max selections
                questionRepository.save(new Question(null, "What is your gender?", "radio", Arrays.asList("Male", "Female", "Other", "Prefer not to say"), null)); // Radio question with options, no max selections
                // NEW: Checkbox question with options and maxSelections
                questionRepository.save(new Question(null, "Which programming languages do you know?", "checkbox", Arrays.asList("Java", "Python", "JavaScript", "C#", "Go", "Rust"), 3)); // Max 3 selections
                questionRepository.save(new Question(null, "How many years of experience do you have?", "text", Arrays.asList(), null)); // Text question, no options, no max selections
                System.out.println("Added sample questions to database.");
            } else {
                System.out.println("Sample questions already exist.");
            }
        };
    }
}
