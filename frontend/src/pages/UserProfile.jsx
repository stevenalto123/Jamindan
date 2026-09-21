import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { BARANGAYS } from './Register';
import { useLanguage } from '../context/LanguageContext';

const UserProfile = () => {
  const { t } = useLanguage();
  const { user, updateProfile, changePassword } = useAuth();
  
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const scrollToAlert = () => {
    setTimeout(() => {
      const alertEl = document.getElementById('profile-alert');
      if (alertEl) {
        alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        document.getElementById('main-content-area')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  useEffect(() => {
    if (error || success) scrollToAlert();
  }, [error, success]);

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
      setError('Failed to update profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    scrollToAlert();
    if (!currentPassword || !newPassword) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: '900px', margin: '0 auto' }}>

      {success && <div id="profile-alert" className="alert alert-success" style={{ fontSize: '13px', padding: '10px 14px' }}>{success}</div>}
      {error && <div id="profile-alert" className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }} className="responsive-grid-col">
        {/* Profile Info */}
        <div className="card">
          <h3 className="card-title">
            <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {t('profileDetails')}
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label className="form-label">{t('usernameLabel')}</label>
              <input type="text" className="form-input" value={user?.username || ''} disabled style={{ backgroundColor: '#f0f2f0', cursor: 'not-allowed' }} />
            </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: 'wrap' }}>
                <div className="form-group" style={{ margin: 0, flex: '1 1 0', minWidth: 0 }}>
                  <label className="form-label">{t('fullNameLabel')}</label>
                  <input type="text" className="form-input" value={fullName} onChange={(e) => {
                    let val = e.target.value.replace(/[^A-Za-z \-]/g, '');
                    setFullName(val);
                  }} required style={{ width: '100%', minWidth: 0 }} />
                </div>

                <div className="form-group" style={{ margin: 0, flex: '1 1 0', minWidth: 0 }}>
                  <label className="form-label">{t('phoneNumberLabel')}</label>
                  <input type="text" className="form-input" value={phone} onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length > 11) val = val.slice(0, 11);
                    setPhone(val);
                  }} required style={{ width: '100%', minWidth: 0 }} />
                </div>
              </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ width: '100%', minWidth: 0 }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px", gap: "10px" }}>
              <div className="form-group" style={{ margin: 0, overflow: 'hidden' }}>
                <label className="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  max={new Date().toISOString().split("T")[0]}
                  className="form-input" 
                  style={{ width: '100%', minWidth: 0, paddingLeft: '8px', paddingRight: '8px' }}
                  value={dateOfBirth} 
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    if (e.target.value) {
                      const today = new Date();
                      const birthDate = new Date(e.target.value);
                      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        calculatedAge--;
                      }
                      setAge(calculatedAge);
                    }
                  }} 
                  required 
                />
              </div>
              <div className="form-group" style={{ margin: 0, overflow: 'hidden' }}>
                <label className="form-label">Age</label>
                <input type="number" className="form-input" value={age} readOnly style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)', width: '100%', minWidth: 0, paddingLeft: '8px', paddingRight: '8px' }} />
              </div>
            </div>

            {user?.role === 'Resident' && (
              <>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">{t('barangayLabel')}</label>
                    <select className="form-select" value={barangay} onChange={(e) => setBarangay(e.target.value)} required>
                      {BARANGAYS.map((brg) => (
                        <option key={brg} value={brg}>{brg}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label className="form-label">{t('purokSitioLabel')}</label>
                    <input type="text" className="form-input" placeholder={t('purokSitioPlaceholder')} value={purokSitio} onChange={(e) => setPurokSitio(e.target.value)} />
                  </div>
                </div>

                {/* Medical Info Section */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>🩹 {t('medicalInfoHeading')}</h4>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">{t('bloodTypeLabel')}</label>
                    <select className="form-select" value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
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
                    <textarea className="form-input" placeholder={t('allergiesPlaceholder')} value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} style={{ resize: 'vertical', minHeight: '60px' }} />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{t('medicalConditionsLabel')}</label>
                    <textarea className="form-input" placeholder={t('medicalConditionsPlaceholder')} value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)} rows={2} style={{ resize: 'vertical', minHeight: '60px' }} />
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '12px' }}>📞 {t('emergencyContactHeading')}</h4>
                  
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label">{t('contactNameLabel')}</label>
                      <input type="text" className="form-input" placeholder={t('contactNamePlaceholder')} value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                      <label className="form-label">{t('contactPhoneLabel')}</label>
                      <input type="text" className="form-input" placeholder={t('contactPhonePlaceholder')} value={emergencyContactPhone} onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length > 11) val = val.slice(0, 11);
                        setEmergencyContactPhone(val);
                      }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '40px', marginTop: '12px' }}>
              {submitting ? t('savingDetails') : t('saveEmergencyProfile')}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h3 className="card-title">
            <ShieldCheck size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {t('securitySettings')}
          </h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
              <label className="form-label">{t('currentPasswordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showCurrentPassword ? "text" : "password"} className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}>
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0, position: 'relative' }}>
              <label className="form-label">{t('newPasswordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input type={showNewPassword ? "text" : "password"} className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 0 }}>
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '40px' }}>
              {t('updatePasswordLabel')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

