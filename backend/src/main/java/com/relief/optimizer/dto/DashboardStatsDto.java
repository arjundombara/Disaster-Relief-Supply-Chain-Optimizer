package com.relief.optimizer.dto;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DashboardStatsDto {
    private int totalDepots;
    private int totalDistributionPoints;
    private int totalRoutes;
    private int availableRoutes;
    private int totalShipments;
    private int pendingShipments;
    private int dispatchedShipments;
    private int deliveredShipments;

    private Map<String, Double> totalInventoryByType = new HashMap<>();
    private Map<String, Double> totalDemandByType = new HashMap<>();
    private Map<String, Double> totalDeliveredByType = new HashMap<>();
    private Map<String, Double> unmetDemandByType = new HashMap<>();
    private Map<String, Double> satisfactionRateByType = new HashMap<>();

    private double totalDemand;
    private double totalAvailableInventory;
    private double totalAllocated;
    private double totalUnmetDemand;
    private double overallSatisfactionRate;

    private int lowStockDepots;
    private int criticalDistributionPoints;
    private int bottleneckRoutes;

    private List<ShipmentDto> recentShipments;
    private List<DepotDto> lowStockDepotList;

    private double lastComputedMaxFlow;
    private String lastOptimizationTime;

    // Getters & setters
    public int getTotalDepots() { return totalDepots; }
    public void setTotalDepots(int totalDepots) { this.totalDepots = totalDepots; }
    public int getTotalDistributionPoints() { return totalDistributionPoints; }
    public void setTotalDistributionPoints(int totalDistributionPoints) { this.totalDistributionPoints = totalDistributionPoints; }
    public int getTotalRoutes() { return totalRoutes; }
    public void setTotalRoutes(int totalRoutes) { this.totalRoutes = totalRoutes; }
    public int getAvailableRoutes() { return availableRoutes; }
    public void setAvailableRoutes(int availableRoutes) { this.availableRoutes = availableRoutes; }
    public int getTotalShipments() { return totalShipments; }
    public void setTotalShipments(int totalShipments) { this.totalShipments = totalShipments; }
    public int getPendingShipments() { return pendingShipments; }
    public void setPendingShipments(int pendingShipments) { this.pendingShipments = pendingShipments; }
    public int getDispatchedShipments() { return dispatchedShipments; }
    public void setDispatchedShipments(int dispatchedShipments) { this.dispatchedShipments = dispatchedShipments; }
    public int getDeliveredShipments() { return deliveredShipments; }
    public void setDeliveredShipments(int deliveredShipments) { this.deliveredShipments = deliveredShipments; }
    public Map<String, Double> getTotalInventoryByType() { return totalInventoryByType; }
    public void setTotalInventoryByType(Map<String, Double> totalInventoryByType) { this.totalInventoryByType = totalInventoryByType; }
    public Map<String, Double> getTotalDemandByType() { return totalDemandByType; }
    public void setTotalDemandByType(Map<String, Double> totalDemandByType) { this.totalDemandByType = totalDemandByType; }
    public Map<String, Double> getTotalDeliveredByType() { return totalDeliveredByType; }
    public void setTotalDeliveredByType(Map<String, Double> totalDeliveredByType) { this.totalDeliveredByType = totalDeliveredByType; }
    public Map<String, Double> getUnmetDemandByType() { return unmetDemandByType; }
    public void setUnmetDemandByType(Map<String, Double> unmetDemandByType) { this.unmetDemandByType = unmetDemandByType; }
    public Map<String, Double> getSatisfactionRateByType() { return satisfactionRateByType; }
    public void setSatisfactionRateByType(Map<String, Double> satisfactionRateByType) { this.satisfactionRateByType = satisfactionRateByType; }
    public double getTotalDemand() { return totalDemand; }
    public void setTotalDemand(double totalDemand) { this.totalDemand = totalDemand; }
    public double getTotalAvailableInventory() { return totalAvailableInventory; }
    public void setTotalAvailableInventory(double totalAvailableInventory) { this.totalAvailableInventory = totalAvailableInventory; }
    public double getTotalAllocated() { return totalAllocated; }
    public void setTotalAllocated(double totalAllocated) { this.totalAllocated = totalAllocated; }
    public double getTotalUnmetDemand() { return totalUnmetDemand; }
    public void setTotalUnmetDemand(double totalUnmetDemand) { this.totalUnmetDemand = totalUnmetDemand; }
    public double getOverallSatisfactionRate() { return overallSatisfactionRate; }
    public void setOverallSatisfactionRate(double overallSatisfactionRate) { this.overallSatisfactionRate = overallSatisfactionRate; }
    public int getLowStockDepots() { return lowStockDepots; }
    public void setLowStockDepots(int lowStockDepots) { this.lowStockDepots = lowStockDepots; }
    public int getCriticalDistributionPoints() { return criticalDistributionPoints; }
    public void setCriticalDistributionPoints(int criticalDistributionPoints) { this.criticalDistributionPoints = criticalDistributionPoints; }
    public int getBottleneckRoutes() { return bottleneckRoutes; }
    public void setBottleneckRoutes(int bottleneckRoutes) { this.bottleneckRoutes = bottleneckRoutes; }
    public List<ShipmentDto> getRecentShipments() { return recentShipments; }
    public void setRecentShipments(List<ShipmentDto> recentShipments) { this.recentShipments = recentShipments; }
    public List<DepotDto> getLowStockDepotList() { return lowStockDepotList; }
    public void setLowStockDepotList(List<DepotDto> lowStockDepotList) { this.lowStockDepotList = lowStockDepotList; }
    public double getLastComputedMaxFlow() { return lastComputedMaxFlow; }
    public void setLastComputedMaxFlow(double lastComputedMaxFlow) { this.lastComputedMaxFlow = lastComputedMaxFlow; }
    public String getLastOptimizationTime() { return lastOptimizationTime; }
    public void setLastOptimizationTime(String lastOptimizationTime) { this.lastOptimizationTime = lastOptimizationTime; }
}
