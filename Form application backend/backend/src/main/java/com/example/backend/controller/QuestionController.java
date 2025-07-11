// src/main/java/com/example/backend/controller/QuestionController.java
package com.example.backend.controller;

import com.example.backend.model.Question;
import com.example.backend.repository.QuestionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/questions")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
public class QuestionController {

    private final QuestionRepository questionRepository;

    public QuestionController(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    /**
     * Endpoint to get a list of all questions.
     * Accessible by 'USER' or 'ADMIN' role.
     * The 'options' field will be included in the returned Question objects.
     * @return ResponseEntity containing a list of Question objects.
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Question>> getAllQuestions() {
        List<Question> questions = questionRepository.findAll();
        return ResponseEntity.ok(questions);
    }

    /**
     * Endpoint to create a new question.
     * Accessible by 'ADMIN' role.
     * The incoming Question object can now include the 'options' field, which will be saved.
     * @param question The Question object to create.
     * @return ResponseEntity containing the created Question object.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        Question savedQuestion = questionRepository.save(question);
        return ResponseEntity.ok(savedQuestion);
    }

    // Additional CRUD operations (e.g., PUT, DELETE) for questions are handled in AdminController
}
