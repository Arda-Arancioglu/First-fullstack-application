// src/main/java/com/example/backend/repository/AnswerRepository.java
package com.example.backend.repository;

import com.example.backend.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    /**
     * Finds an answer by the ID of the user and the ID of the question.
     * This is crucial for checking if a user has already answered a specific question.
     * @param userId The ID of the user.
     * @param questionId The ID of the question.
     * @return An Optional containing the Answer if found, or empty if not.
     */
    Optional<Answer> findByUser_IdAndQuestion_Id(Long userId, Long questionId);

    /**
     * Finds all answers submitted by a specific user.
     * This is used by the frontend to pre-fill existing answers for the current user.
     * @param userId The ID of the user.
     * @return A List of Answer objects submitted by the user.
     */
    List<Answer> findByUser_Id(Long userId);
}
