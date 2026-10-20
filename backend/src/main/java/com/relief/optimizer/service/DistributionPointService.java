package com.relief.optimizer.service;

import com.relief.optimizer.dto.DistributionPointDto;
import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.DistributionPoint;
import com.relief.optimizer.model.SeverityLevel;
import com.relief.optimizer.repository.DistributionPointRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DistributionPointService {

    private final DistributionPointRepository dpRepository;

    @Autowired
    public DistributionPointService(DistributionPointRepository dpRepository) {
        this.dpRepository = dpRepository;
    }

    public List<DistributionPointDto> getAllDistributionPoints() {
        return dpRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    public DistributionPointDto getById(Long id) {
        return toDto(dpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Distribution point not found: " + id)));
    }

    public DistributionPointDto create(DistributionPointDto dto) {
        if (dpRepository.existsByCode(dto.getCode())) {
            throw new ValidationException("Distribution point with code '" + dto.getCode() + "' already exists");
        }
        return toDto(dpRepository.save(fromDto(dto)));
    }

    public DistributionPointDto update(Long id, DistributionPointDto dto) {
        DistributionPoint existing = dpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Distribution point not found: " + id));
        if (!existing.getCode().equals(dto.getCode()) && dpRepository.existsByCode(dto.getCode())) {
            throw new ValidationException("Distribution point with code '" + dto.getCode() + "' already exists");
        }
        applyUpdate(existing, dto);
        return toDto(dpRepository.save(existing));
    }

    public void delete(Long id) {
        DistributionPoint dp = dpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Distribution point not found: " + id));
        dpRepository.delete(dp);
    }

    private void applyUpdate(DistributionPoint dp, DistributionPointDto dto) {
        dp.setCode(dto.getCode());
        dp.setName(dto.getName());
        dp.setLatitude(dto.getLatitude());
        dp.setLongitude(dto.getLongitude());
        dp.setAddress(dto.getAddress());
        dp.setContactPerson(dto.getContactPerson());
        dp.setPhone(dto.getPhone());
        dp.setSeverity(dto.getSeverity() != null ? dto.getSeverity() : SeverityLevel.HIGH);
        dp.setPriorityScore(dto.getPriorityScore() != null ? dto.getPriorityScore() : 3);
        dp.setAffectedPopulation(dto.getAffectedPopulation() != null ? dto.getAffectedPopulation() : 0);
        dp.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        if (dto.getFoodDemand() != null) dp.setFoodDemand(dto.getFoodDemand());
        if (dto.getWaterDemand() != null) dp.setWaterDemand(dto.getWaterDemand());
        if (dto.getMedicineDemand() != null) dp.setMedicineDemand(dto.getMedicineDemand());
        if (dto.getShelterDemand() != null) dp.setShelterDemand(dto.getShelterDemand());
    }

    public DistributionPointDto toDto(DistributionPoint dp) {
        DistributionPointDto dto = new DistributionPointDto();
        dto.setId(dp.getId());
        dto.setCode(dp.getCode());
        dto.setName(dp.getName());
        dto.setLatitude(dp.getLatitude());
        dto.setLongitude(dp.getLongitude());
        dto.setAddress(dp.getAddress());
        dto.setContactPerson(dp.getContactPerson());
        dto.setPhone(dp.getPhone());
        dto.setSeverity(dp.getSeverity());
        dto.setPriorityScore(dp.getPriorityScore());
        dto.setAffectedPopulation(dp.getAffectedPopulation());
        dto.setStatus(dp.getStatus());
        dto.setFoodDemand(dp.getFoodDemand());
        dto.setWaterDemand(dp.getWaterDemand());
        dto.setMedicineDemand(dp.getMedicineDemand());
        dto.setShelterDemand(dp.getShelterDemand());
        dto.setFoodDelivered(dp.getFoodDelivered());
        dto.setWaterDelivered(dp.getWaterDelivered());
        dto.setMedicineDelivered(dp.getMedicineDelivered());
        dto.setShelterDelivered(dp.getShelterDelivered());
        dto.setTotalDemand(dp.getTotalRequestedDemand());
        dto.setTotalDelivered(dp.getTotalDelivered());
        double demand = dp.getTotalRequestedDemand();
        dto.setSatisfactionRate(demand > 0 ? (dp.getTotalDelivered() / demand) * 100.0 : 0.0);
        return dto;
    }

    private DistributionPoint fromDto(DistributionPointDto dto) {
        DistributionPoint dp = new DistributionPoint();
        applyUpdate(dp, dto);
        return dp;
    }
}
