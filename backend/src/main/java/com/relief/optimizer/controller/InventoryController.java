package com.relief.optimizer.controller;

import com.relief.optimizer.model.Inventory;
import com.relief.optimizer.model.InventoryTransaction;
import com.relief.optimizer.model.SupplyType;
import com.relief.optimizer.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@Tag(name = "Inventory & Ledger", description = "Depot stock tracking and immutable ledger transactions")
public class InventoryController {

    private final InventoryService inventoryService;

    @Autowired
    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get complete inventory transaction ledger history (Admin only)")
    public ResponseEntity<List<InventoryTransaction>> getAllTransactions(@RequestParam(required = false) Long depotId) {
        return ResponseEntity.ok(inventoryService.getTransactionHistory(depotId));
    }

    @PostMapping("/incoming")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Receive incoming stock at a depot (Admin only)")
    public ResponseEntity<Inventory> addIncomingStock(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        Long depotId = Long.valueOf(payload.get("depotId").toString());
        SupplyType supplyType = SupplyType.valueOf(payload.get("supplyType").toString());
        Double quantity = Double.valueOf(payload.get("quantity").toString());
        String reason = (String) payload.get("reason");
        String admin = authentication != null ? authentication.getName() : "admin";

        return ResponseEntity.ok(inventoryService.addIncomingStock(depotId, supplyType, quantity, reason, admin));
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Perform an audited administrative stock adjustment (Admin only)")
    public ResponseEntity<Inventory> adjustStock(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        Long depotId = Long.valueOf(payload.get("depotId").toString());
        SupplyType supplyType = SupplyType.valueOf(payload.get("supplyType").toString());
        Double quantity = Double.valueOf(payload.get("quantity").toString());
        String reason = (String) payload.get("reason");
        String admin = authentication != null ? authentication.getName() : "admin";

        return ResponseEntity.ok(inventoryService.adjustStock(depotId, supplyType, quantity, reason, admin));
    }
}
