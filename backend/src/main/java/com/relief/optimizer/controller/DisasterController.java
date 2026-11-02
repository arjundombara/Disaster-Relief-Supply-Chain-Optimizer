package com.relief.optimizer.controller;

import com.relief.optimizer.model.Disaster;
import com.relief.optimizer.service.DisasterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/disasters")
@Tag(name = "Disaster Management", description = "Disaster incident tracking and updates")
public class DisasterController {

    private final DisasterService disasterService;

    @Autowired
    public DisasterController(DisasterService disasterService) {
        this.disasterService = disasterService;
    }

    @GetMapping
    @Operation(summary = "Get all disaster records ordered by report time descending")
    public ResponseEntity<List<Disaster>> getAllDisasters() {
        return ResponseEntity.ok(disasterService.getAllDisasters());
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active (non-closed) disasters")
    public ResponseEntity<List<Disaster>> getActiveDisasters() {
        return ResponseEntity.ok(disasterService.getActiveDisasters());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a disaster record by ID")
    public ResponseEntity<Disaster> getDisasterById(@PathVariable Long id) {
        return ResponseEntity.ok(disasterService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new disaster record (Admin only)")
    public ResponseEntity<Disaster> createDisaster(@Valid @RequestBody Disaster disaster, Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.status(HttpStatus.CREATED).body(disasterService.create(disaster, admin));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an existing disaster record (Admin only)")
    public ResponseEntity<Disaster> updateDisaster(@PathVariable Long id, @Valid @RequestBody Disaster disaster, Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(disasterService.update(id, disaster, admin));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Close a disaster incident (Admin only)")
    public ResponseEntity<Disaster> closeDisaster(@PathVariable Long id, Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "system";
        return ResponseEntity.ok(disasterService.closeDisaster(id, admin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a disaster record (Admin only)")
    public ResponseEntity<Void> deleteDisaster(@PathVariable Long id) {
        disasterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
