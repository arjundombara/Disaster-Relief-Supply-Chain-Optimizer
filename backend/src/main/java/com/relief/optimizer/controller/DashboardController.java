package com.relief.optimizer.controller;

import com.relief.optimizer.dto.DashboardStatsDto;
import com.relief.optimizer.service.DashboardService;
import com.relief.optimizer.service.DemoDataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "EOC Dashboard", description = "Emergency Operations Center statistics and demo data")
public class DashboardController {

    private final DashboardService dashboardService;
    private final DemoDataService demoDataService;

    @Autowired
    public DashboardController(DashboardService dashboardService, DemoDataService demoDataService) {
        this.dashboardService = dashboardService;
        this.demoDataService = demoDataService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Get live EOC dashboard statistics from backend data")
    public ResponseEntity<DashboardStatsDto> getStats() {
        return ResponseEntity.ok(dashboardService.getDashboardStats());
    }

    @PostMapping("/demo/load")
    @Operation(summary = "Load demo disaster scenario data (idempotent)")
    public ResponseEntity<Map<String, String>> loadDemo() {
        String message = demoDataService.loadDemoData();
        return ResponseEntity.ok(Map.of("message", message));
    }

    @DeleteMapping("/demo/reset")
    @Operation(summary = "Reset (remove) demo disaster scenario data")
    public ResponseEntity<Map<String, String>> resetDemo() {
        demoDataService.resetDemoData();
        return ResponseEntity.ok(Map.of("message", "Demo data removed successfully"));
    }
}
