import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck, CheckCircle2, XCircle, RotateCcw, AlertTriangle,
  Clock, MapPin, User, FileText, Check, ShieldAlert, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function DeliveryApprovalView({ showAlert }) {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeReviewReport, setActiveReviewReport] = useState(null);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // 'APPROVE' | 'REJECT' | 'NEEDS_CORRECTION'
  const [reviewNotes, setReviewNotes] = useState('');
  const [approvedQuantity, setApprovedQuantity] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getDeliveryReports(statusFilter || null);
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load delivery reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const openReviewModal = (report, action) => {
    setActiveReviewReport(report);
    setReviewAction(action);
    setApprovedQuantity(report.deliveredQuantity || report.allocatedQuantity || '');
    setReviewNotes(action === 'APPROVE' ? 'Delivery verified against distribution point receipts and GPS log.' : '');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeReviewReport) return;
    setSubmittingReview(true);

    try {
      const payload = {
        action: reviewAction,
        reviewNotes: reviewNotes.trim(),
        approvedQuantity: parseFloat(approvedQuantity) || activeReviewReport.deliveredQuantity
      };

      await api.reviewDeliveryReport(activeReviewReport.id, payload);
      const actionLabel = reviewAction === 'APPROVE' ? 'Approved & Reconciled' : reviewAction === 'REJECT' ? 'Rejected' : 'Returned for Correction';
      showAlert(`Report #${activeReviewReport.id} ${actionLabel}. Inventory ledger updated automatically.`, 'success');
      setActiveReviewReport(null);
      await fetchReports();
    } catch (err) {
      showAlert(err.message || 'Failed to review delivery report', 'danger');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <span className="badge badge-warning">Awaiting Approval</span>;
      case 'APPROVED':
        return <span className="badge badge-success">Approved & Reconciled</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      case 'NEEDS_CORRECTION':
        return <span className="badge badge-info">Needs Correction</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Delivery Reconciliation & Verification</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Review field submissions, cross-verify GPS & recipient receipts, and execute automated two-tier inventory reconciliation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '12px'
            }}
          >
            <option value="">All Verification Statuses</option>
            <option value="PENDING_APPROVAL">Pending Commander Review</option>
            <option value="APPROVED">Approved & Reconciled</option>
            <option value="REJECTED">Rejected</option>
            <option value="NEEDS_CORRECTION">Returned for Correction</option>
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchReports} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Shipment & Zone</th>
                <th>Worker</th>
                <th>Allocated</th>
                <th>Delivered</th>
                <th>Damaged/Returned</th>
                <th>Recipient Sign-off</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No delivery reports found for selected filter.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id}>
                    <td><strong style={{ color: '#38bdf8' }}>#{r.id}</strong></td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#f8fafc' }}>
                        {r.shipmentCode || `SHP-${r.shipmentId}`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {r.destinationPointName || 'Affected Zone'} ({r.supplyType})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: '500' }}>{r.workerName || 'Field Unit'}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>
                    <td><strong>{r.allocatedQuantity}</strong></td>
                    <td>
                      <strong style={{ color: r.deliveredQuantity < r.allocatedQuantity ? '#f59e0b' : '#10b981' }}>
                        {r.deliveredQuantity}
                      </strong>
                    </td>
                    <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {r.damagedQuantity > 0 && <span style={{ color: '#ef4444' }}>Damaged: {r.damagedQuantity} </span>}
                      {r.returnedQuantity > 0 && <span style={{ color: '#38bdf8' }}>Returned: {r.returnedQuantity}</span>}
                      {r.damagedQuantity === 0 && r.returnedQuantity === 0 && <span>0</span>}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{r.recipientName || 'N/A'}</div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {r.recipientRole || ''} {r.recipientPhone ? `• ${r.recipientPhone}` : ''}
                      </div>
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>
                      {r.status === 'PENDING_APPROVAL' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openReviewModal(r, 'APPROVE')}
                            title="Verify and Approve"
                          >
                            <CheckCircle2 size={13} style={{ marginRight: '3px' }} />
                            Approve
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => openReviewModal(r, 'REJECT')}
                            title="Reject"
                          >
                            <XCircle size={13} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openReviewModal(r, 'NEEDS_CORRECTION')}
                            title="Request Correction"
                          >
                            <RotateCcw size={13} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Reviewed by {r.reviewedBy || 'Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {activeReviewReport && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px',
            width: '100%', maxWidth: '520px', padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 12px', color: '#f8fafc', fontSize: '16px' }}>
              {reviewAction === 'APPROVE' ? 'Verify & Approve Delivery' : reviewAction === 'REJECT' ? 'Reject Delivery Report' : 'Request Report Correction'}
            </h3>

            {/* Summary card */}
            <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Shipment:</span>
                <strong style={{ color: '#f8fafc' }}>{activeReviewReport.shipmentCode || `#${activeReviewReport.shipmentId}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Destination Zone:</span>
                <strong style={{ color: '#38bdf8' }}>{activeReviewReport.destinationPointName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Allocated Supply:</span>
                <span>{activeReviewReport.allocatedQuantity} {activeReviewReport.supplyType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Worker Reported:</span>
                <strong style={{ color: '#10b981' }}>{activeReviewReport.deliveredQuantity} delivered</strong>
              </div>
              {activeReviewReport.gpsLatitude && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Delivery GPS:</span>
                  <span style={{ color: '#cbd5e1' }}>{activeReviewReport.gpsLatitude.toFixed(4)}, {activeReviewReport.gpsLongitude?.toFixed(4)}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleReviewSubmit}>
              {reviewAction === 'APPROVE' && (
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Confirmed Approved Quantity ({activeReviewReport.supplyType})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={approvedQuantity}
                    onChange={(e) => setApprovedQuantity(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '3px' }}>
                    Approving triggers automated ledger reconciliation, marks stock as DELIVERED, and updates zone fulfilled demand.
                  </span>
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Verification / Commander Notes
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter audit remarks or feedback for field operator..."
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveReviewReport(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`btn ${reviewAction === 'APPROVE' ? 'btn-primary' : reviewAction === 'REJECT' ? 'btn-danger' : 'btn-secondary'}`}
                >
                  {submittingReview ? 'Processing...' : reviewAction === 'APPROVE' ? 'Confirm & Reconcile' : reviewAction === 'REJECT' ? 'Confirm Rejection' : 'Send Correction Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
