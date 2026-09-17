import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import { ShieldAlert, AlertCircle, ArrowLeft, RefreshCw, Layers, Maximize, Minimize, Map as MapIcon, Globe, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const CommandMap = ({ isWidget = false }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const containerRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const incidentLayerRef = useRef(null);
  const responderLayerRef = useRef(null);
  
  const [incidents, setIncidents] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapStyle, setMapStyle] = useState('street');
  const [showStyleMenu, setShowStyleMenu] = useState(false);
  const tileLayerRef = useRef(null);

  const mapStyles = {
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      icon: Sun,
      label: 'Street (Light)'
    },
    tactical: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      icon: Moon,
      label: 'Tactical (Dark)'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri',
      icon: Globe,
      label: 'Satellite'
    },
    topo: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OSM, SRTM | Style: &copy; OpenTopoMap',
      icon: MapIcon,
      label: 'Topographic'
    }
  };


  const fetchData = async () => {
    try {
      const incRes = await axios.get('/api/incidents', {
        params: { status: 'Pending,Acknowledged,Responding,On Scene', limit: 100 }
      });
      setIncidents(Array.isArray(incRes.data) ? incRes.data : []);

      const resRes = await axios.get('/api/users', {
        params: { role: 'Responder', is_on_duty: 1, limit: 100 }
      });
      const validResponders = (resRes.data.users || []).filter(r => r.current_lat && r.current_lng);
      setResponders(validResponders);
      
      setLastRefreshed(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch command map data:', err);
    }
  };

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [11.3969, 122.3995],
        zoom: 13,
        zoomControl: false // We will move it to the bottom right
      });

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);
      tileLayerRef.current = L.tileLayer(mapStyles[mapStyle].url, { attribution: mapStyles[mapStyle].attribution }).addTo(mapRef.current);
      
      incidentLayerRef.current = L.layerGroup().addTo(mapRef.current);
      responderLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
    
    fetchData();
    const interval = setInterval(fetchData, 5000); 
    
    return () => {
      clearInterval(interval);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(mapStyles[mapStyle].url);
      
      const pane = mapRef.current.getPane('tilePane');
      if (pane) {
        if (mapStyle === 'tactical') {
          pane.style.filter = 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)';
        } else {
          pane.style.filter = 'none';
        }
      }
    }
  }, [mapStyle]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Let leaflet know the container size changed
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 200);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (incidentLayerRef.current) incidentLayerRef.current.clearLayers();
    if (responderLayerRef.current) responderLayerRef.current.clearLayers();

    incidents.forEach(inc => {
      if (inc.location_lat && inc.location_lng) {
        const customIcon = L.divIcon({
          className: 'custom-div-icon',
          html: `<div class="radar-ripple"><div class="radar-core"></div></div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const marker = L.marker([inc.location_lat, inc.location_lng], { icon: customIcon });
        marker.bindPopup(`
          <div class="premium-popup">
            <b class="popup-title">${inc.type}</b>
            <span class="popup-code">CODE: ${inc.code}</span>
            <div class="popup-status">${inc.status}</div>
            <p class="popup-address">${inc.location_address || 'GPS Coordinates Only'}</p>
            <button onclick="window.location.href='/incidents/${inc.id}'" class="popup-btn">View & Dispatch</button>
          </div>
        `);
        incidentLayerRef.current.addLayer(marker);
      }
    });

    responders.forEach(resp => {
      const isPolice = resp.agency_type === 'PNP' || resp.agency_type === 'Police';
      const isFire = resp.agency_type === 'BFP' || resp.agency_type === 'Fire';
      
      let color = '#3b82f6'; // Blue
      let iconHtml = '🛡️';
      if (isFire) { color = '#f97316'; iconHtml = '🔥'; }
      else if (!isPolice) { color = '#10b981'; iconHtml = '⚕️'; } // Medical
      
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #111; box-shadow: 0 0 15px ${color}80; display: flex; align-items: center; justify-content: center; font-size: 14px;">
            ${iconHtml}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([resp.current_lat, resp.current_lng], { icon: customIcon });
      marker.bindPopup(`
        <div class="premium-popup">
          <b style="color: ${color}; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">${resp.agency_type || 'Responder'}</b>
          <span style="font-weight: 800; font-size: 16px; color: white; display: block; margin: 4px 0;">${resp.full_name}</span>
          <span style="font-size: 12px; color: #94a3b8;">${resp.phone}</span>
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
    <div 
      ref={containerRef}
      style={{ 
        position: 'relative',
        display: 'flex', 
        flexDirection: 'column', 
        height: isWidget ? '450px' : (isFullscreen ? '100vh' : 'calc(100vh - 80px)'), 
        backgroundColor: '#0f172a', 
        borderRadius: isWidget || !isFullscreen ? '20px' : '0', 
        overflow: 'hidden', 
        marginBottom: isWidget ? '24px' : '0',
        boxShadow: isWidget ? '0 12px 32px rgba(0,0,0,0.2)' : 'none',
        border: (isWidget || !isFullscreen) ? '1px solid #334155' : 'none'
      }}
    >
      <style>{`
        /* Radar Ripple CSS */
        .radar-ripple {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .radar-core {
          width: 14px;
          height: 14px;
          background-color: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
          z-index: 2;
          box-shadow: 0 0 10px #ef4444;
        }
        .radar-ripple::before, .radar-ripple::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background-color: transparent;
          border: 2px solid #ef4444;
          border-radius: 50%;
          animation: ripple 2s infinite cubic-bezier(0.1, 0.5, 0.8, 1);
          z-index: 1;
        }
        .radar-ripple::after {
          animation-delay: 1s;
        }
        @keyframes ripple {
          0% { transform: scale(0.3); opacity: 1; border-width: 4px; }
          100% { transform: scale(1.5); opacity: 0; border-width: 1px; }
        }

        /* Premium Leaflet Popup Overrides */
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px !important;
          color: white !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: #94a3b8 !important;
          padding: 8px !important;
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: white !important;
        }
        .premium-popup {
          font-family: 'Inter', sans-serif;
          text-align: center;
          padding: 8px 4px;
        }
        .popup-title {
          color: #ef4444;
          font-size: 16px;
          font-weight: 800;
          display: block;
          margin-bottom: 4px;
        }
        .popup-code {
          font-size: 11px;
          color: #94a3b8;
          font-family: monospace;
          background: #1e293b;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .popup-status {
          font-size: 13px;
          color: #38bdf8;
          font-weight: 800;
          margin: 8px 0;
        }
        .popup-address {
          margin: 8px 0 12px 0;
          font-size: 13px;
          color: #cbd5e1;
          font-weight: 500;
          line-height: 1.4;
        }
        .popup-btn {
          display: block;
          width: 100%;
          background: #ef4444;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          border: none;
          font-weight: 800;
          cursor: pointer;
          transition: background 0.2s;
        }
        .popup-btn:hover {
          background: #dc2626;
        }

        /* Custom Premium Scrollbar for Sidebar */
        .glass-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .glass-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .glass-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
        }
        .glass-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>

      {/* Top Header */}
      <div style={{ 
        height: '60px', 
        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 24px',
        justifyContent: 'space-between',
        zIndex: 1000,
        position: 'absolute',
        top: 0, left: 0, right: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {!isWidget && !isFullscreen && (
            <button 
              onClick={() => navigate('/admin')}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#334155'}
              onMouseOut={e => e.currentTarget.style.background = '#1e293b'}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '8px', borderRadius: '10px' }}>
              <Layers size={20} color="#38bdf8" />
            </div>
            <h1 style={{ color: '#fff', fontSize: '18px', margin: 0, fontWeight: '800', letterSpacing: '0.5px' }}>LIVE COMMAND MAP</h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''} color="#38bdf8" />
            LIVE SYNC: {lastRefreshed.toLocaleTimeString()}
          </span>
          <button 
            onClick={toggleFullscreen}
            style={{ background: '#38bdf8', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '12px', transition: 'background 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = '#7dd3fc'}
            onMouseOut={e => e.currentTarget.style.background = '#38bdf8'}
          >
            {isFullscreen ? <><Minimize size={14} /> EXIT</> : <><Maximize size={14} /> FULLSCREEN</>}
          </button>
        </div>
      </div>

      {/* Main Map Content Wrapper */}
      <div style={{ flex: 1, position: 'relative', marginTop: '60px' }}>
        
        {/* Map Container */}
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', backgroundColor: '#020617' }}></div>

        {/* Map Style Switcher */}
        <div style={{ position: 'absolute', top: '20px', right: isWidget ? '20px' : '80px', zIndex: 1000 }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowStyleMenu(!showStyleMenu)}
              style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                transition: 'all 0.2s'
              }}
              title="Change Map Style"
            >
              <Layers size={20} />
            </button>
            
            {showStyleMenu && (
              <div style={{
                position: 'absolute', top: '54px', right: '0',
                background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px',
                minWidth: '180px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}>
                {Object.entries(mapStyles).map(([key, style]) => {
                  const Icon = style.icon;
                  const isActive = mapStyle === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { setMapStyle(key); setShowStyleMenu(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        width: '100%', padding: '10px 12px', borderRadius: '8px',
                        background: isActive ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                        border: 'none', color: isActive ? '#38bdf8' : '#cbd5e1',
                        fontSize: '13px', fontWeight: isActive ? '700' : '500',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { if(!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; } }}
                      onMouseOut={e => { if(!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; } }}
                    >
                      <Icon size={16} />
                      {style.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Floating Glassmorphic Sidebar */}
        <div style={{ 
          position: 'absolute',
          top: '20px',
          left: '20px',
          bottom: '20px',
          width: '360px', 
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.7) 100%)', 
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}>
          
          {/* Incidents Section */}
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <ShieldAlert size={18} color="#ef4444" />
              Active Emergencies <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{incidents.length}</span>
            </h3>
          </div>
          
          <div className="glass-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {incidents.length === 0 ? (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0', fontSize: '13px', fontWeight: '600' }}>
                All clear. No active emergencies.
              </div>
            ) : (
              incidents.map(inc => (
                <div 
                  key={inc.id}
                  onClick={() => panToIncident(inc.location_lat, inc.location_lng)}
                  style={{
                    background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderLeft: '4px solid #ef4444',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)'; e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(239,68,68,0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                    <span style={{ color: '#ef4444', fontWeight: '800', fontSize: '15px' }}>{inc.type}</span>
                    <span style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{inc.code}</span>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '10px', fontWeight: '500', lineHeight: '1.4' }}>{inc.location_address || 'Coordinates Only'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: '800' }}>{inc.status}</span>
                    <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '600' }}>{new Date(inc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Responders Section */}
          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '45%' }}>
            <h3 style={{ color: '#fff', margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <AlertCircle size={18} color="#38bdf8" />
              On-Duty Responders <span style={{ background: '#38bdf8', color: '#0f172a', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{responders.length}</span>
            </h3>
            
            <div className="glass-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {responders.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0', fontWeight: '600' }}>No responders currently active</div>
              ) : (
                responders.map(resp => {
                  const isPolice = resp.agency_type === 'PNP' || resp.agency_type === 'Police';
                  const isFire = resp.agency_type === 'BFP' || resp.agency_type === 'Fire';
                  const agencyColor = isPolice ? '#3b82f6' : isFire ? '#f97316' : '#10b981';
                  
                  return (
                    <div 
                      key={resp.id}
                      onClick={() => panToIncident(resp.current_lat, resp.current_lng)}
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${agencyColor}`,
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderLeftColor: agencyColor,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        flexShrink: 0
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)'; e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{resp.full_name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>{resp.phone || 'No phone'}</div>
                        </div>
                        <div style={{ color: agencyColor, fontSize: '11px', fontWeight: '800', background: `${agencyColor}20`, padding: '2px 6px', borderRadius: '4px' }}>
                          {resp.agency_type || 'Responder'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommandMap;
