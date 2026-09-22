import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, TrendingUp, CheckCircle, Clock, Map as MapIcon, BarChart3, AlertTriangle, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const AdminAnalytics = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ total: 0, resolved: 0, active: 0, avgResponseMinutes: 0 });
  const [typeData, setTypeData] = useState([]);
  const [heatData, setHeatData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [sumRes, typeRes, heatRes] = await Promise.all([
          axios.get('/api/analytics/summary'),
          axios.get('/api/analytics/by-type'),
          axios.get('/api/analytics/heatmap')
        ]);
        
        setSummary(sumRes.data);
        setTypeData(typeRes.data);
        setHeatData(heatRes.data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  // Initialize Map and Heatmap
  useEffect(() => {
    if (loading || !mapContainerRef.current) return;

    if (!mapRef.current) {
      // Initialize map (Default to Jamindan)
      mapRef.current = L.map(mapContainerRef.current).setView([11.3969, 122.3995], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);
    }

    // Add Heatmap Layer
    if (heatData.length > 0) {
      if (heatLayerRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
      }
      
      // Fix leaflet.heat window scope in Vite
      window.L = L;
        import('leaflet.heat').then(() => {
          if (L.heatLayer) {
            heatLayerRef.current = L.heatLayer(heatData, {
              radius: 35,
              blur: 20,
              maxZoom: 17,
              gradient: { 0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red' }
            }).addTo(mapRef.current);
          }
        }).catch(err => console.error("Failed to load leaflet.heat", err));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, heatData]);

  const COLORS = ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#34495e'];

  const printRef = useRef();
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)' }}>Loading analytics...</div>;
  }

  return (
    <div className="content-body" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      <div className="no-print" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <ArrowLeft size={20} /> Back to Dashboard
        </button>
        <button onClick={handlePrint} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} /> Download PDF Report
        </button>
      </div>

      <div ref={printRef} style={{ padding: '10px' }}>
        <div className="print-only" style={{ display: 'none', marginBottom: '30px', textAlign: 'center' }}>
          <h2>Jamindan MDRRMO - Official Analytics Report</h2>
          <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          <hr />
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', borderTop: '4px solid #3498db' }}>
          <TrendingUp size={32} color="#3498db" style={{ marginBottom: '10px' }} />
          <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-main)' }}>{summary.total}</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>Total Incidents (All Time)</span>
        </div>
        
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', borderTop: '4px solid #e74c3c' }}>
          <AlertTriangle size={32} color="#e74c3c" style={{ marginBottom: '10px' }} />
          <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-main)' }}>{summary.active}</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>Active Emergencies</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', borderTop: '4px solid #2ecc71' }}>
          <CheckCircle size={32} color="#2ecc71" style={{ marginBottom: '10px' }} />
          <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-main)' }}>{summary.resolved}</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>Resolved Incidents</span>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', borderTop: '4px solid #f1c40f' }}>
          <Clock size={32} color="#f1c40f" style={{ marginBottom: '10px' }} />
          <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text-main)' }}>{summary.avgResponseMinutes} min</h2>
          <span style={{ color: 'var(--text-light)', fontSize: '14px' }}>Avg Response Time</span>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Charts Row */}
        <div className="card" style={{ marginBottom: '30px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <BarChart3 size={20} color="var(--primary-color)" />
            Incidents by Category
          </h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={typeData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap Row */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <MapIcon size={20} color="#e74c3c" />
              Incident Heatmap (Hotspots)
            </h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: 'var(--text-light)' }}>
              Visualizing high-density areas for emergencies to aid in resource allocation.
            </p>
          </div>
          <div style={{ width: '100%', height: '400px', position: 'relative' }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
        </div>

      </div>

      </div>
    </div>
  );
};

export default AdminAnalytics;
