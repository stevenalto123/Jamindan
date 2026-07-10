import React from 'react';
import { Menu } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

const Header = ({ title, toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Toggle Sidebar">
          <Menu size={24} />
        </button>
        <div className="header-title-container">
          <h1 className="header-title">{title}</h1>
        </div>
      </div>

      <div className="header-actions">
        <NotificationBell />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '13px' }} className="hide-mobile">
          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{user?.full_name}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.barangay}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
