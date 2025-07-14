// AuthTokenFilter.java
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
            logger.debug("AuthTokenFilter: Processing request for URI: {}", request.getRequestURI());
            String jwt = jwtUtils.parseJwt(request);

            if (jwt != null) {
                logger.debug("AuthTokenFilter: JWT found: {}", jwt.substring(0, Math.min(jwt.length(), 20)) + "..."); // Log first 20 chars
                if (jwtUtils.validateJwtToken(jwt)) {
                    logger.debug("AuthTokenFilter: JWT is valid.");
                    String username = jwtUtils.getUserNameFromJwtToken(jwt);
                    logger.debug("AuthTokenFilter: Username from JWT: {}", username);

                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    logger.debug("AuthTokenFilter: UserDetails loaded for username: {}", userDetails.getUsername());

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null, // Credentials (password) are not needed here as the user is already authenticated via JWT
                                    userDetails.getAuthorities()); // User's roles/authorities

                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    logger.debug("AuthTokenFilter: Authentication set in SecurityContextHolder for user: {}", username);
                } else {
                    logger.warn("AuthTokenFilter: JWT validation failed for token: {}", jwt.substring(0, Math.min(jwt.length(), 20)) + "...");
                }
            } else {
                logger.debug("AuthTokenFilter: No JWT found in request.");
            }
        } catch (Exception e) {
            logger.error("AuthTokenFilter: Cannot set user authentication: {}", e.getMessage(), e); // Log full stack trace
        }

        filterChain.doFilter(request, response);
    }
}
