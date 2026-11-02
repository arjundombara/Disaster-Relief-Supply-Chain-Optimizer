package com.relief.optimizer.service;

import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.*;
import com.relief.optimizer.model.DeliveryReport.ReportStatus;
import com.relief.optimizer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class DeliveryReportService {

    private final DeliveryReportRepository reportRepository;
    private final ShipmentRepository shipmentRepository;
    private final DistributionPointRepository dpRepository;
    private final InventoryService inventoryService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Autowired
    public DeliveryReportService(DeliveryReportRepository reportRepository,
                                 ShipmentRepository shipmentRepository,
                                 DistributionPointRepository dpRepository,
                                 InventoryService inventoryService,
                                 NotificationService notificationService,
                                 UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.shipmentRepository = shipmentRepository;
        this.dpRepository = dpRepository;
        this.inventoryService = inventoryService;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    public DeliveryReport submitReport(DeliveryReport report, User worker) {
        Shipment shipment = shipmentRepository.findById(report.getShipmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + report.getShipmentId()));

        // Authorization check: worker can only submit report for their own assigned shipment if worker is assigned
        if (shipment.getAssignedWorkerId() != null && !shipment.getAssignedWorkerId().equals(worker.getId())) {
            throw new ValidationException("Worker is not authorized to submit report for this task.");
        }

        if (report.getQuantityDelivered() < 0 || report.getQuantityReturned() < 0 || report.getQuantityDamaged() < 0) {
            throw new ValidationException("Reported quantities cannot be negative.");
        }

        double dispatched = report.getQuantityDispatched() > 0 ? report.getQuantityDispatched() : shipment.getAllocatedQuantity();
        double accounted = report.getQuantityDelivered() + report.getQuantityReturned() + report.getQuantityDamaged();
        if (accounted > dispatched + 1e-9) {
            throw new ValidationException(String.format("Total accounted quantity (%.1f) exceeds dispatched quantity (%.1f)", accounted, dispatched));
        }

        report.setShipmentCode(shipment.getShipmentCode());
        report.setWorkerId(worker.getId());
        report.setWorkerUsername(worker.getUsername());
        report.setWorkerName(worker.getFullName());
        report.setSupplyType(shipment.getSupplyType());
        report.setAssignedQuantity(shipment.getAllocatedQuantity());
        report.setQuantityDispatched(dispatched);
        if (shipment.getSourceDepot() != null) {
            report.setSourceDepotId(shipment.getSourceDepot().getId());
            report.setSourceDepotName(shipment.getSourceDepot().getName());
        }
        if (shipment.getDestinationPoint() != null) {
            report.setDestinationPointId(shipment.getDestinationPoint().getId());
            report.setDestinationPointName(shipment.getDestinationPoint().getName());
        }
        report.setStatus(ReportStatus.PENDING_APPROVAL);
        report.setSubmittedAt(LocalDateTime.now());

        DeliveryReport saved = reportRepository.save(report);

        // Notify Admins
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        for (User admin : admins) {
            notificationService.create(
                    admin.getUsername(),
                    String.format("Delivery Report submitted by %s for %s (%s). Awaiting review.",
                            worker.getFullName(), shipment.getShipmentCode(), shipment.getSupplyType()),
                    "REPORT_SUBMITTED", shipment.getShipmentCode(), saved.getId()
            );
        }

        return saved;
    }

    public DeliveryReport approveReport(Long reportId, String comments, String adminUsername) {
        DeliveryReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));

        if (report.getStatus() == ReportStatus.APPROVED) {
            throw new ValidationException("This report has already been approved and reconciled.");
        }

        report.setStatus(ReportStatus.APPROVED);
        report.setReviewedBy(adminUsername);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewComments(comments);

        // 1. Reconcile Shipment
        Shipment shipment = shipmentRepository.findById(report.getShipmentId()).orElse(null);
        if (shipment != null) {
            shipment.setStatus(ShipmentStatus.DELIVERED);
            shipment.setDeliveredQuantity(report.getQuantityDelivered());
            shipment.setDeliveredAt(LocalDateTime.now());
            if (report.getNotes() != null) shipment.setDeliveryNotes(report.getNotes());
            shipmentRepository.save(shipment);
        }

        // 2. Reconcile Distribution Point demand fulfillment
        if (report.getDestinationPointId() != null && report.getQuantityDelivered() > 0) {
            dpRepository.findById(report.getDestinationPointId()).ifPresent(dp -> {
                dp.addDelivered(report.getSupplyType(), report.getQuantityDelivered());
                dpRepository.save(dp);
            });
        }

        // 3. Reconcile Inventory Ledger
        if (report.getSourceDepotId() != null) {
            inventoryService.reconcileDelivery(
                    report.getSourceDepotId(),
                    report.getSupplyType(),
                    report.getQuantityDelivered(),
                    report.getQuantityReturned(),
                    report.getQuantityDamaged(),
                    report.getShipmentCode(),
                    adminUsername
            );
        }

        DeliveryReport approved = reportRepository.save(report);

        // Notify Worker
        notificationService.create(
                report.getWorkerUsername(),
                String.format("Your delivery report for task %s has been APPROVED by %s.",
                        report.getShipmentCode(), adminUsername),
                "REPORT_APPROVED", report.getShipmentCode(), report.getId()
        );

        return approved;
    }

    public DeliveryReport rejectReport(Long reportId, String reason, String adminUsername) {
        DeliveryReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));

        if (report.getStatus() == ReportStatus.APPROVED) {
            throw new ValidationException("Cannot reject an already approved report.");
        }

        report.setStatus(ReportStatus.REJECTED);
        report.setReviewedBy(adminUsername);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewComments(reason);

        DeliveryReport rejected = reportRepository.save(report);

        notificationService.create(
                report.getWorkerUsername(),
                String.format("Delivery report for task %s was REJECTED: %s",
                        report.getShipmentCode(), reason),
                "REPORT_REJECTED", report.getShipmentCode(), report.getId()
        );

        return rejected;
    }

    public DeliveryReport requestCorrection(Long reportId, String instructions, String adminUsername) {
        DeliveryReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));

        report.setStatus(ReportStatus.NEEDS_CORRECTION);
        report.setReviewedBy(adminUsername);
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewComments(instructions);

        DeliveryReport saved = reportRepository.save(report);

        notificationService.create(
                report.getWorkerUsername(),
                String.format("Delivery report for task %s requires correction: %s",
                        report.getShipmentCode(), instructions),
                "CORRECTION_REQUESTED", report.getShipmentCode(), report.getId()
        );

        return saved;
    }

    public DeliveryReport resubmitReport(Long reportId, DeliveryReport updateData, User worker) {
        DeliveryReport existing = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + reportId));

        if (existing.getStatus() != ReportStatus.NEEDS_CORRECTION) {
            throw new ValidationException("Only reports with status NEEDS_CORRECTION can be resubmitted.");
        }

        if (!existing.getWorkerId().equals(worker.getId())) {
            throw new ValidationException("Unauthorized: you did not create this report.");
        }

        existing.setQuantityDelivered(updateData.getQuantityDelivered());
        existing.setQuantityReturned(updateData.getQuantityReturned());
        existing.setQuantityDamaged(updateData.getQuantityDamaged());
        existing.setShortageReason(updateData.getShortageReason());
        existing.setDamageReason(updateData.getDamageReason());
        existing.setNotes(updateData.getNotes());
        existing.setProofOfDelivery(updateData.getProofOfDelivery());
        existing.setStatus(ReportStatus.PENDING_APPROVAL);
        existing.setSubmittedAt(LocalDateTime.now());

        return reportRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public List<DeliveryReport> getAllReports() {
        return reportRepository.findAllByOrderBySubmittedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<DeliveryReport> getReportsByStatus(ReportStatus status) {
        return reportRepository.findByStatusOrderBySubmittedAtDesc(status);
    }

    @Transactional(readOnly = true)
    public List<DeliveryReport> getReportsForWorker(Long workerId) {
        return reportRepository.findByWorkerIdOrderBySubmittedAtDesc(workerId);
    }

    @Transactional(readOnly = true)
    public DeliveryReport getById(Long id) {
        return reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + id));
    }
}
