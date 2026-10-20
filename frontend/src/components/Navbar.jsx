import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Database, Clock, Radio, UserCheck } from 'lucide-react';

export default function Navbar({
  userRole,
  setUserRole,
  onLoadDemo,
  onResetDemo,
  loadingAction,
  stats
}) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <div className="defcon-badge">
          <Radio size={14} className="animate-pulse" />
          <span>EOC LEVEL 1 ACTIVE</span>
        </div>

        <div className="live-clock">
          <Clock size={14} />
          <span>{time} IST</span>
        </div>

        {stats && (
          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="dot dot-green"></span>
              {stats.totalDepots} Depots
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="dot dot-red"></span>
              {stats.totalDistributionPoints} Zones
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="dot dot-blue"></span>
              {stats.availableRoutes}/{stats.totalRoutes} Corridors
            </span>
          </div>
        )}
      </div>

      <div className="navbar-actions">
        {/* Role Switcher */}
        <div className="role-pill">
          <button
            className={`role-btn ${userRole === 'admin' ? 'active' : ''}`}
            onClick={() => setUserRole('admin')}
          >
            Commander (Admin)
          </button>
          <button
            className={`role-btn ${userRole === 'field' ? 'active' : ''}`}
            onClick={() => setUserRole('field')}
          >
            Field Worker
          </button>
        </div>

        {/* Demo Data Quick Buttons */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onLoadDemo}
          disabled={loadingAction}
          title="Load standard demo disaster scenario"
        >
          <Database size={14} color="#38bdf8" />
          <span>Load Scenario</span>
        </button>

        <button
          className="btn btn-outline-danger btn-sm"
          onClick={onResetDemo}
          disabled={loadingAction}
          title="Reset and clear all current data"
        >
          <RefreshCw size={14} className={loadingAction ? 'animate-spin' : ''} />
          <span>Reset Network</span>
        </button>
      </div>
    </header>
  );
}
