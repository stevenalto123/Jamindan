import React from 'react';
import { BookOpen, AlertTriangle } from 'lucide-react';

const EmergencyTips = () => {
  return (
    <div className="content-body" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-main)' }}>Emergency Tips</h2>
        <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>Stay prepared. Essential safety protocols from LGU Jamindan</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c0392b' }}>
            <AlertTriangle size={20} />
            Flooding Safety Procedures
          </h3>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-light)' }}>
            <li>Avoid walking or driving through floodwaters. Just 6 inches of moving water can knock you down.</li>
            <li>If floodwaters rise around your car, abandon the car immediately and move to higher ground.</li>
            <li>Disconnect electrical appliances and turn off gas lines if flooding is imminent in your household.</li>
            <li>Keep emergency bags ready containing clean water, medicine, dry food, and powerbanks.</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d35400' }}>
            <AlertTriangle size={20} />
            Earthquake: Duck, Cover, and Hold
          </h3>
          <ul style={{ paddingLeft: '20px', marginTop: '10px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text-light)' }}>
            <li><strong>DUCK</strong> down onto your hands and knees.</li>
            <li><strong>COVER</strong> your head and neck under a sturdy table or desk.</li>
            <li><strong>HOLD ON</strong> to your shelter until the shaking stops.</li>
            <li>Stay away from glass windows, heavy light fixtures, and brick walls.</li>
          </ul>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7f8c8d' }}>
            <BookOpen size={20} />
            Emergency Kit Essentials
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '8px' }}>
            Maintain a go-bag containing: Bottled water (3-day supply), canned goods, first-aid kit, flashlight, batteries, whistle (to signal for help), local barangay rescue contacts, and matchsticks.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyTips;
