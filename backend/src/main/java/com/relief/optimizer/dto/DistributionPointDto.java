package com.relief.optimizer.dto;

import com.relief.optimizer.model.SeverityLevel;

import javax.validation.constraints.*;

public class DistributionPointDto {
    private Long id;

    @NotBlank(message = "Distribution point code cannot be blank")
    private String code;

    @NotBlank(message = "Distribution point name cannot be blank")
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

    private SeverityLevel severity = SeverityLevel.HIGH;

    @Min(value = 1, message = "Priority score must be >= 1")
    @Max(value = 5, message = "Priority score must be <= 5")
    private Integer priorityScore = 3;

    @PositiveOrZero(message = "Affected population must be >= 0")
    private Integer affectedPopulation = 0;

    private String status = "ACTIVE";

    @PositiveOrZero(message = "Food demand must be >= 0")
    private Double foodDemand = 0.0;

    @PositiveOrZero(message = "Water demand must be >= 0")
    private Double waterDemand = 0.0;

    @PositiveOrZero(message = "Medicine demand must be >= 0")
    private Double medicineDemand = 0.0;

    @PositiveOrZero(message = "Shelter demand must be >= 0")
    private Double shelterDemand = 0.0;

    private Double foodDelivered = 0.0;
    private Double waterDelivered = 0.0;
    private Double medicineDelivered = 0.0;
    private Double shelterDelivered = 0.0;

    private Double totalDemand;
    private Double totalDelivered;
    private Double satisfactionRate;

    public DistributionPointDto() {}

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
    public Double getTotalDemand() { return totalDemand; }
    public void setTotalDemand(Double totalDemand) { this.totalDemand = totalDemand; }
    public Double getTotalDelivered() { return totalDelivered; }
    public void setTotalDelivered(Double totalDelivered) { this.totalDelivered = totalDelivered; }
    public Double getSatisfactionRate() { return satisfactionRate; }
    public void setSatisfactionRate(Double satisfactionRate) { this.satisfactionRate = satisfactionRate; }
}
