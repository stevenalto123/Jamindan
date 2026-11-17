import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Configure Axios defaults to support both browser (relative proxy) and native mobile app (absolute IP)
// Update this with the current dynamic Localtunnel URL when building for mobile
export const BACKEND_URL = 'https://jamindan.onrender.com';

if (window.Capacitor) {
  axios.defaults.baseURL = BACKEND_URL;
}

const AuthContext = createContext(null);

const safeStorageGet = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeStorageSet = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch (e) {
    // Ignore restricted WebView / Private Browsing storage errors
  }
};

const safeStorageRemove = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch (e) {
    // Ignore
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => safeStorageGet(sessionStorage, 'token') || safeStorageGet(localStorage, 'token') || null);
  const [loading, setLoading] = useState(true);

  // Sync token to Axios headers and active session cache
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      safeStorageSet(sessionStorage, 'token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      safeStorageRemove(sessionStorage, 'token');
      safeStorageRemove(localStorage, 'token');
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
        const serialized = JSON.stringify(res.data);
        safeStorageSet(sessionStorage, 'cached_user', serialized);
        if (safeStorageGet(localStorage, 'token')) {
          safeStorageSet(localStorage, 'cached_user', serialized);
        }

        // Quietly sync Web Push ONLY if permission was already granted by the user
        if (res.data) {
          subscribeToPushNotifications(false);
        }
      } catch (err) {
        console.error('Failed to load user profile on startup', err);
        // If it's a network error (offline), DO NOT log them out. Just use cached user.
        if (!err.response || (err.response.status !== 401 && err.response.status !== 403)) {
          const cachedUser = safeStorageGet(sessionStorage, 'cached_user') || safeStorageGet(localStorage, 'cached_user');
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (parseErr) {
              safeStorageRemove(sessionStorage, 'cached_user');
              safeStorageRemove(localStorage, 'cached_user');
            }
          }
        } else {
          // Clear expired/invalid credentials from BOTH sessionStorage and localStorage
          setToken(null);
          setUser(null);
          safeStorageRemove(sessionStorage, 'token');
          safeStorageRemove(sessionStorage, 'cached_user');
          safeStorageRemove(localStorage, 'token');
          safeStorageRemove(localStorage, 'cached_user');
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

  const subscribeToPushNotifications = async (allowPrompt = false) => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !window.Notification ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return;
    }
    try {
      let permission = window.Notification.permission;
      if (permission === 'default' && allowPrompt) {
        permission = await window.Notification.requestPermission();
      }
      if (permission !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      if (!registration || !registration.pushManager) {
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        // VAPID Public Key from .env
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BJd5fK6r2z9Z39nPfgkV3kKcE9K3K7nvIAC7GFQdgZodVaVz-DRXaCVUoeb3VSjQxQCgJ3jPiDKm6cOI1PuU-oM';
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
        });
      }

      await axios.post('/api/push/subscribe', { subscription });
    } catch (err) {
      // Browser/device push unavailable (e.g., headless browser, incognito, or iOS non-PWA tab)
      console.debug('Push subscription unavailable:', err?.message || err);
    }
  };

  const login = async (username, password, rememberMe = false) => {
    // Request permission immediately on click but DO NOT await it so it doesn't block login if browser hangs
    if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === 'default') {
      try {
        window.Notification.requestPermission().catch(() => {});
      } catch (err) {
        // Ignore
      }
    }

    const res = await axios.post('/api/auth/login', { username, password });
    const serializedUser = JSON.stringify(res.data.user);

    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    safeStorageSet(sessionStorage, 'token', res.data.token);
    safeStorageSet(sessionStorage, 'cached_user', serializedUser);

    if (rememberMe) {
      safeStorageSet(localStorage, 'token', res.data.token);
      safeStorageSet(localStorage, 'cached_user', serializedUser);
    } else {
      safeStorageRemove(localStorage, 'token');
      safeStorageRemove(localStorage, 'cached_user');
    }

    setToken(res.data.token);
    setUser(res.data.user);

    if (res.data.user && typeof window !== 'undefined' && 'Notification' in window && window.Notification?.permission === 'granted') {
      subscribeToPushNotifications(false);
    }

    return res.data.user;
  };

  const register = async (formData) => {
    const res = await axios.post('/api/auth/register', formData);
    return res.data;
  };

  const logout = async () => {
    const logoutPath = typeof window !== 'undefined' ? window.location.pathname : '';
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Failed to log logout action on backend', err);
    } finally {
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      safeStorageRemove(sessionStorage, 'token');
      safeStorageRemove(sessionStorage, 'cached_user');
      safeStorageRemove(localStorage, 'token');
      safeStorageRemove(localStorage, 'cached_user');
      if (logoutPath) {
        safeStorageSet(sessionStorage, 'logged_out_from', logoutPath);
      }
    }
  };

  const updateProfile = async (profileData) => {
    await axios.put('/api/auth/profile', profileData);
    // Reload user data
    const res = await axios.get('/api/auth/me');
    setUser(res.data);

    // Update the cache so it doesn't revert on refresh
    const serialized = JSON.stringify(res.data);
    if (safeStorageGet(sessionStorage, 'token')) {
      safeStorageSet(sessionStorage, 'cached_user', serialized);
    }
    if (safeStorageGet(localStorage, 'token')) {
      safeStorageSet(localStorage, 'cached_user', serialized);
    }
  };

  const changePassword = async (passwordData) => {
    const res = await axios.put('/api/auth/change-password', passwordData);
    return res.data;
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    subscribeToPushNotifications
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
