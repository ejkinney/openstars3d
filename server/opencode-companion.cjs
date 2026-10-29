'use strict';
const { createAdapter, MODEL } = require('./dialogue-adapter.cjs');
const { connect } = require('./opencode-service.cjs');
const { createServer } = require('./local-server.cjs');
async function start(argv = process.argv.slice(2), { connectImpl = connect, port = 8124, log = console.log } = {}) {
  if (argv.length !== 1 || argv[0] !== '--enable-free-dialogue') throw new Error('Explicit free-dialogue opt-in required.');
  const generateImpl = await connectImpl();
  const adapter = createAdapter({ allowLive: !!generateImpl, generateImpl });
  const server = createServer({ adapter, port });
  server.requestTimeout = 12000; server.headersTimeout = 3000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  log(generateImpl ? `OpenCode companion ready: ${MODEL.providerID}/${MODEL.id}.` : 'OpenCode unavailable; deterministic dialogue fallback active.');
  return { server, adapter, async stop() { adapter.dispose(); await new Promise(resolve => server.close(resolve)); } };
}
if (require.main === module) start().then(session => {
  const stop = () => { void session.stop(); };
  process.once('SIGINT', stop); process.once('SIGTERM', stop);
}).catch(() => { console.error('OpenCode companion could not start.'); process.exitCode = 1; });
module.exports = { start };
