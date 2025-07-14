// src/main/java/com/example/backend/security/jwt/AuthTokenFilter.java
package com.example.backend.security.jwt;

import com.example.backend.security.services.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.util.StringUtils; // Import StringUtils

import java.io.IOException;

public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request); // Use the local parseJwt method for consistency

            if (jwt != null) {
                logger.debug("AuthTokenFilter: JWT found in request. Attempting validation...");
                if (jwtUtils.validateJwtToken(jwt)) {
                    String username = jwtUtils.getUserNameFromJwtToken(jwt);
                    logger.debug("AuthTokenFilter: JWT valid for user: {}", username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("AuthTokenFilter: User '{}' authenticated. Roles: {}", username, userDetails.getAuthorities());
                } else {
                    logger.warn("AuthTokenFilter: JWT validation failed for token: {}", jwt);
                }
            } else {
                logger.debug("AuthTokenFilter: No JWT token found in request for path: {}", request.getRequestURI());
            }
        } catch (Exception e) {
            logger.error("AuthTokenFilter: Cannot set user authentication: {}", e.getMessage(), e);
        }

        filterChain.doFilter(request, response);
    }

    // Helper method to parse JWT from request header
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String jwt = headerAuth.substring(7);
            logger.debug("AuthTokenFilter: Extracted JWT from Authorization header: {}", jwt);
            return jwt;
        }
        logger.debug("AuthTokenFilter: No Bearer token found in Authorization header.");
        return null;
    }
}
