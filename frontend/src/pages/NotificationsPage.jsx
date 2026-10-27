import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckSquare, AlertTriangle, Megaphone, Info, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

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

const getNotifStyle = (type, title = '') => {
  const t = title.toLowerCase();
  if (type === 'incident' || type === 'evacuation' || (type && type.startsWith('broadcast:extreme')) || t.includes('critical') || t.includes('emergency')) {
    return { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  }
  if (type === 'news' || (type && type.startsWith('broadcast')) || t.includes('announcement') || t.includes('broadcast')) {
    return { icon: Megaphone, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' };
  }
  if (t.includes('success') || t.includes('verified') || t.includes('resolved')) {
    return { icon: CheckCircle2, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
  }
  return { icon: Info, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' };
};

const NotificationsPage = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all');
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data || []);
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
      if (refType === 'incident' && refId) {
        navigate(`/incidents/${refId}`);
      } else if (refType === 'news') {
        navigate('/news');
      } else if (refType === 'evacuation') {
        navigate('/evacuation');
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

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const displayedNotifications = filterTab === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="content-body" style={{ maxWidth: '960px', paddingBottom: '48px' }}>

      {/* ─── Unified Top Toolbar: Filter Tabs + Mark All Read ──────── */}
      <div
        className="glass-card"
        style={{
          padding: '12px 16px',
          marginBottom: '18px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Notifications', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount }
          ].map(tab => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: active ? '700' : '600',
                  border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: active ? 'var(--primary-color)' : 'var(--card-alt)',
                  color: active ? '#fff' : 'var(--text-light)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'var(--card-bg)',
                  color: active ? '#fff' : 'var(--text-muted)'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {unreadCount > 0 && (
          <button
            className="btn btn-secondary"
            onClick={handleMarkAllRead}
            style={{ padding: '7px 14px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckSquare size={14} /> {t('markAllRead') || 'Mark all as read'}
          </button>
        )}
      </div>

      {/* ─── Notifications List ────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>{t('loadingNotifications') || 'Loading...'}</div>
        ) : displayedNotifications.length === 0 ? (
          <div style={{ padding: '52px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <Bell size={38} color="var(--text-muted)" />
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '16px' }}>{t('noNotifications') || "You're all caught up!"}</h3>
            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '13px' }}>
              {filterTab === 'unread' ? 'You have no unread notifications.' : 'No notifications at the moment.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayedNotifications.map((notif, index) => {
              const { icon: Icon, color, bg } = getNotifStyle(notif.reference_type, notif.title);
              const isUnread = !notif.is_read;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.reference_type, notif.reference_id)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: index === displayedNotifications.length - 1 ? 'none' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: isUnread ? 'var(--card-alt)' : 'var(--card-bg)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    position: 'relative',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    flexShrink: 0
                  }}>
                    <Icon size={18} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        {isUnread && (
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', flexShrink: 0 }} />
                        )}
                        <span style={{ fontWeight: isUnread ? '700' : '600', fontSize: '14px', color: 'var(--text-main)' }}>
                          {notif.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <Clock size={11} /> {getRelativeTime(notif.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-light)', lineHeight: '1.45' }}>
                      {notif.message}
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
