// Batch A: replace the five procedural exhibits with real Lux3D text-to-3D assets.
// Sequential on purpose (the service allows one active task). Never retries a create call, so a flaky
// network cannot silently double-charge the account. Usage: node scripts/gen-batch-a.mjs [--dry]
import { exhibits } from '../src/exhibits.js';

const API = process.env.API || 'http://127.0.0.1:8787';
const DRY = process.argv.includes('--dry');
const TAIL = 'Standalone museum collectible, physically coherent, one connected freestanding object only, full object visible, centered, isolated, no room, no environment, no floor plane, no human, no text, no lettering, no logos, no floating disconnected parts, antique brushed brass and warm ivory enamel, subtle dark patina, PBR materials, high quality watertight mesh.';

const BRIEFS = {
  yawn: 'A single absurd precision laboratory instrument, a yawn preservation vessel: a tall cylindrical frosted-glass jar with a polished brass lid and a small brass knob on top, a brass valve wheel on a short side pipe, thin ivory enamel gasket rings seated around the lower body, on a round brass base.',
  coffee: 'A single absurd precision instrument, a post-cooling coffee armor: a cream ceramic coffee cup wrapped in three stacked polished copper armor bands, a thick ivory handle, a dark coffee surface visible at the rim, standing on a small round brass base.',
  dust: 'A single absurd precision instrument, a dust queue organizer: a low rectangular ivory enamel base carrying a row of seven thin upright brass comb fins, tiny dark dust specks lined up in neat rows between the fins, a small brass gantry arm spanning over it.',
  wait: 'A single absurd precision instrument, an almost-there chronometer: a large round brass-rimmed ivory dial with twelve dark tick marks and one dark hand, mounted on a slim vertical brass post, standing on a round brass base.',
  monday: 'A single absurd precision instrument, a Monday pause apparatus: a chunky industrial desk button, an octagonal brass base carrying a large red enamel push button and two small ivory pins, heavy rounded proportions.',
};

const todo = Object.keys(BRIEFS).map(kind => {
  const ex = exhibits.find(e => e.kind === kind);
  if (!ex) throw new Error('no exhibit with kind ' + kind);
  return { kind, name: ex.name, question: ex.question, prompt: `${BRIEFS[kind]} ${TAIL}` };
});

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

async function api(path, init) {
  const res = await fetch(API + path, { signal: AbortSignal.timeout(30000), ...init });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

for (const t of todo) if (t.prompt.length > 2000) throw new Error('prompt too long for ' + t.kind);
if (DRY) {
  for (const t of todo) log('DRY', t.kind, t.name, '|', t.question, '| prompt chars', t.prompt.length);
  process.exit(0);
}

const existing = (await api('/api/generations')).body.generations || [];
for (const t of todo) {
  const have = existing.find(j => j.question === t.question && j.status === 'succeeded' && j.modelUrl);
  if (have) { log('SKIP (already generated)', t.kind, have.officialTaskId); continue; }
  if (existing.some(j => j.question === t.question && ['queued', 'processing'].includes(j.status))) { log('STOP: a task for', t.kind, 'is already running; not creating a duplicate'); process.exit(2); }

  log('CREATE', t.kind, t.name);
  const created = await api('/api/generations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: t.prompt, question: t.question, title: t.name }) });
  if (created.status !== 202) { log('STOP: create failed', created.status, JSON.stringify(created.body.error || created.body)); process.exit(1); }
  const id = created.body.id;
  log('  task', created.body.officialTaskId, 'local id', id);

  const t0 = Date.now();
  for (;;) {
    await sleep(8000);
    let r;
    try { r = await api('/api/generations/' + id); } catch (e) { log('  poll error (will retry poll, not create):', e.message); continue; }
    const j = r.body;
    if (j.status === 'succeeded' && j.modelUrl) { log('  DONE', t.kind, 'in', Math.round((Date.now() - t0) / 1000) + 's', j.modelUrl); break; }
    if (['failed', 'cancelled'].includes(j.status)) { log('STOP: task', j.status, j.error || ''); process.exit(1); }
    if (Date.now() - t0 > 20 * 60 * 1000) { log('STOP: timed out after 20 min, task', created.body.officialTaskId, 'still', j.status); process.exit(3); }
  }
}
log('BATCH A COMPLETE');
