import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MapPicker from '../components/MapPicker';
import { AlertTriangle, Upload, Check, MapPin, Flame, HeartPulse, Droplets, WifiOff, Car, ShieldAlert, HelpCircle, Copy, Signal, PhoneCall } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const INCIDENT_TYPES = [
  { value: 'Fire',     label: 'Fire',     icon: Flame,       color: '#e74c3c', bg: 'rgba(231,76,60,0.08)'   },
  { value: 'Medical',  label: 'Medical',  icon: HeartPulse,  color: '#27ae60', bg: 'rgba(39,174,96,0.08)'   },
  { value: 'Flood',    label: 'Flood',    icon: Droplets,    color: '#2980b9', bg: 'rgba(41,128,185,0.08)'  },
  { value: 'Accident', label: 'Accident', icon: Car,         color: '#e67e22', bg: 'rgba(230,126,34,0.08)'  },
  { value: 'Crime',    label: 'Crime',    icon: ShieldAlert, color: '#8e44ad', bg: 'rgba(142,68,173,0.08)'  },
  { value: 'Other',    label: 'Other',    icon: HelpCircle,  color: '#7f8c8d', bg: 'rgba(127,140,141,0.08)' },
];

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
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navigate = useNavigate();
  const { t } = useLanguage();

  

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
      localStorage.setItem('offline_incident_draft', JSON.stringify({ type, details, locationText, description, lat, lng, timestamp: new Date().getTime() }));
      setSuccess('offline');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    let address = locationText;
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (geoRes.data && geoRes.data.display_name) address = geoRes.data.display_name.split(',').slice(0, 3).join(', ');
    } catch (e) { console.warn('Reverse geocode failed', e); }

    formData.append('type', type);
    formData.append('description', `[Location Details: ${locationText.trim()}] ${description.trim()}`);
    formData.append('location_lat', lat);
    formData.append('location_lng', lng);
    formData.append('location_address', address);
    if (Object.keys(details).length > 0) formData.append('details', JSON.stringify(details));
    if (photo) formData.append('photo', photo);

    try {
      const res = await axios.post('/api/incidents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(`Report submitted! Code: ${res.data.code}`);
      setTimeout(() => navigate(`/incidents/${res.data.incidentId}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      setLoading(false);
    }
  };

  const handleCopySms = () => {
    const smsText = `JAMINDAN SOS REPORT:\nType: ${type || 'Not selected'}\nCoords: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nLocation: ${locationText || 'Pinned on map'}\nDetails: ${description || 'No description provided'}`;
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
              <input type="number" className="form-input" placeholder="e.g. 2" min="0" onChange={(e) => handleDetailChange('structures_affected', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Visible Fire / Smoke?</label>
              <select className="form-select" onChange={(e) => handleDetailChange('visible_fire', e.target.value)}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Possible Trapped Persons?</label>
              <select className="form-select" onChange={(e) => handleDetailChange('trapped_persons', e.target.value)}>
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
              <input type="number" className="form-input" placeholder="e.g. 2" min="0" onChange={(e) => handleDetailChange('victims', e.target.value)} />
            </div>
            {type === 'Accident' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Vehicles Involved</label>
                <input type="number" className="form-input" placeholder="e.g. 2" min="0" onChange={(e) => handleDetailChange('vehicles_involved', e.target.value)} />
              </div>
            )}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Condition / Injuries</label>
              <input type="text" className="form-input" placeholder="e.g. Unconscious, bleeding" onChange={(e) => handleDetailChange('injuries', e.target.value)} />
            </div>
            {type === 'Accident' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Road Obstruction?</label>
                <select className="form-select" onChange={(e) => handleDetailChange('road_obstruction', e.target.value)}>
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
              <select className="form-select" onChange={(e) => handleDetailChange('water_level', e.target.value)}>
                <option value="">Select...</option>
                <option value="Ankle Deep">Ankle Deep</option>
                <option value="Knee Deep">Knee Deep</option>
                <option value="Waist Deep">Waist Deep</option>
                <option value="Above Head">Above Head</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Affected Households</label>
              <input type="number" className="form-input" placeholder="e.g. 5" min="0" onChange={(e) => handleDetailChange('households_affected', e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">People Needing Rescue</label>
              <input type="number" className="form-input" placeholder="e.g. 3" min="0" onChange={(e) => handleDetailChange('people_needing_rescue', e.target.value)} />
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
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
                      backgroundColor: '#e11d48', color: 'white', border: 'none', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <PhoneCall size={18} /> Call 911 (Free)
                  </a>
                  <a 
                    href={`sms:09123456789?body=${encodeURIComponent(`EMERGENCY REPORT\nType: ${type || 'Unknown'}\nLocation: ${locationText || 'Unknown'}\nDetails: ${description || 'None'}`)}`}
                    className="btn"
                    style={{
                      width: '100%', height: '48px', fontSize: '14px', fontWeight: '700',
                      backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none'
                    }}
                  >
                    <Signal size={18} /> Send via SMS (Requires Load)
                  </a>
                </>
              )}

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
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
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Signal size={16} color="var(--warning-color, #f39c12)" /> Offline SMS Backup
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px', lineHeight: '1.5' }}>
          No internet? Copy this template and send via SMS to the Municipal Hotline: <strong>0917-987-6543</strong>
        </p>
        <textarea
          className="form-input"
          value={`JAMINDAN SOS REPORT:\nType: ${type || 'Not selected'}\nCoords: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nLocation: ${locationText || 'Pinned on map'}\nDetails: ${description || 'No description provided'}`}
          readOnly
          rows={5}
          style={{ fontFamily: 'monospace', fontSize: '12px', cursor: 'default', resize: 'none', marginBottom: '10px' }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', height: '38px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: smsCopied ? 'rgba(39,174,96,0.1)' : undefined, color: smsCopied ? '#27ae60' : undefined, transition: 'all 0.3s' }}
          onClick={handleCopySms}
        >
          {smsCopied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy SMS Template</>}
        </button>
      </div>
    </div>
  );
};

export default ReportIncident;
