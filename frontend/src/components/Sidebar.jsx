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
  HeartPulse
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
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
    <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-wrapper">
          <img src="/logo.png" alt="Jamindan Seal" className="sidebar-seal" />
        </div>
        <div>
          <h2 className="sidebar-appname">Emergency Response</h2>
          <span className="sidebar-subtitle" style={{ letterSpacing: '0.5px' }}>CAPIZ, PHILIPPINES</span>
        </div>
      </div>

      <div className="sidebar-user-card">
        <div className="sidebar-user-avatar">
          {(user.full_name || user.first_name || user.username) ? (user.full_name || user.first_name || user.username)[0].toUpperCase() : <User size={20} />}
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user.full_name || (user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username)}</span>
          <span className="sidebar-user-role">{user.role}</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        {/* Resident Sidebar Items */}
        {isResident && (
          <>
            <div className="sidebar-section-header">{t('mainMenu')}</div>
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

             <div className="sidebar-section-header">{t('resourcesTitle')}</div>
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
                 <span>{t('newsUpdates')}</span>
               </NavLink>
             </li>
            <li className="sidebar-item">
              <NavLink to="/tips" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <BookOpen size={18} />
                <span>{t('emergencyTips')}</span>
              </NavLink>
            </li>

            <div className="sidebar-section-header">{t('accountTitle')}</div>
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
            <div className="sidebar-section-header">{t('operationsTitle')}</div>
            <li className="sidebar-item">
              <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <LayoutDashboard size={18} />
                <span>{t('dashboard')}</span>
              </NavLink>
            </li>
             <li className="sidebar-item">
               <NavLink to="/incidents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <AlertTriangle size={18} />
                 <span>{t('incidentsList')}</span>
               </NavLink>
             </li>

             <div className="sidebar-section-header">{t('commandCenterTitle')}</div>
             <li className="sidebar-item">
               <NavLink to="/evacuation" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Map size={18} />
                 <span>{t('evacuationCenters')}</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/hotlines" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <PhoneCall size={18} />
                 <span>{t('hotlines')}</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/responders" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Shield size={18} />
                 <span>{t('respondersTitle')}</span>
               </NavLink>
             </li>
             <li className="sidebar-item">
               <NavLink to="/news" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                 <Radio size={18} />
                 <span>{t('newsUpdates')}</span>
               </NavLink>
             </li>
          </>
        )}

        {isAdmin && (
          <>
            <div className="sidebar-section-header">{t('administrationTitle')}</div>
            <li className="sidebar-item">
              <NavLink to="/verifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <UserCheck size={18} />
                <span>{t('verifications')}</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Users size={18} />
                <span>{t('userManagement')}</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <History size={18} />
                <span>{t('systemLogs')}</span>
              </NavLink>
            </li>
          </>
        )}

        {(isAdmin || isResponder) && (
          <>
            <div className="sidebar-section-header">{t('accountTitle')}</div>
            <li className="sidebar-item">
              <NavLink to="/notifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Bell size={18} />
                <span>{t('notifications') || 'Notifications'}</span>
                {unreadCount > 0 && <span className="notif-badge-sidebar">{unreadCount}</span>}
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Settings size={18} />
                <span>{t('settingsTitle')}</span>
              </NavLink>
            </li>
          </>
        )}

        {/* Unconditional profile (renders inside Account for Admin/Responder, and at the end of Account for Resident) */}
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
      </nav>
    </aside>
  );
};

export default Sidebar;
