import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Search, PlusCircle, Eye, Trash2, Download, Printer, Flame, HeartPulse, Droplets, Car, ShieldAlert, HelpCircle, MapPin, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const INCIDENT_TYPES = ['Fire', 'Medical', 'Flood', 'Crime', 'Accident', 'Other', 'Landslide'];
export const STATUSES = ['Pending', 'Acknowledged', 'Responding', 'On Scene', 'Resolved'];

const TYPE_META = {
  Fire:      { icon: Flame,       color: '#e74c3c', bg: 'rgba(231,76,60,0.1)'   },
  Medical:   { icon: HeartPulse,  color: '#27ae60', bg: 'rgba(39,174,96,0.1)'   },
  Flood:     { icon: Droplets,    color: '#2980b9', bg: 'rgba(41,128,185,0.1)'  },
  Accident:  { icon: Car,         color: '#e67e22', bg: 'rgba(230,126,34,0.1)'  },
  Crime:     { icon: ShieldAlert, color: '#8e44ad', bg: 'rgba(142,68,173,0.1)'  },
  Other:     { icon: HelpCircle,  color: '#7f8c8d', bg: 'rgba(127,140,141,0.1)' },
  Landslide: { icon: AlertTriangle, color: '#d35400', bg: 'rgba(211,84,0,0.1)' },
};

const STATUS_STYLE = {
  'Pending':     { color: '#e67e22', bg: 'rgba(230,126,34,0.12)', label: 'Pending'     },
  'Acknowledged':{ color: '#2980b9', bg: 'rgba(41,128,185,0.12)', label: 'Acknowledged'},
  'Responding':  { color: '#8e44ad', bg: 'rgba(142,68,173,0.12)', label: 'Responding'  },
  'On Scene':    { color: '#16a085', bg: 'rgba(22,160,133,0.12)', label: 'On Scene'    },
  'Resolved':    { color: '#27ae60', bg: 'rgba(39,174,96,0.12)',  label: 'Resolved'    },
};

const IncidentList = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchIncidents = async (isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (search) params.search = search;
      const res = await axios.get('/api/incidents', { params });
      setIncidents(res.data);
    } catch (err) {
      console.error('Error fetching incidents list', err);
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents(false);
    const interval = setInterval(() => fetchIncidents(true), 3000);
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    const socketUrl = axios.defaults.baseURL || '';
    const socket = io(socketUrl, { transports: ['websocket', 'polling'] });
    socket.on('incident-status-updated', () => fetchIncidents());
    return () => socket.disconnect();
  }, []);

  const handleExportCSV = () => {
    if (!incidents || incidents.length === 0) { alert(t('noReportsExport')); return; }
    const headers = ['Report Code', 'Incident Type', 'Description', 'Reporter Name', 'Reporter Phone', 'Location', 'Submitted Date', 'Status'];
    const rows = incidents.map(inc => [
      inc.code, inc.type,
      `"${(inc.description || '').replace(/"/g, '""')}"`,
      inc.reporter_name || '', inc.reporter_phone || '',
      (inc.location_lat && inc.location_lng) ? `"${inc.location_lat}, ${inc.location_lng}"` : (inc.reporter_barangay || ''),
      new Date(inc.created_at).toLocaleString(), inc.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jamindan_Emergency_Incidents_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteIncident = async (id, code) => {
    if (!window.confirm(t('confirmDeleteReport').replace('{code}', code))) return;
    try {
      await axios.delete(`/api/incidents/${id}`);
      fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || t('failedDeleteReport'));
    }
  };

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchIncidents(); };

  const getStatusBadge = (status) => {
    const s = STATUS_STYLE[status];
    if (s) return <span style={{ backgroundColor: s.bg, color: s.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>{s.label}</span>;
    return <span className="badge">{status}</span>;
  };

  const isResident = user?.role === 'Resident';

  // ─── RESIDENT CARD VIEW ────────────────────────────────────────────────────
  if (isResident) {
    return (
      <div className="content-body" style={{ paddingBottom: '80px' }}>
        {/* Submit Button - prominent CTA */}
        <Link to="/report" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700', borderRadius: '12px', marginBottom: '20px', textDecoration: 'none' }}>
          <PlusCircle size={20} /> {t('submitNewReport')}
        </Link>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <select
            className="form-select"
            style={{ flex: 1, padding: '10px 12px', fontSize: '13px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('allStatuses')}</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="form-select"
            style={{ flex: 1, padding: '10px 12px', fontSize: '13px' }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">{t('allTypes')}</option>
            {INCIDENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
          </select>
        </div>

        {/* Report Cards */}
        {loading ? (
          <div className="notif-empty">{t('fetchingRecords')}</div>
        ) : incidents.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-light)', fontWeight: '600', margin: 0 }}>{t('noReportsMatching')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>Tap the button above to submit your first report.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {incidents.map((incident) => {
              const meta = TYPE_META[incident.type] || TYPE_META['Other'];
              const Icon = meta.icon;
              const statusInfo = STATUS_STYLE[incident.status] || {};
              const isCritical = incident.priority === 'CRITICAL';
              return (
                <Link
                  key={incident.id}
                  to={`/incidents/${incident.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    className="glass-card"
                    style={{
                      padding: '16px',
                      borderLeft: isCritical ? '4px solid #e74c3c' : `4px solid ${meta.color}`,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    {/* Top row: icon + type + status + chevron */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{ padding: '8px', backgroundColor: meta.bg, borderRadius: '10px', flexShrink: 0 }}>
                        <Icon size={20} color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main)' }}>{incident.type}</span>
                          {isCritical && <span style={{ backgroundColor: '#e74c3c', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', letterSpacing: '0.5px' }}>CRITICAL</span>}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', fontFamily: 'monospace' }}>{incident.code}</span>
                      </div>
                      {getStatusBadge(incident.status)}
                      <ChevronRight size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>

                    {/* Description */}
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.5', borderLeft: '2px solid var(--border-color)', paddingLeft: '10px' }}>
                      {incident.description?.length > 120 ? incident.description.substring(0, 120) + '...' : incident.description}
                    </p>

                    {/* Bottom row: date */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        {new Date(incident.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── ADMIN / RESPONDER TABLE VIEW ──────────────────────────────────────────
  return (
    <div className="content-body">
      <style>{`
        .print-only { display: none !important; }
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
          .card { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          body { background: #ffffff !important; color: #000000 !important; }
          .table-container { border: none !important; box-shadow: none !important; margin-top: 10px !important; }
          .custom-table th { background-color: #f0f0f0 !important; border-bottom: 2px solid #ccc !important; color: #000000 !important; }
          .custom-table td { border-bottom: 1px solid #ddd !important; }
        }
      `}</style>

      {/* Print Only Header */}
      <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #3d7a50', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
          <img src="/logo.png" alt="Jamindan Seal" style={{ width: '70px', height: '70px' }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('republicOfPh')}</h3>
            <h3 style={{ margin: 0, fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('provinceOfCapiz')}</h3>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '800', textTransform: 'uppercase', color: '#3d7a50', letterSpacing: '0.5px' }}>{t('municipalityJamindan')}</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#666', fontWeight: '600' }}>{t('officeMdrrmo')}</p>
          </div>
        </div>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('officialRegistryReport')}</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555' }}>{t('generatedOn')} {new Date().toLocaleString()} | {t('roleLabel')} {user?.role}</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }} className="no-print">
            <button className="btn btn-primary" onClick={handleExportCSV} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
              <Download size={16} /> {t('exportCsv')}
            </button>
            <button className="btn btn-secondary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}>
              <Printer size={16} /> {t('exportPdf')}
            </button>
          </div>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '8px' }}>
            <input type="text" className="form-input" placeholder={t('searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}><Search size={18} /></button>
          </form>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '150px' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>{t('filterByStatus')}</label>
              <select className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">{t('allStatuses')}</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ minWidth: '150px' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>{t('filterByType')}</label>
              <select className="form-select" style={{ padding: '8px 12px', fontSize: '13px' }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">{t('allTypes')}</option>
                {INCIDENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="notif-empty">{t('fetchingRecords')}</div>
        ) : incidents.length === 0 ? (
          <div className="notif-empty">{t('noReportsMatching')}</div>
        ) : (
          <div className="table-container">
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t('colCode')}</th>
                    <th>{t('colPriority')}</th>
                    <th>{t('colType')}</th>
                    <th>{t('colDesc')}</th>
                    <th>{t('colReporter')}</th>
                    <th>{t('colExactLocation') || 'Exact Location'}</th>
                    <th>{t('colDate')}</th>
                    <th>{t('colStatus')}</th>
                    <th className="no-print">{t('colAction')}</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident.id} style={{ backgroundColor: incident.priority === 'CRITICAL' ? '#ffebee' : 'transparent', borderLeft: incident.priority === 'CRITICAL' ? '4px solid #c62828' : 'none' }}>
                      <td style={{ fontWeight: '700' }}>{incident.code}</td>
                      <td>
                        {incident.priority === 'CRITICAL'
                          ? <span className="badge" style={{ background: '#c62828', color: 'white', fontWeight: 'bold' }}>{t('badgeCritical')}</span>
                          : <span style={{ fontSize: '12px', color: '#666' }}>{t('badgeNormal')}</span>}
                      </td>
                      <td>{incident.type}</td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{incident.description}</td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{incident.reporter_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{incident.reporter_phone}</div>
                      </td>
                      <td>📍 {incident.location_address || t('gpsLocationOnly') || 'GPS Location Only'}</td>
                      <td>{new Date(incident.created_at).toLocaleString()}</td>
                      <td>{getStatusBadge(incident.status)}</td>
                      <td className="no-print">
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link to={`/incidents/${incident.id}`} className="btn btn-secondary" style={{ padding: '8px', display: 'inline-flex' }}>
                            <Eye size={16} />
                          </Link>
                          {user?.role === 'Admin' && (
                            <button className="btn btn-secondary" style={{ padding: '8px', display: 'inline-flex', color: 'var(--danger-color)' }} onClick={() => handleDeleteIncident(incident.id, incident.code)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentList;
