// Verify every cached Lux3D asset and emit the provenance ledger used by the report and demo.
// Reads: data/generations.json, data/models/<id>.glb (+ optional web derivative).
// Writes: data/provenance.json. Exits non-zero if a claimed asset is missing or malformed.
//
// Usage: node scripts/verify-assets.mjs
import { readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'data', 'models');

function inspectGlb(buffer) {
  if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF') throw new Error('not a binary glTF file');
  const version = buffer.readUInt32LE(4);
  const jsonLength = buffer.readUInt32LE(12);
  const chunkType = buffer.toString('ascii', 16, 20);
  if (chunkType !== 'JSON') throw new Error('first chunk is not JSON');
  const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString('utf8'));
  let triangles = 0;
  for (const mesh of json.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const accessor = json.accessors?.[primitive.indices];
      if (accessor) triangles += Math.round(accessor.count / 3);
    }
  }
  return {
    version,
    generator: json.asset?.generator || null,
    extensions: json.extensionsUsed || [],
    materials: (json.materials || []).length,
    images: (json.images || []).length,
    triangles,
  };
}

const generations = JSON.parse(await readFile(path.join(ROOT, 'data', 'generations.json'), 'utf8'));
const assets = [];
const problems = [];

for (const job of generations) {
  if (job.status !== 'succeeded' || !job.cached) continue;
  const ext = job.ext || 'glb';
  const file = path.join(MODELS, `${job.id}.${ext}`);
  try {
    const buffer = await readFile(file);
    const info = inspectGlb(buffer);
    const sha256 = createHash('sha256').update(buffer).digest('hex');
    if (job.sha256 && job.sha256 !== sha256) problems.push(`${job.id}: cached file no longer matches the recorded SHA-256`);
    let webBytes = null;
    try { webBytes = (await stat(path.join(MODELS, 'web', `${job.id}.glb`))).size; } catch {}
    assets.push({
      id: job.id,
      taskId: job.taskId,
      title: job.title || null,
      question: job.question || job.prompt,
      version: job.version || 'G1',
      createdAt: job.createdAt,
      cachedAt: job.cachedAt || null,
      bytes: buffer.length,
      webBytes,
      sha256,
      ...info,
      modelUrl: `/models/${job.id}.${ext}`,
    });
  } catch (error) {
    problems.push(`${job.id}: ${error.message}`);
  }
}

const totals = {
  assets: assets.length,
  originalBytes: assets.reduce((n, a) => n + a.bytes, 0),
  webBytes: assets.reduce((n, a) => n + (a.webBytes || 0), 0),
  triangles: assets.reduce((n, a) => n + a.triangles, 0),
};

const ledger = {
  generatedAt: new Date().toISOString(),
  provider: 'Aholo Lux3D',
  adapter: 'official-openapi-v2',
  version: generations.find(j => j.cached)?.version || 'G1',
  totals,
  assets,
  problems,
};
await writeFile(path.join(ROOT, 'data', 'provenance.json'), JSON.stringify(ledger, null, 2) + '\n');

for (const asset of assets) {
  console.log(`#${asset.taskId}  ${asset.title || asset.id}  ${(asset.bytes / 1048576).toFixed(2)} MB -> ${asset.webBytes ? (asset.webBytes / 1024).toFixed(0) + ' KB' : '—'}  ${asset.triangles.toLocaleString('en-US')} tris  ${asset.sha256.slice(0, 16)}…`);
}
console.log(`\n${totals.assets} verified assets · ${(totals.originalBytes / 1048576).toFixed(2)} MB original · ${(totals.webBytes / 1048576).toFixed(2)} MB web · ${totals.triangles.toLocaleString('en-US')} triangles`);
if (problems.length) {
  console.error('\nPROBLEMS:\n- ' + problems.join('\n- '));
  process.exit(1);
}
