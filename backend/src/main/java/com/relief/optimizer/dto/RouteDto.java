package com.relief.optimizer.dto;

import javax.validation.constraints.*;

public class RouteDto {
    private Long id;

    @NotBlank(message = "Route code cannot be blank")
    private String routeCode;

    @NotNull(message = "Source depot ID is required")
    private Long sourceDepotId;
    private String sourceDepotName;
    private String sourceDepotCode;

    @NotNull(message = "Destination distribution point ID is required")
    private Long destinationPointId;
    private String destinationPointName;
    private String destinationPointCode;

    @NotNull(message = "Route capacity is required")
    @PositiveOrZero(message = "Capacity must be non-negative")
    private Double capacity;

    @PositiveOrZero(message = "Distance must be non-negative")
    private Double distanceKm = 0.0;

    @PositiveOrZero(message = "Travel time must be non-negative")
    private Double travelTimeHours = 0.0;

    private String roadCondition = "CLEAR";
    private Boolean isAvailable = true;

    public RouteDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRouteCode() { return routeCode; }
    public void setRouteCode(String routeCode) { this.routeCode = routeCode; }
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
    public Double getCapacity() { return capacity; }
    public void setCapacity(Double capacity) { this.capacity = capacity; }
    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }
    public Double getTravelTimeHours() { return travelTimeHours; }
    public void setTravelTimeHours(Double travelTimeHours) { this.travelTimeHours = travelTimeHours; }
    public String getRoadCondition() { return roadCondition; }
    public void setRoadCondition(String roadCondition) { this.roadCondition = roadCondition; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
}
