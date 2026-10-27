import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Flame, HeartPulse, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SosPanicButton from '../components/SosPanicButton';
import JamindanWeatherWidget from '../components/JamindanWeatherWidget';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myCheckin, setMyCheckin] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const navigate = useNavigate();

  const handleQuickCall = async (e, agencyName, number, category) => {
    e.preventDefault();
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
    } catch (err) {
      console.warn('Could not load safety check-in status');
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCheckin();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSafetyCheckIn = async (statusLabel) => {
    setCheckingIn(true);
    try {
      await axios.post('/api/notifications/safety-checkin', { status: statusLabel });
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

      {/* Live Jamindan Weather & Flood Hazard Widget */}
      <JamindanWeatherWidget compact={true} />

      {/* "I Am Safe" Resident Safety Check-In Card */}
      <div className="glass-card" style={{ marginBottom: '20px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={19} color="#059669" />
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>
              MDRRMO Resident Safety Check-In
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
              Status: {myCheckin.status}
            </span>
          )}
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-light)', lineHeight: 1.4 }}>
          During typhoons, floods, or municipal alerts, let the Jamindan MDRRMO Command Center know your current status:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '8px' }}>
          <button
            type="button"
            disabled={checkingIn}
            onClick={() => handleSafetyCheckIn('Safe')}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: myCheckin?.status === 'Safe' ? '2px solid #059669' : '1px solid #a7f3d0',
              backgroundColor: myCheckin?.status === 'Safe' ? '#059669' : '#ecfdf5',
              color: myCheckin?.status === 'Safe' ? '#fff' : '#065f46',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            ✅ I Am Safe
          </button>
          <button
            type="button"
            disabled={checkingIn}
            onClick={() => handleSafetyCheckIn('At Evacuation Center')}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: myCheckin?.status === 'At Evacuation Center' ? '2px solid #2563eb' : '1px solid #bfdbfe',
              backgroundColor: myCheckin?.status === 'At Evacuation Center' ? '#2563eb' : '#eff6ff',
              color: myCheckin?.status === 'At Evacuation Center' ? '#fff' : '#1e40af',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🏛️ At Evacuation Center
          </button>
          <button
            type="button"
            disabled={checkingIn}
            onClick={() => handleSafetyCheckIn('Needs Assistance')}
            style={{
              padding: '10px 12px',
              borderRadius: '10px',
              border: myCheckin?.status === 'Needs Assistance' ? '2px solid #dc2626' : '1px solid #fecaca',
              backgroundColor: myCheckin?.status === 'Needs Assistance' ? '#dc2626' : '#fef2f2',
              color: myCheckin?.status === 'Needs Assistance' ? '#fff' : '#991b1b',
              fontWeight: '700',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🆘 Needs Assistance
          </button>
        </div>
      </div>

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
