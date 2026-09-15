import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    // Step 1: Personal Info & Account
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    barangay: '',
    date_of_birth: '',
    age: '',
    // Step 2: Medical & Emergency (Optional)
    purok_sitio: '',
    blood_type: '',
    allergies: '',
    medical_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    // Step 3: Identity Verification
    id_type: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [passwordChecklist, setPasswordChecklist] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });
  
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null); // Will hold Base64 from webcam
  const [cameraActive, setCameraActive] = useState(false);
  const webcamRef = useRef(null);
  const formRef = useRef(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;
    
    // Strict phone enforcer
    if (e.target.name === 'phone' || e.target.name === 'emergency_contact_phone') {
      value = value.replace(/[^0-9]/g, ''); // only allow numbers
      if (value.length > 11) value = value.slice(0, 11); // max 11 chars
    }

    setFormData({ ...formData, [e.target.name]: value });

    // Live password strength calculation
    if (e.target.name === 'password') {
      checkPasswordStrength(value);
    }
    
    // Auto calculate age
    if (e.target.name === 'date_of_birth') {
      if (value) {
        const today = new Date();
        const birthDate = new Date(value);
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        setFormData(prev => ({ ...prev, date_of_birth: value, age: calculatedAge }));
      } else {
        setFormData(prev => ({ ...prev, date_of_birth: value, age: '' }));
      }
    }
  };

  const checkPasswordStrength = (pass) => {
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    };
    setPasswordChecklist(checks);

    let score = Object.values(checks).filter(Boolean).length;
    
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

  const handleNext = () => {
    if (currentStep === 1) {
      // Trigger HTML5 validation to automatically highlight and scroll to missing required fields
      if (formRef.current && !formRef.current.reportValidity()) {
        return;
      }
      
      const missing = [];
      if (!formData.fullName) missing.push('Full Name');
      if (!formData.date_of_birth) missing.push('Date of Birth');
      if (!formData.phone) missing.push('Phone Number');
      if (!formData.email) missing.push('Email Address');
      if (!formData.barangay) missing.push('Barangay');
      if (!formData.username) missing.push('Username');
      if (!formData.password) missing.push('Password');
      if (!formData.confirmPassword) missing.push('Confirm Password');

      if (missing.length > 0) {
        setError(`Please fill in missing fields: ${missing.join(', ')}`);
        return;
      }
      if (passwordStrength.score < 4) {
        setError('Password must meet all security requirements.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError(t('passwordsDoNotMatch'));
        return;
      }
      if (formData.phone.length !== 11 || !formData.phone.startsWith('09')) {
        setError(t('phoneMustBe11'));
        return;
      }
      if (parseInt(formData.age) < 18) {
        setError(t('mustBe18'));
        return;
      }
      setError('');
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setError('');
      setCurrentStep(3);
    }
  };

  const handleSkip = () => {
    setFormData(prev => ({
      ...prev,
      purok_sitio: '',
      blood_type: '',
      allergies: '',
      medical_conditions: '',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    }));
    setError('');
    setCurrentStep(3);
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 3) return;

    if (!formData.id_type || !idPhoto || !selfiePhoto || !legalChecked) {
      setError('Please complete identity verification and accept the legal agreement.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(t('checkingGps'));

    const runRegistration = async (userLat, userLng) => {
      // Very basic bounding box roughly covering Panay Island / Capiz for demo purposes
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
        Object.keys(formData).forEach(key => {
          if (key !== 'confirmPassword') {
            let formKey = key;
            if (key === 'fullName') formKey = 'full_name';
            submitData.append(formKey, formData[key]);
          }
        });
        
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
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }
        
        .progress-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          position: relative;
        }
        
        .progress-bar::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 3px;
          background-color: var(--border-color);
          z-index: 1;
          transform: translateY(-50%);
        }
        
        .progress-bar-fill {
          position: absolute;
          top: 50%;
          left: 0;
          height: 3px;
          background-color: var(--primary-color);
          z-index: 2;
          transform: translateY(-50%);
          transition: width 0.3s ease;
        }
        
        .step-indicator {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: var(--card-bg);
          border: 3px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 14px;
          color: var(--text-muted);
          z-index: 3;
          transition: all 0.3s ease;
        }
        
        .step-indicator.active {
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
        
        .step-indicator.completed {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }
        
        .step-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 25px;
          gap: 15px;
        }
        
        .step-actions-right {
          display: flex;
          gap: 10px;
        }
        
        @media (max-width: 480px) {
          .step-actions {
            gap: 5px;
          }
          .step-actions-right {
            gap: 5px;
          }
          .step-actions button {
            padding: 8px 10px;
            font-size: 13px;
          }
          .step-actions svg {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>

      <div className="auth-card" style={{ maxWidth: '600px', padding: '30px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/logo.png" alt="Jamindan Seal" className="auth-logo" style={{ width: '80px', height: '80px' }} />
          <h1 className="auth-title" style={{ fontSize: '22px', margin: '10px 0 5px 0' }}>{t('residentRegistration') || 'Resident Registration'}</h1>
          <p className="auth-subtitle" style={{ margin: 0 }}>Step {currentStep} of {totalSteps}</p>
        </div>

        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
          {[1, 2, 3].map(step => (
            <div key={step} className={`step-indicator ${step < currentStep ? 'completed' : step === currentStep ? 'active' : ''}`}>
              {step < currentStep ? <CheckCircle size={16} /> : step}
            </div>
          ))}
        </div>

        {error && <div className="alert alert-danger" style={{ marginBottom: '20px' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>{success}</div>}

        <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
          
          {/* STEP 1: PERSONAL & ACCOUNT INFO */}
          {currentStep === 1 && (
            <div className="step-content">
              <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Personal Information</h3>
              
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">{t('fullNameLabel')}</label>
                <input type="text" id="fullName" name="fullName" className="form-input" value={formData.fullName} onChange={handleChange} placeholder={t('completeName')} required />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className="form-label" htmlFor="date_of_birth">Date of Birth</label>
                  <input type="date" id="date_of_birth" name="date_of_birth" className="form-input" value={formData.date_of_birth} onChange={handleChange} required />
                </div>
                <div>
                  <label className="form-label" htmlFor="age">Age</label>
                  <input type="number" id="age" name="age" className="form-input" value={formData.age} readOnly style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className="form-label" htmlFor="phone">{t('phoneNumberLabel')}</label>
                  <input type="tel" id="phone" name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="09XXXXXXXXX" required />
                </div>
                <div>
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" className="form-input" value={formData.email} onChange={handleChange} placeholder="Email" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="barangay">{t('barangayLabel')}</label>
                <select id="barangay" name="barangay" className="form-select" value={formData.barangay} onChange={handleChange} required>
                  <option value="">{t('selectBarangay')}</option>
                  {BARANGAYS.map((brg) => <option key={brg} value={brg}>{brg}</option>)}
                </select>
              </div>

              <h3 style={{ fontSize: '18px', margin: '30px 0 20px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Account Security</h3>

              <div className="form-group">
                <label className="form-label" htmlFor="username">{t('usernameLabel')}</label>
                <input type="text" id="username" name="username" className="form-input" value={formData.username} onChange={handleChange} placeholder={t('createUsername')} required />
              </div>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className="form-label" htmlFor="password">{t('passwordLabel')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} id="password" name="password" className="form-input" style={{ paddingRight: '40px' }} value={formData.password} onChange={handleChange} placeholder={t('createStrongPass')} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="form-label" htmlFor="confirmPassword">{t('confirmPassword')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" className="form-input" style={{ paddingRight: '40px' }} value={formData.confirmPassword} onChange={handleChange} placeholder={t('retypePass')} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {formData.password.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '12px', background: 'var(--bg-color)', padding: '10px', borderRadius: '6px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '5px' }}>Password must contain:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                    <div style={{ color: passwordChecklist.length ? '#27ae60' : 'var(--text-muted)' }}>
                      {passwordChecklist.length ? '✓' : '○'} At least 8 characters
                    </div>
                    <div style={{ color: passwordChecklist.upper ? '#27ae60' : 'var(--text-muted)' }}>
                      {passwordChecklist.upper ? '✓' : '○'} 1 Uppercase Letter
                    </div>
                    <div style={{ color: passwordChecklist.number ? '#27ae60' : 'var(--text-muted)' }}>
                      {passwordChecklist.number ? '✓' : '○'} 1 Number
                    </div>
                    <div style={{ color: passwordChecklist.special ? '#27ae60' : 'var(--text-muted)' }}>
                      {passwordChecklist.special ? '✓' : '○'} 1 Special Character
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '25px' }}>
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Next Step <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MEDICAL & EMERGENCY */}
          {currentStep === 2 && (
            <div className="step-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--text-main)' }}>Medical & Emergency</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Optional</span>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '20px' }}>
                This information will help first responders treat you more effectively during an emergency. You can skip this and fill it out later in your profile.
              </p>

              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className="form-label" htmlFor="purok_sitio">Purok / Sitio</label>
                  <input type="text" id="purok_sitio" name="purok_sitio" className="form-input" value={formData.purok_sitio} onChange={handleChange} placeholder="e.g. Purok 1" />
                </div>
                <div>
                  <label className="form-label" htmlFor="blood_type">Blood Type</label>
                  <select id="blood_type" name="blood_type" className="form-select" value={formData.blood_type} onChange={handleChange}>
                    <option value="">Unknown / Skip</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="allergies">Known Allergies</label>
                <input type="text" id="allergies" name="allergies" className="form-input" value={formData.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Peanuts (or leave blank)" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="medical_conditions">Medical Conditions</label>
                <input type="text" id="medical_conditions" name="medical_conditions" className="form-input" value={formData.medical_conditions} onChange={handleChange} placeholder="e.g. Asthma, Hypertension (or leave blank)" />
              </div>

              <h4 style={{ fontSize: '15px', margin: '25px 0 15px 0', color: 'var(--text-main)' }}>Emergency Contact Person</h4>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className="form-label" htmlFor="emergency_contact_name">Contact Name</label>
                  <input type="text" id="emergency_contact_name" name="emergency_contact_name" className="form-input" value={formData.emergency_contact_name} onChange={handleChange} placeholder="Full Name" />
                </div>
                <div>
                  <label className="form-label" htmlFor="emergency_contact_phone">Contact Phone</label>
                  <input type="tel" id="emergency_contact_phone" name="emergency_contact_phone" className="form-input" value={formData.emergency_contact_phone} onChange={handleChange} placeholder="09XXXXXXXXX" />
                </div>
              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={handlePrev} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <div className="step-actions-right">
                  <button type="button" className="btn" style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }} onClick={handleSkip}>
                    Skip
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: IDENTITY VERIFICATION */}
          {currentStep === 3 && (
            <div className="step-content">
              <h3 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Identity Verification</h3>
              
              <div className="form-group">
                <label className="form-label" htmlFor="id_type">{t('typeOfId')}</label>
                <select id="id_type" name="id_type" className="form-select" value={formData.id_type} onChange={handleChange} required>
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
                <label className="form-label" htmlFor="idPhoto">{t('uploadId')?.replace('{idType}', formData.id_type || 'Valid ID') || `Upload ${formData.id_type || 'Valid ID'}`}</label>
                <input type="file" id="idPhoto" name="idPhoto" className="form-input" accept="image/*" onChange={handleIdPhotoChange} required={!idPhoto} style={{ padding: '8px' }} />
                {idPhoto && (
                  <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle size={14} /> File attached: {idPhoto.name}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">{t('liveSelfieVerif')}</label>
                <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  {!selfiePhoto && !cameraActive && (
                    <button type="button" className="btn btn-secondary" onClick={() => setCameraActive(true)}>
                      {t('openCamera')}
                    </button>
                  )}

                  {cameraActive && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user" }} style={{ width: '100%', maxWidth: '300px', borderRadius: '8px', marginBottom: '10px' }} />
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
                <input type="checkbox" id="legalCheck" checked={legalChecked} onChange={(e) => setLegalChecked(e.target.checked)} style={{ marginTop: '4px', cursor: 'pointer' }} />
                <label htmlFor="legalCheck" style={{ fontSize: '12px', color: '#664d03', cursor: 'pointer', margin: 0 }}>
                  <strong>{t('legalWarningText')?.split(':')[0] || 'LEGAL WARNING'}:</strong> {t('legalWarningText')?.split(':')[1] || 'Falsifying your identity is punishable by law.'}
                </label>
              </div>

              <div className="step-actions">
                <button type="button" className="btn btn-secondary" onClick={handlePrev} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '150px', justifyContent: 'center' }}>
                  {loading ? t('submittingReg') : (
                    <>
                      <CheckCircle size={18} /> Complete Registration
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: 'var(--text-light)' }}>
          {t('alreadyRegistered')} <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'none' }}>{t('logInLink')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
export { BARANGAYS };
