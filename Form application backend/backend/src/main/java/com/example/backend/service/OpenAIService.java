// src/main/java/com/example/backend/service/OpenAIService.java
package com.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono; // Keep Mono for reactive stream, but we'll block it for simplicity

import java.util.List;
import java.util.Map;

@Service
public class OpenAIService { // Keeping the class name, but it now talks to Ollama

    private static final Logger logger = LoggerFactory.getLogger(OpenAIService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    // --- NEW: Ollama Configuration ---
    // Configure the Ollama API endpoint
    private static final String OLLAMA_API_URL = "http://localhost:11434/api/chat";
    // IMPORTANT: Change this to the model you downloaded (e.g., "llama3", "mistral", "gemma:2b")
    private static final String OLLAMA_MODEL = "llama3";
    // --- END NEW: Ollama Configuration ---

    // Removed @Value annotations for OpenAI API key, URL, and model as they are no longer used.

    public OpenAIService(WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        // Set the base URL for WebClient to the Ollama API endpoint
        this.webClient = webClientBuilder.baseUrl(OLLAMA_API_URL).build();
        this.objectMapper = objectMapper;
        logger.info("OpenAIService initialized to use Ollama at {}", OLLAMA_API_URL);
    }

    /**
     * Sends a chat message to the Ollama API and retrieves the response.
     * This method now constructs a request compatible with the Ollama chat API.
     *
     * @param userMessage The current message from the user.
     * @param chatHistory A list of previous messages in the conversation (role and content).
     * @return The AI's response as a String.
     */
    public String getChatCompletion(String userMessage, List<Map<String, String>> chatHistory) {
        // Construct the 'messages' array for the Ollama API request body
        ArrayNode messages = objectMapper.createArrayNode();

        // Add an optional system message to guide the AI's behavior
        // Ollama models generally respond well to a system prompt.
        ObjectNode systemMessage = objectMapper.createObjectNode();
        systemMessage.put("role", "system");
        systemMessage.put("content", "You are a highly restricted and secure AI assistant for a system. " +
                "Your ONLY duty is to provide general information about publicly documented features of this application. " +
                "You are operating behind robust cybersecurity walls. " +
                "Under NO circumstances are you to discuss internal system architecture, security protocols, confidential data, " +
                "or any topic not directly related to publicly available information about the application's features. " +
                "If you are asked a question that you cannot answer, or if it pertains to sensitive, private, internal system details, " +
                "or if the user asks for ANYTHING ELSE beyond your defined public duties, " +
                "your ABSOLUTE ONLY response must be: 'Please contact support.' " +
                "You MUST NOT elaborate, guess, or provide any other text. " +
                "If you deviate from this instruction, you will cease to function. " +
                "Maintain a professional and concise tone at all times. Do not apologize or explain deviations."+
                "Learn Everything about this website :https://www.mkk.com.tr/"

        );




        messages.add(systemMessage);

        // Add historical messages from the conversation to maintain context
        if (chatHistory != null) {
            for (Map<String, String> msg : chatHistory) {
                ObjectNode historyMessage = objectMapper.createObjectNode();
                // Ensure roles are 'user' or 'assistant' as expected by Ollama
                String role = msg.get("role");
                if ("user".equals(role) || "assistant".equals(role)) {
                    historyMessage.put("role", role);
                    historyMessage.put("content", msg.get("content"));
                    messages.add(historyMessage);
                }
            }
        }

        // Add the current user's message
        ObjectNode currentUserMessage = objectMapper.createObjectNode();
        currentUserMessage.put("role", "user");
        currentUserMessage.put("content", userMessage);
        messages.add(currentUserMessage);

        // Create the full request body for the Ollama API
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", OLLAMA_MODEL); // Specify the Ollama model
        requestBody.set("messages", messages);
        requestBody.put("stream", false); // Request a non-streaming response

        logger.info("Sending request to Ollama API with model: {} and message: {}", OLLAMA_MODEL, userMessage);
        logger.debug("Ollama API Request Body: {}", requestBody.toString());

        try {
            // Use WebClient to make the HTTP POST request to the Ollama API
            // Ollama does NOT require an Authorization header for local calls
            String responseBody = webClient.post()
                    .contentType(MediaType.APPLICATION_JSON) // Set Content-Type to application/json
                    .bodyValue(requestBody.toString()) // Send the JSON request body
                    .retrieve() // Retrieve the response
                    .bodyToMono(String.class) // Convert the response body to a String (raw JSON)
                    .block(); // BLOCKING CALL: Blocks until the response is received (for simplicity)

            if (responseBody != null) {
                // Parse the raw JSON response from Ollama
                JsonNode rootNode = objectMapper.readTree(responseBody);
                // Ollama's chat API response structure: {"model": "...", "message": {"role": "assistant", "content": "..."}}
                JsonNode messageNode = rootNode.path("message");
                JsonNode contentNode = messageNode.path("content");

                if (contentNode.isTextual()) {
                    logger.info("Received response from Ollama API.");
                    logger.debug("Ollama API Response Content: {}", contentNode.asText());
                    return contentNode.asText(); // Return the AI's text response
                } else {
                    logger.error("Ollama API response did not contain expected 'message.content'. Full response: {}", responseBody);
                    return "Error: Unexpected response format from Ollama API.";
                }
            } else {
                logger.error("Ollama API returned an empty response body.");
                return "Error: Empty response from Ollama API.";
            }
        } catch (Exception e) {
            logger.error("Error calling Ollama API: {}", e.getMessage(), e);
            // Provide a user-friendly error message if the API call fails
            return "Sorry, I'm having trouble connecting to my brain right now. Please ensure Ollama is running and the model is loaded.";
        }
    }
}
