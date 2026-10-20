package com.relief.optimizer.algorithm;

public class BottleneckRoute {
    private final String routeCode;
    private final String sourceNode;
    private final String destinationNode;
    private final double capacity;
    private final double flow;
    private final double utilizationPercentage;
    private final boolean isSaturated;
    private final boolean isMinCut;
    private final String diagnosis;

    public BottleneckRoute(String routeCode, String sourceNode, String destinationNode,
                           double capacity, double flow, boolean isMinCut) {
        this.routeCode = routeCode;
        this.sourceNode = sourceNode;
        this.destinationNode = destinationNode;
        this.capacity = capacity;
        this.flow = flow;
        this.utilizationPercentage = capacity > 0 ? (flow / capacity) * 100.0 : 0.0;
        this.isSaturated = capacity > 0 && Math.abs(capacity - flow) < 1e-9;
        this.isMinCut = isMinCut;

        if (this.isSaturated && this.isMinCut) {
            this.diagnosis = "CRITICAL BOTTLENECK: Saturated route on the Network Min-Cut. Increasing capacity here directly increases total deliverable supplies.";
        } else if (this.isSaturated) {
            this.diagnosis = "SATURATED ROUTE: Operating at 100% capacity.";
        } else if (flow <= 0) {
            this.diagnosis = "UNUSED ROUTE: 0 units routed (sufficient flow routed via alternate paths or limited supply/demand).";
        } else {
            this.diagnosis = String.format("BALANCED: %d%% utilized (%s of %s units).", (int) this.utilizationPercentage, flow, capacity);
        }
    }

    public String getRouteCode() { return routeCode; }
    public String getSourceNode() { return sourceNode; }
    public String getDestinationNode() { return destinationNode; }
    public double getCapacity() { return capacity; }
    public double getFlow() { return flow; }
    public double getUtilizationPercentage() { return utilizationPercentage; }
    public boolean isSaturated() { return isSaturated; }
    public boolean isMinCut() { return isMinCut; }
    public String getDiagnosis() { return diagnosis; }
}
