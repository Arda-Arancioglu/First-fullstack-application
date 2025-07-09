// src/main/java/com/example/backend/dto/LoginRequest.java
package com.example.backend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
}
