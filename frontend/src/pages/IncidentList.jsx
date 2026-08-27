import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Search, PlusCircle, Eye, Trash2, Download, Printer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const INCIDENT_TYPES = ['Fire', 'Medical', 'Flood', 'Crime', 'Accident', 'Other', 'Landslide'];
export const STATUSES = ['Pending', 'Under Review', 'In Progress', 'Resolved'];

const IncidentList = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
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

  const handleExportCSV = () => {
    if (!incidents || incidents.length === 0) {
      alert(t('noReportsExport'));
      return;
    }

    const headers = ['Report Code', 'Incident Type', 'Description', 'Reporter Name', 'Reporter Phone', 'Location', 'Submitted Date', 'Status'];
    const rows = incidents.map(inc => [
      inc.code,
      inc.type,
      `"${(inc.description || '').replace(/"/g, '""')}"`,
      inc.reporter_name || '',
      inc.reporter_phone || '',
      (inc.location_lat && inc.location_lng) ? `"${inc.location_lat}, ${inc.location_lng}"` : (inc.reporter_barangay || ''),
      new Date(inc.created_at).toLocaleString(),
      inc.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Jamindan_Emergency_Incidents_Filtered_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleDeleteIncident = async (id, code) => {
    if (!window.confirm(t('confirmDeleteReport').replace('{code}', code))) {
      return;
    }

    try {
      await axios.delete(`/api/incidents/${id}`);
      fetchIncidents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || t('failedDeleteReport'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending</span>;
      case 'Under Review': return <span className="badge badge-review">Under Review</span>;
      case 'In Progress': return <span className="badge badge-progress">In Progress</span>;
      case 'Resolved': return <span className="badge badge-resolved">Resolved</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const isResident = user?.role === 'Resident';

  return (
    <div className="content-body">
      <style>{`
        .print-only {
          display: none !important;
        }
        @media print {
          .print-only {
            display: block !important;
          }
          .no-print {
            display: none !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .table-container {
            border: none !important;
            box-shadow: none !important;
            margin-top: 10px !important;
          }
          .custom-table th {
            background-color: #f0f0f0 !important;
            border-bottom: 2px solid #ccc !important;
            color: #000000 !important;
          }
          .custom-table td {
            border-bottom: 1px solid #ddd !important;
          }
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
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#555' }}>
            {t('generatedOn')} {new Date().toLocaleString()} | {t('roleLabel')} {user?.role}
          </p>
          <div style={{ display: 'inline-flex', gap: '15px', marginTop: '6px', fontSize: '11px', backgroundColor: '#f5f5f5', padding: '4px 12px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <span><strong>{t('statusFilterLabel')}</strong> {statusFilter || t('allStatuses')}</span>
            <span><strong>{t('typeFilterLabel')}</strong> {typeFilter || t('allTypes')}</span>
            {search && <span><strong>{t('searchTermLabel')}</strong> "{search}"</span>}
            <span><strong>{t('countRecords').replace('{count}', incidents.length)}</strong></span>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          {isResident ? (
            <Link to="/report" className="btn btn-accent no-print">
              <PlusCircle size={18} />
              {t('submitNewReport')}
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }} className="no-print">
              <button 
                className="btn btn-primary" 
                onClick={handleExportCSV}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                title="Export current filtered list to CSV"
              >
                <Download size={16} /> {t('exportCsv')}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleExportPDF}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
                title="Print current filtered list to PDF"
              >
                <Printer size={16} /> {t('exportPdf')}
              </button>
            </div>
          )}
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {!isResident && (
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }} title="Search">
                <Search size={18} />
              </button>
            </form>
          )}

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ minWidth: '150px' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>{t('filterByStatus')}</label>
              <select
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{t('allStatuses')}</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '150px' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>{t('filterByType')}</label>
              <select
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">{t('allTypes')}</option>
                {INCIDENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
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
                  {!isResident && <th>{t('colReporter')}</th>}
                  {!isResident && <th>{t('colExactLocation') || 'Exact Location'}</th>}
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
                      {incident.priority === 'CRITICAL' ? (
                        <span className="badge" style={{ background: '#c62828', color: 'white', fontWeight: 'bold' }}>{t('badgeCritical')}</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#666' }}>{t('badgeNormal')}</span>
                      )}
                    </td>
                    <td>{incident.type}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {incident.description}
                    </td>
                    {!isResident && (
                      <td>
                        <div style={{ fontWeight: '500' }}>{incident.reporter_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{incident.reporter_phone}</div>
                      </td>
                    )}
                    {!isResident && <td>📍 {incident.location_address || t('gpsLocationOnly') || 'GPS Location Only'}</td>}
                    <td>{new Date(incident.created_at).toLocaleString()}</td>
                    <td>{getStatusBadge(incident.status)}</td>
                    <td className="no-print">
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link to={`/incidents/${incident.id}`} className="btn btn-secondary" style={{ padding: '8px', display: 'inline-flex' }}>
                          <Eye size={16} />
                        </Link>
                        {user?.role === 'Admin' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '8px', display: 'inline-flex', color: 'var(--danger-color)' }}
                            onClick={() => handleDeleteIncident(incident.id, incident.code)}
                            title="Delete Incident Report"
                          >
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
