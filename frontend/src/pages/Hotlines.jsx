import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  PhoneCall, ShieldAlert, Heart, MapPin, Plus, Edit, Trash2,
  X, Search, Clock, Zap, Siren, Copy, Check, Building2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// ─── Agency Type & Category Detection ──────────────────────────────────────
const getAgencyMeta = (name = '', barangay = '') => {
  const lower = name.toLowerCase();
  if (barangay) {
    return { icon: MapPin, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)', label: `Brgy. ${barangay}`, category: 'barangay' };
  }
  if (lower.includes('mdrrmo') || lower.includes('response') || lower.includes('disaster')) {
    return { icon: ShieldAlert, color: '#ea580c', bg: 'rgba(234, 88, 12, 0.1)', label: 'MDRRMO Rescue', category: 'emergency' };
  }
  if (lower.includes('police') || lower.includes('pnp')) {
    return { icon: ShieldAlert, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', label: 'Police (PNP)', category: 'emergency' };
  }
  if (lower.includes('fire') || lower.includes('bfp')) {
    return { icon: Siren, color: '#dc2626', bg: 'rgba(220, 38, 38, 0.1)', label: 'Fire Protection (BFP)', category: 'emergency' };
  }
  if (lower.includes('capelco') || lower.includes('electric') || lower.includes('power')) {
    return { icon: Zap, color: '#d97706', bg: 'rgba(217, 119, 6, 0.1)', label: 'Power Utility', category: 'emergency' };
  }
  if (lower.includes('municipal health') || lower.includes('rhu')) {
    return { icon: Heart, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Municipal Health (RHU)', category: 'emergency' };
  }
  if (lower.includes('hospital') || lower.includes('medical') || lower.includes('centrum') || lower.includes('health')) {
    return { icon: Heart, color: '#059669', bg: 'rgba(5, 150, 105, 0.1)', label: 'Hospital / Medical', category: 'medical' };
  }
  return { icon: Building2, color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.1)', label: 'Emergency Line', category: 'emergency' };
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedNum, setCopiedNum] = useState('');
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
        throw new Error('No data');
      }
    } catch (err) {
      console.warn('Offline or API failed, using fallback hotlines.', err);
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

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedNum(num);
    setTimeout(() => setCopiedNum(''), 1800);
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
      console.warn('Failed to log call intent', err);
    }
    window.location.href = `tel:${number.replace(/\s+/g, '').replace(/[()]/g, '')}`;
  };

  const clearRecent = () => {
    setRecentHotlines([]);
    localStorage.removeItem('recentHotlines');
  };

  if (loading) {
    return <div className="content-body"><p style={{ color: 'var(--text-light)' }}>{t('loadingHotlines') || 'Loading...'}</p></div>;
  }

  const filteredHotlines = hotlines.filter(h =>
    h.agency_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (h.barangay && h.barangay.toLowerCase().includes(searchQuery.toLowerCase())) ||
    h.contact_number.includes(searchQuery)
  );

  const emergencyUnits = filteredHotlines.filter(h => !h.barangay && getAgencyMeta(h.agency_name).category === 'emergency');
  const medicalUnits = filteredHotlines.filter(h => !h.barangay && getAgencyMeta(h.agency_name).category === 'medical');
  const barangayHotlines = filteredHotlines.filter(h => h.barangay);

  const renderHotlineCard = (hotline) => {
    const meta = getAgencyMeta(hotline.agency_name, hotline.barangay);
    const Icon = meta.icon;
    const numbers = hotline.contact_number.split('/').map(n => n.trim()).filter(Boolean);

    return (
      <div
        key={hotline.id}
        className="glass-card"
        style={{
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '14px',
          backgroundColor: 'var(--card-bg)',
          boxShadow: 'none'
        }}
      >
        {/* Top Row: Icon + Agency Info + Admin Actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: meta.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon size={20} color={meta.color} />
            </div>
            <div style={{ minWidth: 0 }}>
              <span style={{
                display: 'inline-block',
                fontSize: '10px',
                fontWeight: '700',
                color: meta.color,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                marginBottom: '2px'
              }}>
                {meta.label}
              </span>
              <h4 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--text-main)',
                lineHeight: '1.35'
              }}>
                {hotline.agency_name}
              </h4>
            </div>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <button
                onClick={() => handleOpenModal(hotline)}
                title="Edit Hotline"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px', borderRadius: '6px' }}
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(hotline.id)}
                title="Delete Hotline"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', padding: '5px', borderRadius: '6px' }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Contact Number Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {numbers.map((num, i) => {
            const isCopied = copiedNum === num;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--card-alt)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <span style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.2px'
                }}>
                  {num}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(num)}
                    title="Copy number"
                    style={{
                      background: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '5px 7px',
                      cursor: 'pointer',
                      color: isCopied ? '#10b981' : 'var(--text-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <a
                    href={`tel:${num.replace(/\s+/g, '').replace(/[()]/g, '')}`}
                    onClick={(e) => handleCall(e, hotline, num)}
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#fff',
                      textDecoration: 'none',
                      backgroundColor: 'var(--primary-color)',
                      padding: '5px 11px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <PhoneCall size={12} /> {t('call') || 'Call'}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="content-body" style={{ maxWidth: '1140px', paddingBottom: '48px' }}>

      {error && (
        <div className="alert alert-danger" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* ─── Unified Top Toolbar: Search + Category Filter + Admin Add ─── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 16px',
          marginBottom: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'none'
        }}
      >
        {/* Search Input */}
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder={t('searchHotlines') || 'Search agency, hospital, or number...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 32px 9px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              fontSize: '13px',
              backgroundColor: 'var(--card-alt)',
              color: 'var(--text-main)',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Directory', count: filteredHotlines.length },
            { id: 'emergency', label: 'Emergency Units', count: emergencyUnits.length },
            { id: 'medical', label: 'Hospitals & Medical', count: medicalUnits.length },
            { id: 'barangay', label: 'Barangay Desks', count: barangayHotlines.length }
          ].map(tab => {
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: active ? '700' : '600',
                  border: active ? '1px solid var(--primary-color)' : '1px solid var(--border-color)',
                  backgroundColor: active ? 'var(--primary-color)' : 'var(--card-alt)',
                  color: active ? '#fff' : 'var(--text-light)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: active ? 'rgba(255,255,255,0.22)' : 'var(--card-bg)',
                  color: active ? '#fff' : 'var(--text-muted)'
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}

          {isAdmin && (
            <button
              onClick={() => handleOpenModal()}
              className="btn btn-primary"
              style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}
            >
              <Plus size={15} /> Add Hotline
            </button>
          )}
        </div>
      </div>

      {/* ─── Recently Called Compact Strip ─────────────────────────── */}
      {recentHotlines.length > 0 && !searchQuery && activeCategory === 'all' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <Clock size={14} color="var(--primary-color)" /> {t('recentHotlines') || 'Recently Dialed'}
            </span>
            <button
              type="button"
              onClick={clearRecent}
              style={{ background: 'none', border: 'none', fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 6px' }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
            {recentHotlines.map((hotline, idx) => {
              const meta = getAgencyMeta(hotline.agency_name, hotline.barangay);
              const Icon = meta.icon;
              const primaryNum = hotline.contact_number.split('/')[0].trim();
              return (
                <div
                  key={`recent-${idx}`}
                  className="glass-card"
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: 'none'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color={meta.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hotline.agency_name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                      {primaryNum}
                    </div>
                  </div>
                  <a
                    href={`tel:${primaryNum.replace(/\s+/g, '').replace(/[()]/g, '')}`}
                    onClick={(e) => handleCall(e, hotline, primaryNum)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: '#fff',
                      backgroundColor: 'var(--primary-color)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <PhoneCall size={11} /> {t('call') || 'Call'}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Section 1: Municipal Emergency Units ──────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'emergency') && emergencyUnits.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldAlert size={16} color="#ea580c" />
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('municipalResponders') || 'Municipal Emergency Units'}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>({emergencyUnits.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {emergencyUnits.map(renderHotlineCard)}
          </div>
        </div>
      )}

      {/* ─── Section 2: Hospitals & Medical Centers ────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'medical') && medicalUnits.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Heart size={16} color="#059669" />
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Hospitals & Medical Centers
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>({medicalUnits.length})</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {medicalUnits.map(renderHotlineCard)}
          </div>
        </div>
      )}

      {/* ─── Section 3: Barangay Emergency Desks ───────────────────── */}
      {(activeCategory === 'all' || activeCategory === 'barangay') && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <MapPin size={16} color="#0284c7" />
            <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('barangayDesks') || 'Barangay Emergency Desks'}
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>({barangayHotlines.length})</span>
          </div>

          {barangayHotlines.length === 0 ? (
            <div className="glass-card" style={{ padding: '24px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-color)', boxShadow: 'none' }}>
              <MapPin size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-light)', fontSize: '13px', margin: 0 }}>
                {t('noBarangayDesks') || 'No barangay emergency desks registered yet.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
              {barangayHotlines.map(renderHotlineCard)}
            </div>
          )}
        </div>
      )}

      {/* ─── Admin Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '24px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PhoneCall size={18} color="var(--primary-color)" />
                {editingId ? 'Edit Hotline' : 'Add New Hotline'}
              </h3>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <button type="submit" className="btn btn-primary" style={{ height: '44px', marginTop: '6px', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <PhoneCall size={16} /> {editingId ? 'Save Changes' : 'Add Hotline'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Hotlines;
