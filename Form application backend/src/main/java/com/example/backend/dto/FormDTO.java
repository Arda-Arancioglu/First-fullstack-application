// src/main/java/com/example/backend/dto/FormDTO.java
package com.example.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

import com.example.backend.model.Form;
import com.example.backend.model.Question;

@Data
@NoArgsConstructor
public class FormDTO {
    private Long id;
    private String title;
    private String description;
    private List<QuestionDTO> questions;

    public FormDTO(Form form) {
        this.id = form.getId();
        this.title = form.getTitle();
        this.description = form.getDescription();
        this.questions = form.getQuestions() != null ?
                form.getQuestions().stream()
                        .map(q -> new QuestionDTO(q.getId(), q.getQuestionText(), q.getType(), q.getOptions(), q.getMaxSelections()))
                        .collect(Collectors.toList()) :
                new ArrayList<>();
    }
}
