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
          background-color: #f0fdf4; /* Very light green */
          position: relative;
          overflow: hidden;
          padding: 20px;
          font-family: 'Inter', system-ui, sans-serif;
          z-index: 1;
        }

        /* Animated Background Orbs */
        .bg-orb-1 {
          position: absolute;
          top: -15%;
          left: -10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(167,243,208,0.7) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          z-index: -1;
          animation: float 15s ease-in-out infinite;
        }

        .bg-orb-2 {
          position: absolute;
          bottom: 5%;
          right: -10%;
          width: 40vw;
          height: 40vw;
          background: radial-gradient(circle, rgba(134,239,172,0.5) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          z-index: -1;
          animation: float 20s ease-in-out infinite reverse;
        }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5%, 5%) scale(1.05); }
          66% { transform: translate(-2%, 8%) scale(0.95); }
          100% { transform: translate(0, 0) scale(1); }
        }

        /* Glassmorphism Card */
        .login-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          z-index: 10;
          position: relative;
          margin-bottom: 80px; /* Space for the footer SVG so it doesn't overlap on small laptops */
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .login-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05);
        }

        .login-card-body {
          padding: 40px 40px 30px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .auth-logo {
          width: 80px;
          height: 80px;
          margin-bottom: 16px;
          object-fit: contain;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
        }

        .auth-title {
          font-size: 26px;
          font-weight: 800;
          color: var(--primary-color);
          margin: 0 0 4px 0;
          text-align: center;
        }

        .auth-subtitle {
          font-size: 15px;
          color: var(--text-light);
          margin: 0 0 30px 0;
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
          left: 16px;
          color: var(--text-muted);
          transition: color 0.3s;
        }

        .modern-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0,0,0,0.08);
          color: var(--text-main);
          padding: 14px 14px 14px 48px;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
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
          transition: color 0.2s;
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
          font-size: 13.5px;
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
          font-size: 13.5px;
          color: var(--primary-color);
          font-weight: 600;
          text-decoration: none;
        }

        .login-btn {
          width: 100%;
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 15px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 15px rgba(75, 142, 98, 0.3);
        }

        .login-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(75, 142, 98, 0.4);
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

        /* Full Width Footer Landscape */
        .landscape-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 15vh;
          min-height: 120px;
          max-height: 200px;
          z-index: 2;
          pointer-events: none; /* Let clicks pass through if needed */
        }
        .landscape-footer svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        @media (max-width: 480px) {
          .login-wrapper {
            padding: 15px;
            align-items: flex-start;
          }
          .login-card {
            margin-top: 20px;
            margin-bottom: 40px;
          }
          .login-card-body {
            padding: 30px 20px 25px 20px;
          }
          .auth-title {
            font-size: 22px;
          }
          .landscape-footer {
            height: 100px;
          }
        }
      `}</style>

      {/* Dynamic Background Orbs */}
      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>

      {/* Glassmorphism Centered Card */}
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
      </div>

      {/* Detached Full-Width Landscape SVG Footer */}
      <div className="landscape-footer">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle green hills spanning the full width */}
          <path d="M-50,120 L-50,95 C150,70 300,110 500,90 C700,70 850,110 1050,85 L1050,120 Z" fill="#b0d6be" opacity="0.8" />
          <path d="M-50,120 L-50,102 C180,88 380,112 500,95 C620,78 820,105 1050,90 L1050,120 Z" fill="#9bc4aa" opacity="0.9" />
          
          {/* Trees distributed across the landscape */}
          <g>
            <line x1="80" y1="105" x2="80" y2="85" stroke="#689878" strokeWidth="2" />
            <circle cx="80" cy="80" r="8" fill="#689878" />
            <line x1="120" y1="110" x2="120" y2="92" stroke="#689878" strokeWidth="2" />
            <circle cx="120" cy="86" r="6" fill="#689878" />
            <line x1="320" y1="112" x2="320" y2="95" stroke="#689878" strokeWidth="2" />
            <circle cx="320" cy="89" r="6" fill="#689878" />
            <line x1="360" y1="110" x2="360" y2="98" stroke="#689878" strokeWidth="2" />
            <circle cx="360" cy="94" r="5" fill="#689878" />
            <line x1="750" y1="110" x2="750" y2="92" stroke="#689878" strokeWidth="2" />
            <circle cx="750" cy="86" r="7" fill="#689878" />
            <line x1="820" y1="112" x2="820" y2="95" stroke="#689878" strokeWidth="2" />
            <circle cx="820" cy="89" r="6" fill="#689878" />
            <line x1="880" y1="108" x2="880" y2="85" stroke="#689878" strokeWidth="2" />
            <circle cx="880" cy="80" r="7" fill="#689878" />
          </g>
          
          {/* Command Center Building (shifted left) */}
          <g transform="translate(150, 0)">
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
          </g>
          
          {/* Ambulance Van (shifted right) */}
          <g transform="translate(580, 78)">
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
  );
};

export default Login;
