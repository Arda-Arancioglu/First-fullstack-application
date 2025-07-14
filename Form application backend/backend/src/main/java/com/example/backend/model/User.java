// src/main/java/com/example/backend/model/User.java
package com.example.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty; // NEW: Import JsonProperty
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.HashSet;
import java.util.Set;
import java.util.List;
import java.util.ArrayList;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    // FIX: Use JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    // This allows the password to be written (deserialized) when creating/updating a user
    // but prevents it from being read (serialized) when sending user data back to the frontend.
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    // If you had a @OneToMany List<Answer> answers; here, you would need @JsonIgnore on it.
    // Example (if it existed):
    // @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    // @JsonIgnore // Prevent recursion when serializing User
    // private List<Answer> answers = new ArrayList<>();
}
