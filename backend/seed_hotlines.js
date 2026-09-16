// seed_hotlines.js - Run once to replace old demo hotlines with actual Jamindan data
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = process.env.DB_URL || {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jamindan_emergency',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

const JAMINDAN_HOTLINES = [
  // ── Municipal Responders ──────────────────────────────────────────
  { agency_name: 'Jamindan Response Unit (MDRRMO)', contact_number: '09485224345 / 09088773092 / (036) 651-8227', barangay: null },
  { agency_name: 'Jamindan Municipal Police Station', contact_number: '09086415589 / (036) 651-8218', barangay: null },
  { agency_name: 'Municipal Health Office', contact_number: '09304562011 / (036) 651-8204', barangay: null },
  { agency_name: 'Jamindan Bureau of Fire Protection (BFP)', contact_number: '09106964585 / (036) 651-8228', barangay: null },
  { agency_name: 'CAPELCO Jamindan-Mambusao', contact_number: '09630438339 / (036) 620-4930', barangay: null },
  // ── Hospitals / Medical ───────────────────────────────────────────
  { agency_name: 'Mambusao District Hospital', contact_number: '09688796022 / (036) 647-0220', barangay: null },
  { agency_name: 'SGMRMH (DAO) Hospital', contact_number: '09171195972 / (036) 658-0037', barangay: null },
  { agency_name: 'Roxas Memorial Provincial Hospital', contact_number: '(036) 621-0823 / (036) 621-0030', barangay: null },
  { agency_name: 'Capiz Doctors Hospital', contact_number: '(036) 621-5675', barangay: null },
  { agency_name: 'St. Anthony Hospital', contact_number: '(036) 621-0431', barangay: null },
  { agency_name: 'Capiz Emmanuel Hospital', contact_number: '(036) 621-0443', barangay: null },
  { agency_name: 'Health Centrum Hospital', contact_number: '(033) 621-09088', barangay: null },
  { agency_name: 'Western Visayas Medical Center', contact_number: '09695106129 / (033) 339-7070', barangay: null },
];

async function seed() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('✅ Connected to MySQL database.');

  // Clear old demo hotlines
  const [del] = await connection.execute('DELETE FROM hotlines');
  console.log(`🗑️  Deleted ${del.affectedRows} old hotlines.`);

  // Insert actual Jamindan hotlines
  for (const h of JAMINDAN_HOTLINES) {
    await connection.execute(
      'INSERT INTO hotlines (agency_name, contact_number, barangay) VALUES (?, ?, ?)',
      [h.agency_name, h.contact_number, h.barangay]
    );
  }

  const [rows] = await connection.execute('SELECT COUNT(*) as c FROM hotlines');
  console.log(`✅ Successfully seeded ${rows[0].c} actual Jamindan hotlines.`);
  await connection.end();
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});
