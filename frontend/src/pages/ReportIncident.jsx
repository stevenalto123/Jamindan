import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MapPicker from '../components/MapPicker';
import { AlertTriangle, Upload, Check, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const INCIDENT_TYPES = ['Fire', 'Medical', 'Flood', 'Crime', 'Accident', 'Other'];

const ReportIncident = () => {
  const [type, setType] = useState('');
  const [locationText, setLocationText] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [lat, setLat] = useState(11.4287); // Default Jamindan lat
  const [lng, setLng] = useState(122.4842); // Default Jamindan lng
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Epic Feature 3: Offline Draft Auto-Sync
  useEffect(() => {
    const handleOnline = async () => {
      const draftData = localStorage.getItem('offline_incident_draft');
      if (draftData) {
        try {
          const draft = JSON.parse(draftData);
            const formData = new FormData();
            
            let address = draft.locationText;
            try {
              const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${draft.lat}&lon=${draft.lng}`);
              if (geoRes.data && geoRes.data.display_name) {
                address = geoRes.data.display_name.split(',').slice(0, 3).join(', ');
              }
            } catch (e) {
              console.warn("Reverse geocode failed", e);
            }

            formData.append('type', draft.type);
            formData.append('description', `[Location Details: ${draft.locationText.trim()}] (OFFLINE DRAFT) ${draft.description.trim()}`);
            formData.append('location_lat', draft.lat);
            formData.append('location_lng', draft.lng);
            formData.append('location_address', address);
          
          const res = await axios.post('/api/incidents', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          localStorage.removeItem('offline_incident_draft');
          alert(`Your offline draft was successfully submitted! Report Code: ${res.data.code}`);
          navigate(`/incidents/${res.data.incidentId}`);
        } catch (err) {
          console.error('Failed to sync offline draft:', err);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    // Also check on mount in case they reloaded the page while online
    if (navigator.onLine && localStorage.getItem('offline_incident_draft')) {
      handleOnline();
    }
    
    return () => window.removeEventListener('online', handleOnline);
  }, [navigate]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size exceeds 5MB limit.');
        return;
      }
      setPhoto(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !description || !locationText.trim()) {
      setError('Please provide incident type, location, and description.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // Epic Feature 3: Offline Draft Save
    if (!navigator.onLine) {
      const draft = {
        type,
        locationText,
        description,
        lat,
        lng,
        timestamp: new Date().getTime()
      };
      localStorage.setItem('offline_incident_draft', JSON.stringify(draft));
      setSuccess('⚠️ NO INTERNET CONNECTION. Your report has been saved as an Offline Draft! It will automatically submit in the background the moment you reconnect to Wi-Fi or Cellular Data.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    
    let address = locationText;
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (geoRes.data && geoRes.data.display_name) {
        address = geoRes.data.display_name.split(',').slice(0, 3).join(', ');
      }
    } catch (e) {
      console.warn("Reverse geocode failed", e);
    }

    formData.append('type', type);
    formData.append('description', `[Location Details: ${locationText.trim()}] ${description.trim()}`);
    formData.append('location_lat', lat);
    formData.append('location_lng', lng);
    formData.append('location_address', address);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const res = await axios.post('/api/incidents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(`Report submitted successfully! Report Code: ${res.data.code}`);
      setTimeout(() => {
        navigate(`/incidents/${res.data.incidentId}`);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div className="card">
        {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '10px 14px' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="type">{t('incidentType')}</label>
            <select
              id="type"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">{t('selectType')}</option>
              {INCIDENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="locationText">{t('locationLabel')}</label>
            <div className="input-icon-wrapper">
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
            {/* Embedded Map for picking location */}
            <div style={{ marginTop: '12px' }}>
              <MapPicker lat={lat} lng={lng} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
            </div>
          </div>

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

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">{t('uploadPhoto')}</label>
            <div className="upload-drag-box">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  opacity: 0, 
                  cursor: 'pointer' 
                }}
              />
              {photo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <Check size={32} style={{ color: 'var(--success-color)' }} />
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{photo.name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({(photo.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-light)' }}>
                  <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Click to upload or drag and drop</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              style={{ height: '40px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ height: '40px', backgroundColor: 'var(--primary-color)', minWidth: '150px' }}
            >
              {loading ? 'Submitting...' : t('submit')}
            </button>
          </div>
        </form>
      </div>

      {/* Offline SMS Generator Panel */}
      <div className="card" style={{ marginTop: '24px', backgroundColor: '#fafbfc', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📶 Offline SMS Generator (Emergency Backup)
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>
          If you have poor or no internet data connection, copy the text template below and send it via regular SMS to the Municipal Hotline at <strong>0917-987-6543</strong>.
        </p>
        <textarea
          className="form-input"
          value={`JAMINDAN SOS REPORT:\nType: ${type || 'Not selected'}\nCoords: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nLocation: ${locationText || 'Pinned on map'}\nDetails: ${description || 'No description provided'}`}
          readOnly
          rows={5}
          style={{ fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#ffffff', cursor: 'default', resize: 'none', marginBottom: '12px' }}
        />
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', height: '36px', fontSize: '13px' }}
          onClick={() => {
            const smsText = `JAMINDAN SOS REPORT:\nType: ${type || 'Not selected'}\nCoords: ${lat.toFixed(5)}, ${lng.toFixed(5)}\nLocation: ${locationText || 'Pinned on map'}\nDetails: ${description || 'No description provided'}`;
            navigator.clipboard.writeText(smsText);
            alert('SMS template copied to clipboard! You can now paste it into your messaging app to send.');
          }}
        >
          📋 Copy SMS Template
        </button>
      </div>
    </div>
  );
};

export default ReportIncident;
