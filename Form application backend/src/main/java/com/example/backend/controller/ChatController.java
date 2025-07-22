// src/main/java/com/example/backend/controller/ChatController.java
package com.example.backend.controller;

import com.example.backend.model.ChatMessage;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.security.services.UserDetailsImpl;
import com.example.backend.service.OpenAIService; // NEW: Import OpenAIService
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import jakarta.transaction.Transactional; // Import for @Transactional

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map; // For chatHistory in OpenAIService
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api") // Base path for all API endpoints
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600) // Allow CORS from your React app
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);
    private final ChatMessageRepository chatMessageRepository;
    private final OpenAIService openaiService; // NEW: Inject OpenAIService
    private final ObjectMapper objectMapper; // For JSON parsing/serialization

    @Autowired
    public ChatController(ChatMessageRepository chatMessageRepository, OpenAIService openaiService, ObjectMapper objectMapper) {
        this.chatMessageRepository = chatMessageRepository;
        this.openaiService = openaiService; // Initialize OpenAIService
        this.objectMapper = objectMapper;
    }

    /**
     * Extracts the current authenticated user's ID from the SecurityContextHolder.
     *
     * @return The ID of the currently authenticated user.
     * @throws IllegalStateException if no user is authenticated or user details are not available.
     */
    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal() instanceof String) {
            throw new IllegalStateException("User not authenticated or principal is not UserDetailsImpl.");
        }
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        logger.debug("ChatController: Retrieved current user ID: {}", userDetails.getId());
        return userDetails.getId();
    }

    /**
     * Endpoint to handle new chat messages from the frontend and interact with the LLM.
     * Saves both the user's message and the AI's response to the database.
     *
     * @param requestBody A JSON object containing "message" (user's input) and "chatHistory" (previous messages for context).
     * @return ResponseEntity containing the AI's response as a String.
     */
    @PostMapping("/chatbot/chat") // This is the endpoint that was conflicting
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<String> chatWithBot(@RequestBody JsonNode requestBody) {
        Long userId = getCurrentUserId();
        String userMessageContent = requestBody.has("message") ? requestBody.get("message").asText() : "";
        // Convert JsonNode chatHistory to List<Map<String, String>> for OpenAIService
        List<Map<String, String>> chatHistoryForService = null;
        if (requestBody.has("chatHistory") && requestBody.get("chatHistory").isArray()) {
            try {
                // Use ObjectMapper to convert JsonNode to List<Map<String, String>>
                chatHistoryForService = objectMapper.convertValue(requestBody.get("chatHistory"),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            } catch (IllegalArgumentException e) {
                logger.error("ChatController: Error converting chatHistory JsonNode to List<Map<String, String>>: {}", e.getMessage());
                // Handle the error, maybe proceed with an empty history or return an error response
                chatHistoryForService = null; // Or new ArrayList<>();
            }
        }


        logger.info("ChatController: Received message from user {}: '{}'", userId, userMessageContent);
        logger.debug("ChatController: Received chat history for context (for service): {}", chatHistoryForService);

        if (userMessageContent.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message cannot be empty.");
        }

        try {
            // 1. Save user's message to the database
            ChatMessage userMessage = new ChatMessage(userId, "user", userMessageContent);
            chatMessageRepository.save(userMessage);
            logger.info("ChatController: User message saved to DB for user {}: '{}'", userId, userMessageContent);

            // 2. Call OpenAIService to get AI's response
            String aiResponseContent = openaiService.getChatCompletion(userMessageContent, chatHistoryForService);
            logger.info("ChatController: Received AI response: '{}'", aiResponseContent);

            // 3. Save AI's response to the database
            ChatMessage aiMessage = new ChatMessage(userId, "assistant", aiResponseContent);
            chatMessageRepository.save(aiMessage);
            logger.info("ChatController: AI response saved to DB for user {}: '{}'", userId, aiResponseContent);

            return ResponseEntity.ok(aiResponseContent);

        } catch (Exception e) {
            logger.error("ChatController: An error occurred during chat processing: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to get response from chatbot: " + e.getMessage());
        }
    }

    /**
     * Endpoint to retrieve all chat messages for the currently authenticated user.
     *
     * @return ResponseEntity containing a list of ChatMessage objects.
     */
    @GetMapping("/chat/messages/my-messages")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Transactional // Ensure this method is transactional for saving the welcome message
    public ResponseEntity<List<ChatMessage>> getMyChatMessages() {
        Long userId = getCurrentUserId();
        logger.info("ChatController: Fetching chat history for user ID: {}", userId);
        List<ChatMessage> messages = chatMessageRepository.findByUserIdOrderByTimestampAsc(userId);
        logger.info("ChatController: Found {} messages for user ID: {}", messages.size(), userId);

        // If no messages exist for the user, add the initial welcome message
        if (messages.isEmpty()) {
            String welcomeMessageContent = "Hi there! How can I help you today?";
            ChatMessage welcomeMessage = new ChatMessage(userId, "assistant", welcomeMessageContent);
            chatMessageRepository.save(welcomeMessage); // Save the welcome message to the database
            messages.add(welcomeMessage); // Add it to the list to be returned
            logger.info("ChatController: Added initial welcome message for user ID: {}", userId);
        }

        return ResponseEntity.ok(messages);
    }

    /**
     * Endpoint to delete all chat messages for the currently authenticated user.
     *
     * @return ResponseEntity with HttpStatus.NO_CONTENT on successful deletion.
     */
    @DeleteMapping("/chat/messages/my-messages")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Transactional // Ensure the delete operation is transactional
    public ResponseEntity<Void> clearMyChatMessages() {
        Long userId = getCurrentUserId();
        logger.info("ChatController: Deleting all chat messages for user ID: {}", userId);
        chatMessageRepository.deleteByUserId(userId);
        logger.info("ChatController: All chat messages deleted for user ID: {}", userId);
        return ResponseEntity.noContent().build();
    }
}
