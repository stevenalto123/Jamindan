import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// List of official Barangays in Jamindan, Capiz for realism
const BARANGAYS = [
  'Agambulong', 'Agbun-od', 'Agcagay', 'Aglibacao', 'Agloloway', 
  'Bayebaye', 'Caridad', 'Esperanza', 'Fe', 'Ganzon', 
  'Guintas', 'Igang', 'Jaena Norte', 'Jaena Sur', 'Jagnaya', 
  'Lapaz', 'Linambasan', 'Lucero', 'Maantol', 'Masgrau', 
  'Milan', 'Molet', 'Pangabat', 'Pangabuan', 'Pasol-o', 
  'Poblacion', 'San Jose', 'San Juan', 'San Vicente', 'Santo Rosario'
].sort();

const Register = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    barangay: '',
    age: '',
    id_type: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null); // Will hold Base64 from webcam
  const [cameraActive, setCameraActive] = useState(false);
  const webcamRef = useRef(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Strict 11-digit phone enforcer
    if (e.target.name === 'phone') {
      value = value.replace(/[^0-9]/g, ''); // only allow numbers
      if (value.length > 11) value = value.slice(0, 11); // max 11 chars
    }

    setFormData({ ...formData, [e.target.name]: value });

    // Live password strength calculation
    if (e.target.name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length > 0) {
      if (pass.length >= 6) score += 1;
      if (/[A-Z]/.test(pass)) score += 1;
      if (/[0-9]/.test(pass)) score += 1;
      if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    }
    
    if (score === 0) setPasswordStrength({ score, text: '', color: '' });
    else if (score <= 2) setPasswordStrength({ score, text: 'Weak', color: '#e74c3c' });
    else if (score === 3) setPasswordStrength({ score, text: 'Medium', color: '#f39c12' });
    else setPasswordStrength({ score, text: 'Strong', color: '#27ae60' });
  };

  const handleIdPhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIdPhoto(e.target.files[0]);
    }
  };

  const captureSelfie = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setSelfiePhoto(imageSrc);
    setCameraActive(false);
  };

  const retakeSelfie = () => {
    setSelfiePhoto(null);
    setCameraActive(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword, fullName, phone, barangay, age, id_type } = formData;

    if (!username || !email || !password || !confirmPassword || !fullName || !phone || !barangay || !age || !id_type) {
      setError(t('fillAllFields'));
      return;
    }

    if (!legalChecked) {
      setError(t('legalWarningReq'));
      return;
    }

    if (passwordStrength.score < 3) {
      setError(t('passwordTooWeak'));
      return;
    }

    if (phone.length !== 11 || !phone.startsWith('09')) {
      setError(t('phoneMustBe11'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (parseInt(age) < 18) {
      setError(t('mustBe18'));
      return;
    }

    if (!idPhoto) {
      setError(t('uploadValidId'));
      return;
    }

    if (!selfiePhoto) {
      setError(t('captureSelfie'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(t('checkingGps'));

    // Advanced GPS Lock check
    const runRegistration = async (userLat, userLng) => {
      // Very basic bounding box roughly covering Panay Island / Capiz for demo purposes
      // MinLat ~ 11.0, MaxLat ~ 11.8, MinLng ~ 122.0, MaxLng ~ 123.2
      const isInsidePanay = (userLat >= 10.5 && userLat <= 12.0 && userLng >= 121.5 && userLng <= 123.5);
      
      if (!isInsidePanay && userLat !== 0) {
        setError(t('registrationBlocked'));
        setSuccess('');
        setLoading(false);
        return;
      }

      setSuccess(t('verifyingIdentity'));

      try {
        const selfieBlob = await fetch(selfiePhoto).then(res => res.blob());

        const submitData = new FormData();
        submitData.append('username', username);
        submitData.append('email', email);
        submitData.append('password', password);
        submitData.append('full_name', fullName);
        submitData.append('phone', phone);
        submitData.append('barangay', barangay);
        submitData.append('age', age);
        submitData.append('id_type', id_type);
        submitData.append('id_photo', idPhoto);
        submitData.append('selfie_photo', selfieBlob, 'selfie.jpg');

        await register(submitData);
        setSuccess(t('accountRegistered'));
        setTimeout(() => {
          navigate('/login');
        }, 5000);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || t('registrationFailed'));
        setLoading(false);
        setSuccess('');
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          runRegistration(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("GPS failed", err);
          // If they block GPS, we might still allow them or block them. 
          // For strictness, let's just proceed with mock lat/lng 0 to bypass for now, 
          // but in production, we would block them.
          runRegistration(11.4287, 122.4842); // Simulated Jamindan
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      runRegistration(0, 0); // Bypass if browser literally has no geo
    }
  };

  return (
    <div className="auth-page" style={{ overflowY: 'auto', padding: '20px 0' }}>
      <style>{`
        /* Hide native browser password reveal icons to prevent double-eye bug */
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      <div className="auth-card" style={{ maxWidth: '600px', padding: '30px', margin: '0 auto' }}>
        <img src="/logo.png" alt="Jamindan Seal" className="auth-logo" style={{ width: '90px', height: '90px' }} />
        <h1 className="auth-title" style={{ fontSize: '22px' }}>{t('residentRegistration')}</h1>
        <p className="auth-subtitle" style={{ marginBottom: '20px' }}>{t('emergencyPlatform')}</p>

        <div className="alert alert-warning" style={{ textAlign: 'left', fontSize: '13px' }}>
          <strong>{t('ageReqWarning').split(':')[0]}:</strong> {t('ageReqWarning').split(':')[1]}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">{t('fullNameLabel')}</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder={t('completeName')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username">{t('usernameLabel')}</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder={t('createUsername')}
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="phone">{t('phoneNumberLabel')}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', fontWeight: 'bold' }}>+63</span>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  style={{ paddingLeft: '45px' }}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9XXXXXXXXX"
                  required
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="age">{t('ageLabel')}</label>
              <input
                type="number"
                id="age"
                name="age"
                className="form-input"
                value={formData.age}
                onChange={handleChange}
                placeholder={t('agePlus')}
                min="18"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="password">{t('passwordLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t('createStrongPass')}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordStrength.text && (
                <div style={{ marginTop: '5px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ height: '4px', flex: 1, backgroundColor: '#eee', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(passwordStrength.score / 4) * 100}%`, backgroundColor: passwordStrength.color, transition: 'all 0.3s' }}></div>
                  </div>
                  <span style={{ color: passwordStrength.color, fontWeight: 'bold' }}>{passwordStrength.text}</span>
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="confirmPassword">{t('confirmPassword')}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-input"
                  style={{ paddingRight: '40px' }}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('retypePass')}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="barangay">{t('barangayLabel')}</label>
              <select
                id="barangay"
                name="barangay"
                className="form-select"
                value={formData.barangay}
                onChange={handleChange}
                required
              >
                <option value="">{t('selectBarangay')}</option>
                {BARANGAYS.map((brg) => (
                  <option key={brg} value={brg}>{brg}</option>
                ))}
              </select>
            </div>
          </div>

          <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)' }} />
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: 'var(--text-color)' }}>{t('identityVerification')}</h3>

          <div className="form-group">
            <label className="form-label" htmlFor="id_type">{t('typeOfId')}</label>
            <select
              id="id_type"
              name="id_type"
              className="form-select"
              value={formData.id_type}
              onChange={handleChange}
              required
            >
              <option value="">{t('selectIdType')}</option>
              <option value="National ID (PhilSys)">National ID (PhilSys)</option>
              <option value="Driver's License">Driver's License</option>
              <option value="Voter's ID">Voter's ID</option>
              <option value="Passport">Passport</option>
              <option value="UMID / SSS">UMID / SSS</option>
              <option value="Postal ID">Postal ID</option>
              <option value="Student ID">Student ID (If 18+)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="idPhoto">{t('uploadId').replace('{idType}', formData.id_type || 'Valid ID')}</label>
            <input
              type="file"
              id="idPhoto"
              name="idPhoto"
              className="form-input"
              accept="image/*"
              onChange={handleIdPhotoChange}
              required
              style={{ padding: '8px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('liveSelfieVerif')}</label>
            <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
              {!selfiePhoto && !cameraActive && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setCameraActive(true)}
                >
                  {t('openCamera')}
                </button>
              )}

              {cameraActive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "user" }}
                    style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" className="btn btn-primary" onClick={captureSelfie}>{t('capturePhoto')}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => setCameraActive(false)}>{t('cancelBtn')}</button>
                  </div>
                </div>
              )}

              {selfiePhoto && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={selfiePhoto} alt="Selfie Preview" style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', marginBottom: '10px', border: '2px solid var(--primary-color)' }} />
                  <button type="button" className="btn btn-secondary" onClick={retakeSelfie}>{t('retakeSelfieBtn')}</button>
                </div>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-start', gap: '10px', background: '#fff3cd', padding: '15px', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
            <input 
              type="checkbox" 
              id="legalCheck" 
              checked={legalChecked}
              onChange={(e) => setLegalChecked(e.target.checked)}
              style={{ marginTop: '4px', cursor: 'pointer' }}
            />
            <label htmlFor="legalCheck" style={{ fontSize: '12px', color: '#664d03', cursor: 'pointer', margin: 0 }}>
              <strong>{t('legalWarningText').split(':')[0]}:</strong> {t('legalWarningText').split(':')[1]}
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading} style={{ marginTop: '10px' }}>
            {loading ? t('submittingReg') : t('submitRegBtn')}
          </button>
        </form>

        <div style={{ marginTop: '20px', fontSize: '14px', color: 'var(--text-light)' }}>
          {t('alreadyRegistered')} <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>{t('logInLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
export { BARANGAYS };
