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
  Printer,
  Navigation,
  Activity,
  AlertTriangle,
  Tag
} from 'lucide-react';
import { STATUSES } from './IncidentList';
import { useSystem } from '../context/SystemContext';

const TrackStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [incident, setIncident] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Responder tracking state
  const [responderLat, setResponderLat] = useState(null);
  const [responderLng, setResponderLng] = useState(null);
  
  // Status edit states (for Admin / Responder)
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);
  
  const { settings } = useSystem();
  const isMciActive = settings?.mci_mode;

  const fetchIncidentDetail = async () => {
    try {
      const res = await axios.get(`/api/incidents/${id}`);
      setIncident(res.data.incident);
      setHistory(res.data.history);
      // Wait to ensure the status isn't incorrectly mapped if it's an old one
      const oldStatus = res.data.incident.status;
      setNewStatus(STATUSES.includes(oldStatus) ? oldStatus : 'Acknowledged');
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

  // Track Responder's own location
  useEffect(() => {
    if (user?.role === 'Responder' || user?.role === 'Admin') {
      const getLoc = () => {
        const fallbackToIP = () => {
          axios.get('https://ipapi.co/json/')
            .then(res => {
              if (res.data && res.data.latitude && res.data.longitude) {
                setResponderLat(res.data.latitude);
                setResponderLng(res.data.longitude);
              } else {
                throw new Error("ipapi failed");
              }
            })
            .catch(() => {
              axios.get('https://ipinfo.io/json')
                .then(res2 => {
                  if (res2.data && res2.data.loc) {
                    const [lat, lng] = res2.data.loc.split(',').map(Number);
                    setResponderLat(lat);
                    setResponderLng(lng);
                  }
                })
                .catch(() => {});
            });
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setResponderLat(pos.coords.latitude);
              setResponderLng(pos.coords.longitude);
            },
            (err) => fallbackToIP(),
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          fallbackToIP();
        }
      };
      
      getLoc();
      const interval = setInterval(getLoc, 10000); // update every 10s
      return () => clearInterval(interval);
    }
  }, [user]);

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

  const handleTriageUpdate = async (color) => {
    try {
      await axios.put(`/api/incidents/${id}/triage`, { triage_tag: color });
      await fetchIncidentDetail();
    } catch (err) {
      alert("Failed to update triage tag");
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

  // Parse structured details
  let parsedDetails = null;
  if (incident?.details) {
    try {
      parsedDetails = typeof incident.details === 'string' ? JSON.parse(incident.details) : incident.details;
    } catch (e) {
      console.warn("Failed to parse incident details");
    }
  }

  const getRecommendedResources = () => {
    if (!incident) return [];
    const resources = [];
    
    if (incident.type === 'Medical' || incident.type === 'Accident') {
      resources.push('Ambulance / Emergency Medical Vehicle');
      if (parsedDetails?.victims > 1) {
        resources.push(`${parsedDetails.victims}x Stretchers/Backboards`);
        resources.push('Mass Casualty Protocol (Additional Personnel)');
      } else {
        resources.push('1x Stretcher');
        resources.push('Standard Trauma/First-Aid Kit');
      }
      
      if (incident.type === 'Accident') {
        resources.push('Traffic Cones & High-Visibility Vests');
        if (parsedDetails?.road_obstruction === 'Yes') {
          resources.push('Traffic Enforcers for routing');
        }
      }
    }
    
    if (incident.type === 'Fire') {
      resources.push('Fire Truck(s)');
      resources.push('SCBA (Self-Contained Breathing Apparatus)');
      if (parsedDetails?.trapped_persons === 'Yes') {
        resources.push('Search and Rescue Equipment (Breaching tools)');
        resources.push('Ambulance on standby for casualties');
      }
    }
    
    if (incident.type === 'Flood') {
      resources.push('Rescue Boat / Rubber Boat');
      resources.push('Life Vests & Throw Bags');
      if (parsedDetails?.people_needing_rescue > 0) {
        resources.push('Evacuation Transport Vehicle (6x6 Truck)');
      }
    }
    
    if (resources.length === 0) {
      resources.push('Standard Patrol/Response Vehicle');
      resources.push('Radio / Communication Equipment');
    }
    return resources;
  };

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
                <h2 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '700' }}>
                  {incident.type} {incident.location_address ? `- ${incident.location_address}` : (incident.location_lat ? '- GPS Location Only' : `in Barangay ${incident.reporter_barangay}`)}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                  {new Date(incident.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div>
                {getStatusBadge(incident.status)}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px' }}>Additional Description</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)', margin: 0 }}>
                  {incident.description}
                </p>
              </div>

              {parsedDetails && Object.keys(parsedDetails).length > 0 && (
                <div style={{ backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '10px' }}>Structured Incident Data</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {Object.entries(parsedDetails).map(([key, value]) => (
                      <div key={key}>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-main)' }}>{value || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {incident.photo_path && (
              <div style={{ marginTop: '16px' }}>
                <img 
                  src={`https://jamindan.onrender.com${incident.photo_path}`} 
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
          
          {/* Triage Tag Panel (Staff + MCI Mode Only) */}
          {isStaff && isMciActive && (
            <div className="card" style={{ border: '2px solid #c0392b' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0392b' }}>
                <Tag size={18} /> MCI Triage Tagging
              </h3>
              <p style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '16px' }}>MCI Protocol is active. Assign a triage priority to this incident:</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button 
                  onClick={() => handleTriageUpdate('Red')}
                  style={{ padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: incident.triage_tag === 'Red' ? '#c0392b' : '#f9ebea', color: incident.triage_tag === 'Red' ? 'white' : '#c0392b', border: '2px solid #c0392b' }}>
                  RED (Immediate)
                </button>
                <button 
                  onClick={() => handleTriageUpdate('Yellow')}
                  style={{ padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: incident.triage_tag === 'Yellow' ? '#f1c40f' : '#fef9e7', color: incident.triage_tag === 'Yellow' ? 'white' : '#f39c12', border: '2px solid #f1c40f' }}>
                  YELLOW (Delayed)
                </button>
                <button 
                  onClick={() => handleTriageUpdate('Green')}
                  style={{ padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: incident.triage_tag === 'Green' ? '#2ecc71' : '#eafaf1', color: incident.triage_tag === 'Green' ? 'white' : '#27ae60', border: '2px solid #2ecc71' }}>
                  GREEN (Minor)
                </button>
                <button 
                  onClick={() => handleTriageUpdate('Black')}
                  style={{ padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: incident.triage_tag === 'Black' ? '#2c3e50' : '#eaeded', color: incident.triage_tag === 'Black' ? 'white' : '#34495e', border: '2px solid #2c3e50' }}>
                  BLACK (Deceased)
                </button>
              </div>
            </div>
          )}

          {/* Resource Recommendations (For Staff) */}
          {isStaff && (
            <div className="card" style={{ backgroundColor: 'var(--card-alt)', borderColor: 'rgba(231, 76, 60, 0.2)' }}>
              <h3 className="card-title" style={{ color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎒 Recommended Resources
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>
                System suggestions based on reported incident data. Verify with team lead before deployment.
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getRecommendedResources().map((item, idx) => (
                  <li key={idx}><strong>{item}</strong></li>
                ))}
              </ul>
            </div>
          )}

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
              📍 {incident.location_address ? incident.location_address : (incident.location_lat ? 'Current GPS Location' : `Barangay ${incident.reporter_barangay}`)}
            </p>
            {isStaff && (
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${incident.location_lat},${incident.location_lng}&dir_action=navigate`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px', padding: '12px' }}
              >
                <Navigation size={18} /> Navigate to Scene
              </a>
            )}
            <MapDisplay 
              lat={incident.location_lat} 
              lng={incident.location_lng} 
              responderLat={responderLat}
              responderLng={responderLng}
            />
          </div>

          {/* Reporter details for dispatcher */}
          {isStaff && (
            <>
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

              {/* PARAMEDIC MEDICAL HANDOFF */}
              <div className="card" style={{ borderLeft: '4px solid #e74c3c', backgroundColor: '#fff5f5' }}>
                <h3 className="card-title" style={{ color: '#c0392b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={18} /> Paramedic Medical Handoff
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginTop: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ffcccc' }}>
                      <div style={{ fontSize: '11px', color: '#7f8c8d', textTransform: 'uppercase' }}>Blood Type</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#c0392b' }}>{incident.reporter_blood_type || 'Unknown'}</div>
                    </div>
                    <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ffcccc' }}>
                      <div style={{ fontSize: '11px', color: '#7f8c8d', textTransform: 'uppercase' }}>Allergies</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: incident.reporter_allergies ? '#d35400' : '#7f8c8d' }}>
                        {incident.reporter_allergies || 'None listed'}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ffcccc' }}>
                    <div style={{ fontSize: '11px', color: '#7f8c8d', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} color="#e67e22" /> Medical Conditions
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: incident.reporter_medical_conditions ? '#d35400' : '#7f8c8d', marginTop: '4px' }}>
                      {incident.reporter_medical_conditions || 'None listed'}
                    </div>
                  </div>

                  {(incident.reporter_emergency_contact_name || incident.reporter_emergency_contact_phone) && (
                    <div style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #ffcccc' }}>
                      <div style={{ fontSize: '11px', color: '#7f8c8d', textTransform: 'uppercase' }}>Emergency Contact</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50', marginTop: '4px' }}>
                        {incident.reporter_emergency_contact_name} {incident.reporter_emergency_contact_phone ? `(${incident.reporter_emergency_contact_phone})` : ''}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackStatus;
