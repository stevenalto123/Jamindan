import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SosPanicButton from '../components/SosPanicButton';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);


  const getInitials = (name) => {
    if (!name) return 'JD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return <div className="content-body" style={{ color: 'var(--text-light)', padding: '20px' }}>Loading...</div>;
  }

  const activeAlertsCount = stats?.latestAdvisories?.length || 0;
  const latestAdvisory = stats?.latestAdvisories?.[0];

  return (
    <div className="content-body" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Custom Mobile Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0', color: 'var(--text-main)', lineHeight: '1.2' }}>
            Welcome, {user?.full_name?.split(' ')[0] || 'User'}
          </h1>
          <p style={{ margin: '0', color: 'var(--text-light)', fontSize: '14px' }}>
            {user?.barangay || 'Jamindan'}, Capiz
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link to="/notifications" style={{ color: 'var(--text-light)', position: 'relative' }}>
            <Bell size={24} />
            {activeAlertsCount > 0 && (
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', backgroundColor: 'var(--primary-color)', borderRadius: '50%' }}></span>
            )}
          </Link>
          <Link to="/profile" style={{ textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#0d47a1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              {getInitials(user?.full_name)}
            </div>
          </Link>
        </div>
      </div>

      {/* Official SOS Panic Button Component */}
      <SosPanicButton />


      {/* 2x2 Status Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        
        {/* My Reports */}
        <Link to="/incidents" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{stats?.metrics?.totalReported || 0}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>{t('myReports')}</span>
          </div>
        </Link>

        {/* In Progress */}
        <Link to="/incidents" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{stats?.metrics?.activeReported || 0}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>{t('inProgress')}</span>
          </div>
        </Link>

        {/* Resolved */}
        <Link to="/incidents" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: '1' }}>{stats?.metrics?.resolvedReported || 0}</span>
            <span style={{ fontSize: '14px', color: 'var(--text-light)', fontWeight: '500' }}>{t('resolved')}</span>
          </div>
        </Link>

        {/* Active Alerts */}
        <Link to="/news" style={{ textDecoration: 'none' }}>
          <div style={{ backgroundColor: '#fdf2f2', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '5px', border: '1px solid #fadbd8' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--danger-color)', lineHeight: '1' }}>{activeAlertsCount}</span>
            <span style={{ fontSize: '14px', color: 'var(--danger-color)', fontWeight: '500' }}>{t('activeAlerts')}</span>
          </div>
        </Link>
        
      </div>

      {/* Announcements */}
      <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)' }}>{t('announcements')}</span>
          <Link to="/news" style={{ color: 'var(--info-color)', fontSize: '14px', textDecoration: 'none', fontWeight: '500' }}>{t('viewAll')}</Link>
        </div>
        {latestAdvisory ? (
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
