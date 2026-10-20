package com.relief.optimizer.algorithm;

public class FlowEdge {
    private final int from;
    private final int to;
    private final double capacity;
    private double flow;
    private FlowEdge residual;
    private String label;
    private String edgeType; // SUPER_SOURCE, ROUTE, SUPER_SINK, TRANSIT
    private Long routeId;

    public FlowEdge(int from, int to, double capacity) {
        this(from, to, capacity, "Route " + from + "->" + to, "ROUTE", null);
    }

    public FlowEdge(int from, int to, double capacity, String label, String edgeType, Long routeId) {
        if (capacity < 0) {
            throw new IllegalArgumentException("Edge capacity cannot be negative: " + capacity);
        }
        this.from = from;
        this.to = to;
        this.capacity = capacity;
        this.flow = 0.0;
        this.label = label;
        this.edgeType = edgeType != null ? edgeType : "ROUTE";
        this.routeId = routeId;
    }

    public int from() { return from; }
    public int to() { return to; }
    public double capacity() { return capacity; }
    public double flow() { return flow; }
    public FlowEdge residual() { return residual; }
    public void setResidual(FlowEdge residual) { this.residual = residual; }
    public String label() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String edgeType() { return edgeType; }
    public Long routeId() { return routeId; }

    public int other(int vertex) {
        if (vertex == from) return to;
        if (vertex == to) return from;
        throw new IllegalArgumentException("Illegal endpoint vertex: " + vertex);
    }

    public double residualCapacityTo(int vertex) {
        if (vertex == to) {
            return capacity - flow; // forward edge
        } else if (vertex == from) {
            return flow; // backward edge
        }
        throw new IllegalArgumentException("Illegal endpoint vertex: " + vertex);
    }

    public void addResidualFlowTo(int vertex, double delta) {
        if (vertex == to) {
            flow += delta;
        } else if (vertex == from) {
            flow -= delta;
        } else {
            throw new IllegalArgumentException("Illegal endpoint vertex: " + vertex);
        }
    }

    public boolean isSaturated() {
        return Math.abs(capacity - flow) < 1e-9;
    }

    public double getUtilizationPercentage() {
        if (capacity <= 0) return 0.0;
        return (flow / capacity) * 100.0;
    }
}
