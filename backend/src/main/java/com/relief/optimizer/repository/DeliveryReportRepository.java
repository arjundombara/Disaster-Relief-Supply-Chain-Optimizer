package com.relief.optimizer.repository;

import com.relief.optimizer.model.DeliveryReport;
import com.relief.optimizer.model.DeliveryReport.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryReportRepository extends JpaRepository<DeliveryReport, Long> {
    List<DeliveryReport> findAllByOrderBySubmittedAtDesc();
    List<DeliveryReport> findByStatusOrderBySubmittedAtDesc(ReportStatus status);
    List<DeliveryReport> findByWorkerIdOrderBySubmittedAtDesc(Long workerId);
    List<DeliveryReport> findByShipmentId(Long shipmentId);
}
