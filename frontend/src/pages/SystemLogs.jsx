import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Info } from 'lucide-react';

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

  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>System Logs</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Audit registers for system actions and security audits</p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} />
          System Log Audits
        </h3>

        {loading ? (
          <div className="notif-empty">Fetching system logs...</div>
        ) : logs.length === 0 ? (
          <div className="notif-empty">No system audit logs found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {logs.map((log) => (
              <div 
                key={log.id} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  padding: '12px', 
                  backgroundColor: '#fafbfc', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px' 
                }}
              >
                <Info size={16} style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: '13px' }}>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{log.action}</div>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-light)', fontSize: '11px', marginTop: '2px' }}>
                    <span>Actor: <strong>{log.username}</strong></span>
                    <span>Origin IP: {log.ip}</span>
                    <span>Timestamp: {new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
