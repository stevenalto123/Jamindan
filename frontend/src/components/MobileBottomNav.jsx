import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Map, 
  ShieldAlert, 
  MoreHorizontal,
  FileText,
  AlertTriangle
} from 'lucide-react';

const MobileBottomNav = () => {
  const { user } = useAuth();
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
          <span className="nav-label">Home</span>
        </NavLink>

        {/* Report Incident (NEW) */}
        {isResident ? (
          <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={22} className="nav-icon" style={{ color: 'var(--danger-color)' }} />
            <span className="nav-label" style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>Report</span>
          </NavLink>
        ) : (
          <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShieldAlert size={22} className="nav-icon" />
            <span className="nav-label">Dispatch</span>
          </NavLink>
        )}

        {/* Status / Reports Tab */}
        <NavLink to="/incidents" className={`nav-item ${isStatusActive ? 'active' : ''}`}>
          {isResident ? <FileText size={22} className="nav-icon" /> : <AlertTriangle size={22} className="nav-icon" />}
          <span className="nav-label">Status</span>
        </NavLink>

        {/* Map / Evacuation Tab */}
        <NavLink to="/evacuation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Map size={22} className="nav-icon" />
          <span className="nav-label">Map</span>
        </NavLink>

        {/* More Tab */}
        <NavLink to="/more" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MoreHorizontal size={22} className="nav-icon" />
          <span className="nav-label">More</span>
        </NavLink>

      </div>
    </nav>
  );
};

export default MobileBottomNav;
