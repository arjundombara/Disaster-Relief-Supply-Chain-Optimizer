package com.relief.optimizer.algorithm;

import java.util.*;

public class FlowResult {
    private final String algorithmName;
    private final double maxFlow;
    private final int iterationsCount;
    private final double executionTimeMs;
    private final boolean flowConservationSatisfied;
    private final List<AugmentingPathStep> augmentingSteps;
    private final List<BottleneckRoute> bottlenecks;
    private final List<EdgeFlowInfo> edgeFlows;
    private final Set<String> minCutSourceSide;
    private final Set<String> minCutSinkSide;
    private final String fairnessDisclaimer;

    public FlowResult(String algorithmName, double maxFlow, int iterationsCount, double executionTimeMs,
                      boolean flowConservationSatisfied, List<AugmentingPathStep> augmentingSteps,
                      List<BottleneckRoute> bottlenecks, List<EdgeFlowInfo> edgeFlows,
                      Set<String> minCutSourceSide, Set<String> minCutSinkSide) {
        this.algorithmName = algorithmName;
        this.maxFlow = maxFlow;
        this.iterationsCount = iterationsCount;
        this.executionTimeMs = executionTimeMs;
        this.flowConservationSatisfied = flowConservationSatisfied;
        this.augmentingSteps = augmentingSteps != null ? augmentingSteps : Collections.emptyList();
        this.bottlenecks = bottlenecks != null ? bottlenecks : Collections.emptyList();
        this.edgeFlows = edgeFlows != null ? edgeFlows : Collections.emptyList();
        this.minCutSourceSide = minCutSourceSide != null ? minCutSourceSide : Collections.emptySet();
        this.minCutSinkSide = minCutSinkSide != null ? minCutSinkSide : Collections.emptySet();
        this.fairnessDisclaimer = "NOTE: Edmonds-Karp/Dinic maximum flow optimizes solely for aggregate network throughput (total volume delivered). " +
                "It does not automatically guarantee equitable or proportional distribution among disaster zones. " +
                "Fairness policies (Proportional Fair, Priority-Weighted) are applied during Module 3 supply allocation.";
    }

    public static class EdgeFlowInfo {
        private final String fromNode;
        private final String toNode;
        private final String label;
        private final String edgeType;
        private final Long routeId;
        private final double capacity;
        private final double flow;
        private final double utilizationPercentage;
        private final boolean isSaturated;

        public EdgeFlowInfo(String fromNode, String toNode, String label, String edgeType,
                            Long routeId, double capacity, double flow) {
            this.fromNode = fromNode;
            this.toNode = toNode;
            this.label = label;
            this.edgeType = edgeType;
            this.routeId = routeId;
            this.capacity = capacity;
            this.flow = flow;
            this.utilizationPercentage = capacity > 0 ? (flow / capacity) * 100.0 : 0.0;
            this.isSaturated = capacity > 0 && Math.abs(capacity - flow) < 1e-9;
        }

        public String getFromNode() { return fromNode; }
        public String getToNode() { return toNode; }
        public String getLabel() { return label; }
        public String edgeType() { return edgeType; }
        public Long getRouteId() { return routeId; }
        public double getCapacity() { return capacity; }
        public double getFlow() { return flow; }
        public double getUtilizationPercentage() { return utilizationPercentage; }
        public boolean isSaturated() { return isSaturated; }
    }

    public String getAlgorithmName() { return algorithmName; }
    public double getMaxFlow() { return maxFlow; }
    public int getIterationsCount() { return iterationsCount; }
    public double getExecutionTimeMs() { return executionTimeMs; }
    public boolean isFlowConservationSatisfied() { return flowConservationSatisfied; }
    public List<AugmentingPathStep> getAugmentingSteps() { return augmentingSteps; }
    public List<BottleneckRoute> getBottlenecks() { return bottlenecks; }
    public List<EdgeFlowInfo> getEdgeFlows() { return edgeFlows; }
    public Set<String> getMinCutSourceSide() { return minCutSourceSide; }
    public Set<String> getMinCutSinkSide() { return minCutSinkSide; }
    public String getFairnessDisclaimer() { return fairnessDisclaimer; }
}
