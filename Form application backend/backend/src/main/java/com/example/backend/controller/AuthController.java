package com.example.backend.controller;

import com.example.backend.dto.LoginRequest;
import com.example.backend.dto.LoginResponse;
import com.example.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity; // Import ResponseEntity
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepo;

    public AuthController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/login")
    // Explicitly define the generic type of ResponseEntity to be LoginResponse
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        return userRepo.findByUsername(req.getUsername())
                .filter(user -> user.getPassword().equals(req.getPassword()))
                .map(user -> ResponseEntity.ok(new LoginResponse(user.getId(), user.getUsername())))
                // In the error case, return a ResponseEntity of type LoginResponse,
                // but with a null body. This makes the types consistent.
                .orElseGet(() -> ResponseEntity.status(401).body(null));
    }

}