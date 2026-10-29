'use strict';
const { MODEL } = require('./dialogue-adapter.cjs');
async function connect({ load = async name => import(name), directory = require('node:path').resolve(__dirname, '..') } = {}) {
  const [{ OpenCode }, { Service }] = await Promise.all([load('@opencode/client'), load('@opencode/client/service')]);
  const endpoint = await Service.discover();
  if (!endpoint) return null;
  const client = OpenCode.make({ baseUrl: endpoint.url, headers: Service.headers(endpoint) });
  const catalog = await client.model.list({ location: { directory }, types: ['chat'] });
  const model = catalog.data.find(item => item.providerID === MODEL.providerID && item.id === MODEL.id);
  if (!model || !model.enabled || model.status !== 'active' || !model.cost?.some(cost => cost.input === 0 && cost.output === 0)) return null;
  return async ({ prompt, signal }) => client.experimental.generate.text({ prompt, model: MODEL }, { signal });
}
module.exports = { connect };
