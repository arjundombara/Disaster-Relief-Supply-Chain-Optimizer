import React, { useState, useEffect } from 'react';
import {
  Flame, Waves, Wind, Mountain, AlertTriangle, Plus, Trash2, Edit3,
  Radio, Megaphone, Users, MapPin, CheckCircle, Clock, Send
} from 'lucide-react';
import { api } from '../services/api';

export default function DisasterView({ showAlert }) {
  const [disasters, setDisasters] = useState([]);
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [selectedDisasterForBroadcast, setSelectedDisasterForBroadcast] = useState(null);

  // Disaster form state
  const [name, setName] = useState('');
  const [disasterType, setDisasterType] = useState('CYCLONE');
  const [affectedLocation, setAffectedLocation] = useState('');
  const [severity, setSeverity] = useState('CRITICAL');
  const [estimatedPopulation, setEstimatedPopulation] = useState('15000');
  const [description, setDescription] = useState('');
  const [requiredResources, setRequiredResources] = useState('Food packs, Water purifiers, Trauma kits');
  const [urgentInstructions, setUrgentInstructions] = useState('');

  // Instruction form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState('URGENT');
  const [targetAudience, setTargetAudience] = useState('ALL');

  const fetchDisastersAndInstructions = async () => {
    setLoading(true);
    try {
      const [disastersData, instructionsData] = await Promise.all([
        api.getDisasters().catch(() => []),
        api.getInstructions().catch(() => [])
      ]);
      setDisasters(disastersData || []);
      setInstructions(instructionsData || []);
    } catch (err) {
      console.error('Failed to load disaster data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisastersAndInstructions();
  }, []);

  const handleCreateDisaster = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: name.trim(),
        disasterType,
        affectedLocation: affectedLocation.trim(),
        severity,
        estimatedPopulation: parseInt(estimatedPopulation, 10) || 0,
        description: description.trim(),
        requiredResources: requiredResources.trim(),
        urgentInstructions: urgentInstructions.trim(),
        status: 'ACTIVE'
      };
      await api.createDisaster(payload);
      showAlert(`Disaster "${name}" declared and registered in emergency registry.`, 'success');
      setShowCreateModal(false);
      resetDisasterForm();
      await fetchDisastersAndInstructions();
    } catch (err) {
      showAlert(err.message || 'Failed to create disaster declaration', 'danger');
    }
  };

  const resetDisasterForm = () => {
    setName('');
    setDisasterType('CYCLONE');
    setAffectedLocation('');
    setSeverity('CRITICAL');
    setEstimatedPopulation('15000');
    setDescription('');
    setRequiredResources('');
    setUrgentInstructions('');
  };

  const handleDeleteDisaster = async (id, disasterName) => {
    if (!window.confirm(`De-escalate and archive disaster record "${disasterName}"?`)) return;
    try {
      await api.deleteDisaster(id);
      showAlert(`Disaster record #${id} removed.`, 'info');
      await fetchDisastersAndInstructions();
    } catch (err) {
      showAlert(err.message || 'Failed to delete disaster', 'danger');
    }
  };

  const handleOpenBroadcast = (disaster) => {
    setSelectedDisasterForBroadcast(disaster);
    setBroadcastTitle(disaster ? `Directives for ${disaster.name}` : '');
    setBroadcastContent(disaster?.urgentInstructions || '');
    setBroadcastPriority('URGENT');
    setShowBroadcastModal(true);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        priority: broadcastPriority,
        targetAudience,
        disasterId: selectedDisasterForBroadcast?.id || null
      };
      await api.createInstruction(payload);
      showAlert('Official Directive broadcasted to all deployed field units!', 'success');
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastContent('');
      await fetchDisastersAndInstructions();
    } catch (err) {
      showAlert(err.message || 'Failed to broadcast directive', 'danger');
    }
  };

  const getDisasterIcon = (type) => {
    switch (type) {
      case 'FLOOD':
        return <Waves size={18} color="#38bdf8" />;
      case 'CYCLONE':
        return <Wind size={18} color="#a855f7" />;
      case 'WILDFIRE':
        return <Flame size={18} color="#f97316" />;
      case 'LANDSLIDE':
      case 'EARTHQUAKE':
        return <Mountain size={18} color="#eab308" />;
      default:
        return <AlertTriangle size={18} color="#ef4444" />;
    }
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Disaster Event Command & Directives</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Declare emergency situations, track impacted populations, and broadcast operational directives.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleOpenBroadcast(null)}>
            <Megaphone size={14} style={{ marginRight: '4px' }} />
            <span>Broadcast Directive</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} style={{ marginRight: '4px' }} />
            <span>Declare New Disaster</span>
          </button>
        </div>
      </div>

      {/* Disasters Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {disasters.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <AlertTriangle size={36} style={{ margin: '0 auto 12px', color: '#f59e0b' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>No active disaster declarations.</p>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>Click "Declare New Disaster" or load a demo scenario to activate the response network.</p>
          </div>
        ) : (
          disasters.map((d) => (
            <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {getDisasterIcon(d.disasterType)}
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#f8fafc' }}>{d.name}</h3>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{d.disasterType} • ID #{d.id}</span>
                  </div>
                </div>
                <span className={`badge ${d.severity === 'CRITICAL' ? 'badge-danger' : d.severity === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                  {d.severity}
                </span>
              </div>

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                  <MapPin size={14} color="#38bdf8" />
                  <span><strong>Location:</strong> {d.affectedLocation}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                  <Users size={14} color="#f59e0b" />
                  <span><strong>Affected Citizens:</strong> {(d.estimatedPopulation || 0).toLocaleString()}</span>
                </div>

                {d.description && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                    {d.description}
                  </p>
                )}

                {d.requiredResources && (
                  <div style={{ fontSize: '11px', backgroundColor: '#0f172a', padding: '8px', borderRadius: '6px' }}>
                    <span style={{ color: '#64748b', display: 'block', fontWeight: '600', marginBottom: '2px' }}>KEY RELIEF DEMANDS:</span>
                    <span style={{ color: '#38bdf8' }}>{d.requiredResources}</span>
                  </div>
                )}

                {d.urgentInstructions && (
                  <div style={{ fontSize: '11px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', padding: '8px', borderRadius: '4px', color: '#fca5a5' }}>
                    <strong>Directives:</strong> {d.urgentInstructions}
                  </div>
                )}

                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Status: <strong style={{ color: '#10b981' }}>{d.status}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenBroadcast(d)}
                      title="Issue official directive for this disaster"
                    >
                      <Megaphone size={13} />
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDeleteDisaster(d.id, d.name)}
                      title="Archive disaster"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Directives Table */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} color="#38bdf8" />
            <h3 style={{ margin: 0, fontSize: '15px' }}>Active Emergency Operational Directives</h3>
          </div>
          <span className="badge badge-info">{instructions.length} directives issued</span>
        </div>

        <div style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Directive Title</th>
                <th>Instruction Content</th>
                <th>Target</th>
                <th>Author</th>
                <th>Disaster Ref</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {instructions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No broadcast directives recorded.
                  </td>
                </tr>
              ) : (
                instructions.map((inst) => (
                  <tr key={inst.id}>
                    <td>
                      <span className={`badge ${inst.priority === 'URGENT' ? 'badge-danger' : inst.priority === 'SAFETY_ALERT' ? 'badge-warning' : 'badge-info'}`}>
                        {inst.priority}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: '#f8fafc' }}>{inst.title}</td>
                    <td style={{ maxWidth: '320px', fontSize: '12px', color: '#cbd5e1' }}>{inst.content}</td>
                    <td><span className="badge badge-secondary">{inst.targetAudience || 'ALL'}</span></td>
                    <td style={{ fontSize: '12px' }}>{inst.authorName || 'Commander'}</td>
                    <td>{inst.disasterName || 'All Sectors'}</td>
                    <td style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {inst.createdAt ? new Date(inst.createdAt).toLocaleString() : 'Active'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Disaster Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px',
            width: '100%', maxWidth: '520px', padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#f8fafc', fontSize: '16px' }}>Declare Emergency Disaster Event</h3>
            <form onSubmit={handleCreateDisaster}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Disaster Name / Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cyclone Vardah Coastal Strike"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Event Type *
                  </label>
                  <select
                    value={disasterType}
                    onChange={(e) => setDisasterType(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="CYCLONE">Cyclone / Hurricane</option>
                    <option value="FLOOD">Flash Flood / Inundation</option>
                    <option value="EARTHQUAKE">Earthquake</option>
                    <option value="LANDSLIDE">Landslide / Mudflow</option>
                    <option value="WILDFIRE">Wildfire / Heatwave</option>
                    <option value="OTHER">Other Disaster Emergency</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Severity Level *
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="CRITICAL">Critical (Immediate Life Hazard)</option>
                    <option value="HIGH">High (Severe Impact)</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="LOW">Low (Monitoring)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Affected Geographic Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={affectedLocation}
                    onChange={(e) => setAffectedLocation(e.target.value)}
                    placeholder="e.g. Coastal District Sector 4"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Affected Population
                  </label>
                  <input
                    type="number"
                    value={estimatedPopulation}
                    onChange={(e) => setEstimatedPopulation(e.target.value)}
                    placeholder="25000"
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Key Required Resources
                </label>
                <input
                  type="text"
                  value={requiredResources}
                  onChange={(e) => setRequiredResources(e.target.value)}
                  placeholder="e.g. Food Rations, Water Purification, Blanket Units"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Urgent Tactical Instructions
                </label>
                <textarea
                  rows={2}
                  value={urgentInstructions}
                  onChange={(e) => setUrgentInstructions(e.target.value)}
                  placeholder="e.g. Prioritize high-ground transit corridors; avoid river crossings."
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Declare Disaster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px',
            width: '100%', maxWidth: '480px', padding: '24px'
          }}>
            <h3 style={{ margin: '0 0 16px', color: '#f8fafc', fontSize: '16px' }}>Broadcast Operational Directive</h3>
            <form onSubmit={handleSendBroadcast}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Directive Title *
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. FLASH FLOOD ROAD CLOSURE ADVISORY"
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Priority *
                  </label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="URGENT">URGENT (Red Alert)</option>
                    <option value="SAFETY_ALERT">SAFETY ALERT (Amber)</option>
                    <option value="PROTOCOL">STANDARD PROTOCOL</option>
                    <option value="ROUTINE">ROUTINE UPDATE</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                  >
                    <option value="ALL">All Responders</option>
                    <option value="DRIVERS">Logistics Drivers</option>
                    <option value="ZONE_LEADS">Zone Coordinators</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#cbd5e1', marginBottom: '4px' }}>
                  Directive Content *
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder="Specify routes to avoid, PPE protocols, or immediate rerouting instructions..."
                  style={{ width: '100%', padding: '8px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBroadcastModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} />
                  <span>Transmit Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
