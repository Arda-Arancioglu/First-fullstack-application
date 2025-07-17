// src/main/java/com/example/backend/dto/QuestionDTO.java
package com.example.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
public class QuestionDTO {
    private Long id;
    private String questionText;
    private String type;
    private List<String> options;
    private Integer maxSelections;

    public QuestionDTO(Long id, String questionText, String type, List<String> options, Integer maxSelections) {
        this.id = id;
        this.questionText = questionText;
        this.type = type;
        this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
        this.maxSelections = maxSelections;
    }
}
