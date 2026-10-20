import React, { useState } from 'react';
import {
  Route as RouteIcon,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Compass,
  ArrowRight,
  X
} from 'lucide-react';

export default function RouteView({
  routes = [],
  depots = [],
  distributionPoints = [],
  onCreateRoute,
  onUpdateRoute,
  onDeleteRoute,
  userRole
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [deleteConfirmRoute, setDeleteConfirmRoute] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    routeCode: '',
    sourceDepotId: '',
    destinationPointId: '',
    capacity: '',
    distanceKm: '',
    travelTimeHours: '',
    roadCondition: 'CLEAR',
    isAvailable: true
  });

  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setFormData({
      routeCode: `RT-${Math.floor(100 + Math.random() * 900)}`,
      sourceDepotId: depots[0]?.id?.toString() || '',
      destinationPointId: distributionPoints[0]?.id?.toString() || '',
      capacity: '80',
      distanceKm: '120',
      travelTimeHours: '3.5',
      roadCondition: 'CLEAR',
      isAvailable: true
    });
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (route) => {
    setEditingRoute(route);
    setFormData({
      routeCode: route.routeCode,
      sourceDepotId: (route.sourceDepotId || route.sourceDepot?.id)?.toString() || '',
      destinationPointId: (route.destinationPointId || route.destinationPoint?.id)?.toString() || '',
      capacity: route.capacity.toString(),
      distanceKm: route.distanceKm?.toString() || '0',
      travelTimeHours: route.travelTimeHours?.toString() || '0',
      roadCondition: route.roadCondition || 'CLEAR',
      isAvailable: route.isAvailable !== false
    });
    setFormError('');
  };

  const handleToggleAvailability = async (route) => {
    try {
      const updated = {
        routeCode: route.routeCode,
        sourceDepotId: route.sourceDepotId || route.sourceDepot?.id,
        destinationPointId: route.destinationPointId || route.destinationPoint?.id,
        capacity: route.capacity,
        distanceKm: route.distanceKm,
        travelTimeHours: route.travelTimeHours,
        roadCondition: !route.isAvailable ? 'CLEAR' : 'BLOCKED',
        isAvailable: !route.isAvailable
      };
      await onUpdateRoute(route.id, updated);
    } catch (err) {
      alert(err.message || 'Failed to toggle route status');
    }
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.routeCode || !formData.sourceDepotId || !formData.destinationPointId || !formData.capacity) {
      setFormError('Please select Source Depot, Destination Point, and specify Route Capacity.');
      return;
    }

    const payload = {
      routeCode: formData.routeCode.trim(),
      sourceDepotId: parseInt(formData.sourceDepotId),
      destinationPointId: parseInt(formData.destinationPointId),
      capacity: parseFloat(formData.capacity) || 0.0,
      distanceKm: parseFloat(formData.distanceKm) || 0.0,
      travelTimeHours: parseFloat(formData.travelTimeHours) || 0.0,
      roadCondition: formData.roadCondition,
      isAvailable: formData.isAvailable
    };

    if (payload.capacity <= 0) {
      setFormError('Route capacity must be greater than zero.');
      return;
    }

    try {
      if (editingRoute) {
        await onUpdateRoute(editingRoute.id, payload);
        setEditingRoute(null);
      } else {
        await onCreateRoute(payload);
        setShowAddModal(false);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save route');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmRoute) return;
    try {
      await onDeleteRoute(deleteConfirmRoute.id);
      setDeleteConfirmRoute(null);
    } catch (err) {
      alert(err.message || 'Failed to delete route');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Transportation Corridors & Route Capacities</h2>
          <p>Configure road links between depots and disaster areas, distance metrics, and toggle impassable/blocked corridors</p>
        </div>

        {userRole === 'admin' && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Route Corridor</span>
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Route Code</th>
              <th>Source Depot</th>
              <th></th>
              <th>Destination Zone</th>
              <th>Max Capacity</th>
              <th>Transit Distance</th>
              <th>Est. Travel Time</th>
              <th>Corridor Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  No routes configured. Click "Add Route Corridor" or "Load Scenario".
                </td>
              </tr>
            ) : (
              routes.map((route) => {
                const srcName = route.sourceDepotName || depots.find(d => d.id === route.sourceDepotId)?.name || 'Depot';
                const dstName = route.destinationPointName || distributionPoints.find(dp => dp.id === route.destinationPointId)?.name || 'Disaster Zone';

                return (
                  <tr key={route.id} style={{ opacity: route.isAvailable ? 1 : 0.65 }}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: route.isAvailable ? '#38bdf8' : '#f87171' }}>
                      {route.routeCode}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{srcName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {route.sourceDepotCode}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-dim)', textAlign: 'center' }}>
                      <ArrowRight size={15} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dstName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        {route.destinationPointCode}
                      </div>
                    </td>
                    <td className="mono-cell" style={{ fontWeight: 700 }}>
                      {route.capacity} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>units</span>
                    </td>
                    <td className="mono-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Compass size={13} color="#94a3b8" />
                        {route.distanceKm || 'N/A'} km
                      </div>
                    </td>
                    <td className="mono-cell">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="#94a3b8" />
                        {route.travelTimeHours || 'N/A'} hrs
                      </div>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${route.isAvailable ? 'btn-secondary' : 'btn-outline-danger'}`}
                        onClick={() => handleToggleAvailability(route)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        title="Click to toggle Available vs Blocked"
                      >
                        {route.isAvailable ? (
                          <>
                            <CheckCircle2 size={13} color="#10b981" />
                            <span style={{ color: '#34d399', fontWeight: 600 }}>AVAILABLE</span>
                          </>
                        ) : (
                          <>
                            <AlertOctagon size={13} color="#ef4444" />
                            <span style={{ color: '#f87171', fontWeight: 600 }}>BLOCKED</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td>
                      {userRole === 'admin' ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Edit Route"
                            onClick={() => openEditModal(route)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            title="Delete Route"
                            onClick={() => setDeleteConfirmRoute(route)}
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

      {/* Add / Edit Route Modal */}
      {(showAddModal || editingRoute) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRoute ? `Edit Route (${editingRoute.routeCode})` : 'Create New Route Corridor'}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoute(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoute}>
              <div className="modal-body">
                {formError && <div className="alert-banner alert-danger">{formError}</div>}

                <div className="form-group">
                  <label className="form-label">Route Identifier Code *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.routeCode}
                    onChange={(e) => setFormData({ ...formData, routeCode: e.target.value })}
                    placeholder="e.g. RT-ALPHA-01"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Source Depot *</label>
                    <select
                      className="form-control"
                      value={formData.sourceDepotId}
                      onChange={(e) => setFormData({ ...formData, sourceDepotId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Origin Depot --</option>
                      {depots.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Destination Disaster Zone *</label>
                    <select
                      className="form-control"
                      value={formData.destinationPointId}
                      onChange={(e) => setFormData({ ...formData, destinationPointId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Target Zone --</option>
                      {distributionPoints.map((dp) => (
                        <option key={dp.id} value={dp.id}>
                          {dp.name} ({dp.code} - {dp.severity})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Max Capacity (units) *</label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      className="form-control"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Distance (km)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      value={formData.distanceKm}
                      onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Transit Time (hrs)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="form-control"
                      value={formData.travelTimeHours}
                      onChange={(e) => setFormData({ ...formData, travelTimeHours: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Road Condition</label>
                    <select
                      className="form-control"
                      value={formData.roadCondition}
                      onChange={(e) => setFormData({ ...formData, roadCondition: e.target.value })}
                    >
                      <option value="CLEAR">Clear Highway (Optimal)</option>
                      <option value="FLOOD_RISK">Flood Warning / Rising Water</option>
                      <option value="DEBRIS">Debris / Landslide Alert</option>
                      <option value="DAMAGED">Bridge/Road Structural Damage</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Corridor Availability</label>
                    <select
                      className="form-control"
                      value={formData.isAvailable ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                    >
                      <option value="true">Available for Relief Dispatches</option>
                      <option value="false">Blocked / Out of Service</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRoute(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRoute ? 'Update Corridor' : 'Create Corridor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmRoute && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmRoute(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '12px' }}>
                Are you sure you want to delete route corridor <strong>{deleteConfirmRoute.routeCode}</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                This corridor will no longer be considered by the Edmonds-Karp max-flow algorithm.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmRoute(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete Corridor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
