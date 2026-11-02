package com.relief.optimizer.controller;

import com.relief.optimizer.model.OfficialInstruction;
import com.relief.optimizer.service.InstructionService;
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
@RequestMapping("/api/instructions")
@Tag(name = "Official Instructions", description = "Admin instructions and field worker directives")
public class InstructionController {

    private final InstructionService instructionService;

    @Autowired
    public InstructionController(InstructionService instructionService) {
        this.instructionService = instructionService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all official instructions including drafts and withdrawn (Admin only)")
    public ResponseEntity<List<OfficialInstruction>> getAllInstructions() {
        return ResponseEntity.ok(instructionService.getAllInstructions());
    }

    @GetMapping("/published")
    @Operation(summary = "Get all active published instructions for field workers")
    public ResponseEntity<List<OfficialInstruction>> getPublishedInstructions() {
        return ResponseEntity.ok(instructionService.getPublishedInstructions());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get instruction by ID")
    public ResponseEntity<OfficialInstruction> getById(@PathVariable Long id) {
        return ResponseEntity.ok(instructionService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create and publish a new official instruction (Admin only)")
    public ResponseEntity<OfficialInstruction> create(@Valid @RequestBody OfficialInstruction instruction, Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.status(HttpStatus.CREATED).body(instructionService.create(instruction, admin));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update an official instruction (Admin only)")
    public ResponseEntity<OfficialInstruction> update(@PathVariable Long id, @Valid @RequestBody OfficialInstruction instruction, Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(instructionService.update(id, instruction, admin));
    }

    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Withdraw an official instruction (Admin only)")
    public ResponseEntity<OfficialInstruction> withdraw(@PathVariable Long id, Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "admin";
        return ResponseEntity.ok(instructionService.withdraw(id, admin));
    }

    @PostMapping("/{id}/acknowledge")
    @Operation(summary = "Acknowledge receipt of an official instruction (Worker or Admin)")
    public ResponseEntity<OfficialInstruction> acknowledge(@PathVariable Long id) {
        return ResponseEntity.ok(instructionService.acknowledge(id));
    }
}
