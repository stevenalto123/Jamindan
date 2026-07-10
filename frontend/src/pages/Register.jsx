import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// List of official Barangays in Jamindan, Capiz for realism
const BARANGAYS = [
  'Agbun-od', 'Agcagay', 'Aglibacao', 'Agloloway', 'Agtaban', 'Agtambi', 'Agtupit', 
  'Bagong Barrio', 'Baye', 'Caridad', 'Esperanza', 'Fe', 'Ganzon', 'Jagnaya', 
  'Jaena Norte', 'Jaena Sur', 'Lucero', 'Magsaysay', 'Masical', 'Millan', 
  'Pangabuan', 'Pasol-o', 'Poblacion', 'San Jose', 'San Juan', 'San Roque', 
  'San Vicente', 'Santo Tomas'
].sort();

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    phone: '',
    barangay: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, fullName, phone, barangay } = formData;

    if (!username || !password || !fullName || !phone || !barangay) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(username, password, fullName, phone, barangay);
      setSuccess('Account registered successfully! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Username may be taken.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '520px', padding: '30px' }}>
        <img src="/logo.png" alt="Jamindan Seal" className="auth-logo" style={{ width: '90px', height: '90px' }} />
        <h1 className="auth-title" style={{ fontSize: '22px' }}>Resident Registration</h1>
        <p className="auth-subtitle" style={{ marginBottom: '20px' }}>Emergency Response Platform</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="Create a username"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your complete name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 09171234567"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="barangay">Barangay</label>
            <select
              id="barangay"
              name="barangay"
              className="form-select"
              value={formData.barangay}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Barangay --</option>
              {BARANGAYS.map((brg) => (
                <option key={brg} value={brg}>{brg}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-light)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
export { BARANGAYS };
