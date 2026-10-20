package com.relief.optimizer.model;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public enum ShipmentStatus {
    PENDING,
    PLANNED,
    DISPATCHED,
    DELIVERED,
    CANCELLED;

    public boolean canTransitionTo(ShipmentStatus target) {
        if (this == target) return true;
        switch (this) {
            case PENDING:
                return target == PLANNED || target == DISPATCHED || target == CANCELLED;
            case PLANNED:
                return target == DISPATCHED || target == CANCELLED;
            case DISPATCHED:
                return target == DELIVERED || target == CANCELLED;
            case DELIVERED:
            case CANCELLED:
                return false;
            default:
                return false;
        }
    }

    public List<ShipmentStatus> getValidNextStatuses() {
        switch (this) {
            case PENDING:
                return Arrays.asList(PLANNED, DISPATCHED, CANCELLED);
            case PLANNED:
                return Arrays.asList(DISPATCHED, CANCELLED);
            case DISPATCHED:
                return Arrays.asList(DELIVERED, CANCELLED);
            default:
                return Collections.emptyList();
        }
    }
}
