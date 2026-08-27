import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, ShieldAlert, HeartPulse, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Household = () => {
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: '',
    medicalNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await axios.get('/api/household');
      setMembers(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch household members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const { fullName, age, gender, medicalNotes } = formData;
    if (!fullName || !age || !gender) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/household', {
        full_name: fullName,
        age: parseInt(age),
        gender,
        medical_notes: medicalNotes
      });
      setSuccess('Household member added successfully.');
      setFormData({
        fullName: '',
        age: '',
        gender: '',
        medicalNotes: ''
      });
      fetchMembers();
    } catch (err) {
      console.error(err);
      setError('Failed to add household member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to remove this household member?')) return;
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/household/${id}`);
      setSuccess('Household member removed successfully.');
      fetchMembers();
    } catch (err) {
      console.error(err);
      setError('Failed to remove household member.');
    }
  };

  if (loading) {
    return (
      <div className="content-body">
        <p style={{ color: 'var(--text-light)' }}>{t('loadingHousehold')}</p>
      </div>
    );
  }

  return (
    <div className="content-body" style={{ maxWidth: '1000px' }}>

      {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '20px' }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '20px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="responsive-grid-col">
        
        {/* Members List */}
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            👥 {t('householdHeadcount')} ({members.length} {members.length === 1 ? t('memberSingle') : t('memberPlural')})
          </h3>

          {members.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center', backgroundColor: '#fafbfc', borderRadius: '12px', border: '1px dashed var(--border-color)', marginTop: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eaf5ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', marginBottom: '16px' }}>
                <Sparkles size={24} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{t('noHouseholdListed')}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', maxWidth: '320px', margin: 0 }}>{t('householdInfo')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {members.map((member) => (
                <div 
                  key={member.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    padding: '16px', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    boxShadow: 'var(--shadow-sm)',
                    gap: '16px'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ebf5fb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2980b9', fontSize: '14px', fontWeight: '800', flexShrink: 0 }}>
                    {member.gender === 'Female' ? '👩' : '👨'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{member.full_name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-light)', backgroundColor: '#f0f2f0', padding: '2px 8px', borderRadius: '12px' }}>
                        {member.age} {t('yrsOld')} • {t(member.gender.toLowerCase()) || member.gender}
                      </span>
                    </div>

                    {member.medical_notes ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: '#c0392b', fontSize: '13px', backgroundColor: '#fdf2f2', padding: '6px 10px', borderRadius: '6px' }}>
                        <HeartPulse size={14} style={{ flexShrink: 0 }} />
                        <span style={{ fontWeight: '500' }}>{t('medicalVal')} {member.medical_notes}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px' }}>{t('noMedicalVal')}</div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteMember(member.id)} 
                    style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className="btn-icon-hover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Member Card */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} style={{ color: 'var(--primary-color)' }} />
              {t('addFamilyMember')}
            </h3>
            
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('fullName')}</label>
                <input 
                  type="text" 
                  name="fullName"
                  className="form-input" 
                  placeholder={t('enterCompleteName')} 
                  value={formData.fullName} 
                  onChange={handleChange}
                  required 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('ageStar')}</label>
                  <input 
                    type="number" 
                    name="age"
                    className="form-input" 
                    placeholder={t('ageLabel')} 
                    value={formData.age} 
                    onChange={handleChange}
                    min="0"
                    max="125"
                    required 
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('genderStar')}</label>
                  <select 
                    name="gender"
                    className="form-select" 
                    value={formData.gender} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">{t('selectLabel')}</option>
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('medicalNotesLabel')}</label>
                <textarea 
                  name="medicalNotes"
                  className="form-input" 
                  placeholder={t('medicalPlaceholder')}
                  value={formData.medicalNotes} 
                  onChange={handleChange}
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ height: '40px', marginTop: '4px' }}>
                {submitting ? t('addingLabel') : t('addMemberBtn')}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', backgroundColor: '#fdf9eb', border: '1px solid #faebcc', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
            <ShieldAlert size={20} style={{ color: '#d4ac0d', flexShrink: 0 }} />
            <p style={{ fontSize: '12px', color: '#8a6d3b', margin: 0 }} dangerouslySetInnerHTML={{
              __html: t('disasterTip').replace('Disaster Preparedness Tip:', '<strong>' + t('disasterTip').split(':')[0] + ':</strong>')
            }}>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Household;
