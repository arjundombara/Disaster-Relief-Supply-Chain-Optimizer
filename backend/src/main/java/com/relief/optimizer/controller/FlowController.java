package com.relief.optimizer.controller;

import com.relief.optimizer.algorithm.FlowResult;
import com.relief.optimizer.dto.FlowRequestDto;
import com.relief.optimizer.service.MaxFlowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/flow")
@Tag(name = "Flow Engine", description = "Edmonds-Karp / Dinic max-flow computation")
public class FlowController {

    private final MaxFlowService maxFlowService;

    @Autowired
    public FlowController(MaxFlowService maxFlowService) {
        this.maxFlowService = maxFlowService;
    }

    @PostMapping("/compute")
    @Operation(summary = "Compute maximum flow for a supply type using Edmonds-Karp or Dinic's algorithm")
    public ResponseEntity<FlowResult> computeFlow(@Valid @RequestBody FlowRequestDto request) {
        FlowResult result = maxFlowService.computeMaxFlow(
                request.getSupplyType(),
                request.getAlgorithm() != null ? request.getAlgorithm() : "EDMONDS_KARP"
        );
        return ResponseEntity.ok(result);
    }
}
