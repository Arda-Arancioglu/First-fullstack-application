
package com.example.backend.repository;

import com.example.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long>, JpaSpecificationExecutor<ChatMessage> {

    List<ChatMessage> findByUserIdOrderByTimestampAsc(Long userId);

    void deleteByUserId(Long userId);
}