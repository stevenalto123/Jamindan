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
        <div className="hotline-numbers">HOTLINES</div>
        <div style={{ fontSize: '12px', opacity: 0.95, textAlign: 'right', whiteSpace: 'nowrap' }}>
          <strong>MDRRMO:</strong> 0948-522-4345 <br />
          <strong>BFP (Fire):</strong> 0910-696-4585 <br />
          <strong>PNP (Police):</strong> 0908-641-5589
        </div>
      </div>
    </div>
  );
};

export default HotlineBanner;
