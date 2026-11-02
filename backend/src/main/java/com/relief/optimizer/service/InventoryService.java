package com.relief.optimizer.service;

import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.Depot;
import com.relief.optimizer.model.Inventory;
import com.relief.optimizer.model.InventoryTransaction;
import com.relief.optimizer.model.InventoryTransaction.TransactionType;
import com.relief.optimizer.model.SupplyType;
import com.relief.optimizer.repository.DepotRepository;
import com.relief.optimizer.repository.InventoryRepository;
import com.relief.optimizer.repository.InventoryTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final DepotRepository depotRepository;
    private final InventoryTransactionRepository transactionRepository;

    @Autowired
    public InventoryService(InventoryRepository inventoryRepository,
                            DepotRepository depotRepository,
                            InventoryTransactionRepository transactionRepository) {
        this.inventoryRepository = inventoryRepository;
        this.depotRepository = depotRepository;
        this.transactionRepository = transactionRepository;
    }

    private Inventory getOrCreateInventory(Depot depot, SupplyType supplyType) {
        return inventoryRepository.findByDepotIdAndSupplyType(depot.getId(), supplyType)
                .orElseGet(() -> {
                    Inventory inv = new Inventory(null, depot, supplyType, 0.0, 0.0, 10.0, supplyType.getDefaultUnit());
                    depot.addInventory(inv);
                    return inventoryRepository.save(inv);
                });
    }

    public Inventory addIncomingStock(Long depotId, SupplyType supplyType, double quantity, String reason, String username) {
        if (quantity <= 0) throw new ValidationException("Incoming quantity must be strictly greater than zero");

        Depot depot = depotRepository.findById(depotId)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found: " + depotId));

        Inventory inventory = getOrCreateInventory(depot, supplyType);
        inventory.setAvailableQuantity(inventory.getAvailableQuantity() + quantity);
        inventory.setPhysicalQuantity(inventory.getPhysicalQuantity() + quantity);
        inventory = inventoryRepository.save(inventory);

        InventoryTransaction tx = new InventoryTransaction(
                null, depot.getId(), depot.getCode(), supplyType,
                TransactionType.INCOMING_STOCK, quantity,
                inventory.getAvailableQuantity(), inventory.getReservedQuantity(),
                reason != null ? reason : "Direct Stock Replenishment", null, username
        );
        transactionRepository.save(tx);
        return inventory;
    }

    public Inventory reserveStock(Long depotId, SupplyType supplyType, double quantity, String referenceCode, String username) {
        if (quantity <= 0) throw new ValidationException("Reserved quantity must be positive");

        Depot depot = depotRepository.findById(depotId)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found: " + depotId));

        if (!"ACTIVE".equalsIgnoreCase(depot.getStatus())) {
            throw new ValidationException("Cannot reserve stock from inactive depot " + depot.getCode());
        }

        Inventory inventory = getOrCreateInventory(depot, supplyType);
        if (inventory.getAvailableQuantity() < quantity - 1e-9) {
            throw new ValidationException(String.format("Insufficient stock for %s at depot %s. Available: %.1f, Requested: %.1f",
                    supplyType, depot.getCode(), inventory.getAvailableQuantity(), quantity));
        }

        inventory.setAvailableQuantity(Math.max(0.0, inventory.getAvailableQuantity() - quantity));
        inventory.setReservedQuantity(inventory.getReservedQuantity() + quantity);
        inventory = inventoryRepository.save(inventory);

        InventoryTransaction tx = new InventoryTransaction(
                null, depot.getId(), depot.getCode(), supplyType,
                TransactionType.RESERVATION, quantity,
                inventory.getAvailableQuantity(), inventory.getReservedQuantity(),
                "Stock reserved for allocation", referenceCode, username
        );
        transactionRepository.save(tx);
        return inventory;
    }

    public Inventory dispatchStock(Long depotId, SupplyType supplyType, double quantity, String referenceCode, String username) {
        if (quantity <= 0) throw new ValidationException("Dispatched quantity must be positive");

        Depot depot = depotRepository.findById(depotId)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found: " + depotId));

        Inventory inventory = getOrCreateInventory(depot, supplyType);
        double reserved = inventory.getReservedQuantity() != null ? inventory.getReservedQuantity() : 0.0;
        double deductFromReserved = Math.min(reserved, quantity);
        double remainder = quantity - deductFromReserved;

        inventory.setReservedQuantity(Math.max(0.0, reserved - deductFromReserved));
        if (remainder > 1e-9) {
            if (inventory.getAvailableQuantity() < remainder) {
                throw new ValidationException("Insufficient available stock to dispatch unreserved portion.");
            }
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() - remainder);
        }

        inventory.setDispatchedQuantity(inventory.getDispatchedQuantity() + quantity);
        inventory = inventoryRepository.save(inventory);

        InventoryTransaction tx = new InventoryTransaction(
                null, depot.getId(), depot.getCode(), supplyType,
                TransactionType.DISPATCH, quantity,
                inventory.getAvailableQuantity(), inventory.getReservedQuantity(),
                "Dispatched to field", referenceCode, username
        );
        transactionRepository.save(tx);
        return inventory;
    }

    public Inventory reconcileDelivery(Long depotId, SupplyType supplyType, double deliveredQty,
                                      double returnedQty, double damagedQty, String referenceCode, String username) {
        Depot depot = depotRepository.findById(depotId)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found: " + depotId));

        Inventory inventory = getOrCreateInventory(depot, supplyType);

        if (deliveredQty > 0) {
            inventory.setDeliveredQuantity(inventory.getDeliveredQuantity() + deliveredQty);
            // Deduct from physical depot inventory
            inventory.setPhysicalQuantity(Math.max(0.0, inventory.getPhysicalQuantity() - deliveredQty));

            InventoryTransaction delTx = new InventoryTransaction(
                    null, depot.getId(), depot.getCode(), supplyType,
                    TransactionType.DELIVERY_CONFIRMED, deliveredQty,
                    inventory.getAvailableQuantity(), inventory.getReservedQuantity(),
                    "Delivery confirmed and fulfilled", referenceCode, username
            );
            transactionRepository.save(delTx);
        }

        if (returnedQty > 0) {
            inventory.setReturnedQuantity(inventory.getReturnedQuantity() + returnedQty);
            // Add back to available stock
            inventory.setAvailableQuantity(inventory.getAvailableQuantity() + returnedQty);

            InventoryTransaction retTx = new InventoryTransaction(
                    null, depot.getId(), depot.getCode(), supplyType,
                    TransactionType.RETURN_CONFIRMED, returnedQty,
                    inventory.getAvailableQuantity(), inventory.getReservedQuantity(),
                    "Undelivered stock returned to available inventory", referenceCode, username
            );
            transactionRepository.save(retTx);
        }

        if (damagedQty > 0) {
            inventory.setDamagedQuantity(inventory.getDamagedQuantity() + damagedQty);
            // Deduct from physical inventory since it is damaged/unusable
            inventory.setPhysicalQuantity(Math.max(0.0, inventory.getPhysicalQuantity() - damagedQty));

            InventoryTransaction damTx = new InventoryTransaction(
                    null, depot.getId(), depot.getCode(), supplyType,
                    TransactionType.DAMAGE_RECORDED, damagedQty,
                    inventory.getAvailableQuantity(), inventory.getReservedQuantity(),
                    "Damaged supplies written off", referenceCode, username
            );
            transactionRepository.save(damTx);
        }

        double totalAccounted = deliveredQty + returnedQty + damagedQty;
        inventory.setDispatchedQuantity(Math.max(0.0, inventory.getDispatchedQuantity() - totalAccounted));

        return inventoryRepository.save(inventory);
    }

    public Inventory adjustStock(Long depotId, SupplyType supplyType, double newAvailableQty, String reason, String username) {
        if (newAvailableQty < 0) throw new ValidationException("Available quantity cannot be negative");

        Depot depot = depotRepository.findById(depotId)
                .orElseThrow(() -> new ResourceNotFoundException("Depot not found: " + depotId));

        Inventory inventory = getOrCreateInventory(depot, supplyType);
        double delta = newAvailableQty - inventory.getAvailableQuantity();
        inventory.setAvailableQuantity(newAvailableQty);
        inventory.setPhysicalQuantity(Math.max(0.0, inventory.getPhysicalQuantity() + delta));
        inventory = inventoryRepository.save(inventory);

        InventoryTransaction tx = new InventoryTransaction(
                null, depot.getId(), depot.getCode(), supplyType,
                TransactionType.ADJUSTMENT, Math.abs(delta),
                inventory.getAvailableQuantity(), inventory.getReservedQuantity(),
                reason != null ? reason : "Manual administrative stock adjustment", null, username
        );
        transactionRepository.save(tx);
        return inventory;
    }

    @Transactional(readOnly = true)
    public List<InventoryTransaction> getTransactionHistory(Long depotId) {
        if (depotId != null) {
            return transactionRepository.findByDepotIdOrderByTimestampDesc(depotId);
        }
        return transactionRepository.findAllByOrderByTimestampDesc();
    }
}
