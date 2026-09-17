import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileText, 
  Users, 
  Radio, 
  LogOut,
  Bell,
  BookOpen,
  User,
  Settings,
  Shield,
  History,
  FileBarChart,
  Map,
  PhoneCall,
  UserCheck,
  HeartPulse,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ isOpen, toggleSidebar, isDesktopCollapsed, toggleDesktopSidebar }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await axios.get('/api/notifications');
        setUnreadCount(res.data.filter(n => !n.is_read).length);
      } catch (err) {
        console.error('Failed to fetch sidebar notifications', err);
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const isAdmin = user.role === 'Admin';
  const isResponder = user.role === 'Responder';
  const isResident = user.role === 'Resident';

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'active' : ''} ${isDesktopCollapsed ? 'desktop-collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-wrapper">
          <img src="/logo.png" alt="Jamindan Seal" className="sidebar-seal" />
        </div>
        <div>
          <h2 className="sidebar-appname">Emergency<br/>Response</h2>
          <span className="sidebar-subtitle">Capiz, Philippines</span>
        </div>
      </div>

      <div className="sidebar-user-card">
        <div className="sidebar-user-avatar">
          {user.first_name ? user.first_name[0].toUpperCase() : <User size={20} />}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user.first_name} {user.last_name}</span>
          <span className="sidebar-user-role">{user.role}</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {/* Resident Sidebar Items */}
        {isResident && (
          <>
            <div className="sidebar-section-header">Main Menu</div>
            <li className="sidebar-item">
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <LayoutDashboard size={18} />
                <span>{t('dashboard')}</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/report" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <AlertTriangle size={18} />
                <span>{t('reportIncident')}</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
               <NavLink to="/incidents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <FileText size={18} />
                 <span>{t('reports')}</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/household" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Users size={18} />
                 <span>{t('household')}</span>
               </NavLink>
             </li>

             <div className="sidebar-section-header">Resources</div>
             <li className="sidebar-item">
               <NavLink to="/evacuation" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Map size={18} />
                 <span>{t('evacuation')}</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/hotlines" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <PhoneCall size={18} />
                 <span>{t('hotlines')}</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/news" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Radio size={18} />
                 <span>News & Updates</span>
               </NavLink>
             </li>
            <li className="sidebar-item">
              <NavLink to="/tips" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <BookOpen size={18} />
                <span>Emergency Tips</span>
              </NavLink>
            </li>

            <div className="sidebar-section-header">Account</div>
            <li className="sidebar-item">
              <NavLink to="/notifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Bell size={18} />
                <span>{t('notifications')}</span>
                {unreadCount > 0 && <span className="notif-badge-sidebar">{unreadCount}</span>}
              </NavLink>
            </li>
          </>
        )}

        {/* Admin / Responder Sidebar Items */}
        {(isAdmin || isResponder) && (
          <>
            <div className="sidebar-section-header">Operations</div>
            <li className="sidebar-item">
              <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
             <li className="sidebar-item">
               <NavLink to="/incidents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <AlertTriangle size={18} />
                 <span>Incidents</span>
               </NavLink>
             </li>

             <div className="sidebar-section-header">Command Center</div>
             <li className="sidebar-item">
               <NavLink to="/evacuation" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Map size={18} />
                 <span>Evacuation Centers</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/hotlines" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <PhoneCall size={18} />
                 <span>Hotlines Directory</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/responders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Shield size={18} />
                 <span>Responders</span>
               </NavLink>
             </li>
          </>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-section-header">Administration</div>
            <li className="sidebar-item">
              <NavLink to="/verifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <UserCheck size={18} />
                <span>Verifications</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Users size={18} />
                <span>Users</span>
              </NavLink>
            </li>
          </>
        )}

        {(isAdmin || isResponder) && (
          <li className="sidebar-item">
            <NavLink to="/news" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
              <Radio size={18} />
              <span>Announcements</span>
            </NavLink>
          </li>
        )}

        {isAdmin && (
          <li className="sidebar-item">
            <NavLink to="/logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
              <History size={18} />
              <span>System Logs</span>
            </NavLink>
          </li>
        )}

        {(isAdmin || isResponder) && (
          <>
            <div className="sidebar-section-header">Account</div>
            <li className="sidebar-item">
              <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </li>
          </>
        )}

        <li className="sidebar-item">
          <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
            <User size={18} />
            <span>{t('profile') || 'Profile'}</span>
          </NavLink>
        </li>

        <li className="sidebar-item" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
          <button onClick={logout} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={18} />
            <span>{t('logout')}</span>
          </button>
        </li>

        {/* Collapse Toggle for Desktop */}
        <button 
          onClick={toggleDesktopSidebar}
          className="desktop-collapse-btn"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: 'none',
            color: 'white',
            padding: '10px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isDesktopCollapsed ? '100%' : 'auto',
            marginLeft: isDesktopCollapsed ? '0' : 'auto'
          }}
          title={isDesktopCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isDesktopCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
