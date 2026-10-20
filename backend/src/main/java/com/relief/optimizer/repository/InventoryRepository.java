package com.relief.optimizer.repository;

import com.relief.optimizer.model.Inventory;
import com.relief.optimizer.model.SupplyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByDepotId(Long depotId);
    Optional<Inventory> findByDepotIdAndSupplyType(Long depotId, SupplyType supplyType);
    List<Inventory> findBySupplyType(SupplyType supplyType);
}
