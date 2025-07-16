// src/main/java/com/example/backend/repository/ChatMessageRepository.java
package com.example.backend.repository;

import com.example.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Finds all chat messages for a given user, ordered by timestamp in ascending order.
     * This is used to retrieve the chat history for a specific user.
     *
     * @param userId The ID of the user whose chat messages are to be retrieved.
     * @return A list of ChatMessage objects for the specified user, sorted by timestamp.
     */
    List<ChatMessage> findByUserIdOrderByTimestampAsc(Long userId);

    /**
     * Deletes all chat messages associated with a specific user.
     * This is used when a user clears their chat history.
     *
     * @param userId The ID of the user whose chat messages are to be deleted.
     */
    void deleteByUserId(Long userId);
}
