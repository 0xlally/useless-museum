import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, copyFile, readFile, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

test('official adapter: configuration errors, create, poll, GLB cache, audit and path protection', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'lux3d-server-test-'));
  const originalKey = process.env.LUX3D_API_KEY;
  const originalBase = process.env.LUX3D_BASE_URL;
  const originalFetch = globalThis.fetch;
  let server;
  try {
    process.env.LUX3D_API_KEY = '';
    process.env.LUX3D_BASE_URL = 'https://api.aholo3d.cn';
    await copyFile(new URL('./server.mjs', import.meta.url), path.join(dir, 'server.mjs'));
    const loaded = await import(pathToFileURL(path.join(dir, 'server.mjs')));
    server = loaded.server;
    const plans = ['影子', '哈欠', '咖啡', '灰尘', '时间', '周一'].map(q => loaded.planInstrument(q));
    assert.equal(new Set(plans.map(p => p.title)).size, 6);
    assert.equal(new Set(plans.map(p => p.brief)).size, 6);
    assert.ok(loaded.planInstrument('键盘总会掉进海里').brief.includes('tailored to the human problem'));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    await mkdir(path.join(dir, 'dist'));
    await writeFile(path.join(dir, 'dist', 'index.html'), '<!doctype html><title>Production homepage</title>');
    const call = (p, init) => originalFetch(base + p, init);
    const post = prompt => call('/api/generations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    const home = await call('/'); assert.equal(home.status, 200); assert.ok((await home.text()).includes('Production homepage'));
    assert.equal((await (await call('/api/health')).json()).configured, false);
    const missing = await post('a brass ring');
    assert.equal(missing.status, 503);
    assert.equal((await missing.json()).error.code, 'LUX3D_NOT_CONFIGURED');
    process.env.LUX3D_API_KEY = 'test-server-secret';
    const glb = Buffer.alloc(12); glb.write('glTF'); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(12, 8);
    let creates = 0;
    globalThis.fetch = async (url, init) => {
      const str = String(url);
      if (str.startsWith('https://api.aholo3d.cn/')) {
        assert.equal(init.headers.Authorization, 'test-server-secret');
        if (str.endsWith('/text-to-3d/task/create')) {
          creates++;
          const body = JSON.parse(init.body);
          assert.equal(body.style, 'photorealistic'); assert.equal(body.version, 'G1');
          assert.deepEqual(body.outputFormat, ['zip', 'glb']);
          return Response.json({ c: '0', d: 123456 });
        }
        assert.ok(str.endsWith('/task/get?taskid=123456'));
        return Response.json({ c: '0', d: { taskId: 123456, status: 3, outputs: [null, { content: null }, { content: 'NOT_REQUESTED' }, { content: 'https://holo-cos.aholo3d.cn/test.zip' }, { content: 'https://holo-cos.aholo3d.cn/test.glb' }] } });
      }
      if (str === 'https://holo-cos.aholo3d.cn/test.glb') { assert.equal(init.headers, undefined); return new Response(glb); }
      return originalFetch(url, init);
    };
    assert.equal((await post(' ')).status, 400);
    const created = await post('a brass ring shadow limiter'); assert.equal(created.status, 202);
    const job = await created.json(); assert.equal(job.status, 'queued'); assert.equal(job.modelUrl, null);
    assert.equal((await post('a duplicate job')).status, 429);
    const result = await (await call('/api/generations/' + job.id)).json();
    assert.equal(result.status, 'succeeded'); assert.equal(result.modelUrl, `/models/${job.id}.glb`);
    assert.equal(Buffer.from(await (await call(result.modelUrl)).arrayBuffer()).toString('ascii', 0, 4), 'glTF');
    assert.equal((await (await call('/api/generations')).json()).generations.length, 1);
    assert.equal((await call('/api/generations/' + job.id, { headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await call('/%2eenv')).status, 404);
    const audit = await readFile(path.join(dir, 'data', 'audit.jsonl'), 'utf8');
    assert.ok(audit.includes('task_created')); assert.ok(audit.includes('model_cached')); assert.ok(!audit.includes('test-server-secret'));
    assert.equal(creates, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (server) await new Promise(resolve => server.close(resolve));
    if (originalKey === undefined) delete process.env.LUX3D_API_KEY; else process.env.LUX3D_API_KEY = originalKey;
    if (originalBase === undefined) delete process.env.LUX3D_BASE_URL; else process.env.LUX3D_BASE_URL = originalBase;
    await rm(dir, { recursive: true, force: true });
  }
});
