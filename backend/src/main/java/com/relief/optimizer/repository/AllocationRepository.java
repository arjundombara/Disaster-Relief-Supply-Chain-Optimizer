package com.relief.optimizer.repository;

import com.relief.optimizer.model.Allocation;
import com.relief.optimizer.model.SupplyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    List<Allocation> findBySupplyTypeOrderByCreatedAtDesc(SupplyType supplyType);
    List<Allocation> findAllByOrderByCreatedAtDesc();
}
