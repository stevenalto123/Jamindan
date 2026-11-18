import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createAuthSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { BellOff, ShieldAlert, Phone, MapPin, Eye, Volume2, AlertTriangle, X } from 'lucide-react';

const NotificationHandler = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isRinging, setIsRinging] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  // Web Audio Context & Oscillator Refs for synthesis fallback
  const webAudioCtxRef = useRef(null);
  const sirenIntervalRef = useRef(null);
  const activeNodesRef = useRef(null);

  const stopWebAudioSiren = useCallback(() => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (activeNodesRef.current) {
      activeNodesRef.current.forEach(node => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch (e) {}
      });
      activeNodesRef.current = null;
    }
  }, []);

  const stopAllAlarms = useCallback(() => {
    window.isAlarmStopped = true;
    stopWebAudioSiren();

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
    setIsRinging(false);
    setActiveAlert(null);
    setAudioBlocked(false);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(0); } catch (e) {}
    }
  }, [stopWebAudioSiren]);

  const startWebAudioSiren = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!webAudioCtxRef.current || webAudioCtxRef.current.state === 'closed') {
        webAudioCtxRef.current = (window.globalAudioCtx && window.globalAudioCtx.state !== 'closed')
          ? window.globalAudioCtx
          : new AudioCtxClass();
      }
      const ctx = webAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      stopWebAudioSiren();

      // Authentic Dual-Tone Emergency Siren Synthesis
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      const now = ctx.currentTime;
      osc1.frequency.setValueAtTime(750, now);
      osc2.frequency.setValueAtTime(960, now);

      gain.gain.setValueAtTime(0.4, now);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      // Wail modulation: sweeps between 680Hz and 1180Hz
      let freq = 750;
      let rising = true;
      sirenIntervalRef.current = setInterval(() => {
        if (!webAudioCtxRef.current || webAudioCtxRef.current.state === 'closed') return;
        const curTime = webAudioCtxRef.current.currentTime;
        if (rising) {
          freq += 75;
          if (freq >= 1180) rising = false;
        } else {
          freq -= 75;
          if (freq <= 680) rising = true;
        }
        try {
          osc1.frequency.linearRampToValueAtTime(freq, curTime + 0.08);
          osc2.frequency.linearRampToValueAtTime(freq * 1.25, curTime + 0.08);
        } catch (e) {}
      }, 90);

      activeNodesRef.current = [osc1, osc2, gain];
      setAudioBlocked(false);
    } catch (e) {
      console.warn('[NotificationHandler] Web Audio Siren initialization error:', e);
    }
  }, [stopWebAudioSiren]);

  const playSiren = useCallback((alertData = null) => {
    window.isAlarmStopped = false;
    setIsRinging(true);
    if (alertData) {
      setActiveAlert(alertData);
    }

    // 1. Synthesize Web Audio Siren
    startWebAudioSiren();

    // 2. Play HTML5 Audio element fallback / booster
    const siren = document.getElementById('siren-audio');
    if (siren) {
      siren.volume = 1.0;
      siren.muted = false;
      siren.currentTime = 0;
      const playPromise = siren.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          if (window.isAlarmStopped) siren.pause();
          setAudioBlocked(false);
        }).catch(err => {
          console.warn('[NotificationHandler] HTML5 siren autoplay was blocked by browser:', err);
          setAudioBlocked(true);
        });
      }
    }

    // 3. Trigger Hardware Haptic Vibration (Emergency Alert cadence)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([1200, 250, 1200, 250, 1200]);
      } catch (e) {}
    }
  }, [startWebAudioSiren]);

  const playChime = useCallback(() => {
    const chime = document.getElementById('chime-audio');
    if (chime) {
      chime.loop = false;
      chime.volume = 0.85;
      chime.muted = false;
      chime.currentTime = 0;
      chime.play().catch(e => console.warn('[NotificationHandler] Chime blocked:', e));
    }
  }, []);

  const showNotification = useCallback((title, body) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === 'granted') {
        new window.Notification(title, { body, icon: '/logo.png' });
      }
    } catch (e) {
      console.warn('[NotificationHandler] Browser notification display failed:', e);
    }
  }, []);

  const handleNavigateToIncident = useCallback((incidentId) => {
    stopAllAlarms();
    if (incidentId) {
      window.location.href = `/incidents/${incidentId}`;
    }
  }, [stopAllAlarms]);

  useEffect(() => {
    if (!user) return;

    // Safely check Notification API permission on mount
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && window.Notification && window.Notification.permission === 'default') {
        window.Notification.requestPermission().catch(e => console.warn('Permission request error:', e));
      }
    } catch (e) {
      console.warn('Notification permission check failed:', e);
    }

    const socket = createAuthSocket({ transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // Listener for SOS Panic Alerts (Admins ALWAYS alerted; on-duty Responders alerted)
    const handleSosAlert = (data) => {
      const isAdmin = user.role === 'Admin';
      const isResponderOnDuty = user.role === 'Responder' && user.is_on_duty !== 0;

      if (isAdmin || isResponderOnDuty) {
        playSiren(data);
        showNotification(
          '🚨 CRITICAL SOS PANIC ALERT!',
          `SOS emergency from ${data.reporterName || 'Resident'} (${data.code || ''}) in ${data.barangay ? 'Brgy. ' + data.barangay : 'Jamindan'}. Immediate rescue required!`
        );
      }
    };

    socket.on('sos-panic-alert', handleSosAlert);

    // Listener for general new incidents
    socket.on('new-incident', (data) => {
      if (data && data.type === 'SOS Panic') {
        handleSosAlert(data);
        return;
      }

      const isAdmin = user.role === 'Admin';
      const isResponderOnDuty = user.role === 'Responder' && user.is_on_duty !== 0;

      if (isAdmin || isResponderOnDuty) {
        playSiren(data);
        showNotification(
          '🚨 URGENT: ' + (data?.type || 'Emergency Report'),
          'Incident ' + (data?.code || '') + ' reported by ' + (data?.reporterName || 'Resident') + ' in Jamindan.'
        );
      }
    });

    socket.on('responder-dispatched', (data) => {
      if (user.role === 'Responder' && user.is_on_duty !== 0 && String(data.responderId) === String(user.id)) {
        playSiren({
          type: 'Dispatch Alert',
          code: data.code,
          incidentId: data.incidentId,
          description: 'You have been dispatched to this emergency incident. Respond immediately.'
        });
        showNotification('🚨 Dispatch Alert', 'You have been assigned to Incident ' + data.code + '. Please respond immediately.');
      }
    });

    socket.on('agency-handoff', (data) => {
      if (user.role === 'Responder' && user.is_on_duty !== 0) {
        const userAgency = (user.agency_type || 'MDRRMO').toUpperCase();
        const target = (data.leadAgency || '').toUpperCase();
        const isMatch =
          userAgency === target ||
          (target === 'RHU' && userAgency === 'MEDICAL') ||
          (target === 'BFP' && userAgency === 'FIRE') ||
          (target === 'MDRRMO' && userAgency === 'RESCUE');
        if (isMatch && String(data.updatedById) !== String(user.id)) {
          playChime();
          showNotification(
            `📋 Inter-Agency Coordination (${data.leadAgency})`,
            `Incident ${data.code}: ${data.notes ? data.notes : 'Lead agency updated to ' + data.leadAgency}`
          );
        }
      }
    });

    socket.on('incident-status-updated', (data) => {
      if (user.role === 'Resident' && String(data.reporterId) === String(user.id) && data.status) {
        playChime();
        let message = 'Your incident ' + (data.code || '') + ' status was updated to ' + data.status + '.';
        if (data.status === 'Acknowledged') {
          message = 'Command Center has acknowledged your report ' + (data.code || '') + ' and is preparing dispatch.';
        } else if (data.status === 'Responding' || data.status === 'In Progress') {
          message = 'Help is on the way! Responders have been dispatched to your location for ' + (data.code || '') + '.';
        } else if (data.status === 'On Scene') {
          message = 'Responders have arrived on scene for ' + (data.code || '') + '.';
        } else if (data.status === 'Resolved') {
          message = 'Your incident ' + (data.code || '') + ' has been resolved.';
        }
        showNotification('Update on your Emergency', message);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      stopAllAlarms();
    };
  }, [user, playSiren, playChime, showNotification, stopAllAlarms]);

  if (!isRinging && !activeAlert) return null;

  const isSos = activeAlert?.type === 'SOS Panic';

  return (
    <>
      {/* High-Visibility Emergency Dispatch Modal for Command Center */}
      {activeAlert && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(220, 38, 38, 0.45)',
            border: isSos ? '4px solid #dc2626' : '3px solid #ea580c',
            animation: 'panic-modal-pulse 1.5s infinite alternate',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: isSos ? '#dc2626' : '#ea580c',
              padding: '20px 24px',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  color: isSos ? '#dc2626' : '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}>
                  🚨
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9 }}>
                    {isSos ? 'CRITICAL DISPATCH ALARM' : 'NEW INCIDENT DISPATCH'}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '900', lineHeight: '1.2' }}>
                    {isSos ? '🚨 SOS PANIC BUTTON TRIGGERED' : `EMERGENCY: ${activeAlert.type || 'New Report'}`}
                  </h3>
                </div>
              </div>
              <button
                onClick={stopAllAlarms}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff',
                  transition: 'background 0.2s'
                }}
                title="Silence and dismiss"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Autoplay blocked banner */}
              {audioBlocked && (
                <button
                  onClick={startWebAudioSiren}
                  style={{
                    backgroundColor: '#fef2f2',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: '#b91c1c',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                  }}
                >
                  <Volume2 size={18} className="animate-pulse" />
                  <span>🔊 BROWSER AUDIO MUTED — CLICK HERE TO PLAY SIREN</span>
                </button>
              )}

              {/* Incident Details Card */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>TICKET CODE</span>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a', fontFamily: 'monospace' }}>
                    {activeAlert.code || 'PENDING'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>REPORTER</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                    {activeAlert.reporterName || 'Resident (Jamindan)'}
                  </span>
                </div>

                {activeAlert.reporterPhone && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>PHONE</span>
                    <a
                      href={`tel:${activeAlert.reporterPhone}`}
                      style={{ fontSize: '14px', fontWeight: '800', color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Phone size={14} />
                      {activeAlert.reporterPhone}
                    </a>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b' }}>LOCATION</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'right', maxWidth: '280px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                    <MapPin size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                    {activeAlert.location_address || (activeAlert.barangay ? `Brgy. ${activeAlert.barangay}` : 'GPS Location Available')}
                  </span>
                </div>

                {activeAlert.location_lat && activeAlert.location_lng && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#059669', fontWeight: '700' }}>
                    <span>SATELLITE GPS:</span>
                    <span>{Number(activeAlert.location_lat).toFixed(5)}, {Number(activeAlert.location_lng).toFixed(5)}</span>
                  </div>
                )}
              </div>

              {/* Alert Message */}
              <div style={{
                backgroundColor: isSos ? '#fff1f2' : '#fff7ed',
                borderLeft: `4px solid ${isSos ? '#dc2626' : '#ea580c'}`,
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                color: isSos ? '#9f1239' : '#9a3412',
                lineHeight: '1.4'
              }}>
                {activeAlert.description || 'Immediate emergency rescue and responder dispatch is required.'}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <button
                  onClick={stopAllAlarms}
                  style={{
                    flex: '1 1 140px',
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1.5px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  <BellOff size={18} />
                  Silence Alarm
                </button>

                {activeAlert.incidentId && (
                  <button
                    onClick={() => handleNavigateToIncident(activeAlert.incidentId)}
                    style={{
                      flex: '2 1 200px',
                      padding: '14px',
                      borderRadius: '14px',
                      border: 'none',
                      backgroundColor: isSos ? '#dc2626' : '#ea580c',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 16px rgba(220, 38, 38, 0.4)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Eye size={18} />
                    View & Dispatch Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Pill for quick muting if modal is closed */}
      {isRinging && !activeAlert && (
        <div
          onClick={stopAllAlarms}
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 26px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            borderRadius: '50px',
            boxShadow: '0 8px 30px rgba(220, 38, 38, 0.6)',
            cursor: 'pointer',
            fontWeight: '900',
            fontSize: '14px',
            gap: '10px',
            animation: 'panic-pill-bounce 1s infinite'
          }}
        >
          <BellOff size={20} />
          STOP EMERGENCY ALARM
        </div>
      )}

      <style>{`
        @keyframes panic-modal-pulse {
          0% { box-shadow: 0 10px 40px rgba(220, 38, 38, 0.3); }
          100% { box-shadow: 0 25px 70px rgba(220, 38, 38, 0.6); }
        }
        @keyframes panic-pill-bounce {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
    </>
  );
};

export default NotificationHandler;