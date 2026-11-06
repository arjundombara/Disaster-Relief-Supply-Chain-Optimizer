package com.relief.optimizer.controller;

import com.relief.optimizer.dto.CreateWorkerRequestDto;
import com.relief.optimizer.dto.UserDto;
import com.relief.optimizer.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "Admin user and worker management endpoints")
public class UserController {

    private final UserService userService;

    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/workers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all registered relief workers (Admin only)")
    public ResponseEntity<List<UserDto>> getAllWorkers() {
        return ResponseEntity.ok(userService.getAllWorkers());
    }

    @PostMapping("/workers")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new worker account (Admin only)")
    public ResponseEntity<UserDto> createWorker(@Valid @RequestBody CreateWorkerRequestDto request) {
        UserDto worker = userService.createWorker(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(worker);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    @Operation(summary = "Get user profile by ID")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Enable or disable a user account (Admin only)")
    public ResponseEntity<UserDto> toggleUserStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> payload) {
        boolean active = Boolean.TRUE.equals(payload.get("active"));
        return ResponseEntity.ok(userService.toggleUserActiveStatus(id, active));
    }

    @PatchMapping("/{id}/assignment")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update worker assigned depot or distribution point (Admin only)")
    public ResponseEntity<UserDto> updateWorkerAssignment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        Long depotId = payload.get("assignedDepotId") != null ? Long.valueOf(payload.get("assignedDepotId").toString()) : null;
        Long locationId = payload.get("assignedLocationId") != null ? Long.valueOf(payload.get("assignedLocationId").toString()) : null;
        return ResponseEntity.ok(userService.updateWorkerAssignment(id, depotId, locationId));
    }

    @GetMapping({"", "/requests"})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users / worker requests (Admin only)")
    public ResponseEntity<List<UserDto>> getAllUserRequests() {
        return ResponseEntity.ok(userService.getAllWorkers());
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve a worker registration request (Admin only)")
    public ResponseEntity<UserDto> approveWorker(@PathVariable Long id) {
        return ResponseEntity.ok(userService.approveWorker(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject a worker registration request (Admin only)")
    public ResponseEntity<UserDto> rejectWorker(@PathVariable Long id) {
        return ResponseEntity.ok(userService.rejectWorker(id));
    }

    @PatchMapping("/{id}/approval")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update worker approval status (Admin only)")
    public ResponseEntity<UserDto> updateApprovalStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String statusStr = payload.get("status");
        if (statusStr == null || statusStr.trim().isEmpty()) {
            throw new com.relief.optimizer.exception.ValidationException("Status parameter is required");
        }
        com.relief.optimizer.model.WorkerApprovalStatus status =
                com.relief.optimizer.model.WorkerApprovalStatus.valueOf(statusStr.trim().toUpperCase());
        return ResponseEntity.ok(userService.updateWorkerApprovalStatus(id, status));
    }
}
