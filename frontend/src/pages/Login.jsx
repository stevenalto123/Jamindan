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
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'Admin' || user.role === 'Responder') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(username, password, rememberMe);
      if (user.role === 'Admin' || user.role === 'Responder') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError('Network Error: Cannot connect to server. Please check your internet connection or try again.');
      } else {
        setError(err.response?.data?.message || 'Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <style>{`
        .login-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f8fafc;
          padding: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .login-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          width: 100%;
          max-width: 440px;
          border: 1px solid rgba(0,0,0,0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .login-card-body {
          padding: 40px 40px 10px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-logo {
          width: 75px;
          height: 75px;
          margin-bottom: 16px;
          object-fit: contain;
        }

        .auth-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--primary-color);
          margin: 0 0 4px 0;
          text-align: center;
        }

        .auth-subtitle {
          font-size: 14px;
          color: var(--text-light);
          margin: 0 0 25px 0;
          text-align: center;
        }

        .login-form {
          width: 100%;
        }

        .input-group {
          margin-bottom: 18px;
          width: 100%;
        }

        .modern-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .modern-input-wrapper svg.icon-left {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          transition: color 0.3s;
        }

        .modern-input {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: var(--text-main);
          padding: 14px 14px 14px 45px;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .modern-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(75, 142, 98, 0.15);
          background: #ffffff;
        }

        .modern-input:focus + svg.icon-left {
          color: var(--primary-color);
        }

        .icon-btn-right {
          position: absolute;
          right: 14px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          padding: 4px;
        }
        .icon-btn-right:hover {
          color: var(--text-main);
        }

        .options-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          width: 100%;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-main);
          font-weight: 500;
        }

        .remember-checkbox {
          cursor: pointer;
          width: 16px;
          height: 16px;
          accent-color: var(--primary-color);
        }

        .forgot-link {
          font-size: 13px;
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: none;
        }

        .login-btn {
          width: 100%;
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(75, 142, 98, 0.25);
        }

        .login-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(75, 142, 98, 0.35);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .register-text {
          margin-top: 25px;
          text-align: center;
          font-size: 14px;
          color: var(--text-light);
        }
        .register-text a {
          color: var(--primary-color);
          font-weight: 700;
          text-decoration: none;
        }

        .svg-container {
          position: relative;
          z-index: 1;
          width: 100%;
          line-height: 0;
          background: #e2f0d9;
          margin-top: 20px;
        }

        @media (max-width: 480px) {
          .login-wrapper {
            padding: 15px;
          }
          .login-card-body {
            padding: 30px 25px 10px 25px;
          }
          .auth-title {
            font-size: 22px;
          }
        }
      `}</style>

      <div className="login-card">
        <div className="login-card-body">
          <img src="/logo.png" alt="Jamindan Seal" className="auth-logo" />
          <h1 className="auth-title">Jamindan ER</h1>
          <p className="auth-subtitle">Emergency Response System</p>

          {error && (
            <div style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: '500', width: '100%' }}>
              {error}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <div className="modern-input-wrapper">
                <input
                  type="text"
                  className="modern-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
                <User size={18} className="icon-left" />
              </div>
            </div>

            <div className="input-group">
              <div className="modern-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="modern-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
                <Lock size={18} className="icon-left" />
                <button
                  type="button"
                  className="icon-btn-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="options-row">
              <label className="remember-label">
                <input 
                  type="checkbox" 
                  className="remember-checkbox"
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="register-text">
            Don't have an account? <Link to="/register">Register here</Link>
          </div>
        </div>

        {/* Original Vector SVG illustration at the bottom */}
        <div className="svg-container">
          <svg viewBox="0 0 420 120" width="100%" height="120" style={{ display: 'block' }}>
            <path d="M-10,120 L-10,95 C70,75 140,110 200,90 C270,70 340,105 430,85 L430,120 Z" fill="#b0d6be" />
            <path d="M-10,120 L-10,102 C80,88 180,112 260,95 C320,82 380,100 430,90 L430,120 Z" fill="#9bc4aa" />
            
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
            
            <rect x="95" y="65" width="45" height="45" fill="#7ba88a" rx="2" />
            <rect x="101" y="70" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="114" y="70" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="127" y="70" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="101" y="82" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="114" y="82" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="127" y="82" width="7" height="8" fill="#e2f0d9" rx="1" />
            <rect x="113" y="94" width="9" height="16" fill="#3d7a50" />
            
            <line x1="117.5" y1="65" x2="117.5" y2="40" stroke="#3d7a50" strokeWidth="2" />
            <line x1="110" y1="45" x2="125" y2="45" stroke="#3d7a50" strokeWidth="1.5" />
            <line x1="112" y1="52" x2="123" y2="52" stroke="#3d7a50" strokeWidth="1.5" />
            <circle cx="117.5" cy="38" r="2.5" fill="#e74c3c" />
            
            <g transform="translate(240, 78)">
              <circle cx="15" cy="26" r="6" fill="#2c3e50" />
              <circle cx="15" cy="26" r="2" fill="#bdc3c7" />
              <circle cx="48" cy="26" r="6" fill="#2c3e50" />
              <circle cx="48" cy="26" r="2" fill="#bdc3c7" />
              
              <rect x="0" y="0" width="60" height="24" fill="#ffffff" rx="4" />
              <path d="M46,0 L58,10 L58,24 L46,24 Z" fill="#ffffff" />
              <rect x="48" y="3" width="8" height="8" fill="#2c3e50" rx="1" />
              
              <rect x="23" y="8" width="8" height="8" fill="#4b8e62" rx="0.5" />
              <rect x="25" y="5" width="4" height="14" fill="#4b8e62" rx="0.5" />
              <rect x="20" y="10" width="14" height="4" fill="#4b8e62" rx="0.5" />
              
              <rect x="42" y="-2" width="6" height="3" fill="#e74c3c" rx="1" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Login;
