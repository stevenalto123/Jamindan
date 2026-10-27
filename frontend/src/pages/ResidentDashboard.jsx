import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SosPanicButton from '../components/SosPanicButton';
import JamindanWeatherWidget from '../components/JamindanWeatherWidget';
import { 
  AlertTriangle, 
  FileText, 
  PhoneCall, 
  Building, 
  Newspaper, 
  ArrowRight,
  ChevronRight,
  Clock,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myCheckin, setMyCheckin] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchCheckin = async () => {
    try {
      const res = await axios.get('/api/notifications/safety-checkins');
      setMyCheckin(res.data?.myCheckin || null);
    } catch (err) {
      console.warn('Could not load safety check-in status');
    }
  };

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await axios.get('/api/incidents');
        setRecentReports(res.data.slice(0, 3));
      } catch (err) {
        console.error('Failed to load recent reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
    fetchCheckin();
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">{t('pending')}</span>;
      case 'Acknowledged': return <span className="badge badge-progress" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>{t('acknowledged')}</span>;
      case 'Responding': return <span className="badge badge-progress" style={{ backgroundColor: '#ede9fe', color: '#5b21b6' }}>{t('responding')}</span>;
      case 'On Scene': return <span className="badge badge-progress" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>{t('onScene')}</span>;
      case 'Resolved': return <span className="badge badge-resolved">{t('resolved')}</span>;
      case 'False Alarm': return <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>{t('falseAlarm')}</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ padding: '4px 0 80px 0' }}>
      
      {/* Primary Emergency Action */}
      <button 
        onClick={() => navigate('/report')}
        className="btn-emergency-main"
      >
        <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '16px', borderRadius: '50%' }}>
          <AlertTriangle size={48} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '0.5px' }}>{t('reportEmergency')}</div>
          <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '500', marginTop: '4px' }}>{t('tapToAlert')}</div>
        </div>
      </button>

      {/* SOS 1-Tap Panic Button */}
      <SosPanicButton />

      {/* Live Jamindan Weather & Flood Hazard Widget */}
      <JamindanWeatherWidget compact={true} />

      {/* "I Am Safe" Resident Safety Check-In Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
              MDRRMO Resident Safety Check-In
            </h3>
          </div>
          {myCheckin && (
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '999px',
              backgroundColor: myCheckin.status === 'Safe' ? '#d1fae5' : myCheckin.status === 'At Evacuation Center' ? '#dbeafe' : '#fee2e2',
              color: myCheckin.status === 'Safe' ? '#065f46' : myCheckin.status === 'At Evacuation Center' ? '#1e40af' : '#991b1b'
            }}>
              Current Status: {myCheckin.status}
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
              borderRadius: '12px',
              border: myCheckin?.status === 'Safe' ? '2px solid #059669' : '1px solid #a7f3d0',
              backgroundColor: myCheckin?.status === 'Safe' ? '#059669' : '#ecfdf5',
              color: myCheckin?.status === 'Safe' ? '#fff' : '#065f46',
              fontWeight: '800',
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
              borderRadius: '12px',
              border: myCheckin?.status === 'At Evacuation Center' ? '2px solid #2563eb' : '1px solid #bfdbfe',
              backgroundColor: myCheckin?.status === 'At Evacuation Center' ? '#2563eb' : '#eff6ff',
              color: myCheckin?.status === 'At Evacuation Center' ? '#fff' : '#1e40af',
              fontWeight: '800',
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
              borderRadius: '12px',
              border: myCheckin?.status === 'Needs Assistance' ? '2px solid #dc2626' : '1px solid #fecaca',
              backgroundColor: myCheckin?.status === 'Needs Assistance' ? '#dc2626' : '#fef2f2',
              color: myCheckin?.status === 'Needs Assistance' ? '#fff' : '#991b1b',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🆘 Needs Assistance
          </button>
        </div>
      </div>

      {/* Quick Access Grid */}
      <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-main)' }}>{t('quickServices')}</h3>
      <div className="quick-action-grid">
        <div onClick={() => navigate('/incidents')} className="quick-action-card">
          <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
            <FileText size={28} />
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{t('myReports')}</span>
        </div>

        <div onClick={() => navigate('/hotlines')} className="quick-action-card">
          <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
            <PhoneCall size={28} />
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{t('emergencyHotlines')}</span>
        </div>

        <div onClick={() => navigate('/evacuation')} className="quick-action-card">
          <div style={{ backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '12px', color: '#10b981' }}>
            <Building size={28} />
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{t('evacuationCenters')}</span>
        </div>

        <div onClick={() => navigate('/news')} className="quick-action-card">
          <div style={{ backgroundColor: '#fffbeb', padding: '12px', borderRadius: '12px', color: '#f59e0b' }}>
            <Newspaper size={28} />
          </div>
          <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{t('newsAdvisories')}</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>{t('recentReports')}</h3>
        <span onClick={() => navigate('/incidents')} style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          {t('viewAll')} <ChevronRight size={16} />
        </span>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>{t('loadingActivity')}</div>
      ) : recentReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-light)' }}>
          <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 8px auto', opacity: 0.7 }} />
          <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{t('noRecentEmergencies')}</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>{t('haveNotSubmitted')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentReports.map((inc) => (
            <div 
              key={inc.id} 
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="card" 
              style={{ marginBottom: 0, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>
                  {inc.type}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {new Date(inc.created_at).toLocaleDateString()} • {inc.code}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getStatusBadge(inc.status)}
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ResidentDashboard;
