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
}
