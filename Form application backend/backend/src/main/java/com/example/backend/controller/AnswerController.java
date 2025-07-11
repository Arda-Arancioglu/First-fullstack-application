// src/main/java/com/example/backend/controller/AnswerController.java
package com.example.backend.controller;

import com.example.backend.model.Answer;
import com.example.backend.model.User; // Import User model
import com.example.backend.model.Question; // Import Question model
import com.example.backend.repository.AnswerRepository;
import com.example.backend.repository.UserRepository; // Import UserRepository
import com.example.backend.repository.QuestionRepository; // Import QuestionRepository
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication; // Import Authentication
import org.springframework.security.core.context.SecurityContextHolder; // Import SecurityContextHolder
import org.springframework.security.core.userdetails.UserDetails; // Import UserDetails
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/answers")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
public class AnswerController {

    private final AnswerRepository answerRepo;
    private final UserRepository userRepository; // Inject UserRepository
    private final QuestionRepository questionRepository; // Inject QuestionRepository

    public AnswerController(AnswerRepository answerRepo, UserRepository userRepository, QuestionRepository questionRepository) {
        this.answerRepo = answerRepo;
        this.userRepository = userRepository;
        this.questionRepository = questionRepository;
    }

    /**
     * Handles submission of answers, performing an upsert (update or insert).
     * For each answer in the list, it checks if the user has already answered that question.
     * If yes, it updates the existing answer; otherwise, it creates a new one.
     * This endpoint requires authentication (USER or ADMIN role).
     * @param answers A list of Answer objects to be saved or updated.
     * @return ResponseEntity containing the list of saved/updated Answer objects.
     */
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Answer>> saveOrUpdateAnswers(@RequestBody List<Answer> answers) {
        List<Answer> savedAnswers = new ArrayList<>();
        for (Answer incomingAnswer : answers) {
            // Ensure User and Question objects are properly linked
            Optional<User> userOptional = userRepository.findById(incomingAnswer.getUser().getId());
            Optional<Question> questionOptional = questionRepository.findById(incomingAnswer.getQuestion().getId());

            if (userOptional.isEmpty() || questionOptional.isEmpty()) {
                return ResponseEntity.badRequest().body(null); // Or handle more specific error
            }

            User user = userOptional.get();
            Question question = questionOptional.get();

            // Check if an answer for this user and question already exists
            Optional<Answer> existingAnswer = answerRepo.findByUser_IdAndQuestion_Id(user.getId(), question.getId());

            if (existingAnswer.isPresent()) {
                // Update existing answer
                Answer answerToUpdate = existingAnswer.get();
                answerToUpdate.setResponse(incomingAnswer.getResponse());
                savedAnswers.add(answerRepo.save(answerToUpdate));
            } else {
                // Create new answer
                incomingAnswer.setUser(user); // Ensure the full User object is set
                incomingAnswer.setQuestion(question); // Ensure the full Question object is set
                savedAnswers.add(answerRepo.save(incomingAnswer));
            }
        }
        return ResponseEntity.ok(savedAnswers);
    }

    /**
     * Fetches all answers for the currently authenticated user.
     * This endpoint requires authentication (USER or ADMIN role).
     * @return A list of Answer objects for the current user.
     */
    @GetMapping("/my-answers") // New endpoint for user-specific answers
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Answer>> getMyAnswers() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }

        // Assuming UserDetailsImpl holds the user ID
        // If your UserDetailsImpl doesn't have getId(), you might need to fetch it from UserRepository by username
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        // Assuming your UserDetailsImpl has a method like getUserId() or username is the ID
        // For simplicity, let's assume username is sufficient to find the user from the repo
        Optional<User> userOptional = userRepository.findByUsername(userDetails.getUsername());

        if (userOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        List<Answer> userAnswers = answerRepo.findByUser_Id(userOptional.get().getId());
        return ResponseEntity.ok(userAnswers);
    }

    // Existing getAll endpoint (can be kept for admin or removed if not needed)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')") // Restrict this endpoint to ADMIN only for full list
    public ResponseEntity<List<Answer>> getAll() {
        List<Answer> allAnswers = answerRepo.findAll();
        return ResponseEntity.ok(allAnswers);
    }
}
