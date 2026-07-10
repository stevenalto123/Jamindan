import React from 'react';
import { PhoneCall } from 'lucide-react';

const HotlineBanner = () => {
  return (
    <div className="hotline-banner">
      <div className="hotline-info">
        <PhoneCall size={28} className="hotline-phone-icon" />
        <div>
          <h3 className="hotline-title">JAMINDAN EMERGENCY HOTLINES</h3>
          <p className="hotline-text">Immediate danger to life or property? Contact these numbers right away.</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <div className="hotline-numbers">911</div>
        <div style={{ fontSize: '12px', opacity: 0.95, textAlign: 'right' }}>
          MDRRMO: 0917-807-6799 <br />
          BFP (Fire): 0930-077-8328 <br />
          PNP (Police): 0998-598-6161
        </div>
      </div>
    </div>
  );
};

export default HotlineBanner;
