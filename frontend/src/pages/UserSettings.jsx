import React, { useState } from 'react';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';

const UserSettings = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="content-body" style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Settings</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Configure your platform preferences</p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={18} />
          Notification Settings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Email Emergency Advisories</div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Receive real-time public advisories on your registered email address.</div>
            </div>
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
              onClick={() => setEmailAlerts(!emailAlerts)}
            >
              {emailAlerts ? <ToggleRight size={36} /> : <ToggleLeft size={36} style={{ color: 'var(--text-muted)' }} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>SMS Emergency Advisories</div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Receive critical weather warnings and evacuation notices via text message (SMS).</div>
            </div>
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
              onClick={() => setSmsAlerts(!smsAlerts)}
            >
              {smsAlerts ? <ToggleRight size={36} /> : <ToggleLeft size={36} style={{ color: 'var(--text-muted)' }} />}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Dark Theme Interface</div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Switch the application theme color scheme to high-contrast dark mode.</div>
            </div>
            <button 
              type="button" 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)' }}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <ToggleRight size={36} /> : <ToggleLeft size={36} style={{ color: 'var(--text-muted)' }} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
