// src/main/java/com/example/backend/specification/GenericSpecification.java
package com.example.backend.specification;

import com.example.backend.dto.FilterCriteria;
import com.example.backend.model.ERole;
import com.example.backend.model.Role;
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
                        ", value: " + criteria.getValue() +
                        ", error: " + e.getMessage());
                e.printStackTrace();
                return criteriaBuilder.disjunction(); // Always false
            }
        };
    }

    private static <T> Predicate buildPredicate(Root<T> root, CriteriaBuilder cb, FilterCriteria criteria) {
        String field = criteria.getField();
        String operator = criteria.getOperator().toLowerCase();
        Object value = criteria.getValue();

        System.out.println("Building predicate for field: " + field + ", operator: " + operator + ", value: " + value);

        // Handle nested fields (e.g., "user.username", "question.form.id")
        Path<?> path = getPath(root, field);

        switch (operator) {
            case "eq":
                if ("roles".equals(field)) {
                    // Join roles and compare the name to the value (should be ERole)
                    Join<Object, Role> rolesJoin = root.join("roles", JoinType.INNER);
                    ERole roleEnum = ERole.valueOf(value.toString());
                    return cb.equal(rolesJoin.get("name"), roleEnum);
                }
                return cb.equal(path, convertValue(value, path.getJavaType()));
            case "neq":
                if ("roles".equals(field)) {
                    Join<Object, Role> rolesJoin = root.join("roles", JoinType.INNER);
                    ERole roleEnum = ERole.valueOf(value.toString());
                    return cb.notEqual(rolesJoin.get("name"), roleEnum);
                }
                return cb.notEqual(path, convertValue(value, path.getJavaType()));

            case "contains":
                // Special handling for roles field
                if ("roles".equals(field)) {
                    System.out.println("Handling roles contains filter with value: " + value);
                    try {
                        // Convert string to ERole enum
                        ERole roleEnum = ERole.valueOf(value.toString());

                        // Create a join to the roles collection
                        Join<Object, Role> rolesJoin = root.join("roles", JoinType.INNER);
                        return cb.equal(rolesJoin.get("name"), roleEnum);
                    } catch (IllegalArgumentException e) {
                        System.err.println("Invalid role value: " + value);
                        return cb.disjunction(); // Return false predicate
                    }
                }
                // Check if this is a collection field
                else if (isCollectionField(path)) {
                    // For collections, use EXISTS with subquery
                    Subquery<Long> subquery = cb.createQuery().subquery(Long.class);
                    Root<?> subRoot = subquery.from(root.getJavaType());
                    Join<?, ?> collectionJoin = subRoot.join(field);
                    subquery.select(subRoot.get("id")); // Fixed: select id instead of root
                    subquery.where(cb.equal(collectionJoin, value));
                    return cb.exists(subquery);
                } else {
                    // For string fields, use like
                    if (path.getJavaType() == String.class) {
                        return cb.like(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase() + "%");
                    } else {
                        return cb.like(cb.lower(cb.function("str", String.class, path)), "%" + value.toString().toLowerCase() + "%");
                    }
                }
            case "not_contains":
                if ("roles".equals(field)) {
                    try {
                        ERole roleEnum = ERole.valueOf(value.toString());

                        // Create a subquery to check if user does NOT have this role
                        Subquery<Long> subquery = cb.createQuery().subquery(Long.class);
                        Root<?> subRoot = subquery.from(root.getJavaType());
                        Join<Object, Role> rolesJoin = subRoot.join("roles", JoinType.LEFT);
                        subquery.select(subRoot.get("id"));
                        subquery.where(
                                cb.and(
                                        cb.equal(subRoot.get("id"), root.get("id")),
                                        cb.equal(rolesJoin.get("name"), roleEnum)
                                )
                        );
                        return cb.not(cb.exists(subquery));
                    } catch (IllegalArgumentException e) {
                        System.err.println("Invalid role value: " + value);
                        return cb.conjunction(); // Return true predicate
                    }
                }
                else if (isCollectionField(path)) {
                    // For collections, use NOT EXISTS with subquery
                    Subquery<Long> subquery = cb.createQuery().subquery(Long.class);
                    Root<?> subRoot = subquery.from(root.getJavaType());
                    Join<?, ?> collectionJoin = subRoot.join(field);
                    subquery.select(subRoot.get("id"));
                    subquery.where(cb.equal(collectionJoin, value));
                    return cb.not(cb.exists(subquery));
                } else {
                    if (path.getJavaType() == String.class) {
                        return cb.not(cb.like(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase() + "%"));
                    } else {
                        return cb.not(cb.like(cb.lower(cb.function("str", String.class, path)), "%" + value.toString().toLowerCase() + "%"));
                    }
                }
            case "starts_with":
                if (path.getJavaType() == String.class) {
                    return cb.like(cb.lower(path.as(String.class)), value.toString().toLowerCase() + "%");
                } else {
                    return cb.like(cb.lower(cb.function("str", String.class, path)), value.toString().toLowerCase() + "%");
                }
            case "ends_with":
                if (path.getJavaType() == String.class) {
                    return cb.like(cb.lower(path.as(String.class)), "%" + value.toString().toLowerCase());
                } else {
                    return cb.like(cb.lower(cb.function("str", String.class, path)), "%" + value.toString().toLowerCase());
                }
            case "is_null":
                return cb.isNull(path);
            case "is_not_null":
                return cb.isNotNull(path);
            case "gt":
                return cb.greaterThan(path.as((Class) path.getJavaType()), (Comparable) convertValue(value, path.getJavaType()));
            case "gte":
                return cb.greaterThanOrEqualTo(path.as((Class) path.getJavaType()), (Comparable) convertValue(value, path.getJavaType()));
            case "lt":
                return cb.lessThan(path.as((Class) path.getJavaType()), (Comparable) convertValue(value, path.getJavaType()));
            case "lte":
                return cb.lessThanOrEqualTo(path.as((Class) path.getJavaType()), (Comparable) convertValue(value, path.getJavaType()));
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

    private static boolean isCollectionField(Path<?> path) {
        Class<?> javaType = path.getJavaType();
        return java.util.Collection.class.isAssignableFrom(javaType) ||
                java.util.Set.class.isAssignableFrom(javaType) ||
                java.util.List.class.isAssignableFrom(javaType);
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