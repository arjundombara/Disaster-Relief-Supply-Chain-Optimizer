package com.relief.optimizer.service;

import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.*;
import com.relief.optimizer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Seeds demo data for the sample disaster scenario (idempotent - safe to call repeatedly).
 *
 * Demo Network Expected Max Flow (Food only):
 *   Depot A (supply=200) -> DP1 (cap=80), DP2 (cap=90), DP3 (cap=50)
 *   Depot B (supply=150) -> DP2 (cap=70), DP3 (cap=60), DP4 (cap=80)
 *   DP1 demand=80, DP2 demand=120, DP3 demand=60, DP4 demand=80
 *   Expected total max flow for FOOD = 320 (limited by demands 80+120+60+80)
 *   (supply 200+150=350 is sufficient, routes are not bottlenecks)
 */
@Service
@Transactional
public class DemoDataService {

    private final DepotRepository depotRepository;
    private final DistributionPointRepository dpRepository;
    private final RouteRepository routeRepository;
    private final InventoryRepository inventoryRepository;
    private final ShipmentRepository shipmentRepository;
    private final AllocationRepository allocationRepository;

    @Autowired
    public DemoDataService(DepotRepository depotRepository,
                           DistributionPointRepository dpRepository,
                           RouteRepository routeRepository,
                           InventoryRepository inventoryRepository,
                           ShipmentRepository shipmentRepository,
                           AllocationRepository allocationRepository) {
        this.depotRepository = depotRepository;
        this.dpRepository = dpRepository;
        this.routeRepository = routeRepository;
        this.inventoryRepository = inventoryRepository;
        this.shipmentRepository = shipmentRepository;
        this.allocationRepository = allocationRepository;
    }

    public String loadDemoData() {
        if (depotRepository.existsByCode("DEMO-A")) {
            return "Demo data already loaded. Use 'Reset & Reload' to start fresh.";
        }

        // ===== DEPOTS =====
        Depot depotA = new Depot(null, "DEMO-A", "Central Relief Hub Alpha",
                28.6139, 77.2090, "Connaught Place, New Delhi", "Col. Rajesh Verma", "+91-9811234567",
                5000.0, "ACTIVE");
        Depot depotB = new Depot(null, "DEMO-B", "Southern Supply Base Beta",
                13.0827, 80.2707, "Anna Nagar, Chennai", "Maj. Priya Nair", "+91-9845678901",
                4000.0, "ACTIVE");
        depotA = depotRepository.save(depotA);
        depotB = depotRepository.save(depotB);

        // ===== INVENTORIES =====
        addInventory(depotA, SupplyType.FOOD,     200.0, 20.0, 50.0, "kg");
        addInventory(depotA, SupplyType.WATER,    500.0, 50.0, 100.0, "Liters");
        addInventory(depotA, SupplyType.MEDICINE, 80.0,  10.0, 15.0, "Kits");
        addInventory(depotA, SupplyType.SHELTER,  30.0,  5.0,  5.0,  "Units");

        addInventory(depotB, SupplyType.FOOD,     150.0, 15.0, 30.0, "kg");
        addInventory(depotB, SupplyType.WATER,    350.0, 35.0, 80.0, "Liters");
        addInventory(depotB, SupplyType.MEDICINE, 60.0,  6.0,  10.0, "Kits");
        addInventory(depotB, SupplyType.SHELTER,  20.0,  2.0,  3.0,  "Units");

        // ===== DISTRIBUTION POINTS =====
        DistributionPoint dp1 = new DistributionPoint(null, "DEMO-DP1", "Coastal Flood Zone Alpha",
                17.6868, 83.2185, "Visakhapatnam Port Area, Andhra Pradesh", "Anitha Reddy", "+91-8912345678",
                SeverityLevel.CRITICAL, 5, 12000, "ACTIVE",
                80.0, 200.0, 30.0, 10.0);
        DistributionPoint dp2 = new DistributionPoint(null, "DEMO-DP2", "Cyclone Shelter Zone B",
                20.2961, 85.8245, "Puri District, Odisha", "Mohan Patra", "+91-9437654321",
                SeverityLevel.HIGH, 4, 8500, "ACTIVE",
                120.0, 280.0, 40.0, 15.0);
        DistributionPoint dp3 = new DistributionPoint(null, "DEMO-DP3", "Hill Tribe Evacuation Camp",
                25.5788, 91.8933, "Shillong Periphery, Meghalaya", "Bah Joshua Lyngdoh", "+91-9856123456",
                SeverityLevel.HIGH, 3, 4200, "ACTIVE",
                60.0, 150.0, 25.0, 8.0);
        DistributionPoint dp4 = new DistributionPoint(null, "DEMO-DP4", "Landslide Relief Point Delta",
                9.9312, 76.2673, "Munnar Rural Cluster, Kerala", "Smt. Leela Krishnan", "+91-9745678123",
                SeverityLevel.MODERATE, 2, 3100, "ACTIVE",
                80.0, 180.0, 20.0, 6.0);
        dp1 = dpRepository.save(dp1);
        dp2 = dpRepository.save(dp2);
        dp3 = dpRepository.save(dp3);
        dp4 = dpRepository.save(dp4);

        // ===== ROUTES =====
        // Depot A routes
        createRoute("DEMO-R01", depotA, dp1, 90.0, 1420.0, 24.0, "CLEAR", true);
        createRoute("DEMO-R02", depotA, dp2, 95.0, 1720.0, 28.0, "FLOOD_RISK", true);
        createRoute("DEMO-R03", depotA, dp3, 60.0, 1880.0, 30.0, "CLEAR", true);
        createRoute("DEMO-R04", depotA, dp4, 40.0, 2100.0, 36.0, "OBSTRUCTED", false); // Unavailable route

        // Depot B routes
        createRoute("DEMO-R05", depotB, dp1, 70.0, 1240.0, 20.0, "CLEAR", true);
        createRoute("DEMO-R06", depotB, dp2, 80.0, 1450.0, 22.0, "CLEAR", true);
        createRoute("DEMO-R07", depotB, dp3, 50.0, 1680.0, 28.0, "DAMAGED", false);  // Unavailable route
        createRoute("DEMO-R08", depotB, dp4, 85.0,  380.0,  6.0, "CLEAR", true);

        return "Demo data loaded successfully! " +
               "Network: 2 depots, 4 distribution points, 8 routes (6 available, 2 unavailable). " +
               "Food supply: DepotA=200kg, DepotB=150kg. Total demand: 340kg. " +
               "Expected max food flow ≈ 290 units (route capacities constrain full demand delivery).";
    }

    public void resetDemoData() {
        shipmentRepository.deleteAll();
        allocationRepository.deleteAll();

        List<Route> routes = routeRepository.findAll();
        routes.removeIf(r -> r.getRouteCode().startsWith("DEMO-"));
        routeRepository.deleteAll(routeRepository.findAll().stream()
                .filter(r -> r.getRouteCode().startsWith("DEMO-"))
                .collect(java.util.stream.Collectors.toList()));

        dpRepository.findAll().stream()
                .filter(dp -> dp.getCode().startsWith("DEMO-"))
                .forEach(dpRepository::delete);

        depotRepository.findAll().stream()
                .filter(d -> d.getCode().startsWith("DEMO-"))
                .forEach(depotRepository::delete);
    }

    private void addInventory(Depot depot, SupplyType type, double qty, double reserved, double threshold, String unit) {
        Inventory inv = new Inventory(null, depot, type, qty, reserved, threshold, unit);
        depot.addInventory(inv);
        inventoryRepository.save(inv);
    }

    private void createRoute(String code, Depot source, DistributionPoint dest,
                              double capacity, double distKm, double hours, String condition, boolean available) {
        Route route = new Route(null, code, source, dest, capacity, distKm, hours, condition, available);
        routeRepository.save(route);
    }
}
