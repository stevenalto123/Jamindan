const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', err => {
    console.log('PAGE EXCEPTION:', err.toString());
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully');
  } catch (e) {
    console.log('Failed to load page:', e);
  }
  
  await browser.close();
})();
