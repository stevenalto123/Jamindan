import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import axios from 'axios';

// Connect directly to the cloud backend on Render
axios.defaults.baseURL = 'https://jamindan.onrender.com';

// Automatically attach authentication Bearer token to all Axios requests from storage
axios.interceptors.request.use((config) => {
  try {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (e) {
    // Ignore restricted WebView storage errors
  }
  return config;
}, (error) => Promise.reject(error));

// Register PWA Service Worker for offline support
registerSW({ immediate: true });

// Restore theme from localStorage safely
try {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
} catch (e) {
  // Ignore restricted WebView storage errors
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
