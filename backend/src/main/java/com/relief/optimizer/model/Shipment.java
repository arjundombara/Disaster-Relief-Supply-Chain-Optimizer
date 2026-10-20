package com.relief.optimizer.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.PositiveOrZero;
import java.time.LocalDateTime;

@Entity
@Table(name = "shipments")
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String shipmentCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id")
    @JsonBackReference
    private Allocation allocation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_depot_id", nullable = false)
    private Depot sourceDepot;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_point_id", nullable = false)
    private DistributionPoint destinationPoint;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "route_id")
    private Route route;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplyType supplyType;

    @NotNull
    @PositiveOrZero
    private Double allocatedQuantity = 0.0;

    @PositiveOrZero
    private Double deliveredQuantity = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status = ShipmentStatus.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;

    private String driverName;
    private String driverPhone;
    private String vehiclePlate;
    private String vehicleType = "Heavy Relief Truck";
    private String recipientName;
    private String deliveryNotes;

    public Shipment() {}

    public Shipment(Long id, String shipmentCode, Allocation allocation, Depot sourceDepot,
                    DistributionPoint destinationPoint, Route route, SupplyType supplyType,
                    Double allocatedQuantity, ShipmentStatus status) {
        this.id = id;
        this.shipmentCode = shipmentCode;
        this.allocation = allocation;
        this.sourceDepot = sourceDepot;
        this.destinationPoint = destinationPoint;
        this.route = route;
        this.supplyType = supplyType;
        this.allocatedQuantity = allocatedQuantity != null ? allocatedQuantity : 0.0;
        this.status = status != null ? status : ShipmentStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public boolean canUpdateTo(ShipmentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public void updateStatus(ShipmentStatus newStatus) {
        if (!canUpdateTo(newStatus)) {
            throw new IllegalStateException("Invalid status transition from " + this.status + " to " + newStatus);
        }
        this.status = newStatus;
        if (newStatus == ShipmentStatus.DISPATCHED && this.dispatchedAt == null) {
            this.dispatchedAt = LocalDateTime.now();
        } else if (newStatus == ShipmentStatus.DELIVERED) {
            if (this.deliveredAt == null) {
                this.deliveredAt = LocalDateTime.now();
            }
            if (this.deliveredQuantity == null || this.deliveredQuantity <= 0) {
                this.deliveredQuantity = this.allocatedQuantity;
            }
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getShipmentCode() { return shipmentCode; }
    public void setShipmentCode(String shipmentCode) { this.shipmentCode = shipmentCode; }
    public Allocation getAllocation() { return allocation; }
    public void setAllocation(Allocation allocation) { this.allocation = allocation; }
    public Depot getSourceDepot() { return sourceDepot; }
    public void setSourceDepot(Depot sourceDepot) { this.sourceDepot = sourceDepot; }
    public DistributionPoint getDestinationPoint() { return destinationPoint; }
    public void setDestinationPoint(DistributionPoint destinationPoint) { this.destinationPoint = destinationPoint; }
    public Route getRoute() { return route; }
    public void setRoute(Route route) { this.route = route; }
    public SupplyType getSupplyType() { return supplyType; }
    public void setSupplyType(SupplyType supplyType) { this.supplyType = supplyType; }
    public Double getAllocatedQuantity() { return allocatedQuantity; }
    public void setAllocatedQuantity(Double allocatedQuantity) { this.allocatedQuantity = allocatedQuantity; }
    public Double getDeliveredQuantity() { return deliveredQuantity; }
    public void setDeliveredQuantity(Double deliveredQuantity) { this.deliveredQuantity = deliveredQuantity; }
    public ShipmentStatus getStatus() { return status; }
    public void setStatus(ShipmentStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
    public String getVehiclePlate() { return vehiclePlate; }
    public void setVehiclePlate(String vehiclePlate) { this.vehiclePlate = vehiclePlate; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getDeliveryNotes() { return deliveryNotes; }
    public void setDeliveryNotes(String deliveryNotes) { this.deliveryNotes = deliveryNotes; }
}
