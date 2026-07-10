import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  PhoneCall,
  FileText,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Under Review': return <span className="badge badge-review">Under Review</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Resolved': return <span className="badge badge-resolved">Resolved</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return <div className="content-body"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="content-body">


      {/* 4 Soft Colored Metric Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card" style={{ backgroundColor: '#eaf5ee', border: 'none', borderLeft: 'none' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'transparent', color: '#3d7a50' }}>
            <AlertOctagon size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.metrics?.totalReported || 0}</span>
            <span className="metric-label" style={{ color: '#3d7a50' }}>My Reports</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Reports</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#ebf5fb', border: 'none', borderLeft: 'none' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'transparent', color: '#2980b9' }}>
            <Clock size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.metrics?.activeReported || 0}</span>
            <span className="metric-label" style={{ color: '#2980b9' }}>In Progress</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Reports</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#fef9eb', border: 'none', borderLeft: 'none' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'transparent', color: '#d4ac0d' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.metrics?.resolvedReported || 0}</span>
            <span className="metric-label" style={{ color: '#b7950b' }}>Resolved</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Reports</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#fdf2f2', border: 'none', borderLeft: 'none' }}>
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'transparent', color: '#c0392b' }}>
            <ShieldAlert size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-value">{stats?.latestAdvisories?.length || 0}</span>
            <span className="metric-label" style={{ color: '#c0392b' }}>Alerts</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Active Advisories</span>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }} className="responsive-grid-col">
        
        {/* Left Column: Recent Reports */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Recent Reports</h3>
            <Link to="/incidents" style={{ fontSize: '13px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              View All
            </Link>
          </div>

          {stats?.recentReports?.length === 0 ? (
            <div className="notif-empty" style={{ padding: '30px 0' }}>No reported incidents.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.recentReports?.map((report) => (
                <div 
                  key={report.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#eaf5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                    <FileText size={16} style={{ margin: 'auto' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{report.type}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {report.code} • {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(report.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Announcements */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Announcements</h3>
            <Link to="/news" style={{ fontSize: '13px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              View All
            </Link>
          </div>

          {stats?.latestAdvisories?.length === 0 ? (
            <div className="notif-empty" style={{ padding: '30px 0' }}>No active announcements.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats?.latestAdvisories?.map((adv) => (
                <div 
                  key={adv.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px',
                    gap: '12px'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fdf2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c0392b', flexShrink: 0 }}>
                    <Bell size={16} style={{ margin: 'auto' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{adv.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                      {new Date(adv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hotline Bar matching template layout */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          backgroundColor: '#fafbfc', 
          border: '1px solid var(--border-color)', 
          borderRadius: '12px', 
          padding: '16px 24px', 
          boxShadow: 'var(--shadow-sm)' 
        }}
        className="responsive-grid-col"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eaf5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
            <PhoneCall size={20} style={{ margin: 'auto' }} />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>Emergency Hotline</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-light)' }}>In case of immediate danger, please call our hotline.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-display)' }}>
          📞 911
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
