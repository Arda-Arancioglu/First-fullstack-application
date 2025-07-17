// src/main/java/com/example/backend/service/QuestionService.java
package com.example.backend.service;

import com.example.backend.model.Question;
import com.example.backend.repository.QuestionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {

    private static final int DEFAULT_PAGE_SIZE = 5;
    private static final int MAX_PAGE_SIZE = 20;
    private static final List<Integer> ALLOWED_SIZES = Arrays.asList(5, 10, 15, 20);

    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    /**
     * Get paginated questions for a specific form with validation.
     * @param formId The ID of the form.
     * @param page The page number (0-based).
     * @param size The number of items per page.
     * @param sortBy The field to sort by.
     * @param sortDirection The sort direction (asc/desc).
     * @return Page of questions.
     */
    public Page<Question> getQuestionsByFormId(Long formId, int page, int size, String sortBy, String sortDirection) {
        // Validate and adjust page size
        size = validatePageSize(size);

        // Create sort object
        Sort sort = Sort.by(Sort.Direction.fromString(sortDirection), sortBy);

        // Create pageable object
        Pageable pageable = PageRequest.of(page, size, sort);

        // Return paginated results
        return questionRepository.findByFormId(formId, pageable);
    }

    /**
     * Get all questions for a specific form (non-paginated).
     * @param formId The ID of the form.
     * @return List of questions.
     */
    public List<Question> getAllQuestionsByFormId(Long formId) {
        return questionRepository.findByFormId(formId);
    }

    /**
     * Get a single question by ID.
     * @param questionId The ID of the question.
     * @return Optional containing the question if found.
     */
    public Optional<Question> getQuestionById(Long questionId) {
        return questionRepository.findById(questionId);
    }

    /**
     * Save a question (create or update).
     * @param question The question to save.
     * @return The saved question.
     */
    public Question saveQuestion(Question question) {
        return questionRepository.save(question);
    }

    /**
     * Delete a question by ID.
     * @param questionId The ID of the question to delete.
     */
    public void deleteQuestion(Long questionId) {
        questionRepository.deleteById(questionId);
    }

    /**
     * Validate and adjust page size according to business rules.
     * @param size The requested page size.
     * @return The validated page size.
     */
    private int validatePageSize(int size) {
        // If size is not in allowed sizes, use default
        if (!ALLOWED_SIZES.contains(size)) {
            return DEFAULT_PAGE_SIZE;
        }

        // Additional validation: ensure it's not negative or zero
        if (size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }

        // Ensure it doesn't exceed maximum
        if (size > MAX_PAGE_SIZE) {
            return MAX_PAGE_SIZE;
        }

        return size;
    }

    /**
     * Get pagination configuration for frontend.
     * @return Map containing pagination settings.
     */
    public static class PaginationConfig {
        public static final int DEFAULT_SIZE = DEFAULT_PAGE_SIZE;
        public static final int MAX_SIZE = MAX_PAGE_SIZE;
        public static final List<Integer> ALLOWED_SIZES = QuestionService.ALLOWED_SIZES;
    }
}