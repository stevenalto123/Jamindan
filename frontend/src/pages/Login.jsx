import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

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
          background-color: #f3f4f6; /* Light gray background */
          padding: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1000px;
          min-height: 600px;
          background-color: #ffffff; /* Clean white card */
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08); /* Soft elegant shadow */
        }

        /* Left Side: Form */
        .login-left {
          flex: 1;
          padding: 60px 70px;
          display: flex;
          flex-direction: column;
          color: #18181b; /* Dark slate text */
          justify-content: center;
        }

        .brand-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 50px;
        }

        .brand-logo {
          width: 38px;
          height: 38px;
          object-fit: contain;
        }

        .brand-name {
          font-size: 22px;
          font-weight: 800;
          color: #059669; /* Deep solid green */
          letter-spacing: -0.5px;
        }

        .welcome-title {
          font-size: 34px;
          font-weight: 800;
          margin: 0 0 10px 0;
          color: #18181b;
          letter-spacing: -1px;
        }

        .welcome-subtitle {
          font-size: 15px;
          color: #52525b; /* Muted gray */
          margin: 0 0 35px 0;
        }

        .input-group {
          margin-bottom: 20px;
          position: relative;
        }

        .light-input {
          width: 100%;
          background-color: #f4f4f5; /* Light gray input */
          border: 1px solid #e4e4e7;
          color: #18181b;
          padding: 16px 16px;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .light-input::placeholder {
          color: #a1a1aa;
        }

        .light-input:focus {
          outline: none;
          border-color: #10b981; /* Bright green accent */
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .show-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #71717a;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s;
        }

        .show-btn:hover {
          color: #18181b;
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
          color: #3f3f46;
          font-weight: 500;
        }

        .custom-checkbox {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 5px;
          background-color: #ffffff;
          border: 1px solid #d4d4d8;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .custom-checkbox:checked {
          background-color: #10b981;
          border-color: #10b981;
        }

        .custom-checkbox:checked::after {
          content: '✓';
          color: #ffffff;
          font-size: 12px;
          font-weight: bold;
        }

        .forgot-link {
          font-size: 13.5px;
          color: #059669;
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .forgot-link:hover {
          opacity: 0.8;
        }

        .submit-btn {
          width: 100%;
          background-color: #10b981; /* Bright green */
          color: #ffffff;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          margin-bottom: 25px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }

        .submit-btn:hover {
          background-color: #059669; /* Darker green on hover */
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .register-text {
          text-align: center;
          font-size: 14px;
          color: #52525b;
        }

        .register-text a {
          color: #059669;
          font-weight: 700;
          text-decoration: none;
        }

        .error-message {
          background-color: #fee2e2;
          border-left: 4px solid #ef4444;
          color: #b91c1c;
          padding: 12px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        /* Right Side: Illustration */
        .login-right {
          flex: 1.1;
          background: linear-gradient(180deg, #38bdf8 0%, #0ea5e9 30%, #86efac 100%);
          position: relative;
          overflow: hidden;
        }

        /* Vertical Landscape SVG Container */
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
        
        {/* Left Form Area (Light Mode) */}
        <div className="login-left">
          <div className="brand-header">
            <img src="/logo.png" alt="Logo" className="brand-logo" />
            <span className="brand-name">Jamindan ER</span>
          </div>

          <h1 className="welcome-title">Welcome back!</h1>
          <p className="welcome-subtitle">Sign in to the emergency response platform.</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="text"
                className="light-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="light-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="show-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
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
              {loading ? 'Authenticating...' : 'Log in'}
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
              {/* Sky base is handled by css gradient, so we just add clouds and hills */}
              
              {/* Clouds */}
              <circle cx="150" cy="150" r="50" fill="#ffffff" opacity="0.8" />
              <circle cx="220" cy="130" r="70" fill="#ffffff" opacity="0.8" />
              <circle cx="300" cy="160" r="60" fill="#ffffff" opacity="0.8" />
              
              <circle cx="450" cy="220" r="40" fill="#ffffff" opacity="0.6" />
              <circle cx="500" cy="200" r="50" fill="#ffffff" opacity="0.6" />

              {/* Background Mountains (Blue-ish) */}
              <path d="M-50,600 L150,350 L400,550 L650,250 L800,600 Z" fill="#0284c7" opacity="0.6" />
              <path d="M-50,600 L250,450 L500,300 L750,550 L800,600 Z" fill="#0369a1" opacity="0.8" />

              {/* Foreground Hills (Greens) */}
              <path d="M-50,850 C150,750 250,650 450,700 C650,750 750,600 850,650 L850,850 Z" fill="#a3e635" />
              <path d="M-50,850 C150,680 350,820 600,750 C750,700 800,720 850,850 L850,850 Z" fill="#84cc16" opacity="0.9" />

              {/* A winding path */}
              <path d="M-50,850 Q200,750 350,850 T650,780 L850,850 Z" fill="#fef08a" opacity="0.8" />

              {/* Cute Abstract Trees (Yellow and Green) */}
              <g transform="translate(100, 600)">
                <rect x="25" y="60" width="10" height="40" fill="#78350f" rx="3" />
                <circle cx="30" cy="30" r="35" fill="#eab308" />
                <circle cx="10" cy="70" r="15" fill="#84cc16" />
                <circle cx="55" cy="65" r="20" fill="#65a30d" />
              </g>

              {/* Jamindan Command Center (Sleek minimalist version) */}
              <g transform="translate(350, 620)">
                <rect x="0" y="30" width="80" height="70" fill="#1e293b" rx="8" />
                {/* Windows */}
                <rect x="15" y="45" width="15" height="15" fill="#a7f3d0" rx="3" />
                <rect x="50" y="45" width="15" height="15" fill="#a7f3d0" rx="3" />
                <rect x="15" y="70" width="15" height="15" fill="#a7f3d0" rx="3" />
                <rect x="50" y="70" width="15" height="15" fill="#a7f3d0" rx="3" />
                {/* Antenna */}
                <line x1="40" y1="30" x2="40" y2="0" stroke="#64748b" strokeWidth="4" />
                <circle cx="40" cy="-5" r="6" fill="#ef4444" />
              </g>

              {/* Cute Ambulance Van */}
              <g transform="translate(180, 720)">
                {/* Wheels */}
                <circle cx="20" cy="50" r="12" fill="#17181a" />
                <circle cx="20" cy="50" r="4" fill="#a1a1aa" />
                <circle cx="80" cy="50" r="12" fill="#17181a" />
                <circle cx="80" cy="50" r="4" fill="#a1a1aa" />
                
                {/* Body */}
                <rect x="0" y="0" width="100" height="50" fill="#f8fafc" rx="10" />
                <path d="M80,0 L110,20 L110,50 L80,50 Z" fill="#f8fafc" />
                
                {/* Window */}
                <rect x="85" y="5" width="15" height="15" fill="#1e293b" rx="2" />
                
                {/* Green Cross */}
                <rect x="40" y="15" width="16" height="16" fill="#10b981" rx="2" />
                <rect x="44" y="11" width="8" height="24" fill="#10b981" rx="2" />
                <rect x="36" y="19" width="24" height="8" fill="#10b981" rx="2" />
                
                {/* Siren */}
                <rect x="70" y="-8" width="12" height="8" fill="#ef4444" rx="3" />
              </g>

            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
