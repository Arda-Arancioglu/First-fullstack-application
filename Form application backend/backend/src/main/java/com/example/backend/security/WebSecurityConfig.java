// src/main/java/com/example/backend/security/WebSecurityConfig.java
package com.example.backend.security;

import com.example.backend.security.jwt.AuthEntryPointJwt;
import com.example.backend.security.jwt.AuthTokenFilter;
import com.example.backend.security.services.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity // Enables @PreAuthorize, @PostAuthorize, @Secured, @RolesAllowed
public class WebSecurityConfig {

    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    private AuthEntryPointJwt unauthorizedHandler;

    // --- Security Component Beans ---

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // --- CORS Configuration Bean ---

    /**
     * Defines the global CORS configuration for the application.
     * This bean will be used by the CorsFilter.
     * @return CorsConfigurationSource
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow requests from your React frontend
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173"));
        // Allow common HTTP methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // Allow specific headers, including Authorization for JWT
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        // Allow credentials (like cookies or Authorization headers) to be sent
        configuration.setAllowCredentials(true);
        // Register this CORS configuration for all paths (/**)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Explicitly registers a CorsFilter bean. Spring Boot automatically
     * adds this bean very early in the filter chain, which is crucial
     * for handling CORS preflight (OPTIONS) requests correctly.
     * @return CorsFilter
     */
    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }

    // --- Security Filter Chain Definitions ---



    /**
     * Defines the main SecurityFilterChain for the rest of the application's endpoints.
     * This chain handles JWT authentication and authorization for protected resources.
     * @param http HttpSecurity for configuration.
     * @return The configured SecurityFilterChain.
     * @throws Exception if configuration fails.
     */
    @Bean
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS for this filter chain using the defined CorsConfigurationSource bean.
                // This ensures CORS headers are applied correctly for API requests.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF for stateless APIs using JWT.
                .csrf(AbstractHttpConfigurer::disable)
                // Configure exception handling for unauthorized access.
                .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                // Configure session management to be stateless, as JWTs handle authentication per request.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Configure authorization rules for HTTP requests.
                .authorizeHttpRequests(auth -> auth
                        // Allow unauthenticated access to authentication endpoints (login/register).
                        .requestMatchers("/api/auth/**").permitAll()
                        // Allow unauthenticated access to a public test endpoint (if you have one).
                        .requestMatchers("/api/test/all").permitAll()
                        // All other requests require authentication.
                        .anyRequest().authenticated()
                );

        // For frames (e.g., if embedding content), set X-Frame-Options to SAMEORIGIN.
        // Note: H2 console is ignored by webSecurityCustomizer, so this applies to other potential iframes.
        http.headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin));

        // Configure the authentication provider for this security chain.
        http.authenticationProvider(authenticationProvider());
        // Add our custom JWT authentication filter before Spring Security's default UsernamePasswordAuthenticationFilter.
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
