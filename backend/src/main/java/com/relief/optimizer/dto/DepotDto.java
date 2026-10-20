package com.relief.optimizer.dto;

import com.relief.optimizer.model.SupplyType;

import javax.validation.constraints.*;
import java.util.ArrayList;
import java.util.List;

public class DepotDto {
    private Long id;

    @NotBlank(message = "Depot code cannot be blank")
    private String code;

    @NotBlank(message = "Depot name cannot be blank")
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

    @NotNull(message = "Max storage capacity is required")
    @PositiveOrZero(message = "Capacity must be >= 0")
    private Double maxCapacity;

    private String status = "ACTIVE";

    private List<InventoryItemDto> inventories = new ArrayList<>();

    public static class InventoryItemDto {
        private Long id;
        @NotNull(message = "Supply type is required")
        private SupplyType supplyType;
        @PositiveOrZero(message = "Available quantity cannot be negative")
        private Double availableQuantity = 0.0;
        @PositiveOrZero(message = "Reserved quantity cannot be negative")
        private Double reservedQuantity = 0.0;
        @PositiveOrZero(message = "Minimum threshold cannot be negative")
        private Double minimumThreshold = 10.0;
        private String unit;
        private boolean isLowStock;

        public InventoryItemDto() {}

        public InventoryItemDto(Long id, SupplyType supplyType, Double availableQuantity,
                                Double reservedQuantity, Double minimumThreshold, String unit) {
            this.id = id;
            this.supplyType = supplyType;
            this.availableQuantity = availableQuantity != null ? availableQuantity : 0.0;
            this.reservedQuantity = reservedQuantity != null ? reservedQuantity : 0.0;
            this.minimumThreshold = minimumThreshold != null ? minimumThreshold : 10.0;
            this.unit = unit != null ? unit : (supplyType != null ? supplyType.getDefaultUnit() : "units");
            this.isLowStock = this.availableQuantity <= this.minimumThreshold;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public SupplyType getSupplyType() { return supplyType; }
        public void setSupplyType(SupplyType supplyType) { this.supplyType = supplyType; }
        public Double getAvailableQuantity() { return availableQuantity; }
        public void setAvailableQuantity(Double availableQuantity) {
            this.availableQuantity = availableQuantity;
            this.isLowStock = availableQuantity != null && minimumThreshold != null && availableQuantity <= minimumThreshold;
        }
        public Double getReservedQuantity() { return reservedQuantity; }
        public void setReservedQuantity(Double reservedQuantity) { this.reservedQuantity = reservedQuantity; }
        public Double getMinimumThreshold() { return minimumThreshold; }
        public void setMinimumThreshold(Double minimumThreshold) {
            this.minimumThreshold = minimumThreshold;
            this.isLowStock = availableQuantity != null && minimumThreshold != null && availableQuantity <= minimumThreshold;
        }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public boolean isLowStock() { return isLowStock; }
        public void setLowStock(boolean lowStock) { isLowStock = lowStock; }
    }

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
    public Double getMaxCapacity() { return maxCapacity; }
    public void setMaxCapacity(Double maxCapacity) { this.maxCapacity = maxCapacity; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<InventoryItemDto> getInventories() { return inventories; }
    public void setInventories(List<InventoryItemDto> inventories) { this.inventories = inventories; }
}
