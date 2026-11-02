import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, Database, Clock, Radio, User, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

export default function Navbar({
  currentUser,
  onOpenLogin,
  onLogout,
  onLoadDemo,
  onResetDemo,
  loadingAction,
  stats,
  onNotificationSelect
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
        {/* Notification Bell */}
        <NotificationCenter onNotificationClick={onNotificationSelect} />

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

        {/* Auth / Profile Pill */}
        {currentUser ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            padding: '4px 8px 4px 12px',
            borderRadius: '9999px',
            fontSize: '12px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#f8fafc' }}>
              <User size={13} color={currentUser.role === 'ADMIN' ? '#ef4444' : '#38bdf8'} />
              <strong>{currentUser.username}</strong>
            </span>
            <span className={`badge ${currentUser.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '10px' }}>
              {currentUser.role}
            </span>
            <button
              onClick={onLogout}
              className="btn btn-secondary btn-sm"
              style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Sign Out"
            >
              <LogOut size={12} />
              <span>Exit</span>
            </button>
          </div>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={onOpenLogin}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
