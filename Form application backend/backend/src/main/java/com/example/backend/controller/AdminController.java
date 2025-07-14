// src/main/java/com/example/backend/controller/AdminController.java
package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.Question;
import com.example.backend.model.Answer;
import com.example.backend.model.Role;
import com.example.backend.model.ERole;
import com.example.backend.model.Form; // Import Form
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.QuestionRepository;
import com.example.backend.repository.AnswerRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.FormRepository; // Import FormRepository
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
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

    @Autowired // Autowire FormRepository
    FormRepository formRepository;

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
            // Using ResponseEntity with a specific message for better client handling
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null); // Or a custom error object
        }
        // NEW: Add check for password being null or empty
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            return new ResponseEntity("Password cannot be empty!", HttpStatus.BAD_REQUEST);
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
                }).orElse(new ResponseEntity<User>(HttpStatus.NOT_FOUND)); // FIX: Explicitly type ResponseEntity
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

    // --- FORM MANAGEMENT (Admin specific CRUD) ---

    @GetMapping("/forms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Form>> getAllFormsAdmin() { // Renamed to avoid conflict with FormController
        List<Form> forms = formRepository.findAll();
        return ResponseEntity.ok(forms);
    }

    @PostMapping("/forms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Form> createForm(@RequestBody Form form) {
        if (form.getTitle() == null || form.getTitle().trim().isEmpty()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        if (formRepository.findByTitle(form.getTitle()).isPresent()) {
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }
        Form newForm = formRepository.save(form);
        return ResponseEntity.status(HttpStatus.CREATED).body(newForm);
    }

    @PutMapping("/forms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Form> updateForm(@PathVariable Long id, @RequestBody Form formDetails) {
        return formRepository.findById(id)
                .map(form -> {
                    form.setTitle(formDetails.getTitle());
                    form.setDescription(formDetails.getDescription());
                    // Note: Questions are managed via separate endpoints for a specific form
                    Form updatedForm = formRepository.save(form);
                    return ResponseEntity.ok(updatedForm);
                }).orElse(new ResponseEntity<Form>(HttpStatus.NOT_FOUND)); // FIX: Explicitly type ResponseEntity
    }

    @DeleteMapping("/forms/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteForm(@PathVariable Long id) {
        if (!formRepository.existsById(id)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        formRepository.deleteById(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // --- QUESTION MANAGEMENT (UPDATED TO BE FORM-SPECIFIC) ---

    @GetMapping("/forms/{formId}/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Question>> getQuestionsByFormId(@PathVariable Long formId) {
        Optional<Form> formOptional = formRepository.findById(formId);
        if (formOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        List<Question> questions = questionRepository.findByFormId(formId);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/forms/{formId}/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> createQuestionForForm(@PathVariable Long formId, @RequestBody Question question) {
        Optional<Form> formOptional = formRepository.findById(formId);
        if (formOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        question.setForm(formOptional.get());
        Question newQuestion = questionRepository.save(question);
        return ResponseEntity.status(HttpStatus.CREATED).body(newQuestion);
    }

    @PutMapping("/forms/{formId}/questions/{questionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> updateQuestionForForm(@PathVariable Long formId, @PathVariable Long questionId, @RequestBody Question questionDetails) {
        Optional<Question> questionOptional = questionRepository.findById(questionId);
        if (questionOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Question question = questionOptional.get();
        if (question.getForm() == null || !question.getForm().getId().equals(formId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        question.setQuestionText(questionDetails.getQuestionText());
        question.setType(questionDetails.getType());
        question.setOptions(questionDetails.getOptions());
        question.setMaxSelections(questionDetails.getMaxSelections());

        Question updatedQuestion = questionRepository.save(question);
        return ResponseEntity.ok(updatedQuestion);
    }

    @DeleteMapping("/forms/{formId}/questions/{questionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteQuestionFromForm(@PathVariable Long formId, @PathVariable Long questionId) {
        Optional<Question> questionOptional = questionRepository.findById(questionId);
        if (questionOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Question question = questionOptional.get();
        if (question.getForm() == null || !question.getForm().getId().equals(formId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        questionRepository.deleteById(questionId);
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
    public ResponseEntity<List<Answer>> createAnswer(@RequestBody List<Answer> answers) { // Changed to List<Answer>
        List<Answer> newAnswers = answerRepository.saveAll(answers); // Save all
        return ResponseEntity.status(HttpStatus.CREATED).body(newAnswers);
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
                }).orElse(new ResponseEntity<Answer>(HttpStatus.NOT_FOUND)); // FIX: Explicitly type ResponseEntity
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
