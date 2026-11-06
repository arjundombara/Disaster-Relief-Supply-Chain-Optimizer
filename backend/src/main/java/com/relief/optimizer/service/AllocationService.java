package com.relief.optimizer.service;

import com.relief.optimizer.algorithm.FlowResult;
import com.relief.optimizer.dto.ShipmentDto;
import com.relief.optimizer.exception.InvalidStatusTransitionException;
import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.*;
import com.relief.optimizer.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
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
    private final InventoryService inventoryService;
    private final UserRepository userRepository;

    @Autowired
    public AllocationService(
            AllocationRepository allocationRepository,
            ShipmentRepository shipmentRepository,
            DepotRepository depotRepository,
            DistributionPointRepository dpRepository,
            RouteRepository routeRepository,
            InventoryRepository inventoryRepository,
            MaxFlowService maxFlowService,
            InventoryService inventoryService,
            UserRepository userRepository) {

        this.allocationRepository = allocationRepository;
        this.shipmentRepository = shipmentRepository;
        this.depotRepository = depotRepository;
        this.dpRepository = dpRepository;
        this.routeRepository = routeRepository;
        this.inventoryRepository = inventoryRepository;
        this.maxFlowService = maxFlowService;
        this.inventoryService = inventoryService;
        this.userRepository = userRepository;
    }

    // =========================================================
    // AUTHORIZATION HELPERS
    // =========================================================

    private void verifyShipmentAccess(
            Shipment shipment,
            Long actorId,
            String actorRole) {

        if (actorId == null || actorRole == null) {
            throw new AccessDeniedException(
                    "Authenticated user information is required.");
        }

        if ("ADMIN".equals(actorRole)) {
            return;
        }

        if ("WORKER".equals(actorRole)
                && shipment.getAssignedWorkerId() != null
                && shipment.getAssignedWorkerId().equals(actorId)) {
            return;
        }

        throw new AccessDeniedException(
                "You are not authorized to access this shipment.");
    }

    // =========================================================
    // MAX-FLOW ALLOCATION
    // Existing allocation logic preserved
    // =========================================================

    public Allocation runAllocation(
            SupplyType supplyType,
            String algorithmName,
            String allocationPolicy) {

        FlowResult flowResult =
                maxFlowService.computeMaxFlow(supplyType, algorithmName);

        List<Depot> depots = depotRepository.findAll();
        List<DistributionPoint> dps = dpRepository.findAll();

        double totalDemand = dps.stream()
                .mapToDouble(dp -> dp.getDemand(supplyType))
                .sum();

        double totalAvailableSupply = depots.stream()
                .mapToDouble(d -> inventoryRepository
                        .findByDepotIdAndSupplyType(d.getId(), supplyType)
                        .map(Inventory::getAvailableQuantity)
                        .orElse(0.0))
                .sum();

        double maxFlow = flowResult.getMaxFlow();

        Map<String, Map<String, Double>> routeFlowMap =
                new HashMap<>();

        for (FlowResult.EdgeFlowInfo edge : flowResult.getEdgeFlows()) {
            if ("ROUTE".equals(edge.edgeType())
                    && edge.getFlow() > 1e-9) {

                routeFlowMap.put(edge.getLabel(), Map.of(
                        "from", edge.getFlow(),
                        "flow", edge.getFlow()
                ));
            }
        }

        Map<Long, Double> dpAllocation = computePerDpAllocation(
                dps,
                supplyType,
                allocationPolicy,
                maxFlow,
                totalDemand,
                flowResult
        );

        double totalAllocated = dpAllocation.values()
                .stream()
                .mapToDouble(Double::doubleValue)
                .sum();

        double unmetDemand = Math.max(0, totalDemand - totalAllocated);

        double satisfaction = totalDemand > 0
                ? (totalAllocated / totalDemand) * 100.0
                : 0.0;

        Allocation allocation = new Allocation(
                null,
                LocalDateTime.now(),
                allocationPolicy,
                supplyType,
                totalAvailableSupply,
                totalDemand,
                totalAllocated,
                unmetDemand,
                satisfaction
        );

        allocation = allocationRepository.save(allocation);

        int shipmentSeq = 1;

        for (FlowResult.EdgeFlowInfo edge : flowResult.getEdgeFlows()) {

            if (!"ROUTE".equals(edge.edgeType())
                    || edge.getFlow() <= 1e-9) {
                continue;
            }

            Route route = routeRepository.findAll()
                    .stream()
                    .filter(r -> r.getRouteCode().equals(edge.getLabel()))
                    .findFirst()
                    .orElse(null);

            if (route == null) {
                continue;
            }

            Depot depot = route.getSourceDepot();
            DistributionPoint dp = route.getDestinationPoint();

            Double dpAllocQty =
                    dpAllocation.getOrDefault(dp.getId(), 0.0);

            double shipmentQty = Math.min(
                    edge.getFlow(),
                    dpAllocQty
            );

            if (shipmentQty <= 1e-9) {
                continue;
            }

            long uniqueSuffix = System.currentTimeMillis() % 1000000;

            String code = String.format(
                    "SHP-%s-%d-%03d",
                    supplyType.name().substring(
                            0,
                            Math.min(3, supplyType.name().length())
                    ),
                    uniqueSuffix,
                    shipmentSeq++
            );

            Shipment shipment = new Shipment(
                    null,
                    code,
                    allocation,
                    depot,
                    dp,
                    route,
                    supplyType,
                    shipmentQty,
                    ShipmentStatus.PENDING
            );

            allocation.addShipment(shipment);
        }

        return allocationRepository.save(allocation);
    }

    private Map<Long, Double> computePerDpAllocation(
            List<DistributionPoint> dps,
            SupplyType supplyType,
            String policy,
            double maxFlow,
            double totalDemand,
            FlowResult flowResult) {

        Map<Long, Double> result = new LinkedHashMap<>();

        switch (policy) {

            case "PROPORTIONAL":

                for (DistributionPoint dp : dps) {

                    double demand = dp.getDemand(supplyType);

                    double share = totalDemand > 0
                            ? (demand / totalDemand) * maxFlow
                            : 0;

                    result.put(dp.getId(), Math.min(share, demand));
                }

                break;

            case "PRIORITY_WEIGHTED":

                List<DistributionPoint> sorted =
                        new ArrayList<>(dps);

                sorted.sort(
                        Comparator.comparingInt(
                                DistributionPoint::getPriorityScore
                        ).reversed()
                );

                double remaining = maxFlow;

                for (DistributionPoint dp : sorted) {

                    double demand = dp.getDemand(supplyType);

                    double allocated = Math.min(demand, remaining);

                    result.put(dp.getId(), allocated);

                    remaining -= allocated;

                    if (remaining <= 1e-9) {
                        break;
                    }
                }

                for (DistributionPoint dp : dps) {
                    result.putIfAbsent(dp.getId(), 0.0);
                }

                break;

            default:

                for (DistributionPoint dp : dps) {

                    double inflow = flowResult.getEdgeFlows()
                            .stream()
                            .filter(e ->
                                    "ROUTE".equals(e.edgeType())
                                            && e.getFlow() > 1e-9)
                            .filter(e -> {

                                Route r = routeRepository.findAll()
                                        .stream()
                                        .filter(rt ->
                                                rt.getRouteCode()
                                                        .equals(e.getLabel()))
                                        .findFirst()
                                        .orElse(null);

                                return r != null
                                        && r.getDestinationPoint()
                                                .getId()
                                                .equals(dp.getId());
                            })
                            .mapToDouble(
                                    FlowResult.EdgeFlowInfo::getFlow
                            )
                            .sum();

                    result.put(
                            dp.getId(),
                            Math.min(inflow, dp.getDemand(supplyType))
                    );
                }

                break;
        }

        return result;
    }

    // =========================================================
    // SHIPMENT RETRIEVAL
    // =========================================================

    public List<ShipmentDto> getAllShipments() {

        return shipmentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toShipmentDto)
                .collect(Collectors.toList());
    }

    public ShipmentDto getShipmentById(
            Long id,
            Long actorId,
            String actorRole) {

        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Shipment not found: " + id
                        ));

        verifyShipmentAccess(shipment, actorId, actorRole);

        return toShipmentDto(shipment);
    }

    // =========================================================
    // SHIPMENT STATUS UPDATE
    // =========================================================

    public ShipmentDto updateShipmentStatus(
            Long shipmentId,
            ShipmentStatus newStatus,
            String notes,
            String recipientName,
            Double deliveredQuantity,
            Long actorId,
            String actorRole) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Shipment not found: " + shipmentId
                        ));

        verifyShipmentAccess(shipment, actorId, actorRole);

        if (newStatus == null) {
            throw new ValidationException(
                    "Shipment status is required."
            );
        }

        // Workers can only dispatch or mark their assigned
        // shipments as delivered.
        if ("WORKER".equals(actorRole)
                && newStatus != ShipmentStatus.DISPATCHED
                && newStatus != ShipmentStatus.DELIVERED) {

            throw new AccessDeniedException(
                    "Workers can only dispatch or deliver assigned shipments."
            );
        }

        if (deliveredQuantity != null) {

            if (deliveredQuantity < 0) {
                throw new ValidationException(
                        "Delivered quantity cannot be negative."
                );
            }

            if (deliveredQuantity > shipment.getAllocatedQuantity()) {
                throw new ValidationException(
                        "Delivered quantity cannot exceed allocated quantity: "
                                + shipment.getAllocatedQuantity()
                );
            }
        }

        if (!shipment.canUpdateTo(newStatus)) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition shipment "
                            + shipment.getShipmentCode()
                            + " from "
                            + shipment.getStatus()
                            + " to "
                            + newStatus
                            + ". Valid next states: "
                            + shipment.getStatus().getValidNextStatuses()
            );
        }

        shipment.updateStatus(newStatus);

        if (notes != null) {
            shipment.setDeliveryNotes(notes);
        }

        if (recipientName != null) {
            shipment.setRecipientName(recipientName);
        }

        if (deliveredQuantity != null) {
            shipment.setDeliveredQuantity(deliveredQuantity);
        }

        return toShipmentDto(shipmentRepository.save(shipment));
    }

    public List<ShipmentDto> getShipmentsByStatus(
            ShipmentStatus status) {

        return shipmentRepository.findByStatus(status)
                .stream()
                .map(this::toShipmentDto)
                .collect(Collectors.toList());
    }

    // =========================================================
    // SHIPMENT DTO
    // =========================================================

    public ShipmentDto toShipmentDto(Shipment s) {

        ShipmentDto dto = new ShipmentDto();

        dto.setId(s.getId());
        dto.setShipmentCode(s.getShipmentCode());

        if (s.getAllocation() != null) {
            dto.setAllocationId(s.getAllocation().getId());
        }

        if (s.getSourceDepot() != null) {
            dto.setSourceDepotId(s.getSourceDepot().getId());
            dto.setSourceDepotName(s.getSourceDepot().getName());
            dto.setSourceDepotCode(s.getSourceDepot().getCode());
        }

        if (s.getDestinationPoint() != null) {
            dto.setDestinationPointId(
                    s.getDestinationPoint().getId()
            );

            dto.setDestinationPointName(
                    s.getDestinationPoint().getName()
            );

            dto.setDestinationPointCode(
                    s.getDestinationPoint().getCode()
            );
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
        dto.setAssignedWorkerId(s.getAssignedWorkerId());
        dto.setAssignedWorkerName(s.getAssignedWorkerName());
        dto.setTaskPriority(s.getTaskPriority());
        dto.setDeadline(s.getDeadline());
        dto.setTaskInstructions(s.getTaskInstructions());
        dto.setWorkerAcknowledged(s.getWorkerAcknowledged());
        dto.setAcknowledgedAt(s.getAcknowledgedAt());

        return dto;
    }

    // =========================================================
    // WORKER ASSIGNMENT
    // =========================================================

    public ShipmentDto assignWorkerToTask(
            Long shipmentId,
            Long workerId,
            String workerName,
            String priority,
            LocalDateTime deadline,
            String instructions) {

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Shipment task not found: " + shipmentId
                        ));

        User worker = userRepository.findById(workerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Worker not found: " + workerId
                        ));

        if (worker.getRole() != Role.WORKER) {
            throw new ValidationException(
                    "Only Worker accounts can be assigned to shipments."
            );
        }

        if (!Boolean.TRUE.equals(worker.getActive())) {
            throw new ValidationException(
                    "This worker account is inactive."
            );
        }

        if (worker.getApprovalStatus()
                != WorkerApprovalStatus.APPROVED) {

            throw new ValidationException(
                    "This worker has not been approved by an Admin."
            );
        }

        String verifiedWorkerName = worker.getFullName();

        if (verifiedWorkerName == null
                || verifiedWorkerName.trim().isEmpty()) {

            verifiedWorkerName = worker.getUsername();
        }

        shipment.setAssignedWorkerId(worker.getId());
        shipment.setAssignedWorkerName(verifiedWorkerName);

        // Reset acknowledgement when a task is assigned or reassigned.
        shipment.setWorkerAcknowledged(false);
        shipment.setAcknowledgedAt(null);

        if (priority != null) {
            shipment.setTaskPriority(priority);
        }

        if (deadline != null) {
            shipment.setDeadline(deadline);
        }

        if (instructions != null) {
            shipment.setTaskInstructions(instructions);
        }

        return toShipmentDto(shipmentRepository.save(shipment));
    }

    // =========================================================
    // WORKER TASK ACKNOWLEDGEMENT
    // =========================================================

    public ShipmentDto acknowledgeTask(
            Long shipmentId,
            Long workerId) {

        if (workerId == null) {
            throw new AccessDeniedException(
                    "Authenticated Worker ID is required."
            );
        }

        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Shipment task not found: " + shipmentId
                        ));

        if (shipment.getAssignedWorkerId() == null
                || !shipment.getAssignedWorkerId().equals(workerId)) {

            throw new AccessDeniedException(
                    "You cannot acknowledge a task that is not assigned to you."
            );
        }

        if (Boolean.TRUE.equals(shipment.getWorkerAcknowledged())) {
            return toShipmentDto(shipment);
        }

        shipment.setWorkerAcknowledged(true);
        shipment.setAcknowledgedAt(LocalDateTime.now());

        return toShipmentDto(shipmentRepository.save(shipment));
    }

    // =========================================================
    // WORKER SHIPMENT LIST
    // =========================================================

    @Transactional(readOnly = true)
    public List<ShipmentDto> getShipmentsForWorker(Long workerId) {

        if (workerId == null) {
            throw new AccessDeniedException(
                    "Worker ID is required."
            );
        }

        return shipmentRepository
                .findByAssignedWorkerIdOrderByCreatedAtDesc(workerId)
                .stream()
                .map(this::toShipmentDto)
                .collect(Collectors.toList());
    }

    // =========================================================
    // APPROVE DISTRIBUTION PLAN
    // =========================================================

    public Allocation approvePlan(
            Long allocationId,
            String adminUsername) {

        Allocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Distribution plan not found: " + allocationId
                        ));

        if ("APPROVED".equalsIgnoreCase(allocation.getPlanStatus())) {
            throw new ValidationException(
                    "This distribution plan has already been approved."
            );
        }

        for (Shipment shipment : allocation.getShipments()) {

            if (shipment.getAllocatedQuantity() > 0
                    && shipment.getSourceDepot() != null) {

                inventoryService.reserveStock(
                        shipment.getSourceDepot().getId(),
                        shipment.getSupplyType(),
                        shipment.getAllocatedQuantity(),
                        shipment.getShipmentCode(),
                        adminUsername
                );
            }
        }

        allocation.setPlanStatus("APPROVED");
        allocation.setApprovedBy(adminUsername);
        allocation.setApprovedAt(LocalDateTime.now());

        return allocationRepository.save(allocation);
    }

    @Transactional(readOnly = true)
    public List<Allocation> getAllAllocations() {
        return allocationRepository.findAll();
    }
}