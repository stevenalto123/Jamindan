import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet.fullscreen';
import 'leaflet.fullscreen/dist/Control.FullScreen.css';
import {
  MapPin, ShieldAlert, Plus, Edit2, Trash2, X, Info,
  Maximize, Minimize, Navigation, Tent, Users, AlertTriangle, Search
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Fix Leaflet icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const JamindanCenter = [11.4294, 122.4828];

const EvacuationCenters = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'Admin';

  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const draftMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Form / Management state
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    currentHeadcount: '0',
    status: 'Closed',
    latitude: '',
    longitude: ''
  });

  const fetchCenters = async () => {
    try {
      const res = await axios.get('/api/emergency/evacuation-centers');
      setCenters(res.data);
      localStorage.setItem('cached_evacuation_centers', JSON.stringify(res.data));
    } catch (err) {
      console.error(err);
      const cached = localStorage.getItem('cached_evacuation_centers');
      if (cached) {
        setCenters(JSON.parse(cached));
      } else {
        setError('Failed to fetch evacuation centers.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setLocationError('');
        },
        () => {
          axios.get('https://ipapi.co/json/')
            .then(res => {
              if (res.data && res.data.latitude && res.data.longitude) {
                setUserLocation([res.data.latitude, res.data.longitude]);
                setLocationError('Using approximate Wi-Fi location since hardware GPS is disabled.');
              } else {
                throw new Error('Invalid ipapi response');
              }
            })
            .catch(() => {
              axios.get('https://ipinfo.io/json')
                .then(res2 => {
                  if (res2.data && res2.data.loc) {
                    const [lat, lng] = res2.data.loc.split(',').map(Number);
                    setUserLocation([lat, lng]);
                    setLocationError('Using approximate Wi-Fi location since hardware GPS is disabled.');
                  } else {
                    setLocationError(t('gpsDisabled') || 'Automatic GPS failed.');
                    setUserLocation(null);
                  }
                })
                .catch(() => {
                  setLocationError(t('gpsDisabled') || 'Automatic GPS failed.');
                  setUserLocation(null);
                });
            });
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      setLocationError(t('geoNotSupported') || 'Geolocation is not supported by your browser.');
      setUserLocation(null);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (loading || !mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topleft', pseudoFullscreen: true },
        attributionControl: false
      }).setView(JamindanCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    centers.forEach(center => {
      if (center.latitude && center.longitude) {
        const occupancyRate = center.capacity > 0 ? ((center.current_headcount / center.capacity) * 100).toFixed(0) : 0;

        let markerColor = '#10b981';
        if (center.status === 'Closed') markerColor = '#64748b';
        else if (center.status === 'Full' || occupancyRate >= 100) markerColor = '#ef4444';
        else if (occupancyRate >= 80) markerColor = '#f59e0b';

        const customIcon = L.divIcon({
          html: `<div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px;">⛺</div>`,
          className: 'custom-leaflet-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const popupContent = `
          <div style="font-family: var(--font-sans); min-width: 180px; padding: 4px;">
            <h4 style="margin: 0 0 6px 0; font-weight: 800; color: #1e293b; font-size: 14px;">${center.name}</h4>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569; line-height: 1.4;">📍 ${center.location}</p>
            <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; color: #334155;">
              <span>${t('status')}: <strong>${t('status' + center.status) || center.status}</strong></span>
              <span>${t('occupancy')}: <strong>${occupancyRate}%</strong></span>
            </div>
            <div style="font-size: 11px; color: #64748b; font-weight: 600;">${t('capacity')}: ${center.current_headcount} / ${center.capacity}</div>
          </div>
        `;

        const marker = L.marker([center.latitude, center.longitude], { icon: customIcon })
          .addTo(mapInstance.current)
          .bindPopup(popupContent)
          .on('click', () => { handleCenterSelect(center); });

        markersRef.current[center.id] = marker;
      }
    });

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = L.divIcon({
        html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8); animation: pulse 2s infinite;"></div>`,
        className: 'custom-leaflet-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      userMarkerRef.current = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family: var(--font-sans); font-weight: bold;">${t('youAreHere')}</div>`);
    }
  }, [centers, loading, showForm, userLocation]);

  // Dynamic Map Click Handler to capture coordinates when the form is open
  useEffect(() => {
    if (!mapInstance.current) return;

    const handleMapClick = (e) => {
      if (!isAdmin || !showForm) return;
      const { lat, lng } = e.latlng;
      setFormData(prev => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6)
      }));
    };

    mapInstance.current.on('click', handleMapClick);
    return () => {
      mapInstance.current.off('click', handleMapClick);
    };
  }, [isAdmin, showForm]);

  // Visual feedback for draft coordinates
  useEffect(() => {
    if (!mapInstance.current) return;

    if (showForm && formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);

      if (!draftMarkerRef.current) {
        const draftIcon = L.divIcon({
          html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(239, 68, 68, 0.8); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px;">+</div>`,
          className: 'custom-leaflet-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        draftMarkerRef.current = L.marker([lat, lng], { icon: draftIcon, zIndexOffset: 2000 }).addTo(mapInstance.current);
      } else {
        draftMarkerRef.current.setLatLng([lat, lng]);
      }
    } else if (draftMarkerRef.current) {
      draftMarkerRef.current.remove();
      draftMarkerRef.current = null;
    }
  }, [showForm, formData.latitude, formData.longitude]);

  const handleCenterSelect = async (center) => {
    if (center.status === 'Closed') {
      alert('This evacuation center is currently closed.');
      return;
    }

    if (center.latitude && center.longitude && mapInstance.current) {
      const destLat = parseFloat(center.latitude);
      const destLng = parseFloat(center.longitude);

      mapInstance.current.setView([destLat, destLng], 14);
      const marker = markersRef.current[center.id];
      if (marker) marker.openPopup();

      if (!userLocation) {
        alert(t('noRoute') || 'Cannot draw route: Your location is unavailable. Please check your GPS settings.');
        return;
      }

      const [userLat, userLng] = userLocation;

      if (routeLayerRef.current) {
        mapInstance.current.removeControl(routeLayerRef.current);
      }

      try {
        routeLayerRef.current = L.Routing.control({
          position: 'bottomleft',
          waypoints: [
            L.latLng(userLat, userLng),
            L.latLng(destLat, destLng)
          ],
          router: L.Routing.osrmv1({
            serviceUrl: 'https://routing.openstreetmap.de/routed-car/route/v1'
          }),
          lineOptions: {
            styles: [{ color: '#2563eb', weight: 6, opacity: 0.9 }]
          },
          show: true,
          collapsible: true,
          addWaypoints: false,
          routeWhileDragging: false,
          fitSelectedRoutes: true,
          createMarker: () => null
        }).addTo(mapInstance.current);
      } catch (err) {
        console.error('Failed to fetch route:', err);
      }
    }
  };

  useEffect(() => {
    if (mapInstance.current) {
      setTimeout(() => {
        mapInstance.current.invalidateSize();
      }, 300);
    }
  }, [isFullScreen]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      location: '',
      capacity: '',
      currentHeadcount: '0',
      status: 'Open',
      latitude: '',
      longitude: ''
    });
    setShowForm(true);
  };

  const handleOpenEdit = (center) => {
    setIsEditing(true);
    setCurrentId(center.id);
    setFormData({
      name: center.name,
      location: center.location,
      capacity: center.capacity.toString(),
      currentHeadcount: center.current_headcount.toString(),
      status: center.status,
      latitude: center.latitude ? center.latitude.toString() : '',
      longitude: center.longitude ? center.longitude.toString() : ''
    });
    setShowForm(true);
    if (center.latitude && center.longitude && mapInstance.current) {
      mapInstance.current.setView([parseFloat(center.latitude), parseFloat(center.longitude)], 14);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, location, capacity, currentHeadcount, status, latitude, longitude } = formData;

    if (!name || !location || !capacity) {
      setError('Please fill in all required fields.');
      return;
    }

    setSuccess('');
    setError('');

    const payload = {
      name,
      location,
      capacity: parseInt(capacity),
      current_headcount: parseInt(currentHeadcount),
      status,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null
    };

    try {
      if (isEditing) {
        await axios.put(`/api/emergency/evacuation-centers/${currentId}`, payload);
        setSuccess('Evacuation center updated successfully.');
      } else {
        await axios.post('/api/emergency/evacuation-centers', payload);
        setSuccess('Evacuation center registered successfully.');
      }
      setShowForm(false);
      fetchCenters();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to save evacuation center details.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this evacuation center?')) return;
    setSuccess('');
    setError('');
    try {
      await axios.delete(`/api/emergency/evacuation-centers/${id}`);
      setSuccess('Evacuation center deleted successfully.');
      fetchCenters();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to delete evacuation center.');
    }
  };

  const totalCenters = centers.length;
  const openCenters = centers.filter(c => c.status === 'Open').length;
  const fullCenters = centers.filter(c => c.status === 'Full').length;
  const closedCenters = centers.filter(c => c.status === 'Closed').length;

  const filteredCenters = centers.filter(c => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesSearch = !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusMeta = (status, occupancyRate) => {
    if (status === 'Closed') return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)', opacity: 0.72 };
    if (status === 'Full' || occupancyRate >= 100) return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', opacity: 1 };
    if (occupancyRate >= 80) return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', opacity: 1 };
    return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', opacity: 1 };
  };

  if (loading) {
    return <div className="content-body"><p style={{ color: 'var(--text-light)' }}>Loading evacuation centers map...</p></div>;
  }

  return (
    <div className="content-body" style={{ maxWidth: '1240px', paddingBottom: '48px' }}>

      {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px' }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px' }}>{error}</div>}
      {locationError && (
        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '12px',
          padding: '10px 14px',
          marginBottom: '16px',
          borderRadius: '8px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <AlertTriangle size={15} style={{ flexShrink: 0 }} /> {locationError}
        </div>
      )}

      {/* ─── Unified Top Toolbar: Search + Filter Tabs + Add Shelter ─── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 16px',
          marginBottom: '18px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'none'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search shelter name or barangay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 30px 8px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              backgroundColor: 'var(--card-alt)',
              color: 'var(--text-main)',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          {[
            { id: 'All', label: 'All Shelters', count: totalCenters },
            { id: 'Open', label: t('statusOpen') || 'Open', count: openCenters },
            { id: 'Full', label: t('statusFull') || 'Full', count: fullCenters },
            { id: 'Closed', label: t('statusClosed') || 'Closed', count: closedCenters }
          ].map(tab => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: active ? '700' : '600',
                  border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: active ? 'var(--primary-color)' : 'var(--card-alt)',
                  color: active ? '#fff' : 'var(--text-light)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'var(--card-bg)',
                  color: active ? '#fff' : 'var(--text-muted)'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}
            >
              <Plus size={15} /> {t('newCenter') || 'Add Shelter'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Balanced 2-Column Split View on Laptop ────────────────── */}
      <div className="evac-split-grid">

        {/* Left Column: Map + Advisory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            ...(isFullScreen ? {
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999,
              borderRadius: 0,
              border: 'none',
            } : {
              height: '460px',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
            }),
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: isFullScreen ? 'fixed' : 'relative',
            backgroundColor: 'var(--card-bg)'
          }}>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              style={{
                position: 'absolute',
                top: isFullScreen ? 'calc(env(safe-area-inset-top, 0px) + 20px)' : '10px',
                right: '10px',
                zIndex: 1000,
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                padding: 0,
                color: 'var(--text-main)'
              }}
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>

            <div ref={mapRef} style={{ width: '100%', flex: 1, zIndex: 10 }} />
            {showForm && isAdmin && (
              <div style={{ backgroundColor: 'var(--card-alt)', borderTop: '1px solid var(--border-color)', padding: '10px 14px', fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={15} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
                <span><strong>{t('adminTip').split(':')[0]}:</strong>{t('adminTip').split(':')[1]}</span>
              </div>
            )}
          </div>

          {/* LGU Advisory Box */}
          <div className="glass-card" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', boxShadow: 'none' }}>
            <ShieldAlert size={18} style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.5' }}>
              {t('lguAdvisory') || 'LGU Advisory: Shelters operate on a first-come, first-served basis. Click any open shelter card to draw the fastest route on the map.'}
            </div>
          </div>
        </div>

        {/* Right Column: Admin Form OR Shelter Directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {showForm && isAdmin ? (
            <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--primary-color)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Tent size={18} color="var(--primary-color)" />
                  {isEditing ? t('editShelter') : t('registerShelter')}
                </h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('centerName')}</label>
                  <input type="text" name="name" className="form-input" value={formData.name} onChange={handleFormChange} required placeholder="e.g. Jamindan Civic Gym" />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('locationAddress')}</label>
                  <input type="text" name="location" className="form-input" value={formData.location} onChange={handleFormChange} required placeholder="e.g. Brgy. Poblacion" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('maxCapacity')}</label>
                    <input type="number" name="capacity" className="form-input" value={formData.capacity} onChange={handleFormChange} required min="1" />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('status')}</label>
                    <select name="status" className="form-select" value={formData.status} onChange={handleFormChange} required>
                      <option value="Open">{t('statusOpen')}</option>
                      <option value="Full">{t('statusFull')}</option>
                      <option value="Closed">{t('statusClosed')}</option>
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('currentHeadcount')}</label>
                    <input type="number" name="currentHeadcount" className="form-input" value={formData.currentHeadcount} onChange={handleFormChange} min="0" max={formData.capacity} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>{t('latitude')} (Tap Map)</label>
                    <input type="text" name="latitude" className="form-input" value={formData.latitude} onChange={handleFormChange} placeholder="e.g. 11.4294" />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '11px' }}>{t('longitude')} (Tap Map)</label>
                    <input type="text" name="longitude" className="form-input" value={formData.longitude} onChange={handleFormChange} placeholder="e.g. 122.4828" />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '42px', marginTop: '4px', fontSize: '14px', fontWeight: '700' }}>
                  {isEditing ? t('saveUpdates') : t('addShelter')}
                </button>
              </form>
            </div>
          ) : (
            <>
              {filteredCenters.length === 0 ? (
                <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-color)', boxShadow: 'none' }}>
                  <Tent size={26} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 4px 0' }}>No Shelters Found</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>No evacuation centers match your current filter.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '535px', overflowY: 'auto', paddingRight: '2px' }}>
                  {filteredCenters.map(center => {
                    const occupancyRate = center.capacity > 0 ? ((center.current_headcount / center.capacity) * 100).toFixed(0) : 0;
                    const meta = getStatusMeta(center.status, occupancyRate);
                    const isClosed = center.status === 'Closed';

                    return (
                      <div
                        key={center.id}
                        className="glass-card"
                        onClick={() => handleCenterSelect(center)}
                        style={{
                          padding: '15px 16px',
                          borderRadius: '12px',
                          border: '1px solid var(--border-color)',
                          cursor: isClosed ? 'not-allowed' : 'pointer',
                          opacity: meta.opacity,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          boxShadow: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div style={{ minWidth: 0 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                              {center.name}
                            </h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-light)' }}>
                              <MapPin size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                              <span>{center.location}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: meta.bg,
                              color: meta.color
                            }}>
                              {t('status' + center.status) || center.status}
                            </span>

                            {isAdmin && (
                              <div style={{ display: 'flex', gap: '2px' }} onClick={e => e.stopPropagation()}>
                                <button onClick={() => handleOpenEdit(center)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(center.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '4px' }}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {!isClosed && (
                          <div style={{ backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', padding: '10px 12px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-light)', marginBottom: '6px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Users size={13} /> {t('capacityOccupancy')}</span>
                              <span style={{ fontWeight: '700', color: meta.color }}>{center.current_headcount} / {center.capacity} ({occupancyRate}%)</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(occupancyRate, 100)}%`, height: '100%', backgroundColor: meta.color, transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        )}

                        {!isClosed && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: 'var(--primary-color)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <Navigation size={12} /> Click to view route on map
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .evac-split-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .evac-split-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EvacuationCenters;
