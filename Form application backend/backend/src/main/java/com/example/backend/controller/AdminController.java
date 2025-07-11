// src/main/java/com/example/backend/controller/AdminController.java
package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.Question;
import com.example.backend.model.Answer;
import com.example.backend.model.Role;
import com.example.backend.model.ERole;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.QuestionRepository;
import com.example.backend.repository.AnswerRepository;
import com.example.backend.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin") // Base path for admin-specific endpoints
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600) // Allow CORS from your React app
public class AdminController {

    @Autowired
    UserRepository userRepository;

    @Autowired
    QuestionRepository questionRepository;

    @Autowired
    AnswerRepository answerRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    // --- USER MANAGEMENT ---

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return new ResponseEntity("Username is already taken!", HttpStatus.BAD_REQUEST);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        Set<Role> roles = new HashSet<>();
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            roleRepository.findByName(ERole.ROLE_USER).ifPresent(roles::add);
        } else {
            user.getRoles().forEach(role -> {
                if (role.getName() != null) {
                    switch (role.getName()) {
                        case ROLE_ADMIN:
                            roleRepository.findByName(ERole.ROLE_ADMIN).ifPresent(roles::add);
                            break;
                        case ROLE_USER:
                            roleRepository.findByName(ERole.ROLE_USER).ifPresent(roles::add);
                            break;
                        default:
                            roleRepository.findByName(ERole.ROLE_USER).ifPresent(roles::add);
                    }
                }
            });
        }
        user.setRoles(roles);
        User newUser = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(userDetails.getUsername());
                    if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                        user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
                    }

                    Set<Role> newRoles = new HashSet<>();
                    if (userDetails.getRoles() != null && !userDetails.getRoles().isEmpty()) {
                        userDetails.getRoles().forEach(role -> {
                            if (role.getName() != null) {
                                roleRepository.findByName(role.getName()).ifPresent(newRoles::add);
                            }
                        });
                    } else {
                        roleRepository.findByName(ERole.ROLE_USER).ifPresent(newRoles::add);
                    }
                    user.setRoles(newRoles);

                    User updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(updatedUser);
                }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        userRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // --- QUESTION MANAGEMENT ---

    @GetMapping("/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Question>> getAllQuestions() {
        List<Question> questions = questionRepository.findAll();
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        // The incoming Question object can now include 'options' and 'maxSelections'
        Question newQuestion = questionRepository.save(question);
        return ResponseEntity.status(HttpStatus.CREATED).body(newQuestion);
    }

    @PutMapping("/questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody Question questionDetails) {
        return questionRepository.findById(id)
                .map(question -> {
                    question.setQuestionText(questionDetails.getQuestionText());
                    question.setType(questionDetails.getType());
                    question.setOptions(questionDetails.getOptions());
                    question.setMaxSelections(questionDetails.getMaxSelections()); // NEW: Update maxSelections
                    Question updatedQuestion = questionRepository.save(question);
                    return ResponseEntity.ok(updatedQuestion);
                }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteQuestion(@PathVariable Long id) {
        if (!questionRepository.existsById(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        questionRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // --- ANSWER MANAGEMENT ---

    @GetMapping("/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Answer>> getAllAnswers() {
        List<Answer> answers = answerRepository.findAll();
        return ResponseEntity.ok(answers);
    }

    @PostMapping("/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Answer> createAnswer(@RequestBody Answer answer) {
        Answer newAnswer = answerRepository.save(answer);
        return ResponseEntity.status(HttpStatus.CREATED).body(newAnswer);
    }

    @PutMapping("/answers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Answer> updateAnswer(@PathVariable Long id, @RequestBody Answer answerDetails) {
        return answerRepository.findById(id)
                .map(answer -> {
                    answer.setResponse(answerDetails.getResponse());
                    // You might need to handle updating question and user references if they are part of answerDetails
                    Answer updatedAnswer = answerRepository.save(answer);
                    return ResponseEntity.ok(updatedAnswer);
                }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @DeleteMapping("/answers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteAnswer(@PathVariable Long id) {
        if (!answerRepository.existsById(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        answerRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
