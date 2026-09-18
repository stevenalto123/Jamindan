import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Search, PlusCircle, Eye, Trash2, Download, Printer, Flame, HeartPulse, Droplets, Car, ShieldAlert, HelpCircle, MapPin, Clock, ChevronRight, AlertTriangle, Filter } from 'lucide-react';
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
  'Pending':     { color: '#b45309', bg: '#fef3c7', label: 'Pending'     },
  'Acknowledged':{ color: '#0369a1', bg: '#e0f2fe', label: 'Acknowledged'},
  'Responding':  { color: '#6d28d9', bg: '#ede9fe', label: 'Responding'  },
  'On Scene':    { color: '#0f766e', bg: '#ccfbf1', label: 'On Scene'    },
  'Resolved':    { color: '#15803d', bg: '#dcfce7', label: 'Resolved'    },
};

const IncidentList = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Pagination Logic
  const totalPages = Math.ceil(incidents.length / itemsPerPage) || 1;
  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return incidents.slice(start, start + itemsPerPage);
  }, [incidents, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter changes
  }, [statusFilter, typeFilter, search, incidents.length]);

  const handleExportCSV = () => {
    if (!incidents || incidents.length === 0) { alert(t('noReportsExport')); return; }
    const headers = ['Report Code', 'Incident Type', 'Priority', 'Description', 'Reporter Name', 'Reporter Phone', 'Location', 'Submitted Date', 'Status'];
    const rows = incidents.map(inc => [
      inc.code, inc.type, inc.priority,
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
    if (s) return <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>{s.label}</span>;
    return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>{status}</span>;
  };

  const isResident = user?.role === 'Resident';
  const useCardView = isResident || (isMobile && user?.role === 'Responder');

  // 🔹🔹🔹 MOBILE / RESIDENT CARD VIEW 🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹🔹
  if (useCardView) {
    return (
      <div className="content-body" style={{ paddingBottom: '80px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header & Submit Button (Residents Only) */}
        {isResident && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <Link to="/report" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', fontSize: '15px', fontWeight: '800', borderRadius: '12px', background: 'var(--danger-color)', color: 'white', textDecoration: 'none', boxShadow: '0 4px 16px rgba(231, 76, 60, 0.3)' }}>
              <PlusCircle size={20} /> {t('submitNewReport')}
            </Link>
          </div>
        )}

        {/* Filters Container */}
        <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="input-icon-wrapper" style={{ flex: 1, minWidth: '130px' }}>
            <select
              className="form-select"
              style={{ height: '44px', paddingLeft: '40px', fontSize: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('allStatuses')}</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Filter size={18} className="input-icon-left" style={{ left: '14px', color: 'var(--text-muted)' }} />
          </div>
          <div className="input-icon-wrapper" style={{ flex: 1, minWidth: '130px' }}>
            <select
              className="form-select"
              style={{ height: '44px', paddingLeft: '40px', fontSize: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">{t('allTypes')}</option>
              {INCIDENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
            </select>
            <Filter size={18} className="input-icon-left" style={{ left: '14px', color: 'var(--text-muted)' }} />
          </div>
        </div>

        {/* Report Cards */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            {t('fetchingRecords')}
          </div>
        ) : incidents.length === 0 ? (
          <div style={{ background: 'var(--card-bg)', padding: '60px 20px', textAlign: 'center', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
            <FileText size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '16px', margin: 0 }}>{t('noReportsMatching')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Tap the button above to submit your first report.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {incidents.map((incident) => {
              const meta = TYPE_META[incident.type] || TYPE_META['Other'];
              const Icon = meta.icon;
              const isCritical = incident.priority === 'CRITICAL';
              return (
                <Link
                  key={incident.id}
                  to={`/incidents/${incident.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={{
                      background: 'var(--card-bg)',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid var(--border-color)',
                      borderLeft: isCritical ? '6px solid #e11d48' : `6px solid ${meta.color}`,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.03)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ padding: '12px', backgroundColor: meta.bg, borderRadius: '12px', flexShrink: 0 }}>
                        <Icon size={24} color={meta.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '800', fontSize: '18px', color: 'var(--text-main)' }}>{incident.type}</span>
                          {isCritical && <span style={{ backgroundColor: '#ffe4e6', color: '#e11d48', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' }}>CRITICAL</span>}
                        </div>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700', fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>{incident.code}</span>
                      </div>
                      {getStatusBadge(incident.status)}
                      <ChevronRight size={20} color="var(--text-muted)" style={{ flexShrink: 0, marginLeft: '8px' }} />
                    </div>

                    <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6', fontWeight: '500' }}>
                      {incident.description?.length > 120 ? incident.description.substring(0, 120) + '...' : incident.description}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                      <Clock size={14} color="var(--text-muted)" />
                      <span style={{ fontSize: '13px', color: 'var(--text-light)', fontWeight: '600' }}>
                        {new Date(incident.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
    <div className="content-body" style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Dynamic Printing CSS */}
      <style>{`
        .print-only { display: none !important; }
        @media print {
          .print-only { display: block !important; }
          .no-print { display: none !important; }
          .content-body { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .glass-card, .table-container { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          body { background: #ffffff !important; color: #000000 !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th { background-color: #f0f0f0 !important; border-bottom: 2px solid #000 !important; color: #000 !important; padding: 10px !important; text-align: left; }
          td { border-bottom: 1px solid #ccc !important; padding: 8px !important; color: #000 !important; }
          .badge, span { background: none !important; color: #000 !important; border: 1px solid #000 !important; padding: 2px 6px !important; border-radius: 4px !important; }
        }
      `}</style>

      {/* Print Only Official Header */}
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

      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '10px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Download size={18} /> {t('exportCsv')}
          </button>
          <button 
            onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f172a', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)', transition: 'transform 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Printer size={18} /> {t('exportPdf')}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ background: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
        
        {/* Premium Toolbar */}
        <div className="no-print" style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '280px', display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', height: '44px', paddingLeft: '16px', paddingRight: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
                  placeholder="Search by code, reporter, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="submit" style={{ height: '44px', width: '44px', borderRadius: '12px', background: 'var(--primary-color)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <Search size={20} />
              </button>
            </form>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div className="input-icon-wrapper" style={{ minWidth: '180px' }}>
                <select
                  className="form-select"
                  style={{ height: '44px', paddingLeft: '40px', fontSize: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">{t('allStatuses')}</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Filter size={18} className="input-icon-left" style={{ left: '14px', color: 'var(--text-muted)' }} />
              </div>
              <div className="input-icon-wrapper" style={{ minWidth: '180px' }}>
                <select
                  className="form-select"
                  style={{ height: '44px', paddingLeft: '40px', fontSize: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">{t('allTypes')}</option>
                  {INCIDENT_TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                </select>
                <Filter size={18} className="input-icon-left" style={{ left: '14px', color: 'var(--text-muted)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ flex: 1, padding: '12px' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              {t('fetchingRecords')}
            </div>
          ) : paginatedIncidents.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600' }}>
              {search || statusFilter || typeFilter ? "No incidents match your filters." : "No incidents reported yet."}
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="show-mobile-flex" style={{ flexDirection: 'column', gap: '12px' }}>
                {paginatedIncidents.map((incident) => {
                  const isCritical = incident.priority === 'CRITICAL';
                  return (
                    <Link to={`/incidents/${incident.id}`} key={incident.id} style={{ textDecoration: 'none', background: isCritical ? '#fff1f2' : 'white', borderRadius: '12px', padding: '16px', border: isCritical ? '1px solid #ffe4e6' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)', background: isCritical ? '#fecdd3' : '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontFamily: 'monospace' }}>{incident.code}</span>
                          {isCritical && <span style={{ fontSize: '10px', background: '#e11d48', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', animation: 'pulse 2s infinite' }}>CRITICAL</span>}
                        </div>
                        {getStatusBadge(incident.status)}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{incident.type}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{incident.location_address || 'Coordinates Only'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '4px' }}>
                        <span>{new Date(incident.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>View Details →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hide-mobile" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>{t('colCode')}</th>
                    <th style={{ padding: '0 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Type</th>
                    <th style={{ padding: '0 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px', width: '25%' }}>{t('colDesc')}</th>
                    <th style={{ padding: '0 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>{t('colReporter')}</th>
                    <th style={{ padding: '0 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px', width: '20%' }}>Location</th>
                    <th style={{ padding: '0 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Date</th>
                    <th style={{ padding: '0 16px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Status</th>
                    <th className="no-print" style={{ padding: '0 16px', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '800', letterSpacing: '0.5px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedIncidents.map((incident) => {
                    const isCritical = incident.priority === 'CRITICAL';
                    return (
                      <tr 
                        key={incident.id} 
                        style={{ 
                          background: isCritical ? '#fff1f2' : 'white', 
                          border: isCritical ? '1px solid #ffe4e6' : '1px solid transparent',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = isCritical ? '#ffe4e6' : '#f8fafc'}
                        onMouseOut={e => e.currentTarget.style.background = isCritical ? '#fff1f2' : 'white'}
                      >
                        <td style={{ padding: '16px', borderRadius: '12px 0 0 12px', borderLeft: isCritical ? '4px solid #e11d48' : '4px solid transparent' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--text-main)', background: isCritical ? '#fecdd3' : '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>
                            {incident.code}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{incident.type}</span>
                            {isCritical && (
                              <span style={{ display: 'inline-block', fontSize: '10px', background: '#e11d48', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.5px', animation: 'pulse 2s infinite' }}>
                                CRITICAL
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-main)', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {incident.description}
                          </p>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{incident.reporter_name}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>{incident.reporter_phone}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>
                            <MapPin size={14} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{incident.location_address || 'Coordinates Only'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text-main)', fontWeight: '600' }}>
                          {new Date(incident.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {getStatusBadge(incident.status)}
                        </td>
                        <td className="no-print" style={{ padding: '16px', borderRadius: '0 12px 12px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <Link 
                              to={`/incidents/${incident.id}`} 
                              style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary-color)', transition: 'background 0.2s' }}
                              onMouseOver={e => e.currentTarget.style.background = '#dbeafe'}
                              onMouseOut={e => e.currentTarget.style.background = 'var(--primary-light)'}
                              title="View Details"
                            >
                              <Eye size={18} />
                            </Link>
                            {user?.role === 'Admin' && (
                              <button 
                                onClick={() => handleDeleteIncident(incident.id, incident.code)}
                                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                                onMouseOver={e => e.currentTarget.style.background = '#fecaca'}
                                onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}
                                title="Delete Report"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="no-print" style={{ padding: '20px', borderTop: '1px solid var(--border-color)', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn btn-secondary"
              style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              ‹
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(pg => pg === 1 || pg === totalPages || Math.abs(currentPage - pg) <= 2)
              .map((pg, idx, arr) => (
                <React.Fragment key={pg}>
                  {idx > 0 && pg - arr[idx - 1] > 1 && (
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>...</span>
                  )}
                  <button
                    style={{ 
                      height: '40px', 
                      minWidth: '40px', 
                      padding: '0 12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: '12px',
                      backgroundColor: currentPage === pg ? 'var(--primary-color)' : '#ffffff',
                      color: currentPage === pg ? '#ffffff' : 'var(--text-main)',
                      fontWeight: '800',
                      border: currentPage === pg ? 'none' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                    onClick={() => setCurrentPage(pg)}
                  >
                    {pg}
                  </button>
                </React.Fragment>
              ))}

            <button 
              className="btn btn-secondary"
              style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(225, 29, 72, 0); }
          100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0); }
        }
      `}</style>
    </div>
  );
};

export default IncidentList;
