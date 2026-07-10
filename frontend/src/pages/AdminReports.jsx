import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileBarChart, Download, Calendar } from 'lucide-react';

const AdminReports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/dashboard/stats');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching admin reports data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    if (format === 'pdf') {
      window.print();
      return;
    }

    setExporting(true);
    try {
      const res = await axios.get('/api/incidents');
      const incidents = res.data;

      if (!incidents || incidents.length === 0) {
        alert('No incident reports found to export.');
        return;
      }

      const headers = ['Report Code', 'Incident Type', 'Description', 'Reporter Name', 'Reporter Phone', 'Barangay', 'Latitude', 'Longitude', 'Status', 'Created At'];
      const rows = incidents.map(inc => [
        inc.code,
        inc.type,
        `"${(inc.description || '').replace(/"/g, '""')}"`,
        inc.reporter_name || '',
        inc.reporter_phone || '',
        inc.reporter_barangay || '',
        inc.location_lat || '',
        inc.location_lng || '',
        inc.status,
        new Date(inc.created_at).toISOString()
      ]);

      const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Jamindan_Emergency_Reports_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting CSV', err);
      alert('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="content-body"><p>Loading reports...</p></div>;
  }

  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Reports</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Analyze and export emergency platform data</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileBarChart size={18} />
            Data Analytics Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)' }}>
                {data?.metrics?.totalReports || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Total Emergency Dispatches Logged</div>
            </div>
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary-color)' }}>
                {data?.metrics?.activeIncidents || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>Active / Ongoing Incidents</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Export Incident Logs</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '20px' }}>
            Download complete historical registers of incident reports, timestamps, location coordinates, dispatch updates, and resolution parameters.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => handleExport('csv')} disabled={exporting}>
              <Download size={16} /> {exporting ? 'Exporting...' : 'Export as CSV'}
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('pdf')} disabled={exporting}>
              <Calendar size={16} /> Export PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
