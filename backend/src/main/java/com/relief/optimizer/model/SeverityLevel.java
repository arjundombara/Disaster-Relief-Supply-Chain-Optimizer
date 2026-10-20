package com.relief.optimizer.model;

public enum SeverityLevel {
    CRITICAL(5, "Critical - Immediate Life Threat"),
    HIGH(4, "High - Severe Shortage"),
    MODERATE(3, "Moderate - Significant Need"),
    LOW(1, "Low - Monitoring & Maintenance");

    private final int defaultPriority;
    private final String description;

    SeverityLevel(int defaultPriority, String description) {
        this.defaultPriority = defaultPriority;
        this.description = description;
    }

    public int getDefaultPriority() {
        return defaultPriority;
    }

    public String getDescription() {
        return description;
    }
}
