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
  Ambulance,
  BarChart3,
  Users,
  Activity,
  X,
  Map,
  ClipboardList,
  CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import CommandMap from './CommandMap';

const NDRRMC_PRESETS = [
  {
    label: '🔴 Red Rainfall / Flood',
    severity: 'extreme',
    title: 'RED RAINFALL WARNING & FLASH FLOOD ADVISORY',
    area: 'Municipality of Jamindan (Low-lying & Riverbank Barangays)',
    message: 'Torrential rainfall observed due to severe weather disturbance. Severe flooding and river overflow are expected. Residents in low-lying and landslide-prone areas must evacuate immediately to designated evacuation centers or higher ground. Keep hotlines on standby.'
  },
  {
    label: '🌀 Typhoon Signal No. 3',
    severity: 'extreme',
    title: 'TROPICAL CYCLONE WARNING: SIGNAL NO. 3',
    area: 'Municipality of Jamindan (All Barangays)',
    message: 'Destructive typhoon-force winds and heavy torrential rains expected within 18 hours. Secure dwellings, prepare emergency go-bags, and complete pre-emptive evacuation before nightfall. Stay tuned to MDRRMO Jamindan operations.'
  },
  {
    label: '🚨 Evacuation Order',
    severity: 'severe',
    title: 'MANDATORY EVACUATION ORDER',
    area: 'Barangays Pangabuan, Jaena Norte, Agambulong, Guibuangan',
    message: 'MDRRMO Jamindan orders mandatory pre-emptive evacuation due to critical water level rise and landslide threat. Barangay DRRM committees and rescue vehicles are deployed. Move immediately to municipal evacuation centers.'
  },
  {
    label: '🌧️ Weather Advisory',
    severity: 'advisory',
    title: 'THUNDERSTORM & HEAVY RAIN ADVISORY',
    area: 'Municipality of Jamindan (All Barangays)',
    message: 'Moderate to heavy rainshowers with lightning and strong winds expected over Jamindan. Residents are advised to take precautionary measures against localized flash floods and avoid crossing swollen creeks.'
  }
];

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [safetyData, setSafetyData] = useState({ summary: { safeCount: 0, evacuatedCount: 0, needsHelpCount: 0 }, recentCheckins: [] });
  const [safetyFilter, setSafetyFilter] = useState('All');
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetySearch, setSafetySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingDuty, setTogglingDuty] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSeverity, setBroadcastSeverity] = useState('extreme');
  const [broadcastArea, setBroadcastArea] = useState('Municipality of Jamindan (All Barangays)');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const navigate = useNavigate();

  const handleMarkResidentSafe = async (checkinId) => {
    try {
      await axios.put(`/api/notifications/safety-checkins/${checkinId}/status`, { status: 'Safe' });
      fetchDashboardStats();
    } catch (err) {
      console.error('Failed to update resident status', err);
      alert('Failed to update resident safety status.');
    }
  };

  const handleSelectPreset = (preset) => {
    setBroadcastTitle(preset.title);
    setBroadcastMessage(preset.message);
    setBroadcastSeverity(preset.severity);
    setBroadcastArea(preset.area);
  };

  const fetchDashboardStats = async () => {
    try {
      const [res, safetyRes] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/notifications/safety-checkins').catch(() => ({ data: null }))
      ]);
      setData(res.data);
      if (safetyRes.data) {
        setSafetyData(safetyRes.data);
      }
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
        message: broadcastMessage,
        severity: broadcastSeverity,
        target_area: broadcastArea
      });
      alert('NDRRMC Emergency Alert transmitted successfully to all resident devices!');
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastSeverity('extreme');
      setBroadcastArea('Municipality of Jamindan (All Barangays)');
    } catch (err) {
      console.error(err);
      alert('Failed to send broadcast.');
    } finally {
      setBroadcasting(false);
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
    <div className="content-body" style={{ padding: '24px', margin: '0 auto', maxWidth: '1200px', paddingBottom: '80px' }}>

      {/* Admin Exclusive: Top Metrics */}
      {user?.role === 'Admin' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Pending */}
        <div 
          onClick={() => navigate('/incidents')}
          style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', 
            padding: '16px', 
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
            padding: '16px', 
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
            <Ambulance size={24} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{t('enRoute')}</span>
        </div>

        {/* Resolved */}
        <div 
          onClick={() => navigate('/incidents')}
          style={{ 
            background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)', 
            padding: '16px', 
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
            <span style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>
              {data?.metrics?.resolvedToday ?? data?.metrics?.resolvedReports ?? 0}
            </span>
            <CheckCircle size={24} color="rgba(255,255,255,0.7)" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>{t('resolvedToday')}</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: '-4px' }}>
            {data?.metrics?.totalResolved || 0} total resolved
          </span>
        </div>

        {/* Active Responders */}
        <div 
          onClick={() => navigate('/responders')}
          style={{ 
            background: 'linear-gradient(135deg, #64748b 0%, #334155 100%)', 
            padding: '16px', 
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
      </>
      )}

      {/* Command Map Widget */}
      {user?.role === 'Admin' && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="var(--primary-color)" /> {t('liveCommandMap')}
        </h3>
        <div style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <CommandMap isWidget={true} />
        </div>
        </div>
      )}

      {/* {t('fleetManagement')} & Quick Actions */}
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
            {t('fleetManagement')}
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
            {t('incidentAnalytics')}
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
            {t('massBroadcast')}
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
            {togglingDuty ? t('updatingStatus') : (user.is_on_duty === 1 ? t('onDutyToggle') : t('offDuty'))}
          </button>
        </div>
      )}

      {/* Admin Call Logs, Resident Safety Check-In Monitor & Lifetime Stats */}
      {user?.role === 'Admin' && (
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

          {/* Resident Safety Check-In Monitor */}
          <div style={{ background: 'var(--card-bg)', padding: '22px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={19} color="#059669" /> Resident Safety Check-In
              </div>
              {safetyData?.recentCheckins?.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSafetyModal(true)}
                  style={{
                    background: 'var(--card-alt)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--primary-color)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  View All ({safetyData.recentCheckins.length})
                </button>
              )}
            </div>

            {/* Interactive Filter Stat Boxes (Click to filter by status) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setSafetyFilter(prev => prev === 'Safe' ? 'All' : 'Safe')}
                style={{
                  background: '#ecfdf5',
                  border: safetyFilter === 'Safe' ? '2px solid #059669' : '1px solid #a7f3d0',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                title="Click to filter Safe residents"
              >
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#059669' }}>{safetyData?.summary?.safeCount || 0}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#065f46' }}>✅ Safe</div>
              </button>

              <button
                type="button"
                onClick={() => setSafetyFilter(prev => prev === 'At Evacuation Center' ? 'All' : 'At Evacuation Center')}
                style={{
                  background: '#eff6ff',
                  border: safetyFilter === 'At Evacuation Center' ? '2px solid #2563eb' : '1px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                title="Click to filter Evacuated residents"
              >
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563eb' }}>{safetyData?.summary?.evacuatedCount || 0}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e40af' }}>🏛️ Evacuated</div>
              </button>

              <button
                type="button"
                onClick={() => setSafetyFilter(prev => prev === 'Needs Assistance' ? 'All' : 'Needs Assistance')}
                style={{
                  background: '#fef2f2',
                  border: safetyFilter === 'Needs Assistance' ? '2px solid #dc2626' : '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '10px 6px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
                title="Click to filter residents who Need Help"
              >
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{safetyData?.summary?.needsHelpCount || 0}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#991b1b' }}>🆘 Needs Help</div>
              </button>
            </div>

            {safetyFilter !== 'All' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Filtering: <strong>{safetyFilter}</strong></span>
                <button type="button" onClick={() => setSafetyFilter('All')} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}>
                  Show All
                </button>
              </div>
            )}

            {(() => {
              const filteredList = (safetyData?.recentCheckins || []).filter(item =>
                safetyFilter === 'All' ? true : item.status === safetyFilter
              );

              if (filteredList.length === 0) {
                return (
                  <div style={{ fontSize: '12px', color: 'var(--text-light)', textAlign: 'center', padding: '16px 0' }}>
                    {safetyFilter === 'All' ? 'No resident check-ins recorded yet.' : `No residents currently marked as "${safetyFilter}".`}
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', paddingRight: '2px' }}>
                  {filteredList.map(item => {
                    const isNeedsHelp = item.status === 'Needs Assistance';
                    const isEvac = item.status === 'At Evacuation Center';
                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: isNeedsHelp ? 'rgba(239, 68, 68, 0.06)' : 'var(--card-alt)',
                          border: `1px solid ${isNeedsHelp ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.full_name} <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>({item.barangay})</span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <a href={`tel:${item.phone}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '700' }}>
                              📞 {item.phone}
                            </a>
                            <span>• {new Date(item.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '800',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            whiteSpace: 'nowrap',
                            backgroundColor: item.status === 'Safe' ? '#d1fae5' : isEvac ? '#dbeafe' : '#dc2626',
                            color: item.status === 'Safe' ? '#065f46' : isEvac ? '#1e40af' : '#fff'
                          }}>
                            {isNeedsHelp ? '🆘 Needs Help' : isEvac ? '🏛️ Evacuated' : '✅ Safe'}
                          </span>

                          {isNeedsHelp && (
                            <button
                              type="button"
                              onClick={() => handleMarkResidentSafe(item.id)}
                              title="Mark as Assisted / Safe"
                              style={{
                                backgroundColor: '#059669',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '10px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ✓ Assisted
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {data?.recentCallLogs && data.recentCallLogs.length > 0 && (
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
                      {t('dialedWord')} <strong style={{ color: 'var(--text-main)' }}>{log.hotline_number}</strong> {t('byWord')} <strong style={{ color: 'var(--text-main)' }}>{log.caller_name}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Responder Live Dispatches */}
      {user?.role === 'Responder' && (
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-main)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#ef4444" /> {t('liveEmergencies')}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.recentIncidents?.filter(inc => inc.status !== 'Resolved').length > 0 ? (
              data.recentIncidents.filter(inc => inc.status !== 'Resolved').map(inc => (
                <button
                  key={inc.id}
                  onClick={() => navigate('/incidents/' + inc.id)}
                  style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #cbd5e1', background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', backgroundColor: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>{inc.type}</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#3b82f6' }}>{inc.code}</span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '2px' }}>{inc.location_address || t('gpsLocation')}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{inc.status} • {new Date(inc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                  </div>
                  <div style={{ padding: '10px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <MapPin size={20} color="#3b82f6" />
                  </div>
                </button>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '15px', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ShieldAlert size={32} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                <div>No active emergencies right now.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium NDRRMC Emergency Broadcast Modal */}
      {showBroadcastModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--card-bg)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', borderRadius: '24px', boxShadow: '0 24px 60px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  background: broadcastSeverity === 'extreme' ? '#fee2e2' : (broadcastSeverity === 'severe' ? '#ffedd5' : '#dbeafe'), 
                  padding: '12px', 
                  borderRadius: '14px', 
                  color: broadcastSeverity === 'extreme' ? '#dc2626' : (broadcastSeverity === 'severe' ? '#ea580c' : '#2563eb') 
                }}>
                  <Radio size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '19px', fontWeight: '800' }}>NDRRMC Emergency Alert System</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-light)', fontWeight: '500' }}>
                    Transmits dual-tone siren alarm & cell-broadcast modal to residents.
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

            {/* Quick 1-Click NDRRMC Presets */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '800', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                ⚡ 1-Click NDRRMC Official Presets
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {NDRRMC_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '16px',
                      border: '1px solid var(--border-color)',
                      background: 'rgba(0,0,0,0.03)',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleBroadcast}>
              {/* Severity Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>
                  Alert Severity Tier
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setBroadcastSeverity('extreme')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: broadcastSeverity === 'extreme' ? '2px solid #dc2626' : '1px solid var(--border-color)',
                      backgroundColor: broadcastSeverity === 'extreme' ? '#fee2e2' : 'transparent',
                      color: broadcastSeverity === 'extreme' ? '#dc2626' : 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🔴 EXTREME</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: '600' }}>853Hz+960Hz Siren</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastSeverity('severe')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: broadcastSeverity === 'severe' ? '2px solid #ea580c' : '1px solid var(--border-color)',
                      backgroundColor: broadcastSeverity === 'severe' ? '#ffedd5' : 'transparent',
                      color: broadcastSeverity === 'severe' ? '#ea580c' : 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🟠 SEVERE</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: '600' }}>High Alert Tone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastSeverity('advisory')}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: broadcastSeverity === 'advisory' ? '2px solid #2563eb' : '1px solid var(--border-color)',
                      backgroundColor: broadcastSeverity === 'advisory' ? '#dbeafe' : 'transparent',
                      color: broadcastSeverity === 'advisory' ? '#2563eb' : 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>🔵 ADVISORY</span>
                    <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: '600' }}>Public Chime</span>
                  </button>
                </div>
              </div>

              {/* Target Hazard Area */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Target Hazard Area
                </label>
                <input 
                  type="text" 
                  required 
                  list="jamindan-areas"
                  value={broadcastArea} 
                  onChange={e => setBroadcastArea(e.target.value)} 
                  placeholder="e.g. Municipality of Jamindan (All Barangays)" 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', fontSize: '14px', fontWeight: '600' }}
                />
                <datalist id="jamindan-areas">
                  <option value="Municipality of Jamindan (All Barangays)" />
                  <option value="Barangays Pangabuan, Jaena Norte, Agambulong, Guibuangan" />
                  <option value="Barangays Poblacion, Linambasan, Esperanza, Fe" />
                  <option value="Barangays Lucero, Molet, Jagnaya, San Jose" />
                  <option value="Barangays Milan, Pasig, San Vicente, Bayuyan" />
                </datalist>
              </div>

              {/* Alert Title */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Alert Title
                </label>
                <input 
                  type="text" 
                  required 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  placeholder="e.g. RED RAINFALL WARNING & FLOOD ADVISORY" 
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', fontSize: '14px', fontWeight: '700' }}
                />
              </div>

              {/* Message Content */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>
                  Message Content & Instructions
                </label>
                <textarea 
                  required 
                  rows="4" 
                  value={broadcastMessage} 
                  onChange={e => setBroadcastMessage(e.target.value)} 
                  placeholder="Type emergency instructions, evacuation directions, or hotlines..."
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', fontSize: '14px', resize: 'vertical' }}
                ></textarea>
              </div>

              {/* Resident Display Preview */}
              {(broadcastTitle || broadcastMessage) && (
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '14px', 
                  borderRadius: '14px', 
                  border: `1px solid ${broadcastSeverity === 'extreme' ? '#f87171' : (broadcastSeverity === 'severe' ? '#fb923c' : '#60a5fa')}`,
                  backgroundColor: broadcastSeverity === 'extreme' ? '#fef2f2' : (broadcastSeverity === 'severe' ? '#fff7ed' : '#eff6ff') 
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: broadcastSeverity === 'extreme' ? '#dc2626' : (broadcastSeverity === 'severe' ? '#ea580c' : '#2563eb'), textTransform: 'uppercase', marginBottom: '4px' }}>
                    📱 Resident Device Preview:
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>
                    {broadcastTitle || 'Alert Title'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                    📍 <strong>{broadcastArea}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '4px', lineHeight: '1.4' }}>
                    {broadcastMessage || 'Message content...'}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#f1f5f9', border: 'none', color: 'var(--text-main)', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }} onClick={() => setShowBroadcastModal(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ 
                    flex: 1.5, 
                    padding: '14px', 
                    borderRadius: '12px', 
                    background: broadcastSeverity === 'extreme' ? '#dc2626' : (broadcastSeverity === 'severe' ? '#ea580c' : '#2563eb'), 
                    border: 'none', 
                    color: 'white', 
                    fontWeight: '800', 
                    fontSize: '14px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '8px',
                    boxShadow: broadcastSeverity === 'extreme' ? '0 4px 15px rgba(220, 38, 38, 0.4)' : 'none'
                  }} 
                  disabled={broadcasting}
                >
                  {broadcasting ? (
                    <><div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> Transmitting...</>
                  ) : (
                    <>🚨 TRANSMIT ALERT</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Resident Safety Check-In Directory Modal */}
      {showSafetyModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setShowSafetyModal(false)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '85vh',
              borderRadius: '16px',
              padding: '20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border-color)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>
                <CheckCircle size={20} color="#059669" />
                Resident Safety Check-In Directory ({safetyData?.recentCheckins?.length || 0})
              </div>
              <button
                type="button"
                onClick={() => setShowSafetyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search + Filter Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
              <input
                type="text"
                placeholder="Search resident name, barangay, or phone..."
                value={safetySearch}
                onChange={e => setSafetySearch(e.target.value)}
                style={{
                  flex: '1 1 220px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--card-alt)',
                  color: 'var(--text-main)',
                  fontSize: '13px'
                }}
              />

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'All', label: 'All' },
                  { id: 'Needs Assistance', label: `🆘 Needs Help (${safetyData?.summary?.needsHelpCount || 0})` },
                  { id: 'At Evacuation Center', label: `🏛️ Evacuated (${safetyData?.summary?.evacuatedCount || 0})` },
                  { id: 'Safe', label: `✅ Safe (${safetyData?.summary?.safeCount || 0})` }
                ].map(tab => {
                  const active = safetyFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSafetyFilter(tab.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                        backgroundColor: active ? 'var(--primary-color)' : 'var(--card-alt)',
                        color: active ? '#fff' : 'var(--text-light)',
                        cursor: 'pointer'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Resident List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '4px' }}>
              {(() => {
                const modalList = (safetyData?.recentCheckins || []).filter(item => {
                  const matchStatus = safetyFilter === 'All' || item.status === safetyFilter;
                  const q = safetySearch.toLowerCase();
                  const matchQuery = !q ||
                    item.full_name?.toLowerCase().includes(q) ||
                    item.barangay?.toLowerCase().includes(q) ||
                    item.phone?.includes(q);
                  return matchStatus && matchQuery;
                });

                if (modalList.length === 0) {
                  return (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No matching resident check-ins found.
                    </div>
                  );
                }

                return modalList.map(item => {
                  const isNeedsHelp = item.status === 'Needs Assistance';
                  const isEvac = item.status === 'At Evacuation Center';
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: isNeedsHelp ? 'rgba(239, 68, 68, 0.06)' : 'var(--card-alt)',
                        border: `1px solid ${isNeedsHelp ? 'rgba(239, 68, 68, 0.35)' : 'var(--border-color)'}`
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                          {item.full_name} <span style={{ fontWeight: '600', color: 'var(--text-light)' }}>• Brgy. {item.barangay}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <a href={`tel:${item.phone}`} style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none' }}>
                            📞 {item.phone}
                          </a>
                          <span>Updated {new Date(item.updated_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          whiteSpace: 'nowrap',
                          backgroundColor: item.status === 'Safe' ? '#d1fae5' : isEvac ? '#dbeafe' : '#dc2626',
                          color: item.status === 'Safe' ? '#065f46' : isEvac ? '#1e40af' : '#fff'
                        }}>
                          {isNeedsHelp ? '🆘 Needs Help' : isEvac ? '🏛️ Evacuated' : '✅ Safe'}
                        </span>

                        {isNeedsHelp && (
                          <button
                            type="button"
                            onClick={() => handleMarkResidentSafe(item.id)}
                            style={{
                              backgroundColor: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            ✓ Mark Assisted
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
