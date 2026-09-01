import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Shield, Phone, MapPin, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AdminResponders = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();

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

  const filteredResponders = useMemo(() => {
    if (!searchQuery) return responders;
    const lowerQuery = searchQuery.toLowerCase();
    return responders.filter(r => 
      r.full_name?.toLowerCase().includes(lowerQuery) || 
      r.barangay?.toLowerCase().includes(lowerQuery) ||
      r.phone?.includes(lowerQuery)
    );
  }, [responders, searchQuery]);

  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>{t('responderDirectory')}</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>{t('activeOfficers')}</p>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} />
          {t('activeOfficers')}
        </h3>

        {/* Search Bar */}
        <div style={{ marginTop: '16px', marginBottom: '24px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input 
            type="text" 
            placeholder={t('searchResponders')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ 
              paddingLeft: '42px', 
              borderRadius: '24px', 
              backgroundColor: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              fontSize: '14px',
              width: '100%',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
            }}
          />
        </div>

        {loading ? (
          <div className="notif-empty">{t('fetchingResponders')}</div>
        ) : filteredResponders.length === 0 ? (
          <div className="notif-empty">{t('noResponders')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredResponders.map((resp) => (
              <div 
                key={resp.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px',
                  opacity: resp.is_active === 0 ? 0.6 : 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Responder Avatar */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    {resp.full_name ? resp.full_name.charAt(0).toUpperCase() : 'R'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{resp.full_name}</h4>
                      {/* Pulsing Dot Status */}
                      {resp.is_active === 1 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#eafaf1', padding: '2px 8px', borderRadius: '12px', border: '1px solid #d5f5e3' }}>
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2ecc71',
                            boxShadow: '0 0 0 rgba(46, 204, 113, 0.4)',
                            animation: 'pulse 2s infinite'
                          }}></span>
                          <span style={{ fontSize: '11px', color: '#27ae60', fontWeight: 'bold' }}>{t('onDuty')}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fdf2f2', padding: '2px 8px', borderRadius: '12px', border: '1px solid #fadbd8' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#e74c3c' }}></span>
                          <span style={{ fontSize: '11px', color: '#c0392b', fontWeight: 'bold' }}>{t('inactive')}</span>
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: 'var(--text-light)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={14} /> {resp.phone}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {resp.barangay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div>
                  <a 
                    href={`tel:${resp.phone}`} 
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '20px', fontSize: '13px', textDecoration: 'none' }}
                  >
                    <Phone size={14} />
                    {t('call') || 'Call'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(46, 204, 113, 0); }
          100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0); }
        }
      `}</style>
    </div>
  );
};

export default AdminResponders;
