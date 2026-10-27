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
    window.isAlarmStopped = true;
    const siren = document.getElementById('siren-audio');
    const chime = document.getElementById('chime-audio');
    if (siren) {
      siren.pause();
      siren.currentTime = 0;
    }
    if (chime) {
      chime.pause();
      chime.currentTime = 0;
    }
    if (ringTimeout.current) clearTimeout(ringTimeout.current);
    setIsRinging(false);
  };

  const playSiren = () => {
    stopAllAlarms();
    setIsRinging(true);
    window.isAlarmStopped = false;

    const siren = document.getElementById('siren-audio');
    if (siren) {
      siren.volume = 1.0;
      siren.muted = false;
      siren.currentTime = 0;
      const playPromise = siren.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (window.isAlarmStopped) siren.pause();
        }).catch(e => console.warn("Siren blocked:", e));
      }
    }

  };

  const playChime = () => {
    const chime = document.getElementById('chime-audio');
    if (chime) {
      chime.loop = false;
      chime.volume = 0.85;
      chime.muted = false;
      chime.currentTime = 0;
      chime.play().catch(e => console.warn("Chime blocked:", e));
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
        showNotification('🚨 URGENT: New Incident', 'A new ' + data.type + ' incident (' + data.code + ') has been reported!');
      }
    });

    socket.on('responder-dispatched', (data) => {
      if (user.role === 'Responder' && String(data.responderId) === String(user.id)) {
        playSiren();
        showNotification('🚨 Dispatch Alert', 'You have been assigned to Incident ' + data.code + '. Please respond immediately.');
      }
    });

    socket.on('agency-handoff', (data) => {
      if (user.role === 'Responder') {
        const userAgency = (user.agency_type || 'MDRRMO').toUpperCase();
        const target = (data.leadAgency || '').toUpperCase();
        const isMatch =
          userAgency === target ||
          (target === 'RHU' && userAgency === 'MEDICAL') ||
          (target === 'BFP' && userAgency === 'FIRE') ||
          (target === 'MDRRMO' && userAgency === 'RESCUE');
        if (isMatch) {
          playSiren();
          showNotification(
            `🚨 Inter-Agency Handoff (${data.leadAgency})`,
            `Incident ${data.code} has been handed off to ${data.leadAgency}.${data.notes ? ' Notes: ' + data.notes : ''}`
          );
        }
      }
    });

    socket.on('incident-status-updated', (data) => {
      if (user.role === 'Resident' && String(data.reporterId) === String(user.id)) {
        playChime(); // Gentle distinctive chime for resident status updates
        let message = 'Your incident ' + (data.code || '') + ' status was updated to ' + data.status + '.';
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






