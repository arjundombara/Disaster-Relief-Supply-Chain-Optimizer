package com.relief.optimizer.service;

import com.relief.optimizer.dto.DepotDto;
import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.Depot;
import com.relief.optimizer.model.Inventory;
import com.relief.optimizer.model.SupplyType;
import com.relief.optimizer.repository.DepotRepository;
import com.relief.optimizer.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DepotService {

    private final DepotRepository depotRepository;
    private final InventoryRepository inventoryRepository;
    private final com.relief.optimizer.repository.RouteRepository routeRepository;
    private final com.relief.optimizer.repository.ShipmentRepository shipmentRepository;
    private final InventoryService inventoryService;

    @Autowired
    public DepotService(DepotRepository depotRepository,
                        InventoryRepository inventoryRepository,
                        com.relief.optimizer.repository.RouteRepository routeRepository,
                        com.relief.optimizer.repository.ShipmentRepository shipmentRepository,
                        InventoryService inventoryService) {
        this.depotRepository = depotRepository;
        this.inventoryRepository = inventoryRepository;
        this.routeRepository = routeRepository;
        this.shipmentRepository = shipmentRepository;
        this.inventoryService = inventoryService;
    }

    public List<DepotDto> getAllDepots() {
        return depotRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public DepotDto getDepotById(Long id) {
        Depot depot = depotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found with id: " + id));
        return toDto(depot);
    }

    public DepotDto createDepot(DepotDto dto) {
        if (depotRepository.existsByCode(dto.getCode())) {
            throw new ValidationException("Depot with code '" + dto.getCode() + "' already exists");
        }
        Depot depot = fromDto(dto);
        Depot saved = depotRepository.save(depot);

        // Create default inventories
        for (SupplyType st : SupplyType.values()) {
            Inventory inv = new Inventory(null, saved, st, 0.0, 0.0, 10.0, st.getDefaultUnit());
            saved.addInventory(inv);
            inventoryRepository.save(inv);
        }
        saved = depotRepository.save(saved);
        return toDto(saved);
    }

    public DepotDto updateDepot(Long id, DepotDto dto) {
        Depot existing = depotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found with id: " + id));

        if (!existing.getCode().equals(dto.getCode()) && depotRepository.existsByCode(dto.getCode())) {
            throw new ValidationException("Depot with code '" + dto.getCode() + "' already exists");
        }

        existing.setCode(dto.getCode());
        existing.setName(dto.getName());
        existing.setLatitude(dto.getLatitude());
        existing.setLongitude(dto.getLongitude());
        existing.setAddress(dto.getAddress());
        existing.setContactPerson(dto.getContactPerson());
        existing.setPhone(dto.getPhone());
        existing.setMaxCapacity(dto.getMaxCapacity());
        existing.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");

        // Update inventories if provided
        if (dto.getInventories() != null) {
            for (DepotDto.InventoryItemDto invDto : dto.getInventories()) {
                if (invDto.getAvailableQuantity() != null) {
                    inventoryService.adjustStock(id, invDto.getSupplyType(), invDto.getAvailableQuantity(), "Depot update inventory", "admin");
                }
            }
        }
        return toDto(depotRepository.save(existing));
    }

    public void deleteDepot(Long id) {
        Depot depot = depotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found with id: " + id));

        // Check if historical routes or shipments exist
        boolean hasRoutes = !routeRepository.findBySourceDepotId(id).isEmpty();
        boolean hasShipments = !shipmentRepository.findBySourceDepotId(id).isEmpty();

        if (hasRoutes || hasShipments) {
            // Soft delete / deactivate instead of hard delete to preserve historical integrity
            depot.setStatus("INACTIVE");
            depotRepository.save(depot);
            return;
        }

        depotRepository.delete(depot);
    }

    public DepotDto updateInventory(Long depotId, SupplyType supplyType, Double quantity) {
        if (quantity < 0) throw new ValidationException("Inventory quantity cannot be negative");
        inventoryService.adjustStock(depotId, supplyType, quantity, "Direct inventory update", "admin");
        return toDto(depotRepository.findById(depotId).orElseThrow());
    }


    // ---- Mapping ----

    public DepotDto toDto(Depot depot) {
        DepotDto dto = new DepotDto();
        dto.setId(depot.getId());
        dto.setCode(depot.getCode());
        dto.setName(depot.getName());
        dto.setLatitude(depot.getLatitude());
        dto.setLongitude(depot.getLongitude());
        dto.setAddress(depot.getAddress());
        dto.setContactPerson(depot.getContactPerson());
        dto.setPhone(depot.getPhone());
        dto.setMaxCapacity(depot.getMaxCapacity());
        dto.setStatus(depot.getStatus());

        List<DepotDto.InventoryItemDto> invDtos = new ArrayList<>();
        List<Inventory> invList = inventoryRepository.findByDepotId(depot.getId());
        if (invList.isEmpty() && depot.getInventories() != null) {
            invList = depot.getInventories();
        }
        for (Inventory inv : invList) {
            invDtos.add(new DepotDto.InventoryItemDto(
                    inv.getId(), inv.getSupplyType(),
                    inv.getAvailableQuantity(), inv.getReservedQuantity(),
                    inv.getMinimumThreshold(), inv.getUnit()
            ));
        }
        dto.setInventories(invDtos);
        return dto;
    }

    private Depot fromDto(DepotDto dto) {
        Depot depot = new Depot();
        depot.setCode(dto.getCode());
        depot.setName(dto.getName());
        depot.setLatitude(dto.getLatitude());
        depot.setLongitude(dto.getLongitude());
        depot.setAddress(dto.getAddress());
        depot.setContactPerson(dto.getContactPerson());
        depot.setPhone(dto.getPhone());
        depot.setMaxCapacity(dto.getMaxCapacity());
        depot.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        return depot;
    }
}
