const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, 'diagram_images');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const DIAGRAMS = [
  {
    id: 'fig18_admin_use_case',
    title: 'Figure 18. Admin / Dispatcher Use Case Diagram',
    code: `
flowchart LR
    Admin((MDRRMO Admin / Dispatcher))

    subgraph System Boundary
        UC1([Login & Audio Siren Unlock])
        UC2([View Dashboard Metrics])
        UC3([Manage Incidents & Dispatch Units])
        UC4([Flag False Alarm / Prank Report])
        UC5([Monitor Command Map & Vehicles])
        UC6([Publish Emergency Broadcasts])
        UC7([Manage Evacuation Centers & Shelters])
        UC8([Manage Household Vulnerability])
        UC9([Verify Citizen IDs])
        UC10([Generate PDF & CSV Reports])
        UC11([View System Audit Logs])
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    `
  },
  {
    id: 'fig19_responder_use_case',
    title: 'Figure 19. Field Responder Use Case Diagram',
    code: `
flowchart LR
    Responder((Field Responder\nBFP / PNP / RHU))

    subgraph Responder System Boundary
        R1([Login to Responder Account])
        R2([View Assigned Emergency Tasks])
        R3([View Incident Location & Landmark])
        R4([Update Incident Status to In Progress])
        R5([Broadcast Live Vehicle GPS Location])
        R6([Submit Incident Resolution Notes])
    end

    Responder --> R1
    Responder --> R2
    Responder --> R3
    Responder --> R4
    Responder --> R5
    Responder --> R6
    `
  },
  {
    id: 'fig20_resident_use_case',
    title: 'Figure 20. Resident / Citizen Use Case Diagram',
    code: `
flowchart LR
    Resident((Resident / Citizen))

    subgraph Resident System Boundary
        U1([Register & Submit ID Verification])
        U2([Login to Resident Account])
        U3([Trigger 3-Second Emergency SOS])
        U4([Broadcast Safety Check-In Status])
        U5([Queue Offline SOS with Satellite GPS])
        U6([Send Direct Emergency SMS Fallback])
        U7([Submit Incident via 2-Step Wizard])
        U8([Track Live Report Status & Chat])
        U9([View Shelters & Smart Navigation Routes])
        U10([View News & Emergency Tips])
        U11([Access Hotlines Directory & Quick Calls])
    end

    Resident --> U1
    Resident --> U2
    Resident --> U3
    Resident --> U4
    Resident --> U5
    Resident --> U6
    Resident --> U7
    Resident --> U8
    Resident --> U9
    Resident --> U10
    Resident --> U11
    `
  },
  {
    id: 'fig21_admin_sequence',
    title: 'Figure 21. Admin Dispatcher Incident Management Sequence Diagram',
    code: `
sequenceDiagram
    autonumber
    actor Admin as MDRRMO Dispatcher
    participant UI as Admin Dashboard (React)
    participant Server as Backend API (Node.js)
    participant Socket as Socket.IO Bus
    participant DB as MySQL Database

    Admin->>UI: Enter Credentials & Click 'Go On Duty'
    UI->>Server: POST /api/auth/login
    Server->>DB: Verify Credentials
    DB-->>Server: Return User Details & JWT Token
    Server-->>UI: Authentication Success (Audio Siren Unlocked)
    
    Socket->>UI: Event: 'new-incident-alert'
    UI->>Admin: Trigger Audible Emergency Siren & Visual Toast
    
    Admin->>UI: Review Incident Details & Assign Vehicle
    UI->>Server: PUT /api/incidents/:id/assign
    Server->>DB: UPDATE incidents SET status='Dispatched', vehicle_id=?
    DB-->>Server: Confirm Update
    Server->>Socket: Emit 'incident-status-updated'
    Socket-->>UI: Real-Time UI Synchronization
    Server-->>UI: Return Success Response
    `
  },
  {
    id: 'fig22_sos_sequence',
    title: 'Figure 22. Resident Emergency SOS Sequence Diagram',
    code: `
sequenceDiagram
    autonumber
    actor Resident as Resident / Eyewitness
    participant Button as SOS Panic Button (UI)
    participant GPS as Hardware Satellite GPS
    participant Storage as IndexedDB / LocalStorage
    participant SMS as Native Device SMS
    participant Server as Cloud API Server

    Resident->>Button: Press and Hold 3 Seconds
    Button->>Button: Render Circular Progress & Haptic Pulse
    Button->>GPS: Request High-Accuracy Satellite Coordinates
    GPS-->>Button: Return (Latitude, Longitude)

    alt Network Connection Available (Online)
        Button->>Server: POST /api/incidents (Type: 'SOS Panic')
        Server->>Server: 5-Minute Deduplication Guard Check
        Server-->>Button: Incident Created (HTTP 201) / Updated (HTTP 200)
        Button->>Resident: Redirect to Live Incident Tracking Screen
    else No Signal / Airplane Mode (Offline)
        Button->>Storage: saveOfflineSos({ lat, lng, tapCount })
        Storage-->>Button: Confirmed Queued in IndexedDB
        Button->>Resident: Display 'SOS QUEUED OFFLINE' Banner with GPS
        opt Immediate Cellular SMS Action
            Resident->>Button: Click 'Send Direct SMS Now'
            Button->>SMS: Open SMS to 09485224345 with GPS link
        end
        Note over Button,Server: When device catches cellular signal or Wi-Fi
        Button->>Server: Auto-sync syncOfflineQueue() (Workbox / IDB)
        Server-->>Button: Successfully Dispatched
        Button->>Storage: clearOfflineSos()
    end
    `
  },
  {
    id: 'fig23_report_activity',
    title: 'Figure 23. Resident Incident Reporting Activity Diagram (2-Step Wizard)',
    code: `
flowchart TD
    Start([Start]) --> Login[User Authenticates Credentials]
    Login --> Choice{Network Online?}
    
    Choice -- Yes --> Step1[Open Wizard Step 1: Emergency & Evidence]
    Choice -- No --> OfflineNotice[Display Offline Notice & SMS Generator]
    
    Step1 --> Cat[Select Emergency Category: Medical, Fire, Flood, etc.]
    Cat --> DynamicFields[Fill Dynamic Context Questions]
    DynamicFields --> Photo{Attach Photo Proof?}
    Photo -- Yes --> UploadPhoto[Capture/Attach Image]
    Photo -- No --> NextStep[Click 'Next: Location & Details']
    UploadPhoto --> NextStep
    
    NextStep --> Step2[Open Wizard Step 2: Location & Send]
    Step2 --> Pin[Auto-Detect GPS Landmark or Pin MapPicker]
    Pin --> Desc[Input Incident Description Details]
    Desc --> Submit[Click 'Submit Emergency Report']
    
    Submit --> Validate{Fields Valid?}
    Validate -- No --> Error[Display Validation Error & Haptic Buzz]
    Error --> Step1
    Validate -- Yes --> Save[Store Report in Database & Queue Cloudinary]
    Save --> Broadcast[Emit WebSocket Alert to MDRRMO Command Post]
    Broadcast --> Finish([Display Tracking Code & End])
    `
  },
  {
    id: 'fig24_admin_activity',
    title: 'Figure 24. Admin Incident Dispatch & False Alarm Activity Diagram',
    code: `
flowchart TD
    Start([Start]) --> AudioUnlock[Dispatcher Unlocks Audio 'Go On Duty']
    AudioUnlock --> Wait[Listen for Incoming Socket.IO Incidents]
    Wait --> Alert[Receive New Incident & Sound Emergency Siren]
    
    Alert --> Inspect[Inspect Incident Location, Details & Citizen Verification Badge]
    Inspect --> Assess{Is Report Legitimate?}
    
    Assess -- Nuisance / False Alarm --> MarkFalse[Flag Incident as 'False Alarm']
    MarkFalse --> LogAudit[Record Reason in System Audit Logs]
    LogAudit --> CloseTicket[Close Ticket Without Dispatching Units]
    
    Assess -- Valid Emergency --> SelectUnit[Select Available Response Unit: Ambulance / BFP / Patrol]
    SelectUnit --> Dispatch[Update Status to 'Dispatched']
    Dispatch --> NotifyResponder[Push Notification to Field Responder]
    NotifyResponder --> Track[Monitor Live Movement on Command Map]
    Track --> Resolved[Responder Resolves Emergency on Scene]
    Resolved --> Export[Archive Incident for Monthly MDRRMO Report]
    Export --> EndNode([End])
    `
  },
  {
    id: 'fig25_network_layout',
    title: 'Figure 25. Network Layout of the System',
    code: `
flowchart TD
    subgraph Municipal Field Environment
        ResidentMobile["Resident Smartphone (PWA / Mobile Web)"]
        ResponderTablet["Field Responder Vehicle (Ambulance / BFP Tablet)"]
        GPS["Direct Satellite GPS Constellation"]
    end

    GPS -. Radio Signals .-> ResidentMobile
    GPS -. Radio Signals .-> ResponderTablet

    subgraph Telecommunications & Cloud Infrastructure
        CellTower["4G/5G Cellular Towers (Globe / Smart)"]
        SMSGateway["Cellular SMS Network (Direct SMS Backup)"]
        OSRM["OSRM Open Source Routing Engine"]
        CloudinaryCDN["Cloudinary Image CDN"]
    end

    ResidentMobile -->|HTTPS / WSS| CellTower
    ResidentMobile -->|Cellular SMS Fallback| SMSGateway
    ResponderTablet -->|HTTPS / WSS| CellTower

    subgraph Municipal Command Post Server
        ReverseProxy["Nginx Reverse Proxy & SSL Termination"]
        NodeServer["Node.js & Express REST API"]
        SocketServer["Socket.IO Real-Time Event Engine"]
        MySQL[("MySQL Relational Database")]
    end

    CellTower --> ReverseProxy
    ReverseProxy --> NodeServer
    ReverseProxy --> SocketServer
    NodeServer <--> MySQL
    SocketServer <--> MySQL
    NodeServer --> OSRM
    NodeServer --> CloudinaryCDN
    SMSGateway -. Manual Hotlines .-> MDRRMODesk["MDRRMO Emergency Hotline Desk"]
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
            font-family: 'Times New Roman', 'Segoe UI', Arial, sans-serif;
          }
          #container {
            display: inline-block;
            background: #ffffff;
            padding: 16px;
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
            sequence: { actorFontSize: 14, messageFontSize: 13, noteFontSize: 12 }
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

    await new Promise(r => setTimeout(r, 600));

    const containerEl = await page.$('#container');
    if (containerEl) {
      const outPath = path.join(OUT_DIR, `${diag.id}.png`);
      await containerEl.screenshot({ path: outPath });
      console.log(`Saved: ${outPath}`);
    }
  }

  await browser.close();
  console.log('ALL DIAGRAMS RENDERED SUCCESSFULLY AS CRISP PNG IMAGES!');
})();
