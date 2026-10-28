package com.relief.optimizer.service;

import com.relief.optimizer.exception.ResourceNotFoundException;
import com.relief.optimizer.exception.ValidationException;
import com.relief.optimizer.model.OfficialInstruction;
import com.relief.optimizer.repository.OfficialInstructionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class InstructionService {

    private final OfficialInstructionRepository instructionRepository;

    @Autowired
    public InstructionService(OfficialInstructionRepository instructionRepository) {
        this.instructionRepository = instructionRepository;
    }

    @Transactional(readOnly = true)
    public List<OfficialInstruction> getAllInstructions() {
        return instructionRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<OfficialInstruction> getPublishedInstructions() {
        return instructionRepository.findByStatusOrderByCreatedAtDesc("PUBLISHED");
    }

    @Transactional(readOnly = true)
    public OfficialInstruction getById(Long id) {
        return instructionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Instruction not found: " + id));
    }

    public OfficialInstruction create(OfficialInstruction instruction, String adminUsername) {
        if (instruction.getTitle() == null || instruction.getTitle().trim().isEmpty()) {
            throw new ValidationException("Instruction title cannot be empty");
        }
        if (instruction.getMessage() == null || instruction.getMessage().trim().isEmpty()) {
            throw new ValidationException("Instruction message cannot be empty");
        }
        instruction.setIssuingAdmin(adminUsername);
        instruction.setCreatedAt(LocalDateTime.now());
        if (instruction.getStatus() == null) instruction.setStatus("PUBLISHED");
        return instructionRepository.save(instruction);
    }

    public OfficialInstruction update(Long id, OfficialInstruction updateData, String adminUsername) {
        OfficialInstruction existing = getById(id);
        existing.setTitle(updateData.getTitle());
        existing.setMessage(updateData.getMessage());
        existing.setDisasterId(updateData.getDisasterId());
        existing.setDisasterName(updateData.getDisasterName());
        existing.setTargetAudience(updateData.getTargetAudience());
        existing.setTargetEntityId(updateData.getTargetEntityId());
        if (updateData.getPriority() != null) existing.setPriority(updateData.getPriority());
        if (updateData.getStatus() != null) existing.setStatus(updateData.getStatus());
        existing.setExpiryTime(updateData.getExpiryTime());
        existing.setIssuingAdmin(adminUsername);
        return instructionRepository.save(existing);
    }

    public OfficialInstruction withdraw(Long id, String adminUsername) {
        OfficialInstruction existing = getById(id);
        existing.setStatus("WITHDRAWN");
        existing.setIssuingAdmin(adminUsername);
        return instructionRepository.save(existing);
    }

    public OfficialInstruction acknowledge(Long id) {
        OfficialInstruction existing = getById(id);
        existing.setAcknowledgementCount(
                (existing.getAcknowledgementCount() != null ? existing.getAcknowledgementCount() : 0) + 1
        );
        return instructionRepository.save(existing);
    }
}
