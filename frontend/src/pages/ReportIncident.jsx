import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MapPicker from '../components/MapPicker';
import { AlertTriangle, Upload, Check, MapPin } from 'lucide-react';

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
    if (!type || !description) {
      setError('Please provide incident type and description.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('type', type);
    formData.append('description', `${locationText ? `[Location Details: ${locationText}] ` : ''}${description}`);
    formData.append('location_lat', lat);
    formData.append('location_lng', lng);
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
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Report Incident</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Please provide details about the incident</p>
      </div>

      <div className="card">
        {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '10px 14px' }}>{success}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="type">Incident Type</label>
            <select
              id="type"
              className="form-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Select Incident Type</option>
              {INCIDENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="locationText">Location</label>
            <div className="input-icon-wrapper">
              <input
                type="text"
                id="locationText"
                className="form-input"
                style={{ paddingRight: '40px' }}
                value={locationText}
                onChange={(e) => setLocationText(e.target.value)}
                placeholder="Enter location or tap on map"
              />
              <MapPin size={18} className="input-icon-right" style={{ pointerEvents: 'none' }} />
            </div>
            {/* Embedded Map for picking location */}
            <div style={{ marginTop: '12px' }}>
              <MapPicker lat={lat} lng={lng} onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng); }} />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the incident..."
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Upload Photo (Optional)</label>
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
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;
