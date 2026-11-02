package com.relief.optimizer.model;

import javax.persistence.*;
import javax.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "official_instructions")
public class OfficialInstruction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank(message = "Message is required")
    @Column(nullable = false, length = 4000)
    private String message;

    private Long disasterId;
    private String disasterName;

    private String targetAudience = "ALL_WORKERS"; // ALL_WORKERS, DEPOT_TEAM, ZONE_TEAM, SPECIFIC_WORKER
    private Long targetEntityId; // workerId or depotId or locationId

    @Column(nullable = false, length = 20)
    private String priority = "NORMAL"; // NORMAL, HIGH, URGENT

    @Column(nullable = false, length = 30)
    private String status = "PUBLISHED"; // DRAFT, PUBLISHED, WITHDRAWN

    private String issuingAdmin;
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private Integer acknowledgementCount = 0;

    public OfficialInstruction() {}

    public OfficialInstruction(Long id, String title, String message, Long disasterId, String disasterName,
                               String targetAudience, Long targetEntityId, String priority,
                               String status, String issuingAdmin, LocalDateTime expiryTime) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.disasterId = disasterId;
        this.disasterName = disasterName;
        this.targetAudience = targetAudience != null ? targetAudience : "ALL_WORKERS";
        this.targetEntityId = targetEntityId;
        this.priority = priority != null ? priority : "NORMAL";
        this.status = status != null ? status : "PUBLISHED";
        this.issuingAdmin = issuingAdmin;
        this.expiryTime = expiryTime;
        this.createdAt = LocalDateTime.now();
        this.acknowledgementCount = 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Long getDisasterId() { return disasterId; }
    public void setDisasterId(Long disasterId) { this.disasterId = disasterId; }
    public String getDisasterName() { return disasterName; }
    public void setDisasterName(String disasterName) { this.disasterName = disasterName; }
    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }
    public Long getTargetEntityId() { return targetEntityId; }
    public void setTargetEntityId(Long targetEntityId) { this.targetEntityId = targetEntityId; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getIssuingAdmin() { return issuingAdmin; }
    public void setIssuingAdmin(String issuingAdmin) { this.issuingAdmin = issuingAdmin; }
    public LocalDateTime getExpiryTime() { return expiryTime; }
    public void setExpiryTime(LocalDateTime expiryTime) { this.expiryTime = expiryTime; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public Integer getAcknowledgementCount() { return acknowledgementCount; }
    public void setAcknowledgementCount(Integer acknowledgementCount) { this.acknowledgementCount = acknowledgementCount; }
}
