import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  User,
  FileText,
  ShieldCheck,
  X,
  Filter
} from 'lucide-react';

export default function DeliveryView({
  shipments = [],
  onUpdateShipmentStatus,
  userRole
}) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeModalShipment, setActiveModalShipment] = useState(null);

  // Status update modal form
  const [statusForm, setStatusForm] = useState({
    status: 'DELIVERED',
    deliveredQuantity: '',
    recipientName: '',
    notes: ''
  });

  const [formError, setFormError] = useState('');

  const filteredShipments = shipments.filter((shp) => {
    if (filterStatus === 'ALL') return true;
    return shp.status === filterStatus;
  });

  const openStatusModal = (shp) => {
    setActiveModalShipment(shp);
    setStatusForm({
      status: shp.status === 'PENDING' ? 'DISPATCHED' : 'DELIVERED',
      deliveredQuantity: shp.allocatedQuantity.toString(),
      recipientName: shp.recipientName || '',
      notes: shp.deliveryNotes || ''
    });
    setFormError('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!activeModalShipment) return;

    const delQty = statusForm.deliveredQuantity ? parseFloat(statusForm.deliveredQuantity) : activeModalShipment.allocatedQuantity;

    if (isNaN(delQty) || delQty < 0) {
      setFormError('Delivered quantity cannot be negative.');
      return;
    }

    if (delQty > activeModalShipment.allocatedQuantity) {
      setFormError(`Delivered quantity (${delQty}) cannot exceed allocated quantity (${activeModalShipment.allocatedQuantity}).`);
      return;
    }

    try {
      await onUpdateShipmentStatus(activeModalShipment.id, {
        status: statusForm.status,
        deliveredQuantity: statusForm.status === 'DELIVERED' ? delQty : 0.0,
        recipientName: statusForm.recipientName.trim(),
        notes: statusForm.notes.trim()
      });
      setActiveModalShipment(null);
    } catch (err) {
      setFormError(err.message || 'Failed to transition shipment status.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> DELIVERED</span>;
      case 'DISPATCHED':
        return <span className="badge badge-low"><Truck size={12} /> IN TRANSIT</span>;
      case 'PENDING':
        return <span className="badge badge-medium"><Clock size={12} /> PLANNED</span>;
      case 'DELAYED':
        return <span className="badge badge-critical"><AlertTriangle size={12} /> DELAYED</span>;
      default:
        return <span className="badge badge-secondary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Relief Consignment & Delivery Tracking</h2>
          <p>Monitor dispatched aid trucks, verify delivered quantities at disaster camps, and flag transit bottlenecks or shortages</p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={15} color="var(--text-dim)" />
          <div className="role-pill">
            {['ALL', 'PENDING', 'DISPATCHED', 'DELIVERED', 'DELAYED'].map((st) => (
              <button
                key={st}
                className={`role-btn ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tracking Code</th>
              <th>Resource</th>
              <th>Departure Base</th>
              <th></th>
              <th>Destination Camp</th>
              <th>Allocated</th>
              <th>Received</th>
              <th>Status</th>
              <th>Recipient / Signoff</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  No shipments matching filter. Run Supply Optimization to generate scheduled relief dispatches.
                </td>
              </tr>
            ) : (
              filteredShipments.map((shp) => {
                const isShortage = shp.status === 'DELIVERED' && shp.deliveredQuantity < shp.allocatedQuantity;

                return (
                  <tr key={shp.id}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {shp.shipmentCode}
                    </td>
                    <td>
                      <span className="badge badge-secondary">{shp.supplyType}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{shp.sourceDepotName || 'Depot'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{shp.sourceDepotCode}</div>
                    </td>
                    <td style={{ color: 'var(--text-dim)', textAlign: 'center' }}>
                      <ArrowRight size={14} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{shp.destinationPointName || 'Disaster Zone'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{shp.destinationPointCode}</div>
                    </td>
                    <td className="mono-cell" style={{ fontWeight: 700 }}>
                      {shp.allocatedQuantity}
                    </td>
                    <td className="mono-cell" style={{ fontWeight: 700, color: isShortage ? '#f87171' : '#34d399' }}>
                      {shp.deliveredQuantity || 0}
                      {isShortage && (
                        <span style={{ fontSize: '10px', color: '#f87171', display: 'block' }}>
                          (-{(shp.allocatedQuantity - shp.deliveredQuantity).toFixed(1)} SHORT)
                        </span>
                      )}
                    </td>
                    <td>
                      {getStatusBadge(shp.status)}
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {shp.recipientName ? <ShieldCheck size={13} color="#10b981" /> : <User size={13} color="#94a3b8" />}
                        {shp.recipientName || 'Unassigned'}
                      </div>
                      {shp.deliveryNotes && (
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {shp.deliveryNotes}
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openStatusModal(shp)}
                        title="Update Shipment Status"
                      >
                        <span>Update Status</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Update Shipment Status Modal */}
      {activeModalShipment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                Update Consignment: {activeModalShipment.shipmentCode}
              </h3>
              <button className="modal-close" onClick={() => setActiveModalShipment(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStatusSubmit}>
              <div className="modal-body">
                {formError && <div className="alert-banner alert-danger">{formError}</div>}

                <div style={{ background: '#0d1527', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12.5px' }}>
                  <div><strong>From:</strong> {activeModalShipment.sourceDepotName}</div>
                  <div><strong>To:</strong> {activeModalShipment.destinationPointName}</div>
                  <div><strong>Allocated Load:</strong> {activeModalShipment.allocatedQuantity} units ({activeModalShipment.supplyType})</div>
                  <div><strong>Current Stage:</strong> {activeModalShipment.status}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Next Status Stage *</label>
                  <select
                    className="form-control"
                    value={statusForm.status}
                    onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  >
                    {activeModalShipment.status === 'PENDING' && (
                      <>
                        <option value="DISPATCHED">Dispatch Consignment (In Transit)</option>
                        <option value="DELAYED">Flag as Delayed / Weather Hazard</option>
                        <option value="CANCELLED">Cancel Shipment</option>
                      </>
                    )}
                    {activeModalShipment.status === 'DISPATCHED' && (
                      <>
                        <option value="DELIVERED">Mark Delivered & Verified</option>
                        <option value="DELAYED">Report Transit Delay</option>
                      </>
                    )}
                    {activeModalShipment.status === 'DELAYED' && (
                      <>
                        <option value="DISPATCHED">Resume Transit (Dispatched)</option>
                        <option value="DELIVERED">Delivered at Zone</option>
                        <option value="CANCELLED">Cancel Consignment</option>
                      </>
                    )}
                    {activeModalShipment.status === 'DELIVERED' && (
                      <option value="DELIVERED">Delivered (Completed)</option>
                    )}
                  </select>
                </div>

                {statusForm.status === 'DELIVERED' && (
                  <div className="form-group">
                    <label className="form-label">Actual Quantity Received (units) *</label>
                    <input
                      type="number"
                      min="0"
                      max={activeModalShipment.allocatedQuantity}
                      step="any"
                      className="form-control"
                      value={statusForm.deliveredQuantity}
                      onChange={(e) => setStatusForm({ ...statusForm, deliveredQuantity: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      If less than {activeModalShipment.allocatedQuantity}, a shortage alert will be recorded.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Recipient Officer / Zone Coordinator Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={statusForm.recipientName}
                    onChange={(e) => setStatusForm({ ...statusForm, recipientName: e.target.value })}
                    placeholder="e.g. Smt. Leela Krishnan, Relief Camp Lead"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Verification Log / Road Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                    placeholder="Enter truck plate, weather remarks, or handover details..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveModalShipment(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save & Update Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
