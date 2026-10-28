package com.relief.optimizer.model;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    public enum TransactionType {
        INCOMING_STOCK("Incoming Stock Received"),
        RESERVATION("Reserved for Consignment"),
        DISPATCH("Dispatched to Field"),
        DELIVERY_CONFIRMED("Delivered to Affected Zone"),
        RETURN_CONFIRMED("Returned to Depot"),
        DAMAGE_RECORDED("Damaged/Unusable Stock"),
        ADJUSTMENT("Administrative Stock Adjustment");

        private final String description;

        TransactionType(String description) {
            this.description = description;
        }

        public String getDescription() { return description; }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(nullable = false)
    private Long depotId;

    private String depotCode;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplyType supplyType;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;

    @NotNull
    @Positive
    @Column(nullable = false)
    private Double quantity;

    private Double balanceAvailable;
    private Double balanceReserved;

    private String reason;
    private String referenceCode;
    private String performedBy;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public InventoryTransaction() {}

    public InventoryTransaction(Long id, Long depotId, String depotCode, SupplyType supplyType,
                                TransactionType transactionType, Double quantity, Double balanceAvailable,
                                Double balanceReserved, String reason, String referenceCode, String performedBy) {
        this.id = id;
        this.depotId = depotId;
        this.depotCode = depotCode;
        this.supplyType = supplyType;
        this.transactionType = transactionType;
        this.quantity = quantity;
        this.balanceAvailable = balanceAvailable;
        this.balanceReserved = balanceReserved;
        this.reason = reason;
        this.referenceCode = referenceCode;
        this.performedBy = performedBy;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDepotId() { return depotId; }
    public void setDepotId(Long depotId) { this.depotId = depotId; }
    public String getDepotCode() { return depotCode; }
    public void setDepotCode(String depotCode) { this.depotCode = depotCode; }
    public SupplyType getSupplyType() { return supplyType; }
    public void setSupplyType(SupplyType supplyType) { this.supplyType = supplyType; }
    public TransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public Double getBalanceAvailable() { return balanceAvailable; }
    public void setBalanceAvailable(Double balanceAvailable) { this.balanceAvailable = balanceAvailable; }
    public Double getBalanceReserved() { return balanceReserved; }
    public void setBalanceReserved(Double balanceReserved) { this.balanceReserved = balanceReserved; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getReferenceCode() { return referenceCode; }
    public void setReferenceCode(String referenceCode) { this.referenceCode = referenceCode; }
    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
