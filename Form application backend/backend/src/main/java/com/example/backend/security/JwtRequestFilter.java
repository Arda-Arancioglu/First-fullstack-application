package com.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User; // Spring Security's User
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Arrays; // Import for Arrays.asList
import java.util.List;   // Import for List

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    // Define paths that should be excluded from JWT processing
    // Requests to these paths will bypass JWT token validation
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
            "/login",        // Your authentication endpoint (for initial login, no JWT yet)
            "/register",     // Your registration endpoint (if you create one later, no JWT needed)
            "/h2-console"    // H2 Console URL (no JWT needed)
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        // Get the current request URI
        String requestUri = request.getRequestURI();

        // Check if the current request path should be excluded from JWT processing
        boolean isExcluded = false;
        for (String excludedPath : EXCLUDED_PATHS) {
            // Using startsWith to handle paths like /h2-console/login.do, /h2-console/something else
            // or /login/ and /login/some-param if you had such a route
            if (requestUri.startsWith(excludedPath)) {
                isExcluded = true;
                break;
            }
        }

        // If the path is excluded, skip JWT processing and proceed with the filter chain
        if (isExcluded) {
            chain.doFilter(request, response);
            return; // Important: return immediately after continuing the chain
        }

        // --- Start of JWT processing for non-excluded (protected) paths ---

        final String authHeader = request.getHeader("Authorization");

        // Check if Authorization header exists and starts with "Bearer "
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            final String token = authHeader.substring(7); // Extract the token (after "Bearer ")
            String username = null;

            try {
                username = jwtUtil.extractUsername(token); // Extract username from token
            } catch (Exception e) {
                // Log or handle token parsing exceptions (e.g., malformed token, expired token)
                System.err.println("Error extracting username from token: " + e.getMessage());
                // Do not set authentication if there's an error
            }

            // If username is extracted and no authentication is already set in the SecurityContext
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Validate the token (checks expiration, signature etc.)
                if (jwtUtil.validateToken(token)) {
                    // Create an Authentication object for Spring Security context
                    // We use Spring Security's User object. Password is not needed here
                    // as the user is authenticated via JWT. Roles/Authorities would go in the Collections.
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    new User(username, "", Collections.emptyList()), // principal (username, no password needed)
                                    null, // credentials (not needed for JWT auth, token is the credential)
                                    Collections.emptyList() // authorities/roles (if parsed from JWT claims)
                            );

                    // Set details for the authentication object (e.g., remote IP address)
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Set the Authentication object in the SecurityContext
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        // Continue the filter chain
        chain.doFilter(request, response);
    }
}