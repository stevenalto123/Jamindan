import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, 
  Info, 
  CheckCircle, 
  Trash2, 
  LogIn, 
  LogOut, 
  Edit, 
  ShieldAlert,
  User,
  Activity
} from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/dashboard/logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Error fetching system logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Helper to determine the style and icon based on the action
  const getLogStyle = (actionText) => {
    const lowerAction = actionText.toLowerCase();
    
    if (lowerAction.includes('delete') || lowerAction.includes('reject') || lowerAction.includes('remove') || lowerAction.includes('deactivate')) {
      return {
        color: '#dc2626', // Red
        background: '#fee2e2',
        border: '#fecaca',
        icon: <Trash2 size={18} color="#dc2626" />
      };
    }
    
    if (lowerAction.includes('approve') || lowerAction.includes('verify') || lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('activate')) {
      return {
        color: '#16a34a', // Green
        background: '#dcfce7',
        border: '#bbf7d0',
        icon: <CheckCircle size={18} color="#16a34a" />
      };
    }

    if (lowerAction.includes('login') || lowerAction.includes('logged in')) {
      return {
        color: '#2563eb', // Blue
        background: '#dbeafe',
        border: '#bfdbfe',
        icon: <LogIn size={18} color="#2563eb" />
      };
    }

    if (lowerAction.includes('logout') || lowerAction.includes('logged out')) {
      return {
        color: '#475569', // Slate
        background: '#f1f5f9',
        border: '#e2e8f0',
        icon: <LogOut size={18} color="#475569" />
      };
    }

    if (lowerAction.includes('edit') || lowerAction.includes('update')) {
      return {
        color: '#d97706', // Amber
        background: '#fef3c7',
        border: '#fde68a',
        icon: <Edit size={18} color="#d97706" />
      };
    }
    
    if (lowerAction.includes('security') || lowerAction.includes('fail') || lowerAction.includes('error')) {
      return {
        color: '#e11d48', // Rose
        background: '#ffe4e6',
        border: '#fecdd3',
        icon: <ShieldAlert size={18} color="#e11d48" />
      };
    }

    // Default Info
    return {
      color: '#6366f1', // Indigo
      background: '#e0e7ff',
      border: '#c7d2fe',
      icon: <Activity size={18} color="#6366f1" />
    };
  };

  const formatTimestamp = (timestamp) => {
    const dateObj = new Date(timestamp);
    const date = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const time = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  return (
    <div className="content-body" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={26} color="var(--primary-color)" />
            System Audit Logs
          </h2>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '14px' }}>
            Track and monitor all administrative and user activity across the platform.
          </p>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="var(--primary-color)" /> {logs.length} Recorded Events
        </div>
      </div>

      <div style={{ 
        background: 'var(--card-bg)', 
        borderRadius: '16px', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
        border: '1px solid var(--border-color)',
        padding: '32px',
        minHeight: '400px'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            Fetching audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600' }}>
            No system audit logs found.
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '24px' }}>
            
            {/* The Vertical Timeline Line */}
            <div style={{
              position: 'absolute',
              top: '16px',
              bottom: '16px',
              left: '23px', // Aligns with the center of the nodes (24px padding - 1px border)
              width: '2px',
              background: '#e2e8f0',
              zIndex: 1
            }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {logs.map((log, index) => {
                const style = getLogStyle(log.action);
                const { date, time } = formatTimestamp(log.created_at);
                
                return (
                  <div key={log.id} style={{ position: 'relative', display: 'flex', gap: '20px', zIndex: 2 }}>
                    
                    {/* Timeline Node */}
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      background: style.background, 
                      border: `2px solid ${style.border}`,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginLeft: '-20px', // Center over the absolute line
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      zIndex: 3
                    }}>
                      {style.icon}
                    </div>

                    {/* Content Card */}
                    <div style={{ 
                      flex: 1, 
                      background: '#ffffff', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '12px', 
                      padding: '16px 20px',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'default'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)';
                    }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>
                          {log.action}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
                            {date}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                            {time}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <User size={14} color="var(--text-muted)" />
                          <span style={{ color: 'var(--text-light)' }}>Actor:</span>
                          <span style={{ fontWeight: '700', color: 'var(--primary-color)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '6px' }}>
                            @{log.username}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                          <Info size={14} color="var(--text-muted)" />
                          <span style={{ color: 'var(--text-light)' }}>IP Address:</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            {log.ip}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
