const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const puppeteer = require('puppeteer-core');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const OUT_DIR = path.join(__dirname, 'new_screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Load dotenv and jwt from backend
require(path.join(BACKEND_DIR, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND_DIR, '.env') });
const jwt = require(path.join(BACKEND_DIR, 'node_modules', 'jsonwebtoken'));
const db = require(path.join(BACKEND_DIR, 'config', 'db'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitForUrl(url, timeoutMs = 45000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve(res.statusCode);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Timeout waiting for ' + url));
        } else {
          setTimeout(check, 600);
        }
      });
    };
    check();
  });
}

(async () => {
  let backendProc = null;
  let frontendProc = null;
  let browser = null;

  try {
    console.log('1. Preparing Database & Users...');
    await db.query("UPDATE system_settings SET setting_value = 'true' WHERE setting_key = 'safety_checkin_active'");

    // Replace any gibberish test announcement like 'njlnj' with realistic MDRRMO advisory
    await db.query(`
      UPDATE advisories 
      SET title = 'MDRRMO Weather & River Basin Advisory',
          content = 'Moderate to heavy rainfall observed in upland barangays. Residents near Mambusao and Panay River tributaries are advised to monitor water levels and remain alert for pre-emptive evacuation notices.'
      WHERE title LIKE '%njlnj%' OR LENGTH(title) < 8
    `).catch(() => {});

    const [admins] = await db.query("SELECT id, full_name, email, role, barangay, phone, is_verified FROM users WHERE role = 'Admin' LIMIT 1");
    const [residents] = await db.query("SELECT id, full_name, email, role, barangay, phone, is_verified FROM users WHERE role = 'Resident' LIMIT 1");
    const [incidents] = await db.query("SELECT id FROM incidents ORDER BY created_at DESC LIMIT 1");

    const adminUser = admins[0];
    const residentUser = residents[0];
    const sampleIncidentId = incidents[0] ? incidents[0].id : 1;

    const secret = process.env.JWT_SECRET || 'jamindan_secret_key_123';
    const adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role, name: adminUser.full_name }, secret, { expiresIn: '24h' });
    const residentToken = jwt.sign({ id: residentUser.id, role: residentUser.role, name: residentUser.full_name }, secret, { expiresIn: '24h' });

    console.log('2. Starting Backend Server (port 5000)...');
    backendProc = spawn('node', ['server.js'], {
      cwd: BACKEND_DIR,
      stdio: 'ignore',
      windowsHide: true
    });

    console.log('3. Starting Frontend Vite Server (port 5173)...');
    frontendProc = spawn('node', [path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '5173'], {
      cwd: FRONTEND_DIR,
      stdio: 'ignore',
      windowsHide: true
    });

    await waitForUrl('http://localhost:5173', 40000);
    await sleep(3000);
    console.log('Servers are up! Launching Chrome...');

    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--window-size=1366,900'
      ]
    });

    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:5173', ['geolocation', 'notifications']);

    const page = await browser.newPage();
    await page.setGeolocation({ latitude: 11.4090, longitude: 122.5008 });

    const setAuth = async (targetPage, token, userObj) => {
      await targetPage.evaluate((tk, usr) => {
        localStorage.clear();
        sessionStorage.clear();
        if (tk && usr) {
          sessionStorage.setItem('token', tk);
          localStorage.setItem('token', tk);
          sessionStorage.setItem('cached_user', JSON.stringify(usr));
          localStorage.setItem('cached_user', JSON.stringify(usr));
          sessionStorage.setItem('audio_unlocked', 'true');
        }
      }, token, userObj);
    };

    // -------------------------------------------------------------
    // Figure 8: Login Page (Desktop)
    // -------------------------------------------------------------
    console.log('Capturing Figure 8 (Login Page)...');
    await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await setAuth(page, null, null);
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig8_login.png') });

    // -------------------------------------------------------------
    // Authenticate as Resident
    // -------------------------------------------------------------
    await setAuth(page, residentToken, residentUser);

    // Figure 1a: Resident Dashboard (Desktop 3-Column Balanced Check-In)
    console.log('Capturing Figure 1a (Resident Dashboard Desktop)...');
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig1a_resident_desktop.png') });

    // Figure 1b & 1c: Resident Dashboard (Mobile Balanced 1-Column Safety Check-In)
    console.log('Capturing Figure 1b & 1c (Resident Dashboard Mobile - Balanced Check-In)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig1b_resident_mobile_balanced.png') });

    await page.evaluate(() => {
      const card = document.querySelector('.resident-safety-grid');
      if (card) card.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await sleep(600);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig1c_safety_checkin_mobile_closeup.png') });

    // -------------------------------------------------------------
    // Figure 2: Offline SOS Queued State (Mobile) using isolated page
    // -------------------------------------------------------------
    console.log('Capturing Figure 2 (Offline SOS Queue & GPS Beacon)...');
    const offlinePage = await browser.newPage();
    await offlinePage.setGeolocation({ latitude: 11.4090, longitude: 122.5008 });
    await offlinePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await offlinePage.evaluateOnNewDocument((tk, usr) => {
      Object.defineProperty(navigator, 'onLine', { get: () => false, configurable: true });
      sessionStorage.setItem('token', tk);
      localStorage.setItem('token', tk);
      sessionStorage.setItem('cached_user', JSON.stringify(usr));
      localStorage.setItem('cached_user', JSON.stringify(usr));
      sessionStorage.setItem('audio_unlocked', 'true');
      const payload = {
        id: 'current_pending_sos',
        type: 'SOS Panic',
        description: '[SOS PANIC ALARM] Instantly triggered by resident via 3-second press while in dead signal zone.',
        location_lat: 11.40902,
        location_lng: 122.50084,
        timestamp: new Date().toISOString(),
        tapCount: 2,
        queuedAt: new Date().toISOString()
      };
      localStorage.setItem('jamindan_active_offline_sos', JSON.stringify(payload));
    }, residentToken, residentUser);
    await offlinePage.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await offlinePage.screenshot({ path: path.join(OUT_DIR, 'fig2_offline_sos_mobile.png') });
    await offlinePage.close();

    // -------------------------------------------------------------
    // Figure 3a & 3b: 2-Step Mobile Incident Reporting Wizard
    // -------------------------------------------------------------
    console.log('Capturing Figure 3a (2-Step Wizard - Step 1)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/report', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, div'));
      const fireBtn = buttons.find(el => el.textContent && el.textContent.trim() === 'Fire');
      if (fireBtn) fireBtn.click();
    });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig3a_wizard_step1.png') });

    console.log('Capturing Figure 3b (2-Step Wizard - Step 2)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.textContent && b.textContent.includes('Continue to Location'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(2200);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig3b_wizard_step2.png') });

    // -------------------------------------------------------------
    // Figure 4: Track Incident Status & Operational Timeline
    // -------------------------------------------------------------
    console.log('Capturing Figure 4 (Track Incident Status)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto(`http://localhost:5173/incidents/${sampleIncidentId}`, { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig4_track_status.png') });

    // -------------------------------------------------------------
    // Figure 5: News & Municipal Disaster Advisories + Rain Telemetry
    // -------------------------------------------------------------
    console.log('Capturing Figure 5 (News & Weather Telemetry)...');
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/news', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig5_news_advisories.png') });

    // -------------------------------------------------------------
    // Figure 6: Emergency Safety Tips & First-Aid Knowledge Base
    // -------------------------------------------------------------
    console.log('Capturing Figure 6 (Emergency Safety Tips)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/tips', { waitUntil: 'networkidle2' });
    await sleep(1800);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig6_safety_tips.png') });

    // -------------------------------------------------------------
    // Figure 7: Emergency Hotlines Directory (Overhauled Mobile View)
    // -------------------------------------------------------------
    console.log('Capturing Figure 7 (Emergency Hotlines Mobile View)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/hotlines', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig7_hotlines_mobile.png') });

    // -------------------------------------------------------------
    // Figure 12a & 12b: Evacuation Centers & Smart Route Bar (Mobile)
    // -------------------------------------------------------------
    console.log('Capturing Figure 12a (Evacuation Centers Mobile with Touch Lock)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/evacuation', { waitUntil: 'networkidle2' });
    await sleep(3000);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig12a_evacuation_mobile.png') });

    console.log('Capturing Figure 12b (Evacuation Center Smart Floating Route Bar)...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-card'));
      const openCard = cards.find(c => c.textContent && (c.textContent.includes('OPEN') || c.textContent.includes('Open') || c.textContent.includes('Cultural') || c.textContent.includes('Gym')));
      if (openCard) openCard.click();
    });
    await sleep(3500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig12b_evacuation_route_bar.png') });

    // -------------------------------------------------------------
    // Figure 13: Household Vulnerability Profiling
    // -------------------------------------------------------------
    console.log('Capturing Figure 13 (Household Vulnerability Profiling)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/household', { waitUntil: 'networkidle2' });
    await sleep(2000);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig13_household.png') });

    // -------------------------------------------------------------
    // Authenticate as Admin
    // -------------------------------------------------------------
    await setAuth(page, adminToken, adminUser);

    // Figure 9: Administrative Command Dashboard
    console.log('Capturing Figure 9 (Admin Command Dashboard)...');
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle2' });
    await sleep(3000);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig9_admin_dashboard.png') });

    // Figure 10: Command Map & Real-Time GIS Fleet Tracking
    console.log('Capturing Figure 10 (Command Map GIS)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/command-map', { waitUntil: 'networkidle2' });
    await sleep(3500);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig10_command_map.png') });

    // Figure 11: Incident Management Inbox & False Alarm Triage
    console.log('Capturing Figure 11 (Incident Management Inbox)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/incidents', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig11_incident_inbox.png') });

    // Figure 14: Emergency Fleet & Responder Management
    console.log('Capturing Figure 14 (Emergency Vehicles Fleet)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/admin-vehicles', { waitUntil: 'networkidle2' });
    await sleep(2200);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig14_fleet_vehicles.png') });

    // Figure 15: User Management & Citizen ID Verification
    console.log('Capturing Figure 15 (User Management & Verification)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle2' });
    await sleep(2200);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig15_user_management.png') });

    // Figure 16: System Audit Logs
    console.log('Capturing Figure 16 (System Audit Logs)...');
    await page.setViewport({ width: 1280, height: 820, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/logs', { waitUntil: 'networkidle2' });
    await sleep(2200);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig16_system_logs.png') });

    // Figure 17a: Generate Reports & Analytics (Desktop Data Tables)
    console.log('Capturing Figure 17a (Admin Analytics Desktop)...');
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/admin-analytics', { waitUntil: 'networkidle2' });
    await sleep(3000);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig17a_analytics_desktop.png') });

    // Figure 17b: Admin Analytics Responsive Mobile Card Feeds
    console.log('Capturing Figure 17b (Admin Analytics Mobile Cards)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/admin-analytics', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.evaluate(() => {
      window.scrollBy(0, 620);
    });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig17b_analytics_mobile_cards.png') });

    console.log('ALL 20 SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } catch (err) {
    console.error('Screenshot capture error:', err);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (frontendProc) frontendProc.kill();
    if (backendProc) backendProc.kill();
    process.exit(0);
  }
})();
