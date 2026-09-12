import React from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Header = ({ title, toggleSidebar }) => {
  const { user } = useAuth();
  const { lang, toggleLanguage } = useLanguage();

  return (
    <header className="header" style={{ padding: '0', display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1000px', width: '100%', padding: '24px 24px 8px 24px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle Sidebar">
            <Menu size={24} />
          </button>
          <div className="header-title-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="header-title">{title}</h1>
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
          
          {user?.role !== 'Responder' && <NotificationBell />}

          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px' }} className="hide-mobile">
            <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '13px' }}>{user?.full_name}</span>
            <div className="avatar-circle" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
              {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
