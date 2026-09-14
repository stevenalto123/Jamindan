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

        /* Right Side: Abstract Art Panel */
        .login-right {
          flex: 1.1;
          background-color: var(--bg-color);
          position: relative;
          overflow: hidden;
        }

        .login-right svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
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

        {/* Right Panel — Flowing Abstract Landscape */}
        <div className="login-right">
          <svg viewBox="0 0 600 800" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e8f0ec" />
                <stop offset="100%" stopColor="#d4e4da" />
              </linearGradient>
            </defs>

            {/* Sky background */}
            <rect width="600" height="800" fill="url(#skyGrad)" />

            {/* Soft layered waves — back to front */}
            <path d="M0,520 C100,480 200,540 300,500 C400,460 500,520 600,490 L600,800 L0,800 Z" fill="#b8d4c4" opacity="0.5" />
            <path d="M0,560 C120,530 220,580 340,550 C460,520 520,570 600,540 L600,800 L0,800 Z" fill="#8fbfa3" opacity="0.6" />
            <path d="M0,610 C80,580 180,630 300,600 C420,570 500,620 600,590 L600,800 L0,800 Z" fill="#6ba882" opacity="0.7" />
            <path d="M0,660 C150,640 250,680 350,650 C450,620 530,670 600,650 L600,800 L0,800 Z" fill="#4d9466" opacity="0.8" />
            <path d="M0,710 C100,690 220,730 350,700 C480,670 550,720 600,710 L600,800 L0,800 Z" fill="#3d7a50" />

            {/* Subtle dots / particles scattered */}
            <circle cx="80" cy="200" r="3" fill="#3d7a50" opacity="0.15" />
            <circle cx="200" cy="150" r="5" fill="#3d7a50" opacity="0.1" />
            <circle cx="350" cy="100" r="4" fill="#3d7a50" opacity="0.12" />
            <circle cx="500" cy="180" r="6" fill="#3d7a50" opacity="0.08" />
            <circle cx="450" cy="300" r="3" fill="#3d7a50" opacity="0.14" />
            <circle cx="120" cy="350" r="4" fill="#3d7a50" opacity="0.1" />
            <circle cx="530" cy="420" r="5" fill="#3d7a50" opacity="0.12" />
            <circle cx="280" cy="280" r="3" fill="#3d7a50" opacity="0.1" />

            {/* Centered content group */}
            <g transform="translate(300, 380)" textAnchor="middle">
              {/* Shield / badge shape */}
              <path d="M0,-80 L50,-60 L50,10 C50,50 25,70 0,85 C-25,70 -50,50 -50,10 L-50,-60 Z" 
                    fill="white" opacity="0.9" />
              <path d="M0,-65 L38,-48 L38,8 C38,40 20,56 0,68 C-20,56 -38,40 -38,8 L-38,-48 Z" 
                    fill="#3d7a50" opacity="0.15" />
              
              {/* Cross icon inside shield */}
              <rect x="-4" y="-45" width="8" height="30" rx="3" fill="#3d7a50" opacity="0.6" />
              <rect x="-15" y="-34" width="30" height="8" rx="3" fill="#3d7a50" opacity="0.6" />

              {/* Text below shield */}
              <text y="120" fill="#3d7a50" fontSize="20" fontWeight="800" fontFamily="system-ui, sans-serif" opacity="0.7">
                JAMINDAN
              </text>
              <text y="145" fill="#3d7a50" fontSize="11" fontWeight="500" fontFamily="system-ui, sans-serif" letterSpacing="3" opacity="0.4">
                EMERGENCY RESPONSE
              </text>
            </g>

          </svg>
        </div>

      </div>
    </div>
  );
};

export default Login;
