import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-body">
          <img src="/logo.png" alt="Jamindan Seal" className="auth-logo" />
          <h1 className="auth-title">{t('forgotPassword')}</h1>
          <p className="auth-subtitle">
            Enter your Username or Email to receive a reset link.
          </p>

          {error && <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}
          {message && <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>{message}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon-left" />
                <input
                  type="text"
                  className="form-input form-input-with-icon"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your Username or Email"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '20px' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div style={{ marginTop: '25px', fontSize: '13px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-light)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
