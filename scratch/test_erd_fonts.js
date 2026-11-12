const puppeteer = require('C:/Users/huawei/Documents/jamindan-emergency-response/scratch/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const code = `
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
`;

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 3800, height: 2600, deviceScaleFactor: 2 });

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <style>
          body {
            margin: 0;
            padding: 30px;
            background-color: #ffffff;
            font-family: Arial, sans-serif;
          }
          #wrapper {
            display: inline-block;
            background: #ffffff;
            padding: 30px;
          }
          #container svg {
            width: 100% !important;
            height: auto !important;
          }
        </style>
      </head>
      <body>
        <div id="wrapper">
          <div id="container"></div>
        </div>
      </body>
    </html>
  `);

  await new Promise(r => setTimeout(r, 1500));

  // Render with high-contrast, large-font ER config
  await page.evaluate(async (code) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
        primaryColor: '#EEF2FF',
        primaryTextColor: '#1E3A8A',
        primaryBorderColor: '#2563EB',
        lineColor: '#1D4ED8',
        secondaryColor: '#F8FAFC',
        tertiaryColor: '#FFFFFF'
      },
      er: {
        fontSize: 32,
        useMaxWidth: false,
        entityPadding: 24,
        stroke: '#1E3A8A',
        fill: '#EEF2FF'
      }
    });

    const container = document.getElementById('container');
    container.style.width = '3400px';
    const { svg } = await window.mermaid.render('render_erd_opt', code);
    container.innerHTML = svg;
  }, code.trim());

  await new Promise(r => setTimeout(r, 1500));

  const wrapperEl = await page.$('#wrapper');
  if (wrapperEl) {
    const outPath = 'C:\\Users\\huawei\\Documents\\jamindan-emergency-response\\scratch\\diagram_images\\fig8_erd_jamindan.png';
    await wrapperEl.screenshot({ path: outPath });
    console.log(`Saved optimized high-res ERD to: ${outPath}`);
  }

  await browser.close();
})();
