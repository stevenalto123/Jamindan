import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck } from 'lucide-react';
import { BARANGAYS } from './Register';
import { useLanguage } from '../context/LanguageContext';

const UserProfile = () => {
  const { t } = useLanguage();
  const { user, updateProfile, changePassword } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
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
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile({ 
        full_name: fullName, 
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
    <div className="content-body" style={{ maxWidth: '900px' }}>

      {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '10px 14px' }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }} className="responsive-grid-col">
        {/* Profile Info */}
        <div className="card">
          <h3 className="card-title">
            <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {t('profileDetails')}
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('usernameLabel')}</label>
              <input type="text" className="form-input" value={user?.username || ''} disabled style={{ backgroundColor: '#f0f2f0', cursor: 'not-allowed' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('fullNameLabel')}</label>
                <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('phoneNumberLabel')}</label>
                <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('barangayLabel')}</label>
                <select className="form-select" value={barangay} onChange={(e) => setBarangay(e.target.value)} required>
                  {BARANGAYS.map((brg) => (
                    <option key={brg} value={brg}>{brg}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('contactNameLabel')}</label>
                  <input type="text" className="form-input" placeholder={t('contactNamePlaceholder')} value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('contactPhoneLabel')}</label>
                  <input type="text" className="form-input" placeholder={t('contactPhonePlaceholder')} value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
                </div>
              </div>
            </div>

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
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('currentPasswordLabel')}</label>
              <input type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('newPasswordLabel')}</label>
              <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
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
