// src/main/java/com/example/backend/controller/QuestionController.java
package com.example.backend.controller;

import com.example.backend.model.Question;
import com.example.backend.repository.QuestionRepository;
import org.springframework.http.ResponseEntity; // Added for ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize; // Added for @PreAuthorize
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions") // <-- CHANGED: Now matches /api/ in axiosInstance

public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')") // <-- ADDED: Now this endpoint is protected
    public ResponseEntity<List<Question>> getAllQuestions() {
        List<Question> questions = questionRepository.findAll();
        // You might want to return 404 if no questions are found, or just an empty list
        return ResponseEntity.ok(questions);
    }

    // Example of adding a new question (only for ADMIN role)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        Question savedQuestion = questionRepository.save(question);
        return ResponseEntity.ok(savedQuestion);
    }

    // You can add other CRUD operations here, with appropriate @PreAuthorize rules
}
