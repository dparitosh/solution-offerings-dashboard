import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export function installOptions(args) {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (!['--port', '--host'].includes(args[i])) throw new Error(`Unknown option: ${args[i]}. Use --port 3000 --host 127.0.0.1.`);
    const key = args[i].slice(2), value = args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${key}.`);
    options[key] = key === 'port' ? Number(value) : value;
  }
  if (options.port !== undefined && (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535)) throw new Error('Port must be between 1 and 65535.');
  if (options.host !== undefined && (!options.host.trim() || /[\s/\\]/.test(options.host))) throw new Error('Host must be a hostname or IP address.');
  return options;
}

export function install(args = process.argv.slice(2)) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Install Node.js 22 or newer (including npm), then run install.cmd again.');
  const options = installOptions(args);
  const configPath = path.join(root, 'runtime.config.json');
  const previous = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const config = { port: 3000, host: '127.0.0.1', ...previous, ...options };
  const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  const run = (program, argv) => {
    const result = spawnSync(program, argv, { cwd: root, stdio: 'inherit', shell: false });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Installation stopped: ${argv.join(' ')} exited with code ${result.status}.`);
  };
  console.log('Installing locked dependencies...');
  if (fs.existsSync(npmCli)) run(process.execPath, [npmCli, 'ci', '--no-fund']);
  else if (process.platform !== 'win32') run('npm', ['ci', '--no-fund']);
  else throw new Error('npm was not found beside Node.js. Reinstall Node.js with its npm component.');
  for (const command of ['test', 'lint', 'build']) run(process.execPath, [path.join(root, 'scripts/run.mjs'), command]);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log(`Installation complete. Run start.cmd (or npm start).\nConfigured address: ${config.host}:${config.port}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { install(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
