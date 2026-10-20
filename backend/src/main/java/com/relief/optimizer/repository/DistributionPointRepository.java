package com.relief.optimizer.repository;

import com.relief.optimizer.model.DistributionPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DistributionPointRepository extends JpaRepository<DistributionPoint, Long> {
    Optional<DistributionPoint> findByCode(String code);
    boolean existsByCode(String code);
}
