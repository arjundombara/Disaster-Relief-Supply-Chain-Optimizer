import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Users,
  Utensils,
  Droplets,
  HeartPulse,
  X
} from 'lucide-react';

export default function DistributionPointView({
  distributionPoints = [],
  onCreateDP,
  onUpdateDP,
  onDeleteDP,
  userRole
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDP, setEditingDP] = useState(null);
  const [deleteConfirmDP, setDeleteConfirmDP] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    latitude: '',
    longitude: '',
    address: '',
    contactPerson: '',
    phone: '',
    severity: 'HIGH',
    priorityScore: 4,
    affectedPopulation: '',
    foodDemand: '',
    waterDemand: '',
    medicineDemand: '',
    status: 'ACTIVE'
  });

  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setFormData({
      code: `ZONE-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      latitude: '20.2961',
      longitude: '85.8245',
      address: '',
      contactPerson: '',
      phone: '',
      severity: 'CRITICAL',
      priorityScore: 5,
      affectedPopulation: '5000',
      foodDemand: '100',
      waterDemand: '250',
      medicineDemand: '30',
      status: 'ACTIVE'
    });
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (dp) => {
    setEditingDP(dp);
    setFormData({
      code: dp.code,
      name: dp.name,
      latitude: dp.latitude.toString(),
      longitude: dp.longitude.toString(),
      address: dp.address || '',
      contactPerson: dp.contactPerson || '',
      phone: dp.phone || '',
      severity: dp.severity || 'HIGH',
      priorityScore: dp.priorityScore || 4,
      affectedPopulation: dp.affectedPopulation?.toString() || '0',
      foodDemand: dp.foodDemand?.toString() || '0',
      waterDemand: dp.waterDemand?.toString() || '0',
      medicineDemand: dp.medicineDemand?.toString() || '0',
      status: dp.status || 'ACTIVE'
    });
    setFormError('');
  };

  const handleSaveDP = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.code || !formData.name) {
      setFormError('Please fill in required fields (Code, Name).');
      return;
    }

    const payload = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      latitude: parseFloat(formData.latitude) || 0.0,
      longitude: parseFloat(formData.longitude) || 0.0,
      address: formData.address.trim(),
      contactPerson: formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      severity: formData.severity,
      priorityScore: parseInt(formData.priorityScore) || 3,
      affectedPopulation: parseInt(formData.affectedPopulation) || 0,
      foodDemand: parseFloat(formData.foodDemand) || 0.0,
      waterDemand: parseFloat(formData.waterDemand) || 0.0,
      medicineDemand: parseFloat(formData.medicineDemand) || 0.0,
      shelterDemand: 0.0,
      status: formData.status
    };

    if (payload.affectedPopulation < 0 || payload.foodDemand < 0 || payload.waterDemand < 0 || payload.medicineDemand < 0) {
      setFormError('Population and demand quantities cannot be negative.');
      return;
    }

    try {
      if (editingDP) {
        await onUpdateDP(editingDP.id, payload);
        setEditingDP(null);
      } else {
        await onCreateDP(payload);
        setShowAddModal(false);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save distribution point');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDP) return;
    try {
      await onDeleteDP(deleteConfirmDP.id);
      setDeleteConfirmDP(null);
    } catch (err) {
      alert(err.message || 'Failed to delete distribution point');
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'badge-critical';
      case 'HIGH': return 'badge-high';
      case 'MODERATE': return 'badge-medium';
      case 'LOW': return 'badge-low';
      default: return 'badge-secondary';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Disaster-Affected Locations (Zones)</h2>
          <p>Register affected civilian zones, triage emergency priorities, and configure food, water, and medicine demands</p>
        </div>

        {userRole === 'admin' && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Disaster Location</span>
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Zone Code</th>
              <th>Location Name & Coordinates</th>
              <th>Priority Level</th>
              <th>Affected People</th>
              <th>Food Demand</th>
              <th>Water Demand</th>
              <th>Medicine Demand</th>
              <th>Fulfillment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {distributionPoints.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  No disaster zones registered. Click "Add Disaster Location" or "Load Scenario".
                </td>
              </tr>
            ) : (
              distributionPoints.map((dp) => {
                const totalReq = (dp.foodDemand || 0) + (dp.waterDemand || 0) + (dp.medicineDemand || 0);
                const delivered = dp.totalDelivered || 0;
                const fulfillment = totalReq > 0 ? ((delivered / totalReq) * 100).toFixed(0) : 0;

                return (
                  <tr key={dp.id}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#f87171' }}>
                      {dp.code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dp.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {dp.address || `${dp.latitude?.toFixed(2)}, ${dp.longitude?.toFixed(2)}`}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getSeverityBadgeClass(dp.severity)}`}>
                        {dp.severity} ({dp.priorityScore}/5)
                      </span>
                    </td>
                    <td className="mono-cell" style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Users size={13} color="#94a3b8" />
                        {dp.affectedPopulation?.toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <span className="mono-cell" style={{ color: '#fb923c', fontWeight: 600 }}>
                        {dp.foodDemand} kg
                      </span>
                    </td>
                    <td>
                      <span className="mono-cell" style={{ color: '#38bdf8', fontWeight: 600 }}>
                        {dp.waterDemand} L
                      </span>
                    </td>
                    <td>
                      <span className="mono-cell" style={{ color: '#f87171', fontWeight: 600 }}>
                        {dp.medicineDemand} Kits
                      </span>
                    </td>
                    <td>
                      <div style={{ width: '100px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                          <span>{delivered} units</span>
                          <span>{fulfillment}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div
                            className={`progress-bar-fill ${fulfillment >= 80 ? 'fill-emerald' : fulfillment > 30 ? 'fill-amber' : 'fill-red'}`}
                            style={{ width: `${Math.min(100, fulfillment)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      {userRole === 'admin' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Edit Location"
                            onClick={() => openEditModal(dp)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            title="Delete Location"
                            onClick={() => setDeleteConfirmDP(dp)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Read-only</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit DP Modal */}
      {(showAddModal || editingDP) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDP ? `Edit Location (${editingDP.code})` : 'Register Disaster-Affected Location'}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDP(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDP}>
              <div className="modal-body">
                {formError && <div className="alert-banner alert-danger">{formError}</div>}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Zone Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. ZONE-FLOOD-01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Affected Population *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.affectedPopulation}
                      onChange={(e) => setFormData({ ...formData, affectedPopulation: e.target.value })}
                      placeholder="e.g. 8500"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Zone / Location Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Coastal Flood Relief Camp"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Emergency Priority Severity *</label>
                    <select
                      className="form-control"
                      value={formData.severity}
                      onChange={(e) => {
                        const sev = e.target.value;
                        const score = sev === 'CRITICAL' ? 5 : sev === 'HIGH' ? 4 : sev === 'MODERATE' ? 3 : 2;
                        setFormData({ ...formData, severity: sev, priorityScore: score });
                      }}
                    >
                      <option value="CRITICAL">Critical (Score: 5 - Life Threatening)</option>
                      <option value="HIGH">High (Score: 4 - Severe Cut-off)</option>
                      <option value="MODERATE">Moderate (Score: 3 - Moderate Distress)</option>
                      <option value="LOW">Low (Score: 2 - Monitored Support)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority Weight (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      value={formData.priorityScore}
                      onChange={(e) => setFormData({ ...formData, priorityScore: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Area Address / Sector</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Sector 4, Cyclone Shelter Ground"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-control"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Food Required (kg)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      value={formData.foodDemand}
                      onChange={(e) => setFormData({ ...formData, foodDemand: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Water Required (L)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      value={formData.waterDemand}
                      onChange={(e) => setFormData({ ...formData, waterDemand: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Medicine (Kits)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      value={formData.medicineDemand}
                      onChange={(e) => setFormData({ ...formData, medicineDemand: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDP(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDP ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDP && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmDP(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '12px' }}>
                Are you sure you want to remove disaster zone <strong>{deleteConfirmDP.name} ({deleteConfirmDP.code})</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                All incoming transit routes and pending shipments to this zone must be cleared first.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmDP(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
