package com.relief.optimizer.algorithm;

import java.util.List;

public class AugmentingPathStep {
    private final int stepNumber;
    private final List<String> pathNodeNames;
    private final List<String> edgeLabels;
    private final double bottleneckCapacity;
    private final double cumulativeFlow;

    public AugmentingPathStep(int stepNumber, List<String> pathNodeNames, List<String> edgeLabels,
                              double bottleneckCapacity, double cumulativeFlow) {
        this.stepNumber = stepNumber;
        this.pathNodeNames = pathNodeNames;
        this.edgeLabels = edgeLabels;
        this.bottleneckCapacity = bottleneckCapacity;
        this.cumulativeFlow = cumulativeFlow;
    }

    public int getStepNumber() { return stepNumber; }
    public List<String> getPathNodeNames() { return pathNodeNames; }
    public List<String> getEdgeLabels() { return edgeLabels; }
    public double getBottleneckCapacity() { return bottleneckCapacity; }
    public double getCumulativeFlow() { return cumulativeFlow; }
}
