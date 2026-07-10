import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

const MapPicker = ({ lat, lng, onChange }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const startLat = lat || 11.4287; // Jamindan, Capiz Center
    const startLng = lng || 122.4842;

    // Define custom theme icon to prevent Vite path breakage and match branding
    const customIcon = L.divIcon({
      html: `
        <div style="
          background-color: #0f4c2c; 
          width: 16px; 
          height: 16px; 
          border: 3px solid #ffffff; 
          border-radius: 50%; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.4);
          transform: translate(-3px, -3px);
        "></div>
      `,
      className: 'custom-map-marker',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    if (!mapRef.current) {
      // Initialize map
      mapRef.current = L.map(mapContainerRef.current).setView([startLat, startLng], 14);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add draggable marker
      markerRef.current = L.marker([startLat, startLng], {
        icon: customIcon,
        draggable: true
      }).addTo(mapRef.current);

      // Listen to drag events
      markerRef.current.on('dragend', () => {
        const position = markerRef.current.getLatLng();
        onChange(position.lat, position.lng);
      });

      // Listen to map clicks
      mapRef.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        onChange(lat, lng);
      });
    } else {
      // Update marker and map view if props change externally
      mapRef.current.setView([startLat, startLng]);
      markerRef.current.setLatLng([startLat, startLng]);
    }
  }, [lat, lng, onChange]);

  const handleGPSDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const gpsLat = pos.coords.latitude;
          const gpsLng = pos.coords.longitude;
          onChange(gpsLat, gpsLng);
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([gpsLat, gpsLng], 16);
            markerRef.current.setLatLng([gpsLat, gpsLng]);
          }
        },
        (error) => {
          console.error("GPS detection error", error);
          alert("Could not detect location. Please click on the map to pin manually.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div 
        ref={mapContainerRef} 
        style={{ height: '300px', width: '100%', borderRadius: '10px', border: '1px solid var(--border-color)', zIndex: 1 }} 
      />
      <button 
        type="button" 
        className="btn btn-secondary btn-full" 
        onClick={handleGPSDetect}
        style={{ fontSize: '13px', padding: '8px' }}
      >
        🎯 Detect Current GPS Location
      </button>
    </div>
  );
};

export default MapPicker;
