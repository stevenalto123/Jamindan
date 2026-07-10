import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  Shield, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Under Review': return <span className="badge badge-review">Under Review</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Resolved': return <span className="badge badge-resolved">Resolved</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  if (loading && !data) {
    return <div className="content-body"><p>Loading dashboard...</p></div>;
  }

  // Generate SVG path coordinates for the Weekly trend line
  // We want a smooth curve mapping our 7 weeklyTrends data points
  const points = data?.weeklyTrends || [];
  const maxVal = Math.max(...points.map(p => p.count), 1);
  const chartHeight = 120;
  const chartWidth = 320;

  // Map data values to SVG coordinates
  const mappedPoints = points.map((p, i) => {
    const x = 30 + i * 42;
    const y = chartHeight - 15 - (p.count / maxVal) * (chartHeight - 30);
    return { x, y };
  });

  // Create smooth Bezier curve path
  let pathD = '';
  let fillD = '';
  if (mappedPoints.length > 0) {
    pathD = `M ${mappedPoints[0].x} ${mappedPoints[0].y}`;
    for (let i = 0; i < mappedPoints.length - 1; i++) {
      const curr = mappedPoints[i];
      const next = mappedPoints[i + 1];
      const cpX1 = curr.x + 15;
      const cpY1 = curr.y;
      const cpX2 = next.x - 15;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    // Fill path closing at bottom
    fillD = `${pathD} L ${mappedPoints[mappedPoints.length - 1].x} ${chartHeight} L ${mappedPoints[0].x} ${chartHeight} Z`;
  }

  return (
    <div className="content-body">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Admin Dashboard</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Overview of the system</p>
      </div>

      {/* 6 Soft Colored KPI Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card" style={{ backgroundColor: '#ebf5fb', border: 'none', borderLeft: 'none' }}>
          <div className="metric-details">
            <span className="metric-label" style={{ color: '#2980b9' }}>Total Users</span>
            <span className="metric-value" style={{ margin: '8px 0' }}>{data?.metrics?.totalUsers || 0}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Registered accounts</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#eaf5ee', border: 'none', borderLeft: 'none' }}>
          <div className="metric-details">
            <span className="metric-label" style={{ color: '#3d7a50' }}>Total Reports</span>
            <span className="metric-value" style={{ margin: '8px 0' }}>{data?.metrics?.totalReports || 0}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Lifetime submissions</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#fef5e7', border: 'none', borderLeft: 'none' }}>
          <div className="metric-details">
            <span className="metric-label" style={{ color: '#d35400' }}>Pending Reports</span>
            <span className="metric-value" style={{ margin: '8px 0' }}>{data?.metrics?.pendingReports || 0}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting review</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#e8f8f5', border: 'none', borderLeft: 'none' }}>
          <div className="metric-details">
            <span className="metric-label" style={{ color: '#16a085' }}>Resolved Reports</span>
            <span className="metric-value" style={{ margin: '8px 0' }}>{data?.metrics?.resolvedReports || 0}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Marked resolved</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#fef9eb', border: 'none', borderLeft: 'none' }}>
          <div className="metric-details">
            <span className="metric-label" style={{ color: '#b7950b' }}>Active Incidents</span>
            <span className="metric-value" style={{ margin: '8px 0' }}>{data?.metrics?.activeIncidents || 0}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Currently ongoing</span>
          </div>
        </div>

        <div className="metric-card" style={{ backgroundColor: '#fdf2f2', border: 'none', borderLeft: 'none' }}>
          <div className="metric-details">
            <span className="metric-label" style={{ color: '#c0392b' }}>Responders</span>
            <span className="metric-value" style={{ margin: '8px 0' }}>{data?.metrics?.respondersOnDuty || 0}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On Duty / Active</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }} className="responsive-grid-col">
        {/* Left Column: Recent Incidents */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Recent Incidents</h3>
            <Link to="/incidents" style={{ fontSize: '13px', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              View All
            </Link>
          </div>

          {data?.recentIncidents?.length === 0 ? (
            <div className="notif-empty" style={{ padding: '30px 0' }}>No incidents recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data?.recentIncidents?.slice(0, 3).map((incident) => (
                <div 
                  key={incident.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px' 
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{incident.type} in {incident.reporter_barangay}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {incident.code} • {new Date(incident.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(incident.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Smooth Trend Line Chart */}
        <div className="card">
          <h3 className="card-title">Incident Overview</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>Weekly trend mapping</p>

          <div style={{ width: '100%', height: '140px', overflow: 'hidden' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4b8e62" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4b8e62" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#f0f2f0" strokeWidth="1" />
              <line x1="0" y1="55" x2={chartWidth} y2="55" stroke="#f0f2f0" strokeWidth="1" />
              <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="#f0f2f0" strokeWidth="1" />

              {/* Filled Area */}
              {fillD && <path d={fillD} fill="url(#chartGradient)" />}

              {/* Curve Line */}
              {pathD && <path d={pathD} fill="none" stroke="#4b8e62" strokeWidth="3" strokeLinecap="round" />}

              {/* Data points */}
              {mappedPoints.map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#ffffff" stroke="#4b8e62" strokeWidth="2.5" />
                </g>
              ))}

              {/* X Axis Labels */}
              {points.map((p, idx) => (
                <text 
                  key={idx} 
                  x={30 + idx * 42} 
                  y={chartHeight - 2} 
                  textAnchor="middle" 
                  fill="var(--text-light)" 
                  fontSize="9px" 
                  fontWeight="600"
                >
                  {p.day}
                </text>
              ))}
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom Row split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="responsive-grid-col">
        {/* System status */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            backgroundColor: '#ffffff', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '16px 20px', 
            boxShadow: 'var(--shadow-sm)' 
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eaf5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d7a50', flexShrink: 0 }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>System Status</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>All systems operational</p>
          </div>
        </div>

        {/* Alerts status */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            backgroundColor: '#ffffff', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            padding: '16px 20px', 
            boxShadow: 'var(--shadow-sm)' 
          }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fdf2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c0392b', flexShrink: 0 }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>Recent Alerts</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>2 active alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
