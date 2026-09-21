import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const NotificationHandler = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  // Synthetic Siren Generator
  const playSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      // Modulate frequency to sound like a siren
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.linearRampToValueAtTime(800, now + 0.5);
      oscillator.frequency.linearRampToValueAtTime(400, now + 1.0);
      oscillator.frequency.linearRampToValueAtTime(800, now + 1.5);
      oscillator.frequency.linearRampToValueAtTime(400, now + 2.0);

      // Volume envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gainNode.gain.setValueAtTime(0.3, now + 1.9);
      gainNode.gain.linearRampToValueAtTime(0, now + 2.0);

      oscillator.start(now);
      oscillator.stop(now + 2.0);
    } catch (e) {
      console.warn('AudioContext not supported or blocked by browser policy.', e);
    }
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      oscillator.frequency.setValueAtTime(523.25, now); // C5
      oscillator.frequency.setValueAtTime(659.25, now + 0.15); // E5
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      oscillator.start(now);
      oscillator.stop(now + 1.0);
    } catch (e) {
      console.warn('AudioContext not supported or blocked by browser policy.', e);
    }
  };

  const showNotification = (title, body) => {
    if (!("Notification" in window)) return;
    
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: '/jamindan-seal.png' });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          new Notification(title, { body, icon: '/jamindan-seal.png' });
        }
      });
    }
  };

  useEffect(() => {
    // Request permission early
    if ("Notification" in window && Notification.permission === "default") {
      // Must be initiated by user gesture generally, but we can try
      const requestPerm = () => {
        Notification.requestPermission();
        document.removeEventListener('click', requestPerm);
      };
      document.addEventListener('click', requestPerm);
    }

    if (!user) return;

    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('new-incident', (data) => {
      if (user.role === 'Admin') {
        playSiren();
        showNotification('?? URGENT: New Incident', `A new ${data.type} incident (${data.code}) has been reported!`);
      }
    });

    socket.on('responder-dispatched', (data) => {
      if (user.role === 'Responder' && String(data.responderId) === String(user.id)) {
        playChime();
        showNotification('?? Dispatch Alert', `You have been assigned to Incident ${data.code}. Please respond immediately.`);
      }
    });

    socket.on('incident-status-updated', (data) => {
      if (user.role === 'Resident' && String(data.reporterId) === String(user.id)) {
        playChime();
        let message = `Your incident ${data.code} status was updated to ${data.status}.`;
        if (data.status === 'In Progress') {
          message = `Help is on the way! Responders have been dispatched to your location for ${data.code}.`;
        } else if (data.status === 'Resolved') {
          message = `Your incident ${data.code} has been resolved.`;
        }
        showNotification('Update on your Emergency', message);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  return null; // This component doesn't render anything visually
};

export default NotificationHandler;
