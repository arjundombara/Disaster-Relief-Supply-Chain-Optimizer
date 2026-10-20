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

    @Autowired
    public DepotService(DepotRepository depotRepository, InventoryRepository inventoryRepository) {
        this.depotRepository = depotRepository;
        this.inventoryRepository = inventoryRepository;
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
                inventoryRepository.findByDepotIdAndSupplyType(id, invDto.getSupplyType())
                        .ifPresent(inv -> {
                            if (invDto.getAvailableQuantity() != null) {
                                if (invDto.getAvailableQuantity() < 0) {
                                    throw new ValidationException("Available quantity for " + invDto.getSupplyType() + " cannot be negative");
                                }
                                inv.setAvailableQuantity(invDto.getAvailableQuantity());
                            }
                            if (invDto.getReservedQuantity() != null) inv.setReservedQuantity(invDto.getReservedQuantity());
                            if (invDto.getMinimumThreshold() != null) inv.setMinimumThreshold(invDto.getMinimumThreshold());
                            inventoryRepository.save(inv);
                        });
            }
        }
        return toDto(depotRepository.save(existing));
    }

    public void deleteDepot(Long id) {
        Depot depot = depotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found with id: " + id));
        depotRepository.delete(depot);
    }

    public DepotDto updateInventory(Long depotId, SupplyType supplyType, Double quantity) {
        if (quantity < 0) throw new ValidationException("Inventory quantity cannot be negative");
        Depot depot = depotRepository.findById(depotId)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found with id: " + depotId));
        Inventory inv = inventoryRepository.findByDepotIdAndSupplyType(depotId, supplyType)
                .orElseGet(() -> {
                    Inventory newInv = new Inventory(null, depot, supplyType, 0.0, 0.0, 10.0, supplyType.getDefaultUnit());
                    depot.addInventory(newInv);
                    return newInv;
                });
        inv.setAvailableQuantity(quantity);
        inventoryRepository.save(inv);
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
