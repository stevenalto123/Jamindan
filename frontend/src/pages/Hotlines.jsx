import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PhoneCall, ShieldAlert, Heart, Building2, MapPin, Plus, Edit, Trash2, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Hotlines = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  
  const [hotlines, setHotlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    agency_name: '',
    contact_number: '',
    barangay: ''
  });

  const fetchHotlines = async () => {
    try {
      const res = await axios.get('/api/emergency/hotlines');
      if (res.data && res.data.length > 0) {
        setHotlines(res.data);
      } else {
        throw new Error("No data");
      }
    } catch (err) {
      console.warn("Offline or API failed, using fallback hotlines.", err);
      // Fallback data for offline mode
      setHotlines([
        { id: 'fb1', agency_name: 'Jamindan Municipal Police Station', contact_number: '0998 598 6075', barangay: 'Poblacion' },
        { id: 'fb2', agency_name: 'Jamindan Fire Station (BFP)', contact_number: '0915 602 1234', barangay: 'Poblacion' },
        { id: 'fb3', agency_name: 'Jamindan MDRRMO', contact_number: '0961 123 4567', barangay: 'Poblacion' },
        { id: 'fb4', agency_name: 'Jamindan Rural Health Unit (RHU)', contact_number: '0917 890 1234', barangay: 'Poblacion' },
        { id: 'fb5', agency_name: 'Camp Peralta Station Hospital', contact_number: '0919 456 7890', barangay: 'Jaena Norte' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotlines();
  }, []);

  const handleOpenModal = (hotline = null) => {
    if (hotline) {
      setEditingId(hotline.id);
      setFormData({
        agency_name: hotline.agency_name,
        contact_number: hotline.contact_number,
        barangay: hotline.barangay || ''
      });
    } else {
      setEditingId(null);
      setFormData({ agency_name: '', contact_number: '', barangay: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/emergency/hotlines/${editingId}`, formData);
      } else {
        await axios.post('/api/emergency/hotlines', formData);
      }
      handleCloseModal();
      fetchHotlines();
    } catch (err) {
      console.error(err);
      alert('Failed to save hotline.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hotline?')) return;
    try {
      await axios.delete(`/api/emergency/hotlines/${id}`);
      fetchHotlines();
    } catch (err) {
      console.error(err);
      alert('Failed to delete hotline.');
    }
  };

  if (loading) {
    return (
      <div className="content-body">
        <p style={{ color: 'var(--text-light)' }}>{t('loadingHotlines') || 'Loading...'}</p>
      </div>
    );
  }

  // Group hotlines
  const municipalHotlines = hotlines.filter(h => !h.barangay);
  const barangayHotlines = hotlines.filter(h => h.barangay);

  const getHotlineIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('police') || lower.includes('pnp')) return <ShieldAlert size={20} />;
    if (lower.includes('health') || lower.includes('rhu') || lower.includes('hospital')) return <Heart size={20} />;
    if (lower.includes('fire') || lower.includes('bfp')) return <Building2 size={20} style={{ color: '#e74c3c' }} />;
    return <PhoneCall size={20} />;
  };

  return (
    <div className="content-body" style={{ maxWidth: '1100px' }}>

      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '20px' }}>{error}</div>}

      {isAdmin && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add New Hotline
          </button>
        </div>
      )}

      {/* Municipal Responders Section */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🚨 {t('municipalResponders') || 'Municipal Responders'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {municipalHotlines.map((hotline) => (
            <div 
              key={hotline.id} 
              className="card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                gap: '16px', 
                padding: '20px', 
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-color)',
                position: 'relative'
              }}
            >
              <div 
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  borderRadius: '12px', 
                  backgroundColor: '#eaf5ee', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: 'var(--primary-color)',
                  flexShrink: 0
                }}
              >
                {getHotlineIcon(hotline.agency_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{hotline.agency_name}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {hotline.contact_number.split('/').map((num, i) => {
                    const cleanNum = num.trim();
                    return (
                      <a 
                        key={i}
                        href={`tel:${cleanNum.replace(/\s+/g, '')}`} 
                        style={{ 
                          fontSize: '13px', 
                          fontWeight: '700', 
                          color: 'var(--primary-color)', 
                          textDecoration: 'none',
                          backgroundColor: '#eaf5ee',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        📞 {cleanNum}
                      </a>
                    );
                  })}
                </div>
              </div>
              
              {isAdmin && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                  <button onClick={() => handleOpenModal(hotline)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><Edit size={16} /></button>
                  <button onClick={() => handleDelete(hotline.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}><Trash2 size={16} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Barangay Desk Section */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏡 {t('barangayDesks') || 'Barangay Emergency Desks'}
        </h3>
        {barangayHotlines.length === 0 ? (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)' }}>
            {t('noBarangayDesks') || 'No barangay desks available.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {barangayHotlines.map((hotline) => (
              <div 
                key={hotline.id} 
                className="card" 
                style={{ 
                  padding: '16px 20px', 
                  border: '1px solid var(--border-color)', 
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'relative'
                }}
              >
                {isAdmin && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                    <button onClick={() => handleOpenModal(hotline)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}><Edit size={16} /></button>
                    <button onClick={() => handleDelete(hotline.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}><Trash2 size={16} /></button>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Brgy. {hotline.barangay}
                  </span>
                </div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>{hotline.agency_name}</h4>
                <div>
                  <a 
                    href={`tel:${hotline.contact_number.replace(/\s+/g, '')}`} 
                    style={{ 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      color: 'var(--primary-color)', 
                      textDecoration: 'none',
                      backgroundColor: '#f0f7f4',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      boxSizing: 'border-box',
                      justifyContent: 'center',
                      border: '1px solid #d4ebd9'
                    }}
                  >
                    📞 {t('call') || 'Call'}: {hotline.contact_number}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '90%', maxWidth: '400px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Edit Hotline' : 'Add New Hotline'}</h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label className="form-label">Agency / Unit Name</label>
                <input 
                  className="form-input" 
                  value={formData.agency_name} 
                  onChange={e => setFormData({...formData, agency_name: e.target.value})} 
                  required 
                  placeholder="e.g., Jamindan Police Station"
                />
              </div>
              <div>
                <label className="form-label">Contact Number</label>
                <input 
                  className="form-input" 
                  value={formData.contact_number} 
                  onChange={e => setFormData({...formData, contact_number: e.target.value})} 
                  required 
                  placeholder="e.g., 0917-123-4567"
                />
              </div>
              <div>
                <label className="form-label">Barangay (Optional)</label>
                <input 
                  className="form-input" 
                  value={formData.barangay} 
                  onChange={e => setFormData({...formData, barangay: e.target.value})} 
                  placeholder="Leave blank for Municipal Hotlines"
                />
                <small style={{ color: 'var(--text-muted)' }}>If filled, this hotline will appear under the Barangay Desks section.</small>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                {editingId ? 'Save Changes' : 'Add Hotline'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Hotlines;
