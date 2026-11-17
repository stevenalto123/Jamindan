import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Globe, Moon, Sun, LogOut, ChevronRight } from 'lucide-react';

const Settings = () => {
  const { lang, toggleLanguage, t } = useLanguage();
  const { logout, subscribeToPushNotifications } = useAuth();

  const [pushEnabled, setPushEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && window.Notification?.permission === 'granted'
  );
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return document.documentElement.getAttribute('data-theme') === 'dark' || localStorage.getItem('theme') === 'dark';
    } catch (e) {
      return false;
    }
  });
  const [statusNote, setStatusNote] = useState('');

  const handleDarkModeToggle = () => {
    const nextDark = !darkMode;
    const nextTheme = nextDark ? 'dark' : 'light';
    setDarkMode(nextDark);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('theme', nextTheme);
    } catch (e) {
      // Ignore storage error
    }
  };

  const handlePushToggle = async () => {
    setStatusNote('');
    const supportsNotification = typeof window !== 'undefined' && 'Notification' in window && Boolean(window.Notification);
    if (!supportsNotification) {
      setStatusNote('On iPhone/iPad Safari, add this app to your Home Screen (Share -> Add to Home Screen) to enable Push Notifications.');
      return;
    }

    if (!pushEnabled) {
      try {
        const perm = await window.Notification.requestPermission();
        if (perm === 'granted') {
          setPushEnabled(true);
          if (subscribeToPushNotifications) {
            await subscribeToPushNotifications(false);
          }
          setStatusNote('Push notifications are now enabled for emergency alerts.');
        } else {
          setStatusNote('Notification permission was not granted. Please allow notifications in your browser or phone settings.');
        }
      } catch (err) {
        setStatusNote('Unable to enable push notifications in this browser context.');
      }
    } else {
      setStatusNote('To disable push notifications, update notification permissions in your browser or phone settings.');
    }
  };

  return (
    <div className="content-body" style={{ paddingBottom: '80px', margin: '0 auto', maxWidth: '680px' }}>
      {statusNote && (
        <div className="alert alert-info" style={{ marginBottom: '16px', fontSize: '13px' }}>
          {statusNote}
        </div>
      )}

      <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px', overflow: 'hidden' }}>

        {/* Language Setting */}
        <div
          onClick={toggleLanguage}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: 'rgba(25, 118, 210, 0.12)', borderRadius: '8px' }}>
              <Globe size={20} color="#1976d2" />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)' }}>{t('language')}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{lang === 'en' ? 'English' : 'Hiligaynon'}</div>
            </div>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </div>

        {/* Dark Mode Setting */}
        <div
          onClick={handleDarkModeToggle}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: 'rgba(139, 92, 246, 0.12)', borderRadius: '8px' }}>
              {darkMode ? <Moon size={20} color="#8b5cf6" /> : <Sun size={20} color="#f59e0b" />}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)' }}>Appearance</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{darkMode ? 'Dark Mode' : 'Light Mode'}</div>
            </div>
          </div>
          <div style={{ width: '40px', height: '22px', backgroundColor: darkMode ? 'var(--primary-color)' : '#cbd5e1', borderRadius: '11px', position: 'relative', transition: '0.3s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: darkMode ? '20px' : '2px', transition: '0.3s' }}></div>
          </div>
        </div>

        {/* Push Notifications Setting */}
        <div
          onClick={handlePushToggle}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: 'rgba(56, 142, 60, 0.12)', borderRadius: '8px' }}>
              <Bell size={20} color="#388e3c" />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)' }}>{t('pushNotifications')}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{pushEnabled ? t('enabled') : t('disabled')}</div>
            </div>
          </div>
          <div style={{ width: '40px', height: '22px', backgroundColor: pushEnabled ? 'var(--primary-color)' : '#cbd5e1', borderRadius: '11px', position: 'relative', transition: '0.3s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: pushEnabled ? '20px' : '2px', transition: '0.3s' }}></div>
          </div>
        </div>

      </div>

      <button
        onClick={logout}
        className="btn"
        style={{ width: '100%', backgroundColor: 'rgba(198, 40, 40, 0.12)', color: '#dc2626', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold' }}
      >
        <LogOut size={20} />
        {t('logout')}
      </button>

    </div>
  );
};

export default Settings;
