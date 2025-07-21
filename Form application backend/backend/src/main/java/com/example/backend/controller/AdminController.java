// src/main/java/com/example/backend/controller/AdminController.java
package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.Question;
import com.example.backend.model.Answer;
import com.example.backend.model.Role;
import com.example.backend.model.ERole;
import com.example.backend.model.Form;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.QuestionRepository;
import com.example.backend.repository.AnswerRepository;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.FormRepository;
import com.example.backend.service.FilterService;
import com.example.backend.dto.FilterCriteria;
import com.example.backend.dto.PagedResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
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

    @Autowired
    FormRepository formRepository;

    @Autowired
    FilterService filterService;

    // --- USER MANAGEMENT WITH FILTERING ---

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<User>> getAllUsers(
            @RequestParam Map<String, String> params,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        // Parse filters from request parameters
        List<FilterCriteria> filters = filterService.parseFilters(params);

        // Create pageable with sorting
        Pageable pageable = filterService.createPageable(page, size, sortBy, sortDirection);

        // Get filtered results
        Page<User> userPage = filterService.getFilteredResults(userRepository, filters, pageable);

        return ResponseEntity.ok(new PagedResponse<>(userPage));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
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
                }).orElse(new ResponseEntity<User>(HttpStatus.NOT_FOUND));
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

    // --- FORM MANAGEMENT WITH FILTERING ---

    @GetMapping("/forms")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<Form>> getAllFormsAdmin(
            @RequestParam Map<String, String> params,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        List<FilterCriteria> filters = filterService.parseFilters(params);
        Pageable pageable = filterService.createPageable(page, size, sortBy, sortDirection);
        Page<Form> formPage = filterService.getFilteredResults(formRepository, filters, pageable);

        return ResponseEntity.ok(new PagedResponse<>(formPage));
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
                    Form updatedForm = formRepository.save(form);
                    return ResponseEntity.ok(updatedForm);
                }).orElse(new ResponseEntity<Form>(HttpStatus.NOT_FOUND));
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

    // --- QUESTION MANAGEMENT WITH FILTERING ---

    @GetMapping("/forms/{formId}/questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<Question>> getQuestionsByFormId(
            @PathVariable Long formId,
            @RequestParam Map<String, String> params,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        Optional<Form> formOptional = formRepository.findById(formId);
        if (formOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        // Add form filter to existing filters
        List<FilterCriteria> filters = filterService.parseFilters(params);
        filters.add(new FilterCriteria("form.id", "eq", formId));

        Pageable pageable = filterService.createPageable(page, size, sortBy, sortDirection);
        Page<Question> questionPage = filterService.getFilteredResults(questionRepository, filters, pageable);

        return ResponseEntity.ok(new PagedResponse<>(questionPage));
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

    // --- ANSWER MANAGEMENT WITH FILTERING ---

    @GetMapping("/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<Answer>> getAllAnswers(
            @RequestParam Map<String, String> params,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        List<FilterCriteria> filters = filterService.parseFilters(params);
        Pageable pageable = filterService.createPageable(page, size, sortBy, sortDirection);
        Page<Answer> answerPage = filterService.getFilteredResults(answerRepository, filters, pageable);

        return ResponseEntity.ok(new PagedResponse<>(answerPage));
    }

    @PostMapping("/answers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Answer>> createAnswer(@RequestBody List<Answer> answers) {
        List<Answer> newAnswers = answerRepository.saveAll(answers);
        return ResponseEntity.status(HttpStatus.CREATED).body(newAnswers);
    }

    @PutMapping("/answers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Answer> updateAnswer(@PathVariable Long id, @RequestBody Answer answerDetails) {
        return answerRepository.findById(id)
                .map(answer -> {
                    answer.setResponse(answerDetails.getResponse());
                    Answer updatedAnswer = answerRepository.save(answer);
                    return ResponseEntity.ok(updatedAnswer);
                }).orElse(new ResponseEntity<Answer>(HttpStatus.NOT_FOUND));
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