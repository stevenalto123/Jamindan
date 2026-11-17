import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const SystemContext = createContext();

export const useSystem = () => useContext(SystemContext);

export const SystemProvider = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    mci_mode: false
  });

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSettings({ mci_mode: false });
      return;
    }
    fetchSettings();
    const interval = setInterval(fetchSettings, 30000); // Poll every 30 seconds while authenticated
    return () => clearInterval(interval);
  }, [user, fetchSettings]);

  const updateSetting = async (key, value) => {
    try {
      await axios.post('/api/settings', { setting_key: key, setting_value: value });
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  };

  return (
    <SystemContext.Provider value={{ settings, updateSetting, refreshSettings: fetchSettings }}>
      {children}
    </SystemContext.Provider>
  );
};
