package com.relief.optimizer.repository;

import com.relief.optimizer.model.OfficialInstruction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfficialInstructionRepository extends JpaRepository<OfficialInstruction, Long> {
    List<OfficialInstruction> findAllByOrderByCreatedAtDesc();
    List<OfficialInstruction> findByStatusOrderByCreatedAtDesc(String status);
    List<OfficialInstruction> findByDisasterIdOrderByCreatedAtDesc(Long disasterId);
}
