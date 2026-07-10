import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(username, password);
      if (user.role === 'Admin' || user.role === 'Responder') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-body">
          <img src="/logo.png" alt="Jamindan Seal" className="auth-logo" />
          <h1 className="auth-title">Emergency Response</h1>
          <p className="auth-subtitle">Community Platform</p>
          <p className="auth-instruction">Sign in to continue</p>

          {error && <div className="alert alert-danger" style={{ padding: '8px 12px', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon-left" />
                <input
                  type="text"
                  className="form-input form-input-with-icon"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input form-input-with-icon"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
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

            <div className="form-options-row">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                Remember me
              </label>
              <a href="#forgot" className="forgot-link" onClick={(e) => { e.preventDefault(); alert('Please contact the Municipality IT administrator to reset your password.'); }}>
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '13px', color: 'var(--text-light)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Register here</Link>
          </div>
        </div>

        {/* Vector SVG illustration at the bottom matching the template */}
        <div className="auth-illustration-container">
          <svg viewBox="0 0 420 120" width="100%" height="120" style={{ display: 'block', backgroundColor: '#e2f0d9' }}>
            {/* Background Hills */}
            <path d="M-10,120 L-10,95 C70,75 140,110 200,90 C270,70 340,105 430,85 L430,120 Z" fill="#b0d6be" />
            <path d="M-10,120 L-10,102 C80,88 180,112 260,95 C320,82 380,100 430,90 L430,120 Z" fill="#9bc4aa" />
            
            {/* Minimalist Trees */}
            <g>
              <line x1="30" y1="105" x2="30" y2="85" stroke="#689878" strokeWidth="2" />
              <circle cx="30" cy="80" r="8" fill="#689878" />
              <line x1="60" y1="110" x2="60" y2="92" stroke="#689878" strokeWidth="2" />
              <circle cx="60" cy="86" r="6" fill="#689878" />
              <line x1="160" y1="112" x2="160" y2="95" stroke="#689878" strokeWidth="2" />
              <circle cx="160" cy="89" r="6" fill="#689878" />
              <line x1="190" y1="110" x2="190" y2="98" stroke="#689878" strokeWidth="2" />
              <circle cx="190" cy="94" r="5" fill="#689878" />
              
              <line x1="370" y1="110" x2="370" y2="92" stroke="#689878" strokeWidth="2" />
              <circle cx="370" cy="86" r="7" fill="#689878" />
              <line x1="395" y1="112" x2="395" y2="95" stroke="#689878" strokeWidth="2" />
              <circle cx="395" cy="89" r="6" fill="#689878" />
            </g>
            
            {/* Building / Center */}
            <rect x="95" y="65" width="45" height="45" fill="#7ba88a" rx="2" />
            <rect x="101" y="70" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="114" y="70" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="127" y="70" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="101" y="82" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="114" y="82" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="127" y="82" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="113" y="94" width="9" height="16" fill="#3d7a50" /> {/* Door */}
            
            {/* Antenna Tower */}
            <line x1="117.5" y1="65" x2="117.5" y2="40" stroke="#3d7a50" strokeWidth="2" />
            <line x1="110" y1="45" x2="125" y2="45" stroke="#3d7a50" strokeWidth="1.5" />
            <line x1="112" y1="52" x2="123" y2="52" stroke="#3d7a50" strokeWidth="1.5" />
            <circle cx="117.5" cy="38" r="2.5" fill="#e74c3c" />
            
            {/* First Aid Ambulance Van */}
            <g transform="translate(240, 78)">
              {/* Wheels */}
              <circle cx="15" cy="26" r="6" fill="#2c3e50" />
              <circle cx="15" cy="26" r="2" fill="#bdc3c7" />
              <circle cx="48" cy="26" r="6" fill="#2c3e50" />
              <circle cx="48" cy="26" r="2" fill="#bdc3c7" />
              
              {/* Body */}
              <rect x="0" y="0" width="60" height="24" fill="#ffffff" rx="4" />
              <path d="M46,0 L58,10 L58,24 L46,24 Z" fill="#ffffff" />
              <rect x="48" y="3" width="8" height="8" fill="#2c3e50" rx="1" />
              
              {/* Green Cross Symbol */}
              <rect x="23" y="8" width="8" height="8" fill="#4b8e62" rx="0.5" />
              <rect x="25" y="5" width="4" height="14" fill="#4b8e62" rx="0.5" />
              <rect x="20" y="10" width="14" height="4" fill="#4b8e62" rx="0.5" />
              
              {/* Light bar */}
              <rect x="42" y="-2" width="6" height="3" fill="#e74c3c" rx="1" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Login;
