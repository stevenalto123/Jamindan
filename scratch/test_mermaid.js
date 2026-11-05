const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; padding: 20px; }
          .mermaid { display: inline-block; }
        </style>
      </head>
      <body>
        <div class="mermaid">
          flowchart LR
            Admin((Admin / Dispatcher))
            subgraph System Boundary
              UC1([Login & Siren Unlock])
              UC2([Manage Incidents])
              UC3([Verify IDs])
            end
            Admin --> UC1
            Admin --> UC2
            Admin --> UC3
        </div>
        <script>
          mermaid.initialize({ startOnLoad: true, theme: 'default' });
        </script>
      </body>
    </html>
  `);

  await new Promise(r => setTimeout(r, 2500));
  const el = await page.$('.mermaid');
  if (el) {
    const outPath = path.join(__dirname, 'test_diagram.png');
    await el.screenshot({ path: outPath });
    console.log('Successfully saved test_diagram.png, exists:', fs.existsSync(outPath));
  }
  await browser.close();
})();
