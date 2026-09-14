import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, User, Lock, Eye, EyeOff } from 'lucide-react';

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
          background-color: var(--bg-color);
          padding: 20px;
          font-family: var(--font-main);
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1050px;
          min-height: 600px;
          background-color: var(--card-bg);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
        }

        /* Left Side: Form */
        .login-left {
          flex: 1;
          padding: 60px 70px;
          display: flex;
          flex-direction: column;
          color: var(--text-main);
          justify-content: center;
          position: relative;
          z-index: 10;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 50px;
        }

        .brand-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
        }

        .brand-name {
          font-size: 22px;
          font-family: var(--font-display);
          font-weight: 800;
          color: var(--primary-color);
          letter-spacing: -0.5px;
        }

        .welcome-title {
          font-size: 34px;
          font-weight: 800;
          margin: 0 0 10px 0;
          color: var(--text-main);
          letter-spacing: -1px;
        }

        .welcome-subtitle {
          font-size: 15px;
          color: var(--text-light);
          margin: 0 0 35px 0;
          line-height: 1.5;
        }

        .input-group {
          margin-bottom: 20px;
          position: relative;
        }

        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .system-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .system-input-wrapper svg.icon-left {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          transition: color 0.3s;
        }

        .system-input {
          width: 100%;
          background-color: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          padding: 14px 14px 14px 45px;
          border-radius: var(--radius-md);
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .system-input::placeholder {
          color: var(--text-muted);
        }

        .system-input:focus {
          outline: none;
          border-color: var(--primary-color);
          background-color: var(--card-bg);
          box-shadow: 0 0 0 3px var(--primary-light);
        }

        .system-input:focus + svg.icon-left {
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
          margin-bottom: 30px;
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

        .custom-checkbox {
          cursor: pointer;
          width: 16px;
          height: 16px;
          accent-color: var(--primary-color);
        }

        .forgot-link {
          font-size: 13.5px;
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .forgot-link:hover {
          opacity: 0.8;
        }

        .submit-btn {
          width: 100%;
          background-color: var(--primary-color);
          color: white;
          border: none;
          padding: 16px;
          border-radius: var(--radius-md);
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          margin-bottom: 25px;
          box-shadow: 0 4px 10px rgba(61, 122, 80, 0.2);
        }

        .submit-btn:hover {
          background-color: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(61, 122, 80, 0.3);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .register-text {
          text-align: center;
          font-size: 14px;
          color: var(--text-light);
        }

        .register-text a {
          color: var(--primary-color);
          font-weight: 700;
          text-decoration: none;
        }

        .error-message {
          background-color: #fee2e2;
          border-left: 4px solid var(--danger-color);
          color: var(--danger-hover);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        /* Right Side: Branded Panel */
        .login-right {
          flex: 1.1;
          background: linear-gradient(160deg, var(--primary-color) 0%, #2a5e3f 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Abstract background shapes */
        .login-right::before {
          content: '';
          position: absolute;
          top: -120px;
          right: -120px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
        }

        .login-right::after {
          content: '';
          position: absolute;
          bottom: -80px;
          left: -80px;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
        }

        .branded-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 60px 50px;
          color: white;
        }

        .branded-logo {
          width: 90px;
          height: 90px;
          object-fit: contain;
          margin-bottom: 30px;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
        }

        .branded-title {
          font-size: 28px;
          font-weight: 800;
          font-family: var(--font-display);
          letter-spacing: -0.5px;
          margin: 0 0 8px 0;
          line-height: 1.2;
        }

        .branded-municipality {
          font-size: 14px;
          font-weight: 500;
          opacity: 0.7;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin: 0 0 30px 0;
        }

        .branded-divider {
          width: 50px;
          height: 3px;
          background: rgba(255,255,255,0.3);
          border-radius: 2px;
          margin: 0 auto 30px auto;
        }

        .branded-tagline {
          font-size: 16px;
          font-weight: 400;
          opacity: 0.85;
          line-height: 1.6;
          margin: 0;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
        }

        .branded-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 40px;
          padding: 8px 16px;
          background: rgba(255,255,255,0.12);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }

        .branded-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        /* Mobile specific styling */
        @media (max-width: 768px) {
          .login-container {
            flex-direction: column;
            min-height: auto;
          }
          .login-left {
            padding: 40px 30px;
          }
          .login-right {
            display: none;
          }
          .brand-header {
            margin-bottom: 30px;
          }
        }
      `}</style>

      <div className="login-container">
        
        {/* Left Form Area */}
        <div className="login-left">
          <div className="brand-header">
            <img src="/logo.png" alt="Logo" className="brand-logo" />
            <span className="brand-name">Jamindan ER</span>
          </div>

          <h1 className="welcome-title">Sign In</h1>
          <p className="welcome-subtitle">Your community's safety starts here.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Username</label>
              <div className="system-input-wrapper">
                <input
                  type="text"
                  className="system-input"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <User size={18} className="icon-left" />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="system-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="system-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  className="custom-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Log In'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="register-text">
            Don't have an account? <Link to="/register">Sign up</Link>
          </div>
        </div>

        {/* Right Branded Panel */}
        <div className="login-right">
          <div className="branded-content">
            <img src="/logo.png" alt="Jamindan Seal" className="branded-logo" />
            <h2 className="branded-title">Emergency Response</h2>
            <p className="branded-municipality">Municipality of Jamindan</p>
            <div className="branded-divider"></div>
            <p className="branded-tagline">Protecting our community through rapid coordination and real-time response.</p>
            <div className="branded-badge">
              <span className="branded-badge-dot"></span>
              System Online
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
