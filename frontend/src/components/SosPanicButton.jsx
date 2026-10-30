import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, AlertTriangle, WifiOff, RefreshCw, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { Haptics } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';
import { useSystem } from '../context/SystemContext';
import { saveOfflineSos, getOfflineSos, clearOfflineSos, syncOfflineQueue } from '../utils/offlineQueue';

const SosPanicButton = () => {
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [queuedSos, setQueuedSos] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const progressIntervalRef = useRef(null);
  const navigate = useNavigate();
  const { settings } = useSystem();

  const isHoldingRef = useRef(false);

  // Helper to trigger haptic vibration
  const triggerVibrate = async (pattern) => {
    try {
      if (window.Capacitor) {
        const duration = Array.isArray(pattern) ? pattern[0] : pattern;
        await Haptics.vibrate({ duration: duration || 200 });
      } else if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn('Vibration API blocked or unsupported:', e);
    }
  };

  useEffect(() => {
    // Check if an offline SOS was already queued in storage
    const pending = getOfflineSos();
    if (pending) {
      setQueuedSos(pending);
    }

    // Auto-sync the moment device catches signal/reconnects
    const handleOnline = async () => {
      const active = getOfflineSos();
      if (!active) return;
      setSyncing(true);
      try {
        const res = await syncOfflineQueue();
        if (res && res.synced) {
          setQueuedSos(null);
          await triggerVibrate([1000, 100, 1000]);
          if (res.incidentId) {
            navigate(`/incidents/${res.incidentId}`);
          }
        }
      } catch (err) {
        console.error('Auto sync error:', err);
      } finally {
        setSyncing(false);
      }
    };

    window.addEventListener('online', handleOnline);

    // If already online and has unsynced offline SOS, trigger sync immediately
    if (navigator.onLine && pending) {
      handleOnline();
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      window.removeEventListener('online', handleOnline);
    };
  }, [navigate]);

  const handleManualSync = async () => {
    if (!navigator.onLine) {
      alert('Your phone is currently offline (no signal or data connection). Please reconnect or use the Direct Emergency SMS option.');
      return;
    }
    setSyncing(true);
    try {
      const res = await syncOfflineQueue();
      if (res && res.synced) {
        setQueuedSos(null);
        await triggerVibrate([1000, 100, 1000]);
        if (res.incidentId) {
          navigate(`/incidents/${res.incidentId}`);
        }
      } else {
        alert('Could not sync at this moment. Please try the Direct Emergency SMS button.');
      }
    } catch (err) {
      alert('Sync error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelQueuedSos = () => {
    if (window.confirm('Cancel and clear this queued offline emergency alert? Responders will not be notified.')) {
      clearOfflineSos();
      setQueuedSos(null);
    }
  };

  const startHold = async (e) => {
    if (e.cancelable) e.preventDefault();
    if (loading || isHoldingRef.current) return;

    isHoldingRef.current = true;
    setIsHolding(true);
    setHoldProgress(0);
    triggerVibrate(80); // Fire and forget so we don't await and block

    const holdDuration = 3000;
    const stepMs = 50; 
    let elapsed = 0;

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      elapsed += stepMs;
      const progress = Math.min((elapsed / holdDuration) * 100, 100);
      setHoldProgress(progress);

      if (elapsed % 1000 === 0 && progress < 100) {
        triggerVibrate(60);
      }

      if (elapsed >= holdDuration) {
        clearInterval(progressIntervalRef.current);
        if (isHoldingRef.current) {
          triggerSosDispatch();
        }
      }
    }, stepMs);
  };

  const endHold = async () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    if (!isHoldingRef.current || loading) return;

    isHoldingRef.current = false;
    setIsHolding(false);

    // Give state time to sync, then clear progress if it was abandoned
    setTimeout(() => {
      setHoldProgress(prev => {
        if (prev < 100) {
          triggerVibrate([40, 40]);
          return 0;
        }
        return prev;
      });
    }, 10);
  };

  const triggerSosDispatch = async () => {
    setLoading(true);
    await triggerVibrate(1000); 

    try {
      const fallbackToIP = () => {
        if (!navigator.onLine) {
          // If offline, do not stall on remote IP geocoding
          sendSosRequest(null, null);
          return;
        }
        axios.get('https://ipinfo.io/json')
          .then(res => {
            if (res.data && res.data.loc) {
              const [lat, lng] = res.data.loc.split(',').map(Number);
              sendSosRequest(lat, lng);
            } else {
              sendSosRequest(null, null);
            }
          })
          .catch(() => sendSosRequest(null, null));
      };

      // Direct Satellite GPS lock works 100% offline without cellular data
      if (window.Capacitor) {
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 5000
        });
        sendSosRequest(position.coords.latitude, position.coords.longitude);
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => sendSosRequest(position.coords.latitude, position.coords.longitude),
          (err) => fallbackToIP(),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        fallbackToIP();
      }
    } catch (err) {
      // Fallback in case Capacitor or Geolocation hardware times out
      if (!navigator.onLine) {
        sendSosRequest(null, null);
      } else {
        axios.get('https://ipinfo.io/json')
          .then(res => {
            if (res.data && res.data.loc) {
              const [lat, lng] = res.data.loc.split(',').map(Number);
              sendSosRequest(lat, lng);
            } else {
              sendSosRequest(null, null);
            }
          })
          .catch(() => sendSosRequest(null, null));
      }
    }
  };

  const triggerSmsFallback = (lat, lng) => {
    const hotline = settings?.emergency_hotline || '09485224345';
    let message = 'SOS EMERGENCY! I need help immediately.';
    const actualLat = lat ?? queuedSos?.location_lat;
    const actualLng = lng ?? queuedSos?.location_lng;
    if (actualLat && actualLng) {
      message += ` My GPS Location: https://maps.google.com/?q=${actualLat},${actualLng}`;
    }
    
    // Check OS for proper SMS URI formatting
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const separator = isIOS ? '&' : '?';
    
    const uri = `sms:${hotline}${separator}body=${encodeURIComponent(message)}`;
    window.location.href = uri;
  };

  const sendSosRequest = async (lat, lng) => {
    // 1. Offline Mode: Save to local deduplicated emergency queue
    if (!navigator.onLine) {
      const saved = saveOfflineSos({ lat, lng });
      setQueuedSos(saved);
      await triggerVibrate([400, 150, 400]);
      setHoldProgress(0);
      setIsHolding(false);
      setLoading(false);
      return;
    }

    // 2. Online Mode: Submit to cloud API
    try {
      const payload = {
        type: 'SOS Panic',
        description: '[SOS PANIC ALARM] Instantly triggered by resident via 3-second press. Immediate rescue and responder dispatch is required.',
        location_lat: lat,
        location_lng: lng
      };

      const res = await axios.post('/api/incidents', payload);
      await triggerVibrate([1000, 100, 1000]); 
      
      clearOfflineSos();
      setQueuedSos(null);
      setHoldProgress(0);
      setIsHolding(false);
      setLoading(false);
      navigate(`/incidents/${res.data.incidentId}`);
    } catch (err) {
      console.error('SOS Panic error:', err);
      // If network fails during transmission, safeguard in local queue
      if (!err.response || err.code === 'ECONNABORTED' || err.message === 'Network Error' || !navigator.onLine) {
        const saved = saveOfflineSos({ lat, lng });
        setQueuedSos(saved);
        await triggerVibrate([400, 150, 400]);
        setHoldProgress(0);
        setIsHolding(false);
        setLoading(false);
      } else {
        alert(err.response?.data?.message || 'Failed to send SOS Panic. Please call emergency hotline directly!');
        setHoldProgress(0);
        setIsHolding(false);
        setLoading(false);
      }
    }
  };

  // Determine label/instruction based on hold state
  const getButtonText = () => {
    if (loading) return 'SOS...';
    if (holdProgress >= 100) return 'SENT!';
    if (isHolding) {
      const remainingSec = Math.max(0, Math.ceil((100 - holdProgress) / 33.3));
      return `${remainingSec}s`;
    }
    return 'SOS';
  };

  return (
    <div className="card" style={{
      background: isHolding ? 'linear-gradient(135deg, #78281f 0%, #1c2833 100%)' : 'linear-gradient(135deg, rgba(231, 76, 60, 0.1) 0%, rgba(44, 62, 80, 0.05) 100%)',
      borderColor: isHolding ? '#c0392b' : 'rgba(231, 76, 60, 0.3)',
      color: isHolding ? '#ffffff' : 'var(--text-main)',
      transition: 'all 0.4s ease',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: isHolding ? '0 10px 30px rgba(192, 57, 43, 0.4)' : 'var(--shadow-sm)',
      textAlign: 'center'
    }}>
      {/* Offline Incident Queue Alert Banner */}
      {queuedSos && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffeeba',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'left',
          color: '#856404',
          boxShadow: '0 4px 15px rgba(243, 156, 18, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px', color: '#b7791f' }}>
              <WifiOff size={20} className="pulse-offline-icon" />
              <span>SOS QUEUED OFFLINE (NO SIGNAL)</span>
            </div>
            <button 
              onClick={handleCancelQueuedSos}
              title="Cancel offline SOS"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#856404', padding: '4px' }}
            >
              <X size={18} />
            </button>
          </div>

          <p style={{ fontSize: '13px', margin: '0 0 10px 0', lineHeight: '1.5', color: '#744210' }}>
            No internet connection. Your SOS emergency alert is <strong>securely saved on this device</strong>. 
            The moment your device reconnects to mobile data or Wi-Fi, it will <strong>automatically transmit</strong> to MDRRMO Jamindan.
          </p>

          <div style={{
            fontSize: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div>
              <strong>Satellite GPS: </strong>
              {queuedSos.location_lat && queuedSos.location_lng ? (
                <span style={{ color: '#27ae60', fontWeight: '700' }}>
                  {queuedSos.location_lat.toFixed(5)}, {queuedSos.location_lng.toFixed(5)} (Satellite locked)
                </span>
              ) : (
                <span style={{ color: '#e67e22' }}>GPS coordinates not locked</span>
              )}
            </div>
            <div>
              <strong>Confirmations / Taps: </strong>
              <span>{queuedSos.tapCount || 1} tap(s) recorded (Anti-spam merged into 1 ticket)</span>
            </div>
            <div>
              <strong>Queued At: </strong>
              <span>{new Date(queuedSos.queuedAt || queuedSos.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Dual Action: Emergency SMS Fallback + Manual Sync Retry */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => triggerSmsFallback(queuedSos.location_lat, queuedSos.location_lng)}
              style={{
                flex: '1 1 180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(39, 174, 96, 0.3)'
              }}
            >
              <MessageSquare size={16} />
              Send Direct SMS Now
            </button>

            <button
              onClick={handleManualSync}
              disabled={syncing}
              style={{
                flex: '1 1 140px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.7 : 1
              }}
            >
              <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Connecting...' : 'Retry Transmit'}
            </button>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0392b', fontWeight: '800', textTransform: 'uppercase', fontSize: '14px' }}>
          <ShieldAlert size={18} />
          {isHolding ? 'HOLDING FOR EMERGENCY SOS' : 'Instant Emergency SOS'}
        </div>

        <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-light)', maxWidth: '500px' }}>
          {isHolding 
            ? 'KEEP PRESSING! Releasing will cancel the emergency alarm.'
            : 'Press and hold the button below for 3 seconds continuously to alert rescuers.'
          }
        </p>

        {/* SOS Long Press Button */}
        <div 
          style={{
            position: 'relative',
            width: '130px',
            height: '130px',
            marginTop: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          onTouchCancel={endHold}
        >
          {/* Progress Circle Outer */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '130px', height: '130px', transform: 'rotate(-90deg)', zIndex: 1 }}>
            <circle
              cx="65"
              cy="65"
              r="58"
              stroke="rgba(231, 76, 60, 0.15)"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="65"
              cy="65"
              r="58"
              stroke="#e74c3c"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 58}`}
              strokeDashoffset={`${2 * Math.PI * 58 * (1 - holdProgress / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>

          {/* Glowing Pulse Ring (only when holding) */}
          {isHolding && (
            <div style={{
              position: 'absolute',
              width: '108px',
              height: '108px',
              borderRadius: '50%',
              backgroundColor: 'rgba(192, 57, 43, 0.25)',
              animation: 'sos-holding-pulse 1.2s infinite',
              zIndex: 2
            }} />
          )}

          {/* Actual Pressable Circle */}
          <div 
            style={{
              width: '108px',
              height: '108px',
              borderRadius: '50%',
              backgroundColor: '#e74c3c',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: isHolding ? '24px' : '20px',
              border: '3px solid #ffffff',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
              animation: !isHolding ? 'sos-idle-pulse 2s infinite' : 'none',
              cursor: 'pointer',
              zIndex: 5,
              transition: 'all 0.1s ease',
              transform: isHolding ? 'scale(0.95)' : 'scale(1)'
            }}
          >
            {getButtonText()}
          </div>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isHolding ? `${Math.round(holdProgress)}% charged` : 'Touch & hold 3s'}
        </span>
      </div>



      <style>{`
        @keyframes sos-holding-pulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes sos-idle-pulse { 
          0% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7); } 
          70% { box-shadow: 0 0 0 15px rgba(231, 76, 60, 0); } 
          100% { box-shadow: 0 0 0 0 rgba(231, 76, 60, 0); } 
        }
        .pulse-offline-icon {
          animation: pulse-offline 1.5s infinite;
        }
        @keyframes pulse-offline {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.15); }
        }
        .animate-spin {
          animation: spin-icon 1s linear infinite;
        }
        @keyframes spin-icon {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SosPanicButton;
