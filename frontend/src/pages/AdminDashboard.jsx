import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  MapPin, 
  ShieldAlert, 
  AlertTriangle,
  PhoneCall,
  Clock,
  Radio,
  Power,
  Truck,
  BarChart3,
  Users,
  Activity,
  X,
  CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import GeofenceModal from '../components/GeofenceModal';
import CommandMap from './CommandMap';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showEvacModal, setShowEvacModal] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get('/api/dashboard/stats');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    const interval = setInterval(fetchDashboardStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    setBroadcasting(true);
    try {
      await axios.post('/api/notifications/broadcast', {
        title: broadcastTitle,
        message: broadcastMessage
      });
      alert('Broadcast sent successfully!');
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (err) {
      console.error(err);
      alert('Failed to send broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleEvacBroadcast = async (evacData) => {
    try {
      const res = await axios.post('/api/notifications/broadcast-evacuation', evacData);
      alert(`Evacuation alert sent to ${res.data.target_users} users in the area!`);
      setShowEvacModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to send evacuation broadcast.');
    }
  };

  const handleDutyToggle = async () => {
    if (togglingDuty) return;
    setTogglingDuty(true);
    try {
      const newStatus = user.is_on_duty === 1 ? 0 : 1;
      await axios.put('/api/auth/duty', { is_on_duty: newStatus });
      setUser(prev => ({ ...prev, is_on_duty: newStatus }));
    } catch (err) {
      console.error('Duty toggle error', err);
      alert('Failed to update duty status.');
    } finally {
      setTogglingDuty(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        {t('loadingCommandCenter')}
      </div>
    );
  }

  return (
    <div className="tactical-dark-theme">
      {/* Tier 1: Tactical Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        
        {/* Active Incidents */}
        <div className="tac-metric-card tac-metric-red" onClick={() => navigate('/incidents')} style={{ cursor: 'pointer' }}>
          <div className="tac-metric-title">
            <span>Active Incidents</span>
            <AlertTriangle size={16} color="var(--tac-red)" />
          </div>
          <div>
            <div className="tac-metric-value">{data?.metrics?.activeIncidents || 0}</div>
            <div className="tac-metric-sub">Requires immediate attention</div>
          </div>
        </div>

        {/* Units En Route */}
        <div className="tac-metric-card tac-metric-blue" onClick={() => navigate('/responders')} style={{ cursor: 'pointer' }}>
          <div className="tac-metric-title">
            <span>Units En Route</span>
            <Radio size={16} color="var(--tac-blue)" />
          </div>
          <div>
            <div className="tac-metric-value">{data?.metrics?.respondersOnDuty || 0}</div>
            <div className="tac-metric-sub">Active field personnel</div>
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="tac-metric-card tac-metric-teal">
          <div className="tac-metric-title">
            <span>Avg Response Time</span>
            <Clock size={16} color="var(--tac-teal)" />
          </div>
          <div>
            <div className="tac-metric-value">4.2m</div>
            <div className="tac-metric-sub">Last 24 hours</div>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="tac-metric-card tac-metric-green" onClick={() => navigate('/incidents')} style={{ cursor: 'pointer' }}>
          <div className="tac-metric-title">
            <span>Resolved Today</span>
            <CheckCircle size={16} color="var(--tac-green)" />
          </div>
          <div>
            <div className="tac-metric-value">{data?.metrics?.resolvedReports || 0}</div>
            <div className="tac-metric-sub">Successfully closed cases</div>
          </div>
        </div>
      </div>

      {/* Tier 2: Asymmetric Map & Analytics Grid */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {/* Left: Command Map */}
        <div style={{ flex: '3', minWidth: '60%' }}>
          <div className="tac-panel" style={{ padding: '0', overflow: 'hidden', height: '450px' }}>
             <CommandMap isWidget={true} />
          </div>
        </div>

        {/* Right: Analytics Panels */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="tac-panel" style={{ flex: 1 }}>
            <div className="tac-panel-title">By Type <span style={{ color: 'var(--tac-text-muted)', fontWeight: 400, fontSize: '11px' }}>Last 24h</span></div>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tac-red)' }}></div> Medical</span>
                  <span>45%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <div style={{ width: '45%', height: '100%', background: 'var(--tac-red)', borderRadius: '2px', boxShadow: '0 0 8px var(--tac-red-glow)' }}></div>
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tac-orange)' }}></div> Fire</span>
                  <span>30%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <div style={{ width: '30%', height: '100%', background: 'var(--tac-orange)', borderRadius: '2px', boxShadow: '0 0 8px var(--tac-orange-glow)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--tac-blue)' }}></div> Police</span>
                  <span>25%</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <div style={{ width: '25%', height: '100%', background: 'var(--tac-blue)', borderRadius: '2px', boxShadow: '0 0 8px var(--tac-blue-glow)' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="tac-panel" style={{ flex: 1 }}>
            <div className="tac-panel-title">System Status <span style={{ color: 'var(--tac-green)', fontWeight: 400, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--tac-green)', boxShadow: '0 0 8px var(--tac-green-glow)' }}></div> ONLINE</span></div>
            <div style={{ marginTop: '20px' }}>
               <div style={{ fontSize: '32px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{data?.metrics?.totalReports || 0}</div>
               <div style={{ fontSize: '11px', color: 'var(--tac-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '6px 0 16px 0' }}>Total Lifetime Incidents</div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              <button onClick={() => setShowBroadcastModal(true)} style={{ width: '100%', padding: '12px', background: 'rgba(59,130,246,0.1)', border: '1px solid var(--tac-blue-glow)', color: 'var(--tac-blue)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Radio size={16} /> Broadcast Alert
              </button>
              <button onClick={handleDutyToggle} style={{ width: '100%', padding: '12px', background: user?.is_on_duty ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${user?.is_on_duty ? 'var(--tac-green-glow)' : 'var(--tac-red-glow)'}`, color: user?.is_on_duty ? 'var(--tac-green)' : 'var(--tac-red)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Power size={16} /> {user?.is_on_duty ? 'Go Off Duty' : 'Go On Duty'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tier 3: Recent Incidents Table */}
      <div className="tac-panel" style={{ overflowX: 'auto', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div className="tac-panel-title" style={{ margin: 0 }}>Recent Incidents</div>
          <Link to="/incidents" style={{ color: 'var(--tac-blue)', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>Full queue &gt;</Link>
        </div>
        
        <table className="tac-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Location</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {(data?.recentIncidents || []).slice(0, 5).map(inc => {
              const typeLower = inc.type.toLowerCase();
              let badgeClass = 'medium';
              if (typeLower.includes('fire') || typeLower.includes('sos')) badgeClass = 'critical';
              else if (typeLower.includes('accident') || typeLower.includes('crime')) badgeClass = 'high';
              else if (typeLower.includes('medical')) badgeClass = 'high';
              else if (typeLower.includes('rescue')) badgeClass = 'medium';
              
              return (
                <tr key={inc.id}>
                  <td className="tac-code">{inc.code}</td>
                  <td style={{ fontWeight: 600 }}>{inc.type}</td>
                  <td><span className={`tac-badge ${badgeClass}`}>{badgeClass === 'critical' ? 'High' : (badgeClass === 'high' ? 'High' : 'Med')}</span></td>
                  <td style={{ color: 'var(--tac-text-muted)' }}>{inc.location_address ? inc.location_address.split(',')[0] : 'GPS Coordinates'}</td>
                  <td style={{ color: inc.status === 'Resolved' ? 'var(--tac-text-muted)' : 'var(--tac-blue)' }}>{inc.status}</td>
                  <td style={{ color: 'var(--tac-text-muted)', fontSize: '12px' }}>{new Date(inc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                </tr>
              );
            })}
            {(!data?.recentIncidents || data.recentIncidents.length === 0) && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--tac-text-muted)' }}>No recent incidents</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Glassmorphic Broadcast Modal */}
      {showBroadcastModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 15, 25, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--tac-card)', width: '90%', maxWidth: '440px', padding: '32px', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', border: '1px solid var(--tac-border)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '12px', color: 'var(--tac-red)', border: '1px solid var(--tac-red-glow)' }}>
                  <Radio size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '800' }}>Mass Broadcast</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--tac-text-muted)', fontWeight: '500' }}>
                    Send an instant push notification to all users.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)} 
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tac-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleBroadcast}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--tac-text-muted)' }}>Alert Title</label>
                <input 
                  type="text" 
                  required 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="e.g. TYPHOON WARNING" 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--tac-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '15px', fontWeight: '600' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--tac-text-muted)' }}>Message Content</label>
                <textarea 
                  required 
                  rows="4" 
                  value={broadcastMessage} 
                  onChange={e => setBroadcastMessage(e.target.value)} 
                  placeholder="Type emergency instructions here..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--tac-border)', background: 'rgba(0,0,0,0.2)', color: 'white', fontSize: '15px', resize: 'vertical' }}
                ></textarea>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }} onClick={() => setShowBroadcastModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--tac-red)', border: 'none', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 0 16px var(--tac-red-glow)' }} disabled={broadcasting}>
                  {broadcasting ? (
                    <><div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> Sending...</>
                  ) : (
                    <>SEND ALERT</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Geofence Evacuation Modal */}
      {showEvacModal && (
        <GeofenceModal 
          onClose={() => setShowEvacModal(false)} 
          onSend={handleEvacBroadcast} 
        />
      )}

    </div>
  );
};

export default AdminDashboard;
