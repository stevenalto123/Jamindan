import React, { useState } from 'react';
import { 
  BookOpen, HeartPulse, PlusCircle, AlertCircle, Droplet, Flame, 
  Droplets, Activity, BriefcaseMedical, Flashlight, Radio, Battery, 
  Map as MapIcon, Utensils, FileText, CheckCircle2 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StepBox = ({ number, title, text }) => (
  <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' }}>
    <div style={{ 
      width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '800', flexShrink: 0,
      boxShadow: '0 2px 5px rgba(46,204,113,0.3)'
    }}>
      {number}
    </div>
    <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
      {title && <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{title}</div>}
      <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-light)' }}>{text}</div>
    </div>
  </div>
);

const KitItem = ({ icon: Icon, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
    <Icon size={18} color="var(--primary-color)" />
    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{label}</span>
  </div>
);

const EmergencyTips = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('cpr');

  const tabs = [
    { id: 'cpr', label: 'CPR', icon: HeartPulse, color: '#e74c3c' },
    { id: 'choking', label: 'Choking', icon: AlertCircle, color: '#e67e22' },
    { id: 'bleeding', label: 'Bleeding', icon: Droplet, color: '#c0392b' },
    { id: 'burns', label: 'Burns', icon: Flame, color: '#d35400' },
    { id: 'snake', label: 'Snake Bite', icon: PlusCircle, color: '#27ae60' }
  ];

  return (
    <div className="content-body" style={{ maxWidth: '900px', paddingBottom: '60px' }}>
      
      {/* ─── DISASTER PREPAREDNESS ───────────────────────────────────────── */}
      <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Disaster Safety
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Flood Card */}
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #3498db' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#3498db', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>
            <Droplets size={24} /> {t('floodSafety') || 'Flood Safety'}
          </h4>
          <StepBox number="1" text={t('floodTip1') || 'Evacuate immediately to higher ground if advised.'} />
          <StepBox number="2" text={t('floodTip2') || 'Do not walk, swim or drive through flood waters.'} />
          <StepBox number="3" text={t('floodTip3') || 'Stay off bridges over fast-moving water.'} />
          <StepBox number="4" text={t('floodTip4') || 'Move to the highest level of a building if trapped.'} />
        </div>

        {/* Earthquake Card */}
        <div className="glass-card" style={{ padding: '24px', borderLeft: '4px solid #e67e22' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e67e22', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '800' }}>
            <Activity size={24} /> {t('earthquakeSafety') || 'Earthquake Safety'}
          </h4>
          <StepBox number="1" title="DROP (DUKO)" text="Drop to your hands and knees immediately." />
          <StepBox number="2" title="COVER (PANAGO)" text="Cover your head and neck under a sturdy table or desk." />
          <StepBox number="3" title="HOLD ON (KAPOT)" text="Hold on to your shelter until the shaking stops." />
          <StepBox number="4" text={t('eqTip4') || 'If outside, move away from buildings, streetlights, and utility wires.'} />
        </div>
      </div>

      {/* ─── EMERGENCY KIT ────────────────────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '32px', border: '1px solid #7f8c8d', borderLeft: '4px solid #7f8c8d' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#34495e', margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800' }}>
          <BriefcaseMedical size={24} color="#7f8c8d" /> {t('kitEssentials') || '72-Hour Emergency Kit'}
        </h4>
        <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '20px', lineHeight: '1.5' }}>
          {t('kitDesc') || 'Every household should have a grab-and-go bag ready. It should contain enough supplies to last your family for at least 72 hours (3 days).'}
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          <KitItem icon={Droplet} label="Water (1 gal/person/day)" />
          <KitItem icon={Utensils} label="Non-perishable Food" />
          <KitItem icon={BriefcaseMedical} label="First Aid Kit" />
          <KitItem icon={Flashlight} label="Flashlight" />
          <KitItem icon={Battery} label="Extra Batteries" />
          <KitItem icon={Radio} label="Battery/Crank Radio" />
          <KitItem icon={MapIcon} label="Local Maps" />
          <KitItem icon={FileText} label="Important Documents" />
        </div>
      </div>

      {/* ─── FIRST AID GUIDE ──────────────────────────────────────────────── */}
      <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        First Aid Guides
      </h3>
      
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden', borderLeft: '4px solid var(--danger-color)' }}>
        <div style={{ padding: '20px 24px', backgroundColor: 'rgba(231, 76, 60, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger-color)', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '800' }}>
            <HeartPulse size={24} /> {t('firstAidGuide') || 'Life-Saving Procedures'}
          </h4>
          <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertCircle size={14} /> <strong>{t('firstAidWarn') || 'Call emergency hotlines FIRST before performing first aid.'}</strong>
          </p>
        </div>

        {/* Custom Tab Bar */}
        <div className="scroll-hide" style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', backgroundColor: '#f8fafc', padding: '0 10px' }}>
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)} 
              style={{ 
                background: 'none', border: 'none', padding: '16px 20px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px', fontWeight: '700', borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                color: activeTab === tab.id ? tab.color : 'var(--text-light)', transition: 'all 0.2s ease'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          
          {activeTab === 'cpr' && (
            <div>
              <h4 style={{ color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>{t('cprTitle') || 'CPR (For Unconscious & Not Breathing)'}</h4>
              <StepBox number="1" text={t('cpr1') || 'Check the scene for safety, then check the person for responsiveness.'} />
              <StepBox number="2" text={t('cpr2') || 'Call for help immediately (Jamindan MDRRMO / Police).'} />
              <StepBox number="3" text={t('cpr3') || 'Open the airway. Tilt head back and lift chin.'} />
              <StepBox number="4" text={t('cpr4') || 'Check for breathing. If not breathing normally, begin CPR.'} />
              <StepBox number="5" text={t('cpr5') || 'Push hard and fast in the center of the chest (100-120 compressions per minute).'} />
            </div>
          )}

          {activeTab === 'choking' && (
            <div>
              <h4 style={{ color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>{t('chokingTitle') || 'Heimlich Maneuver (Choking)'}</h4>
              <StepBox number="1" text={t('choking1') || 'Ask "Are you choking?" If they cannot cough, speak, or breathe, act immediately.'} />
              <StepBox number="2" text={t('choking2') || 'Stand behind them and wrap your arms around their waist.'} />
              <StepBox number="3" text={t('choking3') || 'Make a fist with one hand and place the thumb side just above their navel.'} />
              <StepBox number="4" text={t('choking4') || 'Grasp your fist with your other hand.'} />
              <StepBox number="5" text={t('choking5') || 'Give quick, upward thrusts until the object is dislodged.'} />
            </div>
          )}

          {activeTab === 'bleeding' && (
            <div>
              <h4 style={{ color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>{t('bleedingTitle') || 'Severe Bleeding'}</h4>
              <StepBox number="1" text={t('bleeding1') || 'Apply direct pressure on the wound with a clean cloth or sterile dressing.'} />
              <StepBox number="2" text={t('bleeding2') || 'Maintain pressure for at least 5-10 minutes without peeking.'} />
              <StepBox number="3" text={t('bleeding3') || 'If blood soaks through, do not remove the cloth. Add more layers on top.'} />
              <StepBox number="4" text={t('bleeding4') || 'Keep the injured person lying down and elevate the bleeding part if possible.'} />
            </div>
          )}

          {activeTab === 'burns' && (
            <div>
              <h4 style={{ color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>{t('burnsTitle') || 'Major Burns'}</h4>
              <StepBox number="1" text={t('burns1') || 'Stop the burning process safely (remove from heat source).'} />
              <StepBox number="2" text={t('burns2') || 'Cool the burn immediately with cool (not ice cold) running water for 10-20 minutes.'} />
              <StepBox number="3" text={t('burns3') || 'Remove tight items (rings, belts) before swelling occurs.'} />
              <StepBox number="4" text={t('burns4') || 'Cover the burn loosely with a sterile, non-stick dressing or clean cloth.'} />
              <StepBox number="5" text={t('burns5') || 'DO NOT apply butter, ointments, or pop blisters.'} />
            </div>
          )}

          {activeTab === 'snake' && (
            <div>
              <h4 style={{ color: 'var(--text-main)', margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>{t('snakeTitle') || 'Snake Bites'}</h4>
              <StepBox number="1" text={t('snake1') || 'Keep the person calm and still. Movement spreads venom faster.'} />
              <StepBox number="2" text={t('snake2') || 'Call emergency hotlines immediately.'} />
              <StepBox number="3" text={t('snake3') || 'Keep the bitten limb below the level of the heart.'} />
              <StepBox number="4" text={t('snake4') || 'Remove rings and tight clothing near the bite before swelling starts.'} />
              <StepBox number="5" text={t('snake5') || 'DO NOT cut the wound or attempt to suck out the venom.'} />
              <StepBox number="6" text={t('snake6') || 'DO NOT apply a tourniquet or ice.'} />
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
};

export default EmergencyTips;
