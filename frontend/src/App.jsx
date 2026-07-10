import React, { useState } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components & Layout
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
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
import UserSettings from './pages/UserSettings';
import AdminReports from './pages/AdminReports';
import AdminResponders from './pages/AdminResponders';
import SystemLogs from './pages/SystemLogs';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', flexDirection: 'column', gap: '12px' }}>
        <div style={{ border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', animation: 'pulse 1s infinite' }}></div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: '600', color: 'var(--primary-color)' }}>Loading Jamindan Emergency Response Platform...</p>
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

// Main App Layout Wrapper (Resolves titles dynamically to match templates)
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const { user } = useAuth();
  const location = useLocation();

  // Resolve Header parameters based on route and user profile
  let pageTitle = "Emergency Response";
  let pageSubtitle = "Municipality of Jamindan";

  const path = location.pathname;

  if (path === '/dashboard') {
    pageTitle = user ? `Welcome, ${user.full_name}!` : "Welcome!";
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
  } else if (path === '/reports') {
    pageTitle = "Reports Summary";
    pageSubtitle = "Export administrative emergency logs";
  } else if (path === '/users') {
    pageTitle = "User Management";
    pageSubtitle = "Manage all platform users";
  } else if (path === '/responders') {
    pageTitle = "Responder Directory";
    pageSubtitle = "Active rescue dispatch lists";
  } else if (path === '/logs') {
    pageTitle = "System Audit Logs";
    pageSubtitle = "System operations history";
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="main-content">
        <Header title={pageTitle} subtitle={pageSubtitle} toggleSidebar={toggleSidebar} />
        {children}
      </div>
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
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Resident Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['Resident']}>
              <AppLayout>
                <ResidentDashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute allowedRoles={['Resident']}>
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
            <ProtectedRoute allowedRoles={['Resident']}>
              <AppLayout>
                <EmergencyTips />
              </AppLayout>
            </ProtectedRoute>
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
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={['Resident', 'Admin', 'Responder']}>
              <AppLayout>
                <UserSettings />
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
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['Admin', 'Responder']}>
              <AppLayout>
                <AdminReports />
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
            <ProtectedRoute allowedRoles={['Admin']}>
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
    </AuthProvider>
  );
}

export default App;
