// src/main/java/com/example/backend/model/Answer.java
package com.example.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties; // NEW: Import JsonIgnoreProperties

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "answers")
// NEW: Use JsonIgnoreProperties to prevent potential infinite recursion
// when Question or User are serialized and might reference back to Answer.
// This is a safer default for many-to-one relationships.
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Answer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id")
    // If Question had a direct reference back to List<Answer>, you'd need @JsonIgnore here.
    // For now, let's assume Question doesn't directly list Answers.
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    // If User had a direct reference back to List<Answer>, you'd need @JsonIgnore here.
    private User user;

    @Column(columnDefinition = "TEXT")
    private String response;
}
