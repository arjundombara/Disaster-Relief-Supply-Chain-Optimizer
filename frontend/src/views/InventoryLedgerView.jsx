import React, { useState, useEffect } from 'react';
import {
  Package, Database, ArrowUpRight, ArrowDownLeft, RefreshCw, PlusCircle,
  AlertCircle, CheckCircle, ShieldAlert, FileText, SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';

export default function InventoryLedgerView({ depots, showAlert }) {
  const [selectedDepotId, setSelectedDepotId] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // Adjustment form state
  const [adjustDepotId, setAdjustDepotId] = useState('');
  const [adjustSupplyType, setAdjustSupplyType] = useState('FOOD');
  const [deltaQuantity, setDeltaQuantity] = useState('50');
  const [adjustReason, setAdjustReason] = useState('Emergency donation intake');
  const [adjustReferenceId, setAdjustReferenceId] = useState('DON-2026-001');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await api.getInventoryTransactions(selectedDepotId || null);
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to load ledger transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedDepotId]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustDepotId) {
      showAlert('Please choose target depot for adjustment', 'warning');
      return;
    }
    setSubmittingAdjust(true);

    try {
      const payload = {
        supplyType: adjustSupplyType,
        deltaQuantity: parseFloat(deltaQuantity),
        reason: adjustReason.trim(),
        referenceId: adjustReferenceId.trim()
      };

      await api.adjustInventory(adjustDepotId, payload);
      showAlert(`Inventory adjusted by ${deltaQuantity} for ${adjustSupplyType}. Transaction recorded to audit ledger.`, 'success');
      setShowAdjustModal(false);
      await fetchLedger();
    } catch (err) {
      showAlert(err.message || 'Failed to record inventory adjustment', 'danger');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const getTxTypeBadge = (type) => {
    switch (type) {
      case 'INITIAL_STOCK':
      case 'STOCK_RECEIPT':
      case 'RETURN_RESTOCK':
        return <span className="badge badge-success">{type}</span>;
      case 'ALLOCATION_RESERVE':
      case 'SHIPMENT_DISPATCH':
        return <span className="badge badge-warning">{type}</span>;
      case 'DELIVERY_FULFILLED':
        return <span className="badge badge-info">{type}</span>;
      case 'DAMAGE_LOSS':
      case 'MANUAL_ADJUSTMENT':
        return <span className="badge badge-secondary">{type}</span>;
      default:
        return <span className="badge badge-secondary">{type}</span>;
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Relief Inventory & Audit Ledger</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Immutable audit record of stock receipts, allocation reservations, dispatch movements, and delivery fulfillments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={selectedDepotId}
            onChange={(e) => setSelectedDepotId(e.target.value)}
            style={{
              padding: '6px 10px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '12px'
            }}
          >
            <option value="">All Supply Hubs</option>
            {depots.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>

          <button className="btn btn-secondary btn-sm" onClick={fetchLedger} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Ledger</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setAdjustDepotId(depots[0]?.id || '');
              setShowAdjustModal(true);
            }}
          >
            <PlusCircle size={14} style={{ marginRight: '4px' }} />
            <span>Manual Stock Entry</span>
          </button>
        </div>
      </div>

      {/* Depots Inventory Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px', marginTop: '16px' }}>
        {depots.map((depot) => (
          <div key={depot.id} className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: '#f8fafc', fontSize: '14px' }}>{depot.name}</strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{depot.code} • Cap: {depot.maxCapacity}</span>
              </div>
              <span className="badge badge-info">{depot.status}</span>
            </div>
            <div style={{ padding: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {depot.inventories && depot.inventories.map((inv) => (
                  <div key={inv.supplyType} style={{ backgroundColor: '#0f172a', padding: '8px', borderRadius: '6px', fontSize: '11px' }}>
                    <div style={{ color: '#94a3b8', fontWeight: '600' }}>{inv.supplyType}</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#38bdf8', marginTop: '2px' }}>
                      {inv.availableQuantity} <span style={{ fontSize: '10px', color: '#64748b' }}>{inv.unit}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      Reserved: {inv.reservedQuantity || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Audit Ledger Table */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '15px' }}>Transaction Audit Ledger</h3>
          </div>
          <span className="badge badge-info">{transactions.length} immutable events</span>
        </div>

        <div style={{ padding: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Hub</th>
                <th>Supply</th>
                <th>Transaction Type</th>
                <th>Delta</th>
                <th>Balance After</th>
                <th>Reference</th>
                <th>Reason / Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td><strong style={{ color: '#64748b' }}>#{tx.id}</strong></td>
                    <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}
                    </td>
                    <td><strong style={{ color: '#f8fafc' }}>{tx.depotCode || `Depot #${tx.depotId}`}</strong></td>
                    <td>{tx.supplyType}</td>
                    <td>{getTxTypeBadge(tx.transactionType)}</td>
                    <td>
                      <span style={{
                        fontWeight: '700',
                        color: tx.quantityChange > 0 ? '#10b981' : tx.quantityChange < 0 ? '#ef4444' : '#cbd5e1'
                      }}>
                        {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                      </span>
                    </td>
                    <td><strong style={{ color: '#38bdf8' }}>{tx.balanceAfter}</strong></td>
                    <td style={{ fontSize: '11px', color: '#cbd5e1' }}>{tx.referenceId || '-'}</td>
                    <td style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '240px' }}>{tx.reason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px',
            width: '100%', maxWidth: '480px', padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#f8fafc', fontSize: '16px' }}>
              Manual Stock Adjustment / Intake
            </h3>

            <form onSubmit={handleAdjustSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Target Relief Depot *
                </label>
                <select
                  required
                  value={adjustDepotId}
                  onChange={(e) => setAdjustDepotId(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                >
                  <option value="">Select Depot</option>
                  {depots.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Supply Category *
                  </label>
                  <select
                    value={adjustSupplyType}
                    onChange={(e) => setAdjustSupplyType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="FOOD">FOOD (kg)</option>
                    <option value="WATER">WATER (liters)</option>
                    <option value="MEDICAL">MEDICAL (kits)</option>
                    <option value="SHELTER">SHELTER (tents)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Quantity Delta (+/-) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={deltaQuantity}
                    onChange={(e) => setDeltaQuantity(e.target.value)}
                    placeholder="+100 or -20"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Reference Code / Document #
                </label>
                <input
                  type="text"
                  value={adjustReferenceId}
                  onChange={(e) => setAdjustReferenceId(e.target.value)}
                  placeholder="e.g. INTAKE-WB-092"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Audit Justification / Source of Change *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Explain source of goods or reason for write-off..."
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submittingAdjust} className="btn btn-primary">
                  {submittingAdjust ? 'Committing...' : 'Commit to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
