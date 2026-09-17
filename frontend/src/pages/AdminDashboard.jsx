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
  X
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

  // Find the most critical pending incident
  const urgentIncident = data?.recentIncidents?.find(i => i.status === 'Pending') || data?.recentIncidents?.[0];

  return (
    <div className="content-body" style={{ padding: '24px', margin: '0 auto', maxWidth: '1200px', paddingBottom: '80px' }}>
      
      {/* Main Action Card */}
      <div style={{ 
        background: 'var(--card-bg)',
        borderRadius: '20px', 
        padding: '24px', 
        marginBottom: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-main)' }}>
          <ShieldAlert size={22} color="var(--primary-color)" />
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>{t('activeDispatch')}</h2>
        </div>
        
        {urgentIncident ? (
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '18px' }}>{urgentIncident.type}</span>
              {urgentIncident.status === 'Pending' ? (
                <span style={{ fontSize: '13px', background: '#fef2f2', color: '#dc2626', padding: '4px 12px', borderRadius: '8px', fontWeight: '700' }}>URGENT: {urgentIncident.status}</span>
              ) : (
                <span style={{ fontSize: '13px', background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '8px', fontWeight: '700' }}>{urgentIncident.status}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>
              <MapPin size={16} color="var(--text-muted)" /> {urgentIncident.location_address || t('gpsLocationOnly') || 'Coordinates Only (Map)'}
            </div>
          </div>
        ) : (
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '16px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: '600', border: '1px dashed #cbd5e1' }}>
            {t('noActiveEmergencies')}
          </div>
        )}

        <button 
          onClick={() => navigate(urgentIncident ? `/incidents/${urgentIncident.id}` : '/incidents')}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            background: urgentIncident?.status === 'Pending' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'var(--card-bg)',
            color: urgentIncident?.status === 'Pending' ? 'white' : 'var(--primary-color)',
            border: urgentIncident?.status === 'Pending' ? 'none' : '2px solid var(--primary-color)',
            fontSize: '16px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: urgentIncident?.status === 'Pending' ? '0 8px 24px rgba(239, 68, 68, 0.3)' : 'none',
            transition: 'transform 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {urgentIncident?.status === 'Pending' ? t('respondToAlert') : t('viewAllIncidents')}
        </button>
      </div>

      {/* 2x2 Vibrant Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* Pending */}
        <div 
          onClick={() => navigate('/incidents')}
          style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
            padding: '24px', 
            borderRadius: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            color: 'white'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(239, 68, 68, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.3)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{data?.metrics?.pendingReports || 0}</span>
            <AlertTriangle size={24} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{t('pendingStatus')}</span>
        </div>

        {/* En Route / Progress */}
        <div 
          onClick={() => navigate('/incidents')}
          style={{ 
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
            padding: '24px', 
            borderRadius: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            color: 'white'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.3)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{data?.metrics?.activeIncidents || 0}</span>
            <Truck size={24} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{t('enRoute')}</span>
        </div>

        {/* Resolved */}
        <div 
          onClick={() => navigate('/incidents')}
          style={{ 
            background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', 
            padding: '24px', 
            borderRadius: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(34, 197, 94, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            color: 'white'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(34, 197, 94, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.3)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{data?.metrics?.resolvedReports || 0}</span>
            <CheckCircle size={24} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{t('resolvedToday')}</span>
        </div>

        {/* Active Responders */}
        <div 
          onClick={() => navigate('/responders')}
          style={{ 
            background: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', 
            padding: '24px', 
            borderRadius: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(100, 116, 139, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            color: 'white'
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(100, 116, 139, 0.4)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(100, 116, 139, 0.3)';
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{data?.metrics?.respondersOnDuty || 0}</span>
            <Users size={24} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{t('respondersCount')}</span>
        </div>
        
      </div>

      {/* Command Map Widget */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="var(--primary-color)" /> Live Operations Map
        </h3>
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <CommandMap isWidget={true} />
        </div>
      </div>

      {/* Fleet Management & Quick Actions */}
      {user?.role === 'Admin' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/admin-vehicles')}
            style={{
              background: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '16px',
              color: 'var(--text-main)',
              fontSize: '16px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '10px' }}><Truck size={20} color="#3b82f6" /></div>
            FLEET MANAGEMENT
          </button>
          
          <button
            onClick={() => navigate('/admin-analytics')}
            style={{
              background: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '16px',
              color: 'var(--text-main)',
              fontSize: '16px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '10px' }}><BarChart3 size={20} color="#ef4444" /></div>
            INCIDENT ANALYTICS
          </button>
          
          <button 
            onClick={() => setShowBroadcastModal(true)}
            style={{ 
              background: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '16px',
              color: 'var(--text-main)',
              fontSize: '16px',
              fontWeight: '800',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ background: '#fef3c7', padding: '10px', borderRadius: '10px' }}><Radio size={20} color="#d97706" /></div>
            MASS BROADCAST
          </button>
          
          <button 
            onClick={() => setShowEvacModal(true)}
            style={{ 
              background: 'var(--card-bg)',
              padding: '20px',
              borderRadius: '16px',
              color: 'var(--text-main)',
              fontSize: '16px',
              fontWeight: '800',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px',
              cursor: 'pointer',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ background: '#fdf4ff', padding: '10px', borderRadius: '10px' }}><Bell size={20} color="#c026d3" /></div>
            GEOFENCE ALERT
          </button>
        </div>
      )}

      {/* Responder Duty Toggle */}
      {user?.role === 'Responder' && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleDutyToggle}
            disabled={togglingDuty}
            style={{
              width: '100%',
              padding: '20px',
              borderRadius: '16px',
              border: 'none',
              background: user.is_on_duty === 1 ? 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' : '#e2e8f0',
              color: user.is_on_duty === 1 ? 'white' : '#64748b',
              fontSize: '18px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: user.is_on_duty === 1 ? '0 8px 24px rgba(34, 197, 94, 0.3)' : 'none'
            }}
          >
            <Power size={24} />
            {togglingDuty ? 'UPDATING STATUS...' : (user.is_on_duty === 1 ? 'ON DUTY - RECEIVING ALERTS' : 'OFF DUTY - NOTIFICATIONS PAUSED')}
          </button>
        </div>
      )}

      {/* Call Logs & Lifetime Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--primary-color)" /> {t('systemOverview')}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '12px', background: '#e0e7ff', borderRadius: '12px', color: '#4338ca' }}>
              <AlertTriangle size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{t('totalLifetimeReports') || 'Lifetime Reports'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600' }}>{t('sinceLaunch') || 'Since launch'}</div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>{data?.metrics?.totalReports || 0}</div>
          </div>
        </div>

        {user?.role === 'Admin' && data?.recentCallLogs && data.recentCallLogs.length > 0 && (
          <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '18px', color: 'var(--text-main)', marginBottom: '16px' }}>
              <PhoneCall size={20} color="#2563eb" /> {t('recentHotlineCalls') || 'Recent Hotline Calls'}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.recentCallLogs.slice(0, 5).map((log) => (
                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #2563eb', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{log.hotline_name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                      <Clock size={12} /> {new Date(log.called_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>
                    Dialed <strong style={{ color: 'var(--text-main)' }}>{log.hotline_number}</strong> by <strong style={{ color: 'var(--text-main)' }}>{log.caller_name}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Premium Glassmorphic Broadcast Modal */}
      {showBroadcastModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card-bg)', width: '90%', maxWidth: '440px', padding: '32px', borderRadius: '24px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '12px', color: '#dc2626' }}>
                  <Radio size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px', fontWeight: '800' }}>Mass Broadcast</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>
                    Send an instant push notification to all users.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)} 
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}
              >
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleBroadcast}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Alert Title</label>
                <input 
                  type="text" 
                  required 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="e.g. TYPHOON WARNING" 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', fontSize: '15px', fontWeight: '600' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Message Content</label>
                <textarea 
                  required 
                  rows="4" 
                  value={broadcastMessage} 
                  onChange={e => setBroadcastMessage(e.target.value)} 
                  placeholder="Type emergency instructions here..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', fontSize: '15px', resize: 'vertical' }}
                ></textarea>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: 'var(--text-main)', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }} onClick={() => setShowBroadcastModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#dc2626', border: 'none', color: 'white', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={broadcasting}>
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

      {/* Geofence Evacuation Modal (Ensure it renders if showEvacModal is true) */}
      {showEvacModal && (
        <GeofenceModal 
          onClose={() => setShowEvacModal(false)} 
          onSend={handleEvacBroadcast} 
        />
      )}

    </div>
  );
};

// Mock CheckCircle since it wasn't originally imported but we use it for the stats
const CheckCircle = ({ size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default AdminDashboard;
