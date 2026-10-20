package com.relief.optimizer.dto;

import com.relief.optimizer.model.ShipmentStatus;
import com.relief.optimizer.model.SupplyType;

import java.time.LocalDateTime;

public class ShipmentDto {
    private Long id;
    private String shipmentCode;
    private Long allocationId;
    private Long sourceDepotId;
    private String sourceDepotName;
    private String sourceDepotCode;
    private Long destinationPointId;
    private String destinationPointName;
    private String destinationPointCode;
    private Long routeId;
    private String routeCode;
    private SupplyType supplyType;
    private Double allocatedQuantity;
    private Double deliveredQuantity;
    private ShipmentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;
    private String driverName;
    private String driverPhone;
    private String vehiclePlate;
    private String vehicleType;
    private String recipientName;
    private String deliveryNotes;

    public ShipmentDto() {}

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getShipmentCode() { return shipmentCode; }
    public void setShipmentCode(String shipmentCode) { this.shipmentCode = shipmentCode; }
    public Long getAllocationId() { return allocationId; }
    public void setAllocationId(Long allocationId) { this.allocationId = allocationId; }
    public Long getSourceDepotId() { return sourceDepotId; }
    public void setSourceDepotId(Long sourceDepotId) { this.sourceDepotId = sourceDepotId; }
    public String getSourceDepotName() { return sourceDepotName; }
    public void setSourceDepotName(String sourceDepotName) { this.sourceDepotName = sourceDepotName; }
    public String getSourceDepotCode() { return sourceDepotCode; }
    public void setSourceDepotCode(String sourceDepotCode) { this.sourceDepotCode = sourceDepotCode; }
    public Long getDestinationPointId() { return destinationPointId; }
    public void setDestinationPointId(Long destinationPointId) { this.destinationPointId = destinationPointId; }
    public String getDestinationPointName() { return destinationPointName; }
    public void setDestinationPointName(String destinationPointName) { this.destinationPointName = destinationPointName; }
    public String getDestinationPointCode() { return destinationPointCode; }
    public void setDestinationPointCode(String destinationPointCode) { this.destinationPointCode = destinationPointCode; }
    public Long getRouteId() { return routeId; }
    public void setRouteId(Long routeId) { this.routeId = routeId; }
    public String getRouteCode() { return routeCode; }
    public void setRouteCode(String routeCode) { this.routeCode = routeCode; }
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
