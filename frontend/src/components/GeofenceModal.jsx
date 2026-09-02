import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5,
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
      backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '800px',
        maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, color: '#c0392b' }}>Geofence Evacuation Alert</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {/* Left: Map */}
          <div style={{ flex: '1 1 400px', minHeight: '300px', position: 'relative' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '300px' }}></div>
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000, backgroundColor: 'white', padding: '10px', borderRadius: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Radius (Meters): {radius}m</label>
              <input type="range" min="100" max="5000" step="100" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
            </div>
            <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000, backgroundColor: 'rgba(255,255,255,0.9)', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: '#c0392b' }}>
              Click map to move center
            </div>
          </div>
          
          {/* Right: Form */}
          <div style={{ flex: '1 1 300px', padding: '20px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ backgroundColor: '#fef9e7', padding: '10px', borderRadius: '6px', border: '1px solid #f1c40f', fontSize: '13px', color: '#b9770e' }}>
                <strong>Warning:</strong> This will send a critical push notification ONLY to users physically located within the red circle.
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Alert Title</label>
                <input type="text" className="form-input" required value={title} onChange={(e) => setTitle(e.target.value)} style={{ borderColor: '#c0392b', fontWeight: 'bold', color: '#c0392b' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold' }}>Evacuation Message</label>
                <textarea className="form-input" required rows="4" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type detailed evacuation instructions here..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, backgroundColor: '#c0392b' }} disabled={sending}>
                  {sending ? 'BROADCASTING...' : 'BLAST EVACUATION ALERT'}
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
