import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Trash2, 
  Edit2, 
  Eye,
  EyeOff,
  X,
  PlusCircle,
  ShieldCheck,
  ShieldX,
  RotateCw,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { BARANGAYS } from './Register';

const ROLES = ['Admin', 'Responder', 'Resident'];

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit/Add Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Null means "Adding" new user
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState('');
  const [barangay, setBarangay] = useState('');
  const [role, setRole] = useState('Resident');
  const [agencyType, setAgencyType] = useState('MDRRMO'); // 'Police', 'Fire', 'Medical', 'MDRRMO'
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  
  // Image Viewer State
  const [viewImage, setViewImage] = useState(null);
  const [imageRotation, setImageRotation] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;

      const res = await axios.get('/api/users', { params });
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Error fetching users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.is_active === 1 ? 0 : 1;
    const actionText = nextStatus === 1 ? 'activate' : 'deactivate';
    
    if (user.id === currentUser.id) {
      alert('You cannot deactivate your own account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${actionText} this user's account?`)) return;

    try {
      await axios.put(`/api/users/${user.id}/status`, { is_active: nextStatus });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser.id) {
      alert('You cannot delete your own account.');
      return;
    }

    if (!window.confirm('WARNING: Deleting a user will permanently clear their record. Are you sure you want to delete this user?')) return;

    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setFullName('');
    setPhone('');
    setDateOfBirth('');
    setAge('');
    setBarangay(BARANGAYS[0] || '');
    setRole('Resident');
    setAgencyType('MDRRMO');
    setIdPhoto(null);
    setSelfiePhoto(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(''); // Leave blank unless changing
    setFullName(u.full_name);
    setPhone(u.phone);
    setDateOfBirth(u.date_of_birth ? u.date_of_birth.split('T')[0] : '');
    setAge(u.age || '');
    setBarangay(u.barangay);
    setRole(u.role);
    setAgencyType(u.agency_type || 'MDRRMO');
    setIdPhoto(null);
    setSelfiePhoto(null);
    setShowModal(true);
  };

  const openImageViewer = (url) => {
    setViewImage(url);
    setImageRotation(0);
  };

  const closeImageViewer = () => {
    setViewImage(null);
    setImageRotation(0);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !barangay || !role) return;

    // Client-side validations
    if (!editingUser) {
      if (!username || !password) {
        alert('Username and password are required.');
        return;
      }
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username.trim())) {
        alert('Username must be 3-20 characters long and contain only letters, numbers, or underscores.');
        return;
      }
      if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        alert('Password must be at least 8 characters long and contain at least one uppercase letter and one number.');
        return;
      }
    }

    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      alert('Phone number must be a valid 11-digit Philippine mobile number starting with 09 (e.g. 09171234567).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, {
          full_name: fullName,
          phone: phone,
          date_of_birth: dateOfBirth || null,
          age: age || null,
          barangay: barangay,
          role: role,
          agency_type: agencyType
        });
      } else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password || 'DefaultPass123!');
        formData.append('full_name', fullName);
        formData.append('phone', phone);
        formData.append('date_of_birth', dateOfBirth || '');
        formData.append('age', age || '');
        formData.append('barangay', barangay);
        formData.append('role', role);
        formData.append('agency_type', agencyType);
        if (idPhoto) formData.append('id_photo', idPhoto);
        if (selfiePhoto) formData.append('selfie_photo', selfiePhoto);

        await axios.post('/api/users', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'Admin': 
        return <span style={{ background: '#dbeafe', color: '#1e3a8a', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #bfdbfe' }}>Admin</span>;
      case 'Responder': 
        return <span style={{ background: '#ffedd5', color: '#9a3412', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #fed7aa' }}>Responder</span>;
      case 'Resident': 
        return <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #bbf7d0' }}>Resident</span>;
      default: 
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #e2e8f0' }}>{r}</span>;
    }
  };

  return (
    <div className="content-body" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button 
          onClick={handleOpenAddModal} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            background: 'var(--primary-color)', color: 'white', 
            padding: '10px 18px', borderRadius: '12px', 
            fontSize: '14px', fontWeight: '700', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(61,122,80,0.25)',
            transition: 'transform 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <PlusCircle size={18} /> Add New User
        </button>
      </div>

      <div style={{ 
        background: 'var(--card-bg)', 
        borderRadius: '16px', 
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)', 
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Filters Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '12px' }}>
              <div className="input-icon-wrapper" style={{ flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px', height: '44px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
                  placeholder="Search by name, username, or phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search size={18} className="input-icon-left" style={{ left: '14px', color: 'var(--text-muted)' }} />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ height: '44px', padding: '0 20px', borderRadius: '12px', fontWeight: '600' }}>
                Search
              </button>
            </form>

            <div style={{ minWidth: '160px' }}>
              <select
                className="form-select"
                style={{ height: '44px', fontSize: '14px', padding: '0 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'white' }}
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="">All Roles</option>
                {ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            Fetching accounts...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-light)', fontWeight: '600' }}>
            No user accounts found matching your criteria.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table" style={{ margin: 0 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User Details</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Info</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role / Agency</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ opacity: u.is_active === 0 ? 0.6 : 1, transition: 'background 0.2s', borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>{u.full_name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <UserIcon size={12} /> @{u.username}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>{u.phone}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{u.barangay}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                        {getRoleBadge(u.role)}
                        {u.role === 'Responder' && u.agency_type && (
                          <span style={{ fontSize: '10px', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                            {u.agency_type}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {u.is_active === 1 ? (
                        <span style={{ fontSize: '11px', padding: '4px 10px', background: '#dcfce7', color: '#166534', borderRadius: '12px', fontWeight: '700' }}>Active</span>
                      ) : (
                        <span style={{ fontSize: '11px', padding: '4px 10px', background: '#fee2e2', color: '#dc2626', borderRadius: '12px', fontWeight: '700' }}>Inactive</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        
                        <Link 
                          to={`/admin/users/${u.id}`}
                          style={{ padding: '8px', color: '#3b82f6', background: '#eff6ff', borderRadius: '8px', display: 'flex', transition: 'all 0.2s' }}
                          title="View Full Profile"
                          onMouseOver={(e) => e.currentTarget.style.background = '#dbeafe'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#eff6ff'}
                        >
                          <Eye size={16} />
                        </Link>

                        <button 
                          style={{ padding: '8px', color: '#8b5cf6', background: '#f5f3ff', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }}
                          onClick={() => handleOpenEditModal(u)}
                          title="Edit Details & Role"
                          onMouseOver={(e) => e.currentTarget.style.background = '#ede9fe'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#f5f3ff'}
                        >
                          <Edit2 size={16} />
                        </button>
                        
                        <button 
                          style={{ 
                            padding: '8px', 
                            color: u.is_active === 1 ? '#f59e0b' : '#10b981', 
                            background: u.is_active === 1 ? '#fffbeb' : '#ecfdf5',
                            borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', transition: 'all 0.2s'
                          }}
                          onClick={() => handleToggleStatus(u)}
                          title={u.is_active === 1 ? 'Deactivate Account' : 'Activate Account'}
                          onMouseOver={(e) => e.currentTarget.style.background = u.is_active === 1 ? '#fef3c7' : '#d1fae5'}
                          onMouseOut={(e) => e.currentTarget.style.background = u.is_active === 1 ? '#fffbeb' : '#ecfdf5'}
                        >
                          {u.is_active === 1 ? <ShieldX size={16} /> : <ShieldCheck size={16} />}
                        </button>

                        <button 
                          style={{ padding: '8px', color: '#ef4444', background: '#fef2f2', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }}
                          onClick={() => handleDeleteUser(u.id)}
                          title="Delete User"
                          onMouseOver={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseOut={(e) => e.currentTarget.style.background = '#fef2f2'}
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '24px', gap: '8px' }}>
          <button 
            className="btn btn-secondary"
            style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
          >
            ‹
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              className={`btn ${currentPage === pg ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                height: '40px', 
                width: '40px', 
                padding: '0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '12px',
                backgroundColor: currentPage === pg ? 'var(--primary-color)' : '#ffffff',
                color: currentPage === pg ? '#ffffff' : 'var(--text-main)',
                fontWeight: '700'
              }}
              onClick={() => setCurrentPage(pg)}
            >
              {pg}
            </button>
          ))}
          <button 
            className="btn btn-secondary"
            style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}
            disabled={currentPage === pagination.totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            ›
          </button>
        </div>
      )}

      {/* Edit/Add User Modal */}
      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.75)', 
          zIndex: 9000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(4px)',
          padding: '20px'
        }}>
          <div style={{ 
            background: 'var(--bg-color)', 
            width: '90%', 
            maxWidth: '600px', 
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                {editingUser ? 'Edit User Details' : 'Add New User'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                <X size={18} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              <form onSubmit={handleSaveSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Images Preview Section (if any) */}
                {editingUser && editingUser.role === 'Resident' && (editingUser.id_photo_path || editingUser.selfie_photo_path) && (
                  <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
                    {editingUser.id_photo_path && (
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Valid ID</p>
                        <div 
                          onClick={() => openImageViewer(editingUser.id_photo_path.startsWith('http') ? editingUser.id_photo_path : `https://jamindan.onrender.com${editingUser.id_photo_path}`)}
                          style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '2px dashed #cbd5e1', cursor: 'zoom-in' }}
                        >
                          <img src={editingUser.id_photo_path.startsWith('http') ? editingUser.id_photo_path : `https://jamindan.onrender.com${editingUser.id_photo_path}`} alt="ID Document" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                    )}
                    {editingUser.selfie_photo_path && (
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Live Selfie</p>
                        <div 
                          onClick={() => openImageViewer(editingUser.selfie_photo_path.startsWith('http') ? editingUser.selfie_photo_path : `https://jamindan.onrender.com${editingUser.selfie_photo_path}`)}
                          style={{ width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '2px dashed #cbd5e1', cursor: 'zoom-in' }}
                        >
                          <img src={editingUser.selfie_photo_path.startsWith('http') ? editingUser.selfie_photo_path : `https://jamindan.onrender.com${editingUser.selfie_photo_path}`} alt="Live Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo Upload Section for New Residents */}
                {!editingUser && role === 'Resident' && (
                  <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={16} color="var(--text-muted)" /> Identity Verification (Optional)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">ID Photo</label>
                        <input type="file" accept="image/*" className="form-input" onChange={(e) => setIdPhoto(e.target.files[0])} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Selfie Photo</label>
                        <input type="file" accept="image/*" className="form-input" onChange={(e) => setSelfiePhoto(e.target.files[0])} />
                      </div>
                    </div>
                    <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: 'var(--text-light)' }}>
                      You can upload the resident's ID and Selfie here. Since you are an Admin, this is optional and the account will be auto-verified.
                    </p>
                  </div>
                )}

                {/* Account Security Group */}
                {!editingUser && (
                  <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={16} color="var(--text-muted)" /> Account Security
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Username</label>
                        <input type="text" className="form-input" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose username" required style={{ background: '#f8fafc' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showPassword ? "text" : "password"} className="form-input" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose password" required style={{ background: '#f8fafc', paddingRight: '40px' }} />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Details Group */}
                <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={16} color="var(--text-muted)" /> Personal Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-input" value={fullName} onChange={(e) => {
                          let val = e.target.value.replace(/[^A-Za-z \-\'\.]/g, '');
                          setFullName(val);
                        }} placeholder="User complete name" required style={{ background: '#f8fafc' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Date of Birth</label>
                        <input 
                          type="date" 
                          max={new Date().toISOString().split("T")[0]}
                          className="form-input" 
                          value={dateOfBirth} 
                          onChange={(e) => {
                            setDateOfBirth(e.target.value);
                            if (e.target.value) {
                              const today = new Date();
                              const birthDate = new Date(e.target.value);
                              let calculatedAge = today.getFullYear() - birthDate.getFullYear();
                              const m = today.getMonth() - birthDate.getMonth();
                              if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                calculatedAge--;
                              }
                              setAge(calculatedAge);
                            }
                          }}
                          style={{ background: '#f8fafc', paddingLeft: '8px', paddingRight: '8px' }} 
                        />
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Phone Number</label>
                        <input type="text" className="form-input" value={phone} onChange={(e) => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length > 11) val = val.slice(0, 11);
                          setPhone(val);
                        }} placeholder="e.g. 09171234567" required style={{ background: '#f8fafc' }} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Barangay</label>
                        <select className="form-select" value={barangay} onChange={(e) => setBarangay(e.target.value)} required style={{ background: '#f8fafc' }}>
                          {BARANGAYS.map((brg) => <option key={brg} value={brg}>{brg}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">User Role</label>
                      <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} required style={{ background: '#f8fafc', fontWeight: '600' }}>
                        <option value="Resident">Resident (Standard User)</option>
                        <option value="Responder">Responder (Emergency Staff)</option>
                        <option value="Admin">Admin (Full Access)</option>
                      </select>
                    </div>

                    {role === 'Responder' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Agency / Department</label>
                        <select className="form-select" value={agencyType} onChange={(e) => setAgencyType(e.target.value)} required style={{ background: '#f8fafc' }}>
                          <option value="MDRRMO">MDRRMO / General Rescue</option>
                          <option value="Fire">BFP / Fire Department</option>
                          <option value="Medical">Medical / Ambulance</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowModal(false)} disabled={submitting} style={{ flex: 1, padding: '14px', background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: '700', color: 'var(--text-main)', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} style={{ flex: 1, padding: '14px', background: 'var(--primary-color)', border: 'none', borderRadius: '12px', fontWeight: '700', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(61,122,80,0.3)' }}>
                    {submitting ? 'Saving...' : 'Save User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Viewer Modal */}
      {viewImage && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.95)', 
          zIndex: 10000, 
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          backdropFilter: 'blur(4px)'
        }} onClick={() => setViewImage(null)}>
          
          <button style={{ 
            position: 'absolute', top: '24px', right: '24px', 
            background: 'white', border: 'none', borderRadius: '50%', 
            width: '44px', height: '44px', cursor: 'pointer', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            zIndex: 10001,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s'
          }} 
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={(e) => { e.stopPropagation(); setViewImage(null); }}>
            <X size={24} color="#0f172a" />
          </button>

          <button style={{ 
            position: 'absolute', bottom: '40px', 
            background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '30px', 
            padding: '12px 24px', cursor: 'pointer', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
            zIndex: 10001, fontWeight: '700', fontSize: '15px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s'
          }} 
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={(e) => { e.stopPropagation(); setImageRotation(prev => prev + 90); }}>
            <RotateCw size={20} />
            Rotate Image
          </button>

          <img 
            src={viewImage} 
            style={{ 
              maxWidth: '90%', 
              maxHeight: '80%', 
              objectFit: 'contain', 
              borderRadius: '8px', 
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              transform: `rotate(${imageRotation}deg)`,
              transition: 'transform 0.3s ease-in-out'
            }} 
            alt="Full screen view" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default UserManagement;
export { ROLES };
