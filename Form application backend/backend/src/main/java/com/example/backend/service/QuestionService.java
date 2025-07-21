// src/main/java/com/example/backend/service/QuestionService.java
package com.example.backend.service;

import com.example.backend.model.Question;
import com.example.backend.repository.QuestionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class QuestionService {

    private static final int DEFAULT_PAGE_SIZE = 5;
    private static final int MIN_PAGE_SIZE = 1;
    private static final int MAX_PAGE_SIZE = 100; // Increased for flexibility
    private static final List<Integer> SUGGESTED_SIZES = List.of(5, 10, 15, 20, 25, 50);

    private final QuestionRepository questionRepository;

    public QuestionService(QuestionRepository questionRepository) {
        this.questionRepository = questionRepository;
    }

    /**
     * Get paginated questions for a specific form with flexible validation.
     * @param formId The ID of the form.
     * @param pageNo The page number (0-based).
     * @param questionLimit The number of questions per page (flexible size).
     * @param sortBy The field to sort by.
     * @param sortDirection The sort direction (asc/desc).
     * @return Page of questions.
     */
    public Page<Question> getQuestionsByFormId(Long formId, int pageNo, int questionLimit, String sortBy, String sortDirection) {
        // Validate and adjust page parameters
        pageNo = validatePageNumber(pageNo);
        questionLimit = validatePageSize(questionLimit);

        // Create sort object with validation
        Sort sort = createSort(sortBy, sortDirection);

        // Create pageable object
        Pageable pageable = PageRequest.of(pageNo, questionLimit, sort);

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
     * Advanced pagination method with search functionality.
     * @param formId The ID of the form.
     * @param pageNo The page number (0-based).
     * @param questionLimit The number of questions per page.
     * @param sortBy The field to sort by.
     * @param sortDirection The sort direction.
     * @param searchTerm Optional search term for filtering questions.
     * @return Page of questions matching the criteria.
     */
    public Page<Question> searchQuestionsByFormId(Long formId, int pageNo, int questionLimit,
                                                  String sortBy, String sortDirection, String searchTerm) {
        pageNo = validatePageNumber(pageNo);
        questionLimit = validatePageSize(questionLimit);
        Sort sort = createSort(sortBy, sortDirection);
        Pageable pageable = PageRequest.of(pageNo, questionLimit, sort);

        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            return questionRepository.findByFormIdAndSearchTerm(formId, searchTerm.trim(), pageable);
        } else {
            return questionRepository.findByFormId(formId, pageable);
        }
    }

    /**
     * Validate and adjust page number.
     * @param pageNo The requested page number.
     * @return The validated page number.
     */
    private int validatePageNumber(int pageNo) {
        return Math.max(0, pageNo); // Ensure page number is not negative
    }

    /**
     * Validate and adjust page size with flexible limits.
     * @param questionLimit The requested page size.
     * @return The validated page size.
     */
    private int validatePageSize(int questionLimit) {
        // Ensure minimum size
        if (questionLimit < MIN_PAGE_SIZE) {
            return DEFAULT_PAGE_SIZE;
        }

        // Ensure maximum size
        if (questionLimit > MAX_PAGE_SIZE) {
            return MAX_PAGE_SIZE;
        }

        return questionLimit;
    }

    /**
     * Create a Sort object with validation for sort fields.
     * @param sortBy The field to sort by.
     * @param sortDirection The sort direction.
     * @return Sort object.
     */
    private Sort createSort(String sortBy, String sortDirection) {
        // Validate sort field - only allow safe fields
        String validatedSortBy = validateSortField(sortBy);

        // Validate sort direction
        Sort.Direction direction;
        try {
            direction = Sort.Direction.fromString(sortDirection);
        } catch (IllegalArgumentException e) {
            direction = Sort.Direction.ASC; // Default to ascending
        }

        return Sort.by(direction, validatedSortBy);
    }

    /**
     * Validate sort field to prevent SQL injection and ensure field exists.
     * @param sortBy The requested sort field.
     * @return The validated sort field.
     */
    private String validateSortField(String sortBy) {
        // List of allowed sort fields
        List<String> allowedFields = List.of("id", "questionText", "type", "maxSelections");

        if (sortBy == null || !allowedFields.contains(sortBy)) {
            return "id"; // Default sort field
        }

        return sortBy;
    }

    /**
     * Get pagination configuration for frontend.
     */
    public static class PaginationConfig {
        public static final int DEFAULT_SIZE = DEFAULT_PAGE_SIZE;
        public static final int MIN_SIZE = MIN_PAGE_SIZE;
        public static final int MAX_SIZE = MAX_PAGE_SIZE;
        public static final List<Integer> SUGGESTED_SIZES = QuestionService.SUGGESTED_SIZES;
    }
}