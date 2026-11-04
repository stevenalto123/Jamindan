import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Phone, MapPin, Calendar, Activity, X, RotateCw, Mail, Heart, AlertCircle, ShieldAlert, Users, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AdminViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [household, setHousehold] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Mobile responsiveness & Segmented Tabs
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'history'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Image Viewer State
  const [viewImage, setViewImage] = useState(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${id}/profile`);
        setProfile(res.data.user);
        setIncidents(res.data.incidents || []);
        setStats(res.data.stats || {});
        
        if (res.data.user?.role === 'Resident') {
          const householdRes = await axios.get(`/api/household/admin/${id}`);
          setHousehold(householdRes.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load user profile. They may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleCloseImage = () => {
    setViewImage(null);
    setRotation(0);
  };

  const handleRotate = (e) => {
    e.stopPropagation();
    setRotation(prev => prev + 90);
  };

  if (loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      Loading profile...
    </div>
  );
  if (error || !profile) return <div style={{ padding: '40px', color: 'var(--danger-color)', textAlign: 'center', fontWeight: 'bold' }}>{error || 'User not found'}</div>;

  const renderRoleBadge = (role, agency) => {
    switch (role) {
      case 'Admin': return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>Admin</span>;
      case 'Responder': return <span style={{ background: '#ffedd5', color: '#c2410c', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>Responder {agency ? `(${agency})` : ''}</span>;
      case 'Resident': return <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>Resident</span>;
      default: return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>{role}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>Pending</span>;
      case 'Dispatched': return <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>Dispatched</span>;
      case 'In Progress': return <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>In Progress</span>;
      case 'Resolved': return <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>Resolved</span>;
      case 'False Alarm': return <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>False Alarm</span>;
      default: return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>{status}</span>;
    }
  };

  return (
    <div 
      className="content-body" 
      style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        paddingBottom: isMobile ? '90px' : '40px' 
      }}
    >
      
      {/* Header with Back Button and Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: isMobile ? '16px' : '24px' }}>
        <button 
          onClick={() => navigate('/users')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '42px', 
            height: '42px', 
            background: 'var(--card-bg)', 
            border: '1px solid var(--border-color)', 
            borderRadius: '12px', 
            color: 'var(--text-main)', 
            cursor: 'pointer', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', 
            transition: 'transform 0.2s',
            flexShrink: 0
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          aria-label="Back to Users"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', fontWeight: '800', color: 'var(--text-main)' }}>
            User Profile
          </h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            ID #{profile.id} • {profile.role}
          </span>
        </div>
      </div>

      {/* Mobile Segmented Tab Switcher (Only visible on mobile <= 768px) */}
      {isMobile && (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            background: 'var(--card-bg, #ffffff)', 
            padding: '4px', 
            borderRadius: '12px', 
            border: '1px solid var(--border-color, #e2e8f0)',
            marginBottom: '16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '11px 8px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'profile' ? '#10b981' : 'transparent',
              color: activeTab === 'profile' ? '#ffffff' : 'var(--text-main, #334155)',
              fontWeight: activeTab === 'profile' ? '700' : '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={15} />
            Profile & Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '11px 8px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'history' ? '#10b981' : 'transparent',
              color: activeTab === 'history' ? '#ffffff' : 'var(--text-main, #334155)',
              fontWeight: activeTab === 'history' ? '700' : '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Activity size={15} />
            Incidents ({incidents.length})
          </button>
        </div>
      )}

      {/* Responsive Grid: side-by-side on desktop, single active tab on mobile */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', 
          gap: isMobile ? '16px' : '24px', 
          alignItems: 'start' 
        }}
      >
        
        {/* Left Column: Profile Card */}
        {(!isMobile || activeTab === 'profile') && (
          <div 
            style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '16px', 
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
              border: '1px solid var(--border-color)', 
              padding: isMobile ? '20px 16px' : '32px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: isMobile ? '18px' : '24px' 
            }}
          >
            
            <div style={{ textAlign: 'center' }}>
              {profile.avatar ? (
                <img 
                  src={profile.avatar.startsWith('http') ? profile.avatar : `https://jamindan.onrender.com${profile.avatar}`} 
                  alt="Avatar" 
                  style={{ width: isMobile ? '90px' : '120px', height: isMobile ? '90px' : '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '14px', border: '4px solid #f1f5f9' }} 
                />
              ) : (
                <div style={{ width: isMobile ? '90px' : '120px', height: isMobile ? '90px' : '120px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', border: '4px solid #e2e8f0' }}>
                  <User size={isMobile ? 38 : 48} color="#94a3b8" />
                </div>
              )}
              <h2 style={{ margin: '0 0 6px 0', color: 'var(--text-main)', fontSize: isMobile ? '20px' : '22px', fontWeight: '800' }}>{profile.full_name}</h2>
              <p style={{ margin: '0 0 14px 0', color: 'var(--primary-color)', fontWeight: '600', fontSize: '14px' }}>@{profile.username}</p>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {renderRoleBadge(profile.role, profile.agency_type)}
                {profile.is_active === 1 ? (
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>Active Account</span>
                ) : (
                  <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>Deactivated</span>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)' }}></div>

            {/* Contact & Location Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                  <User size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Age & Date of Birth</span>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>
                    {profile.age || 'N/A'} yrs old {profile.date_of_birth ? `(${new Date(profile.date_of_birth).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})` : ''}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                  <Phone size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Phone Number</span>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{profile.phone}</span>
                </div>
              </div>
              {profile.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                    <Mail size={18} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Email Address</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', wordBreak: 'break-all' }}>{profile.email}</span>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                  <MapPin size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Location (Barangay)</span>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{profile.barangay} {profile.purok_sitio ? `(${profile.purok_sitio})` : ''}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-main)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', flexShrink: 0 }}>
                  <Calendar size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Date Joined</span>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Medical Info Section */}
            {(profile.blood_type || profile.allergies || profile.medical_conditions || profile.emergency_contact_name) && (
              <>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={18} color="#e11d48" /> Medical & Emergency
                  </h4>
                  
                  {profile.blood_type && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: '600' }}>Blood Type</span>
                      <span style={{ fontWeight: '700', color: '#e11d48', background: '#ffe4e6', padding: '2px 8px', borderRadius: '6px', fontSize: '13px' }}>{profile.blood_type}</span>
                    </div>
                  )}
                  {profile.allergies && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: '600' }}>Allergies</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px', background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>{profile.allergies}</span>
                    </div>
                  )}
                  {profile.medical_conditions && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ color: 'var(--text-light)', fontSize: '13px', fontWeight: '600' }}>Medical Conditions</span>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '14px', background: '#f1f5f9', padding: '8px', borderRadius: '8px' }}>{profile.medical_conditions}</span>
                    </div>
                  )}
                  {profile.emergency_contact_name && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px' }}>
                      <span style={{ color: '#92400e', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Emergency Contact</span>
                      <span style={{ fontWeight: '700', color: '#92400e', fontSize: '15px' }}>{profile.emergency_contact_name}</span>
                      <span style={{ fontWeight: '600', color: '#b45309', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14}/> {profile.emergency_contact_phone}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Household Members Section */}
            {household && household.length > 0 && (
              <>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="#8b5cf6" /> Household Members ({household.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {household.map((member) => (
                      <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>{member.full_name}</span>
                          {member.medical_notes && (
                            <span style={{ color: '#e11d48', fontSize: '12px', fontWeight: '500' }}>Med: {member.medical_notes}</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Age {member.age}</span>
                          <span style={{ fontSize: '11px', color: '#6366f1', background: '#e0e7ff', padding: '3px 8px', borderRadius: '12px', fontWeight: '700' }}>{member.gender}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Identification Photos */}
            {(profile.id_photo_path || profile.selfie_photo_path) && (
              <>
                <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldAlert size={18} color="var(--primary-color)" /> Verification Documents
                  </h4>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                    {profile.id_photo_path && (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Valid ID ({profile.id_type || 'N/A'})</span>
                        <div 
                          style={{ width: '100%', height: isMobile ? '140px' : '100px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0', cursor: 'zoom-in', position: 'relative' }}
                          onClick={() => setViewImage(profile.id_photo_path.startsWith('http') ? profile.id_photo_path : `https://jamindan.onrender.com${profile.id_photo_path}`)}
                        >
                          <img 
                            src={profile.id_photo_path.startsWith('http') ? profile.id_photo_path : `https://jamindan.onrender.com${profile.id_photo_path}`} 
                            alt="ID Document" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.05)' }}></div>
                        </div>
                      </div>
                    )}
                    {profile.selfie_photo_path && (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Live Selfie</span>
                        <div 
                          style={{ width: '100%', height: isMobile ? '140px' : '100px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #e2e8f0', cursor: 'zoom-in', position: 'relative' }}
                          onClick={() => setViewImage(profile.selfie_photo_path.startsWith('http') ? profile.selfie_photo_path : `https://jamindan.onrender.com${profile.selfie_photo_path}`)}
                        >
                          <img 
                            src={profile.selfie_photo_path.startsWith('http') ? profile.selfie_photo_path : `https://jamindan.onrender.com${profile.selfie_photo_path}`} 
                            alt="Selfie" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.05)' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right Column: Stats and History */}
        {(!isMobile || activeTab === 'history') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', minWidth: 0 }}>
            
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '12px' : '24px' }}>
              <div style={{ background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', padding: isMobile ? '16px 12px' : '24px', display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
                <div style={{ background: '#eff6ff', width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={isMobile ? 22 : 28} color="#3b82f6" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: isMobile ? '11px' : '14px', color: 'var(--text-light)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {profile.role === 'Resident' ? 'Reported' : 'Handled'}
                  </span>
                  <span style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>{stats?.totalIncidents || 0}</span>
                </div>
              </div>
              
              <div style={{ background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', padding: isMobile ? '16px 12px' : '24px', display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px' }}>
                <div style={{ background: '#f0fdf4', width: isMobile ? '44px' : '56px', height: isMobile ? '44px' : '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={isMobile ? 22 : 28} color="#22c55e" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: isMobile ? '11px' : '14px', color: 'var(--text-light)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Resolved
                  </span>
                  <span style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1' }}>{stats?.resolvedIncidents || 0}</span>
                </div>
              </div>
            </div>

            {/* Incident History Card */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: isMobile ? '16px' : '24px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: isMobile ? '16px' : '18px', fontWeight: '800' }}>Incident History</h3>
              </div>
              
              {incidents.length === 0 ? (
                <div style={{ padding: isMobile ? '40px 20px' : '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600' }}>
                  No incidents found for this user.
                </div>
              ) : (
                <div style={{ overflowX: 'auto', padding: isMobile ? '8px' : '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: isMobile ? '0 10px' : '0 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>Date</th>
                        <th style={{ padding: isMobile ? '0 10px' : '0 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>Type</th>
                        <th style={{ padding: isMobile ? '0 10px' : '0 16px', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>Location</th>
                        <th style={{ padding: isMobile ? '0 10px' : '0 16px', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidents.map(inc => (
                        <tr key={inc.id} style={{ background: '#f8fafc', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                          <td style={{ padding: isMobile ? '12px 10px' : '16px', borderRadius: '12px 0 0 12px', fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                            {new Date(inc.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td style={{ padding: isMobile ? '12px 10px' : '16px', fontSize: isMobile ? '12px' : '14px', fontWeight: '800', color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>
                            {inc.type}
                          </td>
                          <td style={{ padding: isMobile ? '12px 10px' : '16px', fontSize: isMobile ? '12px' : '13px', color: 'var(--text-light)', maxWidth: isMobile ? '140px' : '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                            {inc.location_address || 'Jamindan'}
                          </td>
                          <td style={{ padding: isMobile ? '12px 10px' : '16px', borderRadius: '0 12px 12px 0', textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {getStatusBadge(inc.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Premium Full Screen Image Viewer Modal */}
      {viewImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={handleCloseImage}>
          
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '16px', zIndex: 10001 }}>
            <button 
              style={{ background: 'white', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
              onClick={handleRotate}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              title="Rotate Image 90°"
            >
              <RotateCw size={24} color="#0f172a" />
            </button>
            <button 
              style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '48px', height: '48px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
              onClick={handleCloseImage}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
              title="Close Viewer"
            >
              <X size={24} color="white" />
            </button>
          </div>

          <div style={{ padding: '24px', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img 
              src={viewImage} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                transform: `rotate(${rotation}deg)`,
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '8px',
                boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
              }} 
              alt="Full screen view" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminViewUser;
