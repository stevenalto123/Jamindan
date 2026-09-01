import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminVerifyUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

    try {
      await axios.put(`/api/auth/verify-user/${userId}`, { action });
      fetchPendingUsers(); // refresh list
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert(`Failed to ${action} user.`);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading pending registrations...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {error && <div className="alert alert-danger">{error}</div>}

      {pendingUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg)', borderRadius: '12px' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-light)' }}>No pending registrations found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {pendingUsers.map(user => (
            <div key={user.id} style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
              
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{user.full_name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '14px', color: 'var(--text-light)' }}>
                  <span style={{ background: '#f0f4f8', padding: '4px 8px', borderRadius: '4px' }}>Username: {user.username}</span>
                  <span style={{ background: user.age < 18 ? '#ffebee' : '#e8f5e9', color: user.age < 18 ? '#c62828' : '#2e7d32', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>Age: {user.age}</span>
                  <span style={{ background: '#f0f4f8', padding: '4px 8px', borderRadius: '4px' }}>Phone: {user.phone}</span>
                  <span style={{ background: '#f0f4f8', padding: '4px 8px', borderRadius: '4px' }}>Brgy: {user.barangay}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Valid ID <span style={{ color: 'var(--primary-color)' }}>({user.id_type || 'Not Specified'})</span></p>
                  {user.id_photo_path ? (
                    <img 
                      src={user.id_photo_path.startsWith('http') ? user.id_photo_path : `https://jamindan.onrender.com${user.id_photo_path}`} 
                      alt="ID Document" 
                      style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                      onClick={(e) => window.open(e.target.src, '_blank')}
                      title="Click to view full size"
                    />
                  ) : <div style={{ height: '120px', background: '#eee', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No ID</div>}
                </div>
                
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>Live Selfie</p>
                  {user.selfie_photo_path ? (
                    <img 
                      src={user.selfie_photo_path.startsWith('http') ? user.selfie_photo_path : `https://jamindan.onrender.com${user.selfie_photo_path}`} 
                      alt="Live Selfie" 
                      style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}
                      onClick={(e) => window.open(e.target.src, '_blank')}
                      title="Click to view full size"
                    />
                  ) : <div style={{ height: '120px', background: '#eee', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Selfie</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleVerify(user.id, 'approve')}
                  style={{ flex: 1, padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Approve User
                </button>
                <button 
                  onClick={() => handleVerify(user.id, 'reject')}
                  style={{ flex: 1, padding: '10px', background: '#F44336', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Reject & Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerifyUsers;
