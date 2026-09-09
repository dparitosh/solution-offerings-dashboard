import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const command = process.argv[2] || 'dev';
const targets = {
  dev: ['../node_modules/vite/bin/vite.js', '--port', '3000', '--host', '127.0.0.1'],
  build: ['../node_modules/vite/bin/vite.js', 'build'],
  preview: ['../node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1'],
  lint: ['../node_modules/typescript/bin/tsc', '--noEmit'],
  test: ['./test.cjs'],
};
if (!targets[command]) throw new Error(`Unknown command: ${command}`);
const [target, ...args] = targets[command];
const child = spawn(process.execPath, [fileURLToPath(new URL(target, import.meta.url)), ...args, ...process.argv.slice(3)], { stdio: 'inherit', shell: false });
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
