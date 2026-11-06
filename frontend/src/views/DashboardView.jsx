import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  Zap,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Droplets,
  HeartPulse,
  Utensils,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  X,
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck
} from 'lucide-react';
import ReliefMap from '../components/ReliefMap';
import { api } from '../services/api';

export default function DashboardView({
  stats,
  depots = [],
  distributionPoints = [],
  routes = [],
  recentShipments = [],
  onNavigateToOptimization,
  onNavigateToDeliveries,
  currentUser,
  showAlert,
  onOpenLogin,
}) {
  const foodInv = stats?.totalInventoryByType?.FOOD || 0;
  const waterInv = stats?.totalInventoryByType?.WATER || 0;
  const medInv = stats?.totalInventoryByType?.MEDICINE || 0;

  const foodDemand = stats?.totalDemandByType?.FOOD || 0;
  const waterDemand = stats?.totalDemandByType?.WATER || 0;
  const medDemand = stats?.totalDemandByType?.MEDICINE || 0;

  const totalDemand = stats?.totalDemand || (foodDemand + waterDemand + medDemand);
  const totalAllocated = stats?.totalAllocated || 0;
  const satisfactionRate = stats?.overallSatisfactionRate || 
    (totalDemand > 0 ? ((totalAllocated / totalDemand) * 100).toFixed(1) : 0);

  // Worker Management state
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [workerActionId, setWorkerActionId] = useState(null);
  const [selectedWorkerDetails, setSelectedWorkerDetails] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const isAdmin = currentUser?.role === 'ADMIN';

  const fetchWorkers = async () => {
    if (!isAdmin) return;
    setLoadingWorkers(true);
    try {
      const data = await api.getWorkers();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load workers:', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchWorkers();
    } else {
      setWorkers([]);
    }
  }, [currentUser]);

  const handleApprove = async (workerId) => {
    setWorkerActionId(workerId);
    try {
      await api.approveWorker(workerId);
      if (showAlert) showAlert('Worker account approved successfully.', 'success');
      await fetchWorkers();
      if (selectedWorkerDetails && selectedWorkerDetails.id === workerId) {
        setSelectedWorkerDetails((prev) => ({ ...prev, approvalStatus: 'APPROVED' }));
      }
    } catch (err) {
      if (showAlert) showAlert(err.message || 'Failed to approve worker', 'danger');
    } finally {
      setWorkerActionId(null);
    }
  };

  const handleReject = async (workerId) => {
    setWorkerActionId(workerId);
    try {
      await api.rejectWorker(workerId);
      if (showAlert) showAlert('Worker registration rejected.', 'info');
      await fetchWorkers();
      if (selectedWorkerDetails && selectedWorkerDetails.id === workerId) {
        setSelectedWorkerDetails((prev) => ({ ...prev, approvalStatus: 'REJECTED' }));
      }
    } catch (err) {
      if (showAlert) showAlert(err.message || 'Failed to reject worker', 'danger');
    } finally {
      setWorkerActionId(null);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    if (statusFilter === 'ALL') return true;
    return (w.approvalStatus || 'APPROVED') === statusFilter;
  });

  const pendingCount = workers.filter((w) => (w.approvalStatus || 'APPROVED') === 'PENDING').length;
  const approvedCount = workers.filter((w) => (w.approvalStatus || 'APPROVED') === 'APPROVED').length;
  const rejectedCount = workers.filter((w) => (w.approvalStatus || 'APPROVED') === 'REJECTED').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Disaster Emergency Operations Center (EOC)</h2>
          <p>Real-time relief supply distribution tracking & network flow bottleneck optimization</p>
        </div>

        <button
          className="btn btn-primary btn-lg"
          onClick={onNavigateToOptimization}
        >
          <Zap size={18} />
          <span>Run Supply Optimization</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card cyan">
          <div className="kpi-top">
            <span className="kpi-label">Central Depots</span>
            <div className="kpi-icon-wrap"><Warehouse size={18} /></div>
          </div>
          <div className="kpi-value">{stats?.totalDepots || depots.length}</div>
          <div className="kpi-subtext">
            <span>{stats?.lowStockDepots || 0} low stock alert</span>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-top">
            <span className="kpi-label">Affected Zones</span>
            <div className="kpi-icon-wrap"><MapPin size={18} /></div>
          </div>
          <div className="kpi-value">{stats?.totalDistributionPoints || distributionPoints.length}</div>
          <div className="kpi-subtext">
            <span style={{ color: '#f87171' }}>
              {stats?.criticalDistributionPoints || distributionPoints.filter(d => d.severity === 'CRITICAL').length} Critical Priority
            </span>
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-top">
            <span className="kpi-label">Total Supplies Stocked</span>
            <div className="kpi-icon-wrap"><Package size={18} /></div>
          </div>
          <div className="kpi-value">
            {((foodInv + waterInv + medInv) || 0).toLocaleString()} <span style={{ fontSize: '14px', color: '#94a3b8' }}>units</span>
          </div>
          <div className="kpi-subtext">
            <span>{foodInv}kg Food • {waterInv}L Water • {medInv} Meds</span>
          </div>
        </div>

        <div className="kpi-card blue">
          <div className="kpi-top">
            <span className="kpi-label">Pending Deliveries</span>
            <div className="kpi-icon-wrap"><Truck size={18} /></div>
          </div>
          <div className="kpi-value">{stats?.pendingShipments || 0}</div>
          <div className="kpi-subtext">
            <span>{stats?.dispatchedShipments || 0} currently in transit</span>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-top">
            <span className="kpi-label">Completed Deliveries</span>
            <div className="kpi-icon-wrap"><CheckCircle2 size={18} /></div>
          </div>
          <div className="kpi-value">{stats?.deliveredShipments || 0}</div>
          <div className="kpi-subtext">
            <span style={{ color: '#34d399' }}>{satisfactionRate}% Fulfillment</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Supply Demand Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Map */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <MapPin size={17} color="#38bdf8" />
                Live Humanitarian Supply Logistics Map
              </h3>
              <p className="card-subtitle">
                Interactive topology showing central depots, emergency zones, and transit route capacities
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px' }}>
              <span className="badge badge-secondary" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="dot dot-blue"></span> Depots
              </span>
              <span className="badge badge-critical" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="dot dot-red"></span> Critical Zones
              </span>
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="dot dot-green"></span> Active Corridors
              </span>
            </div>
          </div>

          <ReliefMap
            depots={depots}
            distributionPoints={distributionPoints}
            routes={routes}
          />
        </div>

        {/* Right: Supply vs Demand Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <TrendingUp size={17} color="#f59e0b" />
                Supply vs. Demand Overview
              </h3>
              <p className="card-subtitle">Aggregated metrics by essential relief resource</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Food */}
            <div style={{ background: '#0d1527', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Utensils size={15} color="#f97316" /> Rations & Food Packs
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                  <strong>{foodInv} kg</strong> / {foodDemand} kg demanded
                </span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-amber"
                  style={{ width: `${foodDemand > 0 ? Math.min(100, (foodInv / foodDemand) * 100) : 0}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>Availability: {foodDemand > 0 ? ((foodInv / foodDemand) * 100).toFixed(0) : 0}%</span>
                <span>Unmet: {Math.max(0, foodDemand - foodInv)} kg</span>
              </div>
            </div>

            {/* Water */}
            <div style={{ background: '#0d1527', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplets size={15} color="#06b6d4" /> Potable Clean Water
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                  <strong>{waterInv} L</strong> / {waterDemand} L demanded
                </span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-blue"
                  style={{ width: `${waterDemand > 0 ? Math.min(100, (waterInv / waterDemand) * 100) : 0}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>Availability: {waterDemand > 0 ? ((waterInv / waterDemand) * 100).toFixed(0) : 0}%</span>
                <span>Unmet: {Math.max(0, waterDemand - waterInv)} L</span>
              </div>
            </div>

            {/* Medicine */}
            <div style={{ background: '#0d1527', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HeartPulse size={15} color="#ef4444" /> Medical Aid Kits
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12.5px' }}>
                  <strong>{medInv} Kits</strong> / {medDemand} Kits demanded
                </span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill fill-red"
                  style={{ width: `${medDemand > 0 ? Math.min(100, (medInv / medDemand) * 100) : 0}%` }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-dim)' }}>
                <span>Availability: {medDemand > 0 ? ((medInv / medDemand) * 100).toFixed(0) : 0}%</span>
                <span>Unmet: {Math.max(0, medDemand - medInv)} Kits</span>
              </div>
            </div>

            {/* Quick Algorithm Recommendation Box */}
            <div style={{
              background: 'rgba(37, 99, 235, 0.08)',
              border: '1px dashed rgba(59, 130, 246, 0.4)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#93c5fd'
            }}>
              <strong>💡 Max-Flow Principle:</strong> Edmonds-Karp uses BFS to discover augmenting paths with $O(V \cdot E^2)$ runtime complexity, guaranteeing the theoretical upper bound on relief throughput across capacitated roads.
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Worker Registration Requests (Admin Dashboard Worker Management) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Users size={17} color="#10b981" />
              Worker Registration Requests
            </h3>
            <p className="card-subtitle">
              Review and authorize self-registered field worker accounts before granting operations access
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAdmin && (
              <>
                {pendingCount > 0 && (
                  <span
                    className="badge badge-medium"
                    style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                  >
                    {pendingCount} Pending Approval
                  </span>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={fetchWorkers}
                  disabled={loadingWorkers}
                  title="Refresh registration requests"
                >
                  <RefreshCw size={13} className={loadingWorkers ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
              </>
            )}
          </div>
        </div>

        {!isAdmin ? (
          <div style={{ padding: '32px 24px', textAlign: 'center', backgroundColor: '#0d1527', borderRadius: '8px' }}>
            <ShieldAlert size={36} style={{ color: '#f59e0b', marginBottom: '12px' }} />
            <h4 style={{ margin: '0 0 6px', fontSize: '15px', color: '#f8fafc' }}>
              Administrator Authorization Required
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#94a3b8', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
              Only authorized Central Command Administrators can review, approve, or reject field worker self-registration requests.
            </p>
            {onOpenLogin && (
              <button className="btn btn-primary btn-sm" onClick={onOpenLogin}>
                <ShieldCheck size={14} />
                <span>Sign In as Admin</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <button
                className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All Workers ({workers.length})
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('PENDING')}
                style={statusFilter === 'PENDING' ? { backgroundColor: '#d97706', borderColor: '#d97706' } : {}}
              >
                Pending ({pendingCount})
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('APPROVED')}
                style={statusFilter === 'APPROVED' ? { backgroundColor: '#059669', borderColor: '#059669' } : {}}
              >
                Approved ({approvedCount})
              </button>
              <button
                className={`btn btn-sm ${statusFilter === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setStatusFilter('REJECTED')}
                style={statusFilter === 'REJECTED' ? { backgroundColor: '#dc2626', borderColor: '#dc2626' } : {}}
              >
                Rejected ({rejectedCount})
              </button>
            </div>

            {loadingWorkers ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                <RefreshCw size={20} className="spin" style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0 }}>Loading worker registration requests...</p>
              </div>
            ) : filteredWorkers.length > 0 ? (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Registration Date</th>
                      <th>Account Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.map((worker) => {
                      const status = worker.approvalStatus || 'APPROVED';
                      const isPending = status === 'PENDING';
                      const isApproved = status === 'APPROVED';
                      const isRejected = status === 'REJECTED';
                      const isActionLoading = workerActionId === worker.id;

                      const formattedDate = worker.createdAt
                        ? new Date(worker.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Pre-existing';

                      return (
                        <tr key={worker.id}>
                          <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: isApproved
                                    ? 'rgba(16, 185, 129, 0.2)'
                                    : isPending
                                    ? 'rgba(245, 158, 11, 0.2)'
                                    : 'rgba(239, 68, 68, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: isApproved ? '#34d399' : isPending ? '#fbbf24' : '#f87171',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}
                              >
                                {worker.fullName ? worker.fullName.charAt(0).toUpperCase() : 'W'}
                              </div>
                              <span>{worker.fullName || 'Relief Worker'}</span>
                            </div>
                          </td>
                          <td className="mono-cell" style={{ color: '#38bdf8' }}>
                            {worker.username}
                          </td>
                          <td style={{ color: '#cbd5e1' }}>{worker.email}</td>
                          <td style={{ color: '#94a3b8', fontSize: '12px' }}>
                            {formattedDate}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                isApproved
                                  ? 'badge-success'
                                  : isPending
                                  ? 'badge-medium'
                                  : 'badge-critical'
                              }`}
                              style={
                                isPending
                                  ? { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' }
                                  : isApproved
                                  ? { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }
                                  : { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' }
                              }
                            >
                              {status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              {/* APPROVE Action */}
                              <button
                                className="btn btn-sm"
                                onClick={() => handleApprove(worker.id)}
                                disabled={isApproved || isActionLoading}
                                title={isApproved ? 'Already Approved' : 'Approve worker account'}
                                style={{
                                  backgroundColor: isApproved ? '#1e293b' : '#059669',
                                  color: isApproved ? '#64748b' : '#ffffff',
                                  borderColor: isApproved ? '#334155' : '#047857',
                                  cursor: isApproved || isActionLoading ? 'not-allowed' : 'pointer',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <CheckCircle size={12} />
                                <span>{isActionLoading ? 'Saving...' : 'APPROVE'}</span>
                              </button>

                              {/* REJECT Action */}
                              <button
                                className="btn btn-sm"
                                onClick={() => handleReject(worker.id)}
                                disabled={isRejected || isActionLoading}
                                title={isRejected ? 'Already Rejected' : 'Reject worker account'}
                                style={{
                                  backgroundColor: isRejected ? '#1e293b' : '#dc2626',
                                  color: isRejected ? '#64748b' : '#ffffff',
                                  borderColor: isRejected ? '#334155' : '#b91c1c',
                                  cursor: isRejected || isActionLoading ? 'not-allowed' : 'pointer',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <XCircle size={12} />
                                <span>{isActionLoading ? 'Saving...' : 'REJECT'}</span>
                              </button>

                              {/* VIEW DETAILS Action */}
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedWorkerDetails(worker)}
                                title="View registration details"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Eye size={12} />
                                <span>VIEW DETAILS</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                <p>No worker registration requests found in this filter.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIEW DETAILS Modal */}
      {selectedWorkerDetails && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 11, 24, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedWorkerDetails(null);
          }}
        >
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #1e293b',
                backgroundColor: '#131e36',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc', fontWeight: 700 }}>
                  Worker Registration Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkerDetails(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Full Name
                  </span>
                  <strong style={{ fontSize: '14px', color: '#f8fafc' }}>
                    {selectedWorkerDetails.fullName || 'N/A'}
                  </strong>
                </div>

                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Username
                  </span>
                  <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    {selectedWorkerDetails.username}
                  </span>
                </div>

                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Email Address
                  </span>
                  <span style={{ fontSize: '13px', color: '#f8fafc' }}>
                    {selectedWorkerDetails.email}
                  </span>
                </div>

                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Registration Date
                  </span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    {selectedWorkerDetails.createdAt
                      ? new Date(selectedWorkerDetails.createdAt).toLocaleString()
                      : 'Pre-existing Record'}
                  </span>
                </div>

                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Account Status
                  </span>
                  <span
                    className={`badge ${
                      (selectedWorkerDetails.approvalStatus || 'APPROVED') === 'APPROVED'
                        ? 'badge-success'
                        : (selectedWorkerDetails.approvalStatus || 'APPROVED') === 'PENDING'
                        ? 'badge-medium'
                        : 'badge-critical'
                    }`}
                  >
                    {selectedWorkerDetails.approvalStatus || 'APPROVED'}
                  </span>
                </div>

                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Assigned Role
                  </span>
                  <span style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 600 }}>
                    {selectedWorkerDetails.role || 'WORKER'}
                  </span>
                </div>

                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Contact Phone
                  </span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    {selectedWorkerDetails.phone || 'Not provided'}
                  </span>
                </div>
              </div>

              {/* Action Buttons inside Details Modal */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid #1e293b'
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedWorkerDetails(null)}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleReject(selectedWorkerDetails.id)}
                  disabled={(selectedWorkerDetails.approvalStatus || 'APPROVED') === 'REJECTED' || workerActionId === selectedWorkerDetails.id}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <XCircle size={14} />
                  <span>Reject Account</span>
                </button>

                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => handleApprove(selectedWorkerDetails.id)}
                  disabled={(selectedWorkerDetails.approvalStatus || 'APPROVED') === 'APPROVED' || workerActionId === selectedWorkerDetails.id}
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <CheckCircle size={14} />
                  <span>Approve Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity / Dispatched Shipments Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Truck size={17} color="#10b981" />
              Active Relief Consignments & Dispatches
            </h3>
            <p className="card-subtitle">Real-time status updates of shipments in transit</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onNavigateToDeliveries}
          >
            <span>View All Shipments</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recentShipments && recentShipments.length > 0 ? (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Shipment Code</th>
                  <th>Supply Type</th>
                  <th>Origin Depot</th>
                  <th>Destination Zone</th>
                  <th>Allocated Qty</th>
                  <th>Delivered Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentShipments.slice(0, 5).map((shp) => (
                  <tr key={shp.id}>
                    <td className="mono-cell" style={{ fontWeight: 600, color: '#38bdf8' }}>
                      {shp.shipmentCode}
                    </td>
                    <td>
                      <span className="badge badge-secondary">{shp.supplyType}</span>
                    </td>
                    <td>{shp.sourceDepotName || 'Depot'}</td>
                    <td>{shp.destinationPointName || 'Disaster Zone'}</td>
                    <td className="mono-cell" style={{ fontWeight: 600 }}>
                      {shp.allocatedQuantity}
                    </td>
                    <td className="mono-cell">
                      {shp.deliveredQuantity || 0}
                    </td>
                    <td>
                      <span className={`badge ${
                        shp.status === 'DELIVERED' ? 'badge-success' :
                        shp.status === 'DISPATCHED' ? 'badge-low' :
                        shp.status === 'PENDING' ? 'badge-medium' : 'badge-critical'
                      }`}>
                        {shp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <p>No shipments generated yet. Click "Run Supply Optimization" to calculate allocations and dispatch relief consignments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
