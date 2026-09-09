import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createAppServer, readConfig } from '../server/index.mjs';
import { installOptions } from '../scripts/install.mjs';

test('Node server serves React, health, assets and video ranges', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dashboard-server-test-'));
  const dist = path.join(temp, 'dist'); fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), '<html>Customer dashboard</html>');
  fs.writeFileSync(path.join(dist, 'assets', 'app-abc.js'), 'const app = true;');
  fs.writeFileSync(path.join(dist, 'demo.mp4'), Buffer.from('0123456789'));
  fs.writeFileSync(path.join(temp, 'secret.txt'), 'must not be served');
  const server = createAppServer(dist);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.match(await (await fetch(url)).text(), /Customer dashboard/);
    assert.equal((await (await fetch(`${url}/health`)).json()).status, 'ok');
    const head = await fetch(url, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
    const asset = await fetch(`${url}/assets/app-abc.js`); assert.match(asset.headers.get('content-type'), /javascript/); assert.match(asset.headers.get('cache-control'), /immutable/);
    assert.equal((await fetch(`${url}/assets/app-abc.js`, { headers: { 'If-None-Match': asset.headers.get('etag') } })).status, 304);
    const range = await fetch(`${url}/demo.mp4`, { headers: { Range: 'bytes=2-5' } }); assert.equal(range.status, 206); assert.equal(await range.text(), '2345'); assert.equal(range.headers.get('content-range'), 'bytes 2-5/10');
    assert.equal(await (await fetch(`${url}/demo.mp4`, { headers: { Range: 'bytes=-2' } })).text(), '89');
    assert.equal((await fetch(`${url}/demo.mp4`, { headers: { Range: 'bytes=100-' } })).status, 416);
    assert.equal((await fetch(`${url}/assets/missing.js`)).status, 404);
    assert.equal((await fetch(`${url}/%2e%2e%2fsecret.txt`)).status, 403);
    assert.equal((await fetch(`${url}/%GG`)).status, 400);
    assert.equal((await fetch(url, { method: 'POST' })).status, 405);
    assert.match(await (await fetch(`${url}/dashboard`)).text(), /Customer dashboard/);
  } finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    const resolved = fs.realpathSync(temp);
    if (resolved.startsWith(fs.realpathSync(os.tmpdir()) + path.sep) && path.basename(resolved).startsWith('dashboard-server-test-')) fs.rmSync(resolved, { recursive: true });
  }
});
test('Installer and server configuration reject invalid ports', () => {
  assert.deepEqual(installOptions(['--port', '8080', '--host', '0.0.0.0']), { port: 8080, host: '0.0.0.0' });
  assert.throws(() => installOptions(['--port', '70000']));
  assert.throws(() => installOptions(['--host']));
  assert.throws(() => installOptions(['--unknown', 'x']));
  assert.throws(() => readConfig({ PORT: 'bad' }, path.join(os.tmpdir(), 'nonexistent-dashboard-config.json')));
});
