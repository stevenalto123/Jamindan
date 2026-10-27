import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Shield, Phone, MapPin, Search, UserPlus, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminResponders = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dutyFilter, setDutyFilter] = useState('all');
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResponders = async () => {
      try {
        const res = await axios.get('/api/users', { params: { limit: 500 } });
        const validOfficers = (res.data.users || []).filter(u => u.role === 'Responder' || u.role === 'Admin');
        setResponders(validOfficers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResponders();
  }, []);

  const onDutyCount = responders.filter(r => r.is_on_duty === 1).length;

  const filteredResponders = useMemo(() => {
    let result = responders;
    if (dutyFilter === 'on_duty') {
      result = result.filter(r => r.is_on_duty === 1);
    } else if (dutyFilter === 'off_duty') {
      result = result.filter(r => r.is_on_duty !== 1);
    }
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.full_name?.toLowerCase().includes(lowerQuery) ||
        r.barangay?.toLowerCase().includes(lowerQuery) ||
        r.phone?.includes(lowerQuery)
      );
    }
    return result;
  }, [responders, searchQuery, dutyFilter]);

  return (
    <div className="content-body" style={{ maxWidth: '1100px', paddingBottom: '48px' }}>

      {/* ─── Unified Top Toolbar: Search + Duty Filter + Manage Button ─── */}
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
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('searchResponders') || 'Search officer name, barangay, or phone...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 30px 8px 34px',
              borderRadius: '8px',
              backgroundColor: 'var(--card-alt)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '13px',
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

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Officers', count: responders.length },
            { id: 'on_duty', label: 'On Duty', count: onDutyCount },
            { id: 'off_duty', label: 'Off Duty', count: responders.length - onDutyCount }
          ].map(tab => {
            const active = dutyFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDutyFilter(tab.id)}
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
                  gap: '6px'
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

          {user?.role === 'Admin' && (
            <button
              onClick={() => navigate('/users')}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', borderRadius: '8px', marginLeft: '4px' }}
            >
              <UserPlus size={14} /> Manage Responders
            </button>
          )}
        </div>
      </div>

      {/* ─── Responders Grid ───────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('fetchingResponders') || 'Loading responders...'}</div>
      ) : filteredResponders.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-color)', boxShadow: 'none' }}>
          <Shield size={32} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
          <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '13px' }}>{t('noResponders') || 'No responders found.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {filteredResponders.map((resp) => {
            const isOnDuty = resp.is_on_duty === 1;
            return (
              <div
                key={resp.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  opacity: resp.is_active === 0 ? 0.6 : 1,
                  boxShadow: 'none',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  {resp.avatar ? (
                    <img
                      src={resp.avatar}
                      alt={resp.full_name}
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid var(--border-color)'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--card-alt)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '16px',
                      flexShrink: 0
                    }}>
                      {resp.full_name ? resp.full_name.charAt(0).toUpperCase() : 'R'}
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {resp.full_name}
                      </h4>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: isOnDuty ? 'rgba(16, 185, 129, 0.12)' : 'var(--card-alt)',
                        border: `1px solid ${isOnDuty ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-color)'}`,
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: '700',
                        color: isOnDuty ? '#10b981' : 'var(--text-muted)'
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: isOnDuty ? '#10b981' : 'var(--text-muted)' }} />
                        {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-light)' }}>
                      {resp.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontVariantNumeric: 'tabular-nums' }}>
                          <Phone size={11} style={{ color: 'var(--text-muted)' }} /> {resp.phone}
                        </span>
                      )}
                      {resp.barangay && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={11} style={{ color: 'var(--text-muted)' }} /> {resp.barangay}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {resp.phone && (
                  <a
                    href={`tel:${resp.phone}`}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    <Phone size={12} /> {t('call') || 'Call'}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminResponders;
