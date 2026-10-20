package com.relief.optimizer.service;

import com.relief.optimizer.algorithm.*;
import com.relief.optimizer.exception.InvalidFlowNetworkException;
import com.relief.optimizer.model.*;
import com.relief.optimizer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class MaxFlowService {

    private final DepotRepository depotRepository;
    private final DistributionPointRepository dpRepository;
    private final RouteRepository routeRepository;
    private final InventoryRepository inventoryRepository;

    @Autowired
    public MaxFlowService(DepotRepository depotRepository,
                          DistributionPointRepository dpRepository,
                          RouteRepository routeRepository,
                          InventoryRepository inventoryRepository) {
        this.depotRepository = depotRepository;
        this.dpRepository = dpRepository;
        this.routeRepository = routeRepository;
        this.inventoryRepository = inventoryRepository;
    }

    /**
     * Builds and solves the max-flow network for a given supply type.
     *
     * Graph structure:
     *   SuperSource (0)  --> Depot_i  [capacity = depot inventory for supplyType]
     *   Depot_i          --> DP_j     [capacity = route capacity]
     *   DP_j             --> SuperSink [capacity = DP demand for supplyType]
     *
     * Multiple supply types are handled independently (separate solver invocations).
     */
    public FlowResult computeMaxFlow(SupplyType supplyType, String algorithmName) {
        List<Depot> depots = depotRepository.findAll();
        List<DistributionPoint> dps = dpRepository.findAll();
        List<Route> routes = routeRepository.findByIsAvailableTrue();

        if (depots.isEmpty()) throw new InvalidFlowNetworkException("No depots exist. Add depots before running the flow engine.");
        if (dps.isEmpty()) throw new InvalidFlowNetworkException("No distribution points exist.");
        if (routes.isEmpty()) throw new InvalidFlowNetworkException("No available routes exist. All routes are marked unavailable or none have been created.");

        // Vertex assignment:
        // 0 = SUPER_SOURCE
        // 1..numDepots = Depot nodes
        // numDepots+1..numDepots+numDPs = DP nodes
        // numDepots+numDPs+1 = SUPER_SINK
        int numDepots = depots.size();
        int numDPs = dps.size();
        int V = numDepots + numDPs + 2;
        int superSource = 0;
        int superSink = V - 1;

        Map<Long, Integer> depotIndexMap = new HashMap<>();
        Map<Long, Integer> dpIndexMap = new HashMap<>();

        FlowNetwork G = new FlowNetwork(V);
        G.setVertexName(superSource, "SUPER_SOURCE");
        G.setVertexName(superSink, "SUPER_SINK");

        for (int i = 0; i < numDepots; i++) {
            Depot d = depots.get(i);
            int nodeIdx = i + 1;
            depotIndexMap.put(d.getId(), nodeIdx);
            G.setVertexName(nodeIdx, d.getCode());

            // Edge from super-source to depot with capacity = available inventory
            Optional<Inventory> inv = inventoryRepository.findByDepotIdAndSupplyType(d.getId(), supplyType);
            double supply = inv.map(Inventory::getAvailableQuantity).orElse(0.0);
            if (supply < 0) supply = 0.0;
            G.addEdge(superSource, nodeIdx, supply,
                    "Supply(" + d.getCode() + ")", "SUPER_SOURCE", null);
        }

        for (int j = 0; j < numDPs; j++) {
            DistributionPoint dp = dps.get(j);
            int nodeIdx = numDepots + j + 1;
            dpIndexMap.put(dp.getId(), nodeIdx);
            G.setVertexName(nodeIdx, dp.getCode());

            // Edge from DP to super-sink with capacity = demand
            double demand = dp.getDemand(supplyType);
            if (demand < 0) demand = 0.0;
            G.addEdge(nodeIdx, superSink, demand,
                    "Demand(" + dp.getCode() + ")", "SUPER_SINK", null);
        }

        // Route edges
        for (Route route : routes) {
            Integer fromIdx = depotIndexMap.get(route.getSourceDepot().getId());
            Integer toIdx = dpIndexMap.get(route.getDestinationPoint().getId());
            if (fromIdx == null || toIdx == null) continue; // skip orphan routes

            double cap = route.getCapacity() != null ? route.getCapacity() : 0.0;
            if (cap < 0) throw new InvalidFlowNetworkException(
                    "Route " + route.getRouteCode() + " has negative capacity: " + cap);

            G.addEdge(fromIdx, toIdx, cap, route.getRouteCode(), "ROUTE", route.getId());
        }

        // Execute algorithm
        if ("DINIC".equalsIgnoreCase(algorithmName)) {
            DinicsMaxFlow dinic = new DinicsMaxFlow();
            return dinic.computeMaxFlow(G, superSource, superSink);
        } else {
            EdmondsKarpMaxFlow ek = new EdmondsKarpMaxFlow();
            return ek.computeMaxFlow(G, superSource, superSink);
        }
    }
}
