import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await axios.post('/api/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      
      setMessage(res.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-body">
          <img src="/logo.png" alt="Jamindan Seal" className="auth-logo" />
          <h1 className="auth-title">Create New Password</h1>
          <p className="auth-subtitle">
            Enter your new secure password below.
          </p>

          {error && <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}
          {message && <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>{message}</div>}

          {!message && (
            <form onSubmit={handleSubmit}>
              
              <div className="form-group">
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input form-input-with-icon"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '15px' }}>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon-left" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input form-input-with-icon"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '20px' }}>
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '25px', fontSize: '13px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
