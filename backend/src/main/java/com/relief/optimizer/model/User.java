package com.relief.optimizer.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import javax.persistence.*;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username is required")
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "Password is required")
    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @NotBlank(message = "Full name is required")
    @Column(nullable = false, length = 100)
    private String fullName;

    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(nullable = false)
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    private WorkerApprovalStatus approvalStatus =
            WorkerApprovalStatus.APPROVED;

    private Long assignedDepotId;
    private Long assignedLocationId;
    private String phone;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {}

    public User(Long id, String username, String email, String password,
                String fullName, Role role, Boolean active,
                Long assignedDepotId, Long assignedLocationId, String phone) {

        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role != null ? role : Role.WORKER;
        this.active = active != null ? active : true;
        this.approvalStatus = WorkerApprovalStatus.APPROVED;
        this.assignedDepotId = assignedDepotId;
        this.assignedLocationId = assignedLocationId;
        this.phone = phone;
        this.createdAt = LocalDateTime.now();
    }

    @PrePersist
    public void beforeSave() {
        if (approvalStatus == null) {
            approvalStatus = WorkerApprovalStatus.APPROVED;
        }
        if (active == null) {
            active = true;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public WorkerApprovalStatus getApprovalStatus() {
        return approvalStatus == null
                ? WorkerApprovalStatus.APPROVED
                : approvalStatus;
    }

    public void setApprovalStatus(WorkerApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public Long getAssignedDepotId() { return assignedDepotId; }
    public void setAssignedDepotId(Long assignedDepotId) {
        this.assignedDepotId = assignedDepotId;
    }

    public Long getAssignedLocationId() { return assignedLocationId; }
    public void setAssignedLocationId(Long assignedLocationId) {
        this.assignedLocationId = assignedLocationId;
    }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
