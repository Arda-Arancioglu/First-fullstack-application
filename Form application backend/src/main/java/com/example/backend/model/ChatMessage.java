// src/main/java/com/example/backend/model/ChatMessage.java
package com.example.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The ID of the user this message belongs to.
    // This is crucial for filtering chat history by user.
    @Column(nullable = false)
    private Long userId;

    // Role of the sender: "user" or "assistant"
    @Column(nullable = false)
    private String role;

    // The content of the message
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // Timestamp when the message was created/sent
    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Constructor for creating new messages (ID and timestamp will be auto-generated/set)
    public ChatMessage(Long userId, String role, String content) {
        this.userId = userId;
        this.role = role;
        this.content = content;
        this.timestamp = LocalDateTime.now(); // Set current timestamp on creation
    }
}
