// src/main/java/com/example/backend/repository/AnswerRepository.java
package com.example.backend.repository;

import com.example.backend.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {
    /**
     * Finds all answers associated with a specific user ID.
     * Spring Data JPA automatically generates the query for this method name.
     * @param userId The ID of the user.
     * @return A list of Answer objects belonging to the specified user.
     */
    List<Answer> findByUserId(Long userId);
}
