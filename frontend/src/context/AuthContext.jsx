import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Configure Axios defaults
axios.defaults.baseURL = 'http://localhost:5000';

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
      } catch (err) {
        console.error('Failed to load user profile on startup', err);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (username, password, full_name, phone, barangay) => {
    const res = await axios.post('/api/auth/register', {
      username,
      password,
      full_name,
      phone,
      barangay
    });
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
