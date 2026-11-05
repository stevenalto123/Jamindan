const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKEND_DIR = path.join(PROJECT_ROOT, 'backend');
const FRONTEND_DIR = path.join(PROJECT_ROOT, 'frontend');
const OUT_DIR = path.join(__dirname, 'new_screenshots');

require(path.join(BACKEND_DIR, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND_DIR, '.env') });
const jwt = require(path.join(BACKEND_DIR, 'node_modules', 'jsonwebtoken'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch (_) {}
    await sleep(600);
  }
  return false;
}

(async () => {
  let backendProc = null;
  let frontendProc = null;
  let browser = null;

  try {
    const adminUser = {
      id: 1,
      full_name: 'Platform Administrator',
      email: 'admin@jamindan.gov.ph',
      role: 'Admin',
      barangay: 'Poblacion',
      phone: '09123456789',
      is_verified: 1
    };
    const residentUser = {
      id: 2,
      full_name: 'Juan Dela Cruz',
      email: 'juan@gmail.com',
      role: 'Resident',
      barangay: 'Poblacion',
      phone: '09199876543',
      is_verified: 1
    };

    const secret = process.env.JWT_SECRET || 'jamindan_secret_key_123';
    const adminToken = jwt.sign({ id: adminUser.id, role: adminUser.role, name: adminUser.full_name }, secret, { expiresIn: '24h' });
    const residentToken = jwt.sign({ id: residentUser.id, role: residentUser.role, name: residentUser.full_name }, secret, { expiresIn: '24h' });

    backendProc = spawn('node', ['server.js'], { cwd: BACKEND_DIR, stdio: 'ignore', windowsHide: true });
    frontendProc = spawn('node', [path.join(FRONTEND_DIR, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', '5173'], { cwd: FRONTEND_DIR, stdio: 'ignore', windowsHide: true });

    await waitForUrl('http://localhost:5000/api/hotlines', 25000);
    await waitForUrl('http://localhost:5173', 25000);
    await sleep(1500);

    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
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

    // 1. Capture Figure 12b (Evacuation Center Smart Floating Route Bar)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await setAuth(page, residentToken, residentUser);
    await page.goto('http://localhost:5173/evacuation', { waitUntil: 'networkidle2' });
    await sleep(3000);
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.glass-card'));
      const shelterCard = cards.find(c => c.textContent && (c.textContent.includes('Click to view route') || c.textContent.includes('Jamindan Cultural Center')));
      if (shelterCard) shelterCard.click();
    });
    await sleep(3500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig12b_evacuation_route_bar.png') });
    console.log('Successfully captured fig12b_evacuation_route_bar.png');

    // 2. Capture Figure 17b (Admin Analytics Responsive Mobile Card Feeds)
    await setAuth(page, adminToken, adminUser);
    await page.goto('http://localhost:5173/admin-analytics', { waitUntil: 'networkidle2' });
    await sleep(2500);
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const masterTab = buttons.find(b => b.textContent && b.textContent.includes('Incident Master'));
      if (masterTab) masterTab.click();
    });
    await sleep(1200);
    await page.evaluate(() => {
      const cardContainer = document.querySelector('.analytics-mobile-cards');
      if (cardContainer) {
        cardContainer.scrollIntoView({ behavior: 'instant', block: 'start' });
        window.scrollBy(0, -70);
      } else {
        window.scrollBy(0, 520);
      }
    });
    await sleep(800);
    await page.screenshot({ path: path.join(OUT_DIR, 'fig17b_analytics_mobile_cards.png') });
    console.log('Successfully captured fig17b_analytics_mobile_cards.png');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (frontendProc) frontendProc.kill();
    if (backendProc) backendProc.kill();
    process.exit(0);
  }
})();
