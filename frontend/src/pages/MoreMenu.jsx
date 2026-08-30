import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Users, 
  PhoneCall, 
  Radio, 
  BookOpen, 
  Settings as SettingsIcon,
  LogOut,
  ChevronRight
} from 'lucide-react';

const MoreMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { title: 'My Profile', icon: <User size={20} />, link: '/profile', color: '#3498db' },
    { title: 'Household List', icon: <Users size={20} />, link: '/household', color: '#9b59b6' },
    { title: 'Emergency Hotlines', icon: <PhoneCall size={20} />, link: '/hotlines', color: '#e74c3c' },
    { title: 'News & Updates', icon: <Radio size={20} />, link: '/news', color: '#f39c12' },
    { title: 'Emergency Tips', icon: <BookOpen size={20} />, link: '/tips', color: '#2ecc71' },
    { title: 'Settings', icon: <SettingsIcon size={20} />, link: '/settings', color: '#7f8c8d' }
  ];

  return (
    <div className="content-body" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '80px' }}>

      {/* User Mini Profile Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
          {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'U'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-main)' }}>{user?.full_name}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{user?.barangay} • {user?.role}</div>
        </div>
      </div>

      {/* Menu List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {menuItems.map((item, index) => (
          <Link 
            key={index}
            to={item.link} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              backgroundColor: 'var(--card-bg)', 
              padding: '16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-color)', 
              textDecoration: 'none',
              color: 'var(--text-main)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: `${item.color}20`, color: item.color, padding: '8px', borderRadius: '8px', display: 'flex' }}>
                {item.icon}
              </div>
              <span style={{ fontWeight: '600', fontSize: '15px' }}>{item.title}</span>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </Link>
        ))}

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px',
            backgroundColor: '#fdf2f2', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid #fadbd8', 
            color: 'var(--danger-color)',
            fontWeight: '700',
            fontSize: '15px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          <LogOut size={18} />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default MoreMenu;
