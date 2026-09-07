import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Plus, CheckCircle, Clock, AlertTriangle, Shield, Trash2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const AdminVehicles = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ name: '', type: 'Ambulance', agency: 'Medical' });
  const [adding, setAdding] = useState(false);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('/api/vehicles');
      setVehicles(res.data.vehicles || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newVehicle.name || !newVehicle.type || !newVehicle.agency) return;
    
    setAdding(true);
    try {
      await axios.post('/api/vehicles', newVehicle);
      alert('Vehicle added successfully');
      setShowAddModal(false);
      setNewVehicle({ name: '', type: 'Ambulance', agency: 'Medical' });
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert('Failed to add vehicle');
    } finally {
      setAdding(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const statuses = ['Available', 'Dispatched', 'Maintenance'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    // Optimistic UI update
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: nextStatus } : v));

    try {
      await axios.put(`/api/vehicles/${id}/status`, { status: nextStatus });
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
      fetchVehicles(); // Revert on failure
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await axios.delete(`/api/vehicles/${id}`);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete vehicle');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'var(--success-color)'; // Green
      case 'Dispatched': return 'var(--danger-color)'; // Red
      case 'Maintenance': return 'var(--warning-color)'; // Orange
      default: return 'var(--text-light)';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Available': return <CheckCircle size={16} />;
      case 'Dispatched': return <Clock size={16} />;
      case 'Maintenance': return <AlertTriangle size={16} />;
      default: return null;
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-main)' }}>
          <Truck size={28} color="var(--primary-color)" />
          FLEET MANAGEMENT
        </h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <p style={{ color: 'var(--text-light)', margin: 0 }}>Manage and track all emergency response vehicles.</p>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} /> Add Vehicle
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>Loading fleet data...</div>
      ) : vehicles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <Truck size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: 0, color: 'var(--text-main)' }}>No Vehicles Found</h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '20px' }}>Add your first ambulance, firetruck, or patrol car to get started.</p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary">Add Vehicle</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {vehicles.map(vehicle => (
            <div key={vehicle.id} style={{ 
              backgroundColor: 'var(--card-bg)', 
              borderRadius: '16px', 
              padding: '20px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              position: 'relative'
            }}>
              
              <button 
                onClick={() => handleDelete(vehicle.id)}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Delete Vehicle"
              >
                <Trash2 size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '48px', height: '48px', borderRadius: '12px', 
                  backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Truck size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: 'var(--text-main)' }}>{vehicle.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} /> {vehicle.agency} • {vehicle.type}
                  </span>
                </div>
              </div>

              {/* Status Toggle Button */}
              <button
                onClick={() => handleStatusChange(vehicle.id, vehicle.status)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: `${getStatusColor(vehicle.status)}20`, // 20% opacity background
                  color: getStatusColor(vehicle.status),
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                {getStatusIcon(vehicle.status)}
                {vehicle.status.toUpperCase()}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'var(--card-bg)', width: '90%', maxWidth: '400px', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, color: 'var(--text-main)', fontSize: '20px' }}>Add New Vehicle</h2>
            
            <form onSubmit={handleAddSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Vehicle Name / Callsign</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newVehicle.name}
                  onChange={e => setNewVehicle({...newVehicle, name: e.target.value})}
                  placeholder="e.g. Ambulance 1, Rescue 05"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Vehicle Type</label>
                <select 
                  className="form-select"
                  value={newVehicle.type}
                  onChange={e => setNewVehicle({...newVehicle, type: e.target.value})}
                >
                  <option value="Ambulance">Ambulance</option>
                  <option value="Firetruck">Firetruck</option>
                  <option value="Police Cruiser">Police Cruiser</option>
                  <option value="Rescue Boat">Rescue Boat</option>
                  <option value="Service Vehicle">Service Vehicle</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Assigned Agency</label>
                <select 
                  className="form-select"
                  value={newVehicle.agency}
                  onChange={e => setNewVehicle({...newVehicle, agency: e.target.value})}
                >
                  <option value="Medical">Medical / Health Center</option>
                  <option value="Fire">BFP (Fire)</option>
                  <option value="Police">PNP (Police)</option>
                  <option value="MDRRMO">MDRRMO</option>
                  <option value="General">General / Municipal</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" disabled={adding} className="btn-primary" style={{ flex: 1 }}>
                  {adding ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVehicles;
