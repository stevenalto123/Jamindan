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
import { hapticTap } from '../utils/haptics';

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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data states
  const [summary, setSummary] = useState({ total: 0, resolved: 0, active: 0, avgResponseMinutes: 0 });
  const [typeData, setTypeData] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [masterLogs, setMasterLogs] = useState([]);
  const [barangayReports, setBarangayReports] = useState([]);
  const [agencyReports, setAgencyReports] = useState([]);
  const [casualtyReport, setCasualtyReport] = useState({ summary: {}, impactList: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Map refs
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);

  // Build filter query params (with cache-busting timestamp so Refresh always fetches fresh data)
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
    params.append('_t', Date.now().toString());
    return params.toString();
  };

  const fetchAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    const qs = buildQueryParams();
    try {
      const results = await Promise.allSettled([
        axios.get(`/api/analytics/summary?${qs}`),
        axios.get(`/api/analytics/by-type?${qs}`),
        axios.get(`/api/analytics/heatmap?${qs}`),
        axios.get(`/api/analytics/reports/master-log?${qs}`),
        axios.get(`/api/analytics/reports/barangay-summary?${qs}`),
        axios.get(`/api/analytics/reports/agency-performance?${qs}`),
        axios.get(`/api/analytics/reports/casualty-damage?${qs}`)
      ]);

      const [sumRes, typeRes, heatRes, logRes, brgyRes, agencyRes, casRes] = results;

      if (sumRes.status === 'fulfilled') setSummary(sumRes.value.data);
      if (typeRes.status === 'fulfilled') setTypeData(typeRes.value.data);
      if (heatRes.status === 'fulfilled') setHeatData(heatRes.value.data);
      if (logRes.status === 'fulfilled') setMasterLogs(logRes.value.data.reports || []);
      if (brgyRes.status === 'fulfilled') setBarangayReports(brgyRes.value.data.barangays || []);
      if (agencyRes.status === 'fulfilled') setAgencyReports(agencyRes.value.data.agencyPerformance || []);
      if (casRes.status === 'fulfilled') setCasualtyReport(casRes.value.data || { summary: {}, impactList: [] });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch analytics and reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData(false);
  }, [period, startDate, endDate, selectedBarangay, selectedAgency]);

  // Initialize and update Map / Heatmap when on 'overview' tab
  useEffect(() => {
    if (activeTab !== 'overview' || !mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        heatLayerRef.current = null;
      }
      return;
    }

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([11.4287, 122.4842], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    if (heatLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (heatData.length > 0 && mapRef.current) {
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
  }, [activeTab, heatData]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        heatLayerRef.current = null;
      }
    };
  }, []);

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
    <div className="content-body" style={{ maxWidth: '1350px', margin: '0 auto', padding: isMobile ? '12px 10px 80px' : '20px' }}>
      <style>{`
        @keyframes analyticsSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Top Action Bar (Screen Only) */}
      <div className="no-print" style={{ 
        marginBottom: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px' 
      }}>
        <button 
          onClick={() => navigate('/admin')} 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px' }}
        >
          <ArrowLeft size={18} /> Back to Command Center
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
          <button 
            onClick={handleExportCSV} 
            className="btn" 
            style={{ 
              flex: isMobile ? 1 : 'none',
              backgroundColor: '#10b981', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px', 
              fontWeight: '700', 
              padding: isMobile ? '9px 12px' : '10px 18px', 
              borderRadius: '10px', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: isMobile ? '12px' : '14px',
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button 
            onClick={handlePrint} 
            className="btn btn-primary" 
            style={{ 
              flex: isMobile ? 1 : 'none',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px', 
              fontWeight: '700', 
              padding: isMobile ? '9px 12px' : '10px 18px', 
              borderRadius: '10px',
              fontSize: isMobile ? '12px' : '14px',
              whiteSpace: 'nowrap'
            }}
          >
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Official Government Header (Visible on PRINT & Screen) */}
      <div className="print-header" style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid var(--border-color)', paddingBottom: '16px' }}>
        <div style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1.2px', color: 'var(--text-muted)' }}>
          Republic of the Philippines • Province of Capiz
        </div>
        <h1 style={{ margin: '4px 0', fontSize: isMobile ? '18px' : '24px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '0.5px' }}>
          MUNICIPALITY OF JAMINDAN
        </h1>
        <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          Municipal Disaster Risk Reduction & Management Office (MDRRMO)
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '4px', lineHeight: '1.4' }}>
          Official Emergency Monitoring & Disaster Documentation Report • Generated on {lastUpdated.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Filter Toolbar (No-Print) */}
      <div className="card no-print" style={{ padding: isMobile ? '14px' : '18px', marginBottom: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: '800', color: 'var(--text-main)', fontSize: '14px' }}>
          <Filter size={16} color="var(--primary-color)" /> Filter Report Period & Scope
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Preset Buttons */}
          <div style={{ 
            display: 'flex', 
            width: '100%', 
            maxWidth: '100%', 
            overflowX: 'auto', 
            WebkitOverflowScrolling: 'touch', 
            scrollbarWidth: 'none', 
            backgroundColor: 'var(--bg-color)', 
            padding: '4px', 
            borderRadius: '10px', 
            gap: '4px', 
            boxSizing: 'border-box' 
          }}>
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
                  flex: 1,
                  minWidth: isMobile ? '55px' : '65px',
                  padding: isMobile ? '6px 6px' : '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: isMobile ? '11px' : '13px',
                  fontWeight: period === p.id ? '800' : '600',
                  backgroundColor: period === p.id ? 'var(--primary-color)' : 'transparent',
                  color: period === p.id ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  textAlign: 'center'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {period === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                style={{ flex: 1, minWidth: '120px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }} 
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                style={{ flex: 1, minWidth: '120px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }} 
              />
            </div>
          )}

          {/* Dropdowns Row & Refresh */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', alignItems: isMobile ? 'stretch' : 'center', flexWrap: 'wrap' }}>
            {/* Barangay Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: isMobile ? 'none' : '1 1 200px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: '65px' }}>Barangay:</span>
              <select 
                value={selectedBarangay} 
                onChange={e => setSelectedBarangay(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
              >
                {JAMINDAN_BARANGAYS.map(b => (
                  <option key={b} value={b}>{b === 'All' ? 'All Barangays' : `Brgy. ${b}`}</option>
                ))}
              </select>
            </div>

            {/* Agency Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: isMobile ? 'none' : '1 1 200px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap', minWidth: '65px' }}>Agency:</span>
              <select 
                value={selectedAgency} 
                onChange={e => setSelectedAgency(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
              >
                {AGENCIES.map(a => (
                  <option key={a} value={a}>{a === 'All' ? 'All Concerned Agencies' : a}</option>
                ))}
              </select>
            </div>

            <button 
              type="button"
              onClick={() => fetchAllData(true)}
              disabled={loading || refreshing}
              title="Refresh Data"
              style={{
                width: isMobile ? '100%' : 'auto',
                justifyContent: 'center',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: refreshing ? 'var(--bg-color)' : 'transparent',
                cursor: (loading || refreshing) ? 'wait' : 'pointer',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                opacity: (loading || refreshing) ? 0.75 : 1,
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: (loading || refreshing) ? 'analyticsSpin 0.8s linear infinite' : 'none'
                }}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Navigation Tabs (No-Print) */}
      <div 
        className="no-print" 
        style={{ 
          display: 'flex', 
          gap: '8px', 
          borderBottom: '2px solid var(--border-color)', 
          marginBottom: '20px', 
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: '2px' 
        }}
      >
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
              onClick={() => {
                setActiveTab(tab.id);
                hapticTap();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: isMobile ? '10px 12px' : '12px 18px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: isActive ? '800' : '600',
                fontSize: isMobile ? '13px' : '14px',
                color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
                borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
                marginBottom: '-4px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <Icon size={15} />
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', backgroundColor: isActive ? 'var(--primary-color)' : '#e2e8f0', color: isActive ? 'white' : '#475569' }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* KPI Cards (Print and Screen) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: isMobile ? '10px' : '16px', 
        marginBottom: '20px' 
      }}>
        <div className="card" style={{ padding: isMobile ? '12px 14px' : '18px', borderLeft: '4px solid #3b82f6', borderRadius: '12px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Total</span>
            <TrendingUp size={isMobile ? 16 : 22} color="#3b82f6" />
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>{summary.total}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>In selected scope</div>
        </div>

        <div className="card" style={{ padding: isMobile ? '12px 14px' : '18px', borderLeft: '4px solid #ef4444', borderRadius: '12px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Active</span>
            <AlertTriangle size={isMobile ? 16 : 22} color="#ef4444" />
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>{summary.active}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Pending / Responding</div>
        </div>

        <div className="card" style={{ padding: isMobile ? '12px 14px' : '18px', borderLeft: '4px solid #10b981', borderRadius: '12px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Resolved</span>
            <CheckCircle size={isMobile ? 16 : 22} color="#10b981" />
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: '#10b981', marginTop: '4px' }}>{summary.resolved}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Closed incidents</div>
        </div>

        <div className="card" style={{ padding: isMobile ? '12px 14px' : '18px', borderLeft: '4px solid #f59e0b', borderRadius: '12px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: isMobile ? '10px' : '12px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Avg Time</span>
            <Clock size={isMobile ? 16 : 22} color="#f59e0b" />
          </div>
          <div style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>{summary.avgResponseMinutes} min</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>To active dispatch</div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & VISUAL ANALYTICS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Chart */}
          <div className="card" style={{ padding: isMobile ? '14px' : '20px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? '14px' : '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="var(--primary-color)" /> Emergency Incidents by Category
            </h3>
            <div style={{ width: '100%', height: isMobile ? '250px' : '280px' }}>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={typeData} margin={{ top: 15, right: 10, left: isMobile ? -25 : 0, bottom: isMobile ? 30 : 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'var(--text-muted)', fontSize: isMobile ? 10 : 12 }}
                      interval={0}
                      angle={isMobile ? -25 : 0}
                      textAnchor={isMobile ? 'end' : 'middle'}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
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
            <div style={{ padding: isMobile ? '12px 14px' : '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '14px' : '16px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapIcon size={18} color="#ef4444" /> Disaster Hotspot Density Heatmap
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                Geospatial concentration of emergency reports in the Municipality of Jamindan to guide resource prepositioning.
              </p>
            </div>
            <div style={{ width: '100%', height: isMobile ? '280px' : '380px', position: 'relative' }}>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INCIDENT MASTER LOG */}
      {activeTab === 'master-log' && (
        <div className="card" style={{ padding: isMobile ? '14px' : '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: '16px', flexDirection: isMobile ? 'column' : 'row', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: 'var(--text-main)' }}>Official Incident Master Log</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Complete chronological registry of all reported incidents and response timelines.</p>
            </div>
            <div className="no-print" style={{ width: isMobile ? '100%' : 'auto' }}>
              <input 
                type="text" 
                placeholder="Search log records..." 
                value={searchLog} 
                onChange={e => setSearchLog(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', width: isMobile ? '100%' : '220px', backgroundColor: 'var(--card-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredLogs.length > 0 ? filteredLogs.map((log, idx) => {
                const isResolved = log.status === 'Resolved';
                const isPending = log.status === 'Pending';
                return (
                  <div
                    key={log.id || idx}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--card-alt)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary-color)' }}>
                        {log.code}
                      </span>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '800',
                        backgroundColor: isResolved ? '#dcfce7' : isPending ? '#fee2e2' : '#fef3c7',
                        color: isResolved ? '#15803d' : isPending ? '#b91c1c' : '#b45309'
                      }}>
                        {log.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                        {log.type}
                      </span>
                      <span style={{
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '800',
                        backgroundColor: log.lead_agency === 'BFP' ? '#fee2e2' : log.lead_agency === 'RHU' ? '#ecfdf5' : '#eff6ff',
                        color: log.lead_agency === 'BFP' ? '#dc2626' : log.lead_agency === 'RHU' ? '#059669' : '#2563eb'
                      }}>
                        {log.lead_agency || 'MDRRMO'}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-light)', borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>📍 Brgy. {log.reporter_barangay || 'Poblacion'}</span>
                      <span>👤 {log.reporter_name}</span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Unit: <strong style={{ color: 'var(--text-main)' }}>{log.responder_name || 'Unassigned'}</strong></span>
                      <span>Resp: <strong style={{ color: 'var(--text-main)' }}>{log.response_time_minutes !== null ? `${log.response_time_minutes} min` : '—'}</strong></span>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px' }}>
                  No incident master logs match the active filter criteria.
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Code</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Date & Time</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Type</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Lead Agency</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Barangay</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Reporter</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Assigned Unit</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Response Time</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Status</th>
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
                          backgroundColor: log.status === 'Resolved' ? '#dcfce7' : ['In Progress', 'Acknowledged', 'Responding', 'On Scene'].includes(log.status) ? '#fef3c7' : '#fee2e2',
                          color: log.status === 'Resolved' ? '#15803d' : ['In Progress', 'Acknowledged', 'Responding', 'On Scene'].includes(log.status) ? '#b45309' : '#b91c1c'
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
          )}
        </div>
      )}

      {/* TAB 3: BARANGAY RISK SUMMARY */}
      {activeTab === 'barangay' && (
        <div className="card" style={{ padding: isMobile ? '14px' : '20px', borderRadius: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: 'var(--text-main)' }}>Barangay Disaster Risk & Incidence Summary</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Aggregated breakdown of incidents across all 30+ Jamindan barangays for hazard assessment.</p>
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {barangayReports.length > 0 ? barangayReports.map((b, idx) => (
                <div
                  key={b.barangay || idx}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--card-alt)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>
                      📍 Brgy. {b.barangay}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary-color)', backgroundColor: 'var(--card-bg)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      {b.total_incidents} Total
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
                    <span style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      {b.active_count} Active
                    </span>
                    <span style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      {b.resolved_count} Resolved
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', borderTop: '1px solid var(--border-color)', paddingTop: '8px', color: 'var(--text-light)' }}>
                    {b.fire_count > 0 && <span>🔥 {b.fire_count}</span>}
                    {b.medical_count > 0 && <span>🚑 {b.medical_count}</span>}
                    {b.flood_count > 0 && <span>🌊 {b.flood_count}</span>}
                    {b.accident_count > 0 && <span>🚗 {b.accident_count}</span>}
                    {b.crime_count > 0 && <span>🛡️ {b.crime_count}</span>}
                    {b.total_incidents === 0 && <span style={{ color: 'var(--text-muted)' }}>No recorded incidents</span>}
                  </div>
                </div>
              )) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                  No barangay summary records available for this period.
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Barangay</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Total Reported</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Active</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Resolved</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>🔥 Fire</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>🚑 Medical</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>🌊 Flood</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>🚗 Accident</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>🛡️ Crime</th>
                  </tr>
                </thead>
                <tbody>
                  {barangayReports.length > 0 ? barangayReports.map((b, idx) => (
                    <tr key={b.barangay || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Brgy. {b.barangay}</td>
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
          )}
        </div>
      )}

      {/* TAB 4: CONCERNED AGENCY PERFORMANCE */}
      {activeTab === 'agency' && (
        <div className="card" style={{ padding: isMobile ? '14px' : '20px', borderRadius: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: 'var(--text-main)' }}>Concerned Entity & Agency Dispatch Report</h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-light)' }}>Inter-agency monitoring for MDRRMO, BFP, and RHU response performance.</p>
          </div>

          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {agencyReports.length > 0 ? agencyReports.map((a, idx) => (
                <div
                  key={a.agency || idx}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--card-alt)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={16} color="var(--primary-color)" />
                      {a.agency === 'BFP' ? 'BFP Fire Protection' : 
                       a.agency === 'RHU' ? 'RHU / Paramedics' : 
                       'Jamindan Response (MDRRMO)'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '900', color: 'var(--primary-color)' }}>
                      {a.total_incidents}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: '700' }}>
                    <span style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      {a.resolved_count} Resolved
                    </span>
                    <span style={{ color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      {a.dispatched_count} Active
                    </span>
                    <span style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                      {a.pending_count} Pending
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                    Avg Response Time: <strong style={{ color: 'var(--text-main)' }}>{a.avg_response_mins ? `${a.avg_response_mins} mins` : '—'}</strong>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                  No agency dispatch data recorded for this period.
                </div>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Concerned Entity / Agency</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Dispatched Incidents</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Resolved</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Active Response</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Pending</th>
                    <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Avg Response Time</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyReports.length > 0 ? agencyReports.map((a, idx) => (
                    <tr key={a.agency || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
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
          )}
        </div>
      )}

      {/* TAB 5: CASUALTY & DAMAGE ASSESSMENT */}
      {activeTab === 'casualty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? '10px' : '16px' }}>
            <div className="card" style={{ padding: isMobile ? '12px 14px' : '16px', borderLeft: '4px solid #ef4444', borderRadius: '12px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Reported Victims / Injured</div>
              <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: '900', color: '#ef4444', marginTop: '4px' }}>{casualtyReport.summary?.totalVictims || 0}</div>
            </div>
            <div className="card" style={{ padding: isMobile ? '12px 14px' : '16px', borderLeft: '4px solid #3b82f6', borderRadius: '12px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Affected Households</div>
              <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: '900', color: '#3b82f6', marginTop: '4px' }}>{casualtyReport.summary?.totalHouseholds || 0}</div>
            </div>
            <div className="card" style={{ padding: isMobile ? '12px 14px' : '16px', borderLeft: '4px solid #f59e0b', borderRadius: '12px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Rescues Required</div>
              <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: '900', color: '#f59e0b', marginTop: '4px' }}>{casualtyReport.summary?.totalRescuesNeeded || 0}</div>
            </div>
            <div className="card" style={{ padding: isMobile ? '12px 14px' : '16px', borderLeft: '4px solid #8b5cf6', borderRadius: '12px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase' }}>Vehicles Involved</div>
              <div style={{ fontSize: isMobile ? '20px' : '26px', fontWeight: '900', color: '#8b5cf6', marginTop: '4px' }}>{casualtyReport.summary?.totalVehiclesInvolved || 0}</div>
            </div>
          </div>

          {/* Detailed table */}
          <div className="card" style={{ padding: isMobile ? '14px' : '20px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? '16px' : '18px', fontWeight: '800', color: 'var(--text-main)' }}>Casualty & Property Damage Incident Registry</h3>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {casualtyReport.impactList && casualtyReport.impactList.length > 0 ? casualtyReport.impactList.map((c, idx) => (
                  <div
                    key={c.code || idx}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--card-alt)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary-color)' }}>{c.code}</span>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)' }}>{c.type}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                      📍 Brgy. {c.barangay}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', fontWeight: '700' }}>
                      {c.victims > 0 && <span style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{c.victims} Injured</span>}
                      {c.households > 0 && <span style={{ color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{c.households} Households</span>}
                      {c.water_level && <span style={{ color: '#0284c7', backgroundColor: 'rgba(2,132,199,0.1)', padding: '2px 8px', borderRadius: '6px' }}>🌊 {c.water_level}</span>}
                    </div>
                    {c.injuries && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                        Notes: {c.injuries}
                      </div>
                    )}
                  </div>
                )) : (
                  <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                    No specific casualty or severe damage records filed in this period.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Code</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Type</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Barangay</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Victims/Injured</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', textAlign: 'center', whiteSpace: 'nowrap' }}>Affected Households</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Injury / Condition Notes</th>
                      <th style={{ padding: '10px 12px', fontWeight: '800', whiteSpace: 'nowrap' }}>Flood Depth</th>
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
            )}
          </div>
        </div>
      )}

      {/* Official Signatory Certification Block (Visible on PRINT) */}
      <div className="print-only" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #ccc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
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

    </div>
  );
};

export default AdminAnalytics;
