const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'diagram_images');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const DIAGRAMS = [
  {
    id: 'fig6_client_server_jamindan',
    title: 'Figure 6. Client-Server Interaction Diagram',
    code: `
flowchart TD
    subgraph Presentation Layer [Presentation Layer / User Access]
        Client1["Resident Smartphone\n(React PWA / Mobile Web)"]
        Client2["Field Responder Tablet\n(Ambulance / BFP / PNP)"]
        Client3["MDRRMO Dispatcher Workstation\n(Desktop Web Browser)"]
    end

    Client1 -->|HTTPS Requests / WebSocket Events| AppLayer
    Client2 -->|Live GPS Telemetry / Status Updates| AppLayer
    Client3 -->|Command Operations / Audio Siren Stream| AppLayer

    subgraph AppLayer [Application Layer / Backend Server]
        NodeAPI["Node.js & Express REST API Server\n- Authentication & RBAC Middleware\n- Incident Triage & Haversine Distance Engine\n- Audit Logging & SMS Gateway Webhooks"]
        SocketServer["Socket.IO Real-Time Event Daemon\n- Sub-300ms Emergency Siren Broadcasts\n- Live Responder Fleet Telemetry Streaming"]
    end

    NodeAPI <-->|SQL Queries & Transactions| DataLayer
    SocketServer <-->|Event Persistence & Broadcast Sync| DataLayer
    NodeAPI -->|Incident Evidence & ID Uploads| CloudCDN["Cloudinary Media CDN\n(Photographic Evidence Storage)"]

    subgraph DataLayer [Data Layer / Cloud Database Cluster]
        DBServer[("MySQL 8.0 Relational Database Cluster")]
        subgraph Tables [Core Emergency Schemas]
            T1["Users & Roles"]
            T2["Incidents & Details"]
            T3["Responders & Fleet"]
            T4["Evacuation Centers"]
            T5["Safety Check-ins"]
            T6["Audit Logs"]
        end
        DBServer --- Tables
    end
    `
  },
  {
    id: 'fig7_system_architecture_jamindan',
    title: 'Figure 7. System Architecture Diagram',
    code: `
flowchart TD
    subgraph Municipal Field Environment
        Resident["Jamindan Resident / Eyewitness\n(SOS Panic / Incident Wizard)"]
        Responder["Field Responder Unit\n(BFP / PNP / RHU Mobile)"]
        SatGPS["Satellite GPS Constellation\n(Hardware Radio Coordinate Lock)"]
    end

    SatGPS -. Radio Signals .-> Resident
    SatGPS -. Radio Signals .-> Responder

    subgraph Network Gateway
        Cellular["Cellular 4G/5G / Local Wi-Fi Hotspots"]
        SMSNet["GSM Cellular Network (SMS Fallback: 09485224345)"]
    end

    Resident --> Cellular
    Resident -. Offline Fallback .-> SMSNet
    Responder --> Cellular

    subgraph Cloud Infrastructure & Security Layer
        WAF["Cloudflare Web Application Firewall\n(SSL/TLS Encryption & DDoS Protection)"]
        VercelEdge["Vercel Global Edge CDN\n(React Frontend Static Assets)"]
        AppServer["Render Cloud Web Server\n(Node.js, Express & Socket.IO API)"]
        MySQLCluster[("Aiven Managed MySQL 8.0 Cluster\n(Relational ACID Transactions)")]
        MediaCDN["Cloudinary Media Storage\n(Incident Photos & ID Badges)"]
    end

    Cellular --> WAF
    WAF --> VercelEdge
    WAF --> AppServer
    AppServer <--> MySQLCluster
    AppServer <--> MediaCDN

    subgraph MDRRMO Command Post [MDRRMO Emergency Operations Center - Jamindan]
        LocalRouter["Municipal High-Speed Fiber Router"]
        DispatchPC["Dispatcher Dual-Monitor Workstation\n(Live Command Map & Incident Triage)"]
        AudioSiren["Audible Siren Warning System\n(Web Audio Emergency Sound)"]
        PrintService["Report Document Printer\n(Official PDF & CSV Compliance Logs)"]
    end

    AppServer <-->|Socket.IO Bidirectional Stream| LocalRouter
    LocalRouter --> DispatchPC
    DispatchPC --> AudioSiren
    DispatchPC --> PrintService
    SMSNet -. Direct Emergency Hotline .-> DispatchPC
    `
  },
  {
    id: 'fig8_erd_jamindan',
    title: 'Figure 8. Entity-Relationship Diagram of the Emergency Response Community Platform',
    code: `
erDiagram
    USERS ||--o{ INCIDENTS : "submits"
    USERS ||--o{ SAFETY_CHECKINS : "reports"
    USERS ||--o{ HOUSEHOLD_MEMBERS : "heads"
    USERS ||--o{ AUDIT_LOGS : "generates"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o| RESPONDERS : "operates as"
    RESPONDERS ||--o{ INCIDENTS : "dispatched to"
    VEHICLES ||--o{ RESPONDERS : "assigned to"
    INCIDENTS ||--o{ INCIDENT_STATUS_HISTORY : "tracks"
    EVACUATION_CENTERS ||--o{ SAFETY_CHECKINS : "shelters"

    USERS {
        int user_id PK
        string full_name
        string email
        string phone_number
        string password_hash
        string role "Resident, Responder, Admin"
        string barangay
        boolean is_verified
        string id_photo_url
        datetime created_at
    }

    INCIDENTS {
        int incident_id PK
        int caller_id FK
        string category "Flood, Fire, Medical, Accident, Landslide, Crime"
        string status "Pending, Dispatched, On Scene, Resolved, False Alarm"
        string priority "High, Medium, Low"
        decimal latitude
        decimal longitude
        string address_landmark
        text description
        string photo_url
        json dynamic_details
        datetime reported_at
    }

    INCIDENT_STATUS_HISTORY {
        int history_id PK
        int incident_id FK
        int updated_by FK
        string status
        text remarks
        datetime timestamp
    }

    RESPONDERS {
        int responder_id PK
        int user_id FK
        string agency "MDRRMO, PNP, BFP, RHU"
        string unit_callsign
        string status "Available, Dispatched, On Scene, Off Duty"
        decimal current_lat
        decimal current_lng
        string contact_number
    }

    VEHICLES {
        int vehicle_id PK
        string plate_number
        string vehicle_type "Ambulance, Fire Engine, Patrol, Rescue Boat"
        string agency "MDRRMO, BFP, PNP, RHU"
        string status "Active, Maintenance, Dispatched"
        decimal current_lat
        decimal current_lng
    }

    EVACUATION_CENTERS {
        int center_id PK
        string name
        string address
        string barangay
        decimal latitude
        decimal longitude
        int capacity
        int current_occupants
        string status "Open, Full, Closed"
        json facilities
    }

    SAFETY_CHECKINS {
        int checkin_id PK
        int user_id FK
        int center_id FK
        string status "Safe, At Evacuation, Needs Assistance"
        decimal latitude
        decimal longitude
        datetime timestamp
    }

    HOUSEHOLD_MEMBERS {
        int member_id PK
        int household_head_id FK
        string full_name
        string relationship
        string vulnerability_type "Senior, PWD, Infant, Pregnant, None"
        date birthdate
    }

    NOTIFICATIONS {
        int notification_id PK
        int recipient_id FK
        int incident_id FK
        string title
        text message
        boolean is_read
        datetime created_at
    }

    AUDIT_LOGS {
        int log_id PK
        int user_id FK
        string action_taken
        string target_module
        string ip_address
        text details
        datetime timestamp
    }
    `
  }
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 2 });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 24px;
            background-color: #ffffff;
            font-family: Arial, sans-serif;
          }
          #container {
            display: inline-block;
            background: #ffffff;
            padding: 20px;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div id="container"></div>
        <script>
          mermaid.initialize({
            startOnLoad: false,
            theme: 'default',
            themeVariables: {
              primaryColor: '#e0e7ff',
              primaryTextColor: '#1e3a8a',
              primaryBorderColor: '#3b82f6',
              lineColor: '#2563eb',
              secondaryColor: '#f1f5f9',
              tertiaryColor: '#ffffff'
            },
            flowchart: { curve: 'basis', htmlLabels: true },
            er: { fontSize: 13 }
          });
        </script>
      </body>
    </html>
  `);

  await new Promise(r => setTimeout(r, 2000));

  for (let idx = 0; idx < DIAGRAMS.length; idx++) {
    const diag = DIAGRAMS[idx];
    console.log(`Rendering (${idx + 1}/${DIAGRAMS.length}) ${diag.id}...`);

    await page.evaluate(async (code, id) => {
      const container = document.getElementById('container');
      container.innerHTML = '';
      try {
        const { svg } = await window.mermaid.render('render_' + id, code);
        container.innerHTML = svg;
      } catch (e) {
        container.innerHTML = '<pre>' + e.message + '</pre>';
      }
    }, diag.code.trim(), diag.id);

    await new Promise(r => setTimeout(r, 800));

    const containerEl = await page.$('#container');
    if (containerEl) {
      const outPath = path.join(OUT_DIR, `${diag.id}.png`);
      await containerEl.screenshot({ path: outPath });
      console.log(`Saved: ${outPath}`);
    }
  }

  await browser.close();
  console.log('FIGURES 6, 7, 8 RENDERED SUCCESSFULLY AS CRISP PNG IMAGES!');
})();
