package com.relief.optimizer.controller;

import com.relief.optimizer.dto.*;
import com.relief.optimizer.model.Role;
import com.relief.optimizer.repository.UserRepository;
import com.relief.optimizer.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "User authentication and setup endpoints")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepository;

    @Autowired
    public AuthController(UserService userService, UserRepository userRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user (Admin or Worker) and return JWT bearer token")
    public ResponseEntity<LoginResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        LoginResponseDto response = userService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/has-admin")
    @Operation(summary = "Check whether an administrator account has already been initialized")
    public ResponseEntity<Map<String, Boolean>> hasAdmin() {
        boolean hasAdmin = userRepository.existsByRole(Role.ADMIN);
        return ResponseEntity.ok(Collections.singletonMap("hasAdmin", hasAdmin));
    }

    @PostMapping("/setup-admin")
    @Operation(summary = "Setup initial administrator account (allowed only if no admin exists)")
    public ResponseEntity<UserDto> setupAdmin(@Valid @RequestBody SetupAdminRequestDto request) {
        UserDto admin = userService.setupInitialAdmin(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(admin);
    }

    @PostMapping("/register-worker")
    @Operation(summary = "Self-register a new field worker account (only creates WORKER role)")
    public ResponseEntity<UserDto> registerWorker(@Valid @RequestBody CreateWorkerRequestDto request) {
        UserDto worker = userService.createWorker(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(worker);
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDto user = userService.getCurrentUser(authentication.getName());
        return ResponseEntity.ok(user);
    }
}
