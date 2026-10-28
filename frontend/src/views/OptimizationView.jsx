import React, { useState, useEffect } from 'react';
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
  Layers,
  Check,
  UserCheck,
  Clock,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function OptimizationView({
  onRunOptimization,
  loading,
  lastFlowResult,
  lastAllocationResult,
  depots = [],
  distributionPoints = [],
  routes = [],
  onRefreshData,
  showAlert,
  currentUser
}) {
  const [supplyType, setSupplyType] = useState('FOOD');
  const [algorithm, setAlgorithm] = useState('EDMONDS_KARP');
  const [allocationPolicy, setAllocationPolicy] = useState('MAX_FLOW');
  const [activeTabSub, setActiveTabSub] = useState('results'); // 'results' | 'theory' | 'trace' | 'bottlenecks'

  // Plan approval & Worker assignment state
  const [approvingPlan, setApprovingPlan] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [assigningShipment, setAssigningShipment] = useState(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [taskPriority, setTaskPriority] = useState('HIGH');
  const [deadline, setDeadline] = useState('');
  const [taskInstructions, setTaskInstructions] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  useEffect(() => {
    api.getWorkers().then(data => setWorkers(data || [])).catch(() => {});
  }, []);

  const handleExecute = async () => {
    await onRunOptimization(supplyType, algorithm, allocationPolicy);
  };

  const handleApprovePlan = async (planId) => {
    setApprovingPlan(true);
    try {
      await api.approvePlan(planId);
      showAlert(`Relief Allocation Plan #${planId} APPROVED by Commander! Shipments queued for field dispatches.`, 'success');
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      showAlert(err.message || 'Failed to approve plan', 'danger');
    } finally {
      setApprovingPlan(false);
    }
  };

  const openAssignModal = (shp) => {
    setAssigningShipment(shp);
    setSelectedWorkerId(shp.assignedWorkerId || workers[0]?.id || '');
    setTaskPriority(shp.taskPriority || 'HIGH');
    setDeadline(shp.deadline ? shp.deadline.split('T')[0] : '');
    setTaskInstructions(shp.taskInstructions || `Deliver ${shp.allocatedQuantity} ${shp.supplyType} directly to ${shp.destinationPoint?.name || 'affected zone'}. Cross-verify GPS on site.`);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assigningShipment || !selectedWorkerId) return;
    setSubmittingAssignment(true);

    try {
      const payload = {
        workerId: parseInt(selectedWorkerId, 10),
        taskPriority,
        deadline: deadline ? `${deadline}T23:59:59` : null,
        taskInstructions: taskInstructions.trim()
      };

      await api.assignShipmentWorker(assigningShipment.id, payload);
      showAlert(`Shipment #${assigningShipment.id} successfully assigned to field unit!`, 'success');
      setAssigningShipment(null);
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      showAlert(err.message || 'Failed to assign worker', 'danger');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const totalDemandForType = distributionPoints.reduce((acc, dp) => {
    if (supplyType === 'FOOD') return acc + (dp.foodDemand || 0);
    if (supplyType === 'WATER') return acc + (dp.waterDemand || 0);
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
          <p>Edmonds-Karp Maximum-Flow & Priority Fairness Triage for Disaster Relief Distribution</p>
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
              Optimization Parameters & Multi-Commodity Settings
            </h3>
            <p className="card-subtitle">
              Configure commodity domain, network flow algorithm, and emergency triage rules
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {/* Supply Type Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Resource Category
            </label>
            <select
              className="form-control"
              value={supplyType}
              onChange={(e) => setSupplyType(e.target.value)}
            >
              <option value="FOOD">Food Rations (kg)</option>
              <option value="WATER">Potable Water (Liters)</option>
              <option value="MEDICAL">Emergency Medical Kits (units)</option>
              <option value="SHELTER">Tents & Tarpaulins (kits)</option>
            </select>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Available in Depots: <strong>{totalStockForType}</strong> | Requested Demand: <strong>{totalDemandForType}</strong>
            </div>
          </div>

          {/* Algorithm Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Flow Network Algorithm
            </label>
            <select
              className="form-control"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="EDMONDS_KARP">Edmonds-Karp O(V·E²) - BFS Shortest Augmenting Path</option>
              <option value="DINICS">Dinic's Algorithm O(V²·E) - Level Graph Layering</option>
            </select>
          </div>

          {/* Allocation Policy */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Distribution Fairness Policy
            </label>
            <select
              className="form-control"
              value={allocationPolicy}
              onChange={(e) => setAllocationPolicy(e.target.value)}
            >
              <option value="MAX_FLOW">Max-Flow Only (Maximize aggregate throughput)</option>
              <option value="PRIORITY_WEIGHTED">Priority-Weighted (Critical Priority 5 first)</option>
              <option value="PROPORTIONAL">Proportional Equitable (Equal satisfaction share)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {lastAllocationResult ? (
        <div>
          {/* Plan Approval Banner */}
          <div style={{
            backgroundColor: lastAllocationResult.planStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: `1px solid ${lastAllocationResult.planStatus === 'APPROVED' ? '#10b981' : '#f59e0b'}`,
            borderRadius: '8px',
            padding: '14px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: '#f8fafc' }}>
                  Optimization Plan #{lastAllocationResult.id}
                </span>
                <span className={`badge ${lastAllocationResult.planStatus === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                  {lastAllocationResult.planStatus}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                {lastAllocationResult.planStatus === 'APPROVED'
                  ? `Approved by Commander ${lastAllocationResult.approvedBy || 'Admin'} at ${lastAllocationResult.approvedAt ? new Date(lastAllocationResult.approvedAt).toLocaleTimeString() : 'Verified'}.`
                  : 'Proposed allocation ready for Commander verification and dispatch authorization.'}
              </p>
            </div>

            {lastAllocationResult.planStatus === 'PROPOSED' && (
              <button
                className="btn btn-primary"
                onClick={() => handleApprovePlan(lastAllocationResult.id)}
                disabled={approvingPlan}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={16} />
                <span>{approvingPlan ? 'Authorizing...' : 'Approve Plan & Authorize Dispatches'}</span>
              </button>
            )}
          </div>

          {/* Metric KPIs */}
          <div className="kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="kpi-card blue">
              <div className="kpi-top">
                <span className="kpi-label">Deliverable Flow</span>
                <Award size={16} color="#38bdf8" />
              </div>
              <div className="kpi-value">{lastAllocationResult.totalAllocatedFlow} <span style={{ fontSize: '13px', color: '#94a3b8' }}>units</span></div>
              <div className="kpi-subtext">Total available: {lastAllocationResult.totalAvailableSupply} units</div>
            </div>

            <div className="kpi-card green">
              <div className="kpi-top">
                <span className="kpi-label">Algorithm Performance</span>
                <Zap size={16} color="#10b981" />
              </div>
              <div className="kpi-value">{lastFlowResult?.computationTimeMs ?? '<1'} <span style={{ fontSize: '13px', color: '#94a3b8' }}>ms</span></div>
              <div className="kpi-subtext">{lastFlowResult?.augmentingPathsFound ?? 0} augmenting paths explored</div>
            </div>

            <div className="kpi-card red">
              <div className="kpi-top">
                <span className="kpi-label">Unmet Demand</span>
                <AlertTriangle size={16} color="#ef4444" />
              </div>
              <div className="kpi-value">{lastAllocationResult.unmetDemand} <span style={{ fontSize: '13px', color: '#94a3b8' }}>units</span></div>
              <div className="kpi-subtext">Total demanded: {lastAllocationResult.totalRequestedDemand} units</div>
            </div>

            <div className="kpi-card amber">
              <div className="kpi-top">
                <span className="kpi-label">Demand Satisfaction</span>
                <TrendingUp size={16} color="#f59e0b" />
              </div>
              <div className="kpi-value">{lastAllocationResult.satisfactionPercentage?.toFixed(1)}%</div>
              <div className="kpi-subtext">Of target population demand satisfied</div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
            <button
              className={`btn btn-sm ${activeTabSub === 'results' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTabSub('results')}
            >
              <span>Selected Route Allocations & Assignments</span>
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
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 className="card-title">
                    <CheckCircle2 size={17} color="#10b981" />
                    Generated Shipments & Flow Allocation Plan ({lastAllocationResult.supplyType})
                  </h3>
                  <p className="card-subtitle">
                    Optimal relief supplies dispatched from depots to disaster zones based on calculated residual capacities
                  </p>
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
                        <th>Assigned Field Unit</th>
                        <th>Status</th>
                        <th>Action</th>
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
                            {shp.assignedWorkerName ? (
                              <div>
                                <span className="badge badge-info">{shp.assignedWorkerName}</span>
                                {shp.workerAcknowledged && (
                                  <span style={{ fontSize: '10px', color: '#10b981', display: 'block', marginTop: '2px' }}>
                                    ✓ Acknowledged
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#64748b' }}>Unassigned</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${shp.status === 'DELIVERED' ? 'badge-success' : shp.status === 'DISPATCHED' ? 'badge-warning' : 'badge-secondary'}`}>
                              {shp.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openAssignModal(shp)}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <UserCheck size={12} />
                              <span>{shp.assignedWorkerName ? 'Reassign' : 'Assign'}</span>
                            </button>
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
                <div style={{ padding: '16px' }}>
                  {lastFlowResult.augmentingPaths.map((p, idx) => (
                    <div key={idx} style={{ padding: '10px 14px', borderBottom: '1px solid #1e293b', fontSize: '12px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: '700', marginRight: '8px' }}>Iteration #{idx + 1}:</span>
                      <span style={{ color: '#f8fafc' }}>{p.pathDescription}</span>
                      <span className="badge badge-info" style={{ marginLeft: '10px' }}>+{p.bottleneckCapacity} flow</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  Trace log not available for current run.
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
                          <td className="mono-cell" style={{ fontWeight: 700, color: '#f87171' }}>{b.routeCode}</td>
                          <td>{b.fromNode}</td>
                          <td>{b.toNode}</td>
                          <td className="mono-cell">{b.capacity}</td>
                          <td className="mono-cell" style={{ color: '#f87171', fontWeight: 700 }}>
                            {b.flow} (100% Saturated)
                          </td>
                          <td><span className="badge badge-danger">CRITICAL BOTTLENECK</span></td>
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
            Select your target commodity (Food or Water) and triage policy, then click "Run Optimization Algorithm" to solve for maximal humanitarian logistics throughput.
          </p>
          <button className="btn btn-primary" onClick={handleExecute} disabled={loading}>
            <Play size={16} />
            <span>Compute Supply Flow Now</span>
          </button>
        </div>
      )}

      {/* Assign Worker Modal */}
      {assigningShipment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px',
            width: '100%', maxWidth: '480px', padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 14px', color: '#f8fafc', fontSize: '16px' }}>
              Assign Shipment Mission to Field Unit
            </h3>

            <div style={{ backgroundColor: '#1e293b', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
              <div>Shipment: <strong style={{ color: '#38bdf8' }}>{assigningShipment.shipmentCode}</strong></div>
              <div>Route: <strong>{assigningShipment.sourceDepot?.name} → {assigningShipment.destinationPoint?.name}</strong></div>
              <div>Payload: <strong>{assigningShipment.allocatedQuantity} {assigningShipment.supplyType}</strong></div>
            </div>

            <form onSubmit={handleSaveAssignment}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Select Field Worker *
                </label>
                <select
                  required
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                >
                  <option value="">Choose Worker...</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.fullName || w.username} ({w.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Task Priority *
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="CRITICAL">Critical (Immediate dispatch)</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="ROUTINE">Routine</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Deadline Date
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Field Directives & Instructions
                </label>
                <textarea
                  rows={3}
                  value={taskInstructions}
                  onChange={(e) => setTaskInstructions(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setAssigningShipment(null)}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingAssignment} className="btn btn-primary">
                  {submittingAssignment ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
