import React from 'react';
import { NavLink } from 'react-router-dom';
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
  FileBarChart
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

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
        <h2 className="sidebar-appname">Emergency Response</h2>
        <span className="sidebar-subtitle">Capiz, Philippines</span>
      </div>

      <nav className="sidebar-menu">
        {/* Resident Sidebar Items */}
        {isResident && (
          <>
            <li className="sidebar-item">
              <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/report" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <AlertTriangle size={18} />
                <span>Report Incident</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/incidents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <FileText size={18} />
                <span>Track Status</span>
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
            <li className="sidebar-item">
              <NavLink to="/notifications" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Bell size={18} />
                <span>Notifications</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <User size={18} />
                <span>Profile</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </li>
          </>
        )}

        {/* Admin / Responder Sidebar Items */}
        {(isAdmin || isResponder) && (
          <>
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
            <li className="sidebar-item">
              <NavLink to="/reports" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <FileBarChart size={18} />
                <span>Reports</span>
              </NavLink>
            </li>
          </>
        )}

        {isAdmin && (
          <>
            <li className="sidebar-item">
              <NavLink to="/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Users size={18} />
                <span>Users</span>
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

        {(isAdmin || isResponder) && (
          <>
            <li className="sidebar-item">
              <NavLink to="/news" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Radio size={18} />
                <span>Announcements</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/logs" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <History size={18} />
                <span>System Logs</span>
              </NavLink>
            </li>
            <li className="sidebar-item">
              <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={handleLinkClick}>
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </li>
          </>
        )}

        <li className="sidebar-item" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
          <button onClick={logout} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </li>
      </nav>
    </aside>
  );
};

export default Sidebar;
