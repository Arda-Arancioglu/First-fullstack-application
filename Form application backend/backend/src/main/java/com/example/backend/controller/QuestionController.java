// src/main/java/com/example/backend/controller/QuestionController.java
package com.example.backend.controller;

import com.example.backend.model.Form;
import com.example.backend.model.Question;
import com.example.backend.repository.FormRepository;
import com.example.backend.repository.QuestionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
// Changed base path to reflect questions being nested under forms
@RequestMapping("/api/forms/{formId}/questions")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600)
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final FormRepository formRepository; // NEW: Inject FormRepository

    public QuestionController(QuestionRepository questionRepository, FormRepository formRepository) {
        this.questionRepository = questionRepository;
        this.formRepository = formRepository;
    }

    /**
     * Endpoint to get a list of all questions for a specific form.
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
        // Assuming QuestionRepository has findByFormId method (will add in next step)
        List<Question> questions = questionRepository.findByFormId(formId);
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
        Question savedQuestion = questionRepository.save(question);
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
        Optional<Question> questionOptional = questionRepository.findById(questionId);
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
        Optional<Question> questionOptional = questionRepository.findById(questionId);
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

        Question updatedQuestion = questionRepository.save(question);
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
        Optional<Question> questionOptional = questionRepository.findById(questionId);
        if (questionOptional.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        Question question = questionOptional.get();
        if (question.getForm() == null || !question.getForm().getId().equals(formId)) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND); // Question does not belong to this form
        }
        questionRepository.deleteById(questionId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
