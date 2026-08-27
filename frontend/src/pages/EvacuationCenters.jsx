import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet.fullscreen';
import 'leaflet.fullscreen/dist/Control.FullScreen.css';
import { MapPin, ShieldAlert, Plus, Edit2, Trash2, X, Info, Maximize, Minimize } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Fix Leaflet icons in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const JamindanCenter = [11.4294, 122.4828]; // Central Jamindan Coordinates

const EvacuationCenters = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === 'Admin';

  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
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
    } catch (err) {
      console.error(err);
      setError('Failed to fetch evacuation centers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenters();
    
    // Get user's current live location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
          setLocationError('');
        },
        (err) => {
          axios.get('https://ipapi.co/json/')
            .then(res => {
              if (res.data && res.data.latitude && res.data.longitude) {
                setUserLocation([res.data.latitude, res.data.longitude]);
                setLocationError("⚠️ Using approximate Wi-Fi location since hardware GPS is disabled.");
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
                    setUserLocation([lat, lng]);
                    setLocationError("⚠️ Using approximate Wi-Fi location since hardware GPS is disabled.");
                  } else {
                    setLocationError(t('gpsDisabled') || "Automatic GPS failed.");
                    setUserLocation(null);
                  }
                })
                .catch(ipErr2 => {
                  console.warn("All IP Geolocation failed", ipErr2);
                  setLocationError(t('gpsDisabled') || "Automatic GPS failed.");
                  setUserLocation(null);
                });
            });
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      setLocationError(t('geoNotSupported') || "Geolocation is not supported by your browser.");
      setUserLocation(null);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (loading || !mapRef.current) return;

    if (!mapInstance.current) {
      // Create Map
      mapInstance.current = L.map(mapRef.current, {
        fullscreenControl: true,
        fullscreenControlOptions: { position: 'topleft', pseudoFullscreen: true },
        attributionControl: false
      }).setView(JamindanCenter, 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      // Map click handler for coordinate selection when form is open
      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        // Use a functional state update to access the latest state without putting it in dependency array
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }));
      });
    }

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    // Add markers for centers with coordinates
    centers.forEach(center => {
      if (center.latitude && center.longitude) {
        const occupancyRate = center.capacity > 0 ? ((center.current_headcount / center.capacity) * 100).toFixed(0) : 0;
        
        let markerColor = '#27ae60'; // Green
        if (center.status === 'Closed') markerColor = '#7f8c8d'; // Gray
        else if (occupancyRate >= 85) markerColor = '#c0392b'; // Red
        else if (occupancyRate >= 50) markerColor = '#f39c12'; // Yellow

        // Custom SVG Marker to allow coloring dynamically
        const customIcon = L.divIcon({
          html: `<div style="background-color: ${markerColor}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 9px;">⛺</div>`,
          className: 'custom-leaflet-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const popupContent = `
          <div style="font-family: var(--font-sans); min-width: 160px; padding: 4px;">
            <h4 style="margin: 0 0 4px 0; font-weight: 700; color: var(--text-main); font-size: 13px;">${center.name}</h4>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: var(--text-light);">${center.location}</p>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
              <span>${t('status')}: <strong>${t('status' + center.status)}</strong></span>
              <span>${t('occupancy')}: <strong>${occupancyRate}%</strong></span>
            </div>
            <div style="font-size: 10px; color: var(--text-muted);">${t('capacity')}: ${center.current_headcount} / ${center.capacity}</div>
          </div>
        `;

        const marker = L.marker([center.latitude, center.longitude], { icon: customIcon })
          .addTo(mapInstance.current)
          .bindPopup(popupContent)
          .on('click', () => { handleCenterSelect(center); });
        
        markersRef.current[center.id] = marker;
      }
    });

    // Add user's current location marker (Blue dot)
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }
      
      const userIcon = L.divIcon({
        html: `<div style="background-color: #3498db; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(52, 152, 219, 0.8); animation: pulse 2s infinite;"></div>`,
        className: 'custom-leaflet-icon',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      userMarkerRef.current = L.marker(userLocation, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(mapInstance.current)
        .bindPopup(`<div style="font-family: var(--font-sans); font-weight: bold;">${t('youAreHere')}</div>`);
      
      // Optionally center map on user on first load
      // mapInstance.current.setView(userLocation, 14);
    }

  }, [centers, loading, showForm, userLocation]);

  const handleCenterSelect = async (center) => {
    if (center.latitude && center.longitude && mapInstance.current) {
      const destLat = parseFloat(center.latitude);
      const destLng = parseFloat(center.longitude);
      
      mapInstance.current.setView([destLat, destLng], 14);
      const marker = markersRef.current[center.id];
      if (marker) {
        marker.openPopup();
      }

      // Draw route if user location is known
      if (!userLocation) {
        alert(t('noRoute') || "Cannot draw route: Your location is unavailable. Please click anywhere on the map to set your starting point.");
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
            styles: [{ color: '#3498db', weight: 6, opacity: 0.9 }]
          },
          show: true,
          collapsible: true,
          addWaypoints: false,
          routeWhileDragging: false,
          fitSelectedRoutes: true,
          createMarker: () => null // don't draw extra default markers
        }).addTo(mapInstance.current);
      } catch (err) {
        console.error("Failed to fetch route:", err);
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
    handleCenterSelect(center);
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
    } catch (err) {
      console.error(err);
      setError('Failed to delete evacuation center.');
    }
  };

  const getOccupancyColor = (rate) => {
    if (rate >= 85) return '#e74c3c'; // Red
    if (rate >= 50) return '#f39c12'; // Orange/Yellow
    return '#2ecc71'; // Green
  };

  if (loading) {
    return <div className="content-body"><p>Loading evacuation centers map...</p></div>;
  }

  return (
    <div className="content-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Panel */}
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {isAdmin && (
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> {t('newCenter')}
          </button>
        )}
      </div>

      {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '8px 12px', margin: 0 }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '8px 12px', margin: 0 }}>{error}</div>}
      {locationError && <div className="alert alert-warning" style={{ backgroundColor: '#fef5e7', color: '#d35400', border: '1px solid #fad7a1', fontSize: '13px', padding: '8px 12px', margin: 0, borderRadius: '4px' }}>📍 {locationError}</div>}

      {/* Map & list display (Stacked layout) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Interactive Map */}
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
            height: '50vh',
            minHeight: '400px',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
          }),
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          position: isFullScreen ? 'fixed' : 'relative',
          backgroundColor: '#fff'
        }}>
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              zIndex: 1000, 
              backgroundColor: 'white', 
              border: '2px solid rgba(0,0,0,0.2)', 
              borderRadius: '4px', 
              width: '34px', 
              height: '34px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              boxShadow: '0 1px 5px rgba(0,0,0,0.65)',
              padding: 0
            }}
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize size={18} color="#333" /> : <Maximize size={18} color="#333" />}
          </button>

          <div ref={mapRef} style={{ width: '100%', flex: 1, zIndex: 10 }} />
          {showForm && (
            <div style={{ backgroundColor: '#fcfcfc', borderTop: '1px solid var(--border-color)', padding: '10px 16px', fontSize: '11px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={14} style={{ color: 'var(--primary-color)' }} />
              <span><strong>{t('adminTip').split(':')[0]}:</strong>{t('adminTip').split(':')[1]}</span>
            </div>
          )}
        </div>

        {/* List details & forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {showForm ? (
            /* Admin Add/Edit Form */
            <div className="card" style={{ border: '1px solid var(--primary-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="card-title" style={{ margin: 0 }}>{isEditing ? t('editShelter') : t('registerShelter')}</h3>
                <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('latitude')}</label>
                    <input type="text" name="latitude" className="form-input" value={formData.latitude} onChange={handleFormChange} placeholder="e.g. 11.4294" />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('longitude')}</label>
                    <input type="text" name="longitude" className="form-input" value={formData.longitude} onChange={handleFormChange} placeholder="e.g. 122.4828" />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ height: '40px', marginTop: '6px' }}>
                  {isEditing ? t('saveUpdates') : t('addShelter')}
                </button>
              </form>
            </div>
          ) : (
            /* Shelter Capacity Cards List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {centers.map(center => {
                const occupancyRate = center.capacity > 0 ? ((center.current_headcount / center.capacity) * 100).toFixed(0) : 0;
                
                return (
                  <div 
                    key={center.id} 
                    className="card"
                    onClick={() => handleCenterSelect(center)}
                    style={{ 
                      padding: '16px', 
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                      transition: 'transform 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{center.name}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-light)' }}>
                          <MapPin size={12} />
                          <span>{center.location}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {center.status === 'Open' && <span className="badge badge-resolved">{t('statusOpen')}</span>}
                        {center.status === 'Full' && <span className="badge badge-pending">{t('statusFull')}</span>}
                        {center.status === 'Closed' && <span className="badge badge-review">{t('statusClosed')}</span>}

                        {isAdmin && (
                          <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleOpenEdit(center)} style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', padding: '4px' }}>
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(center.id)} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', padding: '4px' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress occupancy bar */}
                    {center.status !== 'Closed' && (
                      <div style={{ marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-light)', marginBottom: '4px' }}>
                          <span>{t('capacityOccupancy')}</span>
                          <span style={{ fontWeight: '700' }}>{center.current_headcount} / {center.capacity} ({occupancyRate}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#eef1ee', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${Math.min(occupancyRate, 100)}%`, 
                              height: '100%', 
                              backgroundColor: getOccupancyColor(occupancyRate),
                              transition: 'width 0.5s ease-in-out'
                            }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#ebf5fb', border: '1px solid #d4e6f1', borderRadius: '12px', padding: '14px', marginTop: 'auto' }}>
            <ShieldAlert size={18} style={{ color: '#2980b9', flexShrink: 0 }} />
            <p style={{ fontSize: '11px', color: '#1b4f72', margin: 0 }} dangerouslySetInnerHTML={{
              __html: t('lguAdvisory').replace('LGU Advisory:', '<strong>' + t('lguAdvisory').split(':')[0] + ':</strong>').replace('Full', '<strong>' + t('statusFull') + '</strong>')
            }}>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EvacuationCenters;
