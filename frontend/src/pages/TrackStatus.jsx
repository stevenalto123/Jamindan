import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MapDisplay from '../components/MapDisplay';
import { 
  ArrowLeft, 
  MapPin, 
  User, 
  Phone, 
  Calendar,
  Send,
  Printer
} from 'lucide-react';
import { STATUSES } from './IncidentList';

const TrackStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [incident, setIncident] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status edit states (for Admin / Responder)
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  const fetchIncidentDetail = async () => {
    try {
      const res = await axios.get(`/api/incidents/${id}`);
      setIncident(res.data.incident);
      setHistory(res.data.history);
      setNewStatus(res.data.incident.status);
    } catch (err) {
      console.error(err);
      setError('Could not fetch incident report details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentDetail();
  }, [id]);

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    setSubmittingStatus(true);
    try {
      await axios.put(`/api/incidents/${id}/status`, {
        status: newStatus,
        comment: comment || `Status updated to ${newStatus}.`
      });
      setComment('');
      await fetchIncidentDetail();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Under Review': return <span className="badge badge-review">Under Review</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Resolved': return <span className="badge badge-resolved">Resolved</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return <div className="content-body"><p>Loading details...</p></div>;
  }

  if (error || !incident) {
    return (
      <div className="content-body">
        <div className="alert alert-danger">{error || 'Incident report not found.'}</div>
        <Link to="/incidents" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back
        </Link>
      </div>
    );
  }

  const isStaff = user?.role === 'Admin' || user?.role === 'Responder';

  return (
    <div className="content-body">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <Link to="/incidents" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', height: '36px' }}>
          <ArrowLeft size={16} /> Back to list
        </Link>
        <button 
          className="btn btn-secondary" 
          onClick={() => window.print()} 
          style={{ padding: '8px 16px', fontSize: '13px', height: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Printer size={16} /> Print Report
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="responsive-grid-col">
        {/* Left Side: Basic details & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            {/* Header: Report ID */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Report ID: {incident.code}</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '700' }}>{incident.type} in Barangay {incident.reporter_barangay}</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                  {new Date(incident.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                {getStatusBadge(incident.status)}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)' }}>
                {incident.description}
              </p>
            </div>

            {incident.photo_path && (
              <div style={{ marginTop: '16px' }}>
                <img 
                  src={`http://localhost:5000${incident.photo_path}`} 
                  alt="Evidence" 
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                />
              </div>
            )}

            {/* Timeline */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 className="card-title" style={{ fontSize: '15px' }}>Status Timeline</h3>
              
              <div className="track-timeline">
                {history.map((log, index) => {
                  const isActive = log.status === incident.status && index === history.length - 1;
                  return (
                    <div key={log.id} className={`track-timeline-item ${isActive ? 'active' : ''}`}>
                      <div className="track-timeline-node"></div>
                      <div className="track-timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="track-timeline-title">{log.status}</span>
                          <span className="track-timeline-time">
                            {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <p className="track-timeline-desc">{log.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Map & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Dispatcher Actions */}
          {isStaff && (
            <div className="card" style={{ borderColor: 'rgba(75, 142, 98, 0.3)' }}>
              <h3 className="card-title">Update Status</h3>
              <form onSubmit={handleStatusUpdateSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="newStatus">New Status</label>
                  <select
                    id="newStatus"
                    className="form-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="comment">Comment</label>
                  <textarea
                    id="comment"
                    className="form-textarea"
                    style={{ minHeight: '60px' }}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide details about updates..."
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={submittingStatus} style={{ height: '40px' }}>
                  <Send size={14} />
                  {submittingStatus ? 'Updating...' : 'Log Status Update'}
                </button>
              </form>
            </div>
          )}

          {/* Location Map */}
          <div className="card">
            <h3 className="card-title">Location</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>
              📍 Barangay {incident.reporter_barangay}
            </p>
            <MapDisplay lat={incident.location_lat} lng={incident.location_lng} />
          </div>

          {/* Reporter details for dispatcher */}
          {isStaff && (
            <div className="card">
              <h3 className="card-title">Reporter Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginTop: '10px' }}>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} style={{ color: 'var(--text-light)' }} />
                  <strong>Name:</strong> {incident.reporter_name}
                </p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} style={{ color: 'var(--text-light)' }} />
                  <strong>Contact:</strong> {incident.reporter_phone}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackStatus;
