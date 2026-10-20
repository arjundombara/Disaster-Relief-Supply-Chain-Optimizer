package com.relief.optimizer.controller;

import com.relief.optimizer.model.IncidentReport;
import com.relief.optimizer.model.Shipment;
import com.relief.optimizer.repository.IncidentReportRepository;
import com.relief.optimizer.repository.ShipmentRepository;
import com.relief.optimizer.exception.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
@Tag(name = "Incident Reports", description = "Field response incident reporting")
public class IncidentController {

    private final IncidentReportRepository incidentRepository;
    private final ShipmentRepository shipmentRepository;

    @Autowired
    public IncidentController(IncidentReportRepository incidentRepository,
                               ShipmentRepository shipmentRepository) {
        this.incidentRepository = incidentRepository;
        this.shipmentRepository = shipmentRepository;
    }

    @GetMapping
    @Operation(summary = "Get all incident reports ordered by date")
    public ResponseEntity<List<IncidentReport>> getAll() {
        return ResponseEntity.ok(incidentRepository.findAllByOrderByReportedAtDesc());
    }

    @GetMapping("/open")
    @Operation(summary = "Get open incident reports")
    public ResponseEntity<List<IncidentReport>> getOpen() {
        return ResponseEntity.ok(incidentRepository.findByStatus("OPEN"));
    }

    @PostMapping
    @Operation(summary = "File a new field incident report")
    public ResponseEntity<IncidentReport> create(@RequestBody Map<String, Object> payload) {
        IncidentReport report = new IncidentReport();
        if (payload.containsKey("shipmentId") && payload.get("shipmentId") != null) {
            Long shipmentId = Long.valueOf(payload.get("shipmentId").toString());
            Shipment shipment = shipmentRepository.findById(shipmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));
            report.setShipment(shipment);
        }
        report.setIncidentType((String) payload.get("incidentType"));
        report.setSeverity(payload.containsKey("severity") ? (String) payload.get("severity") : "MEDIUM");
        report.setDescription((String) payload.get("description"));
        report.setReportedBy((String) payload.get("reportedBy"));
        report.setLocationDescription((String) payload.get("locationDescription"));
        return ResponseEntity.status(HttpStatus.CREATED).body(incidentRepository.save(report));
    }

    @PatchMapping("/{id}/resolve")
    @Operation(summary = "Resolve an incident report")
    public ResponseEntity<IncidentReport> resolve(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        IncidentReport report = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));
        report.setStatus("RESOLVED");
        report.setResolutionNotes(payload.get("resolutionNotes"));
        return ResponseEntity.ok(incidentRepository.save(report));
    }
}
