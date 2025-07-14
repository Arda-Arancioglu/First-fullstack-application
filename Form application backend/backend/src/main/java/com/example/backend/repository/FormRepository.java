// src/main/java/com/example/backend/repository/FormRepository.java
package com.example.backend.repository;

import com.example.backend.model.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FormRepository extends JpaRepository<Form, Long> {
    // Basic CRUD operations are inherited.
    // You could add custom query methods here if needed, e.g., findByTitle(String title)
    Optional<Form> findByTitle(String title);
}
