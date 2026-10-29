'use strict';
// Local companion server. CLI is deliberately OFFLINE, even when keys exist in env.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createAdapter } = require('./dialogue-adapter.cjs');
const ROOT = path.resolve(__dirname, '..');
const ASSETS = Object.freeze({
  '/p2-harness.html': ['tools/p2-harness.html', 'text/html; charset=utf-8'],
  '/gameplay/encounter.js': ['src/gameplay/encounter.js', 'text/javascript'],
  '/gameplay/dialogue.js': ['src/gameplay/dialogue.js', 'text/javascript'],
  '/gameplay/runtime.js': ['src/gameplay/runtime.js', 'text/javascript'],
});
function createServer({ adapter = createAdapter(), port = 8124 } = {}) {
  let count = 0;
  return http.createServer(async (req, res) => {
    const host = `127.0.0.1:${port}`;
    const origins = [`http://${host}`, 'http://127.0.0.1:8123'];
    if (req.headers.host !== host || (req.headers.origin && !origins.includes(req.headers.origin))) {
      res.writeHead(403); res.end(); return;
    }
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': req.headers.origin || origins[0], Vary: 'Origin' };
    const reply = (status, body) => { res.writeHead(status, { ...headers, 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && ASSETS[req.url]) {
      const [file, type] = ASSETS[req.url];
      try { const bytes = await fs.readFile(path.join(ROOT, file)); res.writeHead(200, { ...headers, 'Content-Type': type }); res.end(bytes); }
      catch { reply(404, { error: 'missing-asset' }); } return;
    }
    if (req.url !== '/api/dialogue') { reply(404, { error: 'not-found' }); return; }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(); return;
    }
    if (req.method !== 'POST') { reply(405, { error: 'method' }); return; }
    if (!req.headers['content-type']?.startsWith('application/json')) { reply(415, { error: 'content-type' }); return; }
    if (++count > 128) { reply(429, { error: 'local-request-limit' }); req.resume(); return; }
    let size = 0; const chunks = [];
    try {
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 4096) { reply(413, { error: 'body-limit' }); return; }
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      reply(200, await adapter.respond(body));
    } catch { if (!res.headersSent) reply(400, { error: 'invalid-json' }); }
  });
}
if (require.main === module) {
  const server = createServer();
  server.requestTimeout = 3000; server.headersTimeout = 3000;
  server.listen(8124, '127.0.0.1', () => console.log('P2 offline companion: http://127.0.0.1:8124/p2-harness.html'));
}
module.exports = { createServer };
