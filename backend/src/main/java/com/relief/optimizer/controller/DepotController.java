package com.relief.optimizer.controller;

import com.relief.optimizer.dto.DepotDto;
import com.relief.optimizer.model.SupplyType;
import com.relief.optimizer.service.DepotService;
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
@RequestMapping("/api/depots")
@Tag(name = "Depots", description = "Central relief depot management")
public class DepotController {

    private final DepotService depotService;

    @Autowired
    public DepotController(DepotService depotService) {
        this.depotService = depotService;
    }

    @GetMapping
    @Operation(summary = "Get all depots")
    public ResponseEntity<List<DepotDto>> getAllDepots() {
        return ResponseEntity.ok(depotService.getAllDepots());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get depot by ID")
    public ResponseEntity<DepotDto> getDepotById(@PathVariable Long id) {
        return ResponseEntity.ok(depotService.getDepotById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new depot")
    public ResponseEntity<DepotDto> createDepot(@Valid @RequestBody DepotDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(depotService.createDepot(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing depot")
    public ResponseEntity<DepotDto> updateDepot(@PathVariable Long id, @Valid @RequestBody DepotDto dto) {
        return ResponseEntity.ok(depotService.updateDepot(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a depot")
    public ResponseEntity<Void> deleteDepot(@PathVariable Long id) {
        depotService.deleteDepot(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/inventory")
    @Operation(summary = "Update a specific supply inventory quantity")
    public ResponseEntity<DepotDto> updateInventory(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        SupplyType supplyType = SupplyType.valueOf((String) payload.get("supplyType"));
        Double quantity = Double.valueOf(payload.get("quantity").toString());
        return ResponseEntity.ok(depotService.updateInventory(id, supplyType, quantity));
    }
}
