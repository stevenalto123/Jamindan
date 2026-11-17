import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Geolocation } from '@capacitor/geolocation';
import { useAuth } from '../context/AuthContext';
import Webcam from 'react-webcam';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Camera,
  Upload,
  ShieldCheck,
  HeartPulse,
  User,
  Lock,
  RefreshCw,
  Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// List of official Barangays in Jamindan, Capiz
const BARANGAYS = [
  'Agambulong', 'Agbun-od', 'Agcagay', 'Aglibacao', 'Agloloway',
  'Bayebaye', 'Caridad', 'Esperanza', 'Fe', 'Ganzon',
  'Guintas', 'Igang', 'Jaena Norte', 'Jaena Sur', 'Jagnaya',
  'Lapaz', 'Linambasan', 'Lucero', 'Maantol', 'Masgrau',
  'Milan', 'Molet', 'Pangabat', 'Pangabuan', 'Pasol-o',
  'Poblacion', 'San Jose', 'San Juan', 'San Vicente', 'Santo Rosario'
].sort();

const STEPS = [
  { id: 1, label: 'Account' },
  { id: 2, label: 'Medical' },
  { id: 3, label: 'Verify ID' }
];

// Normalize Philippine mobile numbers (supports pasted +639 / 639 -> 09)
const normalizePhoneNumber = (rawValue) => {
  let digits = String(rawValue || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('639')) {
    digits = '09' + digits.slice(3);
  } else if (digits.startsWith('63') && digits.length > 10) {
    digits = '0' + digits.slice(2);
  }
  return digits.slice(0, 11);
};

// Parse YYYY-MM-DD in local time so UTC offsets never shift birthday calculations
const calculateAgeFromDob = (dobValue) => {
  if (!dobValue) return '';
  const birthDate = new Date(`${dobValue}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return '';

  const today = new Date();
  if (birthDate > today) return '';

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 && age <= 120 ? age : '';
};

// Compress camera/gallery images on-device for fast mobile uploads; callers fall back to raw file on error
const compressImageToBlob = (fileOrDataUrl, maxWidth = 1280, quality = 0.84) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Image compression produced empty blob'));
          },
          'image/jpeg',
          quality
        );
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Unable to decode image for compression'));

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        img.src = ev.target.result;
      };
      reader.onerror = () => reject(new Error('Unable to read image file'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
};

// Retrieve GPS coordinates across Capacitor native (iOS/Android) and Mobile Web, with demo fallback
const getRegistrationCoordinates = async () => {
  if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
    try {
      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') {
          return { lat: 11.4287, lng: 122.4842 };
        }
      }
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 6000 });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (err) {
      console.warn('Capacitor GPS unavailable, using simulated Jamindan coordinates:', err);
      return { lat: 11.4287, lng: 122.4842 };
    }
  }

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.warn('Web GPS unavailable, using simulated Jamindan coordinates:', err);
          resolve({ lat: 11.4287, lng: 122.4842 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }

  return { lat: 0, lng: 0 };
};

const Register = () => {
  const { t, lang, toggleLanguage } = useLanguage();
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [legalChecked, setLegalChecked] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', color: '' });
  const [passwordChecklist, setPasswordChecklist] = useState({
    length: false,
    upper: false,
    number: false,
    special: false
  });

  const [idPhoto, setIdPhoto] = useState(null);
  const [idPreviewUrl, setIdPreviewUrl] = useState('');
  const [selfiePhoto, setSelfiePhoto] = useState(null); // Base64/DataURL from webcam or native camera fallback
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const webcamRef = useRef(null);
  const formRef = useRef(null);

  const [error, setError] = useState('');
  const [errorStepTarget, setErrorStepTarget] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const todayISO = new Date().toISOString().split('T')[0];

  // Manage object URL lifecycle for ID preview thumbnail
  useEffect(() => {
    if (!idPhoto) {
      setIdPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(idPhoto);
    setIdPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [idPhoto]);

  // Countdown redirect after successful registration
  useEffect(() => {
    if (!registrationComplete) return;
    if (redirectCountdown <= 0) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => setRedirectCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [registrationComplete, redirectCountdown, navigate]);

  const scrollToAlert = () => {
    setTimeout(() => {
      const alertEl = document.getElementById('auth-message-alert');
      if (alertEl) {
        alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        document.querySelector('.auth-page')?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  };

  useEffect(() => {
    if (error || statusMessage) {
      scrollToAlert();
    }
  }, [error, statusMessage]);

  const checkPasswordStrength = (pass) => {
    const checks = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[^A-Za-z0-9]/.test(pass)
    };
    setPasswordChecklist(checks);

    const score = Object.values(checks).filter(Boolean).length;
    if (score === 0) setPasswordStrength({ score, text: '', color: '' });
    else if (score <= 2) setPasswordStrength({ score, text: 'Weak', color: '#e74c3c' });
    else if (score === 3) setPasswordStrength({ score, text: 'Medium', color: '#f39c12' });
    else setPasswordStrength({ score, text: 'Strong', color: '#27ae60' });
  };

  const handleChange = (e) => {
    const { name } = e.target;
    let value = e.target.value;

    if (name === 'phone' || name === 'emergency_contact_phone') {
      value = normalizePhoneNumber(value);
    }

    if (name === 'password') {
      checkPasswordStrength(value);
    }

    if (name === 'date_of_birth') {
      const calculatedAge = calculateAgeFromDob(value);
      setFormData((prev) => ({ ...prev, date_of_birth: value, age: calculatedAge }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIdPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdPhoto(file);
      setError('');
    }
  };

  // Fallback native file/camera input handler for iOS in-app browsers & restricted WebViews
  const handleSelfieFileFallback = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setCameraError('');
    try {
      const compressedBlob = await compressImageToBlob(file, 960, 0.85);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelfiePhoto(ev.target.result);
        setCameraActive(false);
      };
      reader.readAsDataURL(compressedBlob);
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelfiePhoto(ev.target.result);
        setCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureSelfie = () => {
    const imageSrc = webcamRef.current?.getScreenshot?.();
    if (!imageSrc) {
      setError('Camera preview is still warming up or blocked. Please wait a second or use "Use Phone Camera / Upload Photo".');
      return;
    }
    setError('');
    setSelfiePhoto(imageSrc);
    setCameraActive(false);
  };

  const retakeSelfie = () => {
    setSelfiePhoto(null);
    setCameraError('');
    setCameraActive(true);
  };

  const handleNext = async () => {
    setErrorStepTarget(null);

    if (currentStep === 1) {
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
        scrollToAlert();
        return;
      }

      const nameRegex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ\s\-'.]{3,60}$/;
      if (!nameRegex.test(formData.fullName.trim()) || !formData.fullName.trim().includes(' ')) {
        setError('Please enter your complete Full Name (First Name and Last Name).');
        scrollToAlert();
        return;
      }

      const parsedAge = parseInt(formData.age, 10);
      if (Number.isNaN(parsedAge) || parsedAge < 18 || parsedAge > 120) {
        setError(t('mustBe18'));
        scrollToAlert();
        return;
      }

      if (formData.phone.length !== 11 || !formData.phone.startsWith('09')) {
        setError(t('phoneMustBe11'));
        scrollToAlert();
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(formData.username.trim())) {
        setError('Username must be 3-20 characters long and contain only letters, numbers, or underscores.');
        scrollToAlert();
        return;
      }

      if (passwordStrength.score < 4) {
        setError(t('passwordTooWeak') || 'Password must meet all security requirements.');
        scrollToAlert();
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError(t('passwordsDoNotMatch'));
        scrollToAlert();
        return;
      }

      // Check username/email availability early so residents never lose Step 2/3 progress
      setCheckingAvailability(true);
      try {
        const res = await axios.post(
          '/api/auth/check-availability',
          {
            username: formData.username.trim(),
            email: formData.email.trim()
          },
          { timeout: 3500 }
        );
        if (res.data && res.data.available === false) {
          setError(res.data.message || 'Username or Email is already registered.');
          scrollToAlert();
          setCheckingAvailability(false);
          return;
        }
      } catch (err) {
        if (err.response?.status === 409) {
          setError(err.response.data?.message || 'Username or Email is already registered.');
          scrollToAlert();
          setCheckingAvailability(false);
          return;
        }
        // Fail open on network/404 so registration is never blocked during backend rollout or offline demos
      }
      setCheckingAvailability(false);

      setError('');
      setCurrentStep(2);
      document.querySelector('.auth-page')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (
        formData.emergency_contact_phone &&
        (formData.emergency_contact_phone.length !== 11 || !formData.emergency_contact_phone.startsWith('09'))
      ) {
        setError('Emergency Contact Phone must be a valid 11-digit number starting with 09.');
        scrollToAlert();
        return;
      }
      setError('');
      setCurrentStep(3);
      document.querySelector('.auth-page')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSkip = () => {
    setFormData((prev) => ({
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
    document.querySelector('.auth-page')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setError('');
    setErrorStepTarget(null);
    setCameraActive(false);
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 3) return;
    setErrorStepTarget(null);

    if (!formData.id_type) {
      setError('Please select the type of Valid ID you are uploading.');
      scrollToAlert();
      return;
    }
    if (!idPhoto) {
      setError(t('uploadValidId'));
      scrollToAlert();
      return;
    }
    if (!selfiePhoto) {
      setError(t('captureSelfie'));
      scrollToAlert();
      return;
    }
    if (!legalChecked) {
      setError(t('legalWarningReq'));
      scrollToAlert();
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage(t('checkingGps'));

    const { lat, lng } = await getRegistrationCoordinates();
    const isInsidePanay = lat >= 10.5 && lat <= 12.0 && lng >= 121.5 && lng <= 123.5;

    if (!isInsidePanay && lat !== 0) {
      setError(t('registrationBlocked'));
      setStatusMessage('');
      setLoading(false);
      return;
    }

    setStatusMessage(t('verifyingIdentity'));

    try {
      // Compress large ID & Selfie photos (>900KB) for fast mobile uploads while keeping small sharp IDs untouched
      let finalIdFile = idPhoto;
      if (idPhoto.size > 900 * 1024) {
        try {
          const compressedIdBlob = await compressImageToBlob(idPhoto, 1400, 0.88);
          finalIdFile = new File([compressedIdBlob], 'id_photo.jpg', { type: 'image/jpeg' });
        } catch {
          // Keep raw file (e.g., if non-Safari browser cannot decode HEIC via canvas)
        }
      }

      let selfieBlob;
      try {
        selfieBlob = await compressImageToBlob(selfiePhoto, 960, 0.84);
      } catch {
        selfieBlob = await fetch(selfiePhoto).then((res) => res.blob());
      }

      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'confirmPassword') {
          const formKey = key === 'fullName' ? 'full_name' : key;
          submitData.append(formKey, formData[key]);
        }
      });

      submitData.append('id_photo', finalIdFile);
      submitData.append('selfie_photo', selfieBlob, 'selfie.jpg');

      await register(submitData);
      setStatusMessage('');
      setRegistrationComplete(true);
      setRedirectCountdown(5);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || t('registrationFailed');
      setError(errMsg);
      if (/username|email/i.test(errMsg)) {
        setErrorStepTarget(1);
      }
      setStatusMessage('');
      setLoading(false);
    }
  };

  // Safely split legal consent prefix & body even if multiple colons exist
  const legalRawText =
    t('legalWarningText') ||
    'Legal Warning: I understand that submitting fake emergency reports is punishable by law.';
  const colonIdx = legalRawText.indexOf(':');
  const legalPrefix = colonIdx > -1 ? legalRawText.slice(0, colonIdx) : 'Legal Warning';
  const legalBody = colonIdx > -1 ? legalRawText.slice(colonIdx + 1).trim() : legalRawText;

  return (
    <div id="auth-container" className="auth-page reg-page-shell">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear { display: none; }

        .reg-page-shell {
          overflow-y: auto;
          align-items: flex-start;
          padding: max(20px, env(safe-area-inset-top)) 14px max(28px, env(safe-area-inset-bottom)) 14px !important;
          -webkit-overflow-scrolling: touch;
        }

        .reg-card {
          max-width: 620px;
          padding: 32px;
          margin: auto;
          width: 100%;
          box-sizing: border-box;
          overflow: visible;
        }

        .reg-top-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 18px;
        }

        .reg-brand-group {
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .reg-brand-seal {
          width: 54px;
          height: 54px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .reg-lang-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 7px 11px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--card-alt);
          color: var(--primary-color);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          touch-action: manipulation;
          white-space: nowrap;
          flex-shrink: 0;
          -webkit-tap-highlight-color: transparent;
        }

        .reg-lang-btn:hover {
          background: var(--primary-light);
        }

        /* Enhanced Labeled Stepper */
        .reg-stepper {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          position: relative;
          margin: 18px 0 24px 0;
        }

        .reg-stepper-track {
          position: absolute;
          top: 16px;
          left: 16.66%;
          right: 16.66%;
          height: 3px;
          background-color: var(--border-color);
          z-index: 1;
          border-radius: 999px;
        }

        .reg-stepper-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background-color: var(--primary-color);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .reg-step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          z-index: 2;
        }

        .step-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--card-bg);
          border: 2.5px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          color: var(--text-muted);
          transition: all 0.25s ease;
        }

        .step-indicator.active {
          border-color: var(--primary-color);
          color: var(--primary-color);
          box-shadow: 0 0 0 4px rgba(61, 122, 80, 0.14);
        }

        .step-indicator.completed {
          background-color: var(--primary-color);
          border-color: var(--primary-color);
          color: #ffffff;
        }

        .reg-step-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          text-align: center;
        }

        .reg-step-label.active {
          color: var(--primary-color);
          font-weight: 700;
        }

        .reg-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          margin: 4px 0 16px 0;
          color: var(--text-main);
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 10px;
        }

        /* Responsive Grids + iOS Date Fix */
        .reg-grid-dob-age {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
          gap: 14px;
          width: 100%;
          align-items: flex-start;
        }

        .reg-grid-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          width: 100%;
          align-items: flex-start;
        }

        .reg-grid-dob-age > div,
        .reg-grid-row > div {
          min-width: 0;
          width: 100%;
        }

        .reg-card input,
        .reg-card select,
        .reg-card button {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .reg-card .form-input,
        .reg-card .form-select {
          min-height: 46px;
          height: 46px;
          font-size: 16px;
          box-sizing: border-box;
        }

        /* iOS Safari Native Date Input Normalization */
        input[type="date"].form-input,
        input#date_of_birth {
          display: flex;
          align-items: center;
          width: 100%;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          background-color: #ffffff;
        }

        input[type="date"]::-webkit-date-and-time-value {
          text-align: left;
          min-height: 1.2em;
          margin: 0;
        }

        input#age {
          min-width: 0;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Step 3 Styled Upload & Camera Cards */
        .reg-upload-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 18px 14px;
          border: 2px dashed var(--border-color);
          border-radius: 12px;
          background-color: var(--card-alt);
          cursor: pointer;
          text-align: center;
          transition: border-color 0.2s, background-color 0.2s;
        }

        .reg-upload-box:hover {
          border-color: var(--primary-color);
          background-color: var(--primary-light);
        }

        .reg-webcam-frame {
          position: relative;
          width: 100%;
          max-width: 310px;
          border-radius: 14px;
          overflow: hidden;
          border: 2px solid var(--primary-color);
          background: #0f172a;
        }

        .reg-face-guide {
          position: absolute;
          inset: 14% 22%;
          border: 2px dashed rgba(255, 255, 255, 0.72);
          border-radius: 50%;
          pointer-events: none;
        }

        .step-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 24px;
          gap: 10px;
          flex-wrap: wrap;
        }

        .step-actions-right {
          display: flex;
          gap: 10px;
          margin-left: auto;
        }

        .step-actions button,
        .reg-next-btn {
          min-height: 46px;
        }

        @media (max-width: 540px) {
          .reg-page-shell {
            padding: max(12px, env(safe-area-inset-top)) 10px max(24px, env(safe-area-inset-bottom)) 10px !important;
          }

          .reg-card {
            padding: 22px 16px !important;
            border-radius: 14px !important;
          }

          .reg-brand-seal {
            width: 44px;
            height: 44px;
          }

          /* Stack Date of Birth & Age vertically on mobile/iOS to completely eliminate overlap */
          .reg-grid-dob-age {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .reg-grid-row {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }

        @media (max-width: 390px) {
          .step-actions {
            flex-direction: column-reverse;
            align-items: stretch;
          }

          .step-actions-right {
            margin-left: 0;
            width: 100%;
          }

          .step-actions-right button {
            flex: 1;
          }

          .step-actions > button {
            width: 100%;
          }
        }
      `}</style>

      <div className="auth-card reg-card">
        {/* Brand Header + Language Switcher */}
        <div className="reg-top-bar">
          <div className="reg-brand-group">
            <img src="/logo.png" alt="Jamindan Seal" className="reg-brand-seal" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--primary-color)', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                Jamindan ER
              </div>
              <h1 className="auth-title" style={{ fontSize: '20px', margin: '1px 0 2px 0', color: 'var(--text-main)' }}>
                {t('residentRegistration') || 'Resident Registration'}
              </h1>
              <p className="auth-subtitle" style={{ margin: 0, fontSize: '13px' }}>
                {registrationComplete ? 'Account Submitted' : `Step ${currentStep} of ${totalSteps}`}
              </p>
            </div>
          </div>

          {!registrationComplete && (
            <button
              type="button"
              onClick={toggleLanguage}
              className="reg-lang-btn"
              title="Switch English / Hiligaynon"
            >
              <Globe size={14} />
              {lang === 'en' ? 'EN | hil' : 'en | HIL'}
            </button>
          )}
        </div>

        {/* Labeled 3-Step Stepper */}
        {!registrationComplete && (
          <div className="reg-stepper" aria-label="Registration progress">
            <div className="reg-stepper-track">
              <div
                className="reg-stepper-fill"
                style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
              />
            </div>
            {STEPS.map((step) => {
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              return (
                <div key={step.id} className="reg-step-node">
                  <div className={`step-indicator ${isCompleted ? 'completed' : isActive ? 'active' : ''}`}>
                    {isCompleted ? <CheckCircle size={16} /> : step.id}
                  </div>
                  <span className={`reg-step-label ${isActive || isCompleted ? 'active' : ''}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Alerts & Progress Feedback */}
        {error && (
          <div
            id="auth-message-alert"
            className="alert alert-danger"
            style={{ marginBottom: '18px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
            {errorStepTarget && errorStepTarget !== currentStep && (
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(errorStepTarget);
                  setError('');
                  setErrorStepTarget(null);
                }}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(220, 38, 38, 0.35)',
                  color: '#b91c1c',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Go to Step {errorStepTarget} to Edit
              </button>
            )}
          </div>
        )}

        {statusMessage && !registrationComplete && (
          <div
            id="auth-message-alert"
            className="alert alert-success"
            style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Registration Complete Screen */}
        {registrationComplete ? (
          <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                backgroundColor: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}
            >
              <CheckCircle size={36} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>
              Registration Submitted!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', lineHeight: '1.5', marginBottom: '22px' }}>
              {t('accountRegistered')}
            </p>
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => navigate('/login')}
              style={{ minHeight: '48px', fontSize: '15px', fontWeight: '700' }}
            >
              Go to Sign In ({redirectCountdown}s)
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">

            {/* STEP 1: PERSONAL & ACCOUNT INFO */}
            {currentStep === 1 && (
              <div className="step-content">
                <div style={{
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary-hover)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{t('ageReqWarning')}</span>
                </div>

                <div className="reg-section-header">
                  <User size={17} style={{ color: 'var(--primary-color)' }} />
                  <span>Personal Information</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">
                    {t('fullNameLabel')} <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className="form-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder={t('completeName')}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="form-group reg-grid-dob-age">
                  <div>
                    <label className="form-label" htmlFor="date_of_birth">
                      Date of Birth <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      className="form-input"
                      value={formData.date_of_birth}
                      max={todayISO}
                      onChange={handleChange}
                      autoComplete="bday"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="age">Age</label>
                    <input
                      type="text"
                      id="age"
                      name="age"
                      className="form-input"
                      value={formData.age !== '' ? `${formData.age} yrs old` : ''}
                      readOnly
                      placeholder="Auto-calculated"
                      style={{ backgroundColor: 'var(--card-alt)', color: 'var(--text-main)', fontWeight: '600' }}
                    />
                  </div>
                </div>

                <div className="form-group reg-grid-row">
                  <div>
                    <label className="form-label" htmlFor="phone">
                      {t('phoneNumberLabel')} <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      id="phone"
                      name="phone"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t('phoneEg') || '09XXXXXXXXX'}
                      autoComplete="tel-national"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="email">
                      Email Address <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoCapitalize="none"
                      autoCorrect="off"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="barangay">
                    {t('barangayLabel')} <span style={{ color: 'red' }}>*</span>
                  </label>
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

                <div className="reg-section-header" style={{ marginTop: '26px' }}>
                  <Lock size={17} style={{ color: 'var(--primary-color)' }} />
                  <span>Account Security</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="username">
                    {t('usernameLabel')} <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className="form-input"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder={t('createUsername')}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    required
                  />
                </div>

                <div className="form-group reg-grid-row">
                  <div>
                    <label className="form-label" htmlFor="password">
                      {t('passwordLabel')} <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className="form-input"
                        style={{ paddingRight: '44px' }}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={t('createStrongPass')}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="confirmPassword">
                      {t('confirmPassword')} <span style={{ color: 'red' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        className="form-input"
                        style={{ paddingRight: '44px' }}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder={t('retypePass')}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          right: '6px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {formData.password.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', background: 'var(--card-alt)', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Password strength:</span>
                      <span style={{ fontWeight: '800', color: passwordStrength.color }}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div style={{ height: '5px', width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{
                        height: '100%',
                        width: `${(passwordStrength.score / 4) * 100}%`,
                        backgroundColor: passwordStrength.color || 'var(--primary-color)',
                        transition: 'width 0.25s ease, background-color 0.25s ease'
                      }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div style={{ color: passwordChecklist.length ? '#27ae60' : 'var(--text-muted)', fontWeight: passwordChecklist.length ? '600' : '400' }}>
                        {passwordChecklist.length ? '✓' : '○'} 8+ characters
                      </div>
                      <div style={{ color: passwordChecklist.upper ? '#27ae60' : 'var(--text-muted)', fontWeight: passwordChecklist.upper ? '600' : '400' }}>
                        {passwordChecklist.upper ? '✓' : '○'} 1 Uppercase
                      </div>
                      <div style={{ color: passwordChecklist.number ? '#27ae60' : 'var(--text-muted)', fontWeight: passwordChecklist.number ? '600' : '400' }}>
                        {passwordChecklist.number ? '✓' : '○'} 1 Number
                      </div>
                      <div style={{ color: passwordChecklist.special ? '#27ae60' : 'var(--text-muted)', fontWeight: passwordChecklist.special ? '600' : '400' }}>
                        {passwordChecklist.special ? '✓' : '○'} 1 Special Char
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                  <button
                    type="button"
                    className="btn btn-primary reg-next-btn"
                    onClick={handleNext}
                    disabled={checkingAvailability}
                    style={{ width: '100%', fontSize: '15px', fontWeight: '700' }}
                  >
                    {checkingAvailability ? 'Checking availability...' : (
                      <>Next Step <ArrowRight size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: MEDICAL & EMERGENCY */}
            {currentStep === 2 && (
              <div className="step-content">
                <div className="reg-section-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HeartPulse size={18} style={{ color: 'var(--danger-color)' }} />
                    <span>Medical & Emergency</span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    color: 'var(--primary-color)',
                    backgroundColor: 'var(--primary-light)',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    fontWeight: '700'
                  }}>
                    Optional
                  </span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '18px', lineHeight: '1.5' }}>
                  This information helps MDRRMO & RHU first responders treat you faster during an emergency. You can skip this and fill it out later in your profile.
                </p>

                <div className="form-group reg-grid-row">
                  <div>
                    <label className="form-label" htmlFor="purok_sitio">Purok / Sitio</label>
                    <input
                      type="text"
                      id="purok_sitio"
                      name="purok_sitio"
                      className="form-input"
                      value={formData.purok_sitio}
                      onChange={handleChange}
                      placeholder="e.g. Purok 1"
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="blood_type">Blood Type</label>
                    <select
                      id="blood_type"
                      name="blood_type"
                      className="form-select"
                      value={formData.blood_type}
                      onChange={handleChange}
                    >
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
                  <input
                    type="text"
                    id="allergies"
                    name="allergies"
                    className="form-input"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="e.g. Penicillin, Peanuts (or leave blank)"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="medical_conditions">Medical Conditions</label>
                  <input
                    type="text"
                    id="medical_conditions"
                    name="medical_conditions"
                    className="form-input"
                    value={formData.medical_conditions}
                    onChange={handleChange}
                    placeholder="e.g. Asthma, Hypertension (or leave blank)"
                  />
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '22px 0 12px 0', color: 'var(--text-main)' }}>
                  Emergency Contact Person
                </h4>
                <div className="form-group reg-grid-row">
                  <div>
                    <label className="form-label" htmlFor="emergency_contact_name">Contact Name</label>
                    <input
                      type="text"
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      className="form-input"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="emergency_contact_phone">Contact Phone</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      className="form-input"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      placeholder="09XXXXXXXXX"
                    />
                  </div>
                </div>

                <div className="step-actions">
                  <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                    <ArrowLeft size={17} /> Back
                  </button>
                  <div className="step-actions-right">
                    <button
                      type="button"
                      className="btn"
                      style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-light)' }}
                      onClick={handleSkip}
                    >
                      Skip
                    </button>
                    <button type="button" className="btn btn-primary" onClick={handleNext}>
                      Next Step <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: IDENTITY VERIFICATION */}
            {currentStep === 3 && (
              <div className="step-content">
                <div className="reg-section-header">
                  <ShieldCheck size={18} style={{ color: 'var(--primary-color)' }} />
                  <span>{t('identityVerification') || 'Identity Verification'}</span>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="id_type">
                    {t('typeOfId')} <span style={{ color: 'red' }}>*</span>
                  </label>
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

                {/* Styled Valid ID Upload Card (iOS Photo Library / Android Camera & Gallery compatible) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="idPhoto">
                    {t('uploadId')?.replace('{idType}', formData.id_type || 'Valid ID') || `Upload ${formData.id_type || 'Valid ID'}`}{' '}
                    <span style={{ color: 'red' }}>*</span>
                  </label>

                  <input
                    type="file"
                    id="idPhoto"
                    name="idPhoto"
                    accept="image/*"
                    onChange={handleIdPhotoChange}
                    style={{ display: 'none' }}
                  />

                  <label htmlFor="idPhoto" className="reg-upload-box">
                    {idPhoto ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                        {idPreviewUrl && (
                          <img
                            src={idPreviewUrl}
                            alt="Uploaded ID preview"
                            style={{
                              maxWidth: '240px',
                              maxHeight: '140px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '2px solid var(--primary-color)'
                            }}
                          />
                        )}
                        <div style={{ fontSize: '13px', color: '#059669', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px', wordBreak: 'break-all' }}>
                          <CheckCircle size={15} /> {idPhoto.name}
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--primary-color)', fontWeight: '600', textDecoration: 'underline' }}>
                          Tap to replace ID photo
                        </span>
                      </div>
                    ) : (
                      <>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Upload size={20} />
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                          Tap to take or upload ID photo
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Supports JPG, PNG, WEBP &amp; iPhone Photos
                        </div>
                      </>
                    )}
                  </label>
                </div>

                {/* Live Selfie + Native Mobile Camera Fallback */}
                <div className="form-group">
                  <label className="form-label">
                    {t('liveSelfieVerif')} <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{
                    background: 'var(--card-alt)',
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'center',
                    border: '1px solid var(--border-color)'
                  }}>
                    <input
                      type="file"
                      id="selfieFallbackInput"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieFileFallback}
                      style={{ display: 'none' }}
                    />

                    {!selfiePhoto && !cameraActive && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => {
                            setCameraError('');
                            setCameraActive(true);
                          }}
                          style={{ width: '100%', maxWidth: '300px' }}
                        >
                          <Camera size={17} /> {t('openCamera')}
                        </button>

                        <label
                          htmlFor="selfieFallbackInput"
                          className="btn btn-secondary"
                          style={{ width: '100%', maxWidth: '300px', fontSize: '13px', cursor: 'pointer' }}
                        >
                          <Upload size={16} /> Use Phone Camera / Upload Photo
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Works on iOS Safari, Android Chrome &amp; in-app browsers
                        </span>
                      </div>
                    )}

                    {cameraActive && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        {cameraError ? (
                          <div style={{
                            backgroundColor: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                            padding: '12px',
                            borderRadius: '10px',
                            fontSize: '13px',
                            lineHeight: '1.45',
                            width: '100%'
                          }}>
                            <div style={{ fontWeight: '700', marginBottom: '6px' }}>{cameraError}</div>
                            <label
                              htmlFor="selfieFallbackInput"
                              className="btn btn-primary"
                              style={{ width: '100%', cursor: 'pointer', marginTop: '4px' }}
                            >
                              <Camera size={16} /> Take / Choose Selfie Photo
                            </label>
                          </div>
                        ) : (
                          <div className="reg-webcam-frame">
                            <Webcam
                              audio={false}
                              mirrored
                              ref={webcamRef}
                              screenshotFormat="image/jpeg"
                              screenshotQuality={0.9}
                              videoConstraints={{ facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }}
                              onUserMediaError={() =>
                                setCameraError('Camera access was blocked or unsupported in this browser. Tap below to use your phone camera directly:')
                              }
                              style={{ width: '100%', display: 'block' }}
                            />
                            <div className="reg-face-guide" />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '310px' }}>
                          {!cameraError && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={captureSelfie}
                              style={{ flex: 1 }}
                            >
                              <Camera size={16} /> {t('capturePhoto')}
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setCameraActive(false);
                              setCameraError('');
                            }}
                            style={{ flex: cameraError ? 1 : 0.7 }}
                          >
                            {t('cancelBtn')}
                          </button>
                        </div>
                      </div>
                    )}

                    {selfiePhoto && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={selfiePhoto}
                          alt="Selfie Preview"
                          style={{
                            width: '100%',
                            maxWidth: '240px',
                            borderRadius: '12px',
                            border: '2px solid var(--primary-color)',
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          <button type="button" className="btn btn-secondary" onClick={retakeSelfie}>
                            <RefreshCw size={15} /> {t('retakeSelfieBtn')}
                          </button>
                          <label htmlFor="selfieFallbackInput" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                            <Upload size={15} /> Replace Photo
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="form-group"
                  style={{
                    marginTop: '18px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    background: '#fffbeb',
                    padding: '14px',
                    border: '1px solid #fde68a',
                    borderLeft: '4px solid #f59e0b',
                    borderRadius: '8px'
                  }}
                >
                  <input
                    type="checkbox"
                    id="legalCheck"
                    checked={legalChecked}
                    onChange={(e) => setLegalChecked(e.target.checked)}
                    style={{
                      width: '20px',
                      height: '20px',
                      minWidth: '20px',
                      marginTop: '2px',
                      cursor: 'pointer',
                      accentColor: 'var(--primary-color)'
                    }}
                  />
                  <label htmlFor="legalCheck" style={{ fontSize: '12.5px', color: '#78350f', cursor: 'pointer', margin: 0, lineHeight: '1.45' }}>
                    <strong>{legalPrefix}:</strong> {legalBody}
                  </label>
                </div>

                <div className="step-actions">
                  <button type="button" className="btn btn-secondary" onClick={handlePrev} disabled={loading}>
                    <ArrowLeft size={17} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ flex: 1, minWidth: '180px', fontWeight: '700' }}
                  >
                    {loading ? t('submittingReg') : (
                      <>
                        <CheckCircle size={17} /> {t('submitRegBtn') || 'Complete Registration'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </form>
        )}

        <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '14px', color: 'var(--text-light)' }}>
          {t('alreadyRegistered')}{' '}
          <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '700', textDecoration: 'none' }}>
            {t('logInLink')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
export { BARANGAYS };
