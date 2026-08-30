import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Bell, Globe, Moon, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { language, toggleLanguage, translate } = useLanguage();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
  const [darkMode, setDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark');

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setPushEnabled(true);
          // Need to reload to run SW subscription in background
          window.location.reload(); 
        } else {
          alert('You must allow notifications in your browser settings.');
        }
      }
    } else {
      alert('To disable push notifications, please change the permission in your browser or phone settings.');
    }
  };

  return (
    <div className="content-body" style={{ paddingBottom: '80px', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px', overflow: 'hidden' }}>
        
        {/* Language Setting */}
        <div 
          onClick={toggleLanguage}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
              <Globe size={20} color="#1976d2" />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-color)' }}>Language</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{language === 'en' ? 'English' : 'Hiligaynon'}</div>
            </div>
          </div>
          <ChevronRight size={20} color="#ccc" />
        </div>

        {/* Notifications Setting */}
        <div 
          onClick={handlePushToggle}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
              <Bell size={20} color="#388e3c" />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-color)' }}>Push Notifications</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{pushEnabled ? 'Enabled' : 'Disabled'}</div>
            </div>
          </div>
          <div style={{ width: '40px', height: '22px', backgroundColor: pushEnabled ? 'var(--primary-color)' : '#ccc', borderRadius: '11px', position: 'relative', transition: '0.3s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: pushEnabled ? '20px' : '2px', transition: '0.3s' }}></div>
          </div>
        </div>

        {/* Dark Mode Setting */}
        <div 
          onClick={toggleDarkMode}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #eee', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
              <Moon size={20} color="#f57c00" />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-color)' }}>Dark Mode</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Currently {darkMode ? 'On' : 'Off'}</div>
            </div>
          </div>
          <div style={{ width: '40px', height: '22px', backgroundColor: darkMode ? 'var(--primary-color)' : '#ccc', borderRadius: '11px', position: 'relative', transition: '0.3s' }}>
            <div style={{ width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: darkMode ? '20px' : '2px', transition: '0.3s' }}></div>
          </div>
        </div>

        {/* Account Settings */}
        <div 
          onClick={() => navigate('/profile')}
          style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '8px', backgroundColor: '#fce4ec', borderRadius: '8px' }}>
              <Shield size={20} color="#c2185b" />
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-color)' }}>Account & Security</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Update profile or password</div>
            </div>
          </div>
          <ChevronRight size={20} color="#ccc" />
        </div>

      </div>

      <button 
        onClick={logout}
        className="btn" 
        style={{ width: '100%', backgroundColor: '#ffebee', color: '#c62828', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold' }}
      >
        <LogOut size={20} />
        Log Out
      </button>

    </div>
  );
};

export default Settings;
