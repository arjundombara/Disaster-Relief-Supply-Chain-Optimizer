package com.relief.optimizer.algorithm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Dinic's Maximum Flow Algorithm Tests")
public class DinicsMaxFlowTest {

    private DinicsMaxFlow dinic;

    @BeforeEach
    public void setUp() {
        dinic = new DinicsMaxFlow();
    }

    @Test
    @DisplayName("Dinic's Test: Standard Multi-Source Multi-Sink Network")
    public void testDinicsMatchesExpected() {
        FlowNetwork G = new FlowNetwork(6);
        G.setVertexName(0, "S");
        G.setVertexName(1, "DepotA");
        G.setVertexName(2, "DepotB");
        G.setVertexName(3, "DP1");
        G.setVertexName(4, "DP2");
        G.setVertexName(5, "T");

        G.addEdge(0, 1, 10.0, "S->A", "SUPER_SOURCE", null);
        G.addEdge(0, 2, 10.0, "S->B", "SUPER_SOURCE", null);
        G.addEdge(1, 3, 8.0, "A->DP1", "ROUTE", 1L);
        G.addEdge(1, 4, 4.0, "A->DP2", "ROUTE", 2L);
        G.addEdge(2, 3, 2.0, "B->DP1", "ROUTE", 3L);
        G.addEdge(2, 4, 8.0, "B->DP2", "ROUTE", 4L);
        G.addEdge(3, 5, 9.0, "DP1->T", "SUPER_SINK", null);
        G.addEdge(4, 5, 10.0, "DP2->T", "SUPER_SINK", null);

        FlowResult result = dinic.computeMaxFlow(G, 0, 5);

        assertEquals(19.0, result.getMaxFlow(), 1e-9);
        assertTrue(result.isFlowConservationSatisfied());
    }
}
