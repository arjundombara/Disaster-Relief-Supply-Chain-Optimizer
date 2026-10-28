import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function NotificationCenter({ onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications(false);
      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      // ignore if unauthenticated or offline
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle size={15} color="#ef4444" />;
      case 'WARNING':
        return <AlertCircle size={15} color="#f59e0b" />;
      case 'SUCCESS':
        return <Check size={15} color="#10b981" />;
      default:
        return <Info size={15} color="#38bdf8" />;
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setIsOpen(!isOpen)}
        style={{ position: 'relative', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
        title="Notifications & Directives"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#ef4444',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '9999px',
            padding: '1px 6px',
            lineHeight: '1.2'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '38px',
          width: '360px',
          maxHeight: '440px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0f172a'
          }}>
            <span style={{ fontWeight: '600', fontSize: '13px', color: '#f8fafc' }}>
              Notifications ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '360px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                No notifications received
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!item.read) handleMarkAsRead(item.id, { stopPropagation: () => {} });
                    if (onNotificationClick) onNotificationClick(item);
                  }}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #1e293b',
                    backgroundColor: item.read ? 'transparent' : 'rgba(56, 189, 248, 0.08)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ marginTop: '2px' }}>{getIcon(item.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: item.read ? '500' : '700',
                        color: item.read ? '#cbd5e1' : '#f8fafc'
                      }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '6px' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <p style={{
                      margin: '3px 0 0',
                      fontSize: '11px',
                      color: '#94a3b8',
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}>
                      {item.message}
                    </p>
                  </div>
                  {!item.read && (
                    <button
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      title="Mark as read"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '2px'
                      }}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
