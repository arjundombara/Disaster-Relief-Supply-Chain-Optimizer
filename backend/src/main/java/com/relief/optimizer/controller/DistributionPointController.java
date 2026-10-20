package com.relief.optimizer.controller;

import com.relief.optimizer.dto.DistributionPointDto;
import com.relief.optimizer.service.DistributionPointService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/distribution-points")
@Tag(name = "Distribution Points", description = "Disaster-affected distribution point management")
public class DistributionPointController {

    private final DistributionPointService dpService;

    @Autowired
    public DistributionPointController(DistributionPointService dpService) {
        this.dpService = dpService;
    }

    @GetMapping
    @Operation(summary = "Get all distribution points")
    public ResponseEntity<List<DistributionPointDto>> getAll() {
        return ResponseEntity.ok(dpService.getAllDistributionPoints());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a distribution point by ID")
    public ResponseEntity<DistributionPointDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(dpService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new distribution point")
    public ResponseEntity<DistributionPointDto> create(@Valid @RequestBody DistributionPointDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dpService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a distribution point")
    public ResponseEntity<DistributionPointDto> update(@PathVariable Long id,
                                                        @Valid @RequestBody DistributionPointDto dto) {
        return ResponseEntity.ok(dpService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a distribution point")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dpService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
