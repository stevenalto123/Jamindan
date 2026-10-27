import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.fullscreen';
import '../../node_modules/leaflet.fullscreen/dist/Control.FullScreen.css';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import { Navigation, AlertTriangle } from 'lucide-react';

const MapPicker = ({ lat, lng, onChange }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const JAMINDAN_LAT = 11.4090;
  const JAMINDAN_LNG = 122.5008;

  const isInsideJamindan = (checkLat, checkLng, accuracy = 0) => {
    const nLat = parseFloat(checkLat);
    const nLng = parseFloat(checkLng);
    if (isNaN(nLat) || isNaN(nLng)) return false;
    const R = 6371;
    const dLat = ((nLat - JAMINDAN_LAT) * Math.PI) / 180;
    const dLng = ((nLng - JAMINDAN_LNG) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((JAMINDAN_LAT * Math.PI) / 180) *
        Math.cos((nLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (distKm > 25 || (accuracy && accuracy > 3500)) return false;
    return true;
  };

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
      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        touchZoom: true,
        attributionControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: 'topright'
        }
      }).setView([startLat, startLng], 14);

      // Auto-detect real GPS location on mount (only apply if physically inside Jamindan)
      if (Capacitor.isNativePlatform()) {
        Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 }).then((coordinates) => {
          const gpsLat = coordinates.coords.latitude;
          const gpsLng = coordinates.coords.longitude;
          if (isInsideJamindan(gpsLat, gpsLng, coordinates.coords.accuracy)) {
            onChange(gpsLat, gpsLng);
            if (mapRef.current && markerRef.current) {
              mapRef.current.setView([gpsLat, gpsLng], 16);
              markerRef.current.setLatLng([gpsLat, gpsLng]);
            }
          }
        }).catch(err => console.warn("Auto GPS failed", err));
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const gpsLat = pos.coords.latitude;
          const gpsLng = pos.coords.longitude;
          if (isInsideJamindan(gpsLat, gpsLng, pos.coords.accuracy)) {
            onChange(gpsLat, gpsLng);
            if (mapRef.current && markerRef.current) {
              mapRef.current.setView([gpsLat, gpsLng], 16);
              markerRef.current.setLatLng([gpsLat, gpsLng]);
            }
          }
        }, (err) => {
          console.warn("Browser Auto GPS failed, staying at Jamindan default", err);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      }

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

  const handleGPSDetect = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Request permissions natively on Android/iOS
        const perm = await Geolocation.checkPermissions();
        if (perm.location !== 'granted') {
          const req = await Geolocation.requestPermissions();
          if (req.location !== 'granted') {
            alert("⚠️ GPS permission was denied. Please drag the pin manually or enable it in Settings.");
            return;
          }
        }
        const coordinates = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        const gpsLat = coordinates.coords.latitude;
        const gpsLng = coordinates.coords.longitude;
        onChange(gpsLat, gpsLng);
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([gpsLat, gpsLng], 16);
          markerRef.current.setLatLng([gpsLat, gpsLng]);
        }
      } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const gpsLat = pos.coords.latitude;
              const gpsLng = pos.coords.longitude;
              if (isInsideJamindan(gpsLat, gpsLng, pos.coords.accuracy)) {
                onChange(gpsLat, gpsLng);
                if (mapRef.current && markerRef.current) {
                  mapRef.current.setView([gpsLat, gpsLng], 16);
                  markerRef.current.setLatLng([gpsLat, gpsLng]);
                }
              } else {
                onChange(JAMINDAN_LAT, JAMINDAN_LNG);
                if (mapRef.current && markerRef.current) {
                  mapRef.current.setView([JAMINDAN_LAT, JAMINDAN_LNG], 16);
                  markerRef.current.setLatLng([JAMINDAN_LAT, JAMINDAN_LNG]);
                }
              }
            },
            (error) => {
              console.error("GPS detection error", error);
              onChange(JAMINDAN_LAT, JAMINDAN_LNG);
              if (mapRef.current && markerRef.current) {
                mapRef.current.setView([JAMINDAN_LAT, JAMINDAN_LNG], 16);
                markerRef.current.setLatLng([JAMINDAN_LAT, JAMINDAN_LNG]);
              }
            },
            { enableHighAccuracy: true, timeout: 10000 }
          );
        } else {
          alert("Geolocation is not supported by your browser.");
        }
      }
    } catch (err) {
      console.error("GPS Error:", err);
      alert("⚠️ Error accessing location services. Please check your device settings.");
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
        style={{ fontSize: '13px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        <Navigation size={16} /> Detect Current GPS Location
      </button>
    </div>
  );
};

export default MapPicker;
