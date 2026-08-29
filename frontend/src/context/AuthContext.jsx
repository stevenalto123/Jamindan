import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Configure Axios defaults to support both browser (relative proxy) and native mobile app (absolute IP)
// Update this with the current dynamic Localtunnel URL when building for mobile
export const BACKEND_URL = window.Capacitor ? 'http://159.223.110.159:29052' : 'https://jamindan.onrender.com';

if (window.Capacitor) {
  axios.defaults.baseURL = BACKEND_URL;
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token to Axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user on start
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data);
        localStorage.setItem('cached_user', JSON.stringify(res.data));
        
        // Auto-subscribe Responders/Admins to Web Push Notifications
        if (res.data && (res.data.role === 'Responder' || res.data.role === 'Admin')) {
          subscribeToPushNotifications();
        }
      } catch (err) {
        console.error('Failed to load user profile on startup', err);
        // If it's a network error (offline), DO NOT log them out. Just use cached user.
        if (!err.response) {
          const cachedUser = localStorage.getItem('cached_user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          }
        } else {
          // If the server explicitly says the token is invalid (e.g. 401), then log out
          setToken(null);
          setUser(null);
          localStorage.removeItem('cached_user');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  // Convert VAPID key helper
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeToPushNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        // VAPID Public Key from .env
        const publicVapidKey = 'BJd5fK6r2z9Z39nPfgkV3kKcE9K3K7nvIAC7GFQdgZodVaVz-DRXaCVUoeb3VSjQxQCgJ3jPiDKm6cOI1PuU-oM';
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      await axios.post('/api/push/subscribe', { subscription });
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    setToken(res.data.token);
    setUser(res.data.user);
    localStorage.setItem('cached_user', JSON.stringify(res.data.user));
    
    if (res.data.user && (res.data.user.role === 'Responder' || res.data.user.role === 'Admin')) {
      subscribeToPushNotifications();
    }
    
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await axios.post('/api/auth/register', formData);
    return res.data;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Failed to log logout action on backend', err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('cached_user');
    }
  };

  const updateProfile = async (profileData) => {
    await axios.put('/api/auth/profile', profileData);
    // Reload user data
    const res = await axios.get('/api/auth/me');
    setUser(res.data);
  };

  const changePassword = async (passwordData) => {
    const res = await axios.put('/api/auth/change-password', passwordData);
    return res.data;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
