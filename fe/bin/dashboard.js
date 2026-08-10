#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import open from 'open';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');

console.log('🚀 Da Profiler Dashboard starting...');
console.log('📍 Frontend will be available at http://localhost:5173');
console.log('');

const vite = spawn('npx', ['vite', '--port', '5173', '--host'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
  env: { 
    ...process.env, 
    BROWSER: 'none' 
  }
});

// Open browser after brief delay
setTimeout(() => {
  open('http://localhost:5173').catch(() => {
    console.log('⚠️  Could not open browser automatically. Please open http://localhost:5173 manually.');
  });
}, 2000);

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Da Profiler Dashboard...');
  vite.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  vite.kill();
  process.exit(0);
});

vite.on('error', (err) => {
  console.error('❌ Failed to start Vite:', err.message);
  process.exit(1);
});

vite.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Vite process exited with code ${code}`);
    process.exit(code || 1);
  }
});