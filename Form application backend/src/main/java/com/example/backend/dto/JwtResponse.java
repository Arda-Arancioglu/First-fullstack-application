package com.example.backend.dto;

public class JwtResponse {
    private String token;
    private Long userId;
    private String username;

    public JwtResponse(String token, Long userId, String username) {
        this.token = token;
        this.userId = userId;
        this.username = username;
    }

    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public String getUsername() { return username; }
}
