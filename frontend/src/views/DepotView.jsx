import React, { useState } from 'react';
import {
  Warehouse,
  Plus,
  Edit2,
  Trash2,
  Package,
  MapPin,
  Phone,
  User,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

export default function DepotView({
  depots = [],
  onCreateDepot,
  onUpdateDepot,
  onDeleteDepot,
  onUpdateInventory,
  userRole
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState(null);
  const [invModalDepot, setInvModalDepot] = useState(null);
  const [deleteConfirmDepot, setDeleteConfirmDepot] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    latitude: '',
    longitude: '',
    address: '',
    contactPerson: '',
    phone: '',
    maxCapacity: '',
    status: 'ACTIVE'
  });

  const [invData, setInvData] = useState({
    supplyType: 'FOOD',
    quantity: ''
  });

  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setFormData({
      code: `DEP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      latitude: '28.6139',
      longitude: '77.2090',
      address: '',
      contactPerson: '',
      phone: '',
      maxCapacity: '5000',
      status: 'ACTIVE'
    });
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (depot) => {
    setEditingDepot(depot);
    setFormData({
      code: depot.code,
      name: depot.name,
      latitude: depot.latitude.toString(),
      longitude: depot.longitude.toString(),
      address: depot.address || '',
      contactPerson: depot.contactPerson || '',
      phone: depot.phone || '',
      maxCapacity: depot.maxCapacity.toString(),
      status: depot.status || 'ACTIVE'
    });
    setFormError('');
  };

  const handleSaveDepot = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.code || !formData.name || !formData.maxCapacity) {
      setFormError('Please fill in all required fields (Code, Name, Capacity).');
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
      maxCapacity: parseFloat(formData.maxCapacity),
      status: formData.status
    };

    if (payload.maxCapacity < 0) {
      setFormError('Capacity cannot be negative.');
      return;
    }

    try {
      if (editingDepot) {
        await onUpdateDepot(editingDepot.id, payload);
        setEditingDepot(null);
      } else {
        await onCreateDepot(payload);
        setShowAddModal(false);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save depot');
    }
  };

  const handleSaveInventory = async (e) => {
    e.preventDefault();
    if (!invModalDepot) return;
    const qty = parseFloat(invData.quantity);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid non-negative quantity');
      return;
    }

    try {
      await onUpdateInventory(invModalDepot.id, invData.supplyType, qty);
      setInvModalDepot(null);
    } catch (err) {
      alert(err.message || 'Failed to update inventory');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDepot) return;
    try {
      await onDeleteDepot(deleteConfirmDepot.id);
      setDeleteConfirmDepot(null);
    } catch (err) {
      alert(err.message || 'Failed to delete depot');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Central Relief Depots</h2>
          <p>Manage strategic supply bases, storage capacities, and stockpiles of food, water, and medicine</p>
        </div>

        {userRole === 'admin' && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} />
            <span>Add Relief Depot</span>
          </button>
        )}
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Depot Code</th>
              <th>Depot Name & Location</th>
              <th>Storage Capacity</th>
              <th>Food Reserve</th>
              <th>Water Reserve</th>
              <th>Medicine Reserve</th>
              <th>Contact Person</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {depots.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-dim)' }}>
                  No depots registered. Click "Add Relief Depot" or "Load Scenario" to populate.
                </td>
              </tr>
            ) : (
              depots.map((depot) => {
                const food = depot.inventories?.find((i) => i.supplyType === 'FOOD')?.availableQuantity || 0;
                const water = depot.inventories?.find((i) => i.supplyType === 'WATER')?.availableQuantity || 0;
                const meds = depot.inventories?.find((i) => i.supplyType === 'MEDICINE')?.availableQuantity || 0;

                return (
                  <tr key={depot.id}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {depot.code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{depot.name}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={12} /> {depot.address || `${depot.latitude?.toFixed(2)}, ${depot.longitude?.toFixed(2)}`}
                      </div>
                    </td>
                    <td className="mono-cell" style={{ fontWeight: 600 }}>
                      {depot.maxCapacity?.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>units</span>
                    </td>
                    <td>
                      <span className="mono-cell" style={{ fontWeight: 600 }}>{food} kg</span>
                    </td>
                    <td>
                      <span className="mono-cell" style={{ fontWeight: 600 }}>{water} L</span>
                    </td>
                    <td>
                      <span className="mono-cell" style={{ fontWeight: 600 }}>{meds} Kits</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>{depot.contactPerson || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{depot.phone || ''}</div>
                    </td>
                    <td>
                      <span className={`badge ${depot.status === 'ACTIVE' ? 'badge-success' : 'badge-secondary'}`}>
                        {depot.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Adjust Stock"
                          onClick={() => {
                            setInvModalDepot(depot);
                            setInvData({ supplyType: 'FOOD', quantity: food.toString() });
                          }}
                        >
                          <Package size={14} color="#38bdf8" />
                          <span>Stock</span>
                        </button>

                        {userRole === 'admin' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Edit Depot"
                              onClick={() => openEditModal(depot)}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              title="Delete Depot"
                              onClick={() => setDeleteConfirmDepot(depot)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Depot Modal */}
      {(showAddModal || editingDepot) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingDepot ? `Edit Depot (${editingDepot.code})` : 'Register New Relief Depot'}
              </h3>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDepot(null);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDepot}>
              <div className="modal-body">
                {formError && <div className="alert-banner alert-danger">{formError}</div>}

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Depot Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. DEP-DEL-01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Storage Capacity (units) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maxCapacity}
                      onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                      placeholder="e.g. 5000"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Depot Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Northern Regional Relief Hub"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Address / Landmark</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Terminal 2 Logistics Park, New Delhi"
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

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Contact Officer</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                      placeholder="Commander in charge"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Emergency Phone</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91-98..."
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
                    setEditingDepot(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDepot ? 'Update Depot' : 'Create Depot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Inventory Modal */}
      {invModalDepot && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Adjust Inventory: {invModalDepot.name}</h3>
              <button className="modal-close" onClick={() => setInvModalDepot(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInventory}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Resource</label>
                  <select
                    className="form-control"
                    value={invData.supplyType}
                    onChange={(e) => {
                      const type = e.target.value;
                      const currentQty =
                        invModalDepot.inventories?.find((i) => i.supplyType === type)?.availableQuantity || 0;
                      setInvData({ supplyType: type, quantity: currentQty.toString() });
                    }}
                  >
                    <option value="FOOD">Food Rations (kg)</option>
                    <option value="WATER">Potable Water (Liters)</option>
                    <option value="MEDICINE">Medical Emergency Kits</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Available In-Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-control"
                    value={invData.quantity}
                    onChange={(e) => setInvData({ ...invData, quantity: e.target.value })}
                    required
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    Negative inventory is strictly prohibited by system constraints.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setInvModalDepot(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmDepot && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmDepot(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '12px' }}>
                Are you sure you want to delete depot <strong>{deleteConfirmDepot.name} ({deleteConfirmDepot.code})</strong>?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                This will delete its associated inventory and fail if active shipments depend on it.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirmDepot(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>
                Delete Depot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
