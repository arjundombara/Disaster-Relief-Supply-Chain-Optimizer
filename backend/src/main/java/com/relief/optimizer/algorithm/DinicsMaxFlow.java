package com.relief.optimizer.algorithm;

import java.util.*;

public class DinicsMaxFlow {
    private static final double EPSILON = 1e-9;

    public FlowResult computeMaxFlow(FlowNetwork G, int s, int t) {
        G.validateVertex(s);
        G.validateVertex(t);
        if (s == t) {
            throw new IllegalArgumentException("Source and sink must be distinct vertices");
        }

        long startTime = System.nanoTime();
        double maxFlow = 0.0;
        int levelGraphPhases = 0;

        int[] level = new int[G.V()];

        while (bfs(G, s, t, level)) {
            levelGraphPhases++;
            int[] ptr = new int[G.V()];
            while (true) {
                double pushed = dfs(G, s, t, Double.POSITIVE_INFINITY, level, ptr);
                if (pushed <= EPSILON) break;
                maxFlow += pushed;
            }
        }

        long endTime = System.nanoTime();
        double executionTimeMs = (endTime - startTime) / 1_000_000.0;

        // BFS in residual graph for Min-Cut
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
            if (inMinCut[v]) sourceCutNodes.add(G.getVertexName(v));
            else sinkCutNodes.add(G.getVertexName(v));
        }

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
                "Dinic's Algorithm (Level Graph & Blocking Flow)",
                maxFlow,
                levelGraphPhases,
                executionTimeMs,
                conservation,
                Collections.emptyList(),
                bottlenecks,
                edgeFlows,
                sourceCutNodes,
                sinkCutNodes
        );
    }

    private boolean bfs(FlowNetwork G, int s, int t, int[] level) {
        Arrays.fill(level, -1);
        level[s] = 0;
        Queue<Integer> queue = new LinkedList<>();
        queue.add(s);

        while (!queue.isEmpty()) {
            int v = queue.poll();
            for (FlowEdge e : G.adj(v)) {
                int w = e.other(v);
                if (level[w] < 0 && e.residualCapacityTo(w) > EPSILON) {
                    level[w] = level[v] + 1;
                    queue.add(w);
                }
            }
        }
        return level[t] >= 0;
    }

    private double dfs(FlowNetwork G, int v, int t, double pushed, int[] level, int[] ptr) {
        if (pushed <= EPSILON) return 0;
        if (v == t) return pushed;

        List<FlowEdge> adj = G.adj(v);
        for (; ptr[v] < adj.size(); ptr[v]++) {
            FlowEdge e = adj.get(ptr[v]);
            int w = e.other(v);

            if (level[v] + 1 != level[w] || e.residualCapacityTo(w) <= EPSILON) {
                continue;
            }

            double tr = dfs(G, w, t, Math.min(pushed, e.residualCapacityTo(w)), level, ptr);
            if (tr <= EPSILON) {
                continue;
            }

            e.addResidualFlowTo(w, tr);
            return tr;
        }
        return 0;
    }
}
