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
          background-color: #09090b; /* Deepest dark background */
          padding: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1000px;
          min-height: 600px;
          background-color: #17181a;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
        }

        /* Left Side: Form */
        .login-left {
          flex: 1;
          padding: 60px 70px;
          display: flex;
          flex-direction: column;
          color: white;
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
          width: 36px;
          height: 36px;
          object-fit: contain;
        }

        .brand-name {
          font-size: 20px;
          font-weight: 700;
          color: #a7f3d0; /* Soft green */
          letter-spacing: -0.5px;
        }

        .welcome-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 10px 0;
          color: #ffffff;
        }

        .welcome-subtitle {
          font-size: 14px;
          color: #a1a1aa;
          margin: 0 0 35px 0;
        }

        .input-group {
          margin-bottom: 20px;
          position: relative;
        }

        .dark-input {
          width: 100%;
          background-color: #212226;
          border: 1px solid #212226;
          color: white;
          padding: 16px 16px;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .dark-input::placeholder {
          color: #71717a;
        }

        .dark-input:focus {
          outline: none;
          border-color: #34d399; /* Accent green */
          background-color: #27282d;
        }

        .show-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #71717a;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .show-btn:hover {
          color: #e4e4e7;
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
          font-size: 13px;
          color: #a1a1aa;
        }

        .custom-checkbox {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background-color: #212226;
          border: 1px solid #3f3f46;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-checkbox:checked {
          background-color: #a7f3d0;
          border-color: #a7f3d0;
        }

        .custom-checkbox:checked::after {
          content: '✓';
          color: #17181a;
          font-size: 12px;
          font-weight: bold;
        }

        .forgot-link {
          font-size: 13px;
          color: #a7f3d0;
          text-decoration: none;
          transition: opacity 0.2s;
        }

        .forgot-link:hover {
          opacity: 0.8;
        }

        .submit-btn {
          width: 100%;
          background-color: #a7f3d0;
          color: #121212;
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
          transition: background-color 0.2s;
          margin-bottom: 25px;
        }

        .submit-btn:hover {
          background-color: #6ee7b7;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .register-text {
          text-align: center;
          font-size: 13px;
          color: #71717a;
        }

        .register-text a {
          color: #a7f3d0;
          font-weight: 600;
          text-decoration: none;
        }

        .error-message {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 13px;
          margin-bottom: 20px;
        }

        /* Right Side: Photo Background */
        .login-right {
          flex: 1.1;
          background-image: url('https://old.dailyguardian.com.ph/wp-content/uploads/2023/07/Jamindan-municipal-hall.jpg');
          background-size: cover;
          background-position: center;
          position: relative;
        }

        /* Seamless fade overlay between the solid left panel and the photo */
        .login-right::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to right, rgba(23, 24, 26, 1) 0%, rgba(23, 24, 26, 0.3) 30%, rgba(0, 0, 0, 0.1) 100%);
          pointer-events: none;
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
            display: none; /* Hide photo on mobile */
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
        
        {/* Left Form Area (Dark Mode) */}
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
                className="dark-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="dark-input"
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

        {/* Right Photo Area */}
        <div className="login-right">
        </div>

      </div>
    </div>
  );
};

export default Login;
