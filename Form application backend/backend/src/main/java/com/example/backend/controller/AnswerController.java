// src/main/java/com/example/backend/controller/AnswerController.java
package com.example.backend.controller;

import com.example.backend.model.Answer;
import com.example.backend.repository.AnswerRepository;
import com.example.backend.security.services.UserDetailsImpl; // Import UserDetailsImpl
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication; // Import Authentication
import org.springframework.security.core.context.SecurityContextHolder; // Import SecurityContextHolder
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/answers") // Consistent with /api/ in axiosInstance
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600) // Specific origin for security
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
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
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
    @GetMapping // This endpoint still fetches ALL answers
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public List<Answer> getAll() {
        return answerRepo.findAll();
    }

    /**
     * Fetches all answers for the currently authenticated user.
     * This endpoint requires authentication (USER or ADMIN role).
     * It extracts the user ID from the security context.
     * @return ResponseEntity containing a list of Answer objects belonging to the current user.
     */
    @GetMapping("/my-answers") // New endpoint path for user-specific answers
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Answer>> getMyAnswers() {
        // Get the authenticated user's details from the SecurityContextHolder
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Long userId = userDetails.getId(); // Assuming UserDetailsImpl has a getId() method

        // Fetch answers by the authenticated user's ID
        List<Answer> userAnswers = answerRepo.findByUserId(userId);
        return ResponseEntity.ok(userAnswers);
    }
}
