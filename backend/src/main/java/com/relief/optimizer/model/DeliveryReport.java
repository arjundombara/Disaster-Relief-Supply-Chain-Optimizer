package com.relief.optimizer.model;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PositiveOrZero;
import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_reports")
public class DeliveryReport {

    public enum ReportStatus {
        PENDING_APPROVAL,
        APPROVED,
        REJECTED,
        NEEDS_CORRECTION
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long shipmentId;

    private String shipmentCode;

    @NotNull
    @Column(nullable = false)
    private Long workerId;

    private String workerUsername;
    private String workerName;

    private Long destinationPointId;
    private String destinationPointName;

    private Long sourceDepotId;
    private String sourceDepotName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplyType supplyType;

    @NotNull
    @PositiveOrZero
    private Double assignedQuantity = 0.0;

    @NotNull
    @PositiveOrZero
    private Double quantityDispatched = 0.0;

    @NotNull
    @PositiveOrZero
    private Double quantityDelivered = 0.0;

    @PositiveOrZero
    private Double quantityReturned = 0.0;

    @PositiveOrZero
    private Double quantityDamaged = 0.0;

    private String shortageReason;
    private String damageReason;

    private LocalDateTime deliveryTimestamp = LocalDateTime.now();
    private String notes;
    private String proofOfDelivery;

    @Column(nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING_APPROVAL;

    private String reviewedBy;
    private LocalDateTime reviewedAt;
    private String reviewComments;

    public DeliveryReport() {}

    public DeliveryReport(Long id, Long shipmentId, String shipmentCode, Long workerId,
                          String workerUsername, String workerName, Long destinationPointId,
                          String destinationPointName, Long sourceDepotId, String sourceDepotName,
                          SupplyType supplyType, Double assignedQuantity, Double quantityDispatched,
                          Double quantityDelivered, Double quantityReturned, Double quantityDamaged,
                          String shortageReason, String damageReason, LocalDateTime deliveryTimestamp,
                          String notes, String proofOfDelivery) {
        this.id = id;
        this.shipmentId = shipmentId;
        this.shipmentCode = shipmentCode;
        this.workerId = workerId;
        this.workerUsername = workerUsername;
        this.workerName = workerName;
        this.destinationPointId = destinationPointId;
        this.destinationPointName = destinationPointName;
        this.sourceDepotId = sourceDepotId;
        this.sourceDepotName = sourceDepotName;
        this.supplyType = supplyType;
        this.assignedQuantity = assignedQuantity != null ? assignedQuantity : 0.0;
        this.quantityDispatched = quantityDispatched != null ? quantityDispatched : 0.0;
        this.quantityDelivered = quantityDelivered != null ? quantityDelivered : 0.0;
        this.quantityReturned = quantityReturned != null ? quantityReturned : 0.0;
        this.quantityDamaged = quantityDamaged != null ? quantityDamaged : 0.0;
        this.shortageReason = shortageReason;
        this.damageReason = damageReason;
        this.deliveryTimestamp = deliveryTimestamp != null ? deliveryTimestamp : LocalDateTime.now();
        this.notes = notes;
        this.proofOfDelivery = proofOfDelivery;
        this.submittedAt = LocalDateTime.now();
        this.status = ReportStatus.PENDING_APPROVAL;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getShipmentId() { return shipmentId; }
    public void setShipmentId(Long shipmentId) { this.shipmentId = shipmentId; }
    public String getShipmentCode() { return shipmentCode; }
    public void setShipmentCode(String shipmentCode) { this.shipmentCode = shipmentCode; }
    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public String getWorkerUsername() { return workerUsername; }
    public void setWorkerUsername(String workerUsername) { this.workerUsername = workerUsername; }
    public String getWorkerName() { return workerName; }
    public void setWorkerName(String workerName) { this.workerName = workerName; }
    public Long getDestinationPointId() { return destinationPointId; }
    public void setDestinationPointId(Long destinationPointId) { this.destinationPointId = destinationPointId; }
    public String getDestinationPointName() { return destinationPointName; }
    public void setDestinationPointName(String destinationPointName) { this.destinationPointName = destinationPointName; }
    public Long getSourceDepotId() { return sourceDepotId; }
    public void setSourceDepotId(Long sourceDepotId) { this.sourceDepotId = sourceDepotId; }
    public String getSourceDepotName() { return sourceDepotName; }
    public void setSourceDepotName(String sourceDepotName) { this.sourceDepotName = sourceDepotName; }
    public SupplyType getSupplyType() { return supplyType; }
    public void setSupplyType(SupplyType supplyType) { this.supplyType = supplyType; }
    public Double getAssignedQuantity() { return assignedQuantity; }
    public void setAssignedQuantity(Double assignedQuantity) { this.assignedQuantity = assignedQuantity; }
    public Double getQuantityDispatched() { return quantityDispatched; }
    public void setQuantityDispatched(Double quantityDispatched) { this.quantityDispatched = quantityDispatched; }
    public Double getQuantityDelivered() { return quantityDelivered; }
    public void setQuantityDelivered(Double quantityDelivered) { this.quantityDelivered = quantityDelivered; }
    public Double getQuantityReturned() { return quantityReturned; }
    public void setQuantityReturned(Double quantityReturned) { this.quantityReturned = quantityReturned; }
    public Double getQuantityDamaged() { return quantityDamaged; }
    public void setQuantityDamaged(Double quantityDamaged) { this.quantityDamaged = quantityDamaged; }
    public String getShortageReason() { return shortageReason; }
    public void setShortageReason(String shortageReason) { this.shortageReason = shortageReason; }
    public String getDamageReason() { return damageReason; }
    public void setDamageReason(String damageReason) { this.damageReason = damageReason; }
    public LocalDateTime getDeliveryTimestamp() { return deliveryTimestamp; }
    public void setDeliveryTimestamp(LocalDateTime deliveryTimestamp) { this.deliveryTimestamp = deliveryTimestamp; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getProofOfDelivery() { return proofOfDelivery; }
    public void setProofOfDelivery(String proofOfDelivery) { this.proofOfDelivery = proofOfDelivery; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public ReportStatus getStatus() { return status; }
    public void setStatus(ReportStatus status) { this.status = status; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
    public String getReviewComments() { return reviewComments; }
    public void setReviewComments(String reviewComments) { this.reviewComments = reviewComments; }
}
