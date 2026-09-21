import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BellOff } from 'lucide-react';

const NotificationHandler = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isRinging, setIsRinging] = useState(false);
  const ringTimeout = useRef(null);

  const stopAllAlarms = () => {
    if (window.sirenAudio) {
      window.sirenAudio.pause();
      window.sirenAudio.currentTime = 0;
    }
    if (window.chimeAudio) {
      window.chimeAudio.pause();
      window.chimeAudio.currentTime = 0;
    }
    if (ringTimeout.current) clearTimeout(ringTimeout.current);
    setIsRinging(false);
  };

  const playSiren = () => {
    stopAllAlarms();
    setIsRinging(true);

    // Try HTML5 Audio
    const siren = document.getElementById('siren-audio');
    if (siren) {
      siren.volume = 1.0;
      siren.muted = false;
      siren.currentTime = 0;
      siren.play().catch(e => console.warn("Siren blocked:", e));
    }

    // Try Web Audio API (Synthesized)
    try {
      const audioCtx = window.globalAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
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
      
      if (!window.activeOscillators) window.activeOscillators = [];
      window.activeOscillators.push(oscillator);
    } catch (e) {}

    ringTimeout.current = setTimeout(() => stopAllAlarms(), 15000);
  };

  const playChime = () => {
    stopAllAlarms();
    setIsRinging(true);

    // Try HTML5 Audio
    const chime = document.getElementById('chime-audio');
    if (chime) {
      chime.volume = 1.0;
      chime.muted = false;
      chime.currentTime = 0;
      chime.play().catch(e => console.warn("Chime blocked:", e));
    }

    // Try Web Audio API (Synthesized)
    try {
      const audioCtx = window.globalAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      
      if (!window.activeOscillators) window.activeOscillators = [];

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
        
        window.activeOscillators.push(osc);
      }
    } catch (e) {}

    ringTimeout.current = setTimeout(() => stopAllAlarms(), 5000);
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
      gap: '10px'
    }} onClick={stopAllAlarms}>
      <BellOff size={20} />
      STOP ALARM
    </div>
  );
};

export default NotificationHandler;


