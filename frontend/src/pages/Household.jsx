import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, ShieldAlert, HeartPulse, Sparkles, Users, User, Info, Activity } from 'lucide-react';
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
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
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
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to remove household member.');
    }
  };

  // Helper for generating initials
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Helper for age categories
  const getAgeCategory = (age) => {
    if (age >= 60) return { label: 'Senior (60+)', color: '#8e44ad', bg: '#f4ecf7' };
    if (age <= 12) return { label: 'Child (0-12)', color: '#e67e22', bg: '#fef5e7' };
    if (age <= 17) return { label: 'Teen (13-17)', color: '#2980b9', bg: '#ebf5fb' };
    return { label: 'Adult', color: '#27ae60', bg: '#eaeded' }; // Adult uses a neutral green/gray
  };

  // Calculate summary stats
  const totalMembers = members.length;
  const seniorsCount = members.filter(m => m.age >= 60).length;
  const minorsCount = members.filter(m => m.age < 18).length;
  const medicalCount = members.filter(m => m.medical_notes && m.medical_notes.trim().length > 0).length;

  if (loading) {
    return (
      <div className="content-body">
        <p style={{ color: 'var(--text-light)' }}>{t('loadingHousehold')}</p>
      </div>
    );
  }

  return (
    <div className="content-body" style={{ maxWidth: '1000px', paddingBottom: '60px' }}>

      {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', animation: 'fadeIn 0.3s ease-out' }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', animation: 'fadeIn 0.3s ease-out' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="responsive-grid-col">
        
        {/* Members List Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Summary Stats Card */}
          <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <Users size={20} color="var(--primary-color)" />
                 {t('householdHeadcount')}
               </h3>
               <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
                 {totalMembers} {totalMembers === 1 ? t('memberSingle') : t('memberPlural')}
               </span>
            </div>
            
            {totalMembers > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ backgroundColor: '#f4ecf7', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#8e44ad' }}>{seniorsCount}</div>
                  <div style={{ fontSize: '11px', color: '#6c3483', fontWeight: '600' }}>Seniors</div>
                </div>
                <div style={{ backgroundColor: '#ebf5fb', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#2980b9' }}>{minorsCount}</div>
                  <div style={{ fontSize: '11px', color: '#1f618d', fontWeight: '600' }}>Minors</div>
                </div>
                <div style={{ backgroundColor: '#fdf2f2', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#c0392b' }}>{medicalCount}</div>
                  <div style={{ fontSize: '11px', color: '#922b21', fontWeight: '600' }}>Medical Needs</div>
                </div>
              </div>
            )}
          </div>

          {/* Members List */}
          {members.length === 0 ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--border-color)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(var(--primary-rgb, 46,204,113), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', marginBottom: '16px' }}>
                <Sparkles size={28} />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>{t('noHouseholdListed')}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', maxWidth: '320px', margin: 0, lineHeight: '1.5' }}>{t('householdInfo')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {members.map((member) => {
                const hasMedical = member.medical_notes && member.medical_notes.trim().length > 0;
                const ageCat = getAgeCategory(member.age);
                
                return (
                  <div 
                    key={member.id} 
                    className="glass-card"
                    style={{ 
                      padding: '16px', 
                      display: 'flex', 
                      alignItems: 'flex-start',
                      gap: '16px',
                      borderLeft: hasMedical ? '4px solid #e74c3c' : '4px solid #2ecc71',
                      transition: 'transform 0.2s',
                    }}
                  >
                    {/* Professional Initials Avatar */}
                    <div style={{ 
                      width: '46px', 
                      height: '46px', 
                      borderRadius: '12px', 
                      backgroundColor: hasMedical ? '#fdf2f2' : '#ebf5fb', 
                      color: hasMedical ? '#c0392b' : '#2980b9', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '16px', 
                      fontWeight: '800', 
                      flexShrink: 0 
                    }}>
                      {getInitials(member.full_name)}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-main)' }}>{member.full_name}</span>
                        
                        {/* Gender Badge */}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: '#f0f2f5', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                          {t(member.gender.toLowerCase()) || member.gender}
                        </span>
                        
                        {/* Age Category Badge */}
                        <span style={{ fontSize: '11px', color: ageCat.color, backgroundColor: ageCat.bg, padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                          {ageCat.label}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '8px' }}>
                        {member.age} {t('yrsOld')}
                      </div>

                      {/* Medical Notes Highlight */}
                      {hasMedical ? (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#c0392b', fontSize: '13px', backgroundColor: '#fdf2f2', padding: '8px 12px', borderRadius: '8px', borderLeft: '2px solid #e74c3c' }}>
                          <Activity size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <span style={{ fontWeight: '700', display: 'block', marginBottom: '2px' }}>Medical Condition</span>
                            <span style={{ fontWeight: '500', lineHeight: '1.4' }}>{member.medical_notes}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    
                    <button 
                      onClick={() => handleDeleteMember(member.id)} 
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--text-muted)', 
                        cursor: 'pointer', 
                        padding: '8px', 
                        borderRadius: '8px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fdf2f2'; e.currentTarget.style.color = '#e74c3c'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      title="Remove Member"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Member Form Section */}
        <div>
          <div className="glass-card" style={{ position: 'sticky', top: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="var(--primary-color)" />
              {t('addFamilyMember')}
            </h3>
            
            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

              {/* Enhanced Submit Button */}
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting} 
                style={{ 
                  height: '48px', 
                  marginTop: '8px', 
                  fontSize: '15px', 
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(var(--primary-rgb, 46,204,113), 0.3)'
                }}
              >
                {submitting ? (
                  t('addingLabel')
                ) : (
                  <>
                    <UserPlus size={18} />
                    {t('addMemberBtn')}
                  </>
                )}
              </button>
            </form>

            {/* Safer Tip Box (no dangerouslySetInnerHTML) */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#fef9e7', border: '1px solid #f9e79f', borderRadius: '12px', padding: '16px', marginTop: '24px' }}>
              <Info size={20} style={{ color: '#d4ac0d', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: '#7d6608', lineHeight: '1.5' }}>
                <strong>{t('disasterTip').split(':')[0]}:</strong>
                {t('disasterTip').substring(t('disasterTip').indexOf(':') + 1)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Household;
