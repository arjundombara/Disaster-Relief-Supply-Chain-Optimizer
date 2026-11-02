package com.relief.optimizer.controller;

import com.relief.optimizer.model.DeliveryReport;
import com.relief.optimizer.model.DeliveryReport.ReportStatus;
import com.relief.optimizer.model.User;
import com.relief.optimizer.repository.UserRepository;
import com.relief.optimizer.service.DeliveryReportService;
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
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Delivery Reports & Approvals", description = "Worker delivery reports and Admin approval workflow")
public class DeliveryReportController {

    private final DeliveryReportService reportService;
    private final UserRepository userRepository;

    @Autowired
    public DeliveryReportController(DeliveryReportService reportService, UserRepository userRepository) {
        this.reportService = reportService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @Operation(summary = "Submit a delivery report for a task (Field Worker)")
    public ResponseEntity<DeliveryReport> submitReport(@Valid @RequestBody DeliveryReport report, Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "worker1";
        User worker = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated worker not found in registry"));
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.submitReport(report, worker));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all delivery reports across all workers (Admin only)")
    public ResponseEntity<List<DeliveryReport>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all reports awaiting administrative approval (Admin only)")
    public ResponseEntity<List<DeliveryReport>> getPendingReports() {
        return ResponseEntity.ok(reportService.getReportsByStatus(ReportStatus.PENDING_APPROVAL));
    }

    @GetMapping("/my")
    @Operation(summary = "Get delivery reports submitted by the current authenticated worker")
    public ResponseEntity<List<DeliveryReport>> getMyReports(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "worker1";
        User worker = userRepository.findByUsername(username).orElse(null);
        if (worker == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(reportService.getReportsForWorker(worker.getId()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a delivery report by ID")
    public ResponseEntity<DeliveryReport> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.getById(id));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approve delivery report, reconcile inventory, and record fulfillment (Admin only)")
    public ResponseEntity<DeliveryReport> approveReport(@PathVariable Long id,
                                                        @RequestBody(required = false) Map<String, String> payload,
                                                        Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "admin";
        String comments = payload != null ? payload.get("comments") : "Approved by administrator";
        return ResponseEntity.ok(reportService.approveReport(id, comments, admin));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reject delivery report with reason (Admin only)")
    public ResponseEntity<DeliveryReport> rejectReport(@PathVariable Long id,
                                                       @RequestBody Map<String, String> payload,
                                                       Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "admin";
        String reason = payload != null && payload.get("reason") != null ? payload.get("reason") : "Report rejected by administrator";
        return ResponseEntity.ok(reportService.rejectReport(id, reason, admin));
    }

    @PostMapping("/{id}/request-correction")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Request field correction on delivery report (Admin only)")
    public ResponseEntity<DeliveryReport> requestCorrection(@PathVariable Long id,
                                                            @RequestBody Map<String, String> payload,
                                                            Authentication authentication) {
        String admin = authentication != null ? authentication.getName() : "admin";
        String instructions = payload != null && payload.get("instructions") != null ? payload.get("instructions") : "Please verify quantities and resubmit.";
        return ResponseEntity.ok(reportService.requestCorrection(id, instructions, admin));
    }

    @PutMapping("/{id}/resubmit")
    @Operation(summary = "Resubmit corrected delivery report (Field Worker)")
    public ResponseEntity<DeliveryReport> resubmitReport(@PathVariable Long id,
                                                         @RequestBody DeliveryReport updateData,
                                                         Authentication authentication) {
        String username = authentication != null ? authentication.getName() : "worker1";
        User worker = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("Authenticated worker not found"));
        return ResponseEntity.ok(reportService.resubmitReport(id, updateData, worker));
    }
}
