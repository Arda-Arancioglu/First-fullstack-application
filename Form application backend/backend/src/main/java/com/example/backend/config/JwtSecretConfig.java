// src/main/java/com/example/backend/config/JwtSecretConfig.java
package com.example.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.SecureRandom;
import java.util.Base64;

@Configuration
public class JwtSecretConfig {

    private static final Logger logger = LoggerFactory.getLogger(JwtSecretConfig.class);
    private static final int SECRET_LENGTH_BYTES = 32; // 256 bits for HS256

    /**
     * Creates a Spring Bean that provides a dynamically generated, cryptographically secure JWT secret.
     * This secret will be unique each time the application starts.
     *
     * @return A Base64-encoded string representing the JWT secret.
     */
    @Bean
    public String jwtSecretString() {
        SecureRandom secureRandom = new SecureRandom();
        byte[] secretBytes = new byte[SECRET_LENGTH_BYTES];
        secureRandom.nextBytes(secretBytes); // Fill the byte array with random bytes

        // Encode the random bytes to a URL-safe Base64 string
        String generatedSecret = Base64.getUrlEncoder().withoutPadding().encodeToString(secretBytes);

        logger.info("Dynamically generated JWT secret on startup (length: {} characters).", generatedSecret.length());
        // For security, AVOID logging the actual secret in production logs!
        // logger.debug("Generated JWT Secret: {}", generatedSecret); // Use debug for actual secret if absolutely necessary for dev

        return generatedSecret;
    }
}
