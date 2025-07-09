// src/main/java/com/example/backend/controller/AuthController.java
package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepo;

    public AuthController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        return userRepo.findByUsername(req.getUsername())
                .filter(user -> user.getPassword().equals(req.getPassword()))
                .map(user -> ResponseEntity.ok().body("OK"))
                .orElseGet(() -> ResponseEntity
                        .status(401)
                        .body("Invalid credentials"));
    }
}
