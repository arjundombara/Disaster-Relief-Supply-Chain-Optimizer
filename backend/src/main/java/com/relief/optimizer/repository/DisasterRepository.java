package com.relief.optimizer.repository;

import com.relief.optimizer.model.Disaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisasterRepository extends JpaRepository<Disaster, Long> {
    List<Disaster> findByStatus(String status);
    List<Disaster> findByStatusNot(String status);
    List<Disaster> findAllByOrderByReportedAtDesc();
}
