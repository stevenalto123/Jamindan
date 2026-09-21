const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/EvacuationCenters.jsx', 'utf8');
c = c.replace(
  '<div className=\"content-body\" style={{ display: \'flex\', flexDirection: \'column\', gap: \'20px\', paddingBottom: \'60px\' }}>',
  '<div className=\"content-body\" style={{ paddingBottom: \'60px\' }}>\n      <div style={{ padding: \'16px\', display: \'flex\', flexDirection: \'column\', gap: \'20px\' }}>'
);
c = c.replace(
  'top: \\'10px\\',',
  'top: isFullScreen ? \\'calc(env(safe-area-inset-top, 0px) + 20px)\\' : \\'10px\\','
);
c = c.replace(
  '      </div>\n    </div>\n  );\n};\n\nexport default EvacuationCenters;',
  '      </div>\n    </div>\n  </div>\n  );\n};\n\nexport default EvacuationCenters;'
);
fs.writeFileSync('frontend/src/pages/EvacuationCenters.jsx', c);
