import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

export function readConfig(env = process.env, configPath = path.join(projectRoot, 'runtime.config.json')) {
  const saved = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const port = Number(env.PORT ?? saved.port ?? 3000);
  const host = env.HOST ?? saved.host ?? '127.0.0.1';
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  if (typeof host !== 'string' || !host.trim() || /[\s/\\]/.test(host)) throw new Error('HOST must be a hostname or IP address.');
  return { port, host };
}

export function createAppServer(distPath = path.join(projectRoot, 'dist')) {
  if (!fs.existsSync(path.join(distPath, 'index.html'))) throw new Error('Built app missing. Run install.cmd or npm run build first.');
  const root = fs.realpathSync(distPath);
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    const fail = (code, message) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(req.method === 'HEAD' ? undefined : message); };
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); fail(405, 'Method not allowed'); return; }
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname.includes('\0') || pathname.includes('\\')) { fail(400, 'Invalid path'); return; }
      if (pathname === '/health') {
        const body = JSON.stringify({ status: 'ok', app: 'solution-offerings-dashboard' });
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
        res.end(req.method === 'HEAD' ? undefined : body); return;
      }
      let file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!file.startsWith(root + path.sep)) { fail(403, 'Forbidden'); return; }
      if (!fs.existsSync(file) && !path.extname(pathname)) file = path.join(root, 'index.html');
      if (!fs.existsSync(file)) { fail(404, 'Not found'); return; }
      file = await fs.promises.realpath(file);
      if (!file.startsWith(root + path.sep)) { fail(403, 'Forbidden'); return; }
      const stat = await fs.promises.stat(file);
      if (!stat.isFile()) { fail(404, 'Not found'); return; }
      const etag = `"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache');
      res.setHeader('Content-Type', mime[path.extname(file).toLowerCase()] || 'application/octet-stream');
      res.setHeader('Accept-Ranges', 'bytes');
      if (req.headers['if-none-match'] === etag && !req.headers.range) { res.writeHead(304); res.end(); return; }
      let start = 0, end = stat.size - 1, code = 200;
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        if (!match || (!match[1] && !match[2]) || stat.size === 0) { res.setHeader('Content-Range', `bytes */${stat.size}`); fail(416, 'Invalid range'); return; }
        if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
        else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) { res.setHeader('Content-Range', `bytes */${stat.size}`); fail(416, 'Invalid range'); return; }
        code = 206;
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      }
      res.setHeader('Content-Length', Math.max(0, end - start + 1));
      res.writeHead(code);
      if (req.method === 'HEAD' || stat.size === 0) { res.end(); return; }
      const stream = fs.createReadStream(file, { start, end });
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch (error) {
      if (!res.headersSent) fail(error instanceof URIError ? 400 : 500, error instanceof URIError ? 'Invalid path' : 'Unable to serve request');
      else res.destroy();
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { port, host } = readConfig();
    const server = createAppServer();
    server.on('error', error => { console.error(`Unable to start dashboard: ${error.message}`); process.exitCode = 1; });
    server.listen(port, host, () => console.log(`Dashboard running at http://${host === '0.0.0.0' ? 'localhost' : host}:${port}\nPress Ctrl+C to stop.`));
    const stop = () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 5000).unref(); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
