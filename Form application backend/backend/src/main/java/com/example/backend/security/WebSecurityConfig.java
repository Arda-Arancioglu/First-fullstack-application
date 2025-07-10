// src/main/java/com/example/backend/security/WebSecurityConfig.java
package com.example.backend.security;

// Re-added JWT-related imports because AuthController still uses some of these beans
import com.example.backend.security.jwt.AuthEntryPointJwt;
import com.example.backend.security.jwt.AuthTokenFilter; // Although not used in filter chain, kept for compilation
import com.example.backend.security.services.UserDetailsServiceImpl; // Re-added for DaoAuthenticationProvider

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
// Re-added authentication-related imports
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
// Re-added password encoder
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
// Re-added UsernamePasswordAuthenticationFilter for compilation if AuthTokenFilter uses it
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableMethodSecurity // Can be kept, but its annotations won't apply if all requests are permitted
public class WebSecurityConfig {

    // Re-added autowired dependencies for security components
    @Autowired
    UserDetailsServiceImpl userDetailsService;
    @Autowired
    private AuthEntryPointJwt unauthorizedHandler; // Still needed if AuthController references it

    // Re-added security-related beans to satisfy dependencies
    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService); // Requires UserDetailsService
        authProvider.setPasswordEncoder(passwordEncoder()); // Requires PasswordEncoder
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

    /**
     * Defines the single SecurityFilterChain that permits all requests.
     * All authentication and authorization are temporarily disabled.
     *
     * @param http HttpSecurity for configuration.
     * @return The configured SecurityFilterChain.
     * @throws Exception if configuration fails.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS using the defined CorsFilter bean (applied implicitly by Spring Boot)
                .cors(AbstractHttpConfigurer::disable) // Disable the default CORS configurer to rely on CorsFilter bean
                // Allow H2 Console frames (FOR DEVELOPMENT ONLY!)
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for stateless APIs
                // Removed exception handling for unauthorized access, as all requests are permitted
                // .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
                // Removed session management as it's tied to stateless JWT
                // .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Permit all requests to all paths
                        .anyRequest().permitAll()
                );

        // IMPORTANT: These lines are re-added to satisfy bean dependencies,
        // but they will not enforce security due to .anyRequest().permitAll()
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // This bean defines the CORS configuration (STILL NEEDED for browser compatibility)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5173")); // Your React app's port
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    // Explicitly register CorsFilter to ensure it runs early in the filter chain (STILL NEEDED)
    @Bean
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}
