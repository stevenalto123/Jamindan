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

// Register PWA Service Worker for offline support
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
