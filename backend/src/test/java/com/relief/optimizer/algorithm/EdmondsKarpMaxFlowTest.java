package com.relief.optimizer.algorithm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Edmonds-Karp Maximum Flow Algorithm - Mandatory 12 Test Cases")
public class EdmondsKarpMaxFlowTest {

    private EdmondsKarpMaxFlow edmondsKarp;

    @BeforeEach
    public void setUp() {
        edmondsKarp = new EdmondsKarpMaxFlow();
    }

    /**
     * Helper to construct a standard relief network with super-source (S) and super-sink (T).
     * S index = 0, T index = V - 1
     */
    private FlowNetwork createStandardNetwork(int numDepots, int numDPs) {
        int V = 2 + numDepots + numDPs;
        FlowNetwork G = new FlowNetwork(V);
        G.setVertexName(0, "SUPER_SOURCE");
        for (int i = 1; i <= numDepots; i++) {
            G.setVertexName(i, "DEPOT_" + i);
        }
        for (int j = 1; j <= numDPs; j++) {
            G.setVertexName(numDepots + j, "DP_" + j);
        }
        G.setVertexName(V - 1, "SUPER_SINK");
        return G;
    }

    @Test
    @DisplayName("Test Case 1: Simple Network (Supply: 10, Demand: 10, Route: 10 -> Expected: 10)")
    public void testCase1_simpleNetwork() {
        // Node 0: Source, 1: Depot, 2: DP, 3: Sink
        FlowNetwork G = createStandardNetwork(1, 1);
        int s = 0, depot = 1, dp = 2, t = 3;

        G.addEdge(s, depot, 10.0, "Supply", "SUPER_SOURCE", null);
        G.addEdge(depot, dp, 10.0, "Route-1", "ROUTE", 1L);
        G.addEdge(dp, t, 10.0, "Demand", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(10.0, result.getMaxFlow(), 1e-9, "Expected max flow of 10 units");
        assertTrue(result.isFlowConservationSatisfied(), "Flow conservation must be satisfied");
    }

    @Test
    @DisplayName("Test Case 2: Route Bottleneck (Supply: 20, Demand: 20, Route: 7 -> Expected: 7)")
    public void testCase2_routeBottleneck() {
        FlowNetwork G = createStandardNetwork(1, 1);
        int s = 0, depot = 1, dp = 2, t = 3;

        G.addEdge(s, depot, 20.0, "Supply", "SUPER_SOURCE", null);
        G.addEdge(depot, dp, 7.0, "Route-Bottleneck", "ROUTE", 1L);
        G.addEdge(dp, t, 20.0, "Demand", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(7.0, result.getMaxFlow(), 1e-9, "Expected max flow restricted to bottleneck of 7 units");
        assertTrue(result.getBottlenecks().stream().anyMatch(b -> b.isSaturated() && b.getFlow() == 7.0));
    }

    @Test
    @DisplayName("Test Case 3: Insufficient Supply (Supply: 5, Demand: 10, Route: 10 -> Expected: 5)")
    public void testCase3_insufficientSupply() {
        FlowNetwork G = createStandardNetwork(1, 1);
        int s = 0, depot = 1, dp = 2, t = 3;

        G.addEdge(s, depot, 5.0, "Supply-Scarce", "SUPER_SOURCE", null);
        G.addEdge(depot, dp, 10.0, "Route-1", "ROUTE", 1L);
        G.addEdge(dp, t, 10.0, "Demand", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(5.0, result.getMaxFlow(), 1e-9, "Expected max flow capped by depot supply of 5 units");
    }

    @Test
    @DisplayName("Test Case 4: Multiple Depots (Depot A: 5, Depot B: 7, DP: 12 -> Expected: 12)")
    public void testCase4_multipleDepots() {
        FlowNetwork G = createStandardNetwork(2, 1);
        int s = 0, depotA = 1, depotB = 2, dp = 3, t = 4;

        G.addEdge(s, depotA, 5.0, "Supply A", "SUPER_SOURCE", null);
        G.addEdge(s, depotB, 7.0, "Supply B", "SUPER_SOURCE", null);
        G.addEdge(depotA, dp, 10.0, "Route A->DP", "ROUTE", 1L);
        G.addEdge(depotB, dp, 10.0, "Route B->DP", "ROUTE", 2L);
        G.addEdge(dp, t, 12.0, "Demand", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(12.0, result.getMaxFlow(), 1e-9, "Expected total max flow of 12 units from both depots");
    }

    @Test
    @DisplayName("Test Case 5: Multiple Distribution Points (Supply: 15, DP A: 6, DP B: 9 -> Expected: 15)")
    public void testCase5_multipleDistributionPoints() {
        FlowNetwork G = createStandardNetwork(1, 2);
        int s = 0, depot = 1, dpA = 2, dpB = 3, t = 4;

        G.addEdge(s, depot, 15.0, "Supply", "SUPER_SOURCE", null);
        G.addEdge(depot, dpA, 10.0, "Route->DP A", "ROUTE", 1L);
        G.addEdge(depot, dpB, 10.0, "Route->DP B", "ROUTE", 2L);
        G.addEdge(dpA, t, 6.0, "Demand A", "SUPER_SINK", null);
        G.addEdge(dpB, t, 9.0, "Demand B", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(15.0, result.getMaxFlow(), 1e-9, "Expected max flow of 15 units satisfying both DPs");
    }

    @Test
    @DisplayName("Test Case 6: Disconnected Network (No path -> Expected: 0)")
    public void testCase6_disconnectedNetwork() {
        FlowNetwork G = createStandardNetwork(1, 1);
        int s = 0, depot = 1, dp = 2, t = 3;

        G.addEdge(s, depot, 10.0, "Supply", "SUPER_SOURCE", null);
        // NO route between depot and dp
        G.addEdge(dp, t, 10.0, "Demand", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(0.0, result.getMaxFlow(), 1e-9, "Disconnected network must have 0 flow");
        assertEquals(0, result.getAugmentingSteps().size(), "No augmenting paths should be found");
    }

    @Test
    @DisplayName("Test Case 7: Zero Capacity Route (Capacity 0 -> Expected: 0)")
    public void testCase7_zeroCapacityRoute() {
        FlowNetwork G = createStandardNetwork(1, 1);
        int s = 0, depot = 1, dp = 2, t = 3;

        G.addEdge(s, depot, 10.0, "Supply", "SUPER_SOURCE", null);
        G.addEdge(depot, dp, 0.0, "Blocked Route", "ROUTE", 1L);
        G.addEdge(dp, t, 10.0, "Demand", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(0.0, result.getMaxFlow(), 1e-9, "Zero capacity route must result in 0 flow");
    }

    @Test
    @DisplayName("Test Case 8: Multiple Bottlenecks / Alternative Paths (True Max Flow vs Greedy Shortest Path)")
    public void testCase8_multipleBottlenecks() {
        // Classic diamond network: S -> A (10), S -> B (10), A -> B (2), A -> T (10), B -> T (10)
        // Tests residual edges and augmenting path optimality
        FlowNetwork G = new FlowNetwork(4);
        G.setVertexName(0, "S");
        G.setVertexName(1, "NodeA");
        G.setVertexName(2, "NodeB");
        G.setVertexName(3, "T");

        G.addEdge(0, 1, 10.0, "S->A", "ROUTE", 1L);
        G.addEdge(0, 2, 10.0, "S->B", "ROUTE", 2L);
        G.addEdge(1, 2, 2.0, "A->B", "ROUTE", 3L);
        G.addEdge(1, 3, 10.0, "A->T", "ROUTE", 4L);
        G.addEdge(2, 3, 10.0, "B->T", "ROUTE", 5L);

        FlowResult result = edmondsKarp.computeMaxFlow(G, 0, 3);

        assertEquals(20.0, result.getMaxFlow(), 1e-9, "Edmonds-Karp must find full max flow of 20");
    }

    @Test
    @DisplayName("Test Case 9: Invalid Negative Capacity (Throws Validation Error)")
    public void testCase9_invalidNegativeCapacity() {
        FlowNetwork G = new FlowNetwork(3);
        assertThrows(IllegalArgumentException.class, () -> {
            G.addEdge(0, 1, -5.0, "Negative Edge", "ROUTE", 1L);
        }, "Negative capacity must be rejected with IllegalArgumentException");
    }

    @Test
    @DisplayName("Test Case 10: Flow Conservation at Intermediate Nodes")
    public void testCase10_flowConservation() {
        // Multi-tier network: S -> Depot1, Depot2 -> TransitHub -> DP1, DP2 -> T
        FlowNetwork G = new FlowNetwork(6);
        G.setVertexName(0, "S");
        G.setVertexName(1, "Depot1");
        G.setVertexName(2, "TransitHub");
        G.setVertexName(3, "DP1");
        G.setVertexName(4, "DP2");
        G.setVertexName(5, "T");

        G.addEdge(0, 1, 30.0, "S->Depot1", "SUPER_SOURCE", null);
        G.addEdge(1, 2, 25.0, "Depot1->Transit", "ROUTE", 1L);
        G.addEdge(2, 3, 10.0, "Transit->DP1", "ROUTE", 2L);
        G.addEdge(2, 4, 15.0, "Transit->DP2", "ROUTE", 3L);
        G.addEdge(3, 5, 10.0, "DP1->T", "SUPER_SINK", null);
        G.addEdge(4, 5, 20.0, "DP2->T", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, 0, 5);

        assertEquals(25.0, result.getMaxFlow(), 1e-9, "Max flow should be 25 units");
        assertTrue(result.isFlowConservationSatisfied(), "Intermediate vertices must satisfy flow conservation");
        assertTrue(G.checkFlowConservation(0, 5, 1e-9), "Flow conservation check on network must return true");
    }

    @Test
    @DisplayName("Test Case 11: Demand Constraint (DP never receives more than demand)")
    public void testCase11_demandConstraint() {
        FlowNetwork G = createStandardNetwork(1, 1);
        int s = 0, depot = 1, dp = 2, t = 3;

        G.addEdge(s, depot, 50.0, "Supply", "SUPER_SOURCE", null);
        G.addEdge(depot, dp, 40.0, "Route", "ROUTE", 1L);
        G.addEdge(dp, t, 15.0, "Demand-Cap", "SUPER_SINK", null); // Demand is strictly 15

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(15.0, result.getMaxFlow(), 1e-9, "DP must never receive more than its demand of 15");
        // Verify edge into sink has flow <= 15
        FlowResult.EdgeFlowInfo sinkEdge = result.getEdgeFlows().stream()
                .filter(e -> "SUPER_SINK".equals(e.edgeType()))
                .findFirst().orElseThrow();
        assertEquals(15.0, sinkEdge.getFlow(), 1e-9);
    }

    @Test
    @DisplayName("Test Case 12: Inventory Constraint (Depot never dispatches more than supply)")
    public void testCase12_inventoryConstraint() {
        FlowNetwork G = createStandardNetwork(1, 1);
        int s = 0, depot = 1, dp = 2, t = 3;

        G.addEdge(s, depot, 8.0, "Inventory-Cap", "SUPER_SOURCE", null); // Inventory strictly 8
        G.addEdge(depot, dp, 50.0, "Route-HighCap", "ROUTE", 1L);
        G.addEdge(dp, t, 50.0, "Demand-High", "SUPER_SINK", null);

        FlowResult result = edmondsKarp.computeMaxFlow(G, s, t);

        assertEquals(8.0, result.getMaxFlow(), 1e-9, "Depot must never dispatch more than its inventory of 8");
        FlowResult.EdgeFlowInfo sourceEdge = result.getEdgeFlows().stream()
                .filter(e -> "SUPER_SOURCE".equals(e.edgeType()))
                .findFirst().orElseThrow();
        assertEquals(8.0, sourceEdge.getFlow(), 1e-9);
    }
}
