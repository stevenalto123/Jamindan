import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Eye, EyeOff, ShieldCheck, Activity, MapPin } from 'lucide-react';

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
          min-height: 100vh;
          background-color: var(--bg-color);
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        /* Left Hero Section */
        .login-hero {
          flex: 1.2;
          background: linear-gradient(135deg, #1e3c28 0%, #2e593e 100%);
          color: white;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }

        /* Glassmorphism accent circles */
        .hero-glow-1 {
          position: absolute;
          top: -100px;
          left: -100px;
          width: 400px;
          height: 400px;
          background: rgba(75, 142, 98, 0.4);
          filter: blur(80px);
          border-radius: 50%;
          z-index: 0;
        }
        .hero-glow-2 {
          position: absolute;
          bottom: -150px;
          right: -100px;
          width: 500px;
          height: 500px;
          background: rgba(30, 215, 96, 0.2);
          filter: blur(100px);
          border-radius: 50%;
          z-index: 0;
        }

        .hero-content {
          position: relative;
          z-index: 1;
          padding: 60px 80px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .hero-logo-box {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 80px;
          height: 80px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 30px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }

        .hero-title {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.2;
          margin: 0 0 15px 0;
          letter-spacing: -1px;
        }

        .hero-subtitle {
          font-size: 18px;
          color: #b0d6be;
          max-width: 450px;
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 15px;
          background: rgba(255, 255, 255, 0.05);
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          max-width: 350px;
        }
        .feature-item span {
          font-size: 14px;
          font-weight: 500;
        }

        /* Right Form Section */
        .login-form-container {
          flex: 1;
          background-color: var(--card-bg);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 40px;
          position: relative;
          z-index: 10;
          box-shadow: -10px 0 30px rgba(0,0,0,0.1);
        }

        .login-form-box {
          width: 100%;
          max-width: 420px;
        }

        .form-header {
          text-align: left;
          margin-bottom: 35px;
        }
        .form-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-main);
          margin: 0 0 8px 0;
        }
        .form-header p {
          color: var(--text-light);
          font-size: 15px;
          margin: 0;
        }

        .input-group {
          margin-bottom: 20px;
        }
        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 8px;
        }
        
        .modern-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .modern-input-wrapper svg.icon-left {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          transition: color 0.3s;
        }
        .modern-input {
          width: 100%;
          background: var(--bg-color);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          padding: 14px 14px 14px 45px;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
        }
        .modern-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(75, 142, 98, 0.15);
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

        .login-btn {
          width: 100%;
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 14px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
          box-shadow: 0 4px 12px rgba(75, 142, 98, 0.3);
        }
        .login-btn:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(75, 142, 98, 0.4);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .mobile-only-header {
          display: none;
          text-align: center;
          margin-bottom: 30px;
        }

        /* SVG container styling */
        .svg-container {
          position: relative;
          z-index: 1;
          width: 100%;
          line-height: 0;
        }

        @media (max-width: 900px) {
          .login-wrapper {
            flex-direction: column;
          }
          .login-hero {
            display: none; /* Hide full hero on mobile to save space */
          }
          .mobile-only-header {
            display: block;
          }
          .login-form-container {
            padding: 30px 20px;
            box-shadow: none;
            justify-content: flex-start;
            padding-top: 60px;
          }
        }
      `}</style>

      {/* Left Panel: Hero */}
      <div className="login-hero">
        <div className="hero-glow-1"></div>
        <div className="hero-glow-2"></div>
        
        <div className="hero-content">
          <div className="hero-logo-box">
            <img src="/logo.png" alt="Jamindan Seal" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
          </div>
          <h1 className="hero-title">Jamindan Emergency<br/>Response</h1>
          <p className="hero-subtitle">Fast, reliable, and deeply connected to the community. We bring help directly to your location when you need it most.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <ShieldCheck size={20} color="#b0d6be" />
              <span>Verified Local Responders</span>
            </div>
            <div className="feature-item">
              <MapPin size={20} color="#b0d6be" />
              <span>Real-Time GPS Tracking</span>
            </div>
            <div className="feature-item">
              <Activity size={20} color="#b0d6be" />
              <span>Instant Incident Dispatch</span>
            </div>
          </div>
        </div>

        {/* Vector SVG illustration at the bottom */}
        <div className="svg-container">
          <svg viewBox="0 0 420 120" width="100%" height="120" preserveAspectRatio="none" style={{ display: 'block', backgroundColor: 'transparent' }}>
            {/* Background Hills (Adjusted colors to match dark theme) */}
            <path d="M-10,120 L-10,95 C70,75 140,110 200,90 C270,70 340,105 430,85 L430,120 Z" fill="rgba(176, 214, 190, 0.15)" />
            <path d="M-10,120 L-10,102 C80,88 180,112 260,95 C320,82 380,100 430,90 L430,120 Z" fill="rgba(155, 196, 170, 0.2)" />
            
            {/* Minimalist Trees */}
            <g opacity="0.6">
              <line x1="30" y1="105" x2="30" y2="85" stroke="#b0d6be" strokeWidth="2" />
              <circle cx="30" cy="80" r="8" fill="#b0d6be" />
              <line x1="60" y1="110" x2="60" y2="92" stroke="#b0d6be" strokeWidth="2" />
              <circle cx="60" cy="86" r="6" fill="#b0d6be" />
              <line x1="160" y1="112" x2="160" y2="95" stroke="#b0d6be" strokeWidth="2" />
              <circle cx="160" cy="89" r="6" fill="#b0d6be" />
              <line x1="190" y1="110" x2="190" y2="98" stroke="#b0d6be" strokeWidth="2" />
              <circle cx="190" cy="94" r="5" fill="#b0d6be" />
              <line x1="370" y1="110" x2="370" y2="92" stroke="#b0d6be" strokeWidth="2" />
              <circle cx="370" cy="86" r="7" fill="#b0d6be" />
              <line x1="395" y1="112" x2="395" y2="95" stroke="#b0d6be" strokeWidth="2" />
              <circle cx="395" cy="89" r="6" fill="#b0d6be" />
            </g>
            
            {/* First Aid Ambulance Van */}
            <g transform="translate(240, 78)">
              <circle cx="15" cy="26" r="6" fill="#1a1a1a" />
              <circle cx="15" cy="26" r="2" fill="#bdc3c7" />
              <circle cx="48" cy="26" r="6" fill="#1a1a1a" />
              <circle cx="48" cy="26" r="2" fill="#bdc3c7" />
              <rect x="0" y="0" width="60" height="24" fill="#ffffff" rx="4" />
              <path d="M46,0 L58,10 L58,24 L46,24 Z" fill="#ffffff" />
              <rect x="48" y="3" width="8" height="8" fill="#1a1a1a" rx="1" />
              <rect x="23" y="8" width="8" height="8" fill="#4b8e62" rx="0.5" />
              <rect x="25" y="5" width="4" height="14" fill="#4b8e62" rx="0.5" />
              <rect x="20" y="10" width="14" height="4" fill="#4b8e62" rx="0.5" />
              <rect x="42" y="-2" width="6" height="3" fill="#e74c3c" rx="1" />
            </g>
          </svg>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="login-form-container">
        
        <div className="mobile-only-header">
          <img src="/logo.png" alt="Jamindan Seal" style={{ width: '70px', height: '70px', marginBottom: '15px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-color)', margin: '0 0 5px 0' }}>Jamindan ER</h1>
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>Emergency Response System</p>
        </div>

        <div className="login-form-box">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to access your account.</p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '12px 16px', borderRadius: '4px', fontSize: '13px', marginBottom: '25px', fontWeight: '500' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Username</label>
              <div className="modern-input-wrapper">
                <input
                  type="text"
                  className="modern-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
                <User size={18} className="icon-left" />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="modern-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="modern-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                />
                Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Account'}
            </button>
          </form>

          <div style={{ marginTop: '35px', textAlign: 'center', fontSize: '14px', color: 'var(--text-light)' }}>
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none' }}>
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
