import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import axios from 'axios';

// Connect directly to the new cloud backend on Render
axios.defaults.baseURL = 'https://jamindan.onrender.com';
// We can leave this header just in case, it doesn't hurt
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';

// Automatically attach authentication Bearer token to all Axios requests from storage
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Register PWA Service Worker for offline support
registerSW({ immediate: true });

// Restore theme from localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
