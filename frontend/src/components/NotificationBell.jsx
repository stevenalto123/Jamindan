import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const prevUnreadCount = useRef(0);
  const navigate = useNavigate();

  // References for looping audio siren and haptic intervals
  const alarmIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 3 seconds
    const interval = setInterval(fetchNotifications, 3000);
    return () => {
      clearInterval(interval);
      stopLoopingAlarm();
    };
  }, []);

  const startLoopingAlarm = () => {
    if (alarmIntervalRef.current) return; // Alarm is already running

    // 1. Play continuous alternating siren sound using Web Audio API
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sawtooth';
        oscillatorRef.current = osc;
        gainNodeRef.current = gain;

        osc.start(0);

        // Modulate frequency to alternate like an emergency siren
        let high = false;
        const fmInterval = setInterval(() => {
          if (!oscillatorRef.current) {
            clearInterval(fmInterval);
            return;
          }
          osc.frequency.setValueAtTime(high ? 1100.00 : 750.00, ctx.currentTime);
          gain.gain.setValueAtTime(high ? 0.12 : 0.08, ctx.currentTime);
          high = !high;
        }, 350); // Alternate every 350ms
        
        osc.fmInterval = fmInterval;
      }
    } catch (e) {
      console.warn('Audio autoplay blocked or context forbidden:', e);
    }

    // 2. Loop haptic phone vibration
    const runVibe = () => {
      if (navigator.vibrate) {
        navigator.vibrate([1000, 300]); // 1s vibrate, 0.3s silence
      }
    };
    runVibe();

    alarmIntervalRef.current = setInterval(runVibe, 1300);
  };

  const stopLoopingAlarm = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    if (navigator.vibrate) {
      navigator.vibrate(0); // Cancel all active vibrations immediately
    }

    try {
      if (oscillatorRef.current) {
        if (oscillatorRef.current.fmInterval) {
          clearInterval(oscillatorRef.current.fmInterval);
        }
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
        oscillatorRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } catch (e) {
      console.warn('Error releasing audio resources:', e);
    }
  };

  // Monitor notifications unread counts
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    const unread = unreadNotifications.length;

    // Detect if there is any unread SOS alarm
    const unreadSOS = unreadNotifications.filter(n => 
      (n.title && n.title.toLowerCase().includes('emergency')) || 
      (n.message && n.message.toLowerCase().includes('sos'))
    );

    const isResponderOrAdmin = user && (user.role === 'Responder' || user.role === 'Admin');

    if (unreadSOS.length > 0 && isResponderOrAdmin) {
      startLoopingAlarm();
    } else {
      stopLoopingAlarm();
    }

    // Normal non-looping chime for regular notification additions
    if (unread > prevUnreadCount.current) {
      const freshNotifs = unreadNotifications.slice(0, unread - prevUnreadCount.current);
      const hasPanicSOS = freshNotifs.some(n => 
        (n.title && n.title.toLowerCase().includes('emergency')) || 
        (n.message && n.message.toLowerCase().includes('sos'))
      );

      // Play normal chime if it's not an SOS, OR if they are a resident (since residents don't get the looping alarm)
      if (!hasPanicSOS || !isResponderOrAdmin) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12); // A5
            
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          }
        } catch (e) {
          console.error(e);
        }

        if (navigator.vibrate) {
          navigator.vibrate([120, 80, 120]);
        }
      }
    }

    prevUnreadCount.current = unread;
  }, [notifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      stopLoopingAlarm();
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id, refType, refId) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setIsOpen(false);

      // Navigate based on reference
      if (refType === 'incident') {
        navigate(`/incidents/${refId}`);
      } else if (refType === 'news') {
        navigate('/news');
      }
    } catch (err) {
      console.error('Error marking notification as read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error('Error marking all as read', err);
    }
  };

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button className="notif-btn" onClick={() => setIsOpen(!isOpen)} title="Notifications">
        <Bell size={22} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-clear-btn" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">No notifications yet.</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleMarkAsRead(notif.id, notif.reference_type, notif.reference_id)}
                >
                  <div className="notif-item-title">{notif.title}</div>
                  <div className="notif-item-message">{notif.message}</div>
                  <div className="notif-item-time">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
