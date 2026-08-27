import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  MapPin, 
  ShieldAlert, 
  AlertTriangle 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{t('totalLifetimeReports')}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{t('sinceLaunch')}</div>
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{data?.metrics?.totalReports || 0}</div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
