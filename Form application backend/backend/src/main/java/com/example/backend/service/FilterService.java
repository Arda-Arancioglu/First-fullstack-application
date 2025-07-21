// src/main/java/com/example/backend/service/FilterService.java
package com.example.backend.service;

import com.example.backend.dto.FilterCriteria;
import com.example.backend.specification.GenericSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for handling filtering, sorting, and pagination
 */
@Service
public class FilterService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;
    private static final List<Integer> ALLOWED_PAGE_SIZES = Arrays.asList(5, 10, 15, 20, 25, 50, 100);

    /**
     * Parse filter parameters from request parameters
     * Expected format: field_operation=value
     * Examples:
     * - username_eq=john
     * - id_gt=5
     * - title_contains=test
     * - created_between=2023-01-01,2023-12-31
     */
    public List<FilterCriteria> parseFilters(Map<String, String> params) {
        System.out.println("Parsing filters from params: " + params); // Debug line

        List<FilterCriteria> filters = params.entrySet().stream()
                .filter(entry -> !isReservedParam(entry.getKey()))
                .map(this::parseFilterParam)
                .filter(criteria -> criteria != null)
                .collect(Collectors.toList());

        System.out.println("Parsed filters: " + filters); // Debug line
        return filters;
    }

    /**
     * Parse single filter parameter
     */
    private FilterCriteria parseFilterParam(Map.Entry<String, String> param) {
        String key = param.getKey();
        String value = param.getValue();

        System.out.println("Parsing filter param: " + key + " = " + value); // Debug line

        if (value == null || value.trim().isEmpty()) {
            System.out.println("Skipping empty value for key: " + key); // Debug line
            return null;
        }

        // Split field and operation
        int lastUnderscore = key.lastIndexOf('_');
        if (lastUnderscore == -1) {
            System.out.println("Invalid format for key: " + key); // Debug line
            return null; // Invalid format
        }

        String field = key.substring(0, lastUnderscore);
        String operation = key.substring(lastUnderscore + 1);

        System.out.println("Field: " + field + ", Operation: " + operation); // Debug line

        // Handle BETWEEN operation (value1,value2)
        if ("between".equals(operation) && value.contains(",")) {
            String[] values = value.split(",", 2);
            return new FilterCriteria(field, operation, values[0].trim(), values[1].trim());
        }

        // Handle IN/NOT_IN operations (value1,value2,value3)
        if (("in".equals(operation) || "not_in".equals(operation)) && value.contains(",")) {
            List<String> values = Arrays.asList(value.split(","))
                    .stream()
                    .map(String::trim)
                    .collect(Collectors.toList());
            return new FilterCriteria(field, operation, values);
        }

        return new FilterCriteria(field, operation, value);
    }

    /**
     * Build JPA Specification from filter criteria
     */
    public <T> Specification<T> buildSpecification(List<FilterCriteria> filters) {
        System.out.println("Building specification for filters: " + filters); // Debug line

        if (filters == null || filters.isEmpty()) {
            System.out.println("No filters provided, returning null specification"); // Debug line
            return null;
        }

        // Fixed: Start with the first filter
        Specification<T> spec = GenericSpecification.of(filters.get(0));

        // Combine additional filters with AND
        for (int i = 1; i < filters.size(); i++) {
            spec = spec.and(GenericSpecification.of(filters.get(i)));
        }

        return spec;
    }

    /**
     * Create pageable object with validation
     */
    public Pageable createPageable(Integer page, Integer size, String sortBy, String sortDirection) {
        // Validate page
        int validPage = page != null && page >= 0 ? page : 0;

        // Validate size
        int validSize = validatePageSize(size);

        // Validate sort direction
        Sort.Direction direction = Sort.Direction.ASC;
        if (sortDirection != null && "desc".equalsIgnoreCase(sortDirection)) {
            direction = Sort.Direction.DESC;
        }

        // Create sort object
        Sort sort = Sort.by(direction, sortBy != null ? sortBy : "id");

        return PageRequest.of(validPage, validSize, sort);
    }

    /**
     * Get filtered and paginated results with proper error handling
     */
    public <T> Page<T> getFilteredResults(
            JpaSpecificationExecutor<T> repository,
            List<FilterCriteria> filters,
            Pageable pageable) {

        try {
            Specification<T> spec = buildSpecification(filters);

            // Always use findAll with specification and pageable
            if (spec != null) {
                return repository.findAll(spec, pageable);
            } else {
                // Use null specification (which means no filtering)
                return repository.findAll(Specification.where(null), pageable);
            }
        } catch (Exception e) {
            System.err.println("Error in getFilteredResults: " + e.getMessage());
            e.printStackTrace();
            // Return fallback - all results with pagination only
            return repository.findAll(Specification.where(null), pageable);
        }
    }

    /**
     * Validate page size
     */
    private int validatePageSize(Integer size) {
        if (size == null || size <= 0) {
            return DEFAULT_PAGE_SIZE;
        }

        if (size > MAX_PAGE_SIZE) {
            return MAX_PAGE_SIZE;
        }

        // Return closest allowed size
        return ALLOWED_PAGE_SIZES.stream()
                .min((a, b) -> Math.abs(a - size) - Math.abs(b - size))
                .orElse(DEFAULT_PAGE_SIZE);
    }

    /**
     * Check if parameter is reserved (not a filter)
     */
    private boolean isReservedParam(String paramName) {
        // All parameters that should not be treated as filters
        return Arrays.asList("page", "size", "sortBy", "sortDirection", "sort", "direction").contains(paramName);
    }

    /**
     * Configuration class for frontend
     */
    public static class FilterConfig {
        public static final int DEFAULT_SIZE = DEFAULT_PAGE_SIZE;
        public static final int MAX_SIZE = MAX_PAGE_SIZE;
        public static final List<Integer> ALLOWED_SIZES = ALLOWED_PAGE_SIZES;

        public static final List<String> SUPPORTED_OPERATIONS = Arrays.asList(
                "eq", "neq", "contains", "not_contains", "starts_with", "ends_with",
                "is_null", "is_not_null", "gt", "gte", "lt", "lte", "between", "in", "not_in"
        );
    }
}