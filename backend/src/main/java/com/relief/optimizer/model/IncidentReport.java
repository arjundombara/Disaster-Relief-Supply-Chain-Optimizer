package com.relief.optimizer.model;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident_reports")
public class IncidentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shipment_id")
    private Shipment shipment;

    @NotBlank(message = "Incident type is required")
    @Column(nullable = false)
    private String incidentType; // ROAD_BLOCKAGE, VEHICLE_BREAKDOWN, SEVERE_WEATHER, SECURITY_ALERT, SUPPLY_DAMAGE

    @Column(nullable = false)
    private String severity = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @NotBlank(message = "Description is required")
    @Column(length = 2000, nullable = false)
    private String description;

    private String reportedBy;
    private String locationDescription;
    private LocalDateTime reportedAt = LocalDateTime.now();

    @Column(nullable = false)
    private String status = "OPEN"; // OPEN, INVESTIGATING, RESOLVED

    private String resolutionNotes;

    public IncidentReport() {}

    public IncidentReport(Long id, Shipment shipment, String incidentType, String severity,
                          String description, String reportedBy, String locationDescription) {
        this.id = id;
        this.shipment = shipment;
        this.incidentType = incidentType;
        this.severity = severity != null ? severity : "MEDIUM";
        this.description = description;
        this.reportedBy = reportedBy;
        this.locationDescription = locationDescription;
        this.reportedAt = LocalDateTime.now();
        this.status = "OPEN";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Shipment getShipment() { return shipment; }
    public void setShipment(Shipment shipment) { this.shipment = shipment; }
    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getReportedBy() { return reportedBy; }
    public void setReportedBy(String reportedBy) { this.reportedBy = reportedBy; }
    public String getLocationDescription() { return locationDescription; }
    public void setLocationDescription(String locationDescription) { this.locationDescription = locationDescription; }
    public LocalDateTime getReportedAt() { return reportedAt; }
    public void setReportedAt(LocalDateTime reportedAt) { this.reportedAt = reportedAt; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
}
