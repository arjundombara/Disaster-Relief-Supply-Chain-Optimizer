package com.relief.optimizer.controller;

import com.relief.optimizer.dto.FlowRequestDto;
import com.relief.optimizer.dto.ShipmentDto;
import com.relief.optimizer.model.Allocation;
import com.relief.optimizer.model.ShipmentStatus;
import com.relief.optimizer.service.AllocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/allocations")
@Tag(name = "Allocations & Manifests", description = "Supply allocation and shipment manifest management")
public class AllocationController {

    private final AllocationService allocationService;

    @Autowired
    public AllocationController(AllocationService allocationService) {
        this.allocationService = allocationService;
    }

    @PostMapping("/run")
    @Operation(summary = "Run max-flow optimization and generate allocation with shipment manifests")
    public ResponseEntity<Allocation> runAllocation(@Valid @RequestBody FlowRequestDto request) {
        Allocation allocation = allocationService.runAllocation(
                request.getSupplyType(),
                request.getAlgorithm() != null ? request.getAlgorithm() : "EDMONDS_KARP",
                request.getAllocationPolicy() != null ? request.getAllocationPolicy() : "MAX_FLOW"
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(allocation);
    }

    @GetMapping("/shipments")
    @Operation(summary = "Get all shipments ordered by creation date descending")
    public ResponseEntity<List<ShipmentDto>> getAllShipments() {
        return ResponseEntity.ok(allocationService.getAllShipments());
    }

    @GetMapping("/shipments/{id}")
    @Operation(summary = "Get a shipment by ID")
    public ResponseEntity<ShipmentDto> getShipmentById(@PathVariable Long id) {
        return ResponseEntity.ok(allocationService.getShipmentById(id));
    }

    @GetMapping("/shipments/status/{status}")
    @Operation(summary = "Get shipments filtered by status")
    public ResponseEntity<List<ShipmentDto>> getShipmentsByStatus(@PathVariable ShipmentStatus status) {
        return ResponseEntity.ok(allocationService.getShipmentsByStatus(status));
    }

    @PatchMapping("/shipments/{id}/status")
    @Operation(summary = "Update shipment status with optional delivery notes and recipient")
    public ResponseEntity<ShipmentDto> updateShipmentStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        ShipmentStatus newStatus = ShipmentStatus.valueOf((String) payload.get("status"));
        String notes = (String) payload.get("notes");
        String recipient = (String) payload.get("recipientName");
        Double qty = payload.containsKey("deliveredQuantity")
                ? Double.valueOf(payload.get("deliveredQuantity").toString()) : null;
        return ResponseEntity.ok(allocationService.updateShipmentStatus(id, newStatus, notes, recipient, qty));
    }

    @GetMapping

    @Operation(summary = "Get all distribution plan allocations")
    public ResponseEntity<List<Allocation>> getAllAllocations() {
        return ResponseEntity.ok(allocationService.getAllAllocations());
    }

    @PostMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve distribution plan and reserve required depot supplies (Admin only)")
    public ResponseEntity<Allocation> approvePlan(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(allocationService.approvePlan(id, admin));
    }

    @PostMapping("/shipments/{id}/assign")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign a worker to a delivery task (Admin only)")
    public ResponseEntity<ShipmentDto> assignWorker(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        Long workerId = Long.valueOf(payload.get("workerId").toString());
        String workerName = (String) payload.get("workerName");
        String priority = (String) payload.get("priority");
        String instructions = (String) payload.get("instructions");
        java.time.LocalDateTime deadline = payload.get("deadline") != null
                ? java.time.LocalDateTime.parse(payload.get("deadline").toString()) : null;

        return ResponseEntity.ok(allocationService.assignWorkerToTask(id, workerId, workerName, priority, deadline, instructions));
    }

    @PostMapping("/shipments/{id}/acknowledge")
    @Operation(summary = "Acknowledge task assignment (Field Worker)")
    public ResponseEntity<ShipmentDto> acknowledgeTask(@PathVariable Long id, org.springframework.security.core.Authentication authentication) {
        Long workerId = 1L; // fallback
        if (authentication != null && authentication.getPrincipal() instanceof com.relief.optimizer.security.UserDetailsImpl) {
            workerId = ((com.relief.optimizer.security.UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return ResponseEntity.ok(allocationService.acknowledgeTask(id, workerId));
    }

    @GetMapping("/shipments/my")
    @Operation(summary = "Get delivery tasks assigned to the current authenticated worker")
    public ResponseEntity<List<ShipmentDto>> getMyShipments(org.springframework.security.core.Authentication authentication) {
        Long workerId = 1L;
        if (authentication != null && authentication.getPrincipal() instanceof com.relief.optimizer.security.UserDetailsImpl) {
            workerId = ((com.relief.optimizer.security.UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        return ResponseEntity.ok(allocationService.getShipmentsForWorker(workerId));
    }

    @GetMapping("/shipments/worker/{workerId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get tasks assigned to a specific worker (Admin only)")
    public ResponseEntity<List<ShipmentDto>> getWorkerShipments(@PathVariable Long workerId) {
        return ResponseEntity.ok(allocationService.getShipmentsForWorker(workerId));
    }
}

