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
  Radio
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSystem } from '../context/SystemContext';
import GeofenceModal from '../components/GeofenceModal';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showEvacModal, setShowEvacModal] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const navigate = useNavigate();
  const { settings, updateSetting } = useSystem();
  const isMciActive = settings?.mci_mode;

  const toggleMciMode = async () => {
    if (window.confirm(isMciActive ? "Deactivate Mass Casualty Incident (MCI) Mode?" : "WARNING: Activate Mass Casualty Incident (MCI) Mode? This is only for extreme emergencies!")) {
      try {
        await updateSetting('mci_mode', !isMciActive);
      } catch (e) {
        alert("Failed to toggle MCI Mode");
      }
    }
  };

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

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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

  if (loading && !data) {
    return <div className="content-body" style={{ color: 'var(--text-light)', padding: '20px' }}>{t('loadingCommandCenter')}</div>;
  }

  // Find the most critical pending incident
  const urgentIncident = data?.recentIncidents?.find(i => i.status === 'Pending') || data?.recentIncidents?.[0];

  return (
    <div className="content-body" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Custom Mobile Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', color: 'var(--text-main)', lineHeight: '1.2' }}>
            {user?.role === 'Admin' ? t('commandCenter') : t('responderActive')}
          </h1>
          <p style={{ margin: '0', color: 'var(--text-light)', fontSize: '14px' }}>
            {t('welcomePrefix')} {user?.full_name?.split(' ')[0]}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/incidents" style={{ color: 'var(--text-light)', position: 'relative' }}>
            <Bell size={24} />
            {data?.metrics?.pendingReports > 0 && (
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--primary-color)', borderRadius: '50%' }}></span>
            )}
          </Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--warning-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              {getInitials(user?.full_name)}
            </div>
          </Link>
        </div>
      </div>

        {user?.role === 'Admin' && (
          <div style={{ marginBottom: '24px' }}>
            <button 
              onClick={toggleMciMode}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: isMciActive ? '#c0392b' : '#34495e',
                color: 'white',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                animation: isMciActive ? 'pulse 2s infinite' : 'none',
                cursor: 'pointer'
              }}
            >
              <ShieldAlert size={20} />
              {isMciActive ? 'DEACTIVATE MCI MODE' : 'ACTIVATE MCI MODE'}
            </button>
          </div>
        )}

      {/* Hero Action Card (Replaces SOS for Responders) */}
      <div style={{ 
        backgroundColor: 'var(--card-alt)', 
        borderRadius: '20px', 
        padding: '25px 20px', 
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: 'var(--text-main)' }}>
          <ShieldAlert size={20} color="var(--primary-color)" />
          <h2 style={{ fontSize: '16px', margin: 0 }}>{t('activeDispatch')}</h2>
        </div>
        
        {urgentIncident ? (
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '16px' }}>{urgentIncident.type}</span>
              <span style={{ fontSize: '12px', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '4px' }}>{urgentIncident.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-light)', fontSize: '13px' }}>
              <MapPin size={14} /> {urgentIncident.location_address || t('gpsLocationOnly') || 'Coordinates Only (Map)'}
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: '12px', marginBottom: '15px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {t('noActiveEmergencies')}
          </div>
        )}

        <button 
          onClick={() => navigate(urgentIncident ? `/incidents/${urgentIncident.id}` : '/incidents')}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            backgroundColor: urgentIncident?.status === 'Pending' ? 'var(--primary-color)' : 'var(--info-color)',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {urgentIncident?.status === 'Pending' ? t('respondToAlert') : t('viewAllIncidents')}
        </button>

        {/* Geofence Evacuation Modal */}
        {showEvacModal && (
          <GeofenceModal 
            onClose={() => setShowEvacModal(false)} 
            onSend={handleEvacBroadcast} 
          />
        )}
      </div>

      {/* 2x2 Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        
        {/* Pending */}
        <Link to="/incidents" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#fdf2f2', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px', border: '1px solid #fadbd8' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger-color)', lineHeight: '1' }}>{data?.metrics?.pendingReports || 0}</span>
            <span style={{ fontSize: '14px', color: 'var(--danger-color)', fontWeight: '500' }}>{t('pendingStatus')}</span>
          </div>
        </Link>

        {/* En Route / Progress */}
        <Link to="/incidents" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--info-color)', lineHeight: '1' }}>{data?.metrics?.activeIncidents || 0}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>{t('enRoute')}</span>
          </div>
        </Link>

        {/* Resolved */}
        <Link to="/incidents" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--success-color)', lineHeight: '1' }}>{data?.metrics?.resolvedReports || 0}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>{t('resolvedToday')}</span>
          </div>
        </Link>

        {/* Active Responders */}
        <Link to="/responders" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{data?.metrics?.respondersOnDuty || 0}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>{t('respondersCount')}</span>
          </div>
        </Link>
        
      </div>

      {/* Quick Actions */}
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>{t('systemOverview')}</div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-color)', borderRadius: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--primary-light)', borderRadius: '8px', color: 'var(--primary-color)' }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{t('totalLifetimeReports') || 'Lifetime Reports'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{t('sinceLaunch') || 'Since launch'}</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{data?.metrics?.totalReports || 0}</div>
        </div>
        
        {user?.role === 'Admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
            <button 
              onClick={() => setShowBroadcastModal(true)}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            >
              <Radio size={18} /> Mass Broadcast
            </button>
            <button 
              onClick={() => setShowEvacModal(true)}
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#e67e22', border: 'none' }}
            >
              <MapPin size={18} /> Geofence Evacuation
            </button>
          </div>
        )}
      </div>

      {/* Call Logs */}
      {user?.role === 'Admin' && data?.recentCallLogs && data.recentCallLogs.length > 0 && (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>
            <PhoneCall size={18} color="var(--primary-color)" /> {t('recentHotlineCalls') || 'Recent Hotline Calls'}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.recentCallLogs.slice(0, 5).map((log) => (
              <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', background: 'var(--bg-color)', borderRadius: '10px', borderLeft: '3px solid var(--primary-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{log.hotline_name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {new Date(log.called_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                  Dialed <strong>{log.hotline_number}</strong> by <strong>{log.caller_name}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)' }}>
                <Radio size={20} /> Mass Broadcast
              </h3>
              <button onClick={() => setShowBroadcastModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-light)' }}>&times;</button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '16px' }}>
              Warning: This will send an instant push notification to ALL registered users.
            </p>
            <form onSubmit={handleBroadcast}>
              <div className="form-group">
                <label className="form-label">Alert Title</label>
                <input type="text" className="form-input" required value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} placeholder="e.g. TYPHOON WARNING" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-input" required rows="3" value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} placeholder="Type emergency message here..."></textarea>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowBroadcastModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, backgroundColor: 'var(--danger-color)' }} disabled={broadcasting}>
                  {broadcasting ? 'Sending...' : 'SEND ALERT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
