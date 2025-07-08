package com.example.backend;

import com.example.backend.model.Question;
import com.example.backend.repository.QuestionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }

    // This runs when the app starts and inserts sample data into the DB
    @Bean
    CommandLineRunner runner(QuestionRepository repo) {
        return args -> {
            repo.save(new Question(null, "What is your name?", "text"));
            repo.save(new Question(null, "What is your gender?", "radio"));
        };
    }
}
