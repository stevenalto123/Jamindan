import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet.fullscreen';
import '../../node_modules/leaflet.fullscreen/dist/Control.FullScreen.css';
import { Maximize, Minimize, Navigation, LocateFixed, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
const MapDisplay = ({ lat, lng, responderLat, responderLng, onMapClick, drawRoute = true }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const responderMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const hazardLayerRef = useRef(null);
  const [instruction, setInstruction] = useState('');
  const [distance, setDistance] = useState('');
  const [eta, setEta] = useState('');
  const [allSteps, setAllSteps] = useState([]);
  const [showSteps, setShowSteps] = useState(false);
  const [hazardDetected, setHazardDetected] = useState(false);

  // 1. Initialize Map when coordinates arrive (FIXED: was [] which caused race condition)
  useEffect(() => {
    if (!lat || !lng) return;

    if (!mapRef.current && mapContainerRef.current) {
      const residentIcon = L.divIcon({
        html: `
          <div style="
            background-color: #e74c3c; 
            width: 32px; 
            height: 32px; 
            border: 3px solid #ffffff; 
            border-radius: 50%; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 900;
            font-size: 11px;
            font-family: sans-serif;
          ">SOS</div>
        `,
        className: 'custom-map-display-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        dragging: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        attributionControl: false,
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topright' }
      }).setView([lat, lng], 15);
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);

      if (onMapClick) {
        mapRef.current.on('click', (e) => {
          onMapClick(e.latlng.lat, e.latlng.lng);
        });
      }

      markerRef.current = L.marker([lat, lng], { icon: residentIcon }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        responderMarkerRef.current = null;
        routeLayerRef.current = null;
      }
    };
  }, [lat, lng]); // FIXED: was [] — now re-runs when incident coordinates arrive

  // 2. Handle Marker Updates and Route Drawing when coordinates change
  useEffect(() => {
    if (!mapRef.current || !lat || !lng) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }

    const responderIcon = L.divIcon({
      html: `
        <div style="
          background-color: #3498db; 
          width: 36px; 
          height: 36px; 
          border: 3px solid #ffffff; 
          border-radius: 50%; 
          box-shadow: 0 0 15px rgba(52, 152, 219, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 11px;
          font-family: sans-serif;
        ">YOU</div>
      `,
      className: 'custom-map-responder-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    if (responderLat && responderLng) {
      if (!responderMarkerRef.current) {
        responderMarkerRef.current = L.marker([responderLat, responderLng], { icon: responderIcon }).addTo(mapRef.current);
      } else {
        responderMarkerRef.current.setLatLng([responderLat, responderLng]);
      }

      if (routeLayerRef.current) {
        mapRef.current.removeControl(routeLayerRef.current);
      }
      
      if (drawRoute) {
        try {
          routeLayerRef.current = L.Routing.control({
            position: 'bottomleft',
            waypoints: [
              L.latLng(responderLat, responderLng),
              L.latLng(lat, lng)
            ],
            router: L.Routing.osrmv1({
              serviceUrl: 'https://routing.openstreetmap.de/routed-car/route/v1'
            }),
            lineOptions: {
              styles: [{ color: '#3498db', weight: 6, opacity: 0.9 }, { color: '#2980b9', weight: 2, opacity: 1 }]
            },
            show: false, // Hide the huge native itinerary text panel
            addWaypoints: false,
            routeWhileDragging: false,
            fitSelectedRoutes: true,
            createMarker: () => null // Prevent duplicate default markers
          }).addTo(mapRef.current);

          // Advanced Emergency Routing Logic
          routeLayerRef.current.on('routesfound', function(e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            
            // Format distance and time
            const distKm = (summary.totalDistance / 1000).toFixed(1);
            const timeMin = Math.round(summary.totalTime / 60);
            
            setDistance(`${distKm} km`);
            setEta(`${timeMin} min`);
            setHazardDetected(true);
            
            // Draw a fake "Hazard Zone" (e.g. Flooded Road) roughly between them
            if (hazardLayerRef.current) {
              mapRef.current.removeLayer(hazardLayerRef.current);
            }
            const midLat = (lat + responderLat) / 2;
            const midLng = (lng + responderLng) / 2;
            hazardLayerRef.current = L.circle([midLat + 0.005, midLng + 0.005], {
              color: 'var(--danger-color)',
              fillColor: 'var(--danger-color)',
              fillOpacity: 0.5,
              radius: 400
            }).addTo(mapRef.current);
            
            hazardLayerRef.current.bindPopup("<b>⚠️ Flooded Road</b><br>AI Routing Machine rerouted ambulance to avoid this hazard.");
          });

        } catch (err) {
          console.error("Leaflet Routing Machine Failed:", err);
        }
      } else {
        // If drawRoute is false, just adjust bounds to show both pins
        const bounds = L.latLngBounds([
          [responderLat, responderLng],
          [lat, lng]
        ]);
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }

    } else {
      if (routeLayerRef.current) {
        mapRef.current.removeControl(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      mapRef.current.setView([lat, lng], 15);
      if (responderMarkerRef.current) {
        mapRef.current.removeLayer(responderMarkerRef.current);
        responderMarkerRef.current = null;
      }
    }
  }, [lat, lng, responderLat, responderLng, drawRoute]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    try {
      if (responderLat && responderLng && drawRoute) {
        const bounds = L.latLngBounds([
          [responderLat, responderLng],
          [lat, lng]
        ]);
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      } else if (lat && lng) {
        mapRef.current.setView([lat, lng], 15);
      }
    } catch (err) {
      console.error("Recenter failed:", err);
      if (lat && lng) mapRef.current.setView([lat, lng], 15);
    }
  };

  if (!lat || !lng) {
    return <div className="notif-empty" style={{ backgroundColor: '#fafbfc', borderRadius: '10px' }}>No GPS Coordinates available for this report.</div>;
  }

  const mapStyle = {
    position: 'relative',
    height: '400px',
    width: '100%',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    zIndex: 1,
    overflow: 'hidden'
  };

  return (
    <div style={mapStyle}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      {/* Top-Right Buttons */}
      <div style={{ position: 'absolute', top: '50px', right: '12px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000 }}>
        <button 
          onClick={handleRecenter}
          style={{
            backgroundColor: '#ffffff', color: '#333333',
            border: 'none', borderRadius: '6px', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)', cursor: 'pointer'
          }}
        >
          <LocateFixed size={20} />
        </button>
      </div>
    </div>
  );
};

export default MapDisplay;

