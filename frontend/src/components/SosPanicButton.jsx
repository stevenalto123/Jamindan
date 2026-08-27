import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Haptics } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';

const SosPanicButton = () => {
  const [holdProgress, setHoldProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [loading, setLoading] = useState(false);
  const progressIntervalRef = useRef(null);
  const navigate = useNavigate();

  // Helper to trigger haptic vibration
  const triggerVibrate = async (pattern) => {
    try {
      if (window.Capacitor) {
        // Native phone haptics
        // If it is a pattern array, take the first duration, else use raw number
        const duration = Array.isArray(pattern) ? pattern[0] : pattern;
        await Haptics.vibrate({ duration: duration || 200 });
      } else if (navigator.vibrate) {
        // Browser fallback (Android Chrome only)
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn('Vibration API blocked or unsupported:', e);
    }
  };

  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const startHold = async (e) => {
    e.preventDefault();
    if (loading || isHolding) return;

    setIsHolding(true);
    setHoldProgress(0);
    await triggerVibrate(80); // Initial click vibration

    const holdDuration = 1000; // 1 second fast activation
    const stepMs = 50; 
    let elapsed = 0;

    progressIntervalRef.current = setInterval(async () => {
      elapsed += stepMs;
      const progress = Math.min((elapsed / holdDuration) * 100, 100);
      setHoldProgress(progress);

      // Light haptic heartbeat pulse every 1 second
      if (elapsed % 1000 === 0 && progress < 100) {
        await triggerVibrate(60);
      }

      if (elapsed >= holdDuration) {
        clearInterval(progressIntervalRef.current);
        triggerSosDispatch();
      }
    }, stepMs);
  };

  const endHold = async () => {
    if (!isHolding || loading) return;

    setIsHolding(false);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    if (holdProgress < 100) {
      // User let go early - cancel trigger
      setHoldProgress(0);
      await triggerVibrate([40, 40]); // Double pulse cancel warning
    }
  };

  const triggerSosDispatch = async () => {
    setLoading(true);
    await triggerVibrate(1000); 

    try {
      const fallbackToIP = () => {
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
      // Fallback in case Capacitor or Geolocation entirely crashes
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
  };

  const sendSosRequest = async (lat, lng) => {
    try {
      const payload = {
        type: 'SOS Panic',
        description: '[SOS PANIC ALARM] Instantly triggered by resident via 1-second press. Immediate rescue and responder dispatch is required.',
        location_lat: lat,
        location_lng: lng
      };

      const res = await axios.post('/api/incidents', payload);
      await triggerVibrate([1000, 100, 1000]); 
      
      setHoldProgress(0);
      setIsHolding(false);
      setLoading(false);
      navigate(`/incidents/${res.data.incidentId}`);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to send SOS Panic. Please call emergency hotline directly!');
      setHoldProgress(0);
      setIsHolding(false);
      setLoading(false);
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
      `}</style>
    </div>
  );
};

export default SosPanicButton;
