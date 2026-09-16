import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bell, MapPin, X } from 'lucide-react';

const GeofenceModal = ({ onClose, onSend }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const circleRef = useRef(null);
  
  const [lat, setLat] = useState(11.4167); // Default to Jamindan
  const [lng, setLng] = useState(122.4000);
  const [radius, setRadius] = useState(500); // Default 500 meters
  const [title, setTitle] = useState('EMERGENCY EVACUATION');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([lat, lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      circleRef.current = L.circle([lat, lng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.3,
        weight: 2,
        radius: radius
      }).addTo(mapRef.current);

      mapRef.current.on('click', (e) => {
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
    }
  }, [lat, lng, radius]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    await onSend({ title, message, lat, lng, radius_meters: radius });
    setSending(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--card-bg)', borderRadius: '24px', width: '100%', maxWidth: '900px',
        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#fdf4ff', padding: '12px', borderRadius: '12px', color: '#c026d3' }}>
              <Bell size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '20px', fontWeight: '800' }}>Geofence Evacuation Alert</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-light)', fontWeight: '500' }}>
                Blast an alert only to users within a specific geographic radius.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)' }}
          >
            <X size={16} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Left: Map */}
          <div style={{ flex: '1 1 450px', minHeight: '350px', position: 'relative', borderRight: '1px solid var(--border-color)' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '350px' }}></div>
            
            {/* Radius Control Overlay */}
            <div style={{ position: 'absolute', bottom: '16px', left: '16px', zIndex: 1000, backgroundColor: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', minWidth: '200px' }}>
              <label style={{ fontSize: '13px', fontWeight: '800', display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-main)' }}>
                <span>Target Radius:</span>
                <span style={{ color: 'var(--primary-color)' }}>{radius}m</span>
              </label>
              <input type="range" min="100" max="5000" step="100" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--primary-color)' }} />
            </div>
            
            <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.95)', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', color: '#c026d3', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} /> Click map to move center
            </div>
          </div>
          
          {/* Right: Form */}
          <div style={{ flex: '1 1 350px', padding: '24px', background: '#f8fafc' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              
              <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '12px', border: '1px solid #fed7aa', fontSize: '13px', color: '#9a3412', display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>Critical Action</strong>
                  This will trigger a loud emergency siren on the phones of all users physically located within the red circle.
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Alert Title</label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #fca5a5', background: '#fef2f2', fontSize: '15px', fontWeight: '800', color: '#dc2626' }} 
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>Evacuation Instructions</label>
                <textarea 
                  required 
                  rows="5" 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  placeholder="Type detailed evacuation instructions here..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white', fontSize: '15px', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button type="button" style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'white', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }} onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: '12px', background: '#c026d3', border: 'none', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={sending}>
                  {sending ? (
                    <><div style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div> BLASTING...</>
                  ) : (
                    <>BLAST ALERT</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeofenceModal;
