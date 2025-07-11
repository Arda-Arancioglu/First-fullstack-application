// src/main/java/com/example/backend/controller/AdminController.java
package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.Question;
import com.example.backend.model.Answer;
import com.example.backend.model.Role; // Import Role for user updates
import com.example.backend.model.ERole; // Import ERole for role management
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.QuestionRepository;
import com.example.backend.repository.AnswerRepository;
import com.example.backend.repository.RoleRepository; // Import RoleRepository for role updates
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder; // Import PasswordEncoder for user creation/update
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
    RoleRepository roleRepository; // Inject RoleRepository for role management

    @Autowired
    PasswordEncoder passwordEncoder; // Inject PasswordEncoder for user password handling

    // --- USER MANAGEMENT ---

    /**
     * Endpoint to get a list of all users in the system.
     * Accessible by 'ADMIN' role.
     * @return ResponseEntity containing a list of User objects.
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * Endpoint to create a new user.
     * Accessible by 'ADMIN' role.
     * @param user The User object to create.
     * @return ResponseEntity containing the created User object.
     */
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return new ResponseEntity("Username is already taken!", HttpStatus.BAD_REQUEST);
        }
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Encode password
        Set<Role> roles = new HashSet<>();
        // Default to USER role if no roles are specified or invalid roles are provided
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
                            roleRepository.findByName(ERole.ROLE_USER).ifPresent(roles::add); // Fallback
                    }
                }
            });
        }
        user.setRoles(roles);
        User newUser = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(newUser);
    }

    /**
     * Endpoint to update an existing user.
     * Accessible by 'ADMIN' role.
     * @param id The ID of the user to update.
     * @param userDetails The updated User object.
     * @return ResponseEntity containing the updated User object.
     */
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(userDetails.getUsername());
                    // Only update password if a new one is provided
                    if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                        user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
                    }

                    // Update roles
                    Set<Role> newRoles = new HashSet<>();
                    if (userDetails.getRoles() != null && !userDetails.getRoles().isEmpty()) {
                        userDetails.getRoles().forEach(role -> {
                            if (role.getName() != null) {
                                roleRepository.findByName(role.getName()).ifPresent(newRoles::add);
                            }
                        });
                    } else {
                        // If no roles provided, default to USER role
                        roleRepository.findByName(ERole.ROLE_USER).ifPresent(newRoles::add);
                    }
                    user.setRoles(newRoles);

                    User updatedUser = userRepository.save(user);
                    return ResponseEntity.ok(updatedUser);
                }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Endpoint to delete a user.
     * Accessible by 'ADMIN' role.
     * @param id The ID of the user to delete.
     * @return ResponseEntity indicating success or failure.
     */
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

    /**
     * Endpoint to get a list of all questions.
     * Accessible by 'ADMIN' role.
     * @return ResponseEntity containing a list of Question objects.
     */
    @GetMapping("/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Question>> getAllQuestions() {
        List<Question> questions = questionRepository.findAll();
        return ResponseEntity.ok(questions);
    }

    /**
     * Endpoint to create a new question.
     * Accessible by 'ADMIN' role.
     * @param question The Question object to create.
     * @return ResponseEntity containing the created Question object.
     */
    @PostMapping("/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> createQuestion(@RequestBody Question question) {
        Question newQuestion = questionRepository.save(question);
        return ResponseEntity.status(HttpStatus.CREATED).body(newQuestion);
    }

    /**
     * Endpoint to update an existing question.
     * Accessible by 'ADMIN' role.
     * @param id The ID of the question to update.
     * @param questionDetails The updated Question object.
     * @return ResponseEntity containing the updated Question object.
     */
    @PutMapping("/questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> updateQuestion(@PathVariable Long id, @RequestBody Question questionDetails) {
        return questionRepository.findById(id)
                .map(question -> {
                    question.setQuestionText(questionDetails.getQuestionText());
                    question.setType(questionDetails.getType());
                    Question updatedQuestion = questionRepository.save(question);
                    return ResponseEntity.ok(updatedQuestion);
                }).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    /**
     * Endpoint to delete a question.
     * Accessible by 'ADMIN' role.
     * @param id The ID of the question to delete.
     * @return ResponseEntity indicating success or failure.
     */
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

    /**
     * Endpoint to get a list of all answers.
     * Accessible by 'ADMIN' role.
     * @return ResponseEntity containing a list of Answer objects.
     */
    @GetMapping("/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Answer>> getAllAnswers() {
        List<Answer> answers = answerRepository.findAll();
        return ResponseEntity.ok(answers);
    }

    /**
     * Endpoint to create a new answer.
     * Accessible by 'ADMIN' role.
     * Note: Creating answers directly via admin panel might be unusual,
     * as answers are typically linked to user submissions.
     * @param answer The Answer object to create.
     * @return ResponseEntity containing the created Answer object.
     */
    @PostMapping("/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Answer> createAnswer(@RequestBody Answer answer) {
        // Ensure question and user exist if linked
        // For simplicity, assuming question and user IDs are valid in the request body
        Answer newAnswer = answerRepository.save(answer);
        return ResponseEntity.status(HttpStatus.CREATED).body(newAnswer);
    }

    /**
     * Endpoint to update an existing answer.
     * Accessible by 'ADMIN' role.
     * @param id The ID of the answer to update.
     * @param answerDetails The updated Answer object.
     * @return ResponseEntity containing the updated Answer object.
     */
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

    /**
     * Endpoint to delete an answer.
     * Accessible by 'ADMIN' role.
     * @param id The ID of the answer to delete.
     * @return ResponseEntity indicating success or failure.
     */
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
