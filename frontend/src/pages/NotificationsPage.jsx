import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, refType, refId) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      if (refType === 'incident') {
        navigate(`/incidents/${refId}`);
      } else if (refType === 'news') {
        navigate('/news');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Notifications Inbox</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>View and manage alerts sent to your profile</p>
        </div>

        {notifications.filter(n => !n.is_read).length > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead} style={{ height: '36px' }}>
            <CheckSquare size={16} /> Mark all read
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '12px' }}>
        {loading ? (
          <div className="notif-empty">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty" style={{ padding: '40px 0' }}>No notifications yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.reference_type, notif.reference_id)}
                style={{ 
                  padding: '16px', 
                  borderBottom: '1px solid var(--border-color)', 
                  cursor: 'pointer',
                  backgroundColor: !notif.is_read ? 'rgba(61, 122, 80, 0.05)' : 'transparent',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: !notif.is_read ? 'var(--primary-light)' : '#f0f2f0', display: 'flex', alignItems: 'center', justifyCenter: 'center', color: !notif.is_read ? 'var(--primary-color)' : 'var(--text-muted)', flexShrink: 0 }}>
                  <Bell size={16} style={{ margin: 'auto' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: !notif.is_read ? '700' : '600', fontSize: '14px', color: 'var(--text-main)' }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>
                    {notif.message}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {new Date(notif.created_at).toLocaleString()}
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

export default NotificationsPage;
