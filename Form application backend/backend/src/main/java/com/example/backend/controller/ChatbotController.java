// src/main/java/com/example/backend/controller/ChatbotController.java
package com.example.backend.controller;

import com.example.backend.service.OpenAIService; // Import OpenAIService
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
@CrossOrigin(origins = "http://localhost:5173", maxAge = 3600) // Allow CORS from your React app
public class ChatbotController {

    private final OpenAIService openaiService; // Inject OpenAIService

    @Autowired
    public ChatbotController(OpenAIService openaiService) {
        this.openaiService = openaiService;
    }

    /**
     * Endpoint to send a message to the OpenAI (ChatGPT) chatbot and get a response.
     * This endpoint requires authentication (USER or ADMIN role).
     *
     * The request body is expected to be a JSON object like:
     * {
     * "message": "Hello, how are you?",
     * "chatHistory": [
     * {"role": "user", "content": "Previous user message"},
     * {"role": "assistant", "content": "Previous AI response"}
     * ]
     * }
     *
     * @param requestBody A map containing the "message" (current user input) and "chatHistory" (optional).
     * @return A Mono of ResponseEntity containing the chatbot's response.
     */
    @PostMapping("/chat")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public Mono<ResponseEntity<String>> chatWithDeepSeek(@RequestBody Map<String, Object> requestBody) {
        String userMessage = (String) requestBody.get("message");
        // Cast chatHistory to List<Map<String, String>>
        List<Map<String, String>> chatHistory = (List<Map<String, String>>) requestBody.get("chatHistory");

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return Mono.just(ResponseEntity.badRequest().body("Message cannot be empty."));
        }

        return openaiService.getChatCompletion(userMessage, chatHistory) // Call openaiService
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.internalServerError().body("Failed to get response from chatbot."));
    }
}
