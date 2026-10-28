package com.relief.optimizer.service;

import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.Disaster;
import com.relief.optimizer.repository.DisasterRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class DisasterService {

    private final DisasterRepository disasterRepository;

    @Autowired
    public DisasterService(DisasterRepository disasterRepository) {
        this.disasterRepository = disasterRepository;
    }

    @Transactional(readOnly = true)
    public List<Disaster> getAllDisasters() {
        return disasterRepository.findAllByOrderByReportedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<Disaster> getActiveDisasters() {
        return disasterRepository.findByStatusNot("CLOSED");
    }

    @Transactional(readOnly = true)
    public Disaster getById(Long id) {
        return disasterRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Disaster record not found: " + id));
    }

    public Disaster create(Disaster disaster, String adminUsername) {
        if (disaster.getName() == null || disaster.getName().trim().isEmpty()) {
            throw new ValidationException("Disaster name is required");
        }
        disaster.setReportedAt(disaster.getReportedAt() != null ? disaster.getReportedAt() : LocalDateTime.now());
        disaster.setUpdatedAt(LocalDateTime.now());
        disaster.setUpdatedBy(adminUsername);
        if (disaster.getStatus() == null) disaster.setStatus("ACTIVE");
        return disasterRepository.save(disaster);
    }

    public Disaster update(Long id, Disaster updateData, String adminUsername) {
        Disaster existing = getById(id);
        existing.setName(updateData.getName());
        existing.setDisasterType(updateData.getDisasterType());
        existing.setAffectedLocation(updateData.getAffectedLocation());
        existing.setDescription(updateData.getDescription());
        if (updateData.getSeverity() != null) existing.setSeverity(updateData.getSeverity());
        if (updateData.getEstimatedPopulation() != null) existing.setEstimatedPopulation(updateData.getEstimatedPopulation());
        existing.setAffectedAreas(updateData.getAffectedAreas());
        existing.setRequiredResources(updateData.getRequiredResources());
        existing.setUrgentInstructions(updateData.getUrgentInstructions());
        if (updateData.getStatus() != null) existing.setStatus(updateData.getStatus());
        existing.setSourceInfo(updateData.getSourceInfo());
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(adminUsername);
        return disasterRepository.save(existing);
    }

    public Disaster closeDisaster(Long id, String adminUsername) {
        Disaster existing = getById(id);
        existing.setStatus("CLOSED");
        existing.setUpdatedAt(LocalDateTime.now());
        existing.setUpdatedBy(adminUsername);
        return disasterRepository.save(existing);
    }

    public void delete(Long id) {
        Disaster existing = getById(id);
        disasterRepository.delete(existing);
    }
}
