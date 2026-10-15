package com.kohort.ems.controller;

import com.kohort.ems.dto.ApiResponseDTO;
import com.kohort.ems.dto.LoginRequestDTO;
import com.kohort.ems.dto.LoginResponseDTO;
import com.kohort.ems.dto.RegisterRequestDTO;
import com.kohort.ems.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Endpoints for user login and registration")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    @Operation(summary = "Login to the system", description = "Authenticates user credentials and returns a JWT Bearer token")
    public ResponseEntity<ApiResponseDTO<LoginResponseDTO>> login(@Valid @RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        return ResponseEntity.ok(ApiResponseDTO.ok("Authentication successful", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new admin user", description = "Creates a new user account with BCrypt encrypted password")
    public ResponseEntity<ApiResponseDTO<String>> register(@Valid @RequestBody RegisterRequestDTO request) {
        ApiResponseDTO<String> response = authService.register(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
