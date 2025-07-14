// src/main/java/com/example/backend/model/Question.java
package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore; // NEW: Import JsonIgnore
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String questionText;
    private String type; // e.g., "text", "radio", "checkbox"

    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text")
    private List<String> options = new ArrayList<>();

    private Integer maxSelections; // For 'checkbox' type questions

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id")
    @JsonIgnore // NEW: Ignore this field during JSON serialization to prevent infinite recursion
    private Form form;

    public Question(Long id, String questionText, String type, List<String> options, Integer maxSelections, Form form) {
        this.id = id;
        this.questionText = questionText;
        this.type = type;
        this.options = options != null ? options : new ArrayList<>();
        this.maxSelections = maxSelections;
        this.form = form;
    }

    public Question(Long id, String questionText, String type, Form form) {
        this(id, questionText, type, new ArrayList<>(), null, form);
    }
}
