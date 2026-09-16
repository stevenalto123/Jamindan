import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  UserCheck, 
  UserX, 
  CheckCircle, 
  RotateCw,
  Phone, 
  MapPin, 
  User, 
  ImageIcon 
} from 'lucide-react';

const AdminVerifyUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [imageRotation, setImageRotation] = useState(0);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/auth/pending-users');
      setPendingUsers(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch pending users:', err);
      setError('Failed to load pending users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleVerify = async (userId, action) => {
    const confirmMessage = action === 'approve' 
      ? 'Are you sure you want to approve this user? They will be granted access to the system.' 
      : 'Are you sure you want to reject this user? Their account will be permanently deleted.';
      
    if (!window.confirm(confirmMessage)) return;

    setProcessingId(userId);
    try {
      await axios.put(`/api/auth/verify-user/${userId}`, { action });
      fetchPendingUsers(); // refresh list
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Failed to ${action} user.`);
    } finally {
      setProcessingId(null);
    }
  };

  const openImageViewer = (url) => {
    setViewImage(url);
    setImageRotation(0);
  };

  if (loading) {
    return (
      <div className="content-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--text-light)', fontWeight: '600' }}>Loading pending verifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-body" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={26} color="var(--primary-color)" />
            Pending Verifications
          </h2>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '14px' }}>
            Review and approve new resident accounts.
          </p>
        </div>
        <div style={{ background: 'var(--primary-color)', color: 'white', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', boxShadow: '0 2px 8px rgba(61,122,80,0.3)' }}>
          {pendingUsers.length} Pending
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(61,122,80,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <CheckCircle size={32} color="var(--primary-color)" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 8px 0' }}>All Caught Up!</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>There are no pending registrations waiting for your approval.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {pendingUsers.map(user => (
            <div key={user.id} style={{ 
              background: 'var(--card-bg)', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)', 
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{user.full_name}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <User size={14} /> @{user.username}
                    </p>
                  </div>
                  <span style={{ 
                    background: user.age < 18 ? '#fee2e2' : '#dcfce7', 
                    color: user.age < 18 ? '#dc2626' : '#16a34a', 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontWeight: '800',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {user.age < 18 ? <span style={{fontSize:'14px'}}>🔞</span> : null} Age: {user.age}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
                  <div style={{ background: 'var(--bg-color)', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: '600', border: '1px solid var(--border-color)' }}>
                    <Phone size={14} color="var(--text-muted)" /> {user.phone}
                  </div>
                  <div style={{ background: 'var(--bg-color)', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: '600', border: '1px solid var(--border-color)' }}>
                    <MapPin size={14} color="var(--text-muted)" /> {user.barangay}
                  </div>
                </div>
              </div>

              <div style={{ padding: '20px', background: '#f8fafc', flex: 1 }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  
                  {/* ID Document */}
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Valid ID <span style={{ color: 'var(--primary-color)' }}>({user.id_type || 'N/A'})</span>
                    </p>
                    <div 
                      onClick={() => user.id_photo_path && openImageViewer(user.id_photo_path.startsWith('http') ? user.id_photo_path : `https://jamindan.onrender.com${user.id_photo_path}`)}
                      style={{ 
                        width: '100%', 
                        height: '130px', 
                        background: 'white',
                        borderRadius: '10px', 
                        border: '2px dashed #cbd5e1',
                        cursor: user.id_photo_path ? 'zoom-in' : 'default',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { if(user.id_photo_path) e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                      onMouseOut={(e) => { if(user.id_photo_path) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    >
                      {user.id_photo_path ? (
                        <img 
                          src={user.id_photo_path.startsWith('http') ? user.id_photo_path : `https://jamindan.onrender.com${user.id_photo_path}`} 
                          alt="ID Document" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color:'#94a3b8' }}>
                          <ImageIcon size={24} />
                          <span style={{ fontSize: '11px', marginTop: '4px' }}>No ID Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Live Selfie */}
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Live Selfie
                    </p>
                    <div 
                      onClick={() => user.selfie_photo_path && openImageViewer(user.selfie_photo_path.startsWith('http') ? user.selfie_photo_path : `https://jamindan.onrender.com${user.selfie_photo_path}`)}
                      style={{ 
                        width: '100%', 
                        height: '130px', 
                        background: 'white',
                        borderRadius: '10px', 
                        border: '2px dashed #cbd5e1',
                        cursor: user.selfie_photo_path ? 'zoom-in' : 'default',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { if(user.selfie_photo_path) e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
                      onMouseOut={(e) => { if(user.selfie_photo_path) e.currentTarget.style.borderColor = '#cbd5e1'; }}
                    >
                      {user.selfie_photo_path ? (
                        <img 
                          src={user.selfie_photo_path.startsWith('http') ? user.selfie_photo_path : `https://jamindan.onrender.com${user.selfie_photo_path}`} 
                          alt="Live Selfie" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', color:'#94a3b8' }}>
                          <User size={24} />
                          <span style={{ fontSize: '11px', marginTop: '4px' }}>No Selfie Uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              <div style={{ padding: '16px', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleVerify(user.id, 'approve')}
                  disabled={processingId === user.id}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: processingId === user.id ? '#94a3b8' : 'var(--success-color)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: processingId === user.id ? 'not-allowed' : 'pointer',
                    boxShadow: processingId === user.id ? 'none' : '0 4px 12px rgba(46, 204, 113, 0.25)',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { if (processingId !== user.id) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={(e) => { if (processingId !== user.id) e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  {processingId === user.id ? 'Processing...' : <><UserCheck size={18} /> Approve</>}
                </button>
                <button 
                  onClick={() => handleVerify(user.id, 'reject')}
                  disabled={processingId === user.id}
                  style={{ 
                    flex: 1, 
                    padding: '12px', 
                    background: processingId === user.id ? '#94a3b8' : 'white', 
                    color: processingId === user.id ? 'white' : 'var(--danger-color)', 
                    border: processingId === user.id ? 'none' : '2px solid var(--danger-color)', 
                    borderRadius: '10px', 
                    fontWeight: '700',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: processingId === user.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { 
                    if (processingId !== user.id) {
                      e.currentTarget.style.background = 'var(--danger-color)';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseOut={(e) => { 
                    if (processingId !== user.id) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.color = 'var(--danger-color)';
                    }
                  }}
                >
                  {processingId === user.id ? 'Processing...' : <><UserX size={18} /> Reject</>}
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Full Screen Image Viewer Modal */}
      {viewImage && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.95)', 
          zIndex: 10000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setViewImage(null)}>
          
          <button style={{ 
            position: 'absolute', top: '24px', right: '24px', 
            background: 'white', border: 'none', borderRadius: '50%', 
            width: '44px', height: '44px', cursor: 'pointer', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            zIndex: 10001,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s'
          }} 
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={(e) => { e.stopPropagation(); setViewImage(null); }}>
            <X size={24} color="#0f172a" />
          </button>

          <button style={{ 
            position: 'absolute', bottom: '40px', 
            background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '30px', 
            padding: '12px 24px', cursor: 'pointer', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            zIndex: 10001, fontWeight: '700', fontSize: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s'
          }} 
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={(e) => { e.stopPropagation(); setImageRotation(prev => prev + 90); }}>
            <RotateCw size={20} />
            Rotate Image
          </button>

          <img 
            src={viewImage} 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '80%', 
              objectFit: 'contain', 
              borderRadius: '8px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              transform: `rotate(${imageRotation}deg)`,
              transition: 'transform 0.3s ease-in-out'
            }} 
            alt="Full screen view" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminVerifyUsers;

