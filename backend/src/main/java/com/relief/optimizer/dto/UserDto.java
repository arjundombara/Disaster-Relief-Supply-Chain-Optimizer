
package com.relief.optimizer.dto;

import com.relief.optimizer.model.Role;
import com.relief.optimizer.model.User;
import com.relief.optimizer.model.WorkerApprovalStatus;

import java.time.LocalDateTime;

public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private Boolean active;
    private WorkerApprovalStatus approvalStatus;
    private Long assignedDepotId;
    private Long assignedLocationId;
    private String phone;
    private LocalDateTime createdAt;

    public UserDto() {}

    public static UserDto fromEntity(User user) {
        if (user == null) return null;

        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setActive(user.getActive());
        dto.setApprovalStatus(user.getApprovalStatus());
        dto.setAssignedDepotId(user.getAssignedDepotId());
        dto.setAssignedLocationId(user.getAssignedLocationId());
        dto.setPhone(user.getPhone());
        dto.setCreatedAt(user.getCreatedAt());

        return dto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    public WorkerApprovalStatus getApprovalStatus() {
        return approvalStatus;
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