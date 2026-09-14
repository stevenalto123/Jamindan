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
          background-color: var(--bg-color); /* Connect to system background */
          padding: 20px;
          font-family: var(--font-main);
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1050px;
          min-height: 600px;
          background-color: var(--card-bg); /* Connect to system card */
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
          background-color: var(--bg-color); /* Soft greyish-green instead of harsh white */
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

        /* Right Side: Custom Illustration */
        .login-right {
          flex: 1.1;
          background-color: var(--bg-color);
          position: relative;
          overflow: hidden;
        }

        .illustration-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        
        .illustration-container svg {
          width: 100%;
          height: 100%;
          display: block;
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
            display: none; /* Hide illustration on mobile */
          }
          .brand-header {
            margin-bottom: 30px;
            justify-content: center;
          }
          .welcome-title, .welcome-subtitle {
            text-align: center;
          }
        }
      `}</style>

      <div className="login-container">
        
        {/* Left Form Area (Using Global System Colors) */}
        <div className="login-left">
          <div className="brand-header">
            <img src="/logo.png" alt="Logo" className="brand-logo" />
            <span className="brand-name">Jamindan ER</span>
          </div>

          <h1 className="welcome-title">Sign In</h1>
          <p className="welcome-subtitle">Securely access the emergency response platform.</p>

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
              {loading ? 'Authenticating...' : 'Log In Securely'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="register-text">
            Don't have an Account? <Link to="/register">Sign up</Link>
          </div>
        </div>

        {/* Right Illustration Area */}
        <div className="login-right">
          <div className="illustration-container">
            <svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
              
              {/* Clouds */}
              <circle cx="150" cy="150" r="50" fill="#ffffff" opacity="0.8" />
              <circle cx="220" cy="130" r="70" fill="#ffffff" opacity="0.8" />
              <circle cx="300" cy="160" r="60" fill="#ffffff" opacity="0.8" />
              
              <circle cx="450" cy="220" r="40" fill="#ffffff" opacity="0.6" />
              <circle cx="500" cy="200" r="50" fill="#ffffff" opacity="0.6" />

              {/* Background Mountains */}
              <path d="M-50,600 L150,350 L400,550 L650,250 L800,600 Z" fill="var(--border-color)" opacity="0.6" />
              <path d="M-50,600 L250,450 L500,300 L750,550 L800,600 Z" fill="#c3d6cb" opacity="0.8" />

              {/* Foreground Hills */}
              <path d="M-50,850 C150,750 250,650 450,700 C650,750 750,600 850,650 L850,850 Z" fill="var(--accent-color)" opacity="0.7" />
              <path d="M-50,850 C150,680 350,820 600,750 C750,700 800,720 850,850 L850,850 Z" fill="var(--primary-color)" />

              {/* Path */}
              <path d="M-50,850 Q200,750 350,850 T650,780 L850,850 Z" fill="#ffffff" opacity="0.2" />

              {/* Abstract Trees */}
              <g transform="translate(100, 600)">
                <rect x="25" y="60" width="10" height="40" fill="#2c3e50" opacity="0.5" rx="3" />
                <circle cx="30" cy="30" r="35" fill="var(--accent-color)" />
                <circle cx="10" cy="70" r="15" fill="var(--primary-hover)" />
                <circle cx="55" cy="65" r="20" fill="var(--primary-color)" />
              </g>

              {/* Jamindan Command Center */}
              <g transform="translate(350, 620)">
                <rect x="0" y="30" width="80" height="70" fill="var(--primary-hover)" rx="4" />
                <rect x="15" y="45" width="15" height="15" fill="#ffffff" rx="2" />
                <rect x="50" y="45" width="15" height="15" fill="#ffffff" rx="2" />
                <rect x="15" y="70" width="15" height="15" fill="#ffffff" rx="2" />
                <rect x="50" y="70" width="15" height="15" fill="#ffffff" rx="2" />
                <line x1="40" y1="30" x2="40" y2="0" stroke="var(--primary-color)" strokeWidth="4" />
                <circle cx="40" cy="-5" r="6" fill="#ffffff" />
              </g>

              {/* Ambulance Van */}
              <g transform="translate(180, 720)">
                <circle cx="20" cy="50" r="12" fill="#2c3e50" />
                <circle cx="20" cy="50" r="4" fill="#ffffff" />
                <circle cx="80" cy="50" r="12" fill="#2c3e50" />
                <circle cx="80" cy="50" r="4" fill="#ffffff" />
                
                <rect x="0" y="0" width="100" height="50" fill="#ffffff" rx="10" />
                <path d="M80,0 L110,20 L110,50 L80,50 Z" fill="#ffffff" />
                
                <rect x="85" y="5" width="15" height="15" fill="var(--bg-color)" rx="2" />
                
                <rect x="40" y="15" width="16" height="16" fill="var(--primary-color)" rx="2" />
                <rect x="44" y="11" width="8" height="24" fill="var(--primary-color)" rx="2" />
                <rect x="36" y="19" width="24" height="8" fill="var(--primary-color)" rx="2" />
                
                <rect x="70" y="-8" width="12" height="8" fill="var(--accent-color)" rx="3" />
              </g>

            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
