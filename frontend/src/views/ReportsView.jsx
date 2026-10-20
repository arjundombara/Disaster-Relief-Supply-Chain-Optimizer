import React from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Warehouse,
  MapPin,
  TrendingUp,
  Package
} from 'lucide-react';

export default function ReportsView({
  stats,
  depots = [],
  distributionPoints = [],
  shipments = []
}) {
  const exportShipmentsCSV = () => {
    if (!shipments || shipments.length === 0) {
      alert('No shipments available to export.');
      return;
    }

    const headers = [
      'Shipment Code',
      'Resource Type',
      'Source Depot',
      'Source Code',
      'Destination Zone',
      'Destination Code',
      'Allocated Qty',
      'Delivered Qty',
      'Status',
      'Recipient Name',
      'Created At',
      'Notes'
    ];

    const rows = shipments.map((s) => [
      s.shipmentCode,
      s.supplyType,
      `"${s.sourceDepotName || ''}"`,
      s.sourceDepotCode || '',
      `"${s.destinationPointName || ''}"`,
      s.destinationPointCode || '',
      s.allocatedQuantity,
      s.deliveredQuantity || 0,
      s.status,
      `"${s.recipientName || ''}"`,
      s.createdAt || '',
      `"${s.deliveryNotes || ''}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `disaster_relief_shipments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDepotStockCSV = () => {
    if (!depots || depots.length === 0) {
      alert('No depots to export.');
      return;
    }

    const headers = ['Depot Code', 'Depot Name', 'Max Capacity', 'Food (kg)', 'Water (L)', 'Medicine (kits)', 'Status'];
    const rows = depots.map((d) => [
      d.code,
      `"${d.name}"`,
      d.maxCapacity,
      d.inventories?.find((i) => i.supplyType === 'FOOD')?.availableQuantity || 0,
      d.inventories?.find((i) => i.supplyType === 'WATER')?.availableQuantity || 0,
      d.inventories?.find((i) => i.supplyType === 'MEDICINE')?.availableQuantity || 0,
      d.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `disaster_relief_depots_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDemandCSV = () => {
    if (!distributionPoints || distributionPoints.length === 0) {
      alert('No disaster zones to export.');
      return;
    }

    const headers = ['Zone Code', 'Zone Name', 'Severity', 'Priority (1-5)', 'Population Affected', 'Food Demand (kg)', 'Water Demand (L)', 'Medicine Demand (kits)', 'Total Delivered'];
    const rows = distributionPoints.map((dp) => [
      dp.code,
      `"${dp.name}"`,
      dp.severity,
      dp.priorityScore,
      dp.affectedPopulation,
      dp.foodDemand,
      dp.waterDemand,
      dp.medicineDemand,
      dp.totalDelivered || 0
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `disaster_relief_demands_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-title">
          <h2>Disaster Relief Audit & Analytics Reports</h2>
          <p>Export authoritative distribution logs, unmet demand analyses, and depot inventory inventories to CSV</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={exportShipmentsCSV}>
            <Download size={16} />
            <span>Export Shipments CSV</span>
          </button>
          <button className="btn btn-secondary" onClick={exportDepotStockCSV}>
            <FileSpreadsheet size={16} color="#38bdf8" />
            <span>Export Depots Stock CSV</span>
          </button>
          <button className="btn btn-secondary" onClick={exportDemandCSV}>
            <FileSpreadsheet size={16} color="#f87171" />
            <span>Export Demand CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card green">
          <div className="kpi-top">
            <span className="kpi-label">Total Relief Delivered</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div className="kpi-value">{stats?.totalDeliveredByType?.FOOD || 0} <span style={{ fontSize: '13px', color: '#94a3b8' }}>kg food</span></div>
          <div className="kpi-subtext">
            <span>+{stats?.totalDeliveredByType?.WATER || 0}L water • +{stats?.totalDeliveredByType?.MEDICINE || 0} kits</span>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-top">
            <span className="kpi-label">Unmet Need (Food)</span>
            <AlertTriangle size={16} color="#ef4444" />
          </div>
          <div className="kpi-value">{stats?.unmetDemandByType?.FOOD || 0} <span style={{ fontSize: '13px', color: '#94a3b8' }}>kg</span></div>
          <div className="kpi-subtext">
            <span>Water unmet: {stats?.unmetDemandByType?.WATER || 0}L</span>
          </div>
        </div>

        <div className="kpi-card cyan">
          <div className="kpi-top">
            <span className="kpi-label">Total Food Demanded</span>
            <TrendingUp size={16} color="#38bdf8" />
          </div>
          <div className="kpi-value">{stats?.totalDemandByType?.FOOD || 0} <span style={{ fontSize: '13px', color: '#94a3b8' }}>kg</span></div>
          <div className="kpi-subtext">Across {distributionPoints.length} disaster locations</div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-top">
            <span className="kpi-label">Active Dispatches</span>
            <Package size={16} color="#f59e0b" />
          </div>
          <div className="kpi-value">{shipments.length}</div>
          <div className="kpi-subtext">{shipments.filter(s => s.status === 'DELIVERED').length} deliveries signed off</div>
        </div>
      </div>

      {/* Zone-by-Zone Demand Fulfillment Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <MapPin size={17} color="#ef4444" />
              Zone-by-Zone Demand Satisfaction & Unmet Needs
            </h3>
            <p className="card-subtitle">Comprehensive status of disaster zones and relief aid shortfall</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone Code</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Population</th>
                <th>Food Demanded</th>
                <th>Water Demanded</th>
                <th>Medicine Demanded</th>
                <th>Delivered Total</th>
                <th>Fulfillment Rate</th>
              </tr>
            </thead>
            <tbody>
              {distributionPoints.map((dp) => {
                const totalReq = (dp.foodDemand || 0) + (dp.waterDemand || 0) + (dp.medicineDemand || 0);
                const delivered = dp.totalDelivered || 0;
                const rate = totalReq > 0 ? ((delivered / totalReq) * 100).toFixed(0) : 0;

                return (
                  <tr key={dp.id}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#f87171' }}>
                      {dp.code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{dp.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{dp.address || 'Disaster Sector'}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        dp.severity === 'CRITICAL' ? 'badge-critical' :
                        dp.severity === 'HIGH' ? 'badge-high' : 'badge-medium'
                      }`}>
                        {dp.severity}
                      </span>
                    </td>
                    <td className="mono-cell">{dp.affectedPopulation?.toLocaleString()}</td>
                    <td className="mono-cell">{dp.foodDemand} kg</td>
                    <td className="mono-cell">{dp.waterDemand} L</td>
                    <td className="mono-cell">{dp.medicineDemand} kits</td>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#34d399' }}>
                      {delivered} units
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar-bg" style={{ width: '80px' }}>
                          <div
                            className={`progress-bar-fill ${rate >= 80 ? 'fill-emerald' : rate > 20 ? 'fill-amber' : 'fill-red'}`}
                            style={{ width: `${Math.min(100, rate)}%` }}
                          />
                        </div>
                        <span className="mono-cell" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                          {rate}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Depot Reserve Health Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Warehouse size={17} color="#38bdf8" />
              Central Depots Stock Depletion & Readiness
            </h3>
            <p className="card-subtitle">Current inventory vs storage capacity for remaining relief contingency</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Depot Code</th>
                <th>Depot Facility</th>
                <th>Storage Capacity</th>
                <th>Food Stock</th>
                <th>Water Stock</th>
                <th>Medicine Stock</th>
                <th>Readiness</th>
              </tr>
            </thead>
            <tbody>
              {depots.map((d) => {
                const food = d.inventories?.find(i => i.supplyType === 'FOOD')?.availableQuantity || 0;
                const water = d.inventories?.find(i => i.supplyType === 'WATER')?.availableQuantity || 0;
                const med = d.inventories?.find(i => i.supplyType === 'MEDICINE')?.availableQuantity || 0;
                const totalStock = food + water + med;
                const util = d.maxCapacity > 0 ? ((totalStock / d.maxCapacity) * 100).toFixed(0) : 0;

                return (
                  <tr key={d.id}>
                    <td className="mono-cell" style={{ fontWeight: 700, color: '#38bdf8' }}>
                      {d.code}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{d.address || 'Relief Hub'}</div>
                    </td>
                    <td className="mono-cell">{d.maxCapacity?.toLocaleString()} units</td>
                    <td className="mono-cell">{food} kg</td>
                    <td className="mono-cell">{water} L</td>
                    <td className="mono-cell">{med} kits</td>
                    <td>
                      <span className={`badge ${totalStock > 0 ? 'badge-success' : 'badge-critical'}`}>
                        {totalStock > 0 ? 'OPERATIONAL' : 'DEPLETED'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
