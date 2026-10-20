package com.relief.optimizer.service;

import com.relief.optimizer.algorithm.FlowResult;
import com.relief.optimizer.dto.ShipmentDto;
import com.relief.optimizer.exception.InvalidStatusTransitionException;
import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.*;
import com.relief.optimizer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class AllocationService {

    private final AllocationRepository allocationRepository;
    private final ShipmentRepository shipmentRepository;
    private final DepotRepository depotRepository;
    private final DistributionPointRepository dpRepository;
    private final RouteRepository routeRepository;
    private final InventoryRepository inventoryRepository;
    private final MaxFlowService maxFlowService;

    @Autowired
    public AllocationService(AllocationRepository allocationRepository,
                             ShipmentRepository shipmentRepository,
                             DepotRepository depotRepository,
                             DistributionPointRepository dpRepository,
                             RouteRepository routeRepository,
                             InventoryRepository inventoryRepository,
                             MaxFlowService maxFlowService) {
        this.allocationRepository = allocationRepository;
        this.shipmentRepository = shipmentRepository;
        this.depotRepository = depotRepository;
        this.dpRepository = dpRepository;
        this.routeRepository = routeRepository;
        this.inventoryRepository = inventoryRepository;
        this.maxFlowService = maxFlowService;
    }

    /**
     * Runs max-flow and generates an Allocation with Shipments for the given supply type and policy.
     * Supported policies: MAX_FLOW, PROPORTIONAL, PRIORITY_WEIGHTED
     */
    public Allocation runAllocation(SupplyType supplyType, String algorithmName, String allocationPolicy) {
        FlowResult flowResult = maxFlowService.computeMaxFlow(supplyType, algorithmName);

        List<Depot> depots = depotRepository.findAll();
        List<DistributionPoint> dps = dpRepository.findAll();
        List<Route> availableRoutes = routeRepository.findByIsAvailableTrue();

        double totalDemand = dps.stream().mapToDouble(dp -> dp.getDemand(supplyType)).sum();
        double totalAvailableSupply = depots.stream()
                .mapToDouble(d -> inventoryRepository.findByDepotIdAndSupplyType(d.getId(), supplyType)
                        .map(Inventory::getAvailableQuantity).orElse(0.0))
                .sum();

        double maxFlow = flowResult.getMaxFlow();

        // Build depot -> DP flow map from FlowResult edge flows
        Map<String, Map<String, Double>> routeFlowMap = new HashMap<>(); // routeCode -> {from, to, flow}
        for (FlowResult.EdgeFlowInfo edge : flowResult.getEdgeFlows()) {
            if ("ROUTE".equals(edge.edgeType()) && edge.getFlow() > 1e-9) {
                routeFlowMap.put(edge.getLabel(), Map.of(
                        "from", edge.getFlow(), "flow", edge.getFlow()
                ));
            }
        }

        // Apply allocation policy to determine per-DP allocation
        Map<Long, Double> dpAllocation = computePerDpAllocation(
                dps, supplyType, allocationPolicy, maxFlow, totalDemand, flowResult);

        // Create Allocation entity
        double totalAllocated = dpAllocation.values().stream().mapToDouble(Double::doubleValue).sum();
        double unmetDemand = Math.max(0, totalDemand - totalAllocated);
        double satisfaction = totalDemand > 0 ? (totalAllocated / totalDemand) * 100.0 : 0.0;

        Allocation allocation = new Allocation(null, LocalDateTime.now(), allocationPolicy, supplyType,
                totalAvailableSupply, totalDemand, totalAllocated, unmetDemand, satisfaction);
        allocation = allocationRepository.save(allocation);

        // Generate shipments based on flow edges
        int shipmentSeq = 1;
        for (FlowResult.EdgeFlowInfo edge : flowResult.getEdgeFlows()) {
            if (!"ROUTE".equals(edge.edgeType()) || edge.getFlow() <= 1e-9) continue;

            // Find the route by code
            Route route = routeRepository.findAll().stream()
                    .filter(r -> r.getRouteCode().equals(edge.getLabel()))
                    .findFirst().orElse(null);
            if (route == null) continue;

            Depot depot = route.getSourceDepot();
            DistributionPoint dp = route.getDestinationPoint();

            // Limit flow by DP allocation (policy may reduce the max-flow quantity)
            Double dpAllocQty = dpAllocation.getOrDefault(dp.getId(), 0.0);
            double shipmentQty = Math.min(edge.getFlow(), dpAllocQty);
            if (shipmentQty <= 1e-9) continue;

            long uniqueSuffix = System.currentTimeMillis() % 1000000;
            String code = String.format("SHP-%s-%d-%03d", supplyType.name().substring(0, Math.min(3, supplyType.name().length())), uniqueSuffix, shipmentSeq++);
            Shipment shipment = new Shipment(null, code, allocation, depot, dp, route,
                    supplyType, shipmentQty, ShipmentStatus.PENDING);
            allocation.addShipment(shipment);
        }
        return allocationRepository.save(allocation);
    }

    private Map<Long, Double> computePerDpAllocation(List<DistributionPoint> dps, SupplyType supplyType,
                                                      String policy, double maxFlow, double totalDemand,
                                                      FlowResult flowResult) {
        Map<Long, Double> result = new LinkedHashMap<>();
        switch (policy) {
            case "PROPORTIONAL":
                // Each DP gets share proportional to its demand, capped at demand
                for (DistributionPoint dp : dps) {
                    double demand = dp.getDemand(supplyType);
                    double share = totalDemand > 0 ? (demand / totalDemand) * maxFlow : 0;
                    result.put(dp.getId(), Math.min(share, demand));
                }
                break;
            case "PRIORITY_WEIGHTED":
                // Allocate highest-priority DPs first, each capped at demand
                List<DistributionPoint> sorted = new ArrayList<>(dps);
                sorted.sort(Comparator.comparingInt(DistributionPoint::getPriorityScore).reversed());
                double remaining = maxFlow;
                for (DistributionPoint dp : sorted) {
                    double demand = dp.getDemand(supplyType);
                    double allocated = Math.min(demand, remaining);
                    result.put(dp.getId(), allocated);
                    remaining -= allocated;
                    if (remaining <= 1e-9) break;
                }
                // Fill zeros for remaining DPs
                for (DistributionPoint dp : dps) {
                    result.putIfAbsent(dp.getId(), 0.0);
                }
                break;
            default: // MAX_FLOW - use actual edge flows
                // Map DP id to total inflow from route edges
                for (DistributionPoint dp : dps) {
                    double inflow = flowResult.getEdgeFlows().stream()
                            .filter(e -> "ROUTE".equals(e.edgeType()) && e.getFlow() > 1e-9)
                            .filter(e -> {
                                Route r = routeRepository.findAll().stream()
                                        .filter(rt -> rt.getRouteCode().equals(e.getLabel()))
                                        .findFirst().orElse(null);
                                return r != null && r.getDestinationPoint().getId().equals(dp.getId());
                            })
                            .mapToDouble(FlowResult.EdgeFlowInfo::getFlow).sum();
                    result.put(dp.getId(), Math.min(inflow, dp.getDemand(supplyType)));
                }
                break;
        }
        return result;
    }

    public List<ShipmentDto> getAllShipments() {
        return shipmentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toShipmentDto).collect(Collectors.toList());
    }

    public ShipmentDto getShipmentById(Long id) {
        Shipment s = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + id));
        return toShipmentDto(s);
    }

    public ShipmentDto updateShipmentStatus(Long shipmentId, ShipmentStatus newStatus,
                                             String notes, String recipientName,
                                             Double deliveredQuantity) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment not found: " + shipmentId));

        if (!shipment.canUpdateTo(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition shipment " + shipment.getShipmentCode() +
                    " from " + shipment.getStatus() + " to " + newStatus +
                    ". Valid next states: " + shipment.getStatus().getValidNextStatuses());
        }
        shipment.updateStatus(newStatus);
        if (notes != null) shipment.setDeliveryNotes(notes);
        if (recipientName != null) shipment.setRecipientName(recipientName);
        if (deliveredQuantity != null) {
            if (deliveredQuantity < 0) throw new ValidationException("Delivered quantity cannot be negative");
            if (deliveredQuantity > shipment.getAllocatedQuantity()) {
                throw new ValidationException("Delivered quantity cannot exceed allocated quantity: " + shipment.getAllocatedQuantity());
            }
            shipment.setDeliveredQuantity(deliveredQuantity);
        }
        return toShipmentDto(shipmentRepository.save(shipment));
    }

    public List<ShipmentDto> getShipmentsByStatus(ShipmentStatus status) {
        return shipmentRepository.findByStatus(status).stream()
                .map(this::toShipmentDto).collect(Collectors.toList());
    }

    public ShipmentDto toShipmentDto(Shipment s) {
        ShipmentDto dto = new ShipmentDto();
        dto.setId(s.getId());
        dto.setShipmentCode(s.getShipmentCode());
        if (s.getAllocation() != null) dto.setAllocationId(s.getAllocation().getId());
        if (s.getSourceDepot() != null) {
            dto.setSourceDepotId(s.getSourceDepot().getId());
            dto.setSourceDepotName(s.getSourceDepot().getName());
            dto.setSourceDepotCode(s.getSourceDepot().getCode());
        }
        if (s.getDestinationPoint() != null) {
            dto.setDestinationPointId(s.getDestinationPoint().getId());
            dto.setDestinationPointName(s.getDestinationPoint().getName());
            dto.setDestinationPointCode(s.getDestinationPoint().getCode());
        }
        if (s.getRoute() != null) {
            dto.setRouteId(s.getRoute().getId());
            dto.setRouteCode(s.getRoute().getRouteCode());
        }
        dto.setSupplyType(s.getSupplyType());
        dto.setAllocatedQuantity(s.getAllocatedQuantity());
        dto.setDeliveredQuantity(s.getDeliveredQuantity());
        dto.setStatus(s.getStatus());
        dto.setCreatedAt(s.getCreatedAt());
        dto.setDispatchedAt(s.getDispatchedAt());
        dto.setDeliveredAt(s.getDeliveredAt());
        dto.setDriverName(s.getDriverName());
        dto.setDriverPhone(s.getDriverPhone());
        dto.setVehiclePlate(s.getVehiclePlate());
        dto.setVehicleType(s.getVehicleType());
        dto.setRecipientName(s.getRecipientName());
        dto.setDeliveryNotes(s.getDeliveryNotes());
        return dto;
    }
}
