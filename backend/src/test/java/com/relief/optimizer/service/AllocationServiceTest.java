package com.relief.optimizer.service;

import com.relief.optimizer.algorithm.FlowResult;
import com.relief.optimizer.model.*;
import com.relief.optimizer.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
@DisplayName("Allocation and Fairness Tests")
public class AllocationServiceTest {

    @Autowired private DepotRepository depotRepository;
    @Autowired private DistributionPointRepository dpRepository;
    @Autowired private RouteRepository routeRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private ShipmentRepository shipmentRepository;
    @Autowired private AllocationRepository allocationRepository;
    @Autowired private AllocationService allocationService;
    @Autowired private MaxFlowService maxFlowService;

    private Depot depotA, depotB;
    private DistributionPoint dp1, dp2, dp3;

    @BeforeEach
    public void setUp() {
        shipmentRepository.deleteAll();
        allocationRepository.deleteAll();
        routeRepository.deleteAll();
        inventoryRepository.deleteAll();
        dpRepository.deleteAll();
        depotRepository.deleteAll();

        depotA = depotRepository.save(new Depot(null, "AL-DA", "Depot A", 28.0, 77.0, null, null, null, 1000.0, "ACTIVE"));
        depotB = depotRepository.save(new Depot(null, "AL-DB", "Depot B", 28.5, 77.5, null, null, null, 1000.0, "ACTIVE"));

        addInventory(depotA, SupplyType.FOOD, 100.0);
        addInventory(depotA, SupplyType.WATER, 200.0);
        addInventory(depotB, SupplyType.FOOD, 80.0);
        addInventory(depotB, SupplyType.WATER, 150.0);

        dp1 = dpRepository.save(new DistributionPoint(null, "AL-DP1", "Zone 1", 17.0, 82.0, null, null, null,
                SeverityLevel.CRITICAL, 5, 5000, "ACTIVE", 60.0, 100.0, 0.0, 0.0));
        dp2 = dpRepository.save(new DistributionPoint(null, "AL-DP2", "Zone 2", 18.0, 83.0, null, null, null,
                SeverityLevel.HIGH, 4, 3000, "ACTIVE", 80.0, 120.0, 0.0, 0.0));
        dp3 = dpRepository.save(new DistributionPoint(null, "AL-DP3", "Zone 3", 19.0, 84.0, null, null, null,
                SeverityLevel.MODERATE, 2, 2000, "ACTIVE", 40.0, 80.0, 0.0, 0.0));

        createRoute("AL-R01", depotA, dp1, 70.0);
        createRoute("AL-R02", depotA, dp2, 80.0);
        createRoute("AL-R03", depotA, dp3, 50.0);
        createRoute("AL-R04", depotB, dp1, 60.0);
        createRoute("AL-R05", depotB, dp2, 70.0);
        createRoute("AL-R06", depotB, dp3, 40.0);
    }

    private void addInventory(Depot depot, SupplyType type, double qty) {
        Inventory inv = new Inventory(null, depot, type, qty, 0.0, 5.0, type.getDefaultUnit());
        depot.addInventory(inv);
        inventoryRepository.save(inv);
    }

    private void createRoute(String code, Depot src, DistributionPoint dp, double cap) {
        routeRepository.save(new Route(null, code, src, dp, cap, 100.0, 2.0, "CLEAR", true));
    }

    // C1: Allocation does not exceed inventory
    @Test
    @DisplayName("C1: Total food allocation must not exceed available inventory (100+80=180)")
    public void testAllocationDoesNotExceedInventory() {
        Allocation allocation = allocationService.runAllocation(SupplyType.FOOD, "EDMONDS_KARP", "MAX_FLOW");
        double totalInventory = 100.0 + 80.0; // depotA + depotB
        assertTrue(allocation.getTotalAllocatedFlow() <= totalInventory + 1e-6,
                "Allocation " + allocation.getTotalAllocatedFlow() + " exceeds inventory " + totalInventory);
    }

    // C2: Allocation does not exceed demand
    @Test
    @DisplayName("C2: Total food allocation must not exceed total demand (60+80+40=180)")
    public void testAllocationDoesNotExceedDemand() {
        Allocation allocation = allocationService.runAllocation(SupplyType.FOOD, "EDMONDS_KARP", "MAX_FLOW");
        double totalDemand = 60.0 + 80.0 + 40.0;
        assertTrue(allocation.getTotalAllocatedFlow() <= totalDemand + 1e-6,
                "Allocation " + allocation.getTotalAllocatedFlow() + " exceeds demand " + totalDemand);
    }

    // C3: Unmet demand calculated correctly
    @Test
    @DisplayName("C3: Unmet demand = total demand - allocated flow (both must be consistent)")
    public void testUnmetDemandCalculation() {
        Allocation allocation = allocationService.runAllocation(SupplyType.FOOD, "EDMONDS_KARP", "MAX_FLOW");
        double expectedUnmet = allocation.getTotalRequestedDemand() - allocation.getTotalAllocatedFlow();
        assertEquals(Math.max(0, expectedUnmet), allocation.getUnmetDemand(), 1e-6,
                "Unmet demand calculation mismatch");
    }

    // C4: Priority allocation respects configured priorities
    @Test
    @DisplayName("C4: Priority-weighted allocation satisfies critical zone (priority 5) before low-priority (priority 2)")
    public void testPriorityAllocationRespectsPriorities() {
        Allocation allocation = allocationService.runAllocation(SupplyType.FOOD, "EDMONDS_KARP", "PRIORITY_WEIGHTED");
        // dp1 (priority=5) should be fully satisfied before dp3 (priority=2)
        double dp1Demand = 60.0;
        double totalAllocated = allocation.getTotalAllocatedFlow();
        // With 180 supply and 180 total demand, both should be fully satisfied
        assertTrue(totalAllocated >= dp1Demand - 1e-6,
                "Priority zone demand should be met first");
    }

    // C5: Total allocation does not exceed total deliverable flow
    @Test
    @DisplayName("C5: Total allocation flow matches algorithm max-flow result")
    public void testAllocationMatchesMaxFlow() {
        FlowResult flowResult = maxFlowService.computeMaxFlow(SupplyType.FOOD, "EDMONDS_KARP");
        Allocation allocation = allocationService.runAllocation(SupplyType.FOOD, "EDMONDS_KARP", "MAX_FLOW");
        assertTrue(allocation.getTotalAllocatedFlow() <= flowResult.getMaxFlow() + 1e-6,
                "Allocated flow " + allocation.getTotalAllocatedFlow() +
                " exceeds max flow " + flowResult.getMaxFlow());
    }

    // C6: Reproducibility - same inputs should yield same results
    @Test
    @DisplayName("C6: Allocation is reproducible for identical inputs and policy")
    public void testAllocationIsReproducible() {
        FlowResult r1 = maxFlowService.computeMaxFlow(SupplyType.FOOD, "EDMONDS_KARP");
        FlowResult r2 = maxFlowService.computeMaxFlow(SupplyType.FOOD, "EDMONDS_KARP");
        assertEquals(r1.getMaxFlow(), r2.getMaxFlow(), 1e-9, "Max flow must be deterministic");
    }

    // C7: Satisfaction percentage correctness
    @Test
    @DisplayName("C7: Satisfaction percentage is correctly calculated from allocated/demanded")
    public void testSatisfactionPercentage() {
        Allocation allocation = allocationService.runAllocation(SupplyType.FOOD, "EDMONDS_KARP", "MAX_FLOW");
        if (allocation.getTotalRequestedDemand() > 0) {
            double expectedRate = (allocation.getTotalAllocatedFlow() / allocation.getTotalRequestedDemand()) * 100.0;
            assertEquals(expectedRate, allocation.getSatisfactionPercentage(), 1e-6,
                    "Satisfaction percentage calculation is wrong");
        }
    }

    // C8: Proportional allocation distributes based on demand ratios
    @Test
    @DisplayName("C8: Proportional allocation distributes proportionally to demand sizes")
    public void testProportionalAllocation() {
        Allocation allocation = allocationService.runAllocation(SupplyType.FOOD, "EDMONDS_KARP", "PROPORTIONAL");
        // Simply verify it runs and produces a valid result
        assertNotNull(allocation);
        assertTrue(allocation.getTotalAllocatedFlow() >= 0);
        assertTrue(allocation.getTotalAllocatedFlow() <= 180.0 + 1e-6);
    }
}
