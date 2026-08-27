import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import axios from 'axios';

// Let Vite Proxy handle API requests securely through the tunnel
// axios.defaults.baseURL = 'http://159.223.110.159:29052';
// We can leave this header just in case, it doesn't hurt
axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';

// Register PWA Service Worker for offline support
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
