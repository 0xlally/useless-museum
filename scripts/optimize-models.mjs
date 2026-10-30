// Build the browser derivative of every cached Lux3D GLB.
// The original file stays authoritative for download and provenance; the web copy is what the
// gallery streams: Meshopt geometry + WebP textures + 1024px maps, typically ~10x smaller.
//
// Usage: node scripts/optimize-models.mjs [--force]
import { readdir, stat, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELS = path.join(ROOT, 'data', 'models');
const WEB = path.join(MODELS, 'web');
const FORCE = process.argv.includes('--force');

await mkdir(WEB, { recursive: true });
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'node_modules', '@gltf-transform', 'cli', 'package.json'), 'utf8'));
const cli = path.join(ROOT, 'node_modules', '@gltf-transform', 'cli', pkg.bin['gltf-transform']);

const sources = (await readdir(MODELS)).filter(f => f.endsWith('.glb'));
if (!sources.length) {
  console.error('No cached GLB found in data/models.');
  process.exit(1);
}

let before = 0, after = 0, built = 0, skipped = 0;
for (const name of sources.sort()) {
  const input = path.join(MODELS, name);
  const output = path.join(WEB, name);
  const src = await stat(input);
  before += src.size;
  if (!FORCE && existsSync(output) && (await stat(output)).mtimeMs >= src.mtimeMs) {
    after += (await stat(output)).size;
    skipped++;
    continue;
  }
  const run = spawnSync(process.execPath, [cli, 'optimize', input, output,
    '--compress', 'meshopt', '--simplify', 'false',
    '--texture-compress', 'webp', '--texture-size', '1024'], { stdio: 'inherit' });
  if (run.status !== 0 || !existsSync(output)) {
    console.error('FAILED to optimize', name);
    process.exit(1);
  }
  const out = await stat(output);
  after += out.size;
  built++;
  console.log(`${name}: ${(src.size / 1048576).toFixed(2)} MB -> ${(out.size / 1024).toFixed(0)} KB`);
}
console.log(`\nweb derivatives: ${built} built, ${skipped} up to date; ${(before / 1048576).toFixed(2)} MB -> ${(after / 1048576).toFixed(2)} MB total.`);
