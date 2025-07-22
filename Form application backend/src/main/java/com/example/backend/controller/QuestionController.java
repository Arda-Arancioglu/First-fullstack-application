// src/main/java/com/example/backend/controller/QuestionController.java
package com.example.backend.controller;

import com.example.backend.dto.PagedResponse;
import com.example.backend.model.Form;
import com.example.backend.model.Question;
import com.example.backend.repository.FormRepository;
import com.example.backend.service.QuestionService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/forms/{formId}/questions")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
public class QuestionController {

    private final QuestionService questionService;
    private final FormRepository formRepository;

    public QuestionController(QuestionService questionService, FormRepository formRepository) {
        this.questionService = questionService;
        this.formRepository = formRepository;
    }

    /**
     * Endpoint to get pagination options available for questions.
     * Updated to reflect more flexible pagination approach.
     * @return ResponseEntity containing pagination configuration.
     */
    @GetMapping("/pagination-options")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPaginationOptions() {
        Map<String, Object> options = new HashMap<>();
        options.put("defaultSize", 5);
        options.put("minSize", 1);
        options.put("maxSize", 100); // Increased max size for flexibility
        options.put("suggestedSizes", List.of(5, 10, 15, 20, 25, 50)); // Suggested common sizes
        return ResponseEntity.ok(options);
    }

    /**
     * Endpoint to get a paginated list of questions for a specific form.
     * Updated with flexible pagination parameters.
     * Accessible by 'USER' or 'ADMIN' role.
     * @param formId The ID of the form.
     * @param pageNo The page number (0-based, renamed for clarity).
     * @param questionLimit The number of questions per page (flexible size).
     * @param sortBy The field to sort by.
     * @param sortDirection The sort direction (asc/desc).
     * @return ResponseEntity containing a paginated response of Question objects.
     */
    @GetMapping("/paginated")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<Question>> getQuestionsByFormIdPaginated(
            @PathVariable Long formId,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "5") int questionLimit,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        Optional<Form> formOptional = formRepository.findById(formId);
        if (formOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Form not found
        }

        Page<Question> questionsPage = questionService.getQuestionsByFormId(
                formId, pageNo, questionLimit, sortBy, sortDirection);
        PagedResponse<Question> response = new PagedResponse<>(questionsPage);
        return ResponseEntity.ok(response);
    }

    /**
     * Alternative endpoint with more intuitive parameter names.
     * Example: /api/forms/1/questions/page?pageNo=1&questionLimit=10
     */
    @GetMapping("/page")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<PagedResponse<Question>> getQuestionsPage(
            @PathVariable Long formId,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "5") int questionLimit,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDirection) {

        Optional<Form> formOptional = formRepository.findById(formId);
        if (formOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        Page<Question> questionsPage = questionService.getQuestionsByFormId(
                formId, pageNo, questionLimit, sortBy, sortDirection);
        PagedResponse<Question> response = new PagedResponse<>(questionsPage);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint to get a list of all questions for a specific form (original method kept for backward compatibility).
     * Accessible by 'USER' or 'ADMIN' role.
     * @param formId The ID of the form.
     * @return ResponseEntity containing a list of Question objects.
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<List<Question>> getQuestionsByFormId(@PathVariable Long formId) {
        Optional<Form> formOptional = formRepository.findById(formId);
        if (formOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Form not found
        }
        List<Question> questions = questionService.getAllQuestionsByFormId(formId);
        return ResponseEntity.ok(questions);
    }

    /**
     * Endpoint to create a new question for a specific form.
     * Accessible by 'ADMIN' role.
     * @param formId The ID of the form to associate the question with.
     * @param question The Question object to create.
     * @return ResponseEntity containing the created Question object.
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> createQuestionForForm(@PathVariable Long formId, @RequestBody Question question) {
        Optional<Form> formOptional = formRepository.findById(formId);
        if (formOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Form not found
        }
        question.setForm(formOptional.get()); // Associate the question with the found form
        Question savedQuestion = questionService.saveQuestion(question);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedQuestion);
    }

    /**
     * Endpoint to get a single question by its ID within a specific form.
     * @param formId The ID of the form.
     * @param questionId The ID of the question.
     * @return The question if found and belongs to the form, or 404.
     */
    @GetMapping("/{questionId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Question> getQuestionByIdAndFormId(@PathVariable Long formId, @PathVariable Long questionId) {
        Optional<Question> questionOptional = questionService.getQuestionById(questionId);
        if (questionOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Question question = questionOptional.get();
        if (question.getForm() == null || !question.getForm().getId().equals(formId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Question does not belong to this form
        }
        return ResponseEntity.ok(question);
    }

    /**
     * Endpoint to update an existing question within a specific form.
     * Accessible by 'ADMIN' role.
     * @param formId The ID of the form.
     * @param questionId The ID of the question to update.
     * @param questionDetails The updated question details.
     * @return The updated question.
     */
    @PutMapping("/{questionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Question> updateQuestionForForm(@PathVariable Long formId, @PathVariable Long questionId, @RequestBody Question questionDetails) {
        Optional<Question> questionOptional = questionService.getQuestionById(questionId);
        if (questionOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Question question = questionOptional.get();
        if (question.getForm() == null || !question.getForm().getId().equals(formId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Question does not belong to this form
        }

        // Update fields
        question.setQuestionText(questionDetails.getQuestionText());
        question.setType(questionDetails.getType());
        question.setOptions(questionDetails.getOptions());
        question.setMaxSelections(questionDetails.getMaxSelections());

        Question updatedQuestion = questionService.saveQuestion(question);
        return ResponseEntity.ok(updatedQuestion);
    }

    /**
     * Endpoint to delete a question within a specific form.
     * Accessible by 'ADMIN' role.
     * @param formId The ID of the form.
     * @param questionId The ID of the question to delete.
     * @return 204 No Content if successful, 404 Not Found otherwise.
     */
    @DeleteMapping("/{questionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<HttpStatus> deleteQuestionFromForm(@PathVariable Long formId, @PathVariable Long questionId) {
        Optional<Question> questionOptional = questionService.getQuestionById(questionId);
        if (questionOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Question question = questionOptional.get();
        if (question.getForm() == null || !question.getForm().getId().equals(formId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Question does not belong to this form
        }
        questionService.deleteQuestion(questionId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}