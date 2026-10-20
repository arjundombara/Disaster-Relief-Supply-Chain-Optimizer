package com.relief.optimizer.model;

public enum SupplyType {
    FOOD("Food Rations", "kg"),
    WATER("Potable Water", "Liters"),
    MEDICINE("Medical Supplies", "Kits"),
    SHELTER("Emergency Shelters", "Units");

    private final String displayName;
    private final String defaultUnit;

    SupplyType(String displayName, String defaultUnit) {
        this.displayName = displayName;
        this.defaultUnit = defaultUnit;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDefaultUnit() {
        return defaultUnit;
    }
}
