package com.relief.optimizer.algorithm;

import java.util.*;

public class FlowNetwork {
    private final int V;
    private int E;
    private final List<List<FlowEdge>> adj;
    private final Map<String, Integer> nameToIndex = new HashMap<>();
    private final Map<Integer, String> indexToName = new HashMap<>();
    private final List<FlowEdge> allEdges = new ArrayList<>();

    public FlowNetwork(int V) {
        if (V < 0) throw new IllegalArgumentException("Number of vertices in a FlowNetwork must be non-negative");
        this.V = V;
        this.E = 0;
        this.adj = new ArrayList<>(V);
        for (int i = 0; i < V; i++) {
            adj.add(new ArrayList<>());
        }
    }

    public int V() { return V; }
    public int E() { return E; }

    public void setVertexName(int v, String name) {
        validateVertex(v);
        nameToIndex.put(name, v);
        indexToName.put(v, name);
    }

    public String getVertexName(int v) {
        validateVertex(v);
        return indexToName.getOrDefault(v, "Vertex_" + v);
    }

    public Integer getVertexIndex(String name) {
        return nameToIndex.get(name);
    }

    public void addEdge(FlowEdge e) {
        validateVertex(e.from());
        validateVertex(e.to());

        FlowEdge backward = new FlowEdge(e.to(), e.from(), 0.0, "Residual " + e.label(), e.edgeType(), e.routeId());
        e.setResidual(backward);
        backward.setResidual(e);

        adj.get(e.from()).add(e);
        adj.get(e.to()).add(backward);
        allEdges.add(e);
        E++;
    }

    public void addEdge(int from, int to, double capacity, String label, String edgeType, Long routeId) {
        if (capacity < 0) {
            throw new IllegalArgumentException("Edge capacity cannot be negative: " + capacity);
        }
        FlowEdge edge = new FlowEdge(from, to, capacity, label, edgeType, routeId);
        addEdge(edge);
    }

    public List<FlowEdge> adj(int v) {
        validateVertex(v);
        return Collections.unmodifiableList(adj.get(v));
    }

    public List<FlowEdge> edges() {
        return Collections.unmodifiableList(allEdges);
    }

    public void validateVertex(int v) {
        if (v < 0 || v >= V) {
            throw new IllegalArgumentException("Vertex " + v + " is not between 0 and " + (V - 1));
        }
    }

    /**
     * Checks if flow conservation is satisfied for all intermediate vertices (i.e. excluding source and sink)
     */
    public boolean checkFlowConservation(int source, int sink, double epsilon) {
        validateVertex(source);
        validateVertex(sink);

        double[] netFlow = new double[V]; // net incoming - outgoing
        for (FlowEdge e : allEdges) {
            netFlow[e.from()] -= e.flow(); // Outgoing from e.from()
            netFlow[e.to()] += e.flow();   // Incoming to e.to()
        }

        for (int v = 0; v < V; v++) {
            if (v == source || v == sink) continue;
            if (Math.abs(netFlow[v]) > epsilon) {
                return false;
            }
        }
        return true;
    }
}
