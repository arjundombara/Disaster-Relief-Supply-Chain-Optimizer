package com.relief.optimizer.repository;

import com.relief.optimizer.model.InventoryTransaction;
import com.relief.optimizer.model.SupplyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {
    List<InventoryTransaction> findAllByOrderByTimestampDesc();
    List<InventoryTransaction> findByDepotIdOrderByTimestampDesc(Long depotId);
    List<InventoryTransaction> findBySupplyTypeOrderByTimestampDesc(SupplyType supplyType);
    List<InventoryTransaction> findByReferenceCode(String referenceCode);
}
