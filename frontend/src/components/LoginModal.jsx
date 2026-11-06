import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  ArrowLeft,
  HardHat,
  ChevronRight,
  ShieldCheck,
  UserPlus,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { api, authStorage } from '../services/api';

/**
 * Modern Disaster Relief Login & Worker Self-Registration Component
 * Role Selection: Admin Login, Worker Login, or Worker Self-Registration
 * Starts with blank fields, no demo credentials, and password eye toggles.
 */
export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  // 'select' (null) | 'ADMIN' | 'WORKER' | 'REGISTER'
  const [selectedRole, setSelectedRole] = useState(null);

  // Login form state (strictly blank initially)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Worker Self-Registration form state (strictly blank initially)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Reset all fields whenever the modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setSelectedRole(null);
      resetLoginForm();
      resetRegisterForm();
      setError(null);
      setSuccessMessage(null);
      setLoading(false);
    }
  }, [isOpen]);

  const resetLoginForm = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
  };

  const resetRegisterForm = () => {
    setRegFullName('');
    setRegUsername('');
    setRegEmail('');
    setRegPassword('');
    setRegConfirmPassword('');
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
  };

  if (!isOpen) return null;

  // Handle switching between views
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    resetLoginForm();
    resetRegisterForm();
    setError(null);
    setSuccessMessage(null);
  };

  const handleBackToSelect = () => {
    setSelectedRole(null);
    resetLoginForm();
    resetRegisterForm();
    setError(null);
    setSuccessMessage(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login({
        username: username.trim(),
        password: password
      });

      // Role check: ensure worker cannot log in via admin portal if mismatched
      if (selectedRole === 'ADMIN' && res.role === 'WORKER') {
        setError('Access denied: This account has Field Worker privileges. Please sign in via the Worker portal.');
        setLoading(false);
        return;
      }

      // Store JWT token and authenticated user details
      authStorage.setToken(res.token);
      authStorage.setUser(res);

      if (onLoginSuccess) {
        onLoginSuccess(res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedFullName = regFullName.trim();
    const trimmedUsername = regUsername.trim();
    const trimmedEmail = regEmail.trim();

    if (!trimmedFullName || !trimmedUsername || !trimmedEmail || !regPassword || !regConfirmPassword) {
      setError('All registration fields are required. Please fill in every field.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.registerWorkerSelf({
        fullName: trimmedFullName,
        username: trimmedUsername,
        email: trimmedEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword
      });

      setSuccessMessage(
        res.message || 'Registration successful! Your account is waiting for Admin approval.'
      );
      resetRegisterForm();
    } catch (err) {
      setError(err.message || 'Worker registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAdminView = selectedRole === 'ADMIN';
  const isWorkerView = selectedRole === 'WORKER';
  const isRegisterView = selectedRole === 'REGISTER';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 11, 24, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          width: '100%',
          maxWidth: isRegisterView ? '500px' : selectedRole ? '440px' : '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.1)',
          transition: 'all 0.25s ease'
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#131e36'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedRole ? (
              <button
                type="button"
                onClick={handleBackToSelect}
                disabled={loading}
                title="Back to account options"
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = '#f8fafc';
                  e.currentTarget.style.borderColor = '#38bdf8';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.borderColor = '#334155';
                }}
              >
                <ArrowLeft size={16} />
              </button>
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}
              >
                <ShieldAlert size={20} />
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc', letterSpacing: '0.01em' }}>
                {isAdminView
                  ? 'Administrator Sign In'
                  : isWorkerView
                  ? 'Field Worker Sign In'
                  : isRegisterView
                  ? 'Worker Self-Registration'
                  : 'Emergency Relief Access'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                {isAdminView
                  ? 'Central Operations Command Portal'
                  : isWorkerView
                  ? 'Humanitarian Logistics & Field Delivery'
                  : isRegisterView
                  ? 'Submit self-registration for Admin approval'
                  : 'Role-Based Authentication Gateway'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '22px',
              lineHeight: 1,
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
            onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {/* Error Banner */}
          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                padding: '11px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                lineHeight: 1.45
              }}
            >
              <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <span style={{ wordBreak: 'break-word' }}>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                padding: '14px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                lineHeight: 1.5
              }}
            >
              <CheckCircle2 size={18} style={{ marginTop: '2px', flexShrink: 0, color: '#10b981' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', marginBottom: '4px' }}>Registration Received!</strong>
                <span>{successMessage}</span>
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleSelectRole('WORKER')}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Go to Worker Sign In
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 1: Role / Action Selection */}
          {!selectedRole && (
            <div>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#f1f5f9' }}>
                  Select Access Option
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                  Choose your designated portal or submit a new worker registration
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Admin Account Option Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectRole('ADMIN')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectRole('ADMIN')}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.backgroundColor = '#1e2d4a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(239, 68, 68, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      flexShrink: 0
                    }}
                  >
                    <ShieldAlert size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                        Admin Login
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Central Command
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                      Directives, depots, inventory, routing, algorithms, and worker approvals.
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                </div>

                {/* Worker Account Option Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectRole('WORKER')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectRole('WORKER')}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.backgroundColor = '#1e2d4a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(56, 189, 248, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                      flexShrink: 0
                    }}
                  >
                    <HardHat size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                        Worker Login
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Field Ops
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                      Delivery assignments, field manifests, and delivery verification.
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                </div>

                {/* Worker Self Registration Option Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectRole('REGISTER')}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelectRole('REGISTER')}
                  style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#10b981';
                    e.currentTarget.style.backgroundColor = '#1e2d4a';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(16, 185, 129, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.backgroundColor = '#1e293b';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10b981',
                      flexShrink: 0
                    }}
                  >
                    <UserPlus size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                        Worker Self Registration
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Self Sign-Up
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.35 }}>
                      Apply as a relief field worker. Submissions are queued for Admin approval.
                    </p>
                  </div>
                  <ChevronRight size={18} style={{ color: '#64748b', flexShrink: 0 }} />
                </div>
              </div>

              {/* Security & Access Notice */}
              <div
                style={{
                  marginTop: '20px',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '11px',
                  color: '#94a3b8'
                }}
              >
                <ShieldCheck size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span>
                  Self-registered accounts automatically receive the Field Worker role with <strong>PENDING</strong> status until an authorized Administrator reviews and approves them.
                </span>
              </div>
            </div>
          )}

          {/* SCREEN 2: Dedicated Role Login Form (Admin or Worker) */}
          {(isAdminView || isWorkerView) && (
            <form onSubmit={handleLoginSubmit} autoComplete="off">
              {/* Role Indicator Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  backgroundColor: isAdminView ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                  border: `1px solid ${isAdminView ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)'}`,
                  borderRadius: '8px',
                  marginBottom: '18px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isAdminView ? <ShieldAlert size={16} color="#ef4444" /> : <HardHat size={16} color="#38bdf8" />}
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: isAdminView ? '#f87171' : '#38bdf8'
                    }}
                  >
                    {isAdminView ? 'Administrator Portal' : 'Field Worker Portal'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectRole(isAdminView ? 'WORKER' : 'ADMIN')}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#f8fafc')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Switch to {isAdminView ? 'Worker' : 'Admin'}
                </button>
              </div>

              {/* Username Input (starts completely blank) */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  htmlFor="login-username"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  {isAdminView ? 'Admin Username or Email' : 'Worker Username or Email'}
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b'
                    }}
                  />
                  <input
                    id="login-username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={isAdminView ? 'Enter admin username or email' : 'Enter worker username or email'}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 38px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = isAdminView ? '#ef4444' : '#38bdf8')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                </div>
              </div>

              {/* Password Input (starts completely blank) */}
              <div style={{ marginBottom: '22px' }}>
                <label
                  htmlFor="login-password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '6px'
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b'
                    }}
                  />
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="new-password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '11px 38px 11px 38px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = isAdminView ? '#ef4444' : '#38bdf8')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.color = '#cbd5e1')}
                    onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: isAdminView ? '#dc2626' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  boxShadow: isAdminView
                    ? '0 4px 12px rgba(220, 38, 38, 0.35)'
                    : '0 4px 12px rgba(2, 132, 199, 0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = isAdminView ? '#b91c1c' : '#0369a1';
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = isAdminView ? '#dc2626' : '#0284c7';
                  }
                }}
              >
                <LogIn size={16} />
                <span>
                  {loading
                    ? 'Authenticating...'
                    : isAdminView
                    ? 'Sign In as Administrator'
                    : 'Sign In as Field Worker'}
                </span>
              </button>

              {/* Links below form */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                {isWorkerView && (
                  <button
                    type="button"
                    onClick={() => handleSelectRole('REGISTER')}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#34d399',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    <UserPlus size={13} />
                    <span>Need an account? Submit Worker Self-Registration</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleBackToSelect}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <ArrowLeft size={13} />
                  <span>Choose a different option</span>
                </button>
              </div>
            </form>
          )}

          {/* SCREEN 3: Worker Self-Registration Form */}
          {isRegisterView && (
            <form onSubmit={handleRegisterSubmit} autoComplete="off">
              {/* Registration Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              >
                <UserPlus size={16} color="#10b981" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '600' }}>
                  Field Worker Self-Registration (Pending Admin Approval)
                </span>
              </div>

              {/* Full Name Input */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="reg-fullname"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '5px'
                  }}
                >
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b'
                    }}
                  />
                  <input
                    id="reg-fullname"
                    name="fullName"
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    autoComplete="off"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                </div>
              </div>

              {/* Username Input */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="reg-username"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '5px'
                  }}
                >
                  Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b'
                    }}
                  />
                  <input
                    id="reg-username"
                    name="username"
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose a unique username"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="reg-email"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '5px'
                  }}
                >
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b'
                    }}
                  />
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="e.g. worker@relief.org"
                    autoComplete="off"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: '12px' }}>
                <label
                  htmlFor="reg-password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '5px'
                  }}
                >
                  Password (min 6 characters) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b'
                    }}
                  />
                  <input
                    id="reg-password"
                    name="password"
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter strong password"
                    autoComplete="new-password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div style={{ marginBottom: '18px' }}>
                <label
                  htmlFor="reg-confirm-password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#cbd5e1',
                    marginBottom: '5px'
                  }}
                >
                  Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b'
                    }}
                  />
                  <input
                    id="reg-confirm-password"
                    name="confirmPassword"
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#10b981')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = '#334155')}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Registration Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#047857';
                }}
                onMouseOut={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#059669';
                }}
              >
                <UserPlus size={16} />
                <span>{loading ? 'Submitting Registration...' : 'Register Worker Account'}</span>
              </button>

              {/* Back / Navigation links */}
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleSelectRole('WORKER')}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseOut={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Already registered? Sign in as Field Worker
                </button>

                <button
                  type="button"
                  onClick={handleBackToSelect}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#38bdf8')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <ArrowLeft size={13} />
                  <span>Choose a different option</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
