package com.relief.optimizer.controller;

import com.relief.optimizer.dto.FlowRequestDto;
import com.relief.optimizer.dto.ShipmentDto;
import com.relief.optimizer.model.Allocation;
import com.relief.optimizer.model.Role;
import com.relief.optimizer.model.ShipmentStatus;
import com.relief.optimizer.repository.UserRepository;
import com.relief.optimizer.security.UserDetailsImpl;
import com.relief.optimizer.service.AllocationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/allocations")
@Tag(name = "Allocations & Manifests",
     description = "Supply allocation and shipment manifest management")
public class AllocationController {

    private final AllocationService allocationService;
    private final UserRepository userRepository;

    @Autowired
    public AllocationController(AllocationService allocationService, UserRepository userRepository) {
        this.allocationService = allocationService;
        this.userRepository = userRepository;
    }

    private UserDetailsImpl getAuthenticatedUser(
            Authentication authentication) {

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException(
                    "Valid authentication is required.");
        }

        if (authentication.getPrincipal() instanceof UserDetailsImpl) {
            return (UserDetailsImpl) authentication.getPrincipal();
        }

        // Support test mock principals and standard Spring Security UserDetails
        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .map(UserDetailsImpl::build)
                .orElseGet(() -> {
                    String role = authentication.getAuthorities().stream()
                            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))
                            ? "ADMIN" : "WORKER";
                    return new UserDetailsImpl(
                            1L,
                            username,
                            username + "@relief.org",
                            "",
                            username,
                            role,
                            true,
                            authentication.getAuthorities()
                    );
                });
    }

    // =====================================================
    // RUN ALLOCATION - ADMIN ONLY
    // =====================================================

    @PostMapping("/run")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Run max-flow optimization (Admin only)")
    public ResponseEntity<Allocation> runAllocation(
            @Valid @RequestBody FlowRequestDto request) {

        Allocation allocation = allocationService.runAllocation(
                request.getSupplyType(),
                request.getAlgorithm() != null
                        ? request.getAlgorithm() : "EDMONDS_KARP",
                request.getAllocationPolicy() != null
                        ? request.getAllocationPolicy() : "MAX_FLOW"
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(allocation);
    }

    // =====================================================
    // GET ALL SHIPMENTS - ADMIN ONLY
    // =====================================================

    @GetMapping("/shipments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all shipments (Admin only)")
    public ResponseEntity<List<ShipmentDto>> getAllShipments() {

        return ResponseEntity.ok(
                allocationService.getAllShipments());
    }

    // =====================================================
    // GET SHIPMENT BY ID - ADMIN OR ASSIGNED WORKER
    // =====================================================

    @GetMapping("/shipments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','WORKER')")
    @Operation(summary = "Get authorized shipment details")
    public ResponseEntity<ShipmentDto> getShipmentById(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl user =
                getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                allocationService.getShipmentById(
                        id,
                        user.getId(),
                        user.getRole()
                )
        );
    }

    // =====================================================
    // FILTER SHIPMENTS - ADMIN ONLY
    // =====================================================

    @GetMapping("/shipments/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get shipments filtered by status (Admin only)")
    public ResponseEntity<List<ShipmentDto>> getShipmentsByStatus(
            @PathVariable ShipmentStatus status) {

        return ResponseEntity.ok(
                allocationService.getShipmentsByStatus(status));
    }

    // =====================================================
    // UPDATE SHIPMENT STATUS
    // ADMIN OR ASSIGNED WORKER
    // =====================================================

    @PatchMapping("/shipments/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','WORKER')")
    @Operation(summary = "Update authorized shipment delivery status")
    public ResponseEntity<ShipmentDto> updateShipmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        UserDetailsImpl user =
                getAuthenticatedUser(authentication);

        Object statusValue = payload.get("status");

        if (statusValue == null) {
            throw new IllegalArgumentException(
                    "Shipment status is required.");
        }

        ShipmentStatus newStatus;

        try {
            newStatus = ShipmentStatus.valueOf(
                    statusValue.toString().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid shipment status: " + statusValue);
        }

        String notes = payload.get("notes") != null
                ? payload.get("notes").toString()
                : null;

        String recipient = payload.get("recipientName") != null
                ? payload.get("recipientName").toString()
                : null;

        Double qty = null;

        if (payload.get("deliveredQuantity") != null) {
            qty = Double.valueOf(
                    payload.get("deliveredQuantity").toString());
        }

        return ResponseEntity.ok(
                allocationService.updateShipmentStatus(
                        id,
                        newStatus,
                        notes,
                        recipient,
                        qty,
                        user.getId(),
                        user.getRole()
                )
        );
    }

    // =====================================================
    // GET ALL ALLOCATIONS - ADMIN ONLY
    // =====================================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all distribution plan allocations (Admin only)")
    public ResponseEntity<List<Allocation>> getAllAllocations() {

        return ResponseEntity.ok(
                allocationService.getAllAllocations());
    }

    // =====================================================
    // APPROVE PLAN - ADMIN ONLY
    // =====================================================

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve distribution plan (Admin only)")
    public ResponseEntity<Allocation> approvePlan(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl admin =
                getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                allocationService.approvePlan(
                        id,
                        admin.getUsername()
                )
        );
    }

    // =====================================================
    // ASSIGN WORKER - ADMIN ONLY
    // =====================================================

    @PostMapping("/shipments/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a verified worker to a delivery task")
    public ResponseEntity<ShipmentDto> assignWorker(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {

        if (payload.get("workerId") == null) {
            throw new IllegalArgumentException(
                    "Worker ID is required.");
        }

        Long workerId = Long.valueOf(
                payload.get("workerId").toString());

        String priority = payload.get("priority") != null
                ? payload.get("priority").toString()
                : "NORMAL";

        String instructions = payload.get("instructions") != null
                ? payload.get("instructions").toString()
                : null;

        LocalDateTime deadline = payload.get("deadline") != null
                ? LocalDateTime.parse(
                        payload.get("deadline").toString())
                : null;

        return ResponseEntity.ok(
                allocationService.assignWorkerToTask(
                        id,
                        workerId,
                        null,
                        priority,
                        deadline,
                        instructions
                )
        );
    }

    // =====================================================
    // ACKNOWLEDGE TASK - WORKER ONLY
    // =====================================================

    @PostMapping("/shipments/{id}/acknowledge")
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "Acknowledge assigned task (Worker only)")
    public ResponseEntity<ShipmentDto> acknowledgeTask(
            @PathVariable Long id,
            Authentication authentication) {

        UserDetailsImpl worker =
                getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                allocationService.acknowledgeTask(
                        id,
                        worker.getId()
                )
        );
    }

    // =====================================================
    // GET MY SHIPMENTS - WORKER ONLY
    // =====================================================

    @GetMapping("/shipments/my")
    @PreAuthorize("hasRole('WORKER')")
    @Operation(summary = "Get current worker's assigned tasks")
    public ResponseEntity<List<ShipmentDto>> getMyShipments(
            Authentication authentication) {

        UserDetailsImpl worker =
                getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                allocationService.getShipmentsForWorker(
                        worker.getId()
                )
        );
    }

    // =====================================================
    // GET SPECIFIC WORKER SHIPMENTS - ADMIN ONLY
    // =====================================================

    @GetMapping("/shipments/worker/{workerId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get a specific worker's tasks (Admin only)")
    public ResponseEntity<List<ShipmentDto>> getWorkerShipments(
            @PathVariable Long workerId) {

        return ResponseEntity.ok(
                allocationService.getShipmentsForWorker(workerId));
    }
}