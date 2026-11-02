import React, { useState, useEffect } from 'react';
import {
  Truck, CheckCircle2, Clock, AlertTriangle, FileText, Send, MapPin,
  Calendar, Check, ShieldAlert, AlertCircle, RefreshCw, Navigation
} from 'lucide-react';
import { api, authStorage } from '../services/api';

export default function WorkerDashboardView({ currentUser, showAlert }) {
  const [tasks, setTasks] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeModalShipment, setActiveModalShipment] = useState(null);

  // Delivery report form state
  const [deliveredQuantity, setDeliveredQuantity] = useState('');
  const [damagedQuantity, setDamagedQuantity] = useState('0');
  const [returnedQuantity, setReturnedQuantity] = useState('0');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientRole, setRecipientRole] = useState('Camp Coordinator');
  const [gpsLatitude, setGpsLatitude] = useState('');
  const [gpsLongitude, setGpsLongitude] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchWorkerData = async () => {
    setLoading(true);
    try {
      const [shipmentsData, instructionsData] = await Promise.all([
        api.getShipments(null, currentUser?.id || null).catch(() => []),
        api.getInstructions().catch(() => [])
      ]);
      setTasks(shipmentsData || []);
      setInstructions(instructionsData || []);
    } catch (err) {
      console.error('Failed to load worker data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkerData();
  }, [currentUser]);

  const handleAcknowledge = async (shipmentId) => {
    try {
      await api.acknowledgeShipment(shipmentId);
      showAlert(`Task #${shipmentId} acknowledged. Safe travels!`, 'success');
      await fetchWorkerData();
    } catch (err) {
      showAlert(err.message || 'Failed to acknowledge task', 'danger');
    }
  };

  const handleUpdateStatus = async (shipmentId, status) => {
    try {
      await api.updateShipmentStatus(shipmentId, { status });
      showAlert(`Shipment status updated to ${status}.`, 'info');
      await fetchWorkerData();
    } catch (err) {
      showAlert(err.message || 'Failed to update status', 'danger');
    }
  };

  const openReportModal = (shipment) => {
    setActiveModalShipment(shipment);
    setDeliveredQuantity(shipment.allocatedQuantity || '');
    setDamagedQuantity('0');
    setReturnedQuantity('0');
    setRecipientName('');
    setRecipientPhone('');
    setRecipientRole('Zone Coordinator');
    setNotes('');

    // Pre-populate GPS from destination if available
    if (shipment.destinationPoint) {
      setGpsLatitude(shipment.destinationPoint.latitude || '');
      setGpsLongitude(shipment.destinationPoint.longitude || '');
    } else {
      setGpsLatitude('');
      setGpsLongitude('');
    }
  };

  const handleGeolocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLatitude(pos.coords.latitude.toFixed(5));
          setGpsLongitude(pos.coords.longitude.toFixed(5));
          showAlert('GPS coordinates acquired from device sensors', 'info');
        },
        () => {
          showAlert('Could not detect device GPS. Please type coordinates manually.', 'warning');
        }
      );
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!activeModalShipment) return;
    setSubmittingReport(true);

    try {
      const payload = {
        shipmentId: activeModalShipment.id,
        deliveredQuantity: parseFloat(deliveredQuantity) || 0,
        damagedQuantity: parseFloat(damagedQuantity) || 0,
        returnedQuantity: parseFloat(returnedQuantity) || 0,
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientRole: recipientRole.trim(),
        gpsLatitude: parseFloat(gpsLatitude) || null,
        gpsLongitude: parseFloat(gpsLongitude) || null,
        notes: notes.trim()
      };

      await api.createDeliveryReport(payload);
      showAlert(`Delivery Report submitted for Shipment #${activeModalShipment.id}! Awaiting Commander Approval.`, 'success');
      setActiveModalShipment(null);
      await fetchWorkerData();
    } catch (err) {
      showAlert(err.message || 'Failed to submit delivery report', 'danger');
    } finally {
      setSubmittingReport(false);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'URGENT':
      case 'CRITICAL':
        return 'badge-danger';
      case 'HIGH':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="view-container">
      {/* Worker Header Card */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Field Operations Console</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Logged in as: <strong style={{ color: '#38bdf8' }}>{currentUser?.fullName || currentUser?.username}</strong> ({currentUser?.role})
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchWorkerData} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Tasks</span>
        </button>
      </div>

      {/* Grid: Instructions & Tasks */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '16px' }}>
        {/* Left Column: Assigned Tasks */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="#38bdf8" />
              <h3 style={{ margin: 0, fontSize: '15px' }}>My Assigned Deliveries</h3>
            </div>
            <span className="badge badge-info">{tasks.length} active tasks</span>
          </div>

          <div style={{ padding: '16px' }}>
            {tasks.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 12px', color: '#10b981' }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>No pending delivery missions assigned.</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Stand by for dispatches from the Emergency Operations Center.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: '#1e293b'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '700', fontSize: '14px', color: '#f8fafc' }}>
                            {task.shipmentCode || `SHP-${task.id}`}
                          </span>
                          <span className={`badge ${task.status === 'DELIVERED' ? 'badge-success' : task.status === 'DISPATCHED' ? 'badge-warning' : 'badge-info'}`}>
                            {task.status}
                          </span>
                          {task.taskPriority && (
                            <span className={`badge ${getPriorityBadgeClass(task.taskPriority)}`}>
                              {task.taskPriority}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                          Payload: <strong style={{ color: '#f8fafc' }}>{task.allocatedQuantity} {task.supplyType}</strong>
                        </div>
                      </div>

                      {/* Acknowledge or Report Actions */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!task.workerAcknowledged ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAcknowledge(task.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={14} />
                            <span>Acknowledge Mission</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={13} />
                            Mission Acknowledged
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Routing info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      backgroundColor: '#0f172a',
                      padding: '10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      marginBottom: '10px'
                    }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>ORIGIN DEPOT</span>
                        <strong style={{ color: '#38bdf8' }}>{task.sourceDepot?.name || 'Central Relief Hub'}</strong>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>{task.sourceDepot?.address || 'Sector 1'}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>DESTINATION ZONE</span>
                        <strong style={{ color: '#f87171' }}>{task.destinationPoint?.name || 'Affected Location'}</strong>
                        <div style={{ color: '#94a3b8', fontSize: '11px' }}>{task.destinationPoint?.address || 'Disaster Sector'}</div>
                      </div>
                    </div>

                    {/* Mission Directives */}
                    {task.taskInstructions && (
                      <div style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.08)',
                        borderLeft: '3px solid #38bdf8',
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#cbd5e1',
                        marginBottom: '10px'
                      }}>
                        <strong>Directives:</strong> {task.taskInstructions}
                      </div>
                    )}

                    {/* Progress Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #334155' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {task.status === 'PENDING' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleUpdateStatus(task.id, 'DISPATCHED')}
                          >
                            <Truck size={14} style={{ marginRight: '4px' }} />
                            Depart Depot (Dispatched)
                          </button>
                        )}
                        {task.status === 'DISPATCHED' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openReportModal(task)}
                          >
                            <FileText size={14} style={{ marginRight: '4px' }} />
                            Submit Delivery Report
                          </button>
                        )}
                        {task.status === 'DELIVERED' && (
                          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                            ✓ Delivery Finished & Reconciled
                          </span>
                        )}
                      </div>

                      {task.deadline && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} />
                          Deadline: {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Emergency Directives & Safety Protocols */}
        <div>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#ef4444" />
              <h3 style={{ margin: 0, fontSize: '15px' }}>Official Directives</h3>
            </div>
            <div style={{ padding: '16px' }}>
              {instructions.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  No active general broadcast directives.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {instructions.map((inst) => (
                    <div
                      key={inst.id}
                      style={{
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: '#1e293b',
                        borderLeft: `3px solid ${inst.priority === 'URGENT' ? '#ef4444' : '#38bdf8'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#f8fafc' }}>
                          {inst.title}
                        </span>
                        <span className={`badge ${inst.priority === 'URGENT' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '10px' }}>
                          {inst.priority}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#cbd5e1', lineHeight: '1.4' }}>
                        {inst.content}
                      </p>
                      <div style={{ marginTop: '8px', fontSize: '10px', color: '#64748b' }}>
                        Issued by: {inst.authorName || 'Commander'} • {inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : 'Active'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Report Modal */}
      {activeModalShipment && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc' }}>
                  Submit Field Delivery Report
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Shipment {activeModalShipment.shipmentCode || `#${activeModalShipment.id}`} to {activeModalShipment.destinationPoint?.name}
                </p>
              </div>
              <button
                onClick={() => setActiveModalShipment(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              {/* Quantities breakdown */}
              <div style={{
                backgroundColor: '#1e293b',
                padding: '14px',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600', marginBottom: '8px' }}>
                  QUANTITY RECONCILIATION ({activeModalShipment.supplyType})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Delivered (Units) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      min="0"
                      max={activeModalShipment.allocatedQuantity}
                      value={deliveredQuantity}
                      onChange={(e) => setDeliveredQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Damaged / Lost
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={damagedQuantity}
                      onChange={(e) => setDamagedQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                      Returned to Depot
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={returnedQuantity}
                      onChange={(e) => setReturnedQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Allocated: <strong>{activeModalShipment.allocatedQuantity}</strong> units.
                </div>
              </div>

              {/* Recipient Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Recipient Sign-off Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Officer Suresh Kumar"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Recipient Phone
                  </label>
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* GPS Coordinates */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', color: '#cbd5e1' }}>
                    Delivery Site GPS Geolocation
                  </label>
                  <button
                    type="button"
                    onClick={handleGeolocate}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Navigation size={12} />
                    Fetch Device GPS
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.0001"
                    value={gpsLatitude}
                    onChange={(e) => setGpsLatitude(e.target.value)}
                    placeholder="Latitude (e.g. 28.6139)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={gpsLongitude}
                    onChange={(e) => setGpsLongitude(e.target.value)}
                    placeholder="Longitude (e.g. 77.2090)"
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Field Notes */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Delivery Observations & Incident Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record road washouts, distribution crowd status, or condition of delivered goods..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveModalShipment(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={14} />
                  <span>{submittingReport ? 'Submitting...' : 'Submit to Commander'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
