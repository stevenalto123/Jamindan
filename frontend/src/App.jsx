import React, { useState, useEffect, useRef } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SystemProvider } from './context/SystemContext';
import { Geolocation } from '@capacitor/geolocation';

// Components & Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';
import NotificationHandler from './components/NotificationHandler';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResidentDashboard from './pages/ResidentDashboard';
import ReportIncident from './pages/ReportIncident';
import IncidentList from './pages/IncidentList';
import TrackStatus from './pages/TrackStatus';
import NewsUpdates from './pages/NewsUpdates';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CommandMap from './pages/CommandMap';
import AdminVehicles from './pages/AdminVehicles';
import AdminAnalytics from './pages/AdminAnalytics';

// Subpages
import EmergencyTips from './pages/EmergencyTips';
import NotificationsPage from './pages/NotificationsPage';
import UserProfile from './pages/UserProfile';
import AdminResponders from './pages/AdminResponders';
import SystemLogs from './pages/SystemLogs';
import AdminVerifyUsers from './pages/AdminVerifyUsers';
import AdminViewUser from './pages/AdminViewUser';
import MoreMenu from './pages/MoreMenu';

// New Pages
import Household from './pages/Household';
import EvacuationCenters from './pages/EvacuationCenters';
import Hotlines from './pages/Hotlines';
import DownloadApp from './pages/DownloadApp';
import Settings from './pages/Settings';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setShowSlowWarning(true);
      }, 4000); // Show warning after 4 seconds of loading
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', flexDirection: 'column', gap: '12px' }}>
        <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', animation: 'pulse 1s infinite' }}></div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', color: 'var(--primary-color)' }}>Loading Jamindan Emergency Response Platform...</p>
        {showSlowWarning && (
          <p style={{ fontSize: '13px', color: 'var(--text-light)', textAlign: 'center', maxWidth: '300px', marginTop: '10px' }}>
            Waking up the cloud server... This can take up to 50 seconds on the free tier. Please wait.
          </p>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'Admin' || user.role === 'Responder') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

window.globalAudioCtx = null;
let isAudioUnlockedGlobal = false;

// Main App Layout Wrapper (Resolves titles dynamically to match templates)
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // HTML5 Audio Elements for iOS bypass
  const sirenRef = useRef(null);
  const chimeRef = useRef(null);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { user } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [audioUnlocked, setAudioUnlocked] = useState(isAudioUnlockedGlobal);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  
  // Continuous nonstop siren for Mass Broadcasts & Evacuation Alerts
  useEffect(() => {
    let interval;
    let audioCtx = null;
    let osc = null;
    let oscInterval = null;
    const sirenEl = document.getElementById('siren-audio');

    const stopSynthetic = () => {
      if (oscInterval) {
        clearInterval(oscInterval);
        oscInterval = null;
      }
      if (osc) {
        try {
          osc.stop();
          osc.disconnect();
        } catch(e) {}
        osc = null;
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(e => console.warn(e));
        audioCtx = null;
      }
    };

    if (activeBroadcast) {
      window.isBroadcastActive = true;
      let htmlAudioPlaying = false;

      // Start looping vibration pulse on mobile
      if (navigator.vibrate) {
        navigator.vibrate([600, 250, 600, 250]);
      }
      interval = setInterval(() => {
        if (navigator.vibrate) {
          navigator.vibrate([600, 250, 600, 250]);
        }
      }, 1500);

      // Web Audio API Synthesizer (ONLY as a fallback if HTML5 audio fails)
      const playSyntheticFallback = () => {
        if (htmlAudioPlaying || osc) return; // Do not start if HTML5 audio is already playing or synth already active
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) {
            audioCtx = new AudioContext();
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
            
            osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = 'sawtooth';
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.start();
            gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);

            let isHigh = true;
            oscInterval = setInterval(() => {
              if (osc && audioCtx && audioCtx.state !== 'closed') {
                isHigh = !isHigh;
                osc.frequency.setValueAtTime(isHigh ? 1100 : 700, audioCtx.currentTime);
              } else {
                clearInterval(oscInterval);
              }
            }, 600);
          }
        } catch (err) {
          console.warn('Synthetic Audio fallback failed or blocked:', err);
        }
      };

      // 1. Play HTML5 Audio Siren (/siren.wav)
      if (sirenEl) {
        sirenEl.volume = 1.0;
        sirenEl.muted = false;
        sirenEl.currentTime = 0;
        sirenEl.loop = true;
        const playPromise = sirenEl.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            htmlAudioPlaying = true;
            stopSynthetic(); // STOP synth immediately so 2 alarms never overlap
          }).catch(err => {
            console.warn('HTML5 Siren error or blocked, activating Web Audio fallback:', err);
            playSyntheticFallback();
          });
        } else {
          htmlAudioPlaying = true;
          stopSynthetic();
        }
      } else {
        playSyntheticFallback();
      }
    } else {
      window.isBroadcastActive = false;
      stopSynthetic();
      if (sirenEl) {
        sirenEl.pause();
        sirenEl.currentTime = 0;
      }
    }
    
    return () => {
      window.isBroadcastActive = false;
      if (interval) clearInterval(interval);
      stopSynthetic();
      if (sirenEl) {
        sirenEl.pause();
        sirenEl.currentTime = 0;
      }
    };
  }, [activeBroadcast]);
  
  // Universal audio unlock on first user click or touch anywhere
  useEffect(() => {
    const unlockOnFirstInteraction = () => {
      if (!isAudioUnlockedGlobal) {
        handleUnlockAudio();
      }
    };
    window.addEventListener('click', unlockOnFirstInteraction, { once: true });
    window.addEventListener('touchstart', unlockOnFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', unlockOnFirstInteraction);
      window.removeEventListener('touchstart', unlockOnFirstInteraction);
    };
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    const handleOnline = async () => { setIsOffline(false); };
    if (navigator.onLine) {
      setTimeout(() => handleOnline(), 1000);
    }
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if there is an unread emergency broadcast sent while user had cleared tabs
    const checkActiveBroadcast = async () => {
      // 1. Immediately inspect URL parameters from push notification click (Instant Zero-Delay Alert)
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('broadcast') === '1') {
        const rawTitle = urlParams.get('title') || '🚨 CRITICAL EMERGENCY BROADCAST';
        const rawMsg = urlParams.get('msg') || 'Emergency advisory issued by Jamindan MDRRMO.';
        setActiveBroadcast({
          id: 'push_' + Date.now(),
          title: decodeURIComponent(rawTitle),
          message: decodeURIComponent(rawMsg),
          timestamp: new Date().toISOString()
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      try {
        const res = await axios.get('/api/notifications/active-broadcast');
        if (res.data?.active && res.data.broadcast) {
          const dismissed = sessionStorage.getItem('dismissed_broadcast_' + res.data.broadcast.id);
          if (dismissed) return;

          setActiveBroadcast({
            id: res.data.broadcast.id,
            title: res.data.broadcast.title,
            message: res.data.broadcast.message,
            timestamp: res.data.broadcast.created_at
          });
        }
      } catch (err) {
        console.warn('Failed to check active broadcast:', err);
      }
    };

    // Check immediately on mount, on focus, or if url has broadcast flag
    checkActiveBroadcast();
    window.addEventListener('focus', checkActiveBroadcast);

    // Listen for global mass broadcasts to sound nonstop siren and show emergency modal
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('new-broadcast', (data) => {
      // Don't trigger the resident alarm for Admin accounts (Admin is the sender)
      if (user?.role === 'Admin') return;

      // Trigger nonstop emergency siren alert
      setActiveBroadcast(data);
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (checkActiveBroadcast) {
        window.removeEventListener('focus', checkActiveBroadcast);
      }
      socket.disconnect();
    };
  }, [user]);

  const handleAcknowledgeBroadcast = async () => {
    if (activeBroadcast?.id) {
      sessionStorage.setItem('dismissed_broadcast_' + activeBroadcast.id, 'true');
      try {
        await axios.put(`/api/notifications/${activeBroadcast.id}/read`);
      } catch (err) {
        console.warn('Failed to mark broadcast as read:', err);
      }
    }
    setActiveBroadcast(null);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };
  const location = useLocation();

  // Resolve Header parameters based on route and user profile
  let pageTitle = "Emergency Response";
  let pageSubtitle = "Municipality of Jamindan";

  const path = location.pathname;

  // Sync Live Location (All Users for Geofence Evacuation)
  useEffect(() => {
    if (!user) return;

    let watchId;
    const sendLocation = async (latitude, longitude) => {
      try {
        await axios.put('/api/auth/location', { latitude, longitude });
      } catch (err) {
        console.error('Failed to sync live location', err);
      }
    };

    const initTracking = async () => {
      if (window.Capacitor) {
        try {
          // Request permissions natively on Android/iOS
          const perm = await Geolocation.checkPermissions();
          if (perm.location !== 'granted') {
            const req = await Geolocation.requestPermissions();
            if (req.location !== 'granted') return;
          }
          
          // Get initial
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
          sendLocation(pos.coords.latitude, pos.coords.longitude);

          // Watch
          watchId = await Geolocation.watchPosition(
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
            (pos, err) => {
              if (pos) sendLocation(pos.coords.latitude, pos.coords.longitude);
            }
          );
        } catch (e) {
          console.warn('Native GPS tracking failed', e);
        }
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
            (err) => console.warn('Initial GPS query failed', err),
            { enableHighAccuracy: true }
          );

          watchId = navigator.geolocation.watchPosition(
            (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
            (err) => console.warn('GPS movement watch failed', err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
          );
        }
      }
    };

    initTracking();

    return () => {
      if (window.Capacitor && watchId) {
        Geolocation.clearWatch({ id: watchId });
      } else if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user]);

    // Global Audio Alarm is now handled by NotificationHandler
  if (path === '/dashboard') {
    pageTitle = "Dashboard";
    pageSubtitle = "Stay safe. We're here to help.";
  } else if (path === '/report') {
    pageTitle = "Report Incident";
    pageSubtitle = "Please provide details about the incident";
  } else if (path.startsWith('/incidents')) {
    if (path.includes('/') && path.split('/').length > 2) {
      pageTitle = "Track Status";
      pageSubtitle = "View the status of your reports";
    } else {
      pageTitle = user?.role === 'Resident' ? "Track Status" : "Incident Inbox";
      pageSubtitle = user?.role === 'Resident' ? "View the status of your reports" : "Manage incoming incident logs";
    }
  } else if (path === '/news') {
    pageTitle = "News & Updates";
    pageSubtitle = "Stay informed with the latest updates";
  } else if (path === '/tips') {
    pageTitle = "Emergency Tips";
    pageSubtitle = "Essential safety guides and checklists";
  } else if (path === '/notifications') {
    pageTitle = "Notifications";
    pageSubtitle = "System alerts and feedback messages";
  } else if (path === '/profile') {
    pageTitle = "Profile settings";
    pageSubtitle = "Configure user details and credentials";
  } else if (path === '/settings') {
    pageTitle = "Settings";
    pageSubtitle = "Manage system preferences";
  } else if (path === '/admin') {
    pageTitle = user?.role === 'Responder' ? "Responder Dashboard" : "Admin Dashboard";
    pageSubtitle = user?.role === 'Responder' ? "Active Incident Operations" : "Overview of the system";
  } else if (path === '/users') {
    pageTitle = "User Management";
    pageSubtitle = "Manage all platform users";
  } else if (path === '/responders') {
    pageTitle = "Responder Directory";
    pageSubtitle = "Active rescue dispatch lists";
  } else if (path === '/logs') {
    pageTitle = "System Audit Logs";
    pageSubtitle = "System operations history";
  } else if (path === '/more') {
    pageTitle = "More";
    pageSubtitle = "Additional modules and settings";
  } else if (path === '/evacuation') {
    pageTitle = "Evacuation Centers";
    pageSubtitle = "Locate safe shelters and view capacity";
  } else if (path === '/household') {
    pageTitle = "Household List";
    pageSubtitle = "Manage family members and details";
  } else if (path === '/hotlines') {
    pageTitle = "Emergency Hotlines";
    pageSubtitle = "Direct access to emergency responders";
  } else if (path === '/admin-analytics') {
    pageTitle = "Analytics & Reports";
    pageSubtitle = "System performance and incident metrics";
  } else if (path === '/admin-vehicles') {
    pageTitle = "Emergency Vehicles";
    pageSubtitle = "Fleet status and deployment tracking";
  } else if (path === '/verifications') {
    pageTitle = "Pending Verifications";
    pageSubtitle = "Review new user registrations";
  } else if (path.startsWith('/admin/users/')) {
    pageTitle = "User Profile";
    pageSubtitle = "View and edit user details";
  }

  const handleUnlockAudio = () => {
    try {
      if ((!window.globalAudioCtx)) {
        window.globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (window.globalAudioCtx.state === 'suspended') {
        window.globalAudioCtx.resume();
      }
      
      // Play a tiny silent snippet to permanently unlock audio for this session
      const osc = window.globalAudioCtx.createOscillator();
      const gain = window.globalAudioCtx.createGain();
      osc.connect(gain);
      gain.connect(window.globalAudioCtx.destination);
      gain.gain.value = 0.000001;
      osc.start(0);
        window.sirenAudio = sirenRef.current;
        if (sirenRef.current) {
          sirenRef.current.volume = 0.001;
          sirenRef.current.play().then(() => {
            sirenRef.current.pause();
            sirenRef.current.currentTime = 0;
            sirenRef.current.volume = 1;
          }).catch(e => console.warn(e));
        }

        window.chimeAudio = chimeRef.current;
        if (chimeRef.current) {
          chimeRef.current.volume = 0.001;
          chimeRef.current.play().then(() => {
            chimeRef.current.pause();
            chimeRef.current.currentTime = 0;
            chimeRef.current.volume = 1;
          }).catch(e => console.warn(e));
        }
      
      setAudioUnlocked(true);
      isAudioUnlockedGlobal = true;
    } catch(e) {
      console.warn("Audio unlock failed:", e);
      setAudioUnlocked(true); // Fallback so they aren't stuck
      isAudioUnlockedGlobal = true;
    }
  };

  // If Admin/Responder and Audio is NOT unlocked, show the Go On Duty Screen
  if (user && (user.role === 'Admin' || user.role === 'Responder') && !audioUnlocked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', padding: '20px', textAlign: 'center', zIndex: 9999 }}>
        {/* Render audio elements hidden so refs are populated for unlock */}
        <audio id="siren-audio" ref={sirenRef} src="/siren.wav" preload="auto" loop style={{display: "none"}}></audio>
        <audio id="chime-audio" ref={chimeRef} src="/chime.wav" preload="auto" loop style={{display: "none"}}></audio>
        <div style={{ background: 'var(--card-bg)', padding: '40px 30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: '400px', width: '100%' }}>
          <div style={{ width: '80px', height: '80px', background: 'rgba(231, 76, 60, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: '40px' }}>🔔</span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>Ready for Duty?</h2>
          <p style={{ fontSize: '15px', color: 'var(--text-light)', marginBottom: '32px', lineHeight: '1.5' }}>
            Browser policies require you to click before audio alarms can play. Click the button below to go on duty and enable the emergency siren.
          </p>
          <button 
            onClick={handleUnlockAudio}
            style={{ width: '100%', padding: '16px', background: 'var(--danger-color)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)' }}
          >
            Go On Duty
          </button>
        </div>
      </div>
    );
  }    return (
      <><div className="app-container">
        <audio id="siren-audio" ref={sirenRef} src="/siren.wav" preload="auto" loop style={{display: "none"}}></audio>
        <audio id="chime-audio" ref={chimeRef} src="/chime.wav" preload="auto" loop style={{display: "none"}}></audio>
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      <div className="main-content">
        
        {isOffline && (
          <div style={{ backgroundColor: '#f39c12', color: 'white', padding: '10px', textAlign: 'center', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span> Offline Mode: Showing cached emergency data.
          </div>
        )}
        <Header title={pageTitle} subtitle={pageSubtitle} toggleSidebar={toggleSidebar} />
        {children}<div style={{ height: "100px", width: "100%", flexShrink: 0 }} className="mobile-bottom-spacer"></div>
      </div>
      {installPrompt && (
        <div style={{ position: 'fixed', bottom: '80px', right: '20px', left: 'auto', width: 'calc(100% - 40px)', maxWidth: '350px', padding: '16px', backgroundColor: '#eaf5ee', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1px solid #a9dfbf', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 9999 }}>
          <div>
            <div style={{ fontWeight: '800', color: 'var(--primary-color)', fontSize: '15px', marginBottom: '4px' }}>Install App</div>
            <div style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.4' }}>Add to home screen for offline emergency access.</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setInstallPrompt(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', padding: '8px' }}>Dismiss</button>
            <button onClick={handleInstallClick} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700' }}>Install</button>
          </div>
        </div>
      )}

      {sidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 95 }}
          className="menu-toggle"
        />
      )}
      </div><MobileBottomNav />{activeBroadcast && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRadius: '24px',
            padding: '32px 24px',
            boxShadow: '0 25px 60px rgba(220, 38, 38, 0.4), 0 0 0 3px #dc2626',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '42px',
              boxShadow: '0 0 25px rgba(239, 68, 68, 0.5)'
            }}>
              🚨
            </div>

            <div style={{
              backgroundColor: '#dc2626',
              color: 'white',
              fontSize: '11px',
              fontWeight: '900',
              padding: '6px 14px',
              borderRadius: '20px',
              letterSpacing: '1.2px',
              textTransform: 'uppercase'
            }}>
              LGU Emergency Broadcast • Nonstop Siren Active
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0 0', color: 'var(--text-main, #0f172a)', lineHeight: '1.3' }}>
              {activeBroadcast.title || 'CRITICAL EMERGENCY ADVISORY'}
            </h2>

            <p style={{ fontSize: '15px', color: 'var(--text-light, #475569)', margin: '0', lineHeight: '1.6', maxHeight: '180px', overflowY: 'auto' }}>
              {activeBroadcast.message}
            </p>

            <button 
              onClick={handleAcknowledgeBroadcast}
              style={{
                width: '100%',
                padding: '16px 20px',
                fontSize: '16px',
                fontWeight: '900',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(220, 38, 38, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px'
              }}
            >
              <span>🔕</span> ACKNOWLEDGE & SILENCE SIREN
            </button>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Tap button to silence alarm and dismiss broadcast.
            </span>
          </div>
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationHandler />
      <LanguageProvider>
        <SystemProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/download" element={<DownloadApp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Resident Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['Resident']}>
                  <AppLayout>
                    <ResidentDashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/report" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <ReportIncident />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Shared / Multi-role Status Tracking Routes */}
              <Route path="/incidents" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <IncidentList />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/incidents/:id" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <TrackStatus />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* News & Bulletins */}
              <Route path="/news" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <NewsUpdates />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Subpages for Resident */}
              <Route path="/tips" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <EmergencyTips />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/more" element={
                <ProtectedRoute allowedRoles={['Resident', 'Responder', 'Admin']}>
                  <AppLayout>
                    <MoreMenu />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/household" element={
                <ProtectedRoute allowedRoles={['Resident']}>
                  <AppLayout>
                    <Household />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Other App Sections */}
              <Route path="/hotlines" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Hotlines />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/evacuation" element={
                <ProtectedRoute><AppLayout><EvacuationCenters /></AppLayout></ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <NotificationsPage />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <UserProfile />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Administrative / Responder Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['Admin', 'Responder']}>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/command-map" element={
                <ProtectedRoute allowedRoles={['Admin', 'Responder']}>
                  <CommandMap />
                </ProtectedRoute>
              } />
              <Route path="/admin-vehicles" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AppLayout>
                    <AdminVehicles />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin-analytics" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AppLayout>
                    <AdminAnalytics />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/verifications" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AppLayout>
                    <AdminVerifyUsers />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/admin/users/:id" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AppLayout>
                    <AdminViewUser />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/responders" element={
                <ProtectedRoute allowedRoles={['Admin', 'Responder']}>
                  <AppLayout>
                    <AdminResponders />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AppLayout>
                    <SystemLogs />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Redirects */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Router>
        </SystemProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;





















