package com.relief.optimizer.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PositiveOrZero;

@Entity
@Table(name = "inventories", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"depot_id", "supply_type"})
})
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "depot_id", nullable = false)
    @JsonBackReference
    private Depot depot;

    @NotNull(message = "Supply type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "supply_type", nullable = false)
    private SupplyType supplyType;

    @NotNull(message = "Available quantity is required")
    @PositiveOrZero(message = "Available quantity cannot be negative")
    @Column(nullable = false)
    private Double availableQuantity = 0.0;

    @PositiveOrZero(message = "Reserved quantity cannot be negative")
    @Column(nullable = false)
    private Double reservedQuantity = 0.0;

    @PositiveOrZero(message = "Minimum threshold cannot be negative")
    @Column(nullable = false)
    private Double minimumThreshold = 10.0;

    @PositiveOrZero
    private Double physicalQuantity = 0.0;

    @PositiveOrZero
    private Double dispatchedQuantity = 0.0;

    @PositiveOrZero
    private Double deliveredQuantity = 0.0;

    @PositiveOrZero
    private Double damagedQuantity = 0.0;

    @PositiveOrZero
    private Double returnedQuantity = 0.0;

    @Column(nullable = false)
    private String unit;

    public Inventory() {}

    public Inventory(Long id, Depot depot, SupplyType supplyType, Double availableQuantity,
                     Double reservedQuantity, Double minimumThreshold, String unit) {
        this.id = id;
        this.depot = depot;
        this.supplyType = supplyType;
        this.availableQuantity = availableQuantity != null ? availableQuantity : 0.0;
        this.reservedQuantity = reservedQuantity != null ? reservedQuantity : 0.0;
        this.minimumThreshold = minimumThreshold != null ? minimumThreshold : 10.0;
        this.unit = unit != null ? unit : (supplyType != null ? supplyType.getDefaultUnit() : "units");
    }

    public boolean isLowStock() {
        return availableQuantity <= minimumThreshold;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Depot getDepot() {
        return depot;
    }

    public void setDepot(Depot depot) {
        this.depot = depot;
    }

    public SupplyType getSupplyType() {
        return supplyType;
    }

    public void setSupplyType(SupplyType supplyType) {
        this.supplyType = supplyType;
        if (this.unit == null && supplyType != null) {
            this.unit = supplyType.getDefaultUnit();
        }
    }

    public Double getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(Double availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public Double getReservedQuantity() {
        return reservedQuantity;
    }

    public void setReservedQuantity(Double reservedQuantity) {
        this.reservedQuantity = reservedQuantity;
    }

    public Double getMinimumThreshold() {
        return minimumThreshold;
    }

    public void setMinimumThreshold(Double minimumThreshold) {
        this.minimumThreshold = minimumThreshold;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getPhysicalQuantity() {
        return physicalQuantity != null ? physicalQuantity : (availableQuantity + (reservedQuantity != null ? reservedQuantity : 0.0));
    }

    public void setPhysicalQuantity(Double physicalQuantity) {
        this.physicalQuantity = physicalQuantity;
    }

    public Double getDispatchedQuantity() {
        return dispatchedQuantity != null ? dispatchedQuantity : 0.0;
    }

    public void setDispatchedQuantity(Double dispatchedQuantity) {
        this.dispatchedQuantity = dispatchedQuantity;
    }

    public Double getDeliveredQuantity() {
        return deliveredQuantity != null ? deliveredQuantity : 0.0;
    }

    public void setDeliveredQuantity(Double deliveredQuantity) {
        this.deliveredQuantity = deliveredQuantity;
    }

    public Double getDamagedQuantity() {
        return damagedQuantity != null ? damagedQuantity : 0.0;
    }

    public void setDamagedQuantity(Double damagedQuantity) {
        this.damagedQuantity = damagedQuantity;
    }

    public Double getReturnedQuantity() {
        return returnedQuantity != null ? returnedQuantity : 0.0;
    }

    public void setReturnedQuantity(Double returnedQuantity) {
        this.returnedQuantity = returnedQuantity;
    }
}

