import http from 'node:http';
import { readFile, writeFile, mkdir, rename, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// Read secrets only on the server. Never return process.env or upstream credentials.
try {
  const text = await readFile(path.join(ROOT, '.env'), 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
} catch (e) { if (e.code !== 'ENOENT') throw e; }
const DATA = path.join(ROOT, 'data');
const MODELS = path.join(DATA, 'models');
const WEB_MODELS = path.join(MODELS, 'web');
await mkdir(WEB_MODELS, { recursive: true });
const jobs = new Map();
try {
  const saved = JSON.parse(await readFile(path.join(DATA, 'generations.json'), 'utf8'));
  for (const job of saved) jobs.set(job.id, job);
} catch (e) { if (e.code !== 'ENOENT') throw new Error('Cannot load data/generations.json: ' + e.message); }
let saveChain = Promise.resolve();
function persist() {
  saveChain = saveChain.catch(() => {}).then(async () => {
    const temp = path.join(DATA, 'generations.json.tmp');
    await writeFile(temp, JSON.stringify([...jobs.values()], null, 2));
    await rename(temp, path.join(DATA, 'generations.json'));
  });
  return saveChain;
}
async function audit(event, detail = {}) {
  const { appendFile } = await import('node:fs/promises');
  await appendFile(path.join(DATA, 'audit.jsonl'), JSON.stringify({ at: new Date().toISOString(), event, ...detail }) + '\n');
}
const digest = buffer => createHash('sha256').update(buffer).digest('hex');
/** Older cached jobs predate checksumming; fill in the evidence without touching the model bytes. */
async function backfillAssets() {
  let changed = false;
  for (const j of jobs.values()) {
    if (!j.cached) continue;
    const ext = j.ext || 'glb';
    const file = path.join(MODELS, `${j.id}.${ext}`);
    try {
      const [buffer, info] = await Promise.all([readFile(file), stat(file)]);
      if (j.bytes !== buffer.length) { j.bytes = buffer.length; changed = true; }
      if (!j.sha256) { j.sha256 = digest(buffer); changed = true; }
      if (!j.cachedAt) { j.cachedAt = info.mtime.toISOString(); changed = true; }
    } catch { /* a missing cache file is reported by modelUrl checks, not by startup */ }
  }
  if (changed) await persist();
}
function fail(status, code, message) { return Object.assign(new Error(message), { status, code }); }
function configured() { return Boolean(process.env.LUX3D_API_KEY?.trim()); }
function requireConfig() {
  if (!configured()) throw fail(503, 'LUX3D_NOT_CONFIGURED', '请在服务器 .env 设置 LUX3D_API_KEY 并重启服务。当前没有接通生成服务。');
}
function base() {
  const url = new URL(process.env.LUX3D_BASE_URL || 'https://api.aholo3d.cn');
  if (url.protocol !== 'https:' || url.username || url.password) throw fail(503, 'INVALID_CONFIGURATION', 'LUX3D_BASE_URL 必须为可信 HTTPS API 地址。');
  return url.origin;
}
async function upstream(endpoint, body) {
  requireConfig();
  let res;
  try {
    res = await fetch(base() + endpoint, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: process.env.LUX3D_API_KEY, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'error', signal: AbortSignal.timeout(45000),
    });
  } catch { throw fail(502, 'UPSTREAM_UNREACHABLE', 'Lux3D 请求超时或网络不可达；创建请求不会自动重试，以避免重复扣费。'); }
  let payload;
  try { payload = await res.json(); } catch { throw fail(502, 'INVALID_UPSTREAM_RESPONSE', 'Lux3D 未返回合法 JSON。'); }
  if (!res.ok || String(payload.c) !== '0') {
    // Do not relay raw upstream messages, which may contain request details or secrets.
    const code = String(payload.c || res.status);
    await audit('upstream_error', { endpoint: endpoint.split('?')[0], httpStatus: res.status, upstreamCode: code.slice(0, 120) });
    throw fail(res.status === 401 || res.status === 403 ? 502 : res.status === 429 || code.includes('CONCURRENCY') ? 429 : 502,
      'LUX3D_UPSTREAM_ERROR', `Lux3D 拒绝请求（HTTP ${res.status}，代码 ${code.replace(/[^\w.-]/g, '').slice(0, 80)}）。请检查服务器凭据、额度或并发限制。`);
  }
  return payload.d;
}
const statuses = { 0: 'queued', 1: 'processing', 3: 'succeeded', 4: 'failed', 6: 'cancelled' };
export function planInstrument(question) {
  const concepts = [
    [/影子|shadow/i, '影子限长器', 'an upright open brass annular measuring frame on an oval base, one sliding stop, a central fine pointer and a small crank'],
    [/哈欠|困|睡|yawn|sleep/i, '哈欠收集瓶', 'a squat ivory enamel pressure vessel with a wide flared brass funnel, a curved neck, a side bellows and one round pressure gauge'],
    [/咖啡|coffee/i, '咖啡回温引擎', 'a miniature horizontal copper boiler on two short feet, an integrated cup cradle, three curved brass cooling fins and one oversized rotary dial'],
    [/灰尘|dust/i, '灰尘编目机', 'a low rectangular brass cabinet with six tiny drawer fronts, a translucent collection dome, a short intake trumpet and a side hand wheel'],
    [/时间|拖延|迟到|time|late/i, '时间折叠仪', 'a tilted sculptural hourglass cage between two ivory triangular plates, a spiral brass axle and a large asymmetrical side lever on a compact plinth'],
    [/周一|星期一|monday/i, '周一缓冲器', 'a chunky ivory tabletop shock absorber with three stacked brass accordion bellows, two curved support arms, a red enamel release button and a heavy rounded base'],
  ];
  const found = concepts.find(([pattern]) => pattern.test(question));
  return found ? { title: found[1], brief: found[2] } : { title: null, brief: 'invent a distinct tangible mechanical solution tailored to the human problem, with a clear functional metaphor, one coherent connected silhouette, an expressive main mechanism, a stable base and one tactile adjustment control; choose your own silhouette rather than a generic ring' };
}
function publicJob(j) {
  const ext = j.ext || 'glb';
  return { id: j.id, prompt: j.prompt, question: j.question || j.prompt, title: j.title || '荒诞科学仪器', status: j.status, createdAt: j.createdAt, updatedAt: j.updatedAt,
    provider: 'Aholo Lux3D', version: j.version, officialTaskId: j.taskId, modelUrl: j.cached ? `/models/${j.id}.${ext}` : null,
    kind: j.kind || 'text-to-3d', parentId: j.parentId || null, variant: j.variant || null, faceCount: j.faceCount || null, enablePbr: j.enablePbr ?? null, style: j.style || null,
    assetBytes: j.bytes || null, assetSha256: j.sha256 || null, cachedAt: j.cachedAt || null,
    downloadUrl: j.outputs?.some(u => /\.zip(?:\?|$)/i.test(u)) ? `/api/generations/${j.id}/download?format=zip` : j.cached ? `/api/generations/${j.id}/download?format=glb` : null,
    error: j.error || null, pollAfterMs: 6000, cached: Boolean(j.cached) };
}
function safeAsset(value) {
  let u; try { u = new URL(value); } catch { throw fail(502, 'INVALID_ASSET_URL', '官方任务未返回有效模型 URL。'); }
  const allowed = (process.env.LUX3D_ASSET_HOSTS || 'kujiale.com,coohom.com,aholo3d.cn,myqcloud.com').split(',').map(s => s.trim()).filter(Boolean);
  if (u.protocol !== 'https:' || u.username || u.password || u.port && u.port !== '443' || !allowed.some(h => u.hostname === h || u.hostname.endsWith('.' + h))) {
    throw fail(502, 'ASSET_HOST_NOT_ALLOWED', '官方产物域名不在服务器允许列表；请核实后配置 LUX3D_ASSET_HOSTS。');
  }
  return u;
}
async function downloadAsset(url) {
  const res = await fetch(safeAsset(url), { redirect: 'error', signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw fail(502, 'ASSET_DOWNLOAD_FAILED', '模型下载失败，可能是官方临时 URL 已过期。');
  const limit = 180 * 1024 * 1024;
  if (Number(res.headers.get('content-length')) > limit) { await res.body?.cancel(); throw fail(502, 'ASSET_TOO_LARGE', '模型超出 180MB 下载限制。'); }
  const chunks = []; let total = 0;
  for await (const chunk of res.body) {
    total += chunk.length;
    if (total > limit) { await res.body.cancel().catch(() => {}); throw fail(502, 'ASSET_TOO_LARGE', '模型超出 180MB 下载限制。'); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
const refreshing = new Map();
async function refresh(j) {
  if (refreshing.has(j.id)) return refreshing.get(j.id);
  const task = (async () => {
    if (j.cached || ['failed', 'cancelled'].includes(j.status)) return;
    if (Date.now() - (j.lastChecked || 0) < 5000) return;
    j.lastChecked = Date.now();
    const d = await upstream('/lux3d/v1/generate/task/get?taskid=' + encodeURIComponent(j.taskId));
    if (!d || !Object.hasOwn(statuses, d.status)) throw fail(502, 'UNKNOWN_UPSTREAM_STATUS', 'Lux3D 返回未知状态，未标记成功。');
    const previous = j.status;
    j.status = statuses[d.status];
    j.updatedAt = new Date().toISOString();
    j.error = null;
    j.outputs = (Array.isArray(d.outputs) ? d.outputs : []).map(o => o?.content).filter(u => typeof u === 'string' && /^https:\/\//.test(u));
    if (j.status === 'succeeded') {
      const model = j.kind === 'animation' ? j.outputs[0] : j.outputs.find(u => /\.glb(?:\?|$)/i.test(u));
      if (!model) j.error = j.kind === 'animation' ? '任务成功，但没有返回动画结果文件。' : '任务成功，但没有可预览的 GLB 产物。';
      else if (j.kind === 'animation') {
        // Official docs: the result file format is "whatever the result is", so detect it from the bytes.
        try {
          const buffer = await downloadAsset(model);
          const ext = buffer.toString('ascii', 0, 4) === 'glTF' ? 'glb' : buffer[0] === 0x50 && buffer[1] === 0x4b ? 'zip' : null;
          if (!ext) throw fail(502, 'UNKNOWN_ANIMATION_FORMAT', '动画结果既不是 GLB 也不是 ZIP，未缓存。');
          await writeFile(path.join(MODELS, `${j.id}.${ext}`), buffer);
          j.cached = true; j.ext = ext; j.error = null;
          j.bytes = buffer.length; j.sha256 = digest(buffer); j.cachedAt = new Date().toISOString();
          await audit('model_cached', { id: j.id, taskId: j.taskId, bytes: buffer.length, ext, kind: 'animation', sha256: j.sha256 });
        } catch (e) { j.error = e.message; }
      }
      else {
        try {
          const buffer = await downloadAsset(model);
          if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'glTF') throw fail(502, 'INVALID_GLB', '模型内容不是有效 GLB。');
          await writeFile(path.join(MODELS, j.id + '.glb'), buffer);
          j.cached = true; j.error = null;
          j.bytes = buffer.length; j.sha256 = digest(buffer); j.cachedAt = new Date().toISOString();
          await audit('model_cached', { id: j.id, taskId: j.taskId, bytes: buffer.length, sha256: j.sha256 });
        } catch (e) { j.error = e.message; }
      }
    }
    if (j.status === 'failed') j.error = 'Lux3D 任务失败。请调整描述或检查官方任务记录。';
    if (previous !== j.status) await audit('status_changed', { id: j.id, taskId: j.taskId, status: j.status });
    await persist();
  })().finally(() => refreshing.delete(j.id));
  refreshing.set(j.id, task); return task;
}
let creating = false;
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(data)); }
async function body(req) {
  if (!req.headers['content-type']?.includes('application/json')) throw fail(415, 'JSON_REQUIRED', '请使用 application/json。');
  let text = ''; for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 16384) throw fail(413, 'BODY_TOO_LARGE', '请求体过大。'); }
  try { return JSON.parse(text); } catch { throw fail(400, 'INVALID_JSON', 'JSON 格式错误。'); }
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary', '.json': 'application/json', '.woff2': 'font/woff2' };
async function serveFile(res, file, root, attachment = false, headers = {}) {
  const rootReal = await realpath(root);
  const fileReal = await realpath(file);
  if (!fileReal.startsWith(rootReal + path.sep) || !(await stat(fileReal)).isFile()) throw fail(404, 'NOT_FOUND', '文件不存在。');
  const bytes = await readFile(fileReal);
  res.writeHead(200, { 'Content-Type': mime[path.extname(fileReal)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', ...(attachment ? { 'Content-Disposition': 'attachment; filename="model.glb"' } : {}), ...headers }); res.end(bytes);
}
const LOOPBACK = /^(?:127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/;
function originAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  let parsed; try { parsed = new URL(origin); } catch { return false; }
  const host = req.headers.host || '';
  if (parsed.host === host) return true;
  // Explicit allowlist for a tunnel, alternate dev port or a reverse proxy that rewrites Host.
  const configured = (process.env.LUX3D_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (configured.includes(origin)) return true;
  // Local Vite dev server: the page runs on 5173 and proxies /api to this loopback server.
  return LOOPBACK.test(host) && LOOPBACK.test(parsed.host) && parsed.protocol === 'http:' && parsed.port === '5173';
}
export const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    // Same-origin requests only. Never expose the credentialled creation endpoint via CORS.
    if (!originAllowed(req)) throw fail(403, 'ORIGIN_REJECTED', '不允许跨站请求。');
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, configured: configured(), provider: 'Aholo Lux3D', adapter: 'official-openapi-v2', pollAfterMs: 6000 });
    if (req.method === 'GET' && url.pathname === '/api/generations') return json(res, 200, { generations: [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicJob) });
    if (req.method === 'GET' && url.pathname === '/api/provenance') {
      const assets = [...jobs.values()].filter(j => j.cached).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(j => ({
        id: j.id, title: j.title || null, question: j.question || j.prompt, taskId: j.taskId, version: j.version, createdAt: j.createdAt, cachedAt: j.cachedAt || null,
        bytes: j.bytes || null, sha256: j.sha256 || null, modelUrl: `/models/${j.id}.${j.ext || 'glb'}`, downloadUrl: publicJob(j).downloadUrl,
      }));
      return json(res, 200, { provider: 'Aholo Lux3D', version: process.env.LUX3D_VERSION || 'G1', adapter: 'official-openapi-v2', generatedAt: new Date().toISOString(),
        totals: { assets: assets.length, originalBytes: assets.reduce((n, a) => n + (a.bytes || 0), 0) }, assets });
    }
    if (req.method === 'POST' && url.pathname === '/api/generations') {
      requireConfig();
      const input = await body(req);
      if (!input || typeof input.prompt !== 'string' || input.prompt.trim().length < 3 || input.prompt.trim().length > 2000) throw fail(400, 'INVALID_PROMPT', '描述须为 3–2000 字符。');
      if (creating || [...jobs.values()].some(j => ['queued', 'processing'].includes(j.status))) throw fail(429, 'GENERATION_IN_PROGRESS', '已有生成任务，请等待完成后再提交。');
      creating = true;
      try {
        if (input.question !== undefined && (typeof input.question !== 'string' || input.question.trim().length > 2000)) throw fail(400, 'INVALID_QUESTION', 'question 须为不超过 2000 字符的文字。');
        if (input.title !== undefined && (typeof input.title !== 'string' || input.title.trim().length > 80)) throw fail(400, 'INVALID_TITLE', 'title 须为不超过 80 字符的文字。');
        const question = input.question?.trim() || input.prompt.trim();
        const plan = planInstrument(question);
        const title = input.title?.trim() || plan.title;
        const shape = plan.brief;
        // Rule-based art direction, not an LLM. Explicit question preserves caller art direction.
        const prompt = input.question?.trim() ? input.prompt.trim() : `Create one whimsical absurd scientific instrument, a museum-quality collectible prop inspired by this human problem: ${JSON.stringify(question)}. Specific design: ${shape}. Antique brushed brass, warm ivory enamel, subtle dark patina, physically based materials. The instrument should feel poetic, curious and delightfully impractical. One connected freestanding object only, full object visible, centered, isolated, no room, no environment, no floor plane, no human, no text, no lettering, no logos, no floating disconnected parts. High quality watertight 3D mesh suitable for an interactive browser exhibit.`;
        const version = process.env.LUX3D_VERSION || 'G1';
        if (!['G1', 'G1-Turbo'].includes(version)) throw fail(503, 'INVALID_CONFIGURATION', 'LUX3D_VERSION 只能是 G1 或 G1-Turbo。');
        const id = randomUUID();
        await audit('create_requested', { id, question, title, prompt, version });
        const request = { prompt, style: 'photorealistic', version, faceCount: 100000, outputFormat: ['zip', 'glb'], enablePbr: true };
        const taskId = await upstream('/lux3d/v1/generate/text-to-3d/task/create', request);
        if (!/^\d+$/.test(String(taskId))) throw fail(502, 'INVALID_TASK_ID', 'Lux3D 未返回有效任务 ID。');
        const now = new Date().toISOString();
        const j = { id, taskId: String(taskId), prompt, question, title, version, status: 'queued', createdAt: now, updatedAt: now, outputs: [] };
        jobs.set(id, j); await persist(); await audit('task_created', { id, taskId: j.taskId, request });
        return json(res, 202, publicJob(j));
      } finally { creating = false; }
    }
    const match = url.pathname.match(/^\/api\/generations\/([a-f0-9-]{36})(\/download)?$/);
    if (req.method === 'GET' && match) {
      const j = jobs.get(match[1]); if (!j) throw fail(404, 'GENERATION_NOT_FOUND', '本地没有此生成记录。');
      await refresh(j);
      if (!match[2]) return json(res, 200, publicJob(j));
      if (url.searchParams.get('format') === 'zip') {
        const source = j.outputs.find(u => /\.zip(?:\?|$)/i.test(u));
        if (!source) throw fail(409, 'MODEL_NOT_READY', 'ZIP 模型尚未就绪。');
        const bytes = await downloadAsset(source); res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="lux3d-model.zip"' }); return res.end(bytes);
      }
      if (!j.cached) throw fail(409, 'MODEL_NOT_READY', 'GLB 模型尚未就绪。');
      return await serveFile(res, path.join(MODELS, j.id + '.' + (j.ext || 'glb')), MODELS, true, { 'Cache-Control': 'no-store' });
    }
    const model = url.pathname.match(/^\/models\/([a-f0-9-]{36})\.glb$/);
    if (req.method === 'GET' && model) {
      // The authoritative Lux3D GLB is kept for download; the lighter web derivative is what the
      // browser streams. Cache is immutable because every file name is a generation UUID.
      const web = path.join(WEB_MODELS, model[1] + '.glb');
      let file = path.join(MODELS, model[1] + '.glb');
      try { if ((await stat(web)).isFile()) file = web; } catch {}
      return await serveFile(res, file, MODELS, false, { 'Cache-Control': 'public, max-age=31536000, immutable' });
    }
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/models/')) throw fail(404, 'NOT_FOUND', '接口不存在。');
    if (req.method !== 'GET' && req.method !== 'HEAD') throw fail(405, 'METHOD_NOT_ALLOWED', '请求方法不支持。');
    const dist = path.join(ROOT, 'dist');
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some(s => s.startsWith('.'))) throw fail(404, 'NOT_FOUND', '文件不存在。');
    const target = decoded === '/' ? path.join(dist, 'index.html') : path.resolve(dist, '.' + decoded);
    if (!target.startsWith(dist + path.sep) && target !== dist) throw fail(404, 'NOT_FOUND', '文件不存在。');
    try { return await serveFile(res, target, dist); }
    catch (e) { if (e.code !== 'ENOENT' && e.code !== 'EISDIR') throw e; }
    return await serveFile(res, path.join(dist, 'index.html'), dist);
  } catch (e) {
    if (res.headersSent) { res.destroy(); return; }
    json(res, e.status || (e.code === 'ENOENT' ? 404 : 500), { error: { code: e.status ? e.code : 'SERVER_ERROR', message: e.status ? e.message : e.code === 'ENOENT' ? '资源尚未准备好，请先构建前端。' : '服务器处理失败，请检查本地审计记录。' } });
  }
});
const timer = setInterval(() => {
  for (const j of jobs.values()) if (['queued', 'processing'].includes(j.status) || j.status === 'succeeded' && !j.cached) refresh(j).catch(e => { j.error = e.message; persist().catch(() => {}); });
}, 6000);
timer.unref();
backfillAssets().catch(e => console.error('Could not backfill cached asset metadata:', e.message));
server.on('close', () => clearInterval(timer));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(Number(process.env.PORT || 8787), process.env.HOST || '127.0.0.1', () => console.log(`Server listening on http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 8787}; Lux3D ${configured() ? 'configured' : 'NOT CONFIGURED'}`));
}
