import React, { useState } from 'react';
import { BookOpen, AlertTriangle, HeartPulse, PlusCircle, AlertCircle, Droplet, Flame } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const EmergencyTips = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('cpr');
  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0392b' }}>
            <AlertTriangle size={20} />
            {t('floodSafety')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-light)' }}>
            <li>{t('floodTip1')}</li>
            <li>{t('floodTip2')}</li>
            <li>{t('floodTip3')}</li>
            <li>{t('floodTip4')}</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d35400' }}>
            <AlertTriangle size={20} />
            {t('earthquakeSafety')}
          </h3>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-light)' }}>
            <li dangerouslySetInnerHTML={{ __html: t('eqTip1').replace('DUCK', '<strong>DUCK</strong>').replace('DUKO', '<strong>DUKO</strong>') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('eqTip2').replace('COVER', '<strong>COVER</strong>').replace('PANAGO', '<strong>PANAGO</strong>') }}></li>
            <li dangerouslySetInnerHTML={{ __html: t('eqTip3').replace('HOLD ON', '<strong>HOLD ON</strong>').replace('KAPOT', '<strong>KAPOT</strong>') }}></li>
            <li>{t('eqTip4')}</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7f8c8d' }}>
            <BookOpen size={20} />
            {t('kitEssentials')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '8px' }}>
            {t('kitDesc')}
          </p>
        </div>

        {/* First Aid Guide Section */}
        <div className="card" style={{ borderTop: '5px solid var(--danger-color)' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger-color)' }}>
            <HeartPulse size={20} />
            {t('firstAidGuide')}
          </h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '25px', fontSize: '13px', marginTop: '8px' }}>
            {t('firstAidDesc')} <strong>{t('firstAidWarn')}</strong>
          </p>

          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <button onClick={() => setActiveTab('cpr')} className={`btn ${activeTab === 'cpr' ? 'btn-primary' : 'btn-outline'}`} style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}>
              <HeartPulse size={14} /> CPR / Not Breathing
            </button>
            <button onClick={() => setActiveTab('choking')} className={`btn ${activeTab === 'choking' ? 'btn-primary' : 'btn-outline'}`} style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}>
              <AlertCircle size={14} /> Choking
            </button>
            <button onClick={() => setActiveTab('bleeding')} className={`btn ${activeTab === 'bleeding' ? 'btn-primary' : 'btn-outline'}`} style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}>
              <Droplet size={14} /> Severe Bleeding
            </button>
            <button onClick={() => setActiveTab('burns')} className={`btn ${activeTab === 'burns' ? 'btn-primary' : 'btn-outline'}`} style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}>
              <Flame size={14} /> Burns
            </button>
            <button onClick={() => setActiveTab('snake')} className={`btn ${activeTab === 'snake' ? 'btn-primary' : 'btn-outline'}`} style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}>
              <PlusCircle size={14} /> Snake Bite
            </button>
          </div>

          <div style={{ padding: '0 5px' }}>
            {activeTab === 'cpr' && (
              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>{t('cprTitle')}</h4>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-light)' }}>
                  <li>{t('cpr1')}</li>
                  <li>{t('cpr2')}</li>
                  <li>{t('cpr3')}</li>
                  <li>{t('cpr4')}</li>
                  <li>{t('cpr5')}</li>
                </ol>
              </div>
            )}
            {activeTab === 'choking' && (
              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>{t('chokingTitle')}</h4>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-light)' }}>
                  <li>{t('choking1')}</li>
                  <li>{t('choking2')}</li>
                  <li>{t('choking3')}</li>
                  <li>{t('choking4')}</li>
                  <li>{t('choking5')}</li>
                </ol>
              </div>
            )}
            {activeTab === 'bleeding' && (
              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>{t('bleedingTitle')}</h4>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-light)' }}>
                  <li>{t('bleeding1')}</li>
                  <li>{t('bleeding2')}</li>
                  <li>{t('bleeding3')}</li>
                  <li>{t('bleeding4')}</li>
                </ol>
              </div>
            )}
            {activeTab === 'burns' && (
              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>{t('burnsTitle')}</h4>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-light)' }}>
                  <li>{t('burns1')}</li>
                  <li>{t('burns2')}</li>
                  <li>{t('burns3')}</li>
                  <li>{t('burns4')}</li>
                  <li>{t('burns5')}</li>
                </ol>
              </div>
            )}
            {activeTab === 'snake' && (
              <div>
                <h4 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>{t('snakeTitle')}</h4>
                <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-light)' }}>
                  <li>{t('snake1')}</li>
                  <li>{t('snake2')}</li>
                  <li>{t('snake3')}</li>
                  <li>{t('snake4')}</li>
                  <li>{t('snake5')}</li>
                  <li>{t('snake6')}</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default EmergencyTips;
