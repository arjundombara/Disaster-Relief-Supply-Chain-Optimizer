package com.relief.optimizer.model;

import javax.persistence.*;
import javax.validation.constraints.*;

@Entity
@Table(name = "distribution_points")
public class DistributionPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Distribution point code is required")
    @Column(nullable = false, unique = true)
    private String code;

    @NotBlank(message = "Distribution point name is required")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.0", message = "Latitude must be >= -90.0")
    @DecimalMax(value = "90.0", message = "Latitude must be <= 90.0")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.0", message = "Longitude must be >= -180.0")
    @DecimalMax(value = "180.0", message = "Longitude must be <= 180.0")
    private Double longitude;

    private String address;
    private String contactPerson;
    private String phone;

    @NotNull(message = "Severity level is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeverityLevel severity = SeverityLevel.HIGH;

    @NotNull(message = "Priority score is required")
    @Min(value = 1, message = "Priority must be at least 1")
    @Max(value = 5, message = "Priority must be at most 5")
    private Integer priorityScore = 3;

    @PositiveOrZero(message = "Affected population must be >= 0")
    private Integer affectedPopulation = 0;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, RELIEVED, INACCESSIBLE

    // Demands per supply type
    @PositiveOrZero(message = "Food demand must be >= 0")
    private Double foodDemand = 0.0;

    @PositiveOrZero(message = "Water demand must be >= 0")
    private Double waterDemand = 0.0;

    @PositiveOrZero(message = "Medicine demand must be >= 0")
    private Double medicineDemand = 0.0;

    @PositiveOrZero(message = "Shelter demand must be >= 0")
    private Double shelterDemand = 0.0;

    // Delivered supplies tracking
    private Double foodDelivered = 0.0;
    private Double waterDelivered = 0.0;
    private Double medicineDelivered = 0.0;
    private Double shelterDelivered = 0.0;

    public DistributionPoint() {}

    public DistributionPoint(Long id, String code, String name, Double latitude, Double longitude,
                             String address, String contactPerson, String phone,
                             SeverityLevel severity, Integer priorityScore, Integer affectedPopulation,
                             String status, Double foodDemand, Double waterDemand, Double medicineDemand, Double shelterDemand) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.severity = severity != null ? severity : SeverityLevel.HIGH;
        this.priorityScore = priorityScore != null ? priorityScore : this.severity.getDefaultPriority();
        this.affectedPopulation = affectedPopulation != null ? affectedPopulation : 0;
        this.status = status != null ? status : "ACTIVE";
        this.foodDemand = foodDemand != null ? foodDemand : 0.0;
        this.waterDemand = waterDemand != null ? waterDemand : 0.0;
        this.medicineDemand = medicineDemand != null ? medicineDemand : 0.0;
        this.shelterDemand = shelterDemand != null ? shelterDemand : 0.0;
    }

    public double getDemand(SupplyType supplyType) {
        if (supplyType == null) return 0.0;
        switch (supplyType) {
            case FOOD: return foodDemand != null ? foodDemand : 0.0;
            case WATER: return waterDemand != null ? waterDemand : 0.0;
            case MEDICINE: return medicineDemand != null ? medicineDemand : 0.0;
            case SHELTER: return shelterDemand != null ? shelterDemand : 0.0;
            default: return 0.0;
        }
    }

    public void setDemand(SupplyType supplyType, double quantity) {
        if (supplyType == null) return;
        switch (supplyType) {
            case FOOD: this.foodDemand = Math.max(0.0, quantity); break;
            case WATER: this.waterDemand = Math.max(0.0, quantity); break;
            case MEDICINE: this.medicineDemand = Math.max(0.0, quantity); break;
            case SHELTER: this.shelterDemand = Math.max(0.0, quantity); break;
        }
    }

    public double getDelivered(SupplyType supplyType) {
        if (supplyType == null) return 0.0;
        switch (supplyType) {
            case FOOD: return foodDelivered != null ? foodDelivered : 0.0;
            case WATER: return waterDelivered != null ? waterDelivered : 0.0;
            case MEDICINE: return medicineDelivered != null ? medicineDelivered : 0.0;
            case SHELTER: return shelterDelivered != null ? shelterDelivered : 0.0;
            default: return 0.0;
        }
    }

    public void addDelivered(SupplyType supplyType, double quantity) {
        if (supplyType == null) return;
        switch (supplyType) {
            case FOOD: this.foodDelivered = (this.foodDelivered == null ? 0.0 : this.foodDelivered) + quantity; break;
            case WATER: this.waterDelivered = (this.waterDelivered == null ? 0.0 : this.waterDelivered) + quantity; break;
            case MEDICINE: this.medicineDelivered = (this.medicineDelivered == null ? 0.0 : this.medicineDelivered) + quantity; break;
            case SHELTER: this.shelterDelivered = (this.shelterDelivered == null ? 0.0 : this.shelterDelivered) + quantity; break;
        }
    }

    public double getUnmetDemand(SupplyType supplyType) {
        return Math.max(0.0, getDemand(supplyType) - getDelivered(supplyType));
    }

    public double getTotalRequestedDemand() {
        return (foodDemand != null ? foodDemand : 0) +
               (waterDemand != null ? waterDemand : 0) +
               (medicineDemand != null ? medicineDemand : 0) +
               (shelterDemand != null ? shelterDemand : 0);
    }

    public double getTotalDelivered() {
        return (foodDelivered != null ? foodDelivered : 0) +
               (waterDelivered != null ? waterDelivered : 0) +
               (medicineDelivered != null ? medicineDelivered : 0) +
               (shelterDelivered != null ? shelterDelivered : 0);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getContactPerson() { return contactPerson; }
    public void setContactPerson(String contactPerson) { this.contactPerson = contactPerson; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public SeverityLevel getSeverity() { return severity; }
    public void setSeverity(SeverityLevel severity) { this.severity = severity; }
    public Integer getPriorityScore() { return priorityScore; }
    public void setPriorityScore(Integer priorityScore) { this.priorityScore = priorityScore; }
    public Integer getAffectedPopulation() { return affectedPopulation; }
    public void setAffectedPopulation(Integer affectedPopulation) { this.affectedPopulation = affectedPopulation; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Double getFoodDemand() { return foodDemand; }
    public void setFoodDemand(Double foodDemand) { this.foodDemand = foodDemand; }
    public Double getWaterDemand() { return waterDemand; }
    public void setWaterDemand(Double waterDemand) { this.waterDemand = waterDemand; }
    public Double getMedicineDemand() { return medicineDemand; }
    public void setMedicineDemand(Double medicineDemand) { this.medicineDemand = medicineDemand; }
    public Double getShelterDemand() { return shelterDemand; }
    public void setShelterDemand(Double shelterDemand) { this.shelterDemand = shelterDemand; }
    public Double getFoodDelivered() { return foodDelivered; }
    public void setFoodDelivered(Double foodDelivered) { this.foodDelivered = foodDelivered; }
    public Double getWaterDelivered() { return waterDelivered; }
    public void setWaterDelivered(Double waterDelivered) { this.waterDelivered = waterDelivered; }
    public Double getMedicineDelivered() { return medicineDelivered; }
    public void setMedicineDelivered(Double medicineDelivered) { this.medicineDelivered = medicineDelivered; }
    public Double getShelterDelivered() { return shelterDelivered; }
    public void setShelterDelivered(Double shelterDelivered) { this.shelterDelivered = shelterDelivered; }
}
