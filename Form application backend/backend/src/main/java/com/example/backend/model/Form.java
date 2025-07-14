// src/main/java/com/example/backend/model/Form.java
package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore; // NEW: Import JsonIgnore
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.ArrayList;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "forms")
public class Form {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("id ASC")
    @JsonIgnore // NEW: Ignore this field during JSON serialization of Form to prevent infinite recursion
    private List<Question> questions = new ArrayList<>();
}
