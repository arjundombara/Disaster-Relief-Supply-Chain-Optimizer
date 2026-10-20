import React from 'react';
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
  Utensils
} from 'lucide-react';
import ReliefMap from '../components/ReliefMap';

export default function DashboardView({
  stats,
  depots = [],
  distributionPoints = [],
  routes = [],
  recentShipments = [],
  onNavigateToOptimization,
  onNavigateToDeliveries,
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
