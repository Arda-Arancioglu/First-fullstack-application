
// src/main/java/com/example/backend/specification/GenericSpecification.java
package com.example.backend.specification;

import com.example.backend.dto.FilterCriteria;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class GenericSpecification {

    public static <T> Specification<T> of(FilterCriteria criteria) {
        return (root, query, criteriaBuilder) -> {
            try {
                return buildPredicate(root, criteriaBuilder, criteria);
            } catch (Exception e) {
                // Log the error and return a predicate that matches nothing
                System.err.println("Error building predicate for field: " + criteria.getField() +
                        ", operator: " + criteria.getOperator() +
                        ", error: " + e.getMessage());
                return criteriaBuilder.disjunction(); // Always false
            }
        };
    }

    private static <T> Predicate buildPredicate(Root<T> root, CriteriaBuilder cb, FilterCriteria criteria) {
        String field = criteria.getField();
        String operator = criteria.getOperator().toLowerCase();
        Object value = criteria.getValue();

        // Handle nested fields (e.g., "user.username", "question.form.id")
        Path<?> path = getPath(root, field);

        switch (operator) {
            case "eq":
                return cb.equal(path, convertValue(value, path.getJavaType()));
            case "neq":
                return cb.notEqual(path, convertValue(value, path.getJavaType()));
            case "contains":
                return cb.like(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase() + "%");
            case "not_contains":
                return cb.notLike(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase() + "%");
            case "starts_with":
                return cb.like(cb.lower(path.as(String.class)), value.toString().toLowerCase() + "%");
            case "ends_with":
                return cb.like(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase());
            case "is_null":
                return cb.isNull(path);
            case "is_not_null":
                return cb.isNotNull(path);
            case "gt":
                return cb.greaterThan(path.as(Comparable.class), (Comparable) convertValue(value, path.getJavaType()));
            case "gte":
                return cb.greaterThanOrEqualTo(path.as(Comparable.class), (Comparable) convertValue(value, path.getJavaType()));
            case "lt":
                return cb.lessThan(path.as(Comparable.class), (Comparable) convertValue(value, path.getJavaType()));
            case "lte":
                return cb.lessThanOrEqualTo(path.as(Comparable.class), (Comparable) convertValue(value, path.getJavaType()));
            case "between":
                Object value2 = criteria.getValue2();
                return cb.between(path.as(Comparable.class),
                        (Comparable) convertValue(value, path.getJavaType()),
                        (Comparable) convertValue(value2, path.getJavaType()));
            case "in":
                if (value instanceof List) {
                    return path.in((List<?>) value);
                }
                return path.in(value);
            case "not_in":
                if (value instanceof List) {
                    return cb.not(path.in((List<?>) value));
                }
                return cb.not(path.in(value));
            default:
                throw new IllegalArgumentException("Unsupported operator: " + operator);
        }
    }

    private static Path<?> getPath(Root<?> root, String field) {
        String[] fields = field.split("\\.");
        Path<?> path = root;

        for (String f : fields) {
            path = path.get(f);
        }

        return path;
    }

    private static Object convertValue(Object value, Class<?> targetType) {
        if (value == null) {
            return null;
        }

        String stringValue = value.toString();

        // If target type matches the value type, return as-is
        if (targetType.isAssignableFrom(value.getClass())) {
            return value;
        }

        // Convert based on target type
        try {
            if (targetType == Long.class || targetType == long.class) {
                return Long.parseLong(stringValue);
            } else if (targetType == Integer.class || targetType == int.class) {
                return Integer.parseInt(stringValue);
            } else if (targetType == Double.class || targetType == double.class) {
                return Double.parseDouble(stringValue);
            } else if (targetType == Float.class || targetType == float.class) {
                return Float.parseFloat(stringValue);
            } else if (targetType == Boolean.class || targetType == boolean.class) {
                return Boolean.parseBoolean(stringValue);
            } else if (targetType == LocalDate.class) {
                return LocalDate.parse(stringValue, DateTimeFormatter.ISO_LOCAL_DATE);
            } else if (targetType == LocalDateTime.class) {
                return LocalDateTime.parse(stringValue, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }
        } catch (Exception e) {
            // If conversion fails, return the original string value
            System.err.println("Failed to convert value '" + stringValue + "' to type " + targetType.getSimpleName());
        }

        return stringValue;
    }
}