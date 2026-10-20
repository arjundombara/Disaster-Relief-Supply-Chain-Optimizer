package com.relief.optimizer.controller;

import com.relief.optimizer.dto.RouteDto;
import com.relief.optimizer.service.RouteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/routes")
@Tag(name = "Routes", description = "Transportation route management")
public class RouteController {

    private final RouteService routeService;

    @Autowired
    public RouteController(RouteService routeService) {
        this.routeService = routeService;
    }

    @GetMapping
    @Operation(summary = "Get all routes")
    public ResponseEntity<List<RouteDto>> getAll() {
        return ResponseEntity.ok(routeService.getAllRoutes());
    }

    @GetMapping("/available")
    @Operation(summary = "Get only available routes")
    public ResponseEntity<List<RouteDto>> getAvailable() {
        return ResponseEntity.ok(routeService.getAvailableRoutes());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a route by ID")
    public ResponseEntity<RouteDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(routeService.getById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new route")
    public ResponseEntity<RouteDto> create(@Valid @RequestBody RouteDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(routeService.create(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a route")
    public ResponseEntity<RouteDto> update(@PathVariable Long id, @Valid @RequestBody RouteDto dto) {
        return ResponseEntity.ok(routeService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a route")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        routeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
