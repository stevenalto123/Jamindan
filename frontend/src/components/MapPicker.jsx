import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.fullscreen';
import '../../node_modules/leaflet.fullscreen/dist/Control.FullScreen.css';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';

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
      mapRef.current = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        touchZoom: true,
        attributionControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: 'topright'
        }
      }).setView([startLat, startLng], 14);

      // Auto-detect real GPS location on mount
      if (Capacitor.isNativePlatform()) {
        Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 }).then((coordinates) => {
          const gpsLat = coordinates.coords.latitude;
          const gpsLng = coordinates.coords.longitude;
          onChange(gpsLat, gpsLng);
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([gpsLat, gpsLng], 16);
            markerRef.current.setLatLng([gpsLat, gpsLng]);
          }
        }).catch(err => console.warn("Auto GPS failed", err));
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const gpsLat = pos.coords.latitude;
          const gpsLng = pos.coords.longitude;
          onChange(gpsLat, gpsLng);
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([gpsLat, gpsLng], 16);
            markerRef.current.setLatLng([gpsLat, gpsLng]);
          }
        }, (err) => {
          console.warn("Browser Auto GPS failed, falling back to IP", err);
          axios.get('https://ipapi.co/json/')
            .then(res => {
              if (res.data && res.data.latitude && res.data.longitude) {
                onChange(res.data.latitude, res.data.longitude);
                if (mapRef.current && markerRef.current) {
                  mapRef.current.setView([res.data.latitude, res.data.longitude], 16);
                  markerRef.current.setLatLng([res.data.latitude, res.data.longitude]);
                }
              }
            })
            .catch(ipErr => console.warn("IP Fallback failed", ipErr));
        });
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
              onChange(gpsLat, gpsLng);
              if (mapRef.current && markerRef.current) {
                mapRef.current.setView([gpsLat, gpsLng], 16);
                markerRef.current.setLatLng([gpsLat, gpsLng]);
              }
            },
            (error) => {
              console.error("GPS detection error", error);
              // Fallback to IP
              axios.get('https://ipapi.co/json/')
                .then(res => {
                  if (res.data && res.data.latitude && res.data.longitude) {
                    onChange(res.data.latitude, res.data.longitude);
                    if (mapRef.current && markerRef.current) {
                      mapRef.current.setView([res.data.latitude, res.data.longitude], 16);
                      markerRef.current.setLatLng([res.data.latitude, res.data.longitude]);
                    }
                    alert("⚠️ Hardware GPS blocked. Used approximate Wi-Fi location. Please drag the pin if it's slightly off.");
                  } else {
                    throw new Error("Invalid ipapi response");
                  }
                })
                .catch(ipErr => {
                  console.warn("ipapi.co failed, trying ipinfo.io", ipErr);
                  axios.get('https://ipinfo.io/json')
                    .then(res2 => {
                      if (res2.data && res2.data.loc) {
                        const [lat, lng] = res2.data.loc.split(',').map(Number);
                        onChange(lat, lng);
                        if (mapRef.current && markerRef.current) {
                          mapRef.current.setView([lat, lng], 16);
                          markerRef.current.setLatLng([lat, lng]);
                        }
                        alert("⚠️ Hardware GPS blocked. Used approximate Wi-Fi location. Please drag the pin if it's slightly off.");
                      } else {
                        alert("Could not detect location. Please click or drag the pin on the map manually.");
                      }
                    })
                    .catch(ipErr2 => {
                      console.warn("All IP Geolocation failed", ipErr2);
                      alert("Could not detect location. Please click or drag the pin on the map manually.");
                    });
                });
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
        style={{ fontSize: '13px', padding: '8px' }}
      >
        🎯 Detect Current GPS Location
      </button>
    </div>
  );
};

export default MapPicker;
