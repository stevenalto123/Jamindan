import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Synchronously capture broadcast parameters on page load so state is ready on initial render tick
const getInitialBroadcast = () => {
  try {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('broadcast') === '1') {
        const item = {
          id: 'push_' + Date.now(),
          title: decodeURIComponent(params.get('title') || '🚨 EMERGENCY ALERT: EXTREME'),
          message: decodeURIComponent(params.get('msg') || 'Emergency advisory issued by Jamindan MDRRMO.'),
          severity: params.get('severity') || 'extreme',
          target_area: decodeURIComponent(params.get('area') || 'Municipality of Jamindan (All Barangays)'),
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('pending_broadcast_alert', JSON.stringify(item));
        return item;
      }
    }
    const stored = sessionStorage.getItem('pending_broadcast_alert');
    if (stored) {
      sessionStorage.removeItem('pending_broadcast_alert');
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Initial broadcast pre-capture error:', e);
  }
  return null;
};

const EmergencyBroadcastHandler = () => {
  const [activeBroadcast, setActiveBroadcast] = useState(getInitialBroadcast);
  const location = useLocation();
  const { user } = useAuth();
  const sirenRef = useRef(null);
  const chimeRef = useRef(null);

  // Nonstop Authentic NDRRMC Two-Tone Siren (853 Hz + 960 Hz) & Nonstop Vibration
  useEffect(() => {
    let interval = null;
    let audioCtx = null;
    let osc1 = null;
    let osc2 = null;
    let gainNode = null;
    let compressor = null;
    let oscInterval = null;
    let autoRetryTimer = null;
    const sirenEl = sirenRef.current || document.getElementById('siren-audio');

    const unlockAudio = () => {
      try {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(e => console.warn('AudioContext resume:', e));
        }
        if (window.globalAudioCtx && window.globalAudioCtx.state === 'suspended') {
          window.globalAudioCtx.resume().catch(e => console.warn('Global AudioContext resume:', e));
        }
        if (sirenEl && sirenEl.paused) {
          sirenEl.volume = 1.0;
          sirenEl.currentTime = 0;
          sirenEl.loop = true;
          sirenEl.play().catch(e => console.warn('HTML5 siren play:', e));
        }
      } catch (e) {
        console.warn('Unlock audio failed:', e);
      }
    };

    window.unlockBroadcastAudio = unlockAudio;
    const unlockEvents = [
      'click', 'touchstart', 'touchend', 'touchmove', 'pointerdown', 'pointerup', 
      'mousedown', 'focus', 'pageshow', 'visibilitychange', 'keydown', 'scroll'
    ];
    unlockEvents.forEach(evt => window.addEventListener(evt, unlockAudio, { passive: true }));
    unlockEvents.forEach(evt => document.addEventListener(evt, unlockAudio, { passive: true }));

    const stopAudio = () => {
      unlockEvents.forEach(evt => window.removeEventListener(evt, unlockAudio));
      unlockEvents.forEach(evt => document.removeEventListener(evt, unlockAudio));
      window.unlockBroadcastAudio = null;

      if (autoRetryTimer) {
        clearInterval(autoRetryTimer);
        autoRetryTimer = null;
      }
      if (oscInterval) {
        clearInterval(oscInterval);
        oscInterval = null;
      }
      if (osc1) {
        try { osc1.stop(); osc1.disconnect(); } catch (e) {}
        osc1 = null;
      }
      if (osc2) {
        try { osc2.stop(); osc2.disconnect(); } catch (e) {}
        osc2 = null;
      }
      if (gainNode) {
        try { gainNode.disconnect(); } catch (e) {}
        gainNode = null;
      }
      if (compressor) {
        try { compressor.disconnect(); } catch (e) {}
        compressor = null;
      }
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(e => console.warn(e));
        audioCtx = null;
      }
      if (sirenEl) {
        sirenEl.pause();
        sirenEl.currentTime = 0;
      }
    };

    if (activeBroadcast) {
      window.isBroadcastActive = true;
      const severity = activeBroadcast.severity || 'extreme';

      // 1. Continuous Nonstop In-App Vibration Pattern (3.5s buzz, 500ms pause, continuous)
      const vibPattern = severity === 'advisory' 
        ? [500, 300, 500] 
        : [3500, 500, 3500, 500, 3500, 500];

      if (navigator.vibrate) {
        navigator.vibrate(vibPattern);
      }
      interval = setInterval(() => {
        if (navigator.vibrate && window.isBroadcastActive) {
          navigator.vibrate(vibPattern);
        }
      }, 4000);

      // 2. Synthesize Official NDRRMC Dual-Frequency Attention Signal (853 Hz + 960 Hz pure sines)
      // Boosted with Dynamics Compression & Maximum Gain for Maximum Loudness
      const playNdrrmcTwoTone = () => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (!AudioContext) return;

          audioCtx = window.globalAudioCtx || new AudioContext();
          window.globalAudioCtx = audioCtx;

          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn('AudioContext initial resume:', e));
          }

          // Full Loudness: Gain set to 1.0 (Maximum)
          gainNode = audioCtx.createGain();
          const maxGain = severity === 'advisory' ? 0.6 : 1.0;
          gainNode.gain.setValueAtTime(maxGain, audioCtx.currentTime);

          // Dynamics Compressor boosts perceived loudness & RMS through mobile phone speakers
          compressor = audioCtx.createDynamicsCompressor();
          compressor.threshold.setValueAtTime(-14, audioCtx.currentTime);
          compressor.knee.setValueAtTime(6, audioCtx.currentTime);
          compressor.ratio.setValueAtTime(14, audioCtx.currentTime);
          compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
          compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

          gainNode.connect(compressor);
          compressor.connect(audioCtx.destination);

          if (severity === 'advisory') {
            osc1 = audioCtx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(660, audioCtx.currentTime);
            osc1.connect(gainNode);
            osc1.start();
          } else {
            // Authentic WEA / NDRRMC Dual Tone: Simultaneous 853 Hz & 960 Hz pure sines
            osc1 = audioCtx.createOscillator();
            osc2 = audioCtx.createOscillator();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(853, audioCtx.currentTime);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(960, audioCtx.currentTime);

            osc1.connect(gainNode);
            osc2.connect(gainNode);

            osc1.start();
            osc2.start();
          }

          // HTML5 Audio siren in parallel at full 100% volume
          if (sirenEl) {
            sirenEl.volume = 1.0;
            sirenEl.currentTime = 0;
            sirenEl.loop = true;
            sirenEl.play().catch(e => console.warn('HTML5 siren immediate play:', e));
          }

          // Pulsed attention cadence (800ms ON / 150ms OFF)
          let isPulseOn = true;
          oscInterval = setInterval(() => {
            if (audioCtx && audioCtx.state !== 'closed' && gainNode) {
              isPulseOn = !isPulseOn;
              const now = audioCtx.currentTime;
              gainNode.gain.cancelScheduledValues(now);
              gainNode.gain.setValueAtTime(isPulseOn ? maxGain : 0.001, now);
            } else {
              clearInterval(oscInterval);
            }
          }, 800);

          // Aggressive Autoplay Unlock Retry (retries every 100ms for first 3.5 seconds)
          let attempts = 0;
          autoRetryTimer = setInterval(() => {
            attempts++;
            unlockAudio();
            if ((audioCtx && audioCtx.state === 'running') || attempts > 35) {
              clearInterval(autoRetryTimer);
            }
          }, 100);

        } catch (err) {
          console.warn('NDRRMC audio synthesis error:', err);
          if (sirenEl) {
            sirenEl.volume = 1.0;
            sirenEl.currentTime = 0;
            sirenEl.loop = true;
            sirenEl.play().catch(e => console.warn(e));
          }
        }
      };

      playNdrrmcTwoTone();
    } else {
      window.isBroadcastActive = false;
      stopAudio();
    }

    return () => {
      window.isBroadcastActive = false;
      if (interval) clearInterval(interval);
      stopAudio();
    };
  }, [activeBroadcast]);

  // Check storage, URL params, or active broadcast API
  useEffect(() => {
    const checkActiveBroadcast = async () => {
      // 0. Check pre-captured broadcast from storage
      const storedPending = sessionStorage.getItem('pending_broadcast_alert');
      if (storedPending) {
        try {
          const parsed = JSON.parse(storedPending);
          sessionStorage.removeItem('pending_broadcast_alert');
          setActiveBroadcast(parsed);
          return;
        } catch (e) {}
      }

      // 1. Immediately inspect URL search parameters
      const urlParams = new URLSearchParams(window.location.search || location.search);
      if (urlParams.get('broadcast') === '1') {
        const rawTitle = urlParams.get('title') || '🚨 EMERGENCY ALERT: EXTREME';
        const rawMsg = urlParams.get('msg') || 'Emergency advisory issued by Jamindan MDRRMO.';
        const rawSeverity = urlParams.get('severity') || 'extreme';
        const rawArea = urlParams.get('area') || 'Municipality of Jamindan (All Barangays)';
        setActiveBroadcast({
          id: 'push_' + Date.now(),
          title: decodeURIComponent(rawTitle),
          message: decodeURIComponent(rawMsg),
          severity: rawSeverity,
          target_area: decodeURIComponent(rawArea),
          timestamp: new Date().toISOString()
        });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // 2. Fetch active broadcast from backend
      try {
        const res = await axios.get('/api/notifications/active-broadcast');
        if (res.data?.active && res.data.broadcast) {
          const dismissed = sessionStorage.getItem('dismissed_broadcast_' + res.data.broadcast.id);
          if (dismissed) return;

          setActiveBroadcast({
            id: res.data.broadcast.id,
            title: res.data.broadcast.title,
            message: res.data.broadcast.message,
            severity: res.data.broadcast.severity || 'extreme',
            target_area: res.data.broadcast.target_area || 'Municipality of Jamindan (All Barangays)',
            timestamp: res.data.broadcast.created_at
          });
        }
      } catch (err) {
        console.warn('Failed to check active broadcast:', err);
      }
    };

    checkActiveBroadcast();
    window.addEventListener('focus', checkActiveBroadcast);

    // Socket.io real-time broadcast listener
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });

    socket.on('new-broadcast', (data) => {
      setActiveBroadcast({
        id: 'live_' + Date.now(),
        title: data.title,
        message: data.message,
        severity: data.severity || (data.type === 'advisory' ? 'advisory' : 'extreme'),
        target_area: data.target_area || 'Municipality of Jamindan (All Barangays)',
        timestamp: data.created_at || new Date().toISOString()
      });
    });

    return () => {
      window.removeEventListener('focus', checkActiveBroadcast);
      socket.disconnect();
    };
  }, [location]);

  const handleAcknowledgeBroadcast = async () => {
    if (activeBroadcast?.id) {
      sessionStorage.setItem('dismissed_broadcast_' + activeBroadcast.id, 'true');
      try {
        await axios.put(`/api/notifications/${activeBroadcast.id}/read`);
      } catch (err) {
        console.warn('Failed to mark broadcast as read:', err);
      }
    }
    setActiveBroadcast(null);
  };

  return (
    <>
      <audio id="siren-audio" ref={sirenRef} src="/siren.wav" preload="auto" loop style={{ display: 'none' }}></audio>
      <audio id="chime-audio" ref={chimeRef} src="/chime.wav" preload="auto" loop style={{ display: 'none' }}></audio>

      {activeBroadcast && (() => {
        const severity = activeBroadcast.severity || 'extreme';
        const isExtreme = severity === 'extreme';
        const isSevere = severity === 'severe';

        const accentColor = isExtreme ? '#dc2626' : (isSevere ? '#ea580c' : '#2563eb');
        const accentGlow = isExtreme ? 'rgba(220, 38, 38, 0.45)' : (isSevere ? 'rgba(234, 88, 12, 0.45)' : 'rgba(37, 99, 235, 0.45)');
        const alertBadgeText = isExtreme 
          ? '🚨 EMERGENCY ALERT: EXTREME' 
          : (isSevere ? '⚠️ EMERGENCY ALERT: SEVERE' : '📢 MUNICIPAL PUBLIC ADVISORY');

        let displayMessage = activeBroadcast.message || '';
        let displayArea = activeBroadcast.target_area || 'Municipality of Jamindan (All Barangays)';

        if (displayMessage.startsWith('[') && displayMessage.includes(']')) {
          const match = displayMessage.match(/^\[(.*?)\]\s*(.*)$/s);
          if (match) {
            displayArea = match[1];
            displayMessage = match[2];
          }
        }

        const formatPst = (iso) => {
          try {
            const d = iso ? new Date(iso) : new Date();
            return d.toLocaleString('en-US', {
              timeZone: 'Asia/Manila',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) + ' PST';
          } catch (e) {
            return new Date().toLocaleTimeString() + ' PST';
          }
        };

        return (
          <div 
            onClick={() => window.unlockBroadcastAudio && window.unlockBroadcastAudio()}
            onTouchStart={() => window.unlockBroadcastAudio && window.unlockBroadcastAudio()}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(10, 15, 29, 0.94)',
              zIndex: 999999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              textAlign: 'center',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div 
              onClick={() => {
                if (window.unlockBroadcastAudio) window.unlockBroadcastAudio();
              }}
              onTouchStart={() => {
                if (window.unlockBroadcastAudio) window.unlockBroadcastAudio();
              }}
              style={{
                maxWidth: '490px',
                width: '100%',
                backgroundColor: 'var(--card-bg, #ffffff)',
                borderRadius: '24px',
                padding: '28px 24px',
                boxShadow: `0 25px 60px ${accentGlow}, 0 0 0 3px ${accentColor}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '14px',
                animation: 'pulse 1.8s infinite ease-in-out'
              }}
            >
              {/* Emergency Beacon Icon */}
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                backgroundColor: isExtreme ? '#fee2e2' : (isSevere ? '#ffedd5' : '#dbeafe'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '38px',
                boxShadow: `0 0 25px ${accentGlow}`
              }}>
                {isExtreme ? '🚨' : (isSevere ? '⚠️' : '📢')}
              </div>

              {/* NDRRMC Cell-Broadcast Authority Badge */}
              <div style={{
                backgroundColor: accentColor,
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: '900',
                padding: '6px 16px',
                borderRadius: '30px',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
                boxShadow: `0 4px 14px ${accentGlow}`
              }}>
                {alertBadgeText}
              </div>

              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-light, #64748b)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                NDRRMC • MDRRMO JAMINDAN OPERATIONS CENTER
              </div>

              {/* Target Hazard Area Pill */}
              <div style={{
                backgroundColor: 'rgba(0,0,0,0.05)',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--text-main, #0f172a)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                justifyContent: 'center'
              }}>
                <span>📍</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Target Area: <strong>{displayArea}</strong>
                </span>
              </div>

              {/* Timestamp */}
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                Issued: {formatPst(activeBroadcast.timestamp)}
              </div>

              {/* Alert Title */}
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '2px 0 0', color: 'var(--text-main, #0f172a)', lineHeight: '1.3' }}>
                {activeBroadcast.title || 'CRITICAL EMERGENCY ADVISORY'}
              </h2>

              {/* Message Content */}
              <div style={{
                fontSize: '14px',
                color: 'var(--text-light, #334155)',
                lineHeight: '1.6',
                maxHeight: '180px',
                overflowY: 'auto',
                backgroundColor: 'rgba(0,0,0,0.02)',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #f1f5f9)',
                textAlign: 'left',
                width: '100%',
                whiteSpace: 'pre-line'
              }}>
                {displayMessage}
              </div>

              {/* Big Acknowledge / Silence Siren Button */}
              <button 
                onClick={handleAcknowledgeBroadcast}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: '15px',
                  fontWeight: '900',
                  backgroundColor: accentColor,
                  color: 'white',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  boxShadow: `0 8px 25px ${accentGlow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px'
                }}
              >
                <span>🔕</span> ACKNOWLEDGE & SILENCE ALARM
              </button>

              {/* Regulatory citation */}
              <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
                Republic Act 10639 (Free Mobile Disaster Alerts Act) • MDRRMO Jamindan
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default EmergencyBroadcastHandler;
