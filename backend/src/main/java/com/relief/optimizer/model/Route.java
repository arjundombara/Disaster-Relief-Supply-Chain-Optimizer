package com.relief.optimizer.model;

import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Route code is required")
    @Column(nullable = false, unique = true)
    private String routeCode;

    @NotNull(message = "Source depot is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "source_depot_id", nullable = false)
    private Depot sourceDepot;

    @NotNull(message = "Destination distribution point is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "destination_point_id", nullable = false)
    private DistributionPoint destinationPoint;

    @NotNull(message = "Route capacity is required")
    @PositiveOrZero(message = "Route capacity must be non-negative")
    @Column(nullable = false)
    private Double capacity;

    @PositiveOrZero(message = "Distance must be non-negative")
    private Double distanceKm = 0.0;

    @PositiveOrZero(message = "Travel time must be non-negative")
    private Double travelTimeHours = 0.0;

    @Column(nullable = false)
    private String roadCondition = "CLEAR"; // CLEAR, FLOOD_RISK, OBSTRUCTED, DAMAGED

    @Column(nullable = false)
    private Boolean isAvailable = true;

    public Route() {}

    public Route(Long id, String routeCode, Depot sourceDepot, DistributionPoint destinationPoint,
                 Double capacity, Double distanceKm, Double travelTimeHours, String roadCondition, Boolean isAvailable) {
        if (capacity != null && capacity < 0) {
            throw new IllegalArgumentException("Route capacity cannot be negative");
        }
        this.id = id;
        this.routeCode = routeCode;
        this.sourceDepot = sourceDepot;
        this.destinationPoint = destinationPoint;
        this.capacity = capacity;
        this.distanceKm = distanceKm != null ? distanceKm : 0.0;
        this.travelTimeHours = travelTimeHours != null ? travelTimeHours : 0.0;
        this.roadCondition = roadCondition != null ? roadCondition : "CLEAR";
        this.isAvailable = isAvailable != null ? isAvailable : true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRouteCode() { return routeCode; }
    public void setRouteCode(String routeCode) { this.routeCode = routeCode; }
    public Depot getSourceDepot() { return sourceDepot; }
    public void setSourceDepot(Depot sourceDepot) { this.sourceDepot = sourceDepot; }
    public DistributionPoint getDestinationPoint() { return destinationPoint; }
    public void setDestinationPoint(DistributionPoint destinationPoint) { this.destinationPoint = destinationPoint; }
    public Double getCapacity() { return capacity; }
    public void setCapacity(Double capacity) {
        if (capacity != null && capacity < 0) {
            throw new IllegalArgumentException("Route capacity cannot be negative");
        }
        this.capacity = capacity;
    }
    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
    public Double getTravelTimeHours() { return travelTimeHours; }
    public void setTravelTimeHours(Double travelTimeHours) { this.travelTimeHours = travelTimeHours; }
    public String getRoadCondition() { return roadCondition; }
    public void setRoadCondition(String roadCondition) { this.roadCondition = roadCondition; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}
