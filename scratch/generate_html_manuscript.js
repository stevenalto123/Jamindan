const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'chapter_4_jamindan_manuscript.md');
const mdContent = fs.readFileSync(mdPath, 'utf8');

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chapter IV - Jamindan Emergency Response Platform</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    :root {
      --primary: #1e3a8a;
      --secondary: #059669;
      --accent: #dc2626;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text: #1e293b;
      --border: #e2e8f0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.7;
      color: var(--text);
      background-color: var(--bg);
      margin: 0;
      padding: 0;
    }
    .header-bar {
      position: sticky;
      top: 0;
      background: rgba(30, 58, 138, 0.95);
      backdrop-filter: blur(8px);
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header-bar h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
    }
    .btn {
      background: white;
      color: var(--primary);
      border: none;
      padding: 7px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn:hover {
      background: #e2e8f0;
      transform: translateY(-1px);
    }
    .container {
      max-width: 960px;
      margin: 30px auto;
      background: var(--card-bg);
      padding: 50px 60px;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid var(--border);
    }
    h1 {
      font-size: 26px;
      color: var(--primary);
      text-align: center;
      margin-bottom: 8px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    h2 {
      font-size: 18px;
      color: #334155;
      text-align: center;
      margin-top: 0;
      margin-bottom: 24px;
      line-height: 1.4;
      font-weight: 700;
    }
    h3 {
      font-size: 20px;
      color: var(--primary);
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
      margin-top: 36px;
      margin-bottom: 16px;
      font-weight: 700;
    }
    h4 {
      font-size: 17px;
      color: #0f172a;
      margin-top: 24px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    h5 {
      font-size: 15px;
      color: #1e3a8a;
      margin-top: 20px;
      margin-bottom: 8px;
      font-weight: 700;
    }
    p, li {
      font-size: 15px;
      color: #334155;
      line-height: 1.75;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .figure-box {
      background: #f8fafc;
      border: 2px dashed #cbd5e1;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
      text-align: center;
      color: #64748b;
      font-style: italic;
    }
    .mermaid {
      background: #ffffff;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      margin: 20px 0;
      display: flex;
      justify-content: center;
    }
    hr {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 32px 0;
    }
    @media print {
      .header-bar { display: none; }
      .container {
        box-shadow: none;
        border: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
    }
    @media (max-width: 768px) {
      .container {
        padding: 24px 18px;
        margin: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <h1>Jamindan Emergency Response — Chapter IV Manuscript</h1>
    <div class="header-actions">
      <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <button class="btn" onclick="copyManuscriptText()">📋 Copy All Text</button>
    </div>
  </div>

  <div class="container" id="content"></div>

  <script id="raw-markdown" type="text/markdown">
${mdContent.replace(/<\/script>/g, '<\\/script>')}
  </script>

  <script>
    mermaid.initialize({ startOnLoad: false, theme: 'default' });

    const rawMd = document.getElementById('raw-markdown').textContent;
    
    // Custom renderer for marked to handle mermaid code blocks
    const renderer = new marked.Renderer();
    renderer.code = function(code, language) {
      if (language === 'mermaid') {
        return '<div class="mermaid">' + code + '</div>';
      }
      return '<pre><code>' + code + '</code></pre>';
    };

    document.getElementById('content').innerHTML = marked.parse(rawMd, { renderer });

    // Render KaTeX math
    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById('content'), {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }

    // Render Mermaid diagrams
    mermaid.run({
      nodes: document.querySelectorAll('.mermaid')
    });

    function copyManuscriptText() {
      navigator.clipboard.writeText(rawMd).then(() => {
        alert('Manuscript copied to clipboard! You can now paste it directly into Microsoft Word or Google Docs.');
      });
    }
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, '..', 'chapter_4_jamindan_manuscript.html'), htmlTemplate, 'utf8');
console.log('Generated chapter_4_jamindan_manuscript.html in project root.');
