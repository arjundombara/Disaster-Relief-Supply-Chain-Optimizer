package com.relief.optimizer.repository;

import com.relief.optimizer.model.Depot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DepotRepository extends JpaRepository<Depot, Long> {
    Optional<Depot> findByCode(String code);
    boolean existsByCode(String code);
}
