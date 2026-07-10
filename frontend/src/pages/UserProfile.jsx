import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck } from 'lucide-react';
import { BARANGAYS } from './Register';

const UserProfile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [barangay, setBarangay] = useState(user?.barangay || '');
  
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
      await updateProfile({ full_name: fullName, phone, barangay });
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
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Profile</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Manage your account settings</p>
      </div>

      {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '10px 14px' }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="responsive-grid-col">
        {/* Profile Info */}
        <div className="card">
          <h3 className="card-title">
            <User size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Profile Details
          </h3>
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Username</label>
              <input type="text" className="form-input" value={user?.username || ''} disabled style={{ backgroundColor: '#f0f2f0', cursor: 'not-allowed' }} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Barangay</label>
              <select className="form-select" value={barangay} onChange={(e) => setBarangay(e.target.value)} required>
                {BARANGAYS.map((brg) => (
                  <option key={brg} value={brg}>{brg}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '40px' }}>
              Save Details
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h3 className="card-title">
            <ShieldCheck size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Security Settings
          </h3>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Current Password</label>
              <input type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">New Password</label>
              <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '40px' }}>
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
