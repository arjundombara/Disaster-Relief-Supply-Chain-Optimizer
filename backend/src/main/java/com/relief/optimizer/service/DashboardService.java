package com.relief.optimizer.service;

import com.relief.optimizer.dto.DashboardStatsDto;
import com.relief.optimizer.dto.DepotDto;
import com.relief.optimizer.dto.ShipmentDto;
import com.relief.optimizer.model.*;
import com.relief.optimizer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final DepotRepository depotRepository;
    private final DistributionPointRepository dpRepository;
    private final RouteRepository routeRepository;
    private final ShipmentRepository shipmentRepository;
    private final InventoryRepository inventoryRepository;
    private final AllocationRepository allocationRepository;
    private final DepotService depotService;
    private final AllocationService allocationService;

    @Autowired
    public DashboardService(DepotRepository depotRepository,
                            DistributionPointRepository dpRepository,
                            RouteRepository routeRepository,
                            ShipmentRepository shipmentRepository,
                            InventoryRepository inventoryRepository,
                            AllocationRepository allocationRepository,
                            DepotService depotService,
                            AllocationService allocationService) {
        this.depotRepository = depotRepository;
        this.dpRepository = dpRepository;
        this.routeRepository = routeRepository;
        this.shipmentRepository = shipmentRepository;
        this.inventoryRepository = inventoryRepository;
        this.allocationRepository = allocationRepository;
        this.depotService = depotService;
        this.allocationService = allocationService;
    }

    public DashboardStatsDto getDashboardStats() {
        DashboardStatsDto stats = new DashboardStatsDto();

        List<Depot> depots = depotRepository.findAll();
        List<DistributionPoint> dps = dpRepository.findAll();
        List<Route> routes = routeRepository.findAll();
        List<Shipment> shipments = shipmentRepository.findAll();

        stats.setTotalDepots(depots.size());
        stats.setTotalDistributionPoints(dps.size());
        stats.setTotalRoutes(routes.size());
        stats.setAvailableRoutes((int) routes.stream().filter(r -> Boolean.TRUE.equals(r.getIsAvailable())).count());
        stats.setTotalShipments(shipments.size());
        stats.setPendingShipments((int) shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.PENDING).count());
        stats.setDispatchedShipments((int) shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.DISPATCHED).count());
        stats.setDeliveredShipments((int) shipments.stream().filter(s -> s.getStatus() == ShipmentStatus.DELIVERED).count());

        // Aggregate inventory and demand by supply type
        Map<String, Double> inventoryByType = new LinkedHashMap<>();
        Map<String, Double> demandByType = new LinkedHashMap<>();
        Map<String, Double> deliveredByType = new LinkedHashMap<>();

        for (SupplyType st : SupplyType.values()) {
            double totalInv = inventoryRepository.findBySupplyType(st).stream()
                    .mapToDouble(Inventory::getAvailableQuantity).sum();
            double totalDemand = dps.stream().mapToDouble(dp -> dp.getDemand(st)).sum();
            double totalDelivered = dps.stream().mapToDouble(dp -> dp.getDelivered(st)).sum();

            inventoryByType.put(st.name(), totalInv);
            demandByType.put(st.name(), totalDemand);
            deliveredByType.put(st.name(), totalDelivered);
        }

        stats.setTotalInventoryByType(inventoryByType);
        stats.setTotalDemandByType(demandByType);
        stats.setTotalDeliveredByType(deliveredByType);

        Map<String, Double> unmetByType = new LinkedHashMap<>();
        Map<String, Double> satisfactionByType = new LinkedHashMap<>();
        for (SupplyType st : SupplyType.values()) {
            double demand = demandByType.getOrDefault(st.name(), 0.0);
            double delivered = deliveredByType.getOrDefault(st.name(), 0.0);
            double unmet = Math.max(0, demand - delivered);
            unmetByType.put(st.name(), unmet);
            satisfactionByType.put(st.name(), demand > 0 ? (delivered / demand) * 100.0 : 0.0);
        }
        stats.setUnmetDemandByType(unmetByType);
        stats.setSatisfactionRateByType(satisfactionByType);

        double totalDemand = demandByType.values().stream().mapToDouble(Double::doubleValue).sum();
        double totalInventory = inventoryByType.values().stream().mapToDouble(Double::doubleValue).sum();
        double totalDelivered = deliveredByType.values().stream().mapToDouble(Double::doubleValue).sum();
        double totalAllocated = shipments.stream().mapToDouble(s -> s.getAllocatedQuantity() != null ? s.getAllocatedQuantity() : 0.0).sum();

        stats.setTotalDemand(totalDemand);
        stats.setTotalAvailableInventory(totalInventory);
        stats.setTotalAllocated(totalAllocated);
        stats.setTotalUnmetDemand(Math.max(0, totalDemand - totalDelivered));
        stats.setOverallSatisfactionRate(totalDemand > 0 ? (totalDelivered / totalDemand) * 100.0 : 0.0);

        // Low stock depots
        List<Depot> lowStock = depots.stream()
                .filter(d -> d.getInventories().stream().anyMatch(Inventory::isLowStock))
                .collect(Collectors.toList());
        stats.setLowStockDepots(lowStock.size());
        stats.setLowStockDepotList(lowStock.stream().map(depotService::toDto).collect(Collectors.toList()));

        // Critical distribution points
        stats.setCriticalDistributionPoints((int) dps.stream()
                .filter(dp -> dp.getSeverity() == SeverityLevel.CRITICAL).count());

        // Recent 10 shipments
        List<ShipmentDto> recentShipments = shipmentRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(10).map(allocationService::toShipmentDto).collect(Collectors.toList());
        stats.setRecentShipments(recentShipments);

        // Last max-flow from most recent allocation
        allocationRepository.findAllByOrderByCreatedAtDesc().stream().findFirst().ifPresent(a -> {
            stats.setLastComputedMaxFlow(a.getTotalAllocatedFlow());
            stats.setLastOptimizationTime(a.getCreatedAt().toString());
        });

        return stats;
    }
}
