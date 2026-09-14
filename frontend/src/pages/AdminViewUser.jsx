import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, Phone, MapPin, Calendar, Activity, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AdminViewUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${id}/profile`);
        setProfile(res.data.user);
        setIncidents(res.data.incidents);
        setStats(res.data.stats);
      } catch (err) {
        console.error(err);
        setError('Failed to load user profile. They may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div style={{ padding: '20px' }}>Loading profile...</div>;
  if (error || !profile) return <div style={{ padding: '20px', color: 'red' }}>{error || 'User not found'}</div>;

  const renderRoleBadge = (role, agency) => {
    switch (role) {
      case 'Admin': return <span className="badge badge-admin">Admin</span>;
      case 'Responder': return <span className="badge badge-responder">Responder {agency ? `(${agency})` : ''}</span>;
      case 'Resident': return <span className="badge badge-resident">Resident</span>;
      default: return <span className="badge">{role}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge" style={{ background: '#f39c12', color: '#fff' }}>Pending</span>;
      case 'Dispatched': return <span className="badge" style={{ background: '#3498db', color: '#fff' }}>Dispatched</span>;
      case 'In Progress': return <span className="badge" style={{ background: '#f1c40f', color: '#fff' }}>In Progress</span>;
      case 'Resolved': return <span className="badge" style={{ background: '#2ecc71', color: '#fff' }}>Resolved</span>;
      case 'False Alarm': return <span className="badge" style={{ background: '#95a5a6', color: '#fff' }}>False Alarm</span>;
      default: return <span className="badge" style={{ background: '#e0e0e0', color: '#333' }}>{status}</span>;
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/admin/users')}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}
      >
        <ArrowLeft size={18} />
        Back to Users
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        
        {/* Left Column: Profile Card */}
        <div className="card" style={{ padding: '20px', height: 'fit-content' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {profile.avatar ? (
              <img src={`https://jamindan.onrender.com${profile.avatar}`} alt="Avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />
            ) : (
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <User size={40} color="#999" />
              </div>
            )}
            <h2 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>{profile.full_name}</h2>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-light)' }}>@{profile.username}</p>
            {renderRoleBadge(profile.role, profile.agency_type)}
            
            <div style={{ marginTop: '10px' }}>
              {profile.is_active === 1 ? (
                <span className="badge" style={{ background: '#e8f5e9', color: '#2e7d32' }}>Account Active</span>
              ) : (
                <span className="badge" style={{ background: '#ffebee', color: '#c62828' }}>Account Deactivated</span>
              )}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '15px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
              <Phone size={16} color="var(--primary-color)" />
              <span>{profile.phone}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
              <MapPin size={16} color="var(--primary-color)" />
              <span>{profile.barangay}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
              <Calendar size={16} color="var(--primary-color)" />
              <span>Joined: {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Identification Photos */}
          {(profile.id_photo_path || profile.selfie_photo_path) && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '15px 0' }} />
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)' }}>Identification</h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                {profile.id_photo_path && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '0 0 4px 0' }}>Valid ID ({profile.id_type || 'N/A'})</p>
                    <img 
                      src={profile.id_photo_path.startsWith('http') ? profile.id_photo_path : `https://jamindan.onrender.com${profile.id_photo_path}`} 
                      alt="ID Document" 
                      style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #ddd' }}
                      onClick={() => setViewImage(profile.id_photo_path.startsWith('http') ? profile.id_photo_path : `https://jamindan.onrender.com${profile.id_photo_path}`)}
                    />
                  </div>
                )}
                {profile.selfie_photo_path && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-light)', margin: '0 0 4px 0' }}>Live Selfie</p>
                    <img 
                      src={profile.selfie_photo_path.startsWith('http') ? profile.selfie_photo_path : `https://jamindan.onrender.com${profile.selfie_photo_path}`} 
                      alt="Selfie" 
                      style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #ddd' }}
                      onClick={() => setViewImage(profile.selfie_photo_path.startsWith('http') ? profile.selfie_photo_path : `https://jamindan.onrender.com${profile.selfie_photo_path}`)}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Column: Stats and History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '50%' }}>
                <Activity size={24} color="#1976d2" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>
                  {profile.role === 'Resident' ? 'Incidents Reported' : 'Incidents Handled'}
                </p>
                <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{stats?.totalIncidents || 0}</h2>
              </div>
            </div>
            <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ background: '#e8f5e9', padding: '12px', borderRadius: '50%' }}>
                <Activity size={24} color="#2e7d32" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)' }}>Resolved Incidents</p>
                <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{stats?.resolvedIncidents || 0}</h2>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px', flex: 1 }}>
            <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Incident History</h3>
            
            {incidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
                No incidents found for this user.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map(inc => (
                      <tr key={inc.id}>
                        <td>{new Date(inc.created_at).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 'bold' }}>{inc.type}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-light)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {inc.location_address}
                        </td>
                        <td>{getStatusBadge(inc.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Full Screen Image Viewer Modal */}
      {viewImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setViewImage(null)}>
          <button style={{ position: 'absolute', top: '20px', right: '20px', background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10001 }} onClick={() => setViewImage(null)}>
            <X size={24} color="#000" />
          </button>
          <img src={viewImage} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain' }} alt="Full screen view" />
        </div>
      )}
    </div>
  );
};

export default AdminViewUser;
