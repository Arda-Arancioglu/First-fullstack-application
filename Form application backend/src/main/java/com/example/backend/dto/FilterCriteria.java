package com.example.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class FilterCriteria {
    private String field;
    private String operator;
    private Object value;
    private Object value2; // For BETWEEN operations

    // Constructor for single value operations
    public FilterCriteria(String field, String operator, Object value) {
        this.field = field;
        this.operator = operator;
        this.value = value;
    }

    // Constructor for BETWEEN operations
    public FilterCriteria(String field, String operator, Object value, Object value2) {
        this.field = field;
        this.operator = operator;
        this.value = value;
        this.value2 = value2;
    }
}