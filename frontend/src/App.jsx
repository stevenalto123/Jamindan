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
  const [activeEvacuation, setActiveEvacuation] = useState(null);
  
  // Continuous alarm for evacuation
  useEffect(() => {
    let interval;
    let audioCtx;
    let osc;

    if (activeEvacuation) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioCtx = new AudioContext();
          
          osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          osc.type = 'square';
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          // Start the siren
          osc.frequency.setValueAtTime(800, audioCtx.currentTime);
          osc.start();
          gainNode.gain.value = 0.3; // 30% volume to prevent blowing out speakers

          let isHigh = true;
          interval = setInterval(() => {
            if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200]);
            
            if (osc) {
              isHigh = !isHigh;
              // Toggle between 800Hz and 1200Hz (European emergency siren style)
              osc.frequency.setValueAtTime(isHigh ? 800 : 1200, audioCtx.currentTime);
            }
          }, 800);
        }
      } catch (err) {
        console.warn('Audio API failed or blocked:', err);
        interval = setInterval(() => {
          if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200]);
        }, 1500);
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
      if (osc) {
        try {
          osc.stop();
          osc.disconnect();
        } catch(e){}
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(e => console.warn(e));
      }
    };
  }, [activeEvacuation]);
  
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

    // Listen for global mass broadcasts to show an in-app popup and vibrate
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('new-broadcast', (data) => {
      // Don't trigger the alarm for Admin or Responder accounts
      if (user?.role === 'Admin' || user?.role === 'Responder') return;

      if (data.type === 'evacuation') {
        setActiveEvacuation(data);
      } else {
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]); // Normal vibration
        }
        window.alert(`📢 LGU BROADCAST\n\n${data.title}\n${data.message}`);
      }
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.disconnect();
    };
  }, []);

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
      // osc.stop(); removed to keep iOS AudioContext permanently active
      
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
  }

  return (
    <><div className="app-container">
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
      </div><MobileBottomNav />{activeEvacuation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(192, 57, 43, 0.95)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', color: 'white', animation: 'pulse 1s infinite' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>⚠️ EVACUATION ALERT ⚠️</h1>
          <h2 style={{ fontSize: '22px', marginBottom: '15px' }}>{activeEvacuation.title}</h2>
          <p style={{ fontSize: '16px', marginBottom: '40px', maxWidth: '400px' }}>{activeEvacuation.message}</p>
          <button 
            onClick={() => setActiveEvacuation(null)}
            style={{ padding: '16px 32px', fontSize: '16px', fontWeight: 'bold', backgroundColor: 'white', color: '#c0392b', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
          >
            ACKNOWLEDGE & STOP ALARM
          </button>
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















