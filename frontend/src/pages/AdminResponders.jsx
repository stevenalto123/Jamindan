import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Phone, MapPin } from 'lucide-react';

const AdminResponders = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await axios.get('/api/users', { params: { role: 'Responder', limit: 100 } });
        setResponders(res.data.users);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResponders();
  }, []);

  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Responders</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Active emergency responders and duty officers</p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} />
          Active Dispatch Officers
        </h3>

        {loading ? (
          <div className="notif-empty">Fetching responders data...</div>
        ) : responders.length === 0 ? (
          <div className="notif-empty">No responders registered in the system.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
            {responders.map((resp) => (
              <div 
                key={resp.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '10px',
                  opacity: resp.is_active === 0 ? 0.6 : 1
                }}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{resp.full_name}</h4>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '12px', color: 'var(--text-light)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} /> {resp.phone}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> Barangay {resp.barangay}
                    </span>
                  </div>
                </div>
                <div>
                  {resp.is_active === 1 ? (
                    <span className="badge badge-resolved" style={{ fontSize: '10px' }}>On Duty</span>
                  ) : (
                    <span className="badge badge-pending" style={{ fontSize: '10px', backgroundColor: '#fdf2f2', color: '#c0392b' }}>Inactive</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminResponders;
