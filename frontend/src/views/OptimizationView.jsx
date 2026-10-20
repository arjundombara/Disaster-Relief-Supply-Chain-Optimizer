import React, { useState } from 'react';
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Sliders,
  Scale,
  Award,
  BookOpen,
  Send,
  Layers
} from 'lucide-react';

export default function OptimizationView({
  onRunOptimization,
  onCommitAllocation,
  loading,
  lastFlowResult,
  lastAllocationResult,
  depots = [],
  distributionPoints = [],
  routes = []
}) {
  const [supplyType, setSupplyType] = useState('FOOD');
  const [algorithm, setAlgorithm] = useState('EDMONDS_KARP');
  const [allocationPolicy, setAllocationPolicy] = useState('MAX_FLOW');
  const [activeTabSub, setActiveTabSub] = useState('results'); // 'results' | 'theory' | 'trace'

  const handleExecute = async () => {
    await onRunOptimization(supplyType, algorithm, allocationPolicy);
  };

  const getPolicyDescription = () => {
    switch (allocationPolicy) {
      case 'MAX_FLOW':
        return 'Maximizes aggregate volume of supplies across the entire network bottleneck capacity regardless of destination priority.';
      case 'PRIORITY_WEIGHTED':
        return 'Prioritizes Critical (Priority 5) and High (Priority 4) emergency zones first until their demand is satisfied before allocating to moderate zones.';
      case 'PROPORTIONAL':
        return 'Distributes the maximum deliverable flow proportionally according to each zone\'s demand share for fairness.';
      default:
        return '';
    }
  };

  const totalDemandForType = distributionPoints.reduce((acc, dp) => {
    if (supplyType === 'FOOD') return acc + (dp.foodDemand || 0);
    if (supplyType === 'WATER') return acc + (dp.waterDemand || 0);
    if (supplyType === 'MEDICINE') return acc + (dp.medicineDemand || 0);
    return acc;
  }, 0);

  const totalStockForType = depots.reduce((acc, d) => {
    const inv = d.inventories?.find(i => i.supplyType === supplyType);
    return acc + (inv?.availableQuantity || 0);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Supply Chain Flow Optimization Engine</h2>
          <p>Edmonds-Karp Maximum-Flow & Equitable Priority Triage Allocation for Disaster Logistics</p>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={handleExecute}
          disabled={loading}
          style={{ boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)' }}
        >
          <Play size={17} className={loading ? 'animate-spin' : ''} />
          <span>{loading ? 'Computing Max-Flow...' : 'Run Optimization Algorithm'}</span>
        </button>
      </div>

      {/* Control Configuration Panel */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Sliders size={17} color="#38bdf8" />
              Optimization Parameters & Constraints
            </h3>
            <p className="card-subtitle">
              Configure commodity domain, network flow algorithm, and fairness allocation rules
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {/* Supply Type Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Resource Type (Separately Solved)
            </label>
            <select
              className="form-control"
              value={supplyType}
              onChange={(e) => setSupplyType(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="FOOD">Food Rations (kg)</option>
              <option value="WATER">Potable Drinking Water (Liters)</option>
              <option value="MEDICINE">Medical Emergency Kits</option>
            </select>
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
              Total Stock: <strong style={{ color: '#fff' }}>{totalStockForType}</strong> | Total Demanded: <strong style={{ color: '#f87171' }}>{totalDemandForType}</strong>
            </div>
          </div>

          {/* Algorithm Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Network Flow Algorithm</label>
            <select
              className="form-control"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="EDMONDS_KARP">Edmonds-Karp (BFS Augmenting Paths - O(V·E²))</option>
              <option value="DINIC">Dinic's Algorithm (Layered Level Graph - O(V²·E))</option>
            </select>
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: 'var(--text-dim)' }}>
              Computes maximum throughput via bottleneck residual capacities.
            </div>
          </div>

          {/* Allocation Policy */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Scale size={14} color="#f59e0b" /> Allocation & Fairness Policy
            </label>
            <select
              className="form-control"
              value={allocationPolicy}
              onChange={(e) => setAllocationPolicy(e.target.value)}
              style={{ fontWeight: 600 }}
            >
              <option value="MAX_FLOW">Maximum Flow (Throughput Maxima)</option>
              <option value="PRIORITY_WEIGHTED">Priority-Weighted (Critical Triage First)</option>
              <option value="PROPORTIONAL">Proportional Allocation (Demand Share Equity)</option>
            </select>
            <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#93c5fd' }}>
              {getPolicyDescription()}
            </div>
          </div>
        </div>
      </div>

      {/* Theoretical Distinction Card */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px'
      }}>
        <div style={{ background: '#0284c7', padding: '8px', borderRadius: '8px', color: '#fff', marginTop: '2px' }}>
          <BookOpen size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: '#e0f2fe', marginBottom: '4px' }}>
            System Architecture Note: Maximum Flow vs. Priority & Fairness
          </h4>
          <p style={{ fontSize: '12.5px', color: '#bae6fd', lineHeight: 1.5 }}>
            <strong>Theoretical Guarantee:</strong> The Edmonds–Karp max-flow algorithm is mathematically designed to maximize overall network throughput from super-source to super-sink. However, max-flow algorithms are <em>priority-blind</em>. In disaster emergencies, humanitarian ethics demand that Critical zones receive supplies ahead of Moderate zones. Therefore, this system runs Edmonds-Karp to determine the physical bottleneck capacity constraint, and then applies a separate <strong>Priority-Weighted Triage Allocation Engine</strong> to ensure fair and equitable relief distribution.
          </p>
        </div>
      </div>

      {/* Results Section */}
      {lastAllocationResult ? (
        <div>
          {/* Summary Metric Strip */}
          <div className="kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="kpi-card blue">
              <div className="kpi-top">
                <span className="kpi-label">Max Network Flow</span>
                <Zap size={16} color="#38bdf8" />
              </div>
              <div className="kpi-value">{lastFlowResult?.maxFlow || lastAllocationResult.totalAllocatedFlow} <span style={{ fontSize: '13px', color: '#94a3b8' }}>units</span></div>
              <div className="kpi-subtext">Physical network capacity</div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-top">
                <span className="kpi-label">Allocated Supplies</span>
                <CheckCircle2 size={16} color="#10b981" />
              </div>
              <div className="kpi-value">{lastAllocationResult.totalAllocatedFlow} <span style={{ fontSize: '13px', color: '#94a3b8' }}>units</span></div>
              <div className="kpi-subtext">According to {lastAllocationResult.allocationPolicy}</div>
            </div>

            <div className="kpi-card red">
              <div className="kpi-top">
                <span className="kpi-label">Unmet Demand</span>
                <AlertTriangle size={16} color="#ef4444" />
              </div>
              <div className="kpi-value">{lastAllocationResult.unmetDemand} <span style={{ fontSize: '13px', color: '#94a3b8' }}>units</span></div>
              <div className="kpi-subtext">Total demanded: {lastAllocationResult.totalRequestedDemand}</div>
            </div>

            <div className="kpi-card amber">
              <div className="kpi-top">
                <span className="kpi-label">Demand Satisfaction</span>
                <TrendingUp size={16} color="#f59e0b" />
              </div>
              <div className="kpi-value">{lastAllocationResult.satisfactionPercentage?.toFixed(1)}%</div>
              <div className="kpi-subtext">Of target zones fulfilled</div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <button
              className={`btn btn-sm ${activeTabSub === 'results' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTabSub('results')}
            >
              <span>Selected Route Allocations</span>
            </button>
            <button
              className={`btn btn-sm ${activeTabSub === 'trace' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTabSub('trace')}
            >
              <span>Edmonds-Karp Augmenting Path Trace</span>
            </button>
            <button
              className={`btn btn-sm ${activeTabSub === 'bottlenecks' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTabSub('bottlenecks')}
            >
              <span>Bottleneck Links</span>
            </button>
          </div>

          {activeTabSub === 'results' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <CheckCircle2 size={17} color="#10b981" />
                    Generated Shipments & Flow Allocation Plan ({lastAllocationResult.supplyType})
                  </h3>
                  <p className="card-subtitle">
                    Optimal supplies routed from depots to disaster zones based on calculated residual capacities
                  </p>
                </div>

                <div className="badge badge-success">
                  Allocation Active
                </div>
              </div>

              {lastAllocationResult.shipments && lastAllocationResult.shipments.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Shipment Code</th>
                        <th>Corridor Route</th>
                        <th>Origin Depot</th>
                        <th>Destination Zone</th>
                        <th>Allocated Qty</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastAllocationResult.shipments.map((shp) => (
                        <tr key={shp.id}>
                          <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>
                            {shp.shipmentCode}
                          </td>
                          <td className="mono-cell" style={{ fontWeight: 600 }}>
                            {shp.route?.routeCode || 'DIRECT'}
                          </td>
                          <td>
                            <strong>{shp.sourceDepot?.name || shp.sourceDepotName}</strong>
                          </td>
                          <td>
                            <strong>{shp.destinationPoint?.name || shp.destinationPointName}</strong>
                          </td>
                          <td className="mono-cell" style={{ fontWeight: 700, color: '#34d399' }}>
                            {shp.allocatedQuantity} {shp.supplyType === 'FOOD' ? 'kg' : shp.supplyType === 'WATER' ? 'L' : 'kits'}
                          </td>
                          <td>
                            <span className="badge badge-medium">
                              {shp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No shipments generated because demand was 0 or all routes were blocked.
                </div>
              )}
            </div>
          )}

          {activeTabSub === 'trace' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <Layers size={17} color="#38bdf8" />
                    Breadth-First Search (BFS) Augmenting Path Step Log
                  </h3>
                  <p className="card-subtitle">
                    Step-by-step mathematical trace of augmenting paths found and bottleneck capacities saturated
                  </p>
                </div>
              </div>

              {lastFlowResult?.augmentingPaths && lastFlowResult.augmentingPaths.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lastFlowResult.augmentingPaths.map((step, idx) => (
                    <div key={idx} className="step-item">
                      <div className="step-header">
                        <span>Iteration #{step.stepNumber}: Augmenting Path Found</span>
                        <span className="mono-cell" style={{ color: '#34d399' }}>
                          Bottleneck Flow: +{step.bottleneckFlow} units
                        </span>
                      </div>
                      <div className="step-path">
                        Path: {step.path}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                        Cumulative Flow Reached: <strong>{step.cumulativeFlow}</strong> units
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No augmenting paths available in the residual graph.
                </div>
              )}
            </div>
          )}

          {activeTabSub === 'bottlenecks' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    <AlertTriangle size={17} color="#f59e0b" />
                    Critical Bottleneck Links (Residual Capacity Saturated)
                  </h3>
                  <p className="card-subtitle">
                    Transportation corridors operating at 100% capacity limit that constrain greater aid throughput
                  </p>
                </div>
              </div>

              {lastFlowResult?.bottleneckRoutes && lastFlowResult.bottleneckRoutes.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Corridor Code</th>
                        <th>From Node</th>
                        <th>To Node</th>
                        <th>Max Capacity</th>
                        <th>Saturated Flow</th>
                        <th>Bottleneck Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastFlowResult.bottleneckRoutes.map((b, idx) => (
                        <tr key={idx}>
                          <td className="mono-cell" style={{ fontWeight: 700, color: '#f87171' }}>
                            {b.routeCode}
                          </td>
                          <td>{b.fromNode}</td>
                          <td>{b.toNode}</td>
                          <td className="mono-cell">{b.capacity}</td>
                          <td className="mono-cell" style={{ color: '#f87171', fontWeight: 700 }}>
                            {b.flow} (100% Saturated)
                          </td>
                          <td>
                            <span className="badge badge-critical">CRITICAL BOTTLENECK</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No saturated bottleneck links detected. Corridors have remaining headroom.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Zap size={44} color="#3b82f6" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            Optimization Ready to Execute
          </h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 24px auto', fontSize: '13.5px' }}>
            Select your target resource (Food, Water, or Medicine) and desired allocation policy above, then click "Run Optimization Algorithm" to construct the flow network and solve for maximal distribution throughput.
          </p>
          <button className="btn btn-primary" onClick={handleExecute} disabled={loading}>
            <Play size={16} />
            <span>Compute Supply Flow Now</span>
          </button>
        </div>
      )}
    </div>
  );
}
