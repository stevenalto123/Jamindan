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
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Live Stream State
  const [showLiveStream, setShowLiveStream] = useState(false);

  const isStaff = user?.role === 'Admin' || user?.role === 'Responder';

  const [respondersList, setRespondersList] = useState([]);
  const [selectedResponder, setSelectedResponder] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Agency Coordination State
  const [leadAgency, setLeadAgency] = useState('MDRRMO');
  const [agencyNotes, setAgencyNotes] = useState('');
  const [savingAgency, setSavingAgency] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin') {
      axios.get('/api/users?role=Responder&limit=100')
        .then(res => setRespondersList(res.data.users || []))
        .catch(err => console.error(err));
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
      await axios.put(`/api/incidents/${id}/assign`, { responder_id: selectedResponder });
      setSelectedResponder('');
      alert('Responder successfully dispatched!');
      await fetchIncidentDetail();
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
    <div className="content-body" ref={printRef} style={{ padding: '20px', backgroundColor: '#fff', color: '#000' }}>
      <style>{`
        .print-only { display: none !important; }
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
          .content-body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
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

      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
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
        <div className="card no-print" style={{ marginBottom: '24px', padding: '20px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '4px', backgroundColor: '#e2e8f0', zIndex: 1, transform: 'translateY(-50%)' }}>
              <div style={{ width: `${(currentIndex / (statusFlow.length - 1)) * 100}%`, height: '100%', backgroundColor: 'var(--primary-color)', transition: 'width 0.5s ease' }}></div>
            </div>
            {statusFlow.map((step, idx) => (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', zIndex: 2, position: 'relative', width: '20%', minWidth: '60px' }}>
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

      {/* Closure Summary */}
      {isResolved && closureComment && (
        <div className="card" style={{ marginBottom: '24px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
          <h3 className="card-title" style={{ color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> Closure Summary
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#047857' }}>
            {closureComment}
          </p>
        </div>
      )}

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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span style={{ 
                    padding: '3px 10px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '800', 
                    backgroundColor: incident.lead_agency === 'BFP' ? '#fee2e2' : incident.lead_agency === 'RHU' ? '#ecfdf5' : '#eff6ff', 
                    color: incident.lead_agency === 'BFP' ? '#dc2626' : incident.lead_agency === 'RHU' ? '#059669' : '#2563eb',
                    border: '1px solid currentColor'
                  }}>
                    Lead Agency: {incident.lead_agency || 'MDRRMO'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', display: 'block' }}>
                  {new Date(incident.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
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

              {/* Inter-Agency Coordination & Notes */}
              <div style={{ marginTop: '16px', backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-main)', margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={15} color="var(--primary-color)" /> Inter-Agency Operational Coordination
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary-color)' }}>
                    {incident.lead_agency || 'MDRRMO'} Assigned Lead
                  </span>
                </div>
                {incident.responder_id && (
                  <p style={{ fontSize: '12px', color: '#1e3a8a', margin: '0 0 6px 0', fontWeight: '700' }}>
                    Assigned Primary Responder: {incident.responder_name || 'Responder'} {incident.responder_phone ? `(${incident.responder_phone})` : ''}
                  </p>
                )}
                <p style={{ fontSize: '13px', color: incident.agency_notes ? 'var(--text-main)' : 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                  {incident.agency_notes ? incident.agency_notes : 'No specific inter-agency handoff notes recorded yet.'}
                </p>

                {isStaff && (
                  <form onSubmit={handleUpdateAgency} className="no-print" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Lead Agency</label>
                        <select 
                          value={leadAgency} 
                          onChange={e => setLeadAgency(e.target.value)}
                          className="form-select"
                          style={{ height: '36px', fontSize: '13px' }}
                        >
                          <option value="MDRRMO">MDRRMO (Rescue)</option>
                          <option value="BFP">BFP (Fire)</option>
                          <option value="RHU">RHU (Medical)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>Agency Handoff Notes</label>
                        <input 
                          type="text" 
                          value={agencyNotes} 
                          onChange={e => setAgencyNotes(e.target.value)}
                          placeholder="e.g. BFP requesting RHU ambulance for triage..."
                          className="form-input"
                          style={{ height: '36px', fontSize: '13px' }}
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={savingAgency} className="btn btn-primary" style={{ height: '34px', fontSize: '12px', padding: '0 14px', alignSelf: 'flex-end', fontWeight: '700' }}>
                      {savingAgency ? 'Updating...' : 'Save Agency Coordination'}
                    </button>
                  </form>
                )}

                {/* External Law Enforcement / PNP Notification Module */}
                {isStaff && (
                  <div className="no-print" style={{ marginTop: '14px', padding: '12px 14px', backgroundColor: 'rgba(2, 132, 199, 0.08)', border: '1px dashed #0284c7', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '800', color: '#0369a1' }}>
                        <span>🚓 External Law Enforcement Coordination (Jamindan PNP)</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#0284c7', fontFamily: 'monospace' }}>
                        Hotline: 0908-641-5589
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                      MDRRMO informs the local police station when incident scene security, perimeter control, traffic management, or investigation is required.
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
                      <a 
                        href="tel:09086415589" 
                        className="btn" 
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '700', backgroundColor: '#0284c7', color: 'white', textDecoration: 'none', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Phone size={13} /> Call Jamindan PNP
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const alertMsg = `[MDRRMO EMERGENCY ALERT] Incident #${incident.code} (${incident.type}) at ${incident.location_address || (incident.reporter_barangay ? `Brgy. ${incident.reporter_barangay}` : 'Jamindan')}. Details: ${incident.description}. Requesting PNP assistance / scene control.`;
                          navigator.clipboard.writeText(alertMsg);
                          alert('Copied alert dispatch details to clipboard! You can paste and send via SMS to Jamindan PNP (0908-641-5589).');
                        }}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--card-bg, #fff)', border: '1px solid #0284c7', color: '#0284c7', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <Copy size={13} /> Copy SMS Dispatch for PNP
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          const pnpEntry = `[PNP Referral] MDRRMO notified Jamindan PNP Station (0908-641-5589) for police/traffic assistance at ${timeStr}.`;
                          setAgencyNotes(prev => prev ? `${prev} | ${pnpEntry}` : pnpEntry);
                        }}
                        className="btn"
                        style={{ padding: '6px 12px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.3)', color: '#0369a1', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        ⚡ Log PNP Referral into Notes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {incident.photo_path && (
              <div style={{ marginTop: '16px' }}>
                <img 
                  src={incident.photo_path?.startsWith('http') ? incident.photo_path : `https://jamindan.onrender.com${incident.photo_path}`} 
                  alt="Evidence" 
                  style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
                />
              </div>
            )}

            {/* Timeline */}
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <h3 className="card-title" style={{ fontSize: '15px' }}>Status Timeline</h3>
              
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
        </div>

        {/* Right Side: Map & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Live Video Streaming Section */}
          {user?.role === 'Resident' && canResidentSeeStream && (
            <div className="card no-print" style={{ borderColor: 'var(--primary-color)' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)' }}>
                <Video size={18} /> Live Incident Broadcast Active
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '16px' }}>
                Your camera is securely streaming live video to the Command Center to assist responders.
              </p>
              <LiveStreamBroadcaster incidentId={id} />
            </div>
          )}

          {isStaff && canResidentSeeStream && (
            <div className="card no-print" style={{ backgroundColor: showLiveStream ? '#000' : 'var(--card-bg)' }}>
              {!showLiveStream ? (
                <button 
                  onClick={() => setShowLiveStream(true)}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', animation: 'pulse 2s infinite' }}
                >
                  <Video size={20} /> VIEW LIVE SCENE FEED
                </button>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 className="card-title" style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Video size={18} /> Resident Live Feed
                    </h3>
                    <button onClick={() => setShowLiveStream(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '12px', opacity: 0.7 }}>Close</button>
                  </div>
                  <LiveStreamViewer incidentId={id} />
                </>
              )}
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
          {user?.role === 'Admin' && (
            <div className="card no-print" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', marginBottom: '24px' }}>
              <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6' }}>
                <Navigation size={18} /> Dispatch Responder
              </h3>
              
              {incident.responder_id && (
                <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1e3a8a' }}>
                    <strong>Primary Assigned:</strong> {incident.responder_name || 'Responder'} ({incident.responder_phone || 'No Phone Provided'})
                  </p>
                  {incident.agency_notes && incident.agency_notes.includes('[Backup Dispatched:') && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#047857', fontWeight: '700' }}>
                      ➕ {incident.agency_notes.split('|').filter(n => n.includes('[Backup Dispatched:')).join(' • ')}
                    </p>
                  )}
                </div>
              )}

              {incident.status !== 'Resolved' && (
                <form onSubmit={handleAssignResponder}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="responderSelect">
                      {incident.responder_id
                        ? 'Dispatch Additional / Backup Responder (e.g. RHU Medical / BFP / MDRRMO)'
                        : 'Select Responder to Dispatch (By Agency)'}
                    </label>
                    <select
                      id="responderSelect"
                      className="form-select"
                      value={selectedResponder}
                      onChange={(e) => setSelectedResponder(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Responder by Agency --</option>
                      {respondersList.filter(r => r.agency_type === 'BFP').length > 0 && (
                        <optgroup label="🚒 Bureau of Fire Protection (BFP)">
                          {respondersList.filter(r => r.agency_type === 'BFP').map(r => (
                            <option key={r.id} value={r.id}>{r.full_name} (BFP Firefighter)</option>
                          ))}
                        </optgroup>
                      )}
                      {respondersList.filter(r => r.agency_type === 'RHU').length > 0 && (
                        <optgroup label="🚑 Rural Health Unit / Medical (RHU)">
                          {respondersList.filter(r => r.agency_type === 'RHU').map(r => (
                            <option key={r.id} value={r.id}>{r.full_name} (RHU Paramedic)</option>
                          ))}
                        </optgroup>
                      )}
                      {respondersList.filter(r => !['BFP', 'RHU'].includes(r.agency_type)).length > 0 && (
                        <optgroup label="🏛️ Jamindan Response Unit (MDRRMO)">
                          {respondersList.filter(r => !['BFP', 'RHU'].includes(r.agency_type)).map(r => (
                            <option key={r.id} value={r.id}>{r.full_name} ({r.agency_type || 'MDRRMO'})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={assigning || !selectedResponder} style={{ height: '40px' }}>
                    {assigning
                      ? 'Dispatching...'
                      : incident.responder_id
                        ? '➕ Dispatch Additional / Backup Unit'
                        : 'Dispatch Responder'}
                  </button>
                </form>
              )}
            </div>
          )}

          {isStaff && (
            <div className="card no-print" style={{ borderColor: 'rgba(75, 142, 98, 0.3)' }}>
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
                href={`https://www.google.com/maps/dir/?api=1${responderLat && responderLng ? `&origin=${responderLat},${responderLng}` : ''}&destination=${incident.location_lat},${incident.location_lng}&travelmode=driving&dir_action=navigate`}
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary no-print"
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
              onResponderMove={user?.role === 'Responder' ? (newLat, newLng) => {
                setResponderLat(newLat);
                setResponderLng(newLng);
                axios.put('/api/auth/location', { latitude: newLat, longitude: newLng }).catch(() => {});
              } : null}
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

              {/* HOUSEHOLD MEMBERS (For Paramedics context) */}
              {household && household.length > 0 && (
                <div className="card" style={{ borderLeft: '4px solid #3498db', backgroundColor: '#f0f8ff' }}>
                  <h3 className="card-title" style={{ color: '#2980b9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} /> Household Members
                  </h3>
                  <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '10px' }}>
                    Context for potential victims at the location
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {household.map(member => (
                      <div key={member.id} style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #bde0fe', fontSize: '13px' }}>
                        <div style={{ fontWeight: 'bold', color: '#2c3e50', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{member.full_name}</span>
                          <span style={{ color: '#7f8c8d' }}>{member.age} yrs • {member.gender}</span>
                        </div>
                        {member.medical_notes && (
                          <div style={{ marginTop: '4px', color: '#e67e22', fontSize: '12px', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                            <AlertTriangle size={12} style={{ marginTop: '2px' }} />
                            <span>{member.medical_notes}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Live Incident Chat Section */}
      <div style={{ marginTop: '24px' }} className="no-print">
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





