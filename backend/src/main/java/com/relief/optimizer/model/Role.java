package com.relief.optimizer.model;

public enum Role {
    ADMIN("Administrator"),
    WORKER("Relief Field Worker");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
