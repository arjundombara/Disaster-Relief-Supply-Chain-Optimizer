package com.relief.optimizer.algorithm;

import java.util.*;

public class EdmondsKarpMaxFlow {
    private static final double EPSILON = 1e-9;

    public FlowResult computeMaxFlow(FlowNetwork G, int s, int t) {
        G.validateVertex(s);
        G.validateVertex(t);
        if (s == t) {
            throw new IllegalArgumentException("Source and sink must be distinct vertices");
        }

        long startTime = System.nanoTime();
        double maxFlow = 0.0;
        int iterations = 0;
        List<AugmentingPathStep> stepTrace = new ArrayList<>();

        // Reset flows on all edges if reusing network
        for (FlowEdge e : G.edges()) {
            // flow is already 0 on new network, but ensure clean state
        }

        while (true) {
            // BFS to find shortest augmenting path in terms of edge count
            FlowEdge[] edgeTo = new FlowEdge[G.V()];
            boolean[] marked = new boolean[G.V()];
            Queue<Integer> queue = new LinkedList<>();

            queue.add(s);
            marked[s] = true;

            while (!queue.isEmpty() && !marked[t]) {
                int v = queue.poll();
                for (FlowEdge e : G.adj(v)) {
                    int w = e.other(v);
                    // If residual capacity > 0 and w not yet visited
                    if (e.residualCapacityTo(w) > EPSILON && !marked[w]) {
                        edgeTo[w] = e;
                        marked[w] = true;
                        queue.add(w);
                    }
                }
            }

            // If sink is not reachable, no more augmenting paths
            if (!marked[t]) {
                break;
            }

            // Find bottleneck capacity along the augmenting path
            double bottleneck = Double.POSITIVE_INFINITY;
            List<Integer> pathVertices = new ArrayList<>();
            for (int v = t; v != s; v = edgeTo[v].other(v)) {
                pathVertices.add(v);
                bottleneck = Math.min(bottleneck, edgeTo[v].residualCapacityTo(v));
            }
            pathVertices.add(s);
            Collections.reverse(pathVertices);

            // Augment flow along the path
            for (int v = t; v != s; v = edgeTo[v].other(v)) {
                edgeTo[v].addResidualFlowTo(v, bottleneck);
            }

            maxFlow += bottleneck;
            iterations++;

            // Record execution step
            List<String> nodeNames = new ArrayList<>();
            List<String> edgeLabels = new ArrayList<>();
            for (int v : pathVertices) {
                nodeNames.add(G.getVertexName(v));
            }
            for (int i = 0; i < pathVertices.size() - 1; i++) {
                int u = pathVertices.get(i);
                int v = pathVertices.get(i + 1);
                edgeLabels.add(u + "->" + v);
            }
            stepTrace.add(new AugmentingPathStep(iterations, nodeNames, edgeLabels, bottleneck, maxFlow));
        }

        long endTime = System.nanoTime();
        double executionTimeMs = (endTime - startTime) / 1_000_000.0;

        // Determine Min-Cut partition via final BFS from source in residual graph
        boolean[] inMinCut = new boolean[G.V()];
        Queue<Integer> queue = new LinkedList<>();
        queue.add(s);
        inMinCut[s] = true;
        while (!queue.isEmpty()) {
            int v = queue.poll();
            for (FlowEdge e : G.adj(v)) {
                int w = e.other(v);
                if (e.residualCapacityTo(w) > EPSILON && !inMinCut[w]) {
                    inMinCut[w] = true;
                    queue.add(w);
                }
            }
        }

        Set<String> sourceCutNodes = new LinkedHashSet<>();
        Set<String> sinkCutNodes = new LinkedHashSet<>();
        for (int v = 0; v < G.V(); v++) {
            if (inMinCut[v]) {
                sourceCutNodes.add(G.getVertexName(v));
            } else {
                sinkCutNodes.add(G.getVertexName(v));
            }
        }

        // Identify bottleneck and edge results
        List<BottleneckRoute> bottlenecks = new ArrayList<>();
        List<FlowResult.EdgeFlowInfo> edgeFlows = new ArrayList<>();

        for (FlowEdge e : G.edges()) {
            String fromName = G.getVertexName(e.from());
            String toName = G.getVertexName(e.to());

            boolean isCutEdge = inMinCut[e.from()] && !inMinCut[e.to()];
            if ("ROUTE".equals(e.edgeType())) {
                bottlenecks.add(new BottleneckRoute(
                        e.label(), fromName, toName,
                        e.capacity(), e.flow(), isCutEdge
                ));
            }

            edgeFlows.add(new FlowResult.EdgeFlowInfo(
                    fromName, toName, e.label(), e.edgeType(),
                    e.routeId(), e.capacity(), e.flow()
            ));
        }

        boolean conservation = G.checkFlowConservation(s, t, EPSILON);

        return new FlowResult(
                "Edmonds-Karp (BFS Augmenting Paths)",
                maxFlow,
                iterations,
                executionTimeMs,
                conservation,
                stepTrace,
                bottlenecks,
                edgeFlows,
                sourceCutNodes,
                sinkCutNodes
        );
    }
}
