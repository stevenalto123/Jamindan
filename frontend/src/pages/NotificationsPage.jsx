import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckSquare, AlertTriangle, Megaphone, Info, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Helper for relative time
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Helper for dynamic icons and colors
const getNotifStyle = (type, title = '') => {
  const t = title.toLowerCase();
  if (type === 'incident' || t.includes('critical') || t.includes('emergency')) {
    return { icon: AlertTriangle, color: 'var(--danger-color)', bg: 'rgba(231, 76, 60, 0.1)' };
  }
  if (type === 'news' || t.includes('announcement') || t.includes('broadcast')) {
    return { icon: Megaphone, color: '#3498db', bg: 'rgba(52, 152, 219, 0.1)' };
  }
  if (t.includes('success') || t.includes('verified') || t.includes('resolved')) {
    return { icon: CheckCircle2, color: 'var(--primary-color)', bg: 'var(--primary-light)' };
  }
  return { icon: Info, color: '#7f8c8d', bg: '#f0f2f0' };
};

const NotificationsPage = () => {
  const { t } = useLanguage();
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>{t('notificationsInbox') || 'Notifications'}</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px', margin: 0 }}>{t('notificationsDesc') || 'Stay updated on emergencies and announcements.'}</p>
        </div>

        {notifications.filter(n => !n.is_read).length > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead} style={{ height: '36px', padding: '0 16px', fontSize: '13px', borderRadius: '20px' }}>
            <CheckSquare size={16} /> <span className="hide-on-mobile">{t('markAllRead') || 'Mark all as read'}</span>
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('loadingNotifications') || 'Loading...'}</div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Bell size={48} color="var(--border-color)" />
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '18px' }}>{t('noNotifications') || 'You\'re all caught up!'}</h3>
            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>No new notifications at the moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {notifications.map((notif, index) => {
              const { icon: Icon, color, bg } = getNotifStyle(notif.reference_type, notif.title);
              
              return (
                <div 
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.reference_type, notif.reference_id)}
                  style={{ 
                    padding: '20px 24px', 
                    borderBottom: index === notifications.length - 1 ? 'none' : '1px solid var(--border-color)', 
                    cursor: 'pointer',
                    backgroundColor: !notif.is_read ? '#f8fafc' : '#ffffff',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = !notif.is_read ? '#f8fafc' : '#ffffff'}
                >
                  {/* Unread Indicator Dot */}
                  {!notif.is_read && (
                    <div style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', boxShadow: '0 0 8px rgba(46,204,113,0.6)' }} />
                  )}

                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, flexShrink: 0 }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                    <div style={{ fontWeight: !notif.is_read ? '800' : '600', fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>
                      {notif.title}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                      <Clock size={12} /> {getRelativeTime(notif.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
