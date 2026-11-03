import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Eye, EyeOff, Lock, Phone, Heart, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { BARANGAYS } from './Register';
import { useLanguage } from '../context/LanguageContext';

const UserProfile = () => {
  const { t } = useLanguage();
  const { user, updateProfile, changePassword } = useAuth();
  
  // Mobile responsiveness & Tab management
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Format date correctly for input type="date"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch(e) {
      return '';
    }
  };
  
  const [dateOfBirth, setDateOfBirth] = useState(formatDate(user?.date_of_birth));
  const [age, setAge] = useState(user?.age || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [barangay, setBarangay] = useState(user?.barangay || '');
  const [purokSitio, setPurokSitio] = useState(user?.purok_sitio || '');
  const [bloodType, setBloodType] = useState(user?.blood_type || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [medicalConditions, setMedicalConditions] = useState(user?.medical_conditions || '');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.emergency_contact_name || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergency_contact_phone || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Scroll to alert when error or success changes
  const scrollToAlert = () => {
    setTimeout(() => {
      const alertEl = document.getElementById('profile-alert');
      if (alertEl) {
        alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  useEffect(() => {
    if (error || success) scrollToAlert();
  }, [error, success]);

  // Sync state if user updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setDateOfBirth(formatDate(user.date_of_birth));
      setAge(user.age || '');
      setPhone(user.phone || '');
      setBarangay(user.barangay || '');
      setPurokSitio(user.purok_sitio || '');
      setBloodType(user.blood_type || '');
      setAllergies(user.allergies || '');
      setMedicalConditions(user.medical_conditions || '');
      setEmergencyContactName(user.emergency_contact_name || '');
      setEmergencyContactPhone(user.emergency_contact_phone || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    scrollToAlert();
    
    if (fullName.trim().length < 2) {
      setError('Please provide a valid full name.');
      return;
    }
    if (phone && (phone.length !== 11 || !phone.startsWith('09'))) {
      setError('Primary phone number must be a valid 11-digit number starting with 09.');
      return;
    }
    if (age < 0) {
      setError('Date of birth cannot be in the future.');
      return;
    }
    if (emergencyContactPhone && (emergencyContactPhone.length !== 11 || !emergencyContactPhone.startsWith('09'))) {
      setError('Emergency Contact Phone must be a valid 11-digit number starting with 09.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile({ 
        full_name: fullName, 
        email,
        age,
        date_of_birth: dateOfBirth,
        phone, 
        barangay,
        purok_sitio: purokSitio,
        blood_type: bloodType,
        allergies,
        medical_conditions: medicalConditions,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone
      });
      setSuccess('Profile updated successfully.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    scrollToAlert();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify and try again.');
      return;
    }

    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      setError('New password must be at least 8 characters long and contain at least one uppercase letter and one number.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for Initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Helper for Role Badge
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return { bg: '#dbeafe', color: '#1e40af', label: 'MDRRMO Admin' };
      case 'Responder':
        return { bg: '#ffedd5', color: '#c2410c', label: `Responder ${user?.agency_type ? `(${user.agency_type})` : ''}` };
      case 'Resident':
      default:
        return { bg: '#dcfce7', color: '#166534', label: 'Resident' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <div 
      className="content-body" 
      style={{ 
        maxWidth: '960px', 
        margin: '0 auto', 
        paddingBottom: isMobile ? '90px' : '40px' 
      }}
    >

      {/* Profile Hero Header Card */}
      <div 
        style={{
          background: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          padding: isMobile ? '20px 16px' : '24px 28px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          border: '1px solid var(--border-color, #e2e8f0)',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: isMobile ? '16px' : '24px',
          textAlign: isMobile ? 'center' : 'left'
        }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {user?.avatar ? (
            <img 
              src={user.avatar.startsWith('http') ? user.avatar : `https://jamindan.onrender.com${user.avatar}`} 
              alt={user.full_name || 'User'} 
              style={{ width: isMobile ? '72px' : '80px', height: isMobile ? '72px' : '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #10b981' }} 
            />
          ) : (
            <div 
              style={{ 
                width: isMobile ? '72px' : '80px', 
                height: isMobile ? '72px' : '80px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: isMobile ? '26px' : '28px', 
                fontWeight: '800',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
              }}
            >
              {getInitials(user?.full_name || user?.username)}
            </div>
          )}
        </div>

        {/* User Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? '20px' : '22px', fontWeight: '800', color: 'var(--text-main, #1e293b)' }}>
              {user?.full_name || user?.username}
            </h2>
            <span style={{ 
              backgroundColor: roleInfo.bg, 
              color: roleInfo.color,
              fontSize: '12px',
              fontWeight: '700',
              padding: '3px 12px',
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {user?.role === 'Admin' && <ShieldCheck size={12} />}
              {roleInfo.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '14px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
            <span style={{ fontWeight: '600' }}>@{user?.username}</span>
            {user?.barangay && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} style={{ color: '#10b981' }} />
                Brgy. {user.barangay}, Jamindan
              </span>
            )}
            {user?.phone && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={13} style={{ color: '#6366f1' }} />
                {user.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {success && <div id="profile-alert" className="alert alert-success" style={{ fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{success}</div>}
      {error && <div id="profile-alert" className="alert alert-danger" style={{ fontSize: '13px', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px' }}>{error}</div>}

      {/* Mobile Tabs Switcher (Only visible on mobile <= 768px) */}
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
            <User size={16} />
            {t('profileDetails') || 'Profile & Medical'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            style={{
              padding: '11px 8px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'security' ? '#10b981' : 'transparent',
              color: activeTab === 'security' ? '#ffffff' : 'var(--text-main, #334155)',
              fontWeight: activeTab === 'security' ? '700' : '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <ShieldCheck size={16} />
            {t('securitySettings') || 'Security Settings'}
          </button>
        </div>
      )}

      {/* Grid: 2 columns on desktop, single active tab on mobile */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1.45fr 1fr', 
          gap: '24px',
          alignItems: 'start'
        }}
      >
        {/* Profile Info Form */}
        {(!isMobile || activeTab === 'profile') && (
          <div className="card" style={{ padding: isMobile ? '20px 16px' : '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
              <User size={18} style={{ color: '#10b981' }} />
              {t('profileDetails')}
            </h3>

            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {user?.role !== 'Admin' && (
                <div style={{ padding: '12px 14px', backgroundColor: '#eef2ff', color: '#3730a3', borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: '1.4', border: '1px solid #c7d2fe' }}>
                  <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#4f46e5' }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Identity Locked</strong>
                    Identity fields are secured. Please visit the Jamindan Municipal Hall or your local Barangay Hall to request corrections to your account.
                  </div>
                </div>
              )}

              {/* Username */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {t('usernameLabel')} <Lock size={12} style={{ color: '#888' }} />
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={user?.username || ''} 
                  disabled 
                  style={{ backgroundColor: '#f0f2f0', color: '#666', cursor: 'not-allowed', width: '100%' }} 
                />
              </div>

              {/* Full Name & Primary Phone */}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label className="form-label">
                    {t('fullNameLabel')} {user?.role !== 'Admin' && <Lock size={12} style={{ marginLeft: '4px', color: '#888', display: 'inline-block', verticalAlign: 'middle' }} />}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    disabled={user?.role !== 'Admin'} 
                    style={{ backgroundColor: user?.role !== 'Admin' ? '#f0f2f0' : 'white', color: user?.role !== 'Admin' ? '#666' : 'inherit', cursor: user?.role !== 'Admin' ? 'not-allowed' : 'text', width: '100%' }} 
                  />
                </div>

                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                  <label className="form-label">{t('phoneNumberLabel')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={phone} 
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length > 11) val = val.slice(0, 11);
                      setPhone(val);
                    }} 
                    required 
                    style={{ width: '100%' }} 
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Email" 
                  style={{ width: '100%' }} 
                />
              </div>

              {/* Date of Birth & Age */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 100px', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    Date of Birth {user?.role !== 'Admin' && <Lock size={12} style={{ marginLeft: '4px', color: '#888', display: 'inline-block', verticalAlign: 'middle' }} />}
                  </label>
                  <input 
                    type="date" 
                    className="form-input" 
                    style={{ width: '100%', backgroundColor: user?.role !== 'Admin' ? '#f0f2f0' : 'white', color: user?.role !== 'Admin' ? '#666' : 'inherit', cursor: user?.role !== 'Admin' ? 'not-allowed' : 'text' }}
                    value={dateOfBirth} 
                    onChange={(e) => {
                      const dobVal = e.target.value;
                      setDateOfBirth(dobVal);
                      if (dobVal) {
                        const birthDate = new Date(dobVal);
                        const today = new Date();
                        let calcAge = today.getFullYear() - birthDate.getFullYear();
                        const m = today.getMonth() - birthDate.getMonth();
                        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calcAge--;
                        if (calcAge >= 0) setAge(calcAge);
                      }
                    }}
                    disabled={user?.role !== 'Admin'}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Age</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    style={{ width: '100%', backgroundColor: user?.role !== 'Admin' ? '#f0f2f0' : 'white', color: user?.role !== 'Admin' ? '#666' : 'inherit', cursor: user?.role !== 'Admin' ? 'not-allowed' : 'text' }}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={user?.role !== 'Admin'}
                  />
                </div>
              </div>

              {/* Resident Address & Emergency Information */}
              {user?.role === 'Resident' && (
                <>
                  {/* Barangay & Purok */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label">{t('barangayLabel')}</label>
                      <select className="form-select" value={barangay} onChange={(e) => setBarangay(e.target.value)} required style={{ width: '100%' }}>
                        {BARANGAYS.map((brg) => (
                          <option key={brg} value={brg}>{brg}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label">{t('purokSitioLabel')}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder={t('purokSitioPlaceholder')} 
                        value={purokSitio} 
                        onChange={(e) => setPurokSitio(e.target.value)} 
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  {/* Medical Info Section */}
                  <div style={{ border: '1px solid #fed7aa', backgroundColor: '#fffbeb', borderRadius: '12px', padding: '16px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Heart size={18} style={{ color: '#e11d48' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#9a3412', margin: 0 }}>
                        {t('medicalInfoHeading') || 'Emergency Medical Information'}
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#78350f', lineHeight: '1.4' }}>
                      This info is securely shared with Jamindan MDRRMO responders during active rescue operations.
                    </p>
                    
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">{t('bloodTypeLabel')}</label>
                      <select className="form-select" value={bloodType} onChange={(e) => setBloodType(e.target.value)} style={{ width: '100%', background: '#ffffff' }}>
                        <option value="">{t('unknownSelect')}</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">{t('allergiesLabel')}</label>
                      <textarea 
                        className="form-input" 
                        placeholder={t('allergiesPlaceholder')} 
                        value={allergies} 
                        onChange={(e) => setAllergies(e.target.value)} 
                        rows={2} 
                        style={{ resize: 'vertical', minHeight: '60px', width: '100%', background: '#ffffff' }} 
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{t('medicalConditionsLabel')}</label>
                      <textarea 
                        className="form-input" 
                        placeholder={t('medicalConditionsPlaceholder')} 
                        value={medicalConditions} 
                        onChange={(e) => setMedicalConditions(e.target.value)} 
                        rows={2} 
                        style={{ resize: 'vertical', minHeight: '60px', width: '100%', background: '#ffffff' }} 
                      />
                    </div>
                  </div>

                  {/* Emergency Contact Section */}
                  <div style={{ border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Phone size={18} style={{ color: '#2563eb' }} />
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e40af', margin: 0 }}>
                        {t('emergencyContactHeading') || 'Primary Emergency Contact'}
                      </h4>
                    </div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#1e3a8a', lineHeight: '1.4' }}>
                      Someone MDRRMO can reach immediately on your behalf during an emergency.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label">{t('contactNameLabel')}</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={t('contactNamePlaceholder')} 
                          value={emergencyContactName} 
                          onChange={(e) => setEmergencyContactName(e.target.value)} 
                          style={{ width: '100%', background: '#ffffff' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label className="form-label">{t('contactPhoneLabel')}</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={t('contactPhonePlaceholder')} 
                          value={emergencyContactPhone} 
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            if (val.length > 11) val = val.slice(0, 11);
                            setEmergencyContactPhone(val);
                          }} 
                          style={{ width: '100%', background: '#ffffff' }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting} 
                style={{ minHeight: '46px', marginTop: '14px', fontSize: '14px', fontWeight: '700', borderRadius: '10px', width: '100%' }}
              >
                {submitting ? (t('savingDetails') || 'Saving Details...') : (t('saveEmergencyProfile') || 'Save Profile Changes')}
              </button>
            </form>
          </div>
        )}

        {/* Change Password Form */}
        {(!isMobile || activeTab === 'security') && (
          <div className="card" style={{ padding: isMobile ? '20px 16px' : '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, paddingBottom: '12px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              {t('securitySettings')}
            </h3>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              
              {/* Current Password */}
              <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                <label className="form-label">{t('currentPasswordLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    className="form-input" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    required 
                    style={{ width: '100%', paddingRight: '44px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                    aria-label="Toggle Current Password"
                    style={{ 
                      position: 'absolute', 
                      right: '2px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      color: '#64748b', 
                      cursor: 'pointer', 
                      width: '40px', 
                      height: '40px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: 0 
                    }}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                <label className="form-label">{t('newPasswordLabel')}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    className="form-input" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    style={{ width: '100%', paddingRight: '44px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    aria-label="Toggle New Password"
                    style={{ 
                      position: 'absolute', 
                      right: '2px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      color: '#64748b', 
                      cursor: 'pointer', 
                      width: '40px', 
                      height: '40px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: 0 
                    }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', lineHeight: '1.4' }}>
                  Must be at least 8 characters with 1 uppercase letter and 1 number.
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    className="form-input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    style={{ width: '100%', paddingRight: '44px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    aria-label="Toggle Confirm Password"
                    style={{ 
                      position: 'absolute', 
                      right: '2px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      background: 'none', 
                      border: 'none', 
                      color: '#64748b', 
                      cursor: 'pointer', 
                      width: '40px', 
                      height: '40px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      padding: 0 
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && newPassword && (
                  <div style={{ 
                    fontSize: '12px', 
                    marginTop: '6px', 
                    color: confirmPassword === newPassword ? '#16a34a' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '600'
                  }}>
                    {confirmPassword === newPassword ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {confirmPassword === newPassword ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting || (confirmPassword && newPassword && confirmPassword !== newPassword)} 
                style={{ minHeight: '46px', marginTop: '8px', fontSize: '14px', fontWeight: '700', borderRadius: '10px', width: '100%' }}
              >
                {submitting ? 'Updating...' : (t('updatePasswordLabel') || 'Update Password')}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
