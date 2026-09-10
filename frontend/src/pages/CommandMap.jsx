import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet.fullscreen';
import '../../node_modules/leaflet.fullscreen/dist/Control.FullScreen.css';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertCircle, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const CommandMap = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const incidentLayerRef = useRef(null);
  const responderLayerRef = useRef(null);
  
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Standard colorful map tiles
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const fetchData = async () => {
    try {
      // Fetch Active Incidents
      const incRes = await axios.get('/api/incidents', {
        params: { status: 'Pending,Acknowledged,Responding,On Scene', limit: 100 }
      });
      setIncidents(Array.isArray(incRes.data) ? incRes.data : []);

      // Fetch On-Duty Responders
      const resRes = await axios.get('/api/users', {
        params: { role: 'Responder', is_on_duty: 1, limit: 100 }
      });
      // Filter out responders without coordinates
      const validResponders = (resRes.data.users || []).filter(r => r.current_lat && r.current_lng);
      setResponders(validResponders);
      
      setLastRefreshed(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch command map data:', err);
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Default center: Jamindan, Capiz
      mapRef.current = L.map(mapContainerRef.current, {
        center: [11.3969, 122.3995],
        zoom: 13,
        fullscreenControl: true
      });

      L.tileLayer(tileUrl, { attribution }).addTo(mapRef.current);
      
      incidentLayerRef.current = L.layerGroup().addTo(mapRef.current);
      responderLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    
    fetchData();
    const interval = setInterval(fetchData, 5000); // Live poll every 5 seconds
    
    return () => {
      clearInterval(interval);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers when data changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    if (incidentLayerRef.current) incidentLayerRef.current.clearLayers();
    if (responderLayerRef.current) responderLayerRef.current.clearLayers();

    // Plot Incidents
    incidents.forEach(inc => {
      if (inc.location_lat && inc.location_lng) {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: var(--danger-color); width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px var(--danger-color); animation: pulse 1.5s infinite;"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        const marker = L.marker([inc.location_lat, inc.location_lng], { icon: customIcon });
        marker.bindPopup(`
          <div style="text-align: center; font-family: sans-serif;">
            <b style="color: var(--danger-color); font-size: 16px;">${inc.type}</b><br/>
            <span style="font-size: 12px; color: #666;">Code: ${inc.code}</span><br/>
            <b style="font-size: 14px; color: var(--text-main);">${inc.status}</b><br/>
            <p style="margin: 8px 0; font-size: 13px;">${inc.location_address || 'GPS Location'}</p>
            <a href="/incidents/${inc.id}" style="display: block; background: var(--primary-color); color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 8px;">View Dispatch</a>
          </div>
        `);
        incidentLayerRef.current.addLayer(marker);
      }
    });

    // Plot Responders
    responders.forEach(resp => {
      const isPolice = resp.agency_type === 'Police';
      const isFire = resp.agency_type === 'Fire';
      const isMed = resp.agency_type === 'Medical';
      
      let color = '#3498db'; // Default Blue
      if (isFire) color = '#e67e22'; // Orange
      if (isMed) color = '#2ecc71'; // Green
      
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px ${color}; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 10px;">${resp.agency_type ? resp.agency_type.charAt(0) : 'R'}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([resp.current_lat, resp.current_lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="text-align: center; font-family: sans-serif;">
          <b style="color: ${color}; font-size: 14px;">${resp.agency_type || 'Responder'}</b><br/>
          <span style="font-weight: bold; font-size: 15px;">${resp.full_name}</span><br/>
          <span style="font-size: 12px; color: #666;">${resp.phone}</span><br/>
        </div>
      `);
      responderLayerRef.current.addLayer(marker);
    });
  }, [incidents, responders]);

  const panToIncident = (lat, lng) => {
    if (mapRef.current && lat && lng) {
      mapRef.current.setView([lat, lng], 17, { animate: true, duration: 1 });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#111' }}>
      
      {/* Header */}
      <div style={{ 
        height: '60px', 
        backgroundColor: '#1a1a1a', 
        borderBottom: '1px solid #333',
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 20px',
        justifyContent: 'space-between',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => navigate('/admin')}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="#3498db" />
            <h1 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: 'bold' }}>COMMAND CENTER LIVE MAP</h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#aaa', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            Live Sync: {lastRefreshed.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="command-map-wrapper" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar */}
        <div className="command-map-sidebar" style={{ 
          width: '350px', 
          backgroundColor: '#1a1a1a', 
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 900
        }}>
          <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="var(--danger-color)" />
              Active Emergencies ({incidents.length})
            </h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {incidents.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '30px 0', fontSize: '14px' }}>
                All clear. No active emergencies.
              </div>
            ) : (
              incidents.map(inc => (
                <div 
                  key={inc.id}
                  onClick={() => panToIncident(inc.location_lat, inc.location_lng)}
                  style={{
                    backgroundColor: '#252525',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '10px',
                    cursor: 'pointer',
                    borderLeft: '4px solid var(--danger-color)',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#252525'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--danger-color)', fontWeight: 'bold', fontSize: '14px' }}>{inc.type}</span>
                    <span style={{ color: '#aaa', fontSize: '12px' }}>{inc.code}</span>
                  </div>
                  <div style={{ color: '#ddd', fontSize: '13px', marginBottom: '6px' }}>{inc.location_address || 'Coordinates Only'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#3498db', fontSize: '12px', fontWeight: 'bold' }}>{inc.status}</span>
                    <span style={{ color: '#666', fontSize: '11px' }}>{new Date(inc.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ padding: '15px', borderTop: '1px solid #333' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} color="var(--primary-color)" />
              Available Responders ({responders.length})
            </h3>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#aaa' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3498db' }}></div> PNP</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#aaa' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e67e22' }}></div> BFP</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#aaa' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2ecc71' }}></div> MED</div>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
        </div>
      </div>
    </div>
  );
};

export default CommandMap;
