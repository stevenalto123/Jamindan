import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../context/AuthContext';
import MapDisplay from '../components/MapDisplay';
import LiveStreamBroadcaster from '../components/LiveStreamBroadcaster';
import LiveStreamViewer from '../components/LiveStreamViewer';
import IncidentChat from '../components/IncidentChat';
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
  Video,
  Copy,
  CheckCircle2,
  Users,
  Shield
} from 'lucide-react';
import { STATUSES } from './IncidentList';

const TrackStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [incident, setIncident] = useState(null);
  const [history, setHistory] = useState([]);
  const [household, setHousehold] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Responder tracking state
  const [responderLat, setResponderLat] = useState(null);
  const [responderLng, setResponderLng] = useState(null);
  
  // Status edit states (for Admin / Responder)
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [responseNotes, setResponseNotes] = useState('');
  const [resourcesUsed, setResourcesUsed] = useState('');
  const [showActionFields, setShowActionFields] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Live Stream State
  const [showLiveStream, setShowLiveStream] = useState(false);

  const isStaff = user?.role === 'Admin' || user?.role === 'Responder';

  const [respondersList, setRespondersList] = useState([]);
  const [selectedResponder, setSelectedResponder] = useState('');
  const [vehiclesList, setVehiclesList] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Agency Coordination State
  const [leadAgency, setLeadAgency] = useState('MDRRMO');
  const [agencyNotes, setAgencyNotes] = useState('');
  const [savingAgency, setSavingAgency] = useState(false);

  const fetchVehicles = () => {
    if (user?.role === 'Admin') {
      axios.get('/api/vehicles')
        .then(res => setVehiclesList(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      axios.get('/api/users?role=Responder&limit=100')
        .then(res => setRespondersList(res.data.users || []))
        .catch(err => console.error(err));
      fetchVehicles();
    }
  }, [user]);

  // Printing State (react-to-print v3 requires contentRef)
  const printRef = useRef(null);
  const reactToPrintFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Jamindan_MDRRMO_Incident_Report_${incident?.code || id}`,
    onPrintError: () => window.print(),
  });
  const handlePrint = () => {
    if (printRef.current) {
      reactToPrintFn();
    } else {
      window.print();
    }
  };

  const fetchIncidentDetail = async () => {
    try {
      const res = await axios.get(`/api/incidents/${id}?_t=${Date.now()}`);
      const inc = res.data.incident;
      setIncident(inc);
      setHistory(res.data.history);
      setHousehold(res.data.reporterHousehold || []);
      setLeadAgency(inc.lead_agency || 'MDRRMO');
      setAgencyNotes(inc.agency_notes || '');
      setResponseNotes(inc.response_notes || '');
      setResourcesUsed(inc.resources_used || '');
      // Wait to ensure the status isn't incorrectly mapped if it's an old one
      const oldStatus = inc.status;
      setNewStatus(STATUSES.includes(oldStatus) ? oldStatus : 'Acknowledged');

      // For Admin / Resident tabs, show the assigned responder's real live location from DB
      if (user?.role !== 'Responder' && inc.responder_lat && inc.responder_lng) {
        setResponderLat(parseFloat(inc.responder_lat));
        setResponderLng(parseFloat(inc.responder_lng));
      }
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

  // Listen for real-time status updates
  useEffect(() => {
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    
    // Use the same incident room used for chat
    socket.emit('join-incident-room', id);

    socket.on('incident-status-updated', (data) => {
      // Refresh the page data if the update belongs to the current incident
      // We check data.incidentId just in case, though the room ensures it
      if (String(data.incidentId) === String(id)) {
        fetchIncidentDetail();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // Track Responder's real live GPS location (works both inside and outside Jamindan)
  useEffect(() => {
    if (user?.role === 'Responder') {
      const getLoc = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const realLat = pos.coords.latitude;
              const realLng = pos.coords.longitude;
              setResponderLat(realLat);
              setResponderLng(realLng);
              axios.put('/api/auth/location', { latitude: realLat, longitude: realLng }).catch(() => {});
            },
            (err) => console.warn("GPS location unavailable", err),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        }
      };
      
      getLoc();
      const interval = setInterval(getLoc, 10000); // update every 10s
      return () => clearInterval(interval);
    } else if (user && id) {
      // For Admin and Resident tabs: poll the assigned Responder's real location
      const pollResponderLoc = () => {
        axios.get(`/api/incidents/${id}/responder-location`)
          .then(res => {
            if (res.data?.lat && res.data?.lng) {
              setResponderLat(parseFloat(res.data.lat));
              setResponderLng(parseFloat(res.data.lng));
            }
          })
          .catch(() => {});
      };
      pollResponderLoc();
      const interval = setInterval(pollResponderLoc, 10000);
      return () => clearInterval(interval);
    }
  }, [user, id]);

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus) return;

    setSubmittingStatus(true);
    try {
      await axios.put(`/api/incidents/${id}/status`, {
        status: newStatus,
        comment: comment || `Status updated to ${newStatus}.`,
        response_notes: responseNotes,
        resources_used: resourcesUsed
      });
      setComment('');
      await fetchIncidentDetail();
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge" style={{ backgroundColor: '#f59e0b', color: 'white' }}>Pending</span>;
      case 'Acknowledged': return <span className="badge" style={{ backgroundColor: '#3b82f6', color: 'white' }}>Acknowledged</span>;
      case 'Responding': return <span className="badge" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>Responding</span>;
      case 'On Scene': return <span className="badge" style={{ backgroundColor: '#10b981', color: 'white' }}>On Scene</span>;
      case 'Resolved': return <span className="badge" style={{ backgroundColor: '#059669', color: 'white' }}>Resolved</span>;
      case 'False Alarm': return <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white' }}>False Alarm</span>;
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

  const handleAssignResponder = async (e) => {
    e.preventDefault();
    if (!selectedResponder) return;
    setAssigning(true);
    try {
      await axios.put(`/api/incidents/${id}/assign`, {
        responder_id: selectedResponder,
        vehicle_id: selectedVehicle || null
      });
      setSelectedResponder('');
      setSelectedVehicle('');
      alert('Responder successfully dispatched!');
      await fetchIncidentDetail();
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to assign responder.');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateAgency = async (e) => {
    e.preventDefault();
    setSavingAgency(true);
    try {
      await axios.put(`/api/incidents/${id}/agency`, {
        lead_agency: leadAgency,
        agency_notes: agencyNotes
      });
      alert('Agency coordination updated successfully!');
      await fetchIncidentDetail();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update agency coordination.');
    } finally {
      setSavingAgency(false);
    }
  };

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

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  // Status index for the stepper
  const statusFlow = ['Pending', 'Acknowledged', 'Responding', 'On Scene', 'Resolved'];
  const currentIndex = statusFlow.indexOf(incident.status);

  // Check if we should show live stream to resident
  const canResidentSeeStream = incident.status !== 'Pending' && incident.status !== 'Resolved' && incident.status !== 'False Alarm';

  // Check if resolved to show closure summary
  const isResolved = incident.status === 'Resolved';
  const closureComment = isResolved ? [...(history || [])].reverse().find(h => h.status === 'Resolved')?.comment : null;

  return (
    <div className="content-body" ref={printRef} style={{ maxWidth: '1120px' }}>
      <style>{`
        .print-only { display: none !important; }
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
          .content-body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; background-color: #fff !important; color: #000 !important; }
        }
      `}</style>

      {/* Official Government Header (Visible on PRINT / PDF) */}
      <div className="print-only" style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #dc2626', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <img src="/logo.png" alt="Jamindan Seal" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1.2px', color: '#475569' }}>
              Republic of the Philippines • Province of Capiz
            </div>
            <h1 style={{ margin: '3px 0', fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.5px' }}>
              MUNICIPALITY OF JAMINDAN
            </h1>
            <div style={{ fontSize: '13px', fontWeight: '800', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Municipal Disaster Risk Reduction & Management Office (MDRRMO)
            </div>
          </div>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', marginTop: '10px', textTransform: 'uppercase' }}>
          Official Emergency Incident Report — #{incident.code} ({incident.status})
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
        <Link to="/incidents" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', height: '36px' }}>
          <ArrowLeft size={16} /> Back to list
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          {user?.role !== 'Responder' && (
            <button onClick={copyLink} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', height: '36px' }}>
              <Copy size={16} /> Copy Link
            </button>
          )}
          {user?.role === 'Admin' && (
            <button type="button" onClick={handlePrint} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '13px', height: '36px', cursor: 'pointer' }}>
              <Printer size={16} /> Download Official PDF
            </button>
          )}
        </div>
      </div>

      {/* Progress Stepper */}
      {currentIndex >= 0 && incident.status !== 'False Alarm' && (
        <div className="card no-print" style={{ marginBottom: '20px', padding: '18px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '4px', backgroundColor: '#e2e8f0', zIndex: 1, transform: 'translateY(-50%)' }}>
              <div style={{ width: `${(currentIndex / (statusFlow.length - 1)) * 100}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.5s ease' }}></div>
            </div>
            {statusFlow.map((step, idx) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, position: 'relative', width: '20%', minWidth: '60px' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  backgroundColor: idx <= currentIndex ? 'var(--primary-color)' : '#fff',
                  border: `3px solid ${idx <= currentIndex ? 'var(--primary-color)' : '#e2e8f0'}`,
                  color: idx <= currentIndex ? '#fff' : '#cbd5e1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '14px', transition: 'all 0.3s'
                }}>
                  {idx < currentIndex ? <CheckCircle2 size={18} /> : (idx + 1)}
                </div>
                <div style={{ fontSize: '11px', lineHeight: '1.2', fontWeight: idx === currentIndex ? 'bold' : 'normal', color: idx <= currentIndex ? 'var(--text-main)' : 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-word' }}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closure Summary & Post-Incident Action Report */}
      {(isResolved || incident.response_notes || incident.resources_used) && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--border-color)' }}>
          <h3 className="card-title" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> {isResolved ? 'Official Closure & Post-Incident Action Report' : 'On-Scene Responder Action Log'}
          </h3>
          {closureComment && (
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-main)' }}>
              <strong>Closure Note:</strong> {closureComment}
            </p>
          )}
          {incident.response_notes && (
            <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <strong>Action Taken on Scene:</strong> {incident.response_notes}
            </p>
          )}
          {incident.resources_used && (
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.5 }}>
              <strong>Equipment & Resources Deployed:</strong> {incident.resources_used}
            </p>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '20px', alignItems: 'start' }} className="responsive-grid-col">
        {/* Left Side: Incident Overview, Coordination & Reporter Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card" style={{ marginBottom: 0 }}>
            {/* Header: Report ID */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>Report ID: {incident.code}</span>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '6px', 
                    fontSize: '11px', 
                    fontWeight: '700', 
                    backgroundColor: 'var(--primary-light)', 
                    color: 'var(--primary-color)'
                  }}>
                    Lead: {incident.lead_agency || 'MDRRMO'}
                  </span>
                </div>
                <h2 style={{ margin: '6px 0 4px 0', fontSize: '18px', fontWeight: '700' }}>
                  {incident.type} {incident.location_address ? `— ${incident.location_address}` : (incident.location_lat ? '— GPS Location' : `in Barangay ${incident.reporter_barangay}`)}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block' }}>
                  {new Date(incident.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {getStatusBadge(incident.status)}
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '4px', letterSpacing: '0.4px' }}>Incident Description</h4>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-main)', margin: 0 }}>
                  {incident.description}
                </p>
              </div>

              {parsedDetails && Object.keys(parsedDetails).length > 0 && (
                <div style={{ backgroundColor: 'var(--card-alt)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-light)', marginBottom: '8px', letterSpacing: '0.4px' }}>Structured Incident Data</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.entries(parsedDetails).map(([key, value]) => (
                      <div key={key}>
                        <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)' }}>{value || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inter-Agency Coordination & Notes */}
              <div style={{ marginTop: '14px', backgroundColor: 'var(--card-alt)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-main)', margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={14} color="var(--primary-color)" /> Inter-Agency Operational Coordination
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary-color)' }}>
                    {incident.lead_agency || 'MDRRMO'} Lead
                  </span>
                </div>
                {incident.responder_id && (
                  <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: '0 0 4px 0', fontWeight: '600' }}>
                    Primary Responder: <strong>{incident.responder_name || 'Responder'}</strong> {incident.responder_phone ? `(${incident.responder_phone})` : ''}
                  </p>
                )}
                {incident.vehicle_name && (
                  <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: '0 0 4px 0', fontWeight: '600' }}>
                    Assigned Vehicle: <strong>{incident.vehicle_name}</strong> ({incident.vehicle_type} • {incident.vehicle_agency})
                  </p>
                )}
                <p style={{ fontSize: '12px', color: incident.agency_notes ? 'var(--text-main)' : 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                  {incident.agency_notes ? incident.agency_notes : 'No specific inter-agency handoff notes recorded yet.'}
                </p>

                {isStaff && (
                  <form onSubmit={handleUpdateAgency} className="no-print" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Lead Agency</label>
                        <select 
                          value={leadAgency} 
                          onChange={e => setLeadAgency(e.target.value)}
                          className="form-select"
                          style={{ height: '34px', fontSize: '12px', padding: '0 8px' }}
                        >
                          <option value="MDRRMO">MDRRMO (Rescue)</option>
                          <option value="BFP">BFP (Fire)</option>
                          <option value="RHU">RHU (Medical)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Agency Handoff Notes</label>
                        <input 
                          type="text" 
                          value={agencyNotes} 
                          onChange={e => setAgencyNotes(e.target.value)}
                          placeholder="e.g. Requesting RHU ambulance..."
                          className="form-input"
                          style={{ height: '34px', fontSize: '12px' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                      {/* Compact PNP Quick Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <a 
                          href="tel:09086415589" 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 10px', height: '28px', fontSize: '11px', textDecoration: 'none' }}
                        >
                          <Phone size={12} /> PNP (0908-641-5589)
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const alertMsg = `[MDRRMO EMERGENCY ALERT] Incident #${incident.code} (${incident.type}) at ${incident.location_address || (incident.reporter_barangay ? `Brgy. ${incident.reporter_barangay}` : 'Jamindan')}. Details: ${incident.description}. Requesting PNP assistance / scene control.`;
                            navigator.clipboard.writeText(alertMsg);
                            alert('Copied PNP SMS dispatch text to clipboard!');
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', height: '28px', fontSize: '11px' }}
                        >
                          <Copy size={12} /> Copy PNP SMS
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const pnpEntry = `[PNP Referral] MDRRMO notified Jamindan PNP Station (0908-641-5589) at ${timeStr}.`;
                            setAgencyNotes(prev => prev ? `${prev} | ${pnpEntry}` : pnpEntry);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 10px', height: '28px', fontSize: '11px' }}
                        >
                          + Log PNP Referral
                        </button>
                      </div>

                      <button type="submit" disabled={savingAgency} className="btn btn-primary" style={{ height: '30px', fontSize: '12px', padding: '0 14px', fontWeight: '600' }}>
                        {savingAgency ? 'Saving...' : 'Save Coordination'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {incident.photo_path && (
              <div style={{ marginTop: '14px' }}>
                <img 
                  src={incident.photo_path?.startsWith('http') ? incident.photo_path : `https://jamindan.onrender.com${incident.photo_path}`} 
                  alt="Evidence" 
                  style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                />
              </div>
            )}

            {/* Timeline */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <h3 className="card-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Status Timeline</h3>
              
              <div className="track-timeline">
                {(history || []).map((log, index) => {
                  const isActive = log.status === incident.status && index === history.length - 1;
                  return (
                    <div key={log.id} className={`track-timeline-item ${isActive ? 'active' : ''}`}>
                      <div className="track-timeline-node"></div>
                      <div className="track-timeline-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="track-timeline-title">{log.status}</span>
                          <span className="track-timeline-time" style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                              {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          </span>
                        </div>
                        <p className="track-timeline-desc" style={{ marginTop: '4px' }}>{log.comment}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Unified Reporter & Medical Profile Card (Clean, calm palette) */}
          {isStaff && (
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <User size={17} color="var(--primary-color)" /> Reporter & Medical Profile
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '13px', marginTop: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block' }}>Reporter Name</span>
                  <strong style={{ color: 'var(--text-main)' }}>{incident.reporter_name}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)', display: 'block' }}>Contact Number</span>
                  <strong style={{ color: 'var(--text-main)' }}>{incident.reporter_phone}</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '12px' }}>
                <div style={{ backgroundColor: 'var(--card-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>Blood Type</div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>{incident.reporter_blood_type || 'Unknown'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--card-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>Allergies</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>{incident.reporter_allergies || 'None listed'}</div>
                </div>
                <div style={{ backgroundColor: 'var(--card-alt)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>Medical Conditions</div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>{incident.reporter_medical_conditions || 'None listed'}</div>
                </div>
              </div>

              {(incident.reporter_emergency_contact_name || incident.reporter_emergency_contact_phone) && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-light)' }}>
                  Emergency Contact: <strong style={{ color: 'var(--text-main)' }}>{incident.reporter_emergency_contact_name} {incident.reporter_emergency_contact_phone ? `(${incident.reporter_emergency_contact_phone})` : ''}</strong>
                </div>
              )}

              {household && household.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="var(--primary-color)" /> Household Members ({household.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {household.map(member => (
                      <div key={member.id} style={{ backgroundColor: 'var(--card-alt)', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                        <strong>{member.full_name}</strong>
                        <span style={{ color: 'var(--text-light)' }}>{member.age} yrs • {member.gender}{member.medical_notes ? ` • ${member.medical_notes}` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Location Map, Dispatch & Status Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Location Map (Top of Right Column for immediate visual balance) */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '15px' }}>Incident Location</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '2px 0 0 0' }}>
                  📍 {incident.location_address ? incident.location_address : (incident.location_lat ? 'Current GPS Location' : `Barangay ${incident.reporter_barangay}`)}
                </p>
              </div>
              {isStaff && (
                <a 
                  href={`https://www.google.com/maps/dir/?api=1${responderLat && responderLng ? `&origin=${responderLat},${responderLng}` : ''}&destination=${incident.location_lat},${incident.location_lng}&travelmode=driving&dir_action=navigate`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary no-print"
                  style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                >
                  <Navigation size={14} /> Navigate to Scene
                </a>
              )}
            </div>
            <MapDisplay 
              lat={incident.location_lat} 
              lng={incident.location_lng} 
              responderLat={responderLat}
              responderLng={responderLng}
              onResponderMove={user?.role === 'Responder' ? (newLat, newLng) => {
                setResponderLat(newLat);
                setResponderLng(newLng);
                axios.put('/api/auth/location', { latitude: newLat, longitude: newLng }).catch(() => {});
              } : null}
            />
          </div>

          {/* Live Video Streaming Section */}
          {user?.role === 'Resident' && canResidentSeeStream && (
            <div className="card no-print" style={{ marginBottom: 0 }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', fontSize: '15px' }}>
                <Video size={18} /> Live Incident Broadcast Active
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '12px' }}>
                Your camera is securely streaming live video to the Command Center to assist responders.
              </p>
              <LiveStreamBroadcaster incidentId={id} />
            </div>
          )}

          {isStaff && canResidentSeeStream && (
            <div className="card no-print" style={{ backgroundColor: showLiveStream ? '#000' : 'var(--card-bg)', marginBottom: 0, padding: showLiveStream ? '16px' : '12px' }}>
              {!showLiveStream ? (
                <button 
                  onClick={() => setShowLiveStream(true)}
                  className="btn btn-primary btn-full"
                  style={{ height: '38px', fontSize: '13px' }}
                >
                  <Video size={16} /> View Live Scene Feed
                </button>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 className="card-title" style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <Video size={16} /> Resident Live Feed
                    </h3>
                    <button onClick={() => setShowLiveStream(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', opacity: 0.7 }}>Close</button>
                  </div>
                  <LiveStreamViewer incidentId={id} />
                </>
              )}
            </div>
          )}

          {/* Dispatcher Actions */}
          {user?.role === 'Admin' && (
            <div className="card no-print" style={{ marginBottom: 0 }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <Navigation size={16} color="var(--primary-color)" /> Dispatch Responder & Vehicle
              </h3>
              
              {incident.responder_id && (
                <div style={{ padding: '10px 12px', backgroundColor: 'var(--card-alt)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px', fontSize: '12px' }}>
                  <div style={{ color: 'var(--text-main)' }}>
                    <strong>Primary Assigned:</strong> {incident.responder_name || 'Responder'} ({incident.responder_phone || 'No Phone'})
                  </div>
                  {incident.vehicle_name && (
                    <div style={{ marginTop: '4px', color: 'var(--text-main)' }}>
                      <strong>Assigned Vehicle:</strong> {incident.vehicle_name} ({incident.vehicle_type} • {incident.vehicle_agency})
                    </div>
                  )}
                  {incident.agency_notes && incident.agency_notes.includes('[Backup Dispatched:') && (
                    <div style={{ marginTop: '4px', color: 'var(--primary-color)', fontWeight: '600' }}>
                      {incident.agency_notes.split('|').filter(n => n.includes('[Backup Dispatched:')).join(' • ')}
                    </div>
                  )}
                </div>
              )}

              {incident.status !== 'Resolved' && (
                <form onSubmit={handleAssignResponder}>
                  <div className="form-group" style={{ marginBottom: '10px' }}>
                    <label className="form-label" htmlFor="responderSelect" style={{ fontSize: '12px' }}>
                      {incident.responder_id ? 'Additional / Backup Responder' : 'Select Responder (By Agency)'}
                    </label>
                    <select
                      id="responderSelect"
                      className="form-select"
                      style={{ height: '36px', fontSize: '13px' }}
                      value={selectedResponder}
                      onChange={(e) => setSelectedResponder(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Responder by Agency --</option>
                      {respondersList.filter(r => r.agency_type === 'BFP').length > 0 && (
                        <optgroup label="Bureau of Fire Protection (BFP)">
                          {respondersList.filter(r => r.agency_type === 'BFP').map(r => (
                            <option key={r.id} value={r.id}>{r.full_name} (BFP)</option>
                          ))}
                        </optgroup>
                      )}
                      {respondersList.filter(r => r.agency_type === 'RHU').length > 0 && (
                        <optgroup label="Rural Health Unit / Medical (RHU)">
                          {respondersList.filter(r => r.agency_type === 'RHU').map(r => (
                            <option key={r.id} value={r.id}>{r.full_name} (RHU)</option>
                          ))}
                        </optgroup>
                      )}
                      {respondersList.filter(r => !['BFP', 'RHU'].includes(r.agency_type)).length > 0 && (
                        <optgroup label="Jamindan Response Unit (MDRRMO)">
                          {respondersList.filter(r => !['BFP', 'RHU'].includes(r.agency_type)).map(r => (
                            <option key={r.id} value={r.id}>{r.full_name} ({r.agency_type || 'MDRRMO'})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" htmlFor="vehicleSelect" style={{ fontSize: '12px' }}>
                      Emergency Vehicle (Optional — Auto-Syncs Fleet)
                    </label>
                    <select
                      id="vehicleSelect"
                      className="form-select"
                      style={{ height: '36px', fontSize: '13px' }}
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                    >
                      <option value="">-- No Vehicle / Personnel Only --</option>
                      {vehiclesList.map(v => (
                        <option key={v.id} value={v.id} disabled={v.status === 'Maintenance'}>
                          [{v.agency}] {v.name} ({v.type}) — {v.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={assigning || !selectedResponder} style={{ height: '36px', fontSize: '13px' }}>
                    {assigning
                      ? 'Dispatching...'
                      : incident.responder_id
                        ? 'Dispatch Additional / Backup Unit'
                        : 'Dispatch Responder'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Update Status Card (Clean & Compact) */}
          {isStaff && (
            <div className="card no-print" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '15px' }}>Update Status</h3>
                <button
                  type="button"
                  onClick={() => setShowActionFields(prev => !prev)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {showActionFields || newStatus === 'Resolved' || newStatus === 'On Scene'
                    ? 'Hide Action Report Fields'
                    : '+ Add Action / Resource Log'}
                </button>
              </div>

              <form onSubmit={handleStatusUpdateSubmit}>
                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" htmlFor="newStatus" style={{ fontSize: '12px' }}>New Status</label>
                  <select
                    id="newStatus"
                    className="form-select"
                    style={{ height: '36px', fontSize: '13px' }}
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    required
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '10px' }}>
                  <label className="form-label" htmlFor="comment" style={{ fontSize: '12px' }}>Timeline Comment</label>
                  <textarea
                    id="comment"
                    className="form-textarea"
                    style={{ minHeight: '50px', fontSize: '13px' }}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Provide brief status update details..."
                  />
                </div>

                {(showActionFields || newStatus === 'Resolved' || newStatus === 'On Scene') && (
                  <div style={{ padding: '12px', backgroundColor: 'var(--card-alt)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label className="form-label" htmlFor="responseNotes" style={{ fontSize: '12px' }}>
                        Action Taken / Resolution Summary (Included in PDF)
                      </label>
                      <textarea
                        id="responseNotes"
                        className="form-textarea"
                        style={{ minHeight: '50px', fontSize: '12px' }}
                        value={responseNotes}
                        onChange={(e) => setResponseNotes(e.target.value)}
                        placeholder="e.g. Administered first aid; transported patient to hospital..."
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="resourcesUsed" style={{ fontSize: '12px' }}>
                        Equipment & Resources Deployed
                      </label>
                      <input
                        id="resourcesUsed"
                        type="text"
                        className="form-input"
                        style={{ height: '34px', fontSize: '12px' }}
                        value={resourcesUsed}
                        onChange={(e) => setResourcesUsed(e.target.value)}
                        placeholder="e.g. Ambulance, 1x Stretcher, Trauma Kit..."
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                        {getRecommendedResources().map((resItem, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setResourcesUsed(prev => {
                                if (!prev) return resItem;
                                if (prev.includes(resItem)) return prev;
                                return `${prev}, ${resItem}`;
                              });
                            }}
                            style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              borderRadius: '10px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--card-bg)',
                              color: 'var(--text-light)',
                              cursor: 'pointer'
                            }}
                          >
                            + {resItem}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primary btn-full" disabled={submittingStatus} style={{ height: '36px', fontSize: '13px' }}>
                  <Send size={14} />
                  {submittingStatus ? 'Updating...' : 'Log Status Update'}
                </button>
              </form>

              {/* Subtle Recommended Resources Footer */}
              <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Recommended Equipment for {incident.type}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {getRecommendedResources().map((item, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--card-alt)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-main)'
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Incident Chat Section (Full Width Below Balanced Columns) */}
      <div style={{ marginTop: '20px' }} className="no-print">
        <IncidentChat incidentId={id} incidentStatus={incident.status} />
      </div>

      {/* Official Signatory Certification Block (Visible on PRINT / PDF) */}
      <div className="print-only" style={{ marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #cbd5e1' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '28px' }}>Prepared & Verified By:</div>
            <div style={{ borderBottom: '1px solid #0f172a', width: '240px', marginBottom: '4px', fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>
              {user?.full_name || 'MDRRMO Command Center'}
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>MDRRMO Operations & Warning Officer</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '28px' }}>Noted & Approved By:</div>
            <div style={{ borderBottom: '1px solid #0f172a', width: '240px', marginBottom: '4px', fontWeight: '800', fontSize: '13px', color: '#0f172a' }}>
              &nbsp;
            </div>
            <div style={{ fontSize: '11px', color: '#475569' }}>Municipal DRRM Officer — Jamindan, Capiz</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackStatus;





