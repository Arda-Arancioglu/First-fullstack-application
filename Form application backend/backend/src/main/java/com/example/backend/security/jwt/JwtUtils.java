// src/main/java/com/example/backend/security/jwt/JwtUtils.java
package com.example.backend.security.jwt;

import com.example.backend.security.services.UserDetailsImpl;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value; // Keep for jwtExpirationMs
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    // Removed @Value for jwtSecret, it will be injected via constructor
    private final String jwtSecret;

    @Value("${backend.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    // NEW: Constructor for dependency injection of jwtSecret
    public JwtUtils(@Value("${backend.app.jwtSecret:}") String jwtSecretFromProperties, String dynamicallyGeneratedJwtSecret) {
        // Prioritize dynamically generated secret if available, otherwise fall back to properties (for dev/testing)
        // In a production setup, you'd likely remove the properties fallback entirely.
        if (dynamicallyGeneratedJwtSecret != null && !dynamicallyGeneratedJwtSecret.isEmpty()) {
            this.jwtSecret = dynamicallyGeneratedJwtSecret;
            logger.info("JwtUtils: Using dynamically generated JWT secret.");
        } else if (jwtSecretFromProperties != null && !jwtSecretFromProperties.isEmpty()) {
            this.jwtSecret = jwtSecretFromProperties;
            logger.warn("JwtUtils: Using JWT secret from application.properties. Consider dynamic generation for production.");
        } else {
            // Fallback if neither is provided, though JwtSecretConfig should always provide one.
            // This case should ideally not be hit if JwtSecretConfig is correctly set up.
            this.jwtSecret = generateRandomSecret(32); // Generate a fallback random if nothing is provided
            logger.error("JwtUtils: No JWT secret provided or dynamically generated. Generating a fallback random secret.");
        }
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        String jwt = Jwts.builder()
                .setSubject((userPrincipal.getUsername()))
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
        logger.debug("JwtUtils: Generated JWT for user {}: {}", userPrincipal.getUsername(), jwt);
        return jwt;
    }

    // MODIFIED KEY METHOD: Uses the injected jwtSecret
    private Key key() {
        // Ensure the secret key is long enough (at least 256 bits or 32 characters for HS256)
        if (jwtSecret == null || jwtSecret.length() < 32) {
            logger.error("JwtUtils: JWT secret is too short or null! It must be at least 32 characters for HS256. Current length: {}", jwtSecret != null ? jwtSecret.length() : "null");
            throw new IllegalArgumentException("JWT secret is too short or null.");
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parserBuilder().setSigningKey(key()).build()
                .parseClaimsJws(token).getBody().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key()).build().parse(authToken);
            logger.debug("JwtUtils: Token is valid.");
            return true;
        } catch (MalformedJwtException e) {
            logger.error("JwtUtils: Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JwtUtils: JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JwtUtils: JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JwtUtils: JWT claims string is empty: {}", e.getMessage());
        } catch (SignatureException e) { // Catches signature mismatch
            logger.error("JwtUtils: Invalid JWT signature: {}", e.getMessage());
        }
        return false;
    }

    // Helper method to parse JWT from request header (remains the same)
    public String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7);
            logger.debug("JwtUtils: Parsed JWT from Authorization header.");
            return jwt;
        }
        logger.debug("JwtUtils: No Bearer token found in Authorization header.");
        return null;
    }

    // NEW: Helper method to generate a random secret
    private String generateRandomSecret(int length) {
        byte[] secretBytes = new byte[length];
        new java.security.SecureRandom().nextBytes(secretBytes);
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(secretBytes);
    }
}
