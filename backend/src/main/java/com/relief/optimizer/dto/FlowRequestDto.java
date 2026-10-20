package com.relief.optimizer.dto;

import com.relief.optimizer.model.SupplyType;

import javax.validation.constraints.NotNull;

public class FlowRequestDto {

    @NotNull(message = "Supply type is required")
    private SupplyType supplyType;

    /** EDMONDS_KARP or DINIC */
    private String algorithm = "EDMONDS_KARP";

    /** MAX_FLOW | PROPORTIONAL | PRIORITY_WEIGHTED */
    private String allocationPolicy = "MAX_FLOW";

    public SupplyType getSupplyType() { return supplyType; }
    public void setSupplyType(SupplyType supplyType) { this.supplyType = supplyType; }
    public String getAlgorithm() { return algorithm; }
    public void setAlgorithm(String algorithm) { this.algorithm = algorithm; }
    public String getAllocationPolicy() { return allocationPolicy; }
    public void setAllocationPolicy(String allocationPolicy) { this.allocationPolicy = allocationPolicy; }
}
