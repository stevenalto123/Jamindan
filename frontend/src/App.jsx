import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SystemProvider } from './context/SystemContext';
import { Geolocation } from '@capacitor/geolocation';

// Components & Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MobileBottomNav from './components/MobileBottomNav';

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

// Subpages
import EmergencyTips from './pages/EmergencyTips';
import NotificationsPage from './pages/NotificationsPage';
import UserProfile from './pages/UserProfile';
import AdminResponders from './pages/AdminResponders';
import SystemLogs from './pages/SystemLogs';
import AdminVerifyUsers from './pages/AdminVerifyUsers';
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

let globalAudioCtx = null;

// Main App Layout Wrapper (Resolves titles dynamically to match templates)
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { user } = useAuth();

  const [installPrompt, setInstallPrompt] = useState(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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

  // Global Audio Alarm for New Emergencies (Responders & Admins)
  const [lastPendingCount, setLastPendingCount] = useState(-1);

  useEffect(() => {
    const initAudio = () => {
      if (!globalAudioCtx) {
        globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (globalAudioCtx.state === 'suspended') {
        globalAudioCtx.resume();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  useEffect(() => {
    if (!user || (user.role !== 'Responder' && user.role !== 'Admin')) return;

    const playSiren = () => {
      try {
        // 1. Play loud real emergency siren MP3 audio (works on Android APK WebView)
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 1.0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn("Audio autoplay blocked:", e));
        }

        // 2. Web Audio Synth Fallback
        if (!globalAudioCtx) {
          globalAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (globalAudioCtx.state === 'suspended') {
          globalAudioCtx.resume();
        }

        const oscillator = globalAudioCtx.createOscillator();
        const gainNode = globalAudioCtx.createGain();
        
        window.stopGlobalSiren = () => {
          try {
            audio.pause();
            audio.currentTime = 0;
            if (gainNode) {
              gainNode.gain.cancelScheduledValues(globalAudioCtx.currentTime);
              gainNode.gain.setValueAtTime(gainNode.gain.value || 0.1, globalAudioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.001, globalAudioCtx.currentTime + 0.1);
            }
            if (oscillator) {
              oscillator.stop(globalAudioCtx.currentTime + 0.15);
            }
            if (navigator.vibrate) navigator.vibrate(0); 
          } catch(e) {}
        };
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(400, globalAudioCtx.currentTime); 

        const durationLoops = 8; 
        for (let i = 0; i < durationLoops; i++) {
          const startTime = globalAudioCtx.currentTime + (i * 0.8);
          oscillator.frequency.linearRampToValueAtTime(800, startTime + 0.4); 
          oscillator.frequency.linearRampToValueAtTime(400, startTime + 0.8); 
        }
        
        const totalDuration = durationLoops * 0.8;
        gainNode.gain.setValueAtTime(0.1, globalAudioCtx.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(1, globalAudioCtx.currentTime + 0.1); 
        gainNode.gain.setValueAtTime(1, globalAudioCtx.currentTime + totalDuration - 0.5); 
        gainNode.gain.exponentialRampToValueAtTime(0.01, globalAudioCtx.currentTime + totalDuration); 
        
        oscillator.connect(gainNode);
        gainNode.connect(globalAudioCtx.destination);
        
        oscillator.start();
        oscillator.stop(globalAudioCtx.currentTime + totalDuration + 0.1);
      } catch (e) {
        console.warn("Audio Context Error", e);
      }
    };

    const checkForEmergencies = async () => {
      try {
        const res = await axios.get('/api/incidents');
        const pending = res.data.filter(inc => inc.status === 'Pending');
        
        if (lastPendingCount !== -1 && pending.length > lastPendingCount) {
          playSiren();
          if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500, 200, 500, 200]); 
        }
        setLastPendingCount(pending.length);
      } catch (err) {
        console.error("Audio poller failed", err);
      }
    };

    const interval = setInterval(checkForEmergencies, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [user, lastPendingCount]);

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
    pageTitle = "Admin Dashboard";
    pageSubtitle = "Overview of the system";
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
  }

  return (
    <div className={`app-container ${path === '/dashboard' || path === '/admin' ? 'mobile-hide-header' : ''}`}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Header title={pageTitle} subtitle={pageSubtitle} toggleSidebar={toggleSidebar} />
        {children}
      </div>
      {installPrompt && (
        <div style={{ padding: '15px', backgroundColor: '#eaf5ee', borderTop: '1px solid var(--primary-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 90, position: 'relative' }}>
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--primary-color)', fontSize: '14px' }}>Install App</div>
            <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Add to home screen for offline access</div>
          </div>
          <button onClick={handleInstallClick} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Install</button>
        </div>
      )}
      <MobileBottomNav />
      {sidebarOpen && (
        <div 
          onClick={toggleSidebar} 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 95 }}
          className="menu-toggle"
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
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
                  <AppLayout>
                    <ReportIncident />
                  </AppLayout>
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
                  <AppLayout>
                    <EmergencyTips />
                  </AppLayout>
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
              {/* Offline Accessible Hotlines */}
              <Route path="/hotlines" element={
                <AppLayout>
                  <Hotlines />
                </AppLayout>
              } />

              <Route path="/hotlines" element={
                <ProtectedRoute><AppLayout><Hotlines /></AppLayout></ProtectedRoute>
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
              <Route path="/tips" element={
                <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
                  <AppLayout>
                    <EmergencyTips />
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
              <Route path="/responders" element={
                <ProtectedRoute allowedRoles={['Admin', 'Responder']}>
                  <AppLayout>
                    <AdminResponders />
                  </AppLayout>
                </ProtectedRoute>
              } />
              <Route path="/logs" element={
                <ProtectedRoute allowedRoles={['Admin', 'Responder']}>
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
