package com.relief.optimizer.dto;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

public class CreateWorkerRequestDto {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private Long assignedDepotId;
    private Long assignedLocationId;
    private String phone;

    public CreateWorkerRequestDto() {}

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public Long getAssignedDepotId() { return assignedDepotId; }
    public void setAssignedDepotId(Long assignedDepotId) { this.assignedDepotId = assignedDepotId; }
    public Long getAssignedLocationId() { return assignedLocationId; }
    public void setAssignedLocationId(Long assignedLocationId) { this.assignedLocationId = assignedLocationId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
