import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  ArrowLeft, TrendingUp, CheckCircle, Clock, Map as MapIcon, 
  BarChart3, AlertTriangle, Download, Printer, FileText, 
  Shield, Building2, Users, Calendar, Filter, RefreshCw
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const JAMINDAN_BARANGAYS = [
  'All', 'Agcalaga', 'Aglanot', 'Agloban', 'Agloloway', 'Bayuyan', 'Cabatangan', 'Caridad', 
  'Esperanza', 'Fe', 'Ganzon', 'Guintas', 'Igang', 'Jagnaya', 'Jaena Norte', 'Jaena Sur', 
  'Kibao', 'Linambasan', 'Lucero', 'Maayon', 'Milan', 'Molet', 'Pangabuan', 'Pasol-o', 
  'Poblacion', 'San Jose', 'San Juan', 'San Roque', 'San Vicente', 'Santa Cruz', 'Santa Fe'
];

const AGENCIES = ['All', 'MDRRMO', 'BFP', 'RHU'];

const AdminAnalytics = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'master-log' | 'barangay' | 'agency' | 'casualty'

  // Filters
  const [period, setPeriod] = useState('month'); // 'today' | 'week' | 'month' | 'year' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('All');
  const [selectedAgency, setSelectedAgency] = useState('All');
  const [searchLog, setSearchLog] = useState('');

  // Data states
  const [summary, setSummary] = useState({ total: 0, resolved: 0, active: 0, avgResponseMinutes: 0 });
  const [typeData, setTypeData] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [masterLogs, setMasterLogs] = useState([]);
  const [barangayReports, setBarangayReports] = useState([]);
  const [agencyReports, setAgencyReports] = useState([]);
  const [casualtyReport, setCasualtyReport] = useState({ summary: {}, impactList: [] });
  const [loading, setLoading] = useState(true);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);

  // Build filter query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (period === 'custom') {
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
    } else {
      params.append('period', period);
    }
    if (selectedBarangay !== 'All') params.append('barangay', selectedBarangay);
    if (selectedAgency !== 'All') params.append('agency', selectedAgency);
    return params.toString();
  };

  const fetchAllData = async () => {
    setLoading(true);
    const qs = buildQueryParams();
    try {
      const [sumRes, typeRes, heatRes, logRes, brgyRes, agencyRes, casRes] = await Promise.all([
        axios.get(`/api/analytics/summary?${qs}`),
        axios.get(`/api/analytics/by-type?${qs}`),
        axios.get(`/api/analytics/heatmap?${qs}`),
        axios.get(`/api/analytics/reports/master-log?${qs}`),
        axios.get(`/api/analytics/reports/barangay-summary?${qs}`),
        axios.get(`/api/analytics/reports/agency-performance?${qs}`),
        axios.get(`/api/analytics/reports/casualty-damage?${qs}`)
      ]);

      setSummary(sumRes.data);
      setTypeData(typeRes.data);
      setHeatData(heatRes.data);
      setMasterLogs(logRes.data.reports || []);
      setBarangayReports(brgyRes.data.barangays || []);
      setAgencyReports(agencyRes.data.agencyPerformance || []);
      setCasualtyReport(casRes.data || { summary: {}, impactList: [] });
    } catch (err) {
      console.error('Failed to fetch analytics and reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [period, startDate, endDate, selectedBarangay, selectedAgency]);

  // Initialize and update Map / Heatmap when on 'overview' tab
  useEffect(() => {
    if (loading || activeTab !== 'overview' || !mapContainerRef.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([11.4287, 122.4842], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    if (heatData.length > 0) {
      if (heatLayerRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
      }
      window.L = L;
      import('leaflet.heat').then(() => {
        if (L.heatLayer && mapRef.current) {
          heatLayerRef.current = L.heatLayer(heatData, {
            radius: 35,
            blur: 20,
            maxZoom: 17,
            gradient: { 0.4: '#3b82f6', 0.6: '#06b6d4', 0.8: '#eab308', 1.0: '#ef4444' }
          }).addTo(mapRef.current);
        }
      }).catch(err => console.error('Failed to load heatmap layer:', err));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, activeTab, heatData]);

  // Print handler
  const handlePrint = () => {
    if (mapRef.current) {
      mapRef.current.invalidateSize();
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Export CSV handler
  const handleExportCSV = () => {
    let filename = `Jamindan_MDRRMO_Report_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    let headers = [];
    let rows = [];

    if (activeTab === 'master-log' || activeTab === 'overview') {
      filename = `Jamindan_Incident_Master_Log_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Incident Code', 'Date & Time', 'Emergency Type', 'Lead Agency', 'Priority', 'Barangay', 'Specific Location', 'Reporter Name', 'Reporter Contact', 'Assigned Responder', 'Response Time (Mins)', 'Status'];
      rows = masterLogs.map(r => [
        r.code,
        `"${new Date(r.created_at).toLocaleString()}"`,
        r.type,
        r.lead_agency || 'MDRRMO',
        r.priority || 'Normal',
        r.reporter_barangay || '',
        `"${(r.location_address || `${r.location_lat}, ${r.location_lng}` || '').replace(/"/g, '""')}"`,
        `"${(r.reporter_name || '').replace(/"/g, '""')}"`,
        r.reporter_phone || '',
        `"${(r.responder_name || 'Unassigned').replace(/"/g, '""')}"`,
        r.response_time_minutes ?? 'Pending',
        r.status
      ]);
    } else if (activeTab === 'barangay') {
      filename = `Jamindan_Barangay_Disaster_Risk_Summary_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Barangay', 'Total Incidents', 'Active Emergencies', 'Resolved Incidents', 'Fire', 'Medical', 'Flood', 'Accident', 'Crime', 'Other'];
      rows = barangayReports.map(b => [
        `"${b.barangay}"`,
        b.total_incidents,
        b.active_count,
        b.resolved_count,
        b.fire_count,
        b.medical_count,
        b.flood_count,
        b.accident_count,
        b.crime_count,
        b.other_count
      ]);
    } else if (activeTab === 'agency') {
      filename = `Jamindan_Agency_Dispatch_Performance_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Agency / Entity', 'Total Dispatched Incidents', 'Resolved Count', 'In Progress', 'Pending Action', 'Average Response Time (Mins)'];
      rows = agencyReports.map(a => [
        a.agency,
        a.total_incidents,
        a.resolved_count,
        a.dispatched_count,
        a.pending_count,
        a.avg_response_mins ?? 'N/A'
      ]);
    } else if (activeTab === 'casualty') {
      filename = `Jamindan_Casualty_and_Damage_Report_${new Date().toISOString().split('T')[0]}.csv`;
      headers = ['Incident Code', 'Type', 'Barangay', 'Date', 'Reported Victims / Injured', 'Affected Households', 'Rescues Needed', 'Specific Injury Notes', 'Water Level'];
      rows = (casualtyReport.impactList || []).map(c => [
        c.code,
        c.type,
        `"${c.barangay}"`,
        `"${new Date(c.date).toLocaleDateString()}"`,
        c.victims,
        c.households,
        c.rescues,
        `"${(c.injuries || '').replace(/"/g, '""')}"`,
        `"${c.water_level || ''}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

  const getFilteredLogs = () => {
    if (!searchLog.trim()) return masterLogs;
    const q = searchLog.toLowerCase();
    return masterLogs.filter(l => 
      (l.code && l.code.toLowerCase().includes(q)) ||
      (l.type && l.type.toLowerCase().includes(q)) ||
      (l.reporter_name && l.reporter_name.toLowerCase().includes(q)) ||
      (l.reporter_barangay && l.reporter_barangay.toLowerCase().includes(q)) ||
      (l.lead_agency && l.lead_agency.toLowerCase().includes(q)) ||
      (l.status && l.status.toLowerCase().includes(q))
    );
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="content-body" style={{ maxWidth: '1350px', margin: '0 auto', padding: '20px' }}>
      
      {/* Top Action Bar (Screen Only) */}
      <div className="no-print" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <button 
          onClick={() => navigate('/admin')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px' }}
        >
          <ArrowLeft size={18} /> Back to Command Center
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={handleExportCSV} className="btn" style={{ backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
            <Download size={16} /> Export CSV
          </button>
          <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', padding: '10px 18px', borderRadius: '10px' }}>
            <Printer size={16} /> Print Official Report
          </button>
        </div>
      </div>

      {/* Official Government Header (Visible on PRINT & Screen) */}
      <div className="print-header" style={{ textAlign: 'center', marginBottom: '24px', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1.5px', color: 'var(--text-muted)' }}>
          Republic of the Philippines • Province of Capiz
        </div>
        <h1 style={{ margin: '4px 0', fontSize: '24px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '0.5px' }}>
          MUNICIPALITY OF JAMINDAN
        </h1>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Municipal Disaster Risk Reduction & Management Office (MDRRMO)
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>
          Official Emergency Monitoring & Disaster Documentation Report • Generated on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Filter Toolbar (No-Print) */}
      <div className="card no-print" style={{ padding: '18px', marginBottom: '24px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>
          <Filter size={16} color="var(--primary-color)" /> Filter Report Period & Scope
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-color)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: '30 Days' },
              { id: 'year', label: '1 Year' },
              { id: 'custom', label: 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: period === p.id ? '800' : '600',
                  backgroundColor: period === p.id ? 'var(--primary-color)' : 'transparent',
                  color: period === p.id ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }} 
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }} 
              />
            </div>
          )}

          {/* Barangay Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Barangay:</span>
            <select 
              value={selectedBarangay} 
              onChange={e => setSelectedBarangay(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}
            >
              {JAMINDAN_BARANGAYS.map(b => (
                <option key={b} value={b}>{b === 'All' ? 'All Barangays' : `Brgy. ${b}`}</option>
              ))}
            </select>
          </div>

          {/* Agency Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Agency:</span>
            <select 
              value={selectedAgency} 
              onChange={e => setSelectedAgency(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}
            >
              {AGENCIES.map(a => (
                <option key={a} value={a}>{a === 'All' ? 'All Concerned Agencies' : a}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={fetchAllData}
            title="Refresh Data"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs (No-Print) */}
      <div className="no-print" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '24px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'overview', label: 'Overview & Visual Analytics', icon: BarChart3 },
          { id: 'master-log', label: 'Incident Master Log', icon: FileText, count: masterLogs.length },
          { id: 'barangay', label: 'Barangay Risk Summary', icon: Building2, count: barangayReports.length },
          { id: 'agency', label: 'Concerned Agency Performance', icon: Shield, count: agencyReports.length },
          { id: 'casualty', label: 'Casualty & Damage Assessment', icon: Users, count: casualtyReport.impactList?.length || 0 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? '800' : '600',
                fontSize: '14px',
                color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                marginBottom: '-6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '10px', backgroundColor: isActive ? 'var(--primary-color)' : '#e2e8f0', color: isActive ? 'white' : '#475569' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* KPI Cards (Print and Screen) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #3b82f6', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Total Incidents</span>
            <TrendingUp size={22} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', marginTop: '8px' }}>{summary.total}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Recorded in selected scope</div>
        </div>

        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #ef4444', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Active Emergencies</span>
            <AlertTriangle size={22} color="#ef4444" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#ef4444', marginTop: '8px' }}>{summary.active}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Pending / In Progress</div>
        </div>

        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #10b981', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Resolved Incidents</span>
            <CheckCircle size={22} color="#10b981" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#10b981', marginTop: '8px' }}>{summary.resolved}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Successfully handled</div>
        </div>

        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #f59e0b', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Avg Response Time</span>
            <Clock size={22} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-main)', marginTop: '8px' }}>{summary.avgResponseMinutes} min</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Time to active dispatch</div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & VISUAL ANALYTICS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Chart */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="var(--primary-color)" /> Emergency Incidents by Category
            </h3>
            <div style={{ width: '100%', height: '280px' }}>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={typeData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
                  No incident records found for this period.
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapIcon size={18} color="#ef4444" /> Disaster Hotspot Density Heatmap
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>
                Geospatial concentration of emergency reports in the Municipality of Jamindan to guide resource prepositioning.
              </p>
            </div>
            <div style={{ width: '100%', height: '380px', position: 'relative' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENT MASTER LOG */}
      {activeTab === 'master-log' && (
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Official Incident Master Log</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Complete chronological registry of all reported incidents and response timelines.</p>
            </div>
            <div className="no-print">
              <input 
                type="text" 
                placeholder="Search log records..." 
                value={searchLog} 
                onChange={e => setSearchLog(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', width: '220px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Code</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Date & Time</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Type</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Lead Agency</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Barangay</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Reporter</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Assigned Unit</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Response Time</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--primary-color)' }}>{log.code}</td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '700' }}>{log.type}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', backgroundColor: log.lead_agency === 'BFP' ? '#fee2e2' : log.lead_agency === 'RHU' ? '#ecfdf5' : '#eff6ff', color: log.lead_agency === 'BFP' ? '#dc2626' : log.lead_agency === 'RHU' ? '#059669' : '#2563eb' }}>
                        {log.lead_agency || 'MDRRMO'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{log.reporter_barangay || 'Poblacion'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: '700' }}>{log.reporter_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>{log.reporter_phone}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{log.responder_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                    <td style={{ padding: '10px 12px' }}>{log.response_time_minutes !== null ? `${log.response_time_minutes} min` : '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: '800',
                        backgroundColor: log.status === 'Resolved' ? '#dcfce7' : log.status === 'In Progress' ? '#fef3c7' : '#fee2e2',
                        color: log.status === 'Resolved' ? '#15803d' : log.status === 'In Progress' ? '#b45309' : '#b91c1c'
                      }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                      No incident master logs match the active filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BARANGAY RISK SUMMARY */}
      {activeTab === 'barangay' && (
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Barangay Disaster Risk & Incidence Summary</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Aggregated breakdown of incidents across all 30+ Jamindan barangays for hazard assessment.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Barangay</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Total Reported</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Active</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Resolved</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>🔥 Fire</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>🚑 Medical</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>🌊 Flood</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>🚗 Accident</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>🛡️ Crime</th>
                </tr>
              </thead>
              <tbody>
                {barangayReports.length > 0 ? barangayReports.map((b, idx) => (
                  <tr key={b.barangay || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)' }}>Brgy. {b.barangay}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '900', color: 'var(--primary-color)' }}>{b.total_incidents}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#ef4444', fontWeight: '800' }}>{b.active_count}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#10b981', fontWeight: '800' }}>{b.resolved_count}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{b.fire_count}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{b.medical_count}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{b.flood_count}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{b.accident_count}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>{b.crime_count}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                      No barangay summary records available for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CONCERNED AGENCY PERFORMANCE */}
      {activeTab === 'agency' && (
        <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Concerned Entity & Agency Dispatch Report</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Inter-agency monitoring for MDRRMO, BFP, and RHU response performance.</p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '800' }}>Concerned Entity / Agency</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Dispatched Incidents</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Resolved</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Active Response</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Pending</th>
                  <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Avg Response Time</th>
                </tr>
              </thead>
              <tbody>
                {agencyReports.length > 0 ? agencyReports.map((a, idx) => (
                  <tr key={a.agency || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shield size={16} color="var(--primary-color)" />
                      {a.agency === 'BFP' ? 'Bureau of Fire Protection (BFP)' : 
                       a.agency === 'RHU' ? 'Rural Health Unit / Paramedics (RHU)' : 
                       'Jamindan Response Unit (MDRRMO)'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '900', color: 'var(--primary-color)' }}>{a.total_incidents}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: '800' }}>{a.resolved_count}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#f59e0b', fontWeight: '800' }}>{a.dispatched_count}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444', fontWeight: '800' }}>{a.pending_count}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700' }}>{a.avg_response_mins ? `${a.avg_response_mins} mins` : '—'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                      No agency dispatch data recorded for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CASUALTY & DAMAGE ASSESSMENT */}
      {activeTab === 'casualty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid #ef4444', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Reported Victims / Injured</div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#ef4444', marginTop: '6px' }}>{casualtyReport.summary?.totalVictims || 0}</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid #3b82f6', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Affected Households</div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#3b82f6', marginTop: '6px' }}>{casualtyReport.summary?.totalHouseholds || 0}</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Rescues Required</div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#f59e0b', marginTop: '6px' }}>{casualtyReport.summary?.totalRescuesNeeded || 0}</div>
            </div>
            <div className="card" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6', borderRadius: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Vehicles Involved</div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: '#8b5cf6', marginTop: '6px' }}>{casualtyReport.summary?.totalVehiclesInvolved || 0}</div>
            </div>
          </div>

          {/* Detailed table */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>Casualty & Property Damage Incident Registry</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Code</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Type</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Barangay</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Victims/Injured</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center' }}>Affected Households</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Injury / Condition Notes</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800' }}>Flood Depth</th>
                  </tr>
                </thead>
                <tbody>
                  {casualtyReport.impactList && casualtyReport.impactList.length > 0 ? casualtyReport.impactList.map((c, idx) => (
                    <tr key={c.code || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--primary-color)' }}>{c.code}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '700' }}>{c.type}</td>
                      <td style={{ padding: '10px 12px' }}>Brgy. {c.barangay}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800', color: c.victims > 0 ? '#ef4444' : 'inherit' }}>{c.victims}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '800' }}>{c.households}</td>
                      <td style={{ padding: '10px 12px' }}>{c.injuries}</td>
                      <td style={{ padding: '10px 12px' }}>{c.water_level}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                        No specific casualty or severe damage records filed in this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Official Signatory Certification Block (Visible on PRINT) */}
      <div className="print-only" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ccc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>Prepared & Generated By:</div>
          <div style={{ marginTop: '35px', fontWeight: '800', fontSize: '14px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            {user?.full_name || 'System Administrator'}
          </div>
          <div style={{ fontSize: '12px', color: '#444' }}>MDRRMO Data Officer / Operations Staff</div>
        </div>

        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#666' }}>Verified & Noted By:</div>
          <div style={{ marginTop: '35px', fontWeight: '800', fontSize: '14px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            MDRRMO OFFICER / MUNICIPAL DISASTER CHIEF
          </div>
          <div style={{ fontSize: '12px', color: '#444' }}>Municipality of Jamindan, Province of Capiz</div>
        </div>
      </div>

    </div>
  );
};

export default AdminAnalytics;
