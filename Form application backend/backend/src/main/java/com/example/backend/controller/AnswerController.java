// src/main/java/com/example/backend/controller/AnswerController.java
package com.example.backend.controller;

import com.example.backend.model.Answer;
import com.example.backend.repository.AnswerRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // Added for @PreAuthorize
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answers") // <-- CHANGED: Now matches /api/ in axiosInstance
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600) // <-- Changed to specific origin, added maxAge
public class AnswerController {

    private final AnswerRepository answerRepo;

    public AnswerController(AnswerRepository answerRepo) {
        this.answerRepo = answerRepo;
    }

    /**
     * Saves a batch of answers from the React frontend.
     * This endpoint requires authentication (USER or ADMIN role).
     * @param answers A list of Answer objects to be saved.
     * @return ResponseEntity containing the list of saved Answer objects.
     */
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')") // <-- ADDED: Protects this endpoint
    public ResponseEntity<List<Answer>> saveAll(@RequestBody List<Answer> answers) {
        List<Answer> saved = answerRepo.saveAll(answers);
        return ResponseEntity.ok(saved);
    }

    /**
     * Fetches all answers (optional: to inspect via REST).
     * This endpoint requires authentication (USER or ADMIN role).
     * You might want to restrict this to only ADMINs in a production environment.
     * @return A list of all Answer objects.
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')") // <-- ADDED: Protects this endpoint
    public List<Answer> getAll() {
        return answerRepo.findAll();
    }
}
