package com.relief.optimizer.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "allocations")
public class Allocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false)
    private String allocationPolicy; // MAX_FLOW, PROPORTIONAL, PRIORITY_WEIGHTED

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SupplyType supplyType;

    private Double totalAvailableSupply = 0.0;
    private Double totalRequestedDemand = 0.0;
    private Double totalAllocatedFlow = 0.0;
    private Double unmetDemand = 0.0;
    private Double satisfactionPercentage = 0.0;

    @OneToMany(mappedBy = "allocation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<Shipment> shipments = new ArrayList<>();

    public Allocation() {}

    public Allocation(Long id, LocalDateTime createdAt, String allocationPolicy, SupplyType supplyType,
                      Double totalAvailableSupply, Double totalRequestedDemand, Double totalAllocatedFlow,
                      Double unmetDemand, Double satisfactionPercentage) {
        this.id = id;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.allocationPolicy = allocationPolicy;
        this.supplyType = supplyType;
        this.totalAvailableSupply = totalAvailableSupply != null ? totalAvailableSupply : 0.0;
        this.totalRequestedDemand = totalRequestedDemand != null ? totalRequestedDemand : 0.0;
        this.totalAllocatedFlow = totalAllocatedFlow != null ? totalAllocatedFlow : 0.0;
        this.unmetDemand = unmetDemand != null ? unmetDemand : 0.0;
        this.satisfactionPercentage = satisfactionPercentage != null ? satisfactionPercentage : 0.0;
    }

    public void addShipment(Shipment shipment) {
        shipments.add(shipment);
        shipment.setAllocation(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getAllocationPolicy() { return allocationPolicy; }
    public void setAllocationPolicy(String allocationPolicy) { this.allocationPolicy = allocationPolicy; }
    public SupplyType getSupplyType() { return supplyType; }
    public void setSupplyType(SupplyType supplyType) { this.supplyType = supplyType; }
    public Double getTotalAvailableSupply() { return totalAvailableSupply; }
    public void setTotalAvailableSupply(Double totalAvailableSupply) { this.totalAvailableSupply = totalAvailableSupply; }
    public Double getTotalRequestedDemand() { return totalRequestedDemand; }
    public void setTotalRequestedDemand(Double totalRequestedDemand) { this.totalRequestedDemand = totalRequestedDemand; }
    public Double getTotalAllocatedFlow() { return totalAllocatedFlow; }
    public void setTotalAllocatedFlow(Double totalAllocatedFlow) { this.totalAllocatedFlow = totalAllocatedFlow; }
    public Double getUnmetDemand() { return unmetDemand; }
    public void setUnmetDemand(Double unmetDemand) { this.unmetDemand = unmetDemand; }
    public Double getSatisfactionPercentage() { return satisfactionPercentage; }
    public void setSatisfactionPercentage(Double satisfactionPercentage) { this.satisfactionPercentage = satisfactionPercentage; }
    public List<Shipment> getShipments() { return shipments; }
    public void setShipments(List<Shipment> shipments) { this.shipments = shipments; }
}
