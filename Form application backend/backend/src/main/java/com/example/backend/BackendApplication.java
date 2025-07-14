// src/main/java/com/example/backend/BackendApplication.java
package com.example.backend;

import com.example.backend.model.ERole;
import com.example.backend.model.Role;
import com.example.backend.model.Question;
import com.example.backend.model.User;
import com.example.backend.model.Form;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.QuestionRepository;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.FormRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList; // Explicitly added for clarity, though typically covered by java.util.*
import java.util.List; // Explicitly added for clarity

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
                testUser.setPassword(passwordEncoder.encode("test1234"));
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
    CommandLineRunner initialFormAndQuestionSetup(FormRepository formRepository, QuestionRepository questionRepository) {
        return args -> {
            if (formRepository.count() == 0) {
                // Create Sample Forms
                Form onboardingForm = new Form(null, "Employee Onboarding Survey", "A survey for new employees to gather initial feedback.", new ArrayList<>());
                Form feedbackForm = new Form(null, "Product Feedback Form", "Help us improve our product with your valuable feedback.", new ArrayList<>());

                onboardingForm = formRepository.save(onboardingForm);
                feedbackForm = formRepository.save(feedbackForm);
                System.out.println("Added sample forms to database.");

                // Add questions to Onboarding Form
                questionRepository.save(new Question(null, "What is your full name?", "text", new ArrayList<>(), null, onboardingForm));
                questionRepository.save(new Question(null, "What is your department?", "radio", Arrays.asList("HR", "Engineering", "Marketing", "Sales"), null, onboardingForm));
                questionRepository.save(new Question(null, "Which tools are you familiar with?", "checkbox", Arrays.asList("Jira", "Slack", "Git", "Confluence", "Figma"), 3, onboardingForm));
                System.out.println("Added questions to Onboarding Form.");

                // Add questions to Feedback Form
                questionRepository.save(new Question(null, "Overall, how satisfied are you with our product?", "radio", Arrays.asList("Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"), null, feedbackForm));
                questionRepository.save(new Question(null, "What features would you like to see improved?", "text", new ArrayList<>(), null, feedbackForm));
                System.out.println("Added questions to Feedback Form.");

            } else {
                System.out.println("Sample forms and questions already exist.");
            }
        };
    }
}
