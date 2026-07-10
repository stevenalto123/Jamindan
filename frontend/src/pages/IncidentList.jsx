import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FileText, Search, PlusCircle, Eye, Trash2 } from 'lucide-react';

const INCIDENT_TYPES = ['Fire', 'Medical', 'Flood', 'Crime', 'Accident', 'Other'];
const STATUSES = ['Pending', 'Under Review', 'In Progress', 'Resolved'];

const IncidentList = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000);
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleDeleteIncident = async (id, code) => {
    if (!window.confirm(`Are you sure you want to permanently delete incident report ${code}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/incidents/${id}`);
      fetchIncidents();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete report.');
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
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>
            <FileText size={24} />
            {isResident ? 'Track Report Status' : 'Incident Reports Inbox'}
          </h2>
          {isResident && (
            <Link to="/report" className="btn btn-accent">
              <PlusCircle size={18} />
              Submit New Report
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {!isResident && (
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search code, name, barangay..."
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
              <label className="form-label" style={{ fontSize: '11px' }}>Filter by Status</label>
              <select
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div style={{ minWidth: '150px' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Filter by Type</label>
              <select
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '13px' }}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                {INCIDENT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="notif-empty">Fetching incident records...</div>
        ) : incidents.length === 0 ? (
          <div className="notif-empty">No reports found matching the filters.</div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Report Code</th>
                  <th>Type</th>
                  <th>Description</th>
                  {!isResident && <th>Reporter</th>}
                  {!isResident && <th>Barangay</th>}
                  <th>Submitted Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((incident) => (
                  <tr key={incident.id}>
                    <td style={{ fontWeight: '700' }}>{incident.code}</td>
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
                    {!isResident && <td>{incident.reporter_barangay}</td>}
                    <td>{new Date(incident.created_at).toLocaleString()}</td>
                    <td>{getStatusBadge(incident.status)}</td>
                    <td>
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
        )}
      </div>
    </div>
  );
};

export default IncidentList;
export { STATUSES };
