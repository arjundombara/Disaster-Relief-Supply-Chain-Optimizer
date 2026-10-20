import React from 'react';
import {
  LayoutDashboard,
  Warehouse,
  MapPin,
  Route as RouteIcon,
  Zap,
  Truck,
  BarChart3,
  FlaskConical,
  LifeBuoy
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, counts = {} }) {
  const navItems = [
    { id: 'dashboard', label: 'EOC Command Desk', icon: LayoutDashboard },
    { id: 'depots', label: 'Depot Management', icon: Warehouse, count: counts.depots },
    { id: 'locations', label: 'Affected Locations', icon: MapPin, count: counts.locations },
    { id: 'routes', label: 'Route Corridors', icon: RouteIcon, count: counts.routes },
    { id: 'optimization', label: 'Supply Optimizer', icon: Zap, highlight: true },
    { id: 'deliveries', label: 'Delivery Tracking', icon: Truck, count: counts.shipments },
    { id: 'reports', label: 'Reports & Export', icon: BarChart3 },
    { id: 'scenarios', label: 'Test Scenarios (1-8)', icon: FlaskConical, badge: 'TESTS' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="eoc-logo-icon">
          <LifeBuoy size={22} />
        </div>
        <div className="sidebar-title">
          <h1>RELIEF OPTIMIZER</h1>
          <span>Problem Statement #111</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={18} className="nav-icon" />
              <span>{item.label}</span>
              {item.count !== undefined && item.count !== null && (
                <span className="nav-badge">{item.count}</span>
              )}
              {item.badge && (
                <span className="nav-badge" style={{ background: '#3b82f6', color: '#fff' }}>
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-status-indicator">
          <span className="status-pulse-dot"></span>
          <span>SPRING BOOT + EDMONDS-KARP</span>
        </div>
        <div>Network Flow Humanitarian Logistics</div>
        <div style={{ marginTop: '4px', color: '#64748b' }}>v1.0.0 • College Demonstration</div>
      </div>
    </aside>
  );
}
