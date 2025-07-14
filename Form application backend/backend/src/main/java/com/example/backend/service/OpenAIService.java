// src/main/java/com/example/backend/service/OpenAIService.java
package com.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service // Mark this class as a Spring Service
public class OpenAIService {

    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper; // For JSON manipulation

    // Inject properties from application.properties (which now reads from .env)
    @Value("${backend.openai.api-key}")
    private String openaiApiKey;

    @Value("${backend.openai.api-url}")
    private String openaiApiUrl;

    @Value("${backend.openai.model}")
    private String openaiModel;

    public OpenAIService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    /**
     * Sends a chat message to the OpenAI (ChatGPT) API and retrieves the response.
     * The API expects a list of messages with roles (system, user, assistant) and content.
     *
     * @param userMessage The current message from the user.
     * @param chatHistory A list of previous messages in the conversation (role and content).
     * @return A Mono of the AI's response as a String.
     */
    public Mono<String> getChatCompletion(String userMessage, List<Map<String, String>> chatHistory) {
        // Construct the 'messages' array for the OpenAI API request body
        ArrayNode messages = objectMapper.createArrayNode();

        // Add an optional system message to guide the AI's behavior
        ObjectNode systemMessage = objectMapper.createObjectNode();
        systemMessage.put("role", "system");
        systemMessage.put("content", "You are a helpful and friendly assistant.");
        messages.add(systemMessage);

        // Add historical messages from the conversation to maintain context
        if (chatHistory != null) {
            for (Map<String, String> msg : chatHistory) {
                ObjectNode historyMessage = objectMapper.createObjectNode();
                historyMessage.put("role", msg.get("role"));
                historyMessage.put("content", msg.get("content"));
                messages.add(historyMessage);
            }
        }

        // Add the current user's message
        ObjectNode currentUserMessage = objectMapper.createObjectNode();
        currentUserMessage.put("role", "user");
        currentUserMessage.put("content", userMessage);
        messages.add(currentUserMessage);

        // Create the full request body for the OpenAI API
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", openaiModel); // Specify the OpenAI model (e.g., gpt-3.5-turbo)
        requestBody.set("messages", messages);
        requestBody.put("stream", false); // Request a non-streaming response

        logger.info("Sending request to OpenAI API with model: {} and message: {}", openaiModel, userMessage);
        logger.debug("OpenAI API Request Body: {}", requestBody.toString());

        // Use WebClient to make the HTTP POST request to the OpenAI API
        return webClient.post()
                .uri(openaiApiUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + openaiApiKey) // Set Authorization header with API key
                .contentType(MediaType.APPLICATION_JSON) // Set Content-Type to application/json
                .bodyValue(requestBody.toString()) // Send the JSON request body
                .retrieve() // Retrieve the response
                .bodyToMono(String.class) // Convert the response body to a String (raw JSON)
                .map(responseBody -> {
                    try {
                        // Parse the raw JSON response
                        JsonNode rootNode = objectMapper.readTree(responseBody);
                        // Navigate to the AI's message content: choices[0].message.content
                        JsonNode contentNode = rootNode.path("choices").path(0).path("message").path("content");
                        if (contentNode.isTextual()) {
                            logger.info("Received response from OpenAI API.");
                            logger.debug("OpenAI API Response Content: {}", contentNode.asText());
                            return contentNode.asText(); // Return the AI's text response
                        } else {
                            logger.error("OpenAI API response did not contain expected content: {}", responseBody);
                            return "Error: Unexpected response format from OpenAI API.";
                        }
                    } catch (Exception e) {
                        logger.error("Error parsing OpenAI API response: {}", e.getMessage(), e);
                        return "Error: Failed to parse OpenAI API response.";
                    }
                })
                .doOnError(e -> logger.error("Error calling OpenAI API: {}", e.getMessage(), e)); // Log any errors during the API call
    }
}
