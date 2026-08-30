import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Home, 
  Map, 
  ShieldAlert, 
  MoreHorizontal,
  FileText,
  AlertTriangle,
  UserCheck,
  Shield
} from 'lucide-react';

const MobileBottomNav = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) return null;

  const isResident = user.role === 'Resident';
  
  const isStatusActive = location.pathname.startsWith('/incidents');

  return (
    <nav className="mobile-bottom-nav">
      <div className="nav-items-container">
        
        {/* Home Tab */}
        <NavLink to={isResident ? "/dashboard" : "/admin"} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={22} className="nav-icon" />
          <span className="nav-label">{t('navHome')}</span>
        </NavLink>

        {/* Report Incident / Dispatch (Middle Button) */}
        {isResident ? (
          <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={22} className="nav-icon" style={{ color: 'var(--danger-color)' }} />
            <span className="nav-label" style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{t('navReport')}</span>
          </NavLink>
        ) : (
          <NavLink to="/incidents" className={`nav-item ${isStatusActive ? 'active' : ''}`}>
            <ShieldAlert size={22} className="nav-icon" style={{ color: 'var(--danger-color)' }} />
            <span className="nav-label" style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>{t('navDispatch')}</span>
          </NavLink>
        )}

        {/* Status / Verify Tab */}
        {isResident ? (
          <NavLink to="/incidents" className={`nav-item ${isStatusActive ? 'active' : ''}`}>
            <FileText size={22} className="nav-icon" />
            <span className="nav-label">{t('navStatus')}</span>
          </NavLink>
        ) : user.role === 'Admin' ? (
          <NavLink to="/verifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <UserCheck size={22} className="nav-icon" />
            <span className="nav-label">{t('navVerify')}</span>
          </NavLink>
        ) : (
          <NavLink to="/responders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Shield size={22} className="nav-icon" />
            <span className="nav-label">{t('navTeammates')}</span>
          </NavLink>
        )}

        {/* Map / Evacuation Tab */}
        <NavLink to="/evacuation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Map size={22} className="nav-icon" />
          <span className="nav-label">{t('navMap')}</span>
        </NavLink>

        {/* More Tab */}
        <NavLink to="/more" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MoreHorizontal size={22} className="nav-icon" />
          <span className="nav-label">{t('navMore')}</span>
        </NavLink>

      </div>
    </nav>
  );
};

export default MobileBottomNav;
