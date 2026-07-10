import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Trash2, 
  Edit2, 
  X,
  PlusCircle,
  ShieldCheck,
  ShieldX
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
  const [barangay, setBarangay] = useState('');
  const [role, setRole] = useState('Resident');
  const [submitting, setSubmitting] = useState(false);

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
    setBarangay(BARANGAYS[0] || '');
    setRole('Resident');
    setShowModal(true);
  };

  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword(''); // Leave blank unless changing
    setFullName(u.full_name);
    setPhone(u.phone);
    setBarangay(u.barangay);
    setRole(u.role);
    setShowModal(true);
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
      if (password.length < 6) {
        alert('Password must be at least 6 characters long.');
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
        // Edit User
        await axios.put(`/api/users/${editingUser.id}`, {
          full_name: fullName,
          phone: phone,
          barangay: barangay,
          role: role
        });
      } else {
        // Add User via Admin endpoint (supports all roles)
        await axios.post('/api/users', {
          username,
          password: password || 'DefaultPass123!',
          full_name: fullName,
          phone,
          barangay,
          role
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
      case 'Admin': return <span className="badge badge-admin">Admin</span>;
      case 'Responder': return <span className="badge badge-responder">Responder</span>;
      case 'Resident': return <span className="badge badge-resident">Resident</span>;
      default: return <span className="badge">{r}</span>;
    }
  };

  return (
    <div className="content-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>User Management</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Manage all platform users</p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ height: '40px' }}>
          <PlusCircle size={18} />
          Add User
        </button>
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: '240px', display: 'flex', gap: '8px' }}>
            <div className="input-icon-wrapper" style={{ flex: 1 }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '36px', height: '40px' }}
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search size={16} className="input-icon-left" style={{ left: '12px' }} />
            </div>
            <button type="submit" className="btn btn-secondary" style={{ height: '40px', padding: '0 16px' }}>
              Search
            </button>
          </form>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-select"
              style={{ height: '40px', fontSize: '13px', padding: '0 12px' }}
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

        {loading ? (
          <div className="notif-empty">Fetching user accounts...</div>
        ) : users.length === 0 ? (
          <div className="notif-empty">No user accounts found.</div>
        ) : (
          <>
            <div className="table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '0' }}>Name</th>
                    <th>Email/Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right', paddingRight: '0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ opacity: u.is_active === 0 ? 0.6 : 1 }}>
                      <td style={{ paddingLeft: '0' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '14px' }}>{u.full_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '2px' }}>@{u.username}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '14px' }}>{u.phone}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.barangay}</div>
                      </td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td>
                        {u.is_active === 1 ? (
                          <span className="badge badge-resolved" style={{ fontSize: '10px', padding: '2px 8px' }}>Active</span>
                        ) : (
                          <span className="badge badge-pending" style={{ fontSize: '10px', padding: '2px 8px', backgroundColor: '#fdf2f2', color: '#c0392b' }}>Inactive</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '0' }}>
                        <div style={{ display: 'inline-flex', gap: '4px' }}>
                          <button 
                            className="notif-btn" 
                            style={{ padding: '6px', color: 'var(--text-light)' }}
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit Details & Role"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button 
                            className="notif-btn" 
                            style={{ 
                              padding: '6px', 
                              color: u.is_active === 1 ? 'var(--warning-color)' : 'var(--success-color)'
                            }}
                            onClick={() => handleToggleStatus(u)}
                            title={u.is_active === 1 ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.is_active === 1 ? <ShieldX size={16} /> : <ShieldCheck size={16} />}
                          </button>

                          <button 
                            className="notif-btn" 
                            style={{ padding: '6px', color: 'var(--danger-color)' }}
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete User"
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

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  marginTop: '24px', 
                  gap: '8px' 
                }}
              >
                <button 
                  className="btn btn-secondary"
                  style={{ height: '36px', width: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                      height: '36px', 
                      width: '36px', 
                      padding: '0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      backgroundColor: currentPage === pg ? 'var(--primary-color)' : '#ffffff',
                      color: currentPage === pg ? '#ffffff' : 'var(--text-main)'
                    }}
                    onClick={() => setCurrentPage(pg)}
                  >
                    {pg}
                  </button>
                ))}
                <button 
                  className="btn btn-secondary"
                  style={{ height: '36px', width: '36px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  disabled={currentPage === pagination.totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit/Add User Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User Details' : 'Add New User'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {!editingUser && (
                  <>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" htmlFor="m-username">Username</label>
                      <input
                        type="text"
                        id="m-username"
                        className="form-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Choose username"
                        required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" htmlFor="m-password">Password</label>
                      <input
                        type="password"
                        id="m-password"
                        className="form-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Choose password"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="m-fullname">Full Name</label>
                  <input
                    type="text"
                    id="m-fullname"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="User complete name"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="m-phone">Phone Number</label>
                  <input
                    type="text"
                    id="m-phone"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 09171234567"
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="m-barangay">Barangay</label>
                  <select
                    id="m-barangay"
                    className="form-select"
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    required
                  >
                    {BARANGAYS.map((brg) => (
                      <option key={brg} value={brg}>{brg}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="m-role">User Role</label>
                  <select
                    id="m-role"
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting} style={{ height: '36px' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '36px' }}>
                  {submitting ? 'Saving...' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
export { ROLES };
