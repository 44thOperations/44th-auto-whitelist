// Read-only check: asks the whitelister API for the clan list and reports
// whether the donator clan exists and has an available group assigned.
require('fs');
const path = require('path');
const src = require('fs').readFileSync(path.join(__dirname, 'index.js'), 'utf8');

const KEY = process.env.API_KEY || src.match(/API_KEY \|\| '([^']+)/)[1];
const BASE = process.env.BASE_URL || (src.match(/BASE_URL \|\| '([^']+)/) || [])[1];
const CLAN = src.match(/DONATOR_GROUP_ID = '([^']+)/)[1];

(async () => {
  console.log('API:', BASE);
  console.log('Looking for clan:', CLAN);
  const r = await fetch(`${BASE}/whitelist/read/getAllClans?apiKey=${encodeURIComponent(KEY)}`);
  console.log('HTTP', r.status);
  const t = await r.text();
  let d;
  try { d = JSON.parse(t); } catch { return console.log('Not JSON:', t.slice(0, 500)); }
  if (!Array.isArray(d)) return console.log('Unexpected response:', JSON.stringify(d).slice(0, 500));
  const c = d.find(x => x._id === CLAN);
  if (!c) {
    console.log('Clan NOT found. Clans available:');
    d.forEach(x => console.log(' ', x._id, x.full_name || x.tag, 'groups:', JSON.stringify(x.available_groups)));
    return;
  }
  console.log('Clan found:', c.full_name || c.tag);
  console.log('available_groups:', JSON.stringify(c.available_groups));
})().catch(e => console.log('Request failed:', e.message, e.cause ? `(${e.cause.code || e.cause.message})` : ''));
