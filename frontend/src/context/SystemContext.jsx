import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const SystemContext = createContext();

export const useSystem = () => useContext(SystemContext);

export const SystemProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    mci_mode: false
  });

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

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
