import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BellOff } from 'lucide-react';

const NotificationHandler = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isRinging, setIsRinging] = useState(false);
  
  // Track active oscillators to allow stopping them
  const activeOscillators = useRef([]);

  const stopAllAlarms = () => {
    activeOscillators.current.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    });
    activeOscillators.current = [];
    setIsRinging(false);
  };

  const getAudioContext = () => {
    const ctx = window.globalAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  // Synthetic Siren Generator
  const playSiren = () => {
    stopAllAlarms(); // Clear existing
    try {
      const audioCtx = getAudioContext();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'square';
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      const duration = 15;
      
      oscillator.frequency.setValueAtTime(400, now);
      
      for (let i = 0; i < duration; i++) {
        oscillator.frequency.linearRampToValueAtTime(800, now + i + 0.5);
        oscillator.frequency.linearRampToValueAtTime(400, now + i + 1.0);
      }

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gainNode.gain.setValueAtTime(0.3, now + (duration - 0.1));
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      oscillator.start(now);
      
      activeOscillators.current.push(oscillator);
      setIsRinging(true);
      
      // Auto-hide stop button after duration
      setTimeout(() => {
        setIsRinging(false);
      }, duration * 1000);

    } catch (e) {
      console.warn('AudioContext not supported or blocked.', e);
    }
  };

  const playChime = () => {
    stopAllAlarms();
    try {
      const audioCtx = getAudioContext();
      
      const duration = 4.5;
      setIsRinging(true);

      for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const startTime = audioCtx.currentTime + (i * 1.5);
        
        osc.frequency.setValueAtTime(523.25, startTime);
        osc.frequency.setValueAtTime(659.25, startTime + 0.15);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);

        osc.start(startTime);
        osc.stop(startTime + 1.0);
        
        activeOscillators.current.push(osc);
      }
      
      setTimeout(() => {
        setIsRinging(false);
      }, duration * 1000);

    } catch (e) {
      console.warn('AudioContext not supported or blocked.', e);
    }
  };

  const showNotification = (title, body) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    }
  };

  useEffect(() => {
    if (!user) return;
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('new-incident', (data) => {
      if (user.role === 'Admin') {
        playSiren();
        showNotification('?? URGENT: New Incident', 'A new ' + data.type + ' incident (' + data.code + ') has been reported!');
      }
    });

    socket.on('responder-dispatched', (data) => {
      if (user.role === 'Responder' && String(data.responderId) === String(user.id)) {
        playChime();
        showNotification('?? Dispatch Alert', 'You have been assigned to Incident ' + data.code + '. Please respond immediately.');
      }
    });

    socket.on('incident-status-updated', (data) => {
      if (user.role === 'Resident' && String(data.reporterId) === String(user.id)) {
        playChime();
        let message = 'Your incident ' + data.code + ' status was updated to ' + data.status + '.';
        if (data.status === 'In Progress') {
          message = 'Help is on the way! Responders have been dispatched to your location for ' + data.code + '.';
        } else if (data.status === 'Resolved') {
          message = 'Your incident ' + data.code + ' has been resolved.';
        }
        showNotification('Update on your Emergency', message);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopAllAlarms();
    };
  }, [user]);

  if (!isRinging) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 24px',
      backgroundColor: '#e74c3c',
      color: 'white',
      borderRadius: '50px',
      boxShadow: '0 8px 30px rgba(231,76,60,0.6)',
      cursor: 'pointer',
      fontWeight: 'bold',
      gap: '10px',
      animation: 'pulse 1.5s infinite'
    }} onClick={stopAllAlarms}>
      <BellOff size={20} />
      STOP ALARM
    </div>
  );
};

export default NotificationHandler;

