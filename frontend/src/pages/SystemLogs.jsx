import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  History, 
  Info, 
  CheckCircle, 
  Trash2, 
  LogIn, 
  LogOut, 
  Edit, 
  ShieldAlert,
  User,
  Activity,
  Download,
  Search,
  Filter
} from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get('/api/dashboard/logs');
        setLogs(res.data);
      } catch (err) {
        console.error('Error fetching system logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filter and Search Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        log.ip?.includes(searchQuery);

      if (!matchesSearch) return false;

      if (actionFilter) {
        const lowerAction = log.action?.toLowerCase() || '';
        switch (actionFilter) {
          case 'auth': return lowerAction.includes('login') || lowerAction.includes('logout');
          case 'security': return lowerAction.includes('security') || lowerAction.includes('fail') || lowerAction.includes('deactivate');
          case 'crud': return lowerAction.includes('create') || lowerAction.includes('update') || lowerAction.includes('delete') || lowerAction.includes('edit');
          case 'approval': return lowerAction.includes('approve') || lowerAction.includes('reject') || lowerAction.includes('verify');
          default: return true;
        }
      }

      return true;
    });
  }, [logs, searchQuery, actionFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, actionFilter]);

  // CSV Export
  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      alert("No logs to export.");
      return;
    }
    
    // Create CSV Headers
    const headers = ['ID', 'Action', 'Username', 'IP Address', 'Timestamp'];
    
    // Create CSV Rows
    const csvRows = filteredLogs.map(log => {
      const escapedAction = `"${(log.action || '').replace(/"/g, '""')}"`;
      return [
        log.id, 
        escapedAction, 
        log.username, 
        log.ip, 
        new Date(log.created_at).toLocaleString()
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `System_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to determine the style and icon based on the action
  const getLogStyle = (actionText) => {
    const lowerAction = (actionText || '').toLowerCase();
    
    if (lowerAction.includes('delete') || lowerAction.includes('reject') || lowerAction.includes('remove') || lowerAction.includes('deactivate')) {
      return { color: '#dc2626', background: '#fee2e2', border: '#fecaca', icon: <Trash2 size={18} color="#dc2626" /> };
    }
    if (lowerAction.includes('approve') || lowerAction.includes('verify') || lowerAction.includes('create') || lowerAction.includes('add') || lowerAction.includes('activate')) {
      return { color: '#16a34a', background: '#dcfce7', border: '#bbf7d0', icon: <CheckCircle size={18} color="#16a34a" /> };
    }
    if (lowerAction.includes('login') || lowerAction.includes('logged in')) {
      return { color: '#2563eb', background: '#dbeafe', border: '#bfdbfe', icon: <LogIn size={18} color="#2563eb" /> };
    }
    if (lowerAction.includes('logout') || lowerAction.includes('logged out')) {
      return { color: '#475569', background: '#f1f5f9', border: '#e2e8f0', icon: <LogOut size={18} color="#475569" /> };
    }
    if (lowerAction.includes('edit') || lowerAction.includes('update')) {
      return { color: '#d97706', background: '#fef3c7', border: '#fde68a', icon: <Edit size={18} color="#d97706" /> };
    }
    if (lowerAction.includes('security') || lowerAction.includes('fail') || lowerAction.includes('error')) {
      return { color: '#e11d48', background: '#ffe4e6', border: '#fecdd3', icon: <ShieldAlert size={18} color="#e11d48" /> };
    }
    return { color: '#6366f1', background: '#e0e7ff', border: '#c7d2fe', icon: <Activity size={18} color="#6366f1" /> };
  };

  const formatTimestamp = (timestamp) => {
    const dateObj = new Date(timestamp);
    const date = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const time = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  return (
    <div className="content-body" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={26} color="var(--primary-color)" />
            System Audit Logs
          </h2>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '14px' }}>
            Track and monitor all administrative and user activity across the platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: 'var(--text-main)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="var(--primary-color)" /> {filteredLogs.length} Events Found
          </div>
          <button 
            onClick={exportToCSV}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: '#0f172a', color: 'white', 
              padding: '10px 18px', borderRadius: '12px', 
              fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            title="Download CSV report"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ 
        background: 'var(--card-bg)', 
        borderRadius: '16px', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        minHeight: '500px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Filters Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            
            {/* Search Input */}
            <div className="input-icon-wrapper" style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px', height: '44px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
                placeholder="Search by action, username, or IP address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={18} className="input-icon-left" style={{ left: '14px', color: 'var(--text-muted)' }} />
            </div>

            {/* Event Category Filter */}
            <div className="input-icon-wrapper" style={{ minWidth: '200px' }}>
              <select
                className="form-select"
                style={{ height: '44px', fontSize: '14px', paddingLeft: '40px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="">All Event Categories</option>
                <option value="auth">Authentication (Logins)</option>
                <option value="approval">Approvals & Verifications</option>
                <option value="crud">Data Changes (Add/Edit/Delete)</option>
                <option value="security">Security & Errors</option>
              </select>
              <Filter size={18} className="input-icon-left" style={{ left: '14px', color: 'var(--text-muted)' }} />
            </div>
            
          </div>
        </div>

        {/* Content Area */}
        <div style={{ padding: '32px', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              Fetching audit logs...
            </div>
          ) : paginatedLogs.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600' }}>
              {searchQuery || actionFilter ? "No logs match your filters." : "No system audit logs found."}
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '24px' }}>
              
              {/* Vertical Timeline Line */}
              <div style={{
                position: 'absolute',
                top: '16px',
                bottom: '16px',
                left: '23px',
                width: '2px',
                background: '#e2e8f0',
                zIndex: 1
              }}></div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {paginatedLogs.map((log) => {
                  const style = getLogStyle(log.action);
                  const { date, time } = formatTimestamp(log.created_at);
                  
                  return (
                    <div key={log.id} style={{ position: 'relative', display: 'flex', gap: '20px', zIndex: 2 }}>
                      
                      {/* Timeline Node */}
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: style.background, 
                        border: `2px solid ${style.border}`,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: '-20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        zIndex: 3
                      }}>
                        {style.icon}
                      </div>

                      {/* Content Card */}
                      <div style={{ 
                        flex: 1, 
                        background: '#ffffff', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: '12px', 
                        padding: '16px 20px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'default'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)';
                      }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ fontWeight: '800', color: 'var(--text-main)', fontSize: '15px' }}>
                            {log.action}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px' }}>
                              {date}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                              {time}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <User size={14} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-light)' }}>Actor:</span>
                            <span style={{ fontWeight: '700', color: 'var(--primary-color)', background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '6px' }}>
                              @{log.username}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                            <Info size={14} color="var(--text-muted)" />
                            <span style={{ color: 'var(--text-light)' }}>IP Address:</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                              {log.ip}
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ 
            padding: '20px', 
            borderTop: '1px solid var(--border-color)', 
            background: 'var(--bg-color)',
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <button 
              className="btn btn-secondary"
              style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              ‹
            </button>
            
            {/* Show only relevant page numbers to avoid overflow */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(pg => pg === 1 || pg === totalPages || Math.abs(currentPage - pg) <= 2)
              .map((pg, idx, arr) => (
                <React.Fragment key={pg}>
                  {idx > 0 && pg - arr[idx - 1] > 1 && (
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>...</span>
                  )}
                  <button
                    className={`btn ${currentPage === pg ? 'btn-primary' : 'btn-secondary'}`}
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
                      fontWeight: '700',
                      border: currentPage === pg ? 'none' : '1px solid var(--border-color)'
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
    </div>
  );
};

export default SystemLogs;
