import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MapPicker from '../components/MapPicker';
import { AlertTriangle, Upload, Check, MapPin, Flame, HeartPulse, Droplets, WifiOff, Car, ShieldAlert, HelpCircle, Copy, Signal, PhoneCall } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const INCIDENT_TYPES = [
  { value: 'Fire',     label: 'Fire',     icon: Flame,       color: '#e74c3c', bg: 'rgba(231,76,60,0.08)'   },
  { value: 'Medical',  label: 'Medical',  icon: HeartPulse,  color: '#27ae60', bg: 'rgba(39,174,96,0.08)'   },
  { value: 'Flood',    label: 'Flood',    icon: Droplets,    color: '#2980b9', bg: 'rgba(41,128,185,0.08)'  },
  { value: 'Accident', label: 'Accident', icon: Car,         color: '#e67e22', bg: 'rgba(230,126,34,0.08)'  },
  { value: 'Crime',    label: 'Crime',    icon: ShieldAlert, color: '#8e44ad', bg: 'rgba(142,68,173,0.08)'  },
  { value: 'Other',    label: 'Other',    icon: HelpCircle,  color: '#7f8c8d', bg: 'rgba(127,140,141,0.08)' },
];

// IndexedDB Helper for Offline Sync (supports Images)
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

const dataURItoBlob = (dataURI) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type: mimeString});
};

const saveToIndexedDB = (payloadObj) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineSyncDB', 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore('incidents', { keyPath: 'id' });
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('incidents', 'readwrite');
      tx.objectStore('incidents').put({ id: 'draft_1', ...payloadObj });
      tx.oncomplete = () => resolve();
    };
    request.onerror = (e) => reject(e);
  });
};

const getFromIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineSyncDB', 1);
    request.onupgradeneeded = (e) => e.target.result.createObjectStore('incidents', { keyPath: 'id' });
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('incidents', 'readonly');
      const getReq = tx.objectStore('incidents').get('draft_1');
      getReq.onsuccess = () => resolve(getReq.result);
    };
    request.onerror = (e) => reject(e);
  });
};

const clearIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OfflineSyncDB', 1);
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('incidents', 'readwrite');
      tx.objectStore('incidents').delete('draft_1');
      tx.oncomplete = () => resolve();
    };
  });
};

const ReportIncident = () => {
  const [type, setType] = useState('');
  const [details, setDetails] = useState({});
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [lat, setLat] = useState(11.4287);
  const [lng, setLng] = useState(122.4842);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      // Legacy fallback
      const savedPayload = localStorage.getItem('offline_incident_payload');
      if (savedPayload) {
        try {
          const payload = JSON.parse(savedPayload);
          const res = await axios.post('/api/incidents', payload);
          localStorage.removeItem('offline_incident_payload');
          alert('Your offline report has been successfully auto-submitted! (Code: ' + res.data.code + ')');
          window.location.href = '/incidents/' + res.data.incidentId;
          return;
        } catch (err) { console.error('Failed to sync legacy offline report', err); }
      }

      // New IndexedDB logic
      try {
        const savedData = await getFromIndexedDB();
        if (savedData) {
          const formData = new FormData();
          formData.append('type', savedData.type);
          formData.append('description', savedData.description);
          formData.append('location_lat', savedData.location_lat);
          formData.append('location_lng', savedData.location_lng);
          formData.append('location_address', savedData.location_address);
          if (savedData.details) formData.append('details', savedData.details);
          
          if (savedData.photoBase64) {
            const blob = dataURItoBlob(savedData.photoBase64);
            formData.append('photo', blob, 'offline_photo.jpg');
          } else if (savedData.photo) {
            const fileName = savedData.photo.name || 'offline_photo.jpg';
            formData.append('photo', savedData.photo, fileName);
          }
          
          const res = await axios.post('/api/incidents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          await clearIndexedDB();
          alert('Your offline report (with photo) has been successfully auto-submitted! (Code: ' + res.data.code + ')');
          window.location.href = '/incidents/' + res.data.incidentId;
        }
      } catch (err) {
        alert('Failed to auto-submit offline report: ' + err.message);
        console.error('Failed to sync IndexedDB offline report', err);
      }
    };
    const handleOffline = () => setIsOffline(true);
    
    // Attempt sync immediately on mount in case the app was suspended or refreshed
    if (navigator.onLine) {
      handleOnline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  

  useEffect(() => { setDetails({}); }, [type]);

  const handleDetailChange = (field, value) => setDetails(prev => ({ ...prev, [field]: value }));

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { setError('Photo size exceeds 5MB limit.'); return; }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !description || !locationText.trim()) {
      setError('Please provide incident type, location, and description.');
      return;
    }
    setLoading(true); setError(''); setSuccess('');

    if (!navigator.onLine) {
      // We will let the fetch execute so Workbox Background Sync intercepts and queues it!
      console.log("Offline detected. Proceeding to submit so Workbox Background Sync queues the request.");
    }

    let isMultipart = false;
    const formData = new FormData();
    let address = locationText;
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { timeout: 3000 });
      if (geoRes.data && geoRes.data.display_name) address = geoRes.data.display_name.split(',').slice(0, 3).join(', ');
    } catch (e) { console.warn('Reverse geocode failed', e); }

    formData.append('type', type);
    formData.append('description', `[Location Details: ${locationText.trim()}] ${description.trim()}`);
    formData.append('location_lat', lat);
    formData.append('location_lng', lng);
    formData.append('location_address', address);
    if (Object.keys(details).length > 0) formData.append('details', JSON.stringify(details));
    if (photo) { formData.append('photo', photo); isMultipart = true; }

    let payload = formData;
    let config = { headers: { 'Content-Type': 'multipart/form-data' } };
    
    if (!isMultipart) {
      payload = { type, description: `[Location Details: ${locationText.trim()}] ${description.trim()}`, location_lat: lat, location_lng: lng, location_address: address };
      if (Object.keys(details).length > 0) payload.details = JSON.stringify(details);
      config = {};
    }

    try {
      const res = await axios.post('/api/incidents', payload, config);
      setSuccess(`Report submitted! Code: ${res.data.code}`);
      setTimeout(() => navigate(`/incidents/${res.data.incidentId}`), 2000);
    } catch (err) {
      if (!navigator.onLine || err.message === 'Network Error') {
        const prepareAndSave = async () => {
          try {
            let base64Photo = null;
            if (photo) {
              base64Photo = await fileToBase64(photo);
            }
            const offlineData = {
              type,
              description: `[Location Details: ${locationText.trim()}] ${description.trim()}`,
              location_lat: lat,
              location_lng: lng,
              location_address: address,
              details: Object.keys(details).length > 0 ? JSON.stringify(details) : null,
              photoBase64: base64Photo
            };
            await saveToIndexedDB(offlineData);
          } catch (e) {
            console.error('IDB Save failed', e);
          }
        };
        prepareAndSave();

        setSuccess('offline');
        setLoading(false);
        alert("No Internet Connection.\n\nYour report has been saved as an Offline Draft! It will automatically submit to the Command Center as soon as your phone reconnects to the internet.");
        document.querySelector('.main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError((err.response?.data?.message || 'Failed') + ': ' + (err.response?.data?.errorDetails || err.message));
        setLoading(false);
      }
    }
  };

  const getTargetHotline = () => {
    if (type === 'Fire') return '09106964585'; // Jamindan BFP
    if (type === 'Medical') return '09304562011'; // Jamindan RHU
    return '09485224345'; // Jamindan MDRRMO
  };

  const getTargetAgencyName = () => {
    if (type === 'Fire') return 'BFP Fire (0910-696-4585)';
    if (type === 'Medical') return 'RHU Medic (0930-456-2011)';
    return 'MDRRMO (0948-522-4345)';
  };

  const generateSmsText = () => {
    let specificDetails = [];
    if (type === 'Fire') {
      if (details.structures_affected) {
        specificDetails.push(`Structures Affected: ${details.structures_affected}`);
      }
      if (details.visible_fire) {
        specificDetails.push(`Visible Fire/Smoke: ${details.visible_fire}`);
      }
      if (details.trapped_persons) {
        specificDetails.push(`Possible Trapped Persons: ${details.trapped_persons}`);
      }
    } else if (type === 'Medical' || type === 'Accident') {
      if (details.victims) {
        specificDetails.push(`Victims/Patients: ${details.victims}`);
      }
      if (details.injuries) {
        specificDetails.push(`Condition/Injuries: ${details.injuries}`);
      }
      if (details.vehicles_involved) {
        specificDetails.push(`Vehicles Involved: ${details.vehicles_involved}`);
      }
      if (details.road_obstruction) {
        specificDetails.push(`Road Blocked: ${details.road_obstruction}`);
      }
    } else if (type === 'Flood') {
      if (details.water_level) {
        specificDetails.push(`Water Level: ${details.water_level}`);
      }
      if (details.households_affected) {
        specificDetails.push(`Affected Households: ${details.households_affected}`);
      }
      if (details.people_needing_rescue) {
        specificDetails.push(`People Needing Rescue: ${details.people_needing_rescue}`);
      }
    } else if (Object.keys(details).length > 0) {
      Object.entries(details).forEach(([k, v]) => {
        if (v) specificDetails.push(`${k.replace(/_/g, ' ')}: ${v}`);
      });
    }

    const detailsBlock = specificDetails.length > 0 
      ? `\nSpecifics:\n${specificDetails.map(d => `- ${d}`).join('\n')}` 
      : '';

    const reporterInfo = user ? `\nReporter: ${user.full_name || user.username} (${user.phone || 'No phone'})` : '';
    const coordsInfo = (lat && lng) ? `\nGPS: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : '';

    return `EMERGENCY REPORT\nType: ${type || 'Emergency'}\nLocation: ${locationText || 'Jamindan'}${coordsInfo}${detailsBlock}\nDetails: ${description || 'Immediate emergency response requested.'}${reporterInfo}`;
  };

  const getSmsUri = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const separator = isIOS ? '&' : '?';
    return `sms:${getTargetHotline()}${separator}body=${encodeURIComponent(generateSmsText())}`;
  };

  const handleCopySms = () => {
    const smsText = generateSmsText();
    navigator.clipboard.writeText(smsText);
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 3000);
  };

  const renderDynamicFields = () => {
    switch (type) {
      case 'Fire':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'rgba(231,76,60,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(231,76,60,0.2)' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              <Flame size={16} /> Fire Details
            </h4>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Structures Affected</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 2" 
                min="0" 
                value={details.structures_affected || ''} 
                onChange={(e) => handleDetailChange('structures_affected', e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Visible Fire / Smoke?</label>
              <select 
                className="form-select" 
                value={details.visible_fire || ''} 
                onChange={(e) => handleDetailChange('visible_fire', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Possible Trapped Persons?</label>
              <select 
                className="form-select" 
                value={details.trapped_persons || ''} 
                onChange={(e) => handleDetailChange('trapped_persons', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
          </div>
        );
      case 'Accident':
      case 'Medical':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'rgba(39,174,96,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(39,174,96,0.2)' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#27ae60', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              <HeartPulse size={16} /> Medical / Accident Details
            </h4>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Number of Victims / Patients</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 2" 
                min="0" 
                value={details.victims || ''} 
                onChange={(e) => handleDetailChange('victims', e.target.value)} 
              />
            </div>
            {type === 'Accident' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Vehicles Involved</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 2" 
                  min="0" 
                  value={details.vehicles_involved || ''} 
                  onChange={(e) => handleDetailChange('vehicles_involved', e.target.value)} 
                />
              </div>
            )}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Condition / Injuries</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Unconscious, bleeding" 
                value={details.injuries || ''} 
                onChange={(e) => handleDetailChange('injuries', e.target.value)} 
              />
            </div>
            {type === 'Accident' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Road Obstruction?</label>
                <select 
                  className="form-select" 
                  value={details.road_obstruction || ''} 
                  onChange={(e) => handleDetailChange('road_obstruction', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            )}
          </div>
        );
      case 'Flood':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'rgba(41,128,185,0.06)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(41,128,185,0.2)' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#2980b9', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              <Droplets size={16} /> Flood Details
            </h4>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Approximate Water Level</label>
              <select 
                className="form-select" 
                value={details.water_level || ''} 
                onChange={(e) => handleDetailChange('water_level', e.target.value)}
              >
                <option value="">Select...</option>
                <option value="Ankle Deep">Ankle Deep</option>
                <option value="Knee Deep">Knee Deep</option>
                <option value="Waist Deep">Waist Deep</option>
                <option value="Above Head">Above Head</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Affected Households</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 5" 
                min="0" 
                value={details.households_affected || ''} 
                onChange={(e) => handleDetailChange('households_affected', e.target.value)} 
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">People Needing Rescue</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="e.g. 3" 
                min="0" 
                value={details.people_needing_rescue || ''} 
                onChange={(e) => handleDetailChange('people_needing_rescue', e.target.value)} 
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const selectedTypeInfo = INCIDENT_TYPES.find(it => it.value === type);

  return (
    <div className="content-body" style={{ maxWidth: '800px', paddingBottom: '80px' }}>

      <div className="glass-card" style={{ padding: '24px' }}>
        {error && (
          <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}
        {success === 'offline' && (
          <div className="alert alert-warning" style={{ fontSize: '13px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={15} /> <strong>No Internet.</strong> Your report has been saved as an Offline Draft and will auto-submit when you reconnect.
          </div>
        )}
        {success && success !== 'offline' && (
          <div className="alert alert-success" style={{ fontSize: '13px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={15} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Visual Incident Type Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>{t('incidentType')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
              {INCIDENT_TYPES.map(({ value, label, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '14px 8px',
                    borderRadius: '12px',
                    border: type === value ? `2px solid ${color}` : '2px solid var(--border-color)',
                    backgroundColor: type === value ? bg : 'var(--card-alt)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    transform: type === value ? 'scale(1.03)' : 'scale(1)',
                    boxShadow: type === value ? `0 4px 14px ${color}30` : 'none',
                  }}
                >
                  <div style={{ padding: '8px', backgroundColor: type === value ? `${color}20` : 'transparent', borderRadius: '50%', transition: 'all 0.18s' }}>
                    <Icon size={22} color={type === value ? color : 'var(--text-light)'} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: type === value ? '700' : '500', color: type === value ? color : 'var(--text-light)', letterSpacing: '0.3px' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="locationText">{t('locationLabel')}</label>
            <div className="input-icon-wrapper" style={{ marginBottom: '12px' }}>
              <input
                type="text"
                id="locationText"
                className="form-input"
                style={{ paddingRight: '40px' }}
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder={t('locationPlaceholder')}
                required
              />
              <MapPin size={18} className="input-icon-right" style={{ pointerEvents: 'none' }} />
            </div>
            <MapPicker lat={lat} lng={lng} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
          </div>

          {/* Dynamic type-specific fields */}
          {renderDynamicFields()}

          {/* Description */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="description">{t('descriptionLabel')}</label>
            <textarea
              id="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              required
            />
          </div>

          {/* Photo Upload with Preview */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('uploadPhoto')}</label>
            {photoPreview ? (
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--success-color)' }}>
                <img src={photoPreview} alt="Preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '20px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={13} color="#2ecc71" />
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: '600' }}>{(photo.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(231,76,60,0.85)', color: '#fff', border: 'none', borderRadius: '8px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="upload-drag-box" style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-light)', pointerEvents: 'none' }}>
                  <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Click to upload or drag and drop</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !type}
              style={{
                width: '100%',
                height: '48px',
                fontSize: '15px',
                fontWeight: '700',
                backgroundColor: selectedTypeInfo ? selectedTypeInfo.color : 'var(--primary-color)',
                border: 'none',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: (!type || loading) ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                'Uploading & Submitting...'
              ) : (
                <>
                  {selectedTypeInfo && <selectedTypeInfo.icon size={18} />}
                  {type ? `Submit ${type} Report` : t('submit')}
                </>
              )}
            </button>

              {isOffline && (
                <>
                  <a 
                    href="tel:911"
                    className="btn"
                    style={{
                      width: '100%', height: '48px', fontSize: '14px', fontWeight: '800',
                      backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none',
                      boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <PhoneCall size={18} /> Call 911 (Toll-Free • Zero Load Required)
                  </a>
                  <a 
                    href={`tel:${getTargetHotline()}`}
                    className="btn"
                    style={{
                      width: '100%', height: '44px', fontSize: '13px', fontWeight: '700',
                      backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none'
                    }}
                  >
                    <PhoneCall size={16} /> Call {getTargetAgencyName()} (Direct Local Line)
                  </a>
                  <a 
                    href={getSmsUri()}
                    className="btn"
                    style={{
                      width: '100%', height: '44px', fontSize: '13px', fontWeight: '700',
                      backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none'
                    }}
                  >
                    <Signal size={16} /> Send via SMS to {getTargetAgencyName()}
                  </a>
                </>
              )}

            <button
              type="button"
              onClick={() => navigate(user?.role === 'Resident' ? '/dashboard' : '/admin')}
              disabled={loading}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', padding: '6px', textDecoration: 'underline' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Offline SMS Generator Panel */}
      <div className="glass-card" style={{ marginTop: '20px', padding: '20px', borderLeft: '4px solid var(--warning-color, #f39c12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Signal size={16} color="var(--warning-color, #f39c12)" /> Offline SMS Backup
          </h3>
          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-color)' }}>
            Target: {getTargetAgencyName()}
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px', lineHeight: '1.5' }}>
          No internet or low data signal? Open in your phone SMS app or copy this complete pre-formatted emergency report directly to <strong>{getTargetAgencyName()}</strong> (requires prepaid SMS load/promo; if you have ₱0 load balance, dial <strong>911</strong> directly):
        </p>
        <textarea
          className="form-input"
          value={generateSmsText()}
          readOnly
          rows={7}
          style={{ fontFamily: 'monospace', fontSize: '12px', cursor: 'default', resize: 'none', marginBottom: '10px' }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <a
            href={getSmsUri()}
            className="btn btn-primary"
            style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none', fontWeight: '700' }}
          >
            <Signal size={15} /> Open in SMS App
          </a>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: smsCopied ? 'rgba(39,174,96,0.1)' : undefined, color: smsCopied ? '#27ae60' : undefined, transition: 'all 0.3s' }}
            onClick={handleCopySms}
          >
            {smsCopied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy SMS Template</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportIncident;

