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
          background-color: #e2f0d9; /* Very soft light green background for the page */
          padding: 20px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .login-container {
          display: flex;
          width: 100%;
          max-width: 1000px;
          min-height: 550px;
          background: linear-gradient(135deg, #1e3c28 0%, #2e593e 100%); /* Deep soothing forest green, NOT black */
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(30, 60, 40, 0.3);
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
          margin-bottom: 45px;
        }

        .brand-logo {
          width: 36px;
          height: 36px;
          object-fit: contain;
        }

        .brand-name {
          font-size: 20px;
          font-weight: 700;
          color: #a7f3d0; /* Soft bright green */
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
          color: #b0d6be;
          margin: 0 0 35px 0;
        }

        .input-group {
          margin-bottom: 20px;
          position: relative;
        }

        .themed-input {
          width: 100%;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 16px 16px;
          border-radius: 12px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .themed-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .themed-input:focus {
          outline: none;
          border-color: #a7f3d0; 
          background-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 4px rgba(167, 243, 208, 0.1);
        }

        .show-btn {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .show-btn:hover {
          color: #ffffff;
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
          color: #b0d6be;
        }

        .custom-checkbox {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .custom-checkbox:checked {
          background-color: #a7f3d0;
          border-color: #a7f3d0;
        }

        .custom-checkbox:checked::after {
          content: '✓';
          color: #1e3c28;
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
          color: #1e3c28;
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
        }

        .submit-btn:hover {
          background-color: #6ee7b7;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(167, 243, 208, 0.2);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .register-text {
          text-align: center;
          font-size: 13px;
          color: #b0d6be;
        }

        .register-text a {
          color: #a7f3d0;
          font-weight: 600;
          text-decoration: none;
        }

        .error-message {
          background-color: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
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
          background-repeat: no-repeat;
          position: relative;
        }

        /* Adding a very soft green tint over the photo so it blends with the form nicely */
        .login-right::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to right, rgba(30, 60, 40, 1) 0%, rgba(30, 60, 40, 0.2) 40%, rgba(0, 0, 0, 0) 100%);
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
            display: none; /* Hide photo on mobile so the form stays clean */
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
        
        {/* Left Form Area (Forest Green) */}
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
                className="themed-input"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="themed-input"
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
