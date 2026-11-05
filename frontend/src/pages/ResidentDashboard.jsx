import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Flame, HeartPulse, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SosPanicButton from '../components/SosPanicButton';
import { hapticEmergency, hapticSuccess, hapticTap } from '../utils/haptics';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myCheckin, setMyCheckin] = useState(null);
  const [isCheckinActive, setIsCheckinActive] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showAssistanceConfirm, setShowAssistanceConfirm] = useState(false);
  const navigate = useNavigate();

  const handleQuickCall = async (e, agencyName, number, category) => {
    e.preventDefault();
    hapticEmergency();
    const newRecent = { id: agencyName, agency_name: agencyName, contact_number: number, category: category };
    const saved = localStorage.getItem('recentHotlines');
    let prev = saved ? JSON.parse(saved) : [];
    const filtered = prev.filter(h => h.id !== newRecent.id);
    const updated = [newRecent, ...filtered].slice(0, 3);
    localStorage.setItem('recentHotlines', JSON.stringify(updated));
    try {
      await axios.post('/api/emergency/hotlines/log', { hotline_name: agencyName, hotline_number: number });
    } catch (err) {
      console.warn("Failed to log call intent", err);
    }
    window.location.href = `tel:${number}`;
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/dashboard/resident');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching resident stats', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCheckin = async () => {
    try {
      const res = await axios.get('/api/notifications/safety-checkins');
      setMyCheckin(res.data?.myCheckin || null);
      setIsCheckinActive(Boolean(res.data?.isCheckinActive));
    } catch (err) {
      console.warn('Could not load safety check-in status');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCheckin();
    const interval = setInterval(fetchStats, 3000);

    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on('safety-checkin-mode-changed', (msg) => {
      if (msg && typeof msg.active === 'boolean') {
        setIsCheckinActive(msg.active);
      }
      fetchCheckin();
    });
    socket.on('safety-checkin-updated', () => {
      fetchCheckin();
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const handleSafetyCheckIn = async (statusLabel) => {
    setCheckingIn(true);
    hapticTap();
    try {
      await axios.post('/api/notifications/safety-checkin', { status: statusLabel });
      hapticSuccess();
      await fetchCheckin();
    } catch (err) {
      alert('Failed to update safety status. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const latestAdvisory = stats?.latestAdvisories?.[0];

  return (
    <div className="content-body" style={{ padding: '20px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Official SOS Panic Button Component */}
      <SosPanicButton />
      
      {/* Premium Quick-Dial Action Bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '20px' }}>
        <a href="tel:09485224345" onClick={(e) => handleQuickCall(e, 'Jamindan MDRRMO Operations', '09485224345', 'Rescue')} style={{ flex: 1, textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <div style={{ padding: '8px', backgroundColor: '#2563eb', borderRadius: '50%', color: 'white' }}>
              <Shield size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8' }}>MDRRMO</span>
          </div>
        </a>
        <a href="tel:09106964585" onClick={(e) => handleQuickCall(e, 'Jamindan Fire Station (BFP)', '09106964585', 'Fire')} style={{ flex: 1, textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(230, 126, 34, 0.1)' }}>
            <div style={{ padding: '8px', backgroundColor: '#ea580c', borderRadius: '50%', color: 'white' }}>
              <Flame size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#c2410c' }}>BFP Fire</span>
          </div>
        </a>
        <a href="tel:09304562011" onClick={(e) => handleQuickCall(e, 'Jamindan RHU / EMS', '09304562011', 'Medical')} style={{ flex: 1, textDecoration: 'none' }}>
          <div className="glass-card" style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
            <div style={{ padding: '8px', backgroundColor: '#059669', borderRadius: '50%', color: 'white' }}>
              <HeartPulse size={20} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#047857' }}>RHU Health</span>
          </div>
        </a>
      </div>

      {/* "I Am Safe" Resident Safety Check-In Card (Only active during emergencies / manual activation or when resident Needs Assistance) */}
      {(isCheckinActive || (myCheckin && myCheckin.status === 'Needs Assistance')) && (
        <div className="glass-card" style={{ marginBottom: '20px', padding: '18px', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={19} color="#059669" />
              <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
                {t('safetyCheckinTitle')}
              </span>
            </div>
            {myCheckin && (
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: myCheckin.status === 'Safe' ? '#d1fae5' : myCheckin.status === 'At Evacuation Center' ? '#dbeafe' : '#fee2e2',
                color: myCheckin.status === 'Safe' ? '#065f46' : myCheckin.status === 'At Evacuation Center' ? '#1e40af' : '#991b1b'
              }}>
                {t('currentStatusLabel')} {myCheckin.status === 'Safe' ? t('statusSafeLabel') : myCheckin.status === 'At Evacuation Center' ? t('statusEvacuatedLabel') : t('statusNeedsHelpLabel')}
              </span>
            )}
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-light)', lineHeight: 1.4 }}>
            {t('safetyCheckinDesc')}
          </p>
          <div className="resident-safety-grid">
            <button
              type="button"
              disabled={checkingIn}
              onClick={() => handleSafetyCheckIn('Safe')}
              className="resident-safety-btn"
              style={{
                border: myCheckin?.status === 'Safe' ? '2px solid #059669' : '1px solid #a7f3d0',
                backgroundColor: myCheckin?.status === 'Safe' ? '#059669' : '#ecfdf5',
                color: myCheckin?.status === 'Safe' ? '#fff' : '#065f46',
                boxShadow: myCheckin?.status === 'Safe' ? '0 4px 12px rgba(5, 150, 105, 0.25)' : 'none'
              }}
            >
              {t('statusSafe')}
            </button>
            <button
              type="button"
              disabled={checkingIn}
              onClick={() => handleSafetyCheckIn('At Evacuation Center')}
              className="resident-safety-btn"
              style={{
                border: myCheckin?.status === 'At Evacuation Center' ? '2px solid #2563eb' : '1px solid #bfdbfe',
                backgroundColor: myCheckin?.status === 'At Evacuation Center' ? '#2563eb' : '#eff6ff',
                color: myCheckin?.status === 'At Evacuation Center' ? '#fff' : '#1e40af',
                boxShadow: myCheckin?.status === 'At Evacuation Center' ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none'
              }}
            >
              {t('statusEvacuated')}
            </button>
            <button
              type="button"
              disabled={checkingIn}
              onClick={() => setShowAssistanceConfirm(true)}
              className="resident-safety-btn"
              style={{
                border: myCheckin?.status === 'Needs Assistance' ? '2px solid #dc2626' : '1px solid #fecaca',
                backgroundColor: myCheckin?.status === 'Needs Assistance' ? '#dc2626' : '#fef2f2',
                color: myCheckin?.status === 'Needs Assistance' ? '#fff' : '#991b1b',
                boxShadow: myCheckin?.status === 'Needs Assistance' ? '0 4px 12px rgba(220, 38, 38, 0.25)' : 'none'
              }}
            >
              {t('statusNeedsHelp')}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal for "Needs Assistance" to Prevent Accidental Clicks */}
      {showAssistanceConfirm && (
        <div 
          onClick={() => setShowAssistanceConfirm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    {t('confirmAssistanceTitle')}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase' }}>
                    {t('confirmAssistanceSub')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssistanceConfirm(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              {t('confirmAssistanceDesc')}
            </p>

            <div style={{
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '10px',
              padding: '10px 12px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#9a3412',
              lineHeight: 1.45
            }}>
              🚨 <strong>{t('confirmAssistanceNote')}</strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAssistanceConfirm(false)}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#475569',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {t('confirmCancel')}
              </button>
              <button
                type="button"
                disabled={checkingIn}
                onClick={async () => {
                  setShowAssistanceConfirm(false);
                  await handleSafetyCheckIn('Needs Assistance');
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                  textAlign: 'center'
                }}
              >
                {checkingIn ? 'Sending...' : t('confirmProceed')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>{t('announcements')}</span>
          <Link to="/news" style={{ color: 'var(--info-color)', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>{t('viewAll')}</Link>
        </div>
        {loading && !latestAdvisory ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-light)', fontSize: '13px', padding: '8px 0' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading advisories...</span>
          </div>
        ) : latestAdvisory ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--primary-color)' }}>{latestAdvisory.title}</span>
            <p style={{ margin: '0', color: 'var(--text-main)', fontSize: '13px', fontWeight: '500', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
              {latestAdvisory.content}
            </p>
          </div>
        ) : (
          <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500', fontStyle: 'italic' }}>
            No active announcements at this time.
          </p>
        )}
      </div>

    </div>
  );
};

export default ResidentDashboard;
