const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = __dirname;

const services = [
  {
    name: 'client',
    label: 'Client site',
    cwd: path.join(rootDir, 'Client', 'server'),
    entry: 'server.js',
    url: 'http://localhost:3000'
  },
  {
    name: 'admin',
    label: 'Admin panel',
    cwd: path.join(rootDir, 'admin', 'server'),
    entry: 'server.js',
    url: 'http://localhost:3001'
  }
];

const requiredDependencyDirs = [
  path.join(rootDir, 'shared', 'node_modules')
];

const colors = {
  client: '\x1b[36m',
  admin: '\x1b[35m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateService(service) {
  const entryPath = path.join(service.cwd, service.entry);
  const packagePath = path.join(service.cwd, 'package.json');
  const modulesPath = path.join(service.cwd, 'node_modules');

  if (!fs.existsSync(packagePath)) {
    throw new Error(`${service.label}: package.json not found at ${packagePath}`);
  }

  if (!fs.existsSync(entryPath)) {
    throw new Error(`${service.label}: entry file not found at ${entryPath}`);
  }

  if (!fs.existsSync(modulesPath)) {
    throw new Error(
      `${service.label}: dependencies are not installed. Run "npm run install:all" from the project root.`
    );
  }
}

function validateSharedDependencies() {
  requiredDependencyDirs.forEach((dependencyDir) => {
    if (!fs.existsSync(dependencyDir)) {
      throw new Error(
        `Shared dependencies are not installed. Run "npm run install:all" from the project root.`
      );
    }
  });
}

function prefixOutput(service, stream, chunk) {
  const lines = chunk.toString().split(/\r?\n/);
  lines.forEach((line) => {
    if (line.trim().length === 0) {
      return;
    }

    stream.write(`${colors[service.name]}[${service.name}]${colors.reset} ${line}\n`);
  });
}

function startService(service) {
  validateService(service);

  const child = spawn(process.execPath, [service.entry], {
    cwd: service.cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.stdout.on('data', (chunk) => prefixOutput(service, process.stdout, chunk));
  child.stderr.on('data', (chunk) => prefixOutput(service, process.stderr, chunk));

  child.on('exit', (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    log(colors.error, `${service.label} stopped unexpectedly. Code: ${code ?? 'none'}, signal: ${signal ?? 'none'}`);
    shutdown(code || 1);
  });

  return child;
}

let isShuttingDown = false;
const children = [];

function shutdown(exitCode = 0) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  log(colors.warn, '\nStopping hotel-website services...');

  children.forEach(({ child }) => {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  });

  setTimeout(() => process.exit(exitCode), 800);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

try {
  log(colors.info, 'Starting hotel-website services...');
  log(colors.warn, 'MongoDB must be running before these servers can connect.');

  validateSharedDependencies();

  services.forEach((service) => {
    const child = startService(service);
    children.push({ service, child });
    log(colors.info, `${service.label}: ${service.url}`);
  });
} catch (error) {
  log(colors.error, `Startup failed: ${error.message}`);
  process.exit(1);
}
