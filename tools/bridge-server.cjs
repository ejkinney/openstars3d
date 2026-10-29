'use strict';
// Fixed public asset allowlist: never serves server modules, evidence, or credentials.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const files = ['index.html','lib/playcanvas.min.js','src/contract.js','src/scene.js',
  'src/player.js','src/displays.js','src/presenter.js','src/main.js',
  'src/gameplay/encounter.js','src/gameplay/dialogue.js','src/gameplay/runtime.js'];
const publicFiles = new Set(files.map(file => '/' + file));
function createServer(port = 8123) {
  return http.createServer(async (req,res) => {
    const origin = `http://127.0.0.1:${port}`;
    if (req.headers.host !== `127.0.0.1:${port}` ||
        (req.headers.origin && req.headers.origin !== origin)) {
      res.writeHead(403); res.end(); return;
    }
    let url;
    try { url = new URL(req.url,origin).pathname; } catch { res.writeHead(400);res.end();return; }
    if (url === '/') url = '/index.html';
    if (!['GET','HEAD'].includes(req.method) || !publicFiles.has(url)) {
      res.writeHead(404); res.end(); return;
    }
    try {
      const data = await fs.readFile(path.join(root,url.slice(1)));
      res.writeHead(200, { 'Content-Type': url.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8',
        'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
        'Referrer-Policy':'no-referrer', 'Content-Length':data.length });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404); res.end(); }
  });
}
if (require.main === module) {
  const server = createServer(); server.requestTimeout = 3000; server.headersTimeout = 3000;
  server.listen(8123,'127.0.0.1',()=>console.log('Open Stars bridge: http://127.0.0.1:8123/index.html'));
}
module.exports = { createServer };
