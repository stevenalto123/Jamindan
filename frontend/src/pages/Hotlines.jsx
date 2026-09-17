import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PhoneCall, ShieldAlert, Heart, Building2, MapPin, Plus, Edit, Trash2, X, Search, Clock, Zap, Siren, Hospital } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// ─── Agency Type Detection ─────────────────────────────────────────────────
const getAgencyMeta = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('police') || lower.includes('pnp'))
    return { icon: ShieldAlert, color: '#1a5276', bg: '#d6eaf8', label: 'Police' };
  if (lower.includes('fire') || lower.includes('bfp'))
    return { icon: Siren, color: '#c0392b', bg: '#fdf2f2', label: 'Fire' };
  if (lower.includes('health') || lower.includes('rhu') || lower.includes('hospital') || lower.includes('medical') || lower.includes('centrum'))
    return { icon: Heart, color: '#1a7a4a', bg: '#eafaf1', label: 'Medical' };
  if (lower.includes('mdrrmo') || lower.includes('response') || lower.includes('disaster'))
    return { icon: ShieldAlert, color: '#784212', bg: '#fdebd0', label: 'MDRRMO' };
  if (lower.includes('capelco') || lower.includes('electric') || lower.includes('power'))
    return { icon: Zap, color: '#7d6608', bg: '#fef9e7', label: 'Electric' };
  return { icon: PhoneCall, color: '#1f618d', bg: '#d6eaf8', label: 'Other' };
};

// ─── Actual Jamindan Hotlines (fallback data) ─────────────────────────────
const JAMINDAN_FALLBACK = [
  // Municipal Responders
  { id: 'fb1', agency_name: 'Jamindan Response Unit (MDRRMO)', contact_number: '09485224345 / 09088773092 / (036) 651-8227', barangay: '' },
  { id: 'fb2', agency_name: 'Jamindan Municipal Police Station', contact_number: '09086415589 / (036) 651-8218', barangay: '' },
  { id: 'fb3', agency_name: 'Municipal Health Office', contact_number: '09304562011 / (036) 651-8204', barangay: '' },
  { id: 'fb4', agency_name: 'Jamindan Bureau of Fire Protection (BFP)', contact_number: '09106964585 / (036) 651-8228', barangay: '' },
  { id: 'fb5', agency_name: 'CAPELCO Jamindan-Mambusao', contact_number: '09630438339 / (036) 620-4930', barangay: '' },
  // Hospitals / Medical
  { id: 'fb6', agency_name: 'Mambusao District Hospital', contact_number: '09688796022 / (036) 647-0220', barangay: '' },
  { id: 'fb7', agency_name: 'SGMRMH (DAO) Hospital', contact_number: '09171195972 / (036) 658-0037', barangay: '' },
  { id: 'fb8', agency_name: 'Roxas Memorial Provincial Hospital', contact_number: '(036) 621-0823 / (036) 621-0030', barangay: '' },
  { id: 'fb9', agency_name: 'Capiz Doctors Hospital', contact_number: '(036) 621-5675', barangay: '' },
  { id: 'fb10', agency_name: 'St. Anthony Hospital', contact_number: '(036) 621-0431', barangay: '' },
  { id: 'fb11', agency_name: 'Capiz Emmanuel Hospital', contact_number: '(036) 621-0443', barangay: '' },
  { id: 'fb12', agency_name: 'Health Centrum Hospital', contact_number: '(033) 621-09088', barangay: '' },
  { id: 'fb13', agency_name: 'Western Visayas Medical Center', contact_number: '09695106129 / (033) 339-7070', barangay: '' },
];

const Hotlines = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [hotlines, setHotlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentHotlines, setRecentHotlines] = useState(() => {
    const saved = localStorage.getItem('recentHotlines');
    return saved ? JSON.parse(saved) : [];
  });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ agency_name: '', contact_number: '', barangay: '' });

  const fetchHotlines = async () => {
    try {
      const res = await axios.get('/api/emergency/hotlines');
      if (res.data && res.data.length > 0) {
        setHotlines(res.data);
        localStorage.setItem('cached_hotlines', JSON.stringify(res.data));
      } else {
        throw new Error("No data");
      }
    } catch (err) {
      console.warn("Offline or API failed, using fallback hotlines.", err);
      const cached = localStorage.getItem('cached_hotlines');
      setHotlines(cached ? JSON.parse(cached) : JAMINDAN_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHotlines(); }, []);

  const handleOpenModal = (hotline = null) => {
    if (hotline) {
      setEditingId(hotline.id);
      setFormData({ agency_name: hotline.agency_name, contact_number: hotline.contact_number, barangay: hotline.barangay || '' });
    } else {
      setEditingId(null);
      setFormData({ agency_name: '', contact_number: '', barangay: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => { setShowModal(false); setEditingId(null); };

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
      alert('Failed to delete hotline.');
    }
  };

  const handleCall = async (e, hotline, number) => {
    e.preventDefault();
    const newRecent = { ...hotline, contact_number: number };
    setRecentHotlines(prev => {
      const filtered = prev.filter(h => h.id !== hotline.id);
      const updated = [newRecent, ...filtered].slice(0, 3);
      localStorage.setItem('recentHotlines', JSON.stringify(updated));
      return updated;
    });
    try {
      await axios.post('/api/emergency/hotlines/log', { hotline_name: hotline.agency_name, hotline_number: number });
    } catch (err) {
      console.warn("Failed to log call intent", err);
    }
    window.location.href = `tel:${number.replace(/\s+/g, '').replace(/[()]/g, '')}`;
  };

  if (loading) {
    return <div className="content-body"><p style={{ color: 'var(--text-light)' }}>{t('loadingHotlines') || 'Loading...'}</p></div>;
  }

  const filteredHotlines = hotlines.filter(h =>
    h.agency_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.barangay && h.barangay.toLowerCase().includes(searchQuery.toLowerCase())) ||
    h.contact_number.includes(searchQuery)
  );

  const municipalHotlines = filteredHotlines.filter(h => !h.barangay);
  const barangayHotlines = filteredHotlines.filter(h => h.barangay);

  return (
    <div className="content-body" style={{ maxWidth: '1100px', paddingBottom: '60px' }}>

      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '20px', borderRadius: '8px' }}>{error}</div>}

      {/* Header row: Admin button */}
      {isAdmin && (
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Add New Hotline
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '28px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder={t('searchHotlines') || 'Search by name, barangay, or number...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '15px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box', boxShadow: 'var(--shadow-sm)' }}
        />
      </div>

      {/* ─── Recently Called Section ───────────────────────────────── */}
      {recentHotlines.length > 0 && !searchQuery && (
        <div style={{ marginBottom: '36px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Clock size={18} color="var(--primary-color)" /> {t('recentHotlines') || 'Recent Hotlines'}
            </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {recentHotlines.map((hotline, idx) => {
              const meta = getAgencyMeta(hotline.agency_name);
              const Icon = meta.icon;
              return (
                <div key={`recent-${idx}`} className="glass-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', borderLeft: `4px solid ${meta.color}` }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={meta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hotline.agency_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>{hotline.contact_number.split('/')[0].trim()}</div>
                  </div>
                  <a
                    href={`tel:${hotline.contact_number.split('/')[0].trim().replace(/\s+/g, '').replace(/[()]/g, '')}`}
                    onClick={(e) => handleCall(e, hotline, hotline.contact_number.split('/')[0].trim())}
                    style={{ padding: '8px 14px', fontSize: '12px', fontWeight: '700', color: '#fff', backgroundColor: meta.color, borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
                  >
                    <PhoneCall size={13} /> {t('call') || 'Call'}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Municipal Responders Section ─────────────────────────── */}
      <div style={{ marginBottom: '36px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <ShieldAlert size={18} color="#c0392b" /> {t('municipalResponders') || 'Municipal Responders'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {municipalHotlines.map((hotline) => {
            const meta = getAgencyMeta(hotline.agency_name);
            const Icon = meta.icon;
            const numbers = hotline.contact_number.split('/').map(n => n.trim());
            return (
              <div
                key={hotline.id}
                className="glass-card"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '16px', padding: '20px', borderLeft: `4px solid ${meta.color}`, position: 'relative' }}
              >
                {/* Agency Type Icon */}
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} color={meta.color} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Agency Type Badge */}
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: meta.color, backgroundColor: meta.bg, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {meta.label}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', lineHeight: '1.3' }}>{hotline.agency_name}</h4>

                  {/* Call Buttons - one per number */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {numbers.map((num, i) => (
                      <a
                        key={i}
                        href={`tel:${num.replace(/\s+/g, '').replace(/[()]/g, '')}`}
                        onClick={(e) => handleCall(e, hotline, num)}
                        style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#fff',
                          textDecoration: 'none',
                          backgroundColor: meta.color,
                          padding: '8px 14px',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: `0 3px 8px ${meta.color}40`
                        }}
                      >
                        <PhoneCall size={14} /> {num}
                      </a>
                    ))}
                  </div>
                </div>

                {isAdmin && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleOpenModal(hotline)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><Edit size={15} /></button>
                    <button onClick={() => handleDelete(hotline.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', padding: '4px' }}><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Barangay Emergency Desks Section ─────────────────────── */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <MapPin size={18} color="#2980b9" /> {t('barangayDesks') || 'Barangay Emergency Desks'}
        </h3>

        {barangayHotlines.length === 0 ? (
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
            <MapPin size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-light)', fontSize: '14px', margin: 0 }}>{t('noBarangayDesks') || 'No barangay emergency desks registered yet.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {barangayHotlines.map((hotline) => {
              const meta = getAgencyMeta(hotline.agency_name);
              const Icon = meta.icon;
              return (
                <div
                  key={hotline.id}
                  className="glass-card"
                  style={{ padding: '18px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', borderLeft: `4px solid ${meta.color}` }}
                >
                  {isAdmin && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleOpenModal(hotline)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><Edit size={15} /></button>
                      <button onClick={() => handleDelete(hotline.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', padding: '4px' }}><Trash2 size={15} /></button>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={meta.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: '800', color: '#2980b9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brgy. {hotline.barangay}</div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.3' }}>{hotline.agency_name}</h4>
                    </div>
                  </div>

                  <a
                    href={`tel:${hotline.contact_number.replace(/\s+/g, '').replace(/[()]/g, '')}`}
                    onClick={(e) => handleCall(e, hotline, hotline.contact_number)}
                    style={{ fontSize: '14px', fontWeight: '700', color: '#fff', textDecoration: 'none', backgroundColor: meta.color, padding: '10px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: `0 3px 8px ${meta.color}40` }}
                  >
                    <PhoneCall size={16} /> {hotline.contact_number}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Admin Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={20} color="var(--primary-color)" />
                {editingId ? 'Edit Hotline' : 'Add New Hotline'}
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={22} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Agency / Unit Name *</label>
                <input className="form-input" value={formData.agency_name} onChange={e => setFormData({ ...formData, agency_name: e.target.value })} required placeholder="e.g., Jamindan Police Station" />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Contact Number(s) *</label>
                <input className="form-input" value={formData.contact_number} onChange={e => setFormData({ ...formData, contact_number: e.target.value })} required placeholder="Use / to separate multiple numbers" />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Tip: Separate multiple numbers with /</small>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Barangay (Optional)</label>
                <input className="form-input" value={formData.barangay} onChange={e => setFormData({ ...formData, barangay: e.target.value })} placeholder="Leave blank for Municipal Hotlines" />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>If filled, appears under Barangay Desks section.</small>
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '48px', marginTop: '8px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PhoneCall size={18} /> {editingId ? 'Save Changes' : 'Add Hotline'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Hotlines;
