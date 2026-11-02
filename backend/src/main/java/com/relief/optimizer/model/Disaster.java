package com.relief.optimizer.model;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "disasters")
public class Disaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Disaster name is required")
    @Column(nullable = false, length = 150)
    private String name;

    @NotBlank(message = "Disaster type is required")
    @Column(nullable = false, length = 50)
    private String disasterType; // FLOOD, EARTHQUAKE, CYCLONE, LANDSLIDE, WILDFIRE, OTHER

    @NotBlank(message = "Affected location description is required")
    @Column(nullable = false, length = 255)
    private String affectedLocation;

    @Column(length = 2000)
    private String description;

    @NotNull(message = "Reported timestamp is required")
    @Column(nullable = false)
    private LocalDateTime reportedAt = LocalDateTime.now();

    @NotNull(message = "Severity level is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SeverityLevel severity = SeverityLevel.HIGH;

    private Integer estimatedPopulation = 0;
    private String affectedAreas;
    private String requiredResources;
    private String urgentInstructions;

    @NotBlank(message = "Status is required")
    @Column(nullable = false, length = 30)
    private String status = "ACTIVE"; // REPORTED, ACTIVE, MONITORING, RESOLVED, CLOSED

    private String sourceInfo;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    private String updatedBy;

    public Disaster() {}

    public Disaster(Long id, String name, String disasterType, String affectedLocation, String description,
                    LocalDateTime reportedAt, SeverityLevel severity, Integer estimatedPopulation,
                    String affectedAreas, String requiredResources, String urgentInstructions,
                    String status, String sourceInfo, String updatedBy) {
        this.id = id;
        this.name = name;
        this.disasterType = disasterType != null ? disasterType : "OTHER";
        this.affectedLocation = affectedLocation;
        this.description = description;
        this.reportedAt = reportedAt != null ? reportedAt : LocalDateTime.now();
        this.severity = severity != null ? severity : SeverityLevel.HIGH;
        this.estimatedPopulation = estimatedPopulation != null ? estimatedPopulation : 0;
        this.affectedAreas = affectedAreas;
        this.requiredResources = requiredResources;
        this.urgentInstructions = urgentInstructions;
        this.status = status != null ? status : "ACTIVE";
        this.sourceInfo = sourceInfo;
        this.updatedAt = LocalDateTime.now();
        this.updatedBy = updatedBy;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDisasterType() { return disasterType; }
    public void setDisasterType(String disasterType) { this.disasterType = disasterType; }
    public String getAffectedLocation() { return affectedLocation; }
    public void setAffectedLocation(String affectedLocation) { this.affectedLocation = affectedLocation; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getReportedAt() { return reportedAt; }
    public void setReportedAt(LocalDateTime reportedAt) { this.reportedAt = reportedAt; }
    public SeverityLevel getSeverity() { return severity; }
    public void setSeverity(SeverityLevel severity) { this.severity = severity; }
    public Integer getEstimatedPopulation() { return estimatedPopulation; }
    public void setEstimatedPopulation(Integer estimatedPopulation) { this.estimatedPopulation = estimatedPopulation; }
    public String getAffectedAreas() { return affectedAreas; }
    public void setAffectedAreas(String affectedAreas) { this.affectedAreas = affectedAreas; }
    public String getRequiredResources() { return requiredResources; }
    public void setRequiredResources(String requiredResources) { this.requiredResources = requiredResources; }
    public String getUrgentInstructions() { return urgentInstructions; }
    public void setUrgentInstructions(String urgentInstructions) { this.urgentInstructions = urgentInstructions; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSourceInfo() { return sourceInfo; }
    public void setSourceInfo(String sourceInfo) { this.sourceInfo = sourceInfo; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
