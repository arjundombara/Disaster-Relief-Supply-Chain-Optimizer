package com.relief.optimizer.repository;

import com.relief.optimizer.model.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {
    List<IncidentReport> findByStatus(String status);
    List<IncidentReport> findAllByOrderByReportedAtDesc();
}
