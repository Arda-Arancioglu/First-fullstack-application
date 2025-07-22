// src/main/java/com/example/backend/service/FilterService.java
package com.example.backend.service;

import com.example.backend.dto.FilterCriteria;
import com.example.backend.specification.GenericSpecification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FilterService {

    // Reserved parameter names that should not be treated as filters
    private static final List<String> RESERVED_PARAMS = Arrays.asList(
            "page", "size", "sortBy", "sortDirection"
    );
    // Java
    public List<FilterCriteria> parseFilters(Map<String, String> params) {
        List<FilterCriteria> filters = new ArrayList<>();

        for (Map.Entry<String, String> param : params.entrySet()) {
            // Skip reserved params and keys ending with _operator
            if (!RESERVED_PARAMS.contains(param.getKey()) && !param.getKey().endsWith("_operator")) {
                FilterCriteria criteria = parseFilterParam(param);
                if (criteria != null) {
                    filters.add(criteria);
                }
            }
        }

        System.out.println("Parsed " + filters.size() + " filters from request parameters");
        return filters;
    }

    private FilterCriteria parseFilterParam(Map.Entry<String, String> param) {
        String key = param.getKey();
        String value = param.getValue();

        System.out.println("Parsing filter param: " + key + " = " + value); // Debug line

        if (value == null || value.trim().isEmpty()) {
            System.out.println("Skipping empty value for key: " + key); // Debug line
            return null;
        }

        // Handle multi-word operations first
        String field;
        String operation;

        if (key.endsWith("_starts_with")) {
            field = key.substring(0, key.length() - "_starts_with".length());
            operation = "starts_with";
        } else if (key.endsWith("_ends_with")) {
            field = key.substring(0, key.length() - "_ends_with".length());
            operation = "ends_with";
        } else if (key.endsWith("_not_contains")) {
            field = key.substring(0, key.length() - "_not_contains".length());
            operation = "not_contains";
        } else if (key.endsWith("_is_null")) {
            field = key.substring(0, key.length() - "_is_null".length());
            operation = "is_null";
        } else if (key.endsWith("_is_not_null")) {
            field = key.substring(0, key.length() - "_is_not_null".length());
            operation = "is_not_null";
        } else if (key.endsWith("_not_in")) {
            field = key.substring(0, key.length() - "_not_in".length());
            operation = "not_in";
        } else {
            // Handle single-word operations
            int lastUnderscore = key.lastIndexOf('_');
            if (lastUnderscore == -1) {
                System.out.println("Invalid format for key: " + key); // Debug line
                return null; // Invalid format
            }

            field = key.substring(0, lastUnderscore);
            operation = key.substring(lastUnderscore + 1);
        }

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

    public Pageable createPageable(Integer page, Integer size, String sortBy, String sortDirection) {
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        Sort sort = Sort.by(direction, sortBy);
        return PageRequest.of(page, size, sort);
    }

    public <T> Page<T> getFilteredResults(
            JpaSpecificationExecutor<T> repository,
            List<FilterCriteria> filters,
            Pageable pageable) {

        try {
            if (filters == null || filters.isEmpty()) {
                System.out.println("No filters provided, returning all results"); // Debug line
                return ((JpaRepository<T, ?>) repository).findAll(pageable);
            }

            Specification<T> spec = null;
            for (FilterCriteria filter : filters) {
                Specification<T> newSpec = GenericSpecification.of(filter);
                spec = (spec == null) ? newSpec : spec.and(newSpec);
            }

            System.out.println("Executing query with " + filters.size() + " filters"); // Debug line
            return repository.findAll(spec, pageable);
        } catch (Exception e) {
            System.err.println("Error in getFilteredResults: " + e.getMessage());
            e.printStackTrace();
            // Return empty page on error
            return ((JpaRepository<T, ?>) repository).findAll(PageRequest.of(0, 10));
        }
    }
}