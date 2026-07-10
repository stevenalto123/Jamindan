import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const MapDisplay = ({ lat, lng }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng) return;

    const customIcon = L.divIcon({
      html: `
        <div style="
          background-color: #e74c3c; 
          width: 16px; 
          height: 16px; 
          border: 3px solid #ffffff; 
          border-radius: 50%; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.4);
          transform: translate(-3px, -3px);
        "></div>
      `,
      className: 'custom-map-display-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: true,
        dragging: true,
        scrollWheelZoom: false
      }).setView([lat, lng], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
    } else {
      mapRef.current.setView([lat, lng]);
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  if (!lat || !lng) {
    return <div className="notif-empty" style={{ backgroundColor: '#fafbfc', borderRadius: '10px' }}>No GPS Coordinates available for this report.</div>;
  }

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '300px', width: '100%', borderRadius: '10px', border: '1px solid var(--border-color)', zIndex: 1 }} 
    />
  );
};

export default MapDisplay;
