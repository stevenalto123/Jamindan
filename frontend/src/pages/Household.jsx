import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Trash2, Sparkles, Users, Info, Activity } from 'lucide-react';
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
      setMembers(res.data || []);
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

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAgeCategory = (age) => {
    if (age >= 60) return { label: 'Senior (60+)', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' };
    if (age <= 12) return { label: 'Child (0-12)', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' };
    if (age <= 17) return { label: 'Teen (13-17)', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' };
    return { label: 'Adult', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' };
  };

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
    <div className="content-body" style={{ maxWidth: '1100px', paddingBottom: '48px' }}>

      {success && <div className="alert alert-success" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px' }}>{success}</div>}
      {error && <div className="alert alert-danger" style={{ fontSize: '13px', padding: '12px 16px', marginBottom: '16px', borderRadius: '8px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '20px' }} className="responsive-grid-col">

        {/* Left Column: Summary Stats & Members List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Summary Stats Card */}
          <div className="glass-card" style={{ padding: '16px 18px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--primary-color)" />
                {t('householdHeadcount')}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', backgroundColor: 'var(--card-alt)', padding: '3px 10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                {totalMembers} {totalMembers === 1 ? t('memberSingle') : t('memberPlural')}
              </span>
            </div>

            {totalMembers > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{seniorsCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Seniors</div>
                </div>
                <div style={{ backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>{minorsCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Minors</div>
                </div>
                <div style={{ backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: medicalCount > 0 ? '#ef4444' : 'var(--text-main)' }}>{medicalCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Medical Needs</div>
                </div>
              </div>
            )}
          </div>

          {/* Members List */}
          {members.length === 0 ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 20px', textAlign: 'center', borderRadius: '12px', border: '1px dashed var(--border-color)', boxShadow: 'none' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--card-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)', marginBottom: '12px' }}>
                <Sparkles size={22} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0' }}>{t('noHouseholdListed')}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-light)', maxWidth: '320px', margin: 0, lineHeight: '1.5' }}>{t('householdInfo')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {members.map((member) => {
                const hasMedical = member.medical_notes && member.medical_notes.trim().length > 0;
                const ageCat = getAgeCategory(member.age);

                return (
                  <div
                    key={member.id}
                    className="glass-card"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      boxShadow: 'none'
                    }}
                  >
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--card-alt)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--primary-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {getInitials(member.full_name)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{member.full_name}</span>

                        <span style={{ fontSize: '10px', color: 'var(--text-light)', backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', padding: '2px 7px', borderRadius: '8px', fontWeight: '600' }}>
                          {t(member.gender.toLowerCase()) || member.gender}
                        </span>

                        <span style={{ fontSize: '10px', color: ageCat.color, backgroundColor: ageCat.bg, padding: '2px 7px', borderRadius: '8px', fontWeight: '700' }}>
                          {ageCat.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: hasMedical ? '8px' : 0 }}>
                        {member.age} {t('yrsOld')}
                      </div>

                      {hasMedical && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#ef4444', fontSize: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '7px 10px', borderRadius: '8px' }}>
                          <Activity size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <span style={{ fontWeight: '700', marginRight: '4px' }}>Medical Note:</span>
                            <span style={{ color: 'var(--text-main)' }}>{member.medical_notes}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Remove Member"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Add Member Form */}
        <div>
          <div className="glass-card" style={{ position: 'sticky', top: '20px', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={18} color="var(--primary-color)" />
              {t('addFamilyMember')}
            </h3>

            <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                  rows={2}
                  style={{ resize: 'vertical', minHeight: '64px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{
                  height: '42px',
                  marginTop: '4px',
                  fontSize: '14px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '10px'
                }}
              >
                {submitting ? t('addingLabel') : <><UserPlus size={16} /> {t('addMemberBtn')}</>}
              </button>
            </form>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', backgroundColor: 'var(--card-alt)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px 14px', marginTop: '18px' }}>
              <Info size={16} style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.5' }}>
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
