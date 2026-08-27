import React from 'react';
import { Download, Smartphone, ShieldCheck, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DownloadApp = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
        
        {/* App Icon / Logo */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: 'var(--primary-color)', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto',
            boxShadow: '0 10px 20px rgba(46, 125, 50, 0.3)'
          }}>
            <Smartphone size={40} color="white" />
          </div>
        </div>

        <h1 className="auth-title" style={{ fontSize: '24px', marginBottom: '8px' }}>
          Jamindan Emergency App
        </h1>
        <p className="auth-subtitle" style={{ marginBottom: '30px' }}>
          Get instant access to emergency response, right from your pocket.
        </p>

        {/* Download Button */}
        <a 
          href="/jamindan-emergency-v1.0.apk" 
          download="jamindan-emergency-v1.0.apk"
          className="btn btn-primary"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold',
            textDecoration: 'none',
            borderRadius: '12px',
            marginBottom: '30px'
          }}
        >
          <Download size={20} />
          Download for Android (.apk)
        </a>

        {/* Features List */}
        <div style={{ textAlign: 'left', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{ backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '50%' }}>
              <Zap size={20} color="var(--primary-color)" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-color)' }}>Instant Alerts</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Get real-time announcements</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
            <div style={{ backgroundColor: '#e8f5e9', padding: '8px', borderRadius: '50%' }}>
              <ShieldCheck size={20} color="var(--primary-color)" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-color)' }}>Verified Responses</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Direct connection to local authorities</p>
            </div>
          </div>
        </div>

        {/* Return Button */}
        <button 
          onClick={() => navigate('/login')} 
          className="btn btn-outline"
          style={{ width: '100%' }}
        >
          Return to Login
        </button>

      </div>
    </div>
  );
};

export default DownloadApp;
