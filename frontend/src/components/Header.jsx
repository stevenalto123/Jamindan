import React from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSystem } from '../context/SystemContext';
import { AlertTriangle } from 'lucide-react';

const Header = ({ title, toggleSidebar }) => {
  const { user } = useAuth();
  const { lang, toggleLanguage } = useLanguage();
  const { settings } = useSystem();
  
  const isMciActive = settings?.mci_mode;

  return (
    <header className="header" style={isMciActive ? { backgroundColor: '#c0392b', color: 'white' } : {}}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle Sidebar" style={isMciActive ? { color: 'white' } : {}}>
          <Menu size={24} />
        </button>
        <div className="header-title-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1 className="header-title" style={isMciActive ? { color: 'white' } : {}}>{title}</h1>
          {isMciActive && (
            <span style={{ backgroundColor: '#fff', color: '#c0392b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={12} /> MCI ACTIVE
            </span>
          )}
        </div>
      </div>

      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {/* Epic Feature 2: Language Toggle */}
        <button 
          onClick={toggleLanguage}
          className="btn btn-outline"
          style={{ padding: '4px 8px', fontSize: '12px', fontWeight: 'bold' }}
          title="Toggle English / Hiligaynon"
        >
          {lang === 'en' ? 'EN | hil' : 'en | HIL'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '13px' }} className="hide-mobile">
          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user?.full_name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
