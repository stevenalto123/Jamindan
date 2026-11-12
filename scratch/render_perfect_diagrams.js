const puppeteer = require('C:/Users/huawei/Documents/jamindan-emergency-response/scratch/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'diagram_images');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// --- HTML TEMPLATE FOR FIGURE 6: CLIENT-SERVER INTERACTION DIAGRAM ---
const HTML_FIG6 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Segoe UI", Arial, sans-serif; }
    body { background: #FFFFFF; padding: 25px; display: flex; justify-content: center; }
    .canvas { width: 1500px; background: #FFFFFF; border: 2px solid #CBD5E1; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .diag-title { text-align: center; font-size: 26px; font-weight: 800; color: #1E3A8A; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 3px solid #1E3A8A; padding-bottom: 12px; }
    
    .tier-box { border: 2.5px solid #3B82F6; border-radius: 10px; background: #F8FAFC; padding: 20px; margin-bottom: 20px; position: relative; }
    .tier-header { position: absolute; top: -14px; left: 24px; background: #1E3A8A; color: #FFFFFF; font-size: 16px; font-weight: 700; padding: 3px 16px; border-radius: 6px; letter-spacing: 0.5px; }
    
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 10px; }
    .grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 10px; }
    .grid-6 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 15px; }
    
    .card { background: #FFFFFF; border: 2px solid #93C5FD; border-radius: 8px; padding: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .card-title { font-size: 19px; font-weight: 700; color: #1E3A8A; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 6px; }
    .card-desc { font-size: 14px; color: #475569; line-height: 1.45; }
    .card-desc ul { margin-left: 18px; margin-top: 6px; }
    .card-desc li { margin-bottom: 4px; }
    
    .connector-row { display: flex; justify-content: space-around; align-items: center; padding: 8px 0; font-size: 13px; font-weight: 700; color: #2563EB; }
    .arrow-badge { background: #EFF6FF; border: 1.5px solid #3B82F6; border-radius: 20px; padding: 6px 18px; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 4px rgba(37,99,235,0.1); }
    .arrow-down { font-size: 16px; color: #1D4ED8; }
    
    .db-cylinder { background: #EFF6FF; border: 2.5px solid #2563EB; border-radius: 10px; padding: 16px; text-align: center; margin-bottom: 15px; }
    .db-title { font-size: 21px; font-weight: 800; color: #1E3A8A; }
    .db-subtitle { font-size: 14px; color: #3B82F6; font-weight: 600; margin-top: 3px; }
    
    .table-chip { background: #FFFFFF; border: 1.5px solid #60A5FA; border-radius: 6px; padding: 10px 14px; text-align: left; }
    .table-chip-title { font-size: 15px; font-weight: 700; color: #1E40AF; }
    .table-chip-desc { font-size: 12px; color: #64748B; margin-top: 3px; }
    
    .cdn-card { background: #FFFBEB; border: 2px solid #F59E0B; border-radius: 8px; padding: 18px; }
    .cdn-title { font-size: 18px; font-weight: 700; color: #B45309; margin-bottom: 6px; border-bottom: 1.5px solid #FDE68A; padding-bottom: 6px; }
    .cdn-desc { font-size: 13px; color: #78350F; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="diag-title">Figure 6. Client-Server Interaction Diagram of the Emergency Response Platform</div>

    <!-- TIER 1: PRESENTATION LAYER -->
    <div class="tier-box">
      <div class="tier-header">1. PRESENTATION LAYER (USER & CLIENT ACCESS)</div>
      <div class="grid-3">
        <div class="card">
          <div class="card-title">📱 Resident Mobile Client</div>
          <div class="card-desc">
            <strong>Progressive Web App (React 18 / Tailwind)</strong>
            <ul>
              <li>3-Second SOS Panic Trigger (Hardware GPS Lock)</li>
              <li>2-Step Incident Reporting Wizard (Dynamic JSON)</li>
              <li>Offline Storage (IndexedDB) with SMS Fallback</li>
              <li>Evacuation Shelters & Turn-by-Turn Route Bar</li>
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📟 Field Responder Tablet</div>
          <div class="card-desc">
            <strong>Mobile GIS Console (BFP / PNP / RHU)</strong>
            <ul>
              <li>Real-time Emergency Dispatch Notification</li>
              <li>Live Vehicle GPS Telemetry Streaming</li>
              <li>Interactive Routing & Scene Navigation</li>
              <li>On-scene Incident Resolution & Status Reports</li>
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-title">💻 MDRRMO Command Center</div>
          <div class="card-desc">
            <strong>Desktop Workstation (Dual-Monitor GIS)</strong>
            <ul>
              <li>Interactive Leaflet GIS Live Command Map</li>
              <li>Incoming Emergency Audio Siren Alarm System</li>
              <li>False Alarm Verification & Incident Triage</li>
              <li>PDF & CSV Official Municipal Compliance Logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR 1 -->
    <div class="connector-row">
      <div class="arrow-badge"><span class="arrow-down">⬇</span> HTTPS REST API (JSON Web Token Authentication & Data Payloads)</div>
      <div class="arrow-badge"><span class="arrow-down">⬇</span> Full-Duplex WebSockets (Socket.IO Sub-300ms Live Siren & GPS Beacons)</div>
    </div>

    <!-- TIER 2: APPLICATION LAYER -->
    <div class="tier-box" style="border-color: #8B5CF6; background: #FAF5FF;">
      <div class="tier-header" style="background: #6D28D9;">2. APPLICATION & EVENT LAYER (NODE.JS & REAL-TIME EVENT BUS)</div>
      <div class="grid-2">
        <div class="card" style="border-color: #C4B5FD;">
          <div class="card-title" style="color: #6D28D9;">⚙️ Node.js (v20 LTS) & Express.js Application Server</div>
          <div class="card-desc">
            <ul>
              <li><strong>Authentication & Security:</strong> JWT verification, bcrypt password hashing, and Role-Based Access Control (RBAC).</li>
              <li><strong>Incident Triage Engine:</strong> Automated deduplication guard (prevents duplicate spam within 5 mins).</li>
              <li><strong>Geospatial Processing:</strong> Haversine spherical distance calculation for nearest evacuation centers.</li>
              <li><strong>Real-Time Gateway (Socket.IO):</strong> Persistent daemon streaming sirens, vehicle coordinates, and status changes.</li>
              <li><strong>Offline SMS Hook:</strong> Pre-populated GSM SMS gateway integration (09485224345) for upland connectivity dead zones.</li>
            </ul>
          </div>
        </div>
        <div class="cdn-card">
          <div class="cdn-title">☁️ Cloudinary Media CDN</div>
          <div class="cdn-desc">
            <strong>High-Availability Media Storage:</strong>
            <ul>
              <li>Resident Photographic Evidence Uploads</li>
              <li>Citizen Government ID Verification Photos</li>
              <li>Automated Image Compression & CDN Delivery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- FLOW CONNECTOR 2 -->
    <div class="connector-row">
      <div class="arrow-badge" style="border-color: #059669; color: #059669;"><span class="arrow-down" style="color: #059669;">⬇</span> ACID Relational SQL Transactions & Prepared Statements</div>
      <div class="arrow-badge" style="border-color: #059669; color: #059669;"><span class="arrow-down" style="color: #059669;">⬇</span> JSON Document Attribute Mapping & Immutable Audit Logging</div>
    </div>

    <!-- TIER 3: DATA LAYER -->
    <div class="tier-box" style="border-color: #059669; background: #ECFDF5;">
      <div class="tier-header" style="background: #047857;">3. DATA & STORAGE LAYER (MYSQL 8.0 CLUSTER & SCHEMAS)</div>
      
      <div class="db-cylinder" style="background: #FFFFFF; border-color: #10B981;">
        <div class="db-title" style="color: #065F46;">🗄️ Managed MySQL 8.0 Relational Database Cluster</div>
        <div class="db-subtitle">ACID-Compliant Relational Schemas + JSON Dynamic Document Attributes</div>
      </div>

      <div class="grid-6">
        <div class="table-chip">
          <div class="table-chip-title">👥 users</div>
          <div class="table-chip-desc">Citizens, Responders, Dispatchers & Admin RBAC</div>
        </div>
        <div class="table-chip">
          <div class="table-chip-title">🚨 incidents</div>
          <div class="table-chip-desc">GPS coordinates, category, priority & dynamic JSON</div>
        </div>
        <div class="table-chip">
          <div class="table-chip-title">⏱️ incident_status_history</div>
          <div class="table-chip-desc">Chronological lifecycle audits from report to resolution</div>
        </div>
        <div class="table-chip">
          <div class="table-chip-title">🚑 responders & vehicles</div>
          <div class="table-chip-desc">MDRRMO, BFP, PNP, RHU fleet & live GPS coordinates</div>
        </div>
        <div class="table-chip">
          <div class="table-chip-title">🏛️ evacuation_centers</div>
          <div class="table-chip-desc">Shelter capacities, occupancy rates & facilities JSON</div>
        </div>
        <div class="table-chip">
          <div class="table-chip-title">📜 safety_checkins & audit_logs</div>
          <div class="table-chip-desc">Citizen welfare statuses & security audit trails</div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
`;

// --- HTML TEMPLATE FOR FIGURE 7: SYSTEM ARCHITECTURE DIAGRAM ---
const HTML_FIG7 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Segoe UI", Arial, sans-serif; }
    body { background: #FFFFFF; padding: 25px; display: flex; justify-content: center; }
    .canvas { width: 1500px; background: #FFFFFF; border: 2px solid #CBD5E1; border-radius: 12px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .diag-title { text-align: center; font-size: 26px; font-weight: 800; color: #1E3A8A; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 3px solid #1E3A8A; padding-bottom: 12px; }

    .arch-domain { border: 2.5px solid #2563EB; border-radius: 10px; background: #F8FAFC; padding: 22px; margin-bottom: 22px; position: relative; }
    .domain-badge { position: absolute; top: -14px; left: 24px; background: #1E3A8A; color: #FFFFFF; font-size: 16px; font-weight: 700; padding: 3px 18px; border-radius: 6px; }

    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 10px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
    .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-top: 10px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 10px; }

    .box { background: #FFFFFF; border: 2px solid #CBD5E1; border-radius: 8px; padding: 16px; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
    .box-title { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; border-bottom: 1.5px solid #F1F5F9; padding-bottom: 4px; }
    .box-desc { font-size: 13.5px; color: #475569; line-height: 1.45; }

    .arrow-banner { background: #EFF6FF; border: 1.5px dashed #3B82F6; border-radius: 8px; padding: 8px 16px; text-align: center; font-size: 14px; font-weight: 700; color: #1E40AF; margin: 12px 0; }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="diag-title">Figure 7. System Architecture Diagram</div>

    <!-- DOMAIN 1: MUNICIPAL FIELD ENVIRONMENT -->
    <div class="arch-domain" style="border-color: #0284C7; background: #F0F9FF;">
      <div class="domain-badge" style="background: #0369A1;">1. MUNICIPAL FIELD ENVIRONMENT (JAMINDAN, CAPIZ)</div>
      <div class="grid-3">
        <div class="box" style="border-color: #7DD3FC;">
          <div class="box-title">🛰️ Satellite GPS Constellation</div>
          <div class="box-desc">
            Direct hardware radio coordinate locking transmitting precise latitude & longitude (WGS84) to resident smartphones and responder tablets without cellular dependencies.
          </div>
        </div>
        <div class="box" style="border-color: #7DD3FC;">
          <div class="box-title">📱 Jamindan Citizens & Eyewitnesses</div>
          <div class="box-desc">
            Operates Progressive Web App: 3-second SOS panic beacon, categorized incident photo reporting wizard, family welfare check-ins, and nearest shelter navigation.
          </div>
        </div>
        <div class="box" style="border-color: #7DD3FC;">
          <div class="box-title">🚒 Multi-Agency Field Responders</div>
          <div class="box-desc">
            MDRRMO Rescue Units, Bureau of Fire Protection (BFP), Philippine National Police (PNP), and Rural Health Unit (RHU) ambulances receiving real-time dispatches.
          </div>
        </div>
      </div>
    </div>

    <!-- DOMAIN 2: NETWORK GATEWAY -->
    <div class="arch-domain" style="border-color: #D97706; background: #FFFBEB;">
      <div class="domain-badge" style="background: #B45309;">2. TELECOMMUNICATIONS & NETWORK GATEWAY</div>
      <div class="grid-2">
        <div class="box" style="border-color: #FCD34D;">
          <div class="box-title">📶 Primary High-Speed Path: Cellular 4G/5G & Local Wi-Fi Hotspots</div>
          <div class="box-desc">
            Handles full-duplex WebSocket real-time event streaming, RESTful JSON payloads, and Cloudinary photographic evidence uploads with sub-300ms network transit times.
          </div>
        </div>
        <div class="box" style="border-color: #FCD34D;">
          <div class="box-title">📨 Secondary Lifeline: Native GSM SMS Fallback (09485224345)</div>
          <div class="box-desc">
            Pre-populated SMS distress gateway automatically triggered by IndexedDB when data connectivity drops in Jamindan's mountainous upland barangays during typhoons.
          </div>
        </div>
      </div>
    </div>

    <!-- DOMAIN 3: CLOUD INFRASTRUCTURE & SECURITY -->
    <div class="arch-domain" style="border-color: #7C3AED; background: #FAF5FF;">
      <div class="domain-badge" style="background: #6D28D9;">3. CLOUD INFRASTRUCTURE, BACKEND EVENT BUS & STORAGE</div>
      <div class="grid-5">
        <div class="box" style="border-color: #C4B5FD;">
          <div class="box-title">🛡️ Cloudflare WAF</div>
          <div class="box-desc">Enterprise SSL/TLS encryption, automated DDoS mitigation, and edge API protection.</div>
        </div>
        <div class="box" style="border-color: #C4B5FD;">
          <div class="box-title">⚡ Vercel Edge CDN</div>
          <div class="box-desc">Low-latency global hosting for React 18, Vite static bundles, and PWA Service Workers.</div>
        </div>
        <div class="box" style="border-color: #C4B5FD;">
          <div class="box-title">⚙️ Render App Server</div>
          <div class="box-desc">Node.js LTS, Express REST API, Haversine routing engine, and persistent Socket.IO daemon.</div>
        </div>
        <div class="box" style="border-color: #C4B5FD;">
          <div class="box-title">🗄️ MySQL 8.0 Cluster</div>
          <div class="box-desc">Aiven Managed Cloud Database: ACID relational integrity + dynamic JSON emergency attributes.</div>
        </div>
        <div class="box" style="border-color: #C4B5FD;">
          <div class="box-title">☁️ Cloudinary CDN</div>
          <div class="box-desc">Encrypted cloud photo evidence optimization, citizen ID badges, and asset delivery.</div>
        </div>
      </div>
    </div>

    <!-- DOMAIN 4: MDRRMO COMMAND POST -->
    <div class="arch-domain" style="border-color: #059669; background: #ECFDF5; margin-bottom: 0;">
      <div class="domain-badge" style="background: #047857;">4. MDRRMO EMERGENCY OPERATIONS CENTER (JAMINDAN COMMAND POST)</div>
      <div class="grid-4">
        <div class="box" style="border-color: #6EE7B7;">
          <div class="box-title">🌐 Municipal Fiber Router</div>
          <div class="box-desc">Dedicated high-speed municipal network gateway connecting command workstations to cloud WebSocket bus.</div>
        </div>
        <div class="box" style="border-color: #6EE7B7;">
          <div class="box-title">🖥️ Dispatcher Workstation</div>
          <div class="box-desc">Dual-monitor console rendering Leaflet GIS live tracking map, triage verification, and dispatch controls.</div>
        </div>
        <div class="box" style="border-color: #6EE7B7;">
          <div class="box-title">🚨 Audio Warning Siren</div>
          <div class="box-desc">External sound system powered by browser Web Audio API triggering audible sirens upon incoming verified distress alarms.</div>
        </div>
        <div class="box" style="border-color: #6EE7B7;">
          <div class="box-title">🖨️ Document Printer</div>
          <div class="box-desc">Generates filtered monthly incident reports, executive disaster summaries, and CSV data exports for LGU compliance.</div>
        </div>
      </div>
    </div>

  </div>
</body>
</html>
`;

// --- HTML TEMPLATE FOR FIGURE 8: ENTITY-RELATIONSHIP DIAGRAM (3-COLUMN ULTRA-READABLE ERD) ---
const HTML_FIG8 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Segoe UI", Arial, sans-serif; }
    body { background: #FFFFFF; padding: 25px; display: flex; justify-content: center; }
    .canvas { width: 1650px; background: #FFFFFF; border: 2.5px solid #94A3B8; border-radius: 12px; padding: 30px; box-shadow: 0 4px 25px rgba(0,0,0,0.08); }
    .diag-title { text-align: center; font-size: 28px; font-weight: 800; color: #1E3A8A; margin-bottom: 25px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 3.5px solid #1E3A8A; padding-bottom: 12px; }

    .erd-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; }
    .erd-column { display: flex; flex-direction: column; gap: 22px; }

    .entity-card { background: #FFFFFF; border: 2px solid #2563EB; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 10px rgba(0,0,0,0.05); }
    .entity-header { background: #1E3A8A; color: #FFFFFF; padding: 10px 16px; font-size: 19px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; letter-spacing: 0.5px; }
    .entity-header-desc { font-size: 12px; font-weight: 500; color: #93C5FD; }

    .entity-table { width: 100%; border-collapse: collapse; font-size: 14.5px; }
    .entity-table tr:nth-child(even) { background-color: #F8FAFC; }
    .entity-table td { padding: 6px 12px; border-bottom: 1px solid #E2E8F0; }
    .col-attr { font-weight: 600; color: #0F172A; }
    .col-type { font-family: "Consolas", monospace; font-size: 13.5px; color: #475569; text-align: right; }

    .pk-badge { background: #FEF08A; color: #854D0E; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #EAB308; margin-right: 6px; }
    .fk-badge { background: #BAE6FD; color: #0369A1; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #0284C7; margin-right: 6px; }
    .json-badge { background: #FDE047; color: #713F12; font-weight: 800; font-size: 11px; padding: 2px 6px; border-radius: 4px; border: 1px solid #CA8A04; }

    .rel-banner { background: #EFF6FF; border: 1.5px solid #93C5FD; border-radius: 6px; padding: 12px 16px; margin-top: 24px; font-size: 14px; color: #1E40AF; line-height: 1.5; }
    .rel-title { font-weight: 800; font-size: 15px; margin-bottom: 4px; color: #1E3A8A; display: flex; align-items: center; gap: 6px; }
  </style>
</head>
<body>
  <div class="canvas">
    <div class="diag-title">Figure 8. Entity-Relationship Diagram of the Emergency Response Community Platform</div>

    <div class="erd-grid">

      <!-- COLUMN 1: USER, HOUSEHOLD & SECURITY LOGS -->
      <div class="erd-column">
        
        <!-- USERS -->
        <div class="entity-card">
          <div class="entity-header">
            <span>👤 USERS</span>
            <span class="entity-header-desc">Core Identity Entity</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>user_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr">full_name</td><td class="col-type">VARCHAR(100)</td></tr>
            <tr><td class="col-attr">email</td><td class="col-type">VARCHAR(100) UNIQUE</td></tr>
            <tr><td class="col-attr">phone_number</td><td class="col-type">VARCHAR(20)</td></tr>
            <tr><td class="col-attr">password_hash</td><td class="col-type">VARCHAR(255)</td></tr>
            <tr><td class="col-attr">role</td><td class="col-type">ENUM('Resident','Responder','Admin')</td></tr>
            <tr><td class="col-attr">barangay</td><td class="col-type">VARCHAR(50)</td></tr>
            <tr><td class="col-attr">is_verified</td><td class="col-type">BOOLEAN DEFAULT FALSE</td></tr>
            <tr><td class="col-attr">id_photo_url</td><td class="col-type">VARCHAR(255)</td></tr>
            <tr><td class="col-attr">created_at</td><td class="col-type">DATETIME</td></tr>
          </table>
        </div>

        <!-- HOUSEHOLD_MEMBERS -->
        <div class="entity-card">
          <div class="entity-header" style="background: #0284C7;">
            <span>👨‍👩‍👧 HOUSEHOLD_MEMBERS</span>
            <span class="entity-header-desc">Vulnerability Index</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>member_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>household_head_id</td><td class="col-type">INT (users.user_id)</td></tr>
            <tr><td class="col-attr">full_name</td><td class="col-type">VARCHAR(100)</td></tr>
            <tr><td class="col-attr">relationship</td><td class="col-type">VARCHAR(50)</td></tr>
            <tr><td class="col-attr">vulnerability_type</td><td class="col-type">ENUM('Senior','PWD','Infant','Pregnant')</td></tr>
            <tr><td class="col-attr">birthdate</td><td class="col-type">DATE</td></tr>
          </table>
        </div>

        <!-- NOTIFICATIONS -->
        <div class="entity-card">
          <div class="entity-header" style="background: #0284C7;">
            <span>🔔 NOTIFICATIONS</span>
            <span class="entity-header-desc">Alert Messaging</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>notification_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>recipient_id</td><td class="col-type">INT (users.user_id)</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>incident_id</td><td class="col-type">INT NULL (incidents)</td></tr>
            <tr><td class="col-attr">title</td><td class="col-type">VARCHAR(150)</td></tr>
            <tr><td class="col-attr">message</td><td class="col-type">TEXT</td></tr>
            <tr><td class="col-attr">is_read</td><td class="col-type">BOOLEAN DEFAULT FALSE</td></tr>
            <tr><td class="col-attr">created_at</td><td class="col-type">DATETIME</td></tr>
          </table>
        </div>

        <!-- AUDIT_LOGS -->
        <div class="entity-card">
          <div class="entity-header" style="background: #475569;">
            <span>📜 AUDIT_LOGS</span>
            <span class="entity-header-desc">Compliance Trails</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>log_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>user_id</td><td class="col-type">INT (users.user_id)</td></tr>
            <tr><td class="col-attr">action_taken</td><td class="col-type">VARCHAR(100)</td></tr>
            <tr><td class="col-attr">target_module</td><td class="col-type">VARCHAR(50)</td></tr>
            <tr><td class="col-attr">ip_address</td><td class="col-type">VARCHAR(45)</td></tr>
            <tr><td class="col-attr">details</td><td class="col-type">TEXT</td></tr>
            <tr><td class="col-attr">timestamp</td><td class="col-type">DATETIME</td></tr>
          </table>
        </div>

      </div>

      <!-- COLUMN 2: INCIDENT REPORTING & LIFECYCLES -->
      <div class="erd-column">
        
        <!-- INCIDENTS -->
        <div class="entity-card" style="border-color: #DC2626;">
          <div class="entity-header" style="background: #B91C1C;">
            <span>🚨 INCIDENTS</span>
            <span class="entity-header-desc">Core Distress Entity</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>incident_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>caller_id</td><td class="col-type">INT (users.user_id)</td></tr>
            <tr><td class="col-attr">category</td><td class="col-type">ENUM('Flood','Fire','Medical','Accident','Landslide')</td></tr>
            <tr><td class="col-attr">status</td><td class="col-type">ENUM('Pending','Dispatched','On Scene','Resolved')</td></tr>
            <tr><td class="col-attr">priority</td><td class="col-type">ENUM('High','Medium','Low')</td></tr>
            <tr><td class="col-attr">latitude</td><td class="col-type">DECIMAL(10, 8)</td></tr>
            <tr><td class="col-attr">longitude</td><td class="col-type">DECIMAL(11, 8)</td></tr>
            <tr><td class="col-attr">address_landmark</td><td class="col-type">VARCHAR(255)</td></tr>
            <tr><td class="col-attr">description</td><td class="col-type">TEXT</td></tr>
            <tr><td class="col-attr">photo_url</td><td class="col-type">VARCHAR(255)</td></tr>
            <tr><td class="col-attr"><span class="json-badge">JSON</span>dynamic_details</td><td class="col-type">JSON (Water level, trapped victims)</td></tr>
            <tr><td class="col-attr">reported_at</td><td class="col-type">DATETIME</td></tr>
          </table>
        </div>

        <!-- INCIDENT_STATUS_HISTORY -->
        <div class="entity-card" style="border-color: #D97706;">
          <div class="entity-header" style="background: #B45309;">
            <span>⏱️ INCIDENT_STATUS_HISTORY</span>
            <span class="entity-header-desc">Lifecycle Audits</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>history_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>incident_id</td><td class="col-type">INT (incidents.incident_id)</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>updated_by</td><td class="col-type">INT (users.user_id)</td></tr>
            <tr><td class="col-attr">status</td><td class="col-type">VARCHAR(50)</td></tr>
            <tr><td class="col-attr">remarks</td><td class="col-type">TEXT</td></tr>
            <tr><td class="col-attr">timestamp</td><td class="col-type">DATETIME</td></tr>
          </table>
        </div>

        <!-- SAFETY_CHECKINS -->
        <div class="entity-card" style="border-color: #059669;">
          <div class="entity-header" style="background: #047857;">
            <span>🛡️ SAFETY_CHECKINS</span>
            <span class="entity-header-desc">Citizen Welfare Tracker</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>checkin_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>user_id</td><td class="col-type">INT (users.user_id)</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>center_id</td><td class="col-type">INT NULL (evacuation_centers)</td></tr>
            <tr><td class="col-attr">status</td><td class="col-type">ENUM('Safe','At Evacuation','Needs Assistance')</td></tr>
            <tr><td class="col-attr">latitude</td><td class="col-type">DECIMAL(10, 8)</td></tr>
            <tr><td class="col-attr">longitude</td><td class="col-type">DECIMAL(11, 8)</td></tr>
            <tr><td class="col-attr">timestamp</td><td class="col-type">DATETIME</td></tr>
          </table>
        </div>

      </div>

      <!-- COLUMN 3: FIELD RESPONDERS, VEHICLES & EVACUATION -->
      <div class="erd-column">
        
        <!-- RESPONDERS -->
        <div class="entity-card" style="border-color: #6D28D9;">
          <div class="entity-header" style="background: #5B21B6;">
            <span>🚑 RESPONDERS</span>
            <span class="entity-header-desc">Rescue Fleet Personnel</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>responder_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr"><span class="fk-badge">FK</span>user_id</td><td class="col-type">INT (users.user_id)</td></tr>
            <tr><td class="col-attr">agency</td><td class="col-type">ENUM('MDRRMO','PNP','BFP','RHU')</td></tr>
            <tr><td class="col-attr">unit_callsign</td><td class="col-type">VARCHAR(50)</td></tr>
            <tr><td class="col-attr">status</td><td class="col-type">ENUM('Available','Dispatched','On Scene','Off Duty')</td></tr>
            <tr><td class="col-attr">current_lat</td><td class="col-type">DECIMAL(10, 8)</td></tr>
            <tr><td class="col-attr">current_lng</td><td class="col-type">DECIMAL(11, 8)</td></tr>
            <tr><td class="col-attr">contact_number</td><td class="col-type">VARCHAR(20)</td></tr>
          </table>
        </div>

        <!-- VEHICLES -->
        <div class="entity-card" style="border-color: #6D28D9;">
          <div class="entity-header" style="background: #5B21B6;">
            <span>🚒 VEHICLES</span>
            <span class="entity-header-desc">Emergency Fleet Units</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>vehicle_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr">plate_number</td><td class="col-type">VARCHAR(20) UNIQUE</td></tr>
            <tr><td class="col-attr">vehicle_type</td><td class="col-type">ENUM('Ambulance','Fire Engine','Patrol','Boat')</td></tr>
            <tr><td class="col-attr">agency</td><td class="col-type">ENUM('MDRRMO','BFP','PNP','RHU')</td></tr>
            <tr><td class="col-attr">status</td><td class="col-type">ENUM('Active','Maintenance','Dispatched')</td></tr>
            <tr><td class="col-attr">current_lat</td><td class="col-type">DECIMAL(10, 8)</td></tr>
            <tr><td class="col-attr">current_lng</td><td class="col-type">DECIMAL(11, 8)</td></tr>
          </table>
        </div>

        <!-- EVACUATION_CENTERS -->
        <div class="entity-card" style="border-color: #059669;">
          <div class="entity-header" style="background: #047857;">
            <span>🏛️ EVACUATION_CENTERS</span>
            <span class="entity-header-desc">Municipal Shelters</span>
          </div>
          <table class="entity-table">
            <tr><td class="col-attr"><span class="pk-badge">PK</span>center_id</td><td class="col-type">INT AUTO_INCREMENT</td></tr>
            <tr><td class="col-attr">name</td><td class="col-type">VARCHAR(100)</td></tr>
            <tr><td class="col-attr">address</td><td class="col-type">VARCHAR(255)</td></tr>
            <tr><td class="col-attr">barangay</td><td class="col-type">VARCHAR(50)</td></tr>
            <tr><td class="col-attr">latitude</td><td class="col-type">DECIMAL(10, 8)</td></tr>
            <tr><td class="col-attr">longitude</td><td class="col-type">DECIMAL(11, 8)</td></tr>
            <tr><td class="col-attr">capacity</td><td class="col-type">INT</td></tr>
            <tr><td class="col-attr">current_occupants</td><td class="col-type">INT DEFAULT 0</td></tr>
            <tr><td class="col-attr">status</td><td class="col-type">ENUM('Open','Full','Closed')</td></tr>
            <tr><td class="col-attr"><span class="json-badge">JSON</span>facilities</td><td class="col-type">JSON (Water, medical, generator)</td></tr>
          </table>
        </div>

      </div>

    </div>

    <!-- ENTITY RELATIONSHIP CARDINALITY FOOTNOTE -->
    <div class="rel-banner">
      <div class="rel-title">🔗 Key Relational Mappings & Referential Cardinality:</div>
      <strong>USERS (1 : M) INCIDENTS</strong> — A registered resident can file multiple distress incidents; 
      <strong>USERS (1 : M) HOUSEHOLD_MEMBERS</strong> — A household head manages family vulnerability records; 
      <strong>INCIDENTS (1 : M) STATUS_HISTORY</strong> — Each incident possesses an immutable chronological lifecycle log; 
      <strong>RESPONDERS (M : M) INCIDENTS</strong> — Responders are assigned to emergency incidents based on agency role; 
      <strong>EVACUATION_CENTERS (1 : M) SAFETY_CHECKINS</strong> — Evacuation shelters log occupancy from multiple citizen check-ins.
    </div>

  </div>
</body>
</html>
`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1750, height: 1400, deviceScaleFactor: 2.0 });

  const tasks = [
    { id: 'fig6_client_server_jamindan', html: HTML_FIG6 },
    { id: 'fig7_system_architecture_jamindan', html: HTML_FIG7 },
    { id: 'fig8_erd_jamindan', html: HTML_FIG8 }
  ];

  for (const t of tasks) {
    console.log(`Rendering perfect panel-ready diagram: ${t.id}...`);
    await page.setContent(t.html, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 600));

    const canvasEl = await page.$('.canvas');
    if (canvasEl) {
      const outPath = path.join(OUT_DIR, `${t.id}.png`);
      await canvasEl.screenshot({ path: outPath });
      console.log(`Saved: ${outPath}`);
    }
  }

  await browser.close();
  console.log('ALL THREE PANEL-READY DIAGRAMS RENDERED AT ULTRA-HIGH CLARITY!');
})();
