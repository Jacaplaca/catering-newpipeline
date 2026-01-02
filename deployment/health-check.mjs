#!/usr/bin/env node
import http from 'http';

// Pobieramy port z ENV, jeśli brak - domyślnie 3000
const PORT = process.env.PORT || 3000;
// Next.js w Dockerze często słucha na 0.0.0.0 lub localhost
const HOST = process.env.HOST || '127.0.0.1';
const TIMEOUT = 3000;

// Sprawdzamy czy uruchomiono z flagą --debug
const isDebug = process.argv.includes('--debug');

const options = {
  host: HOST,
  port: PORT,
  path: '/', // Możesz zmienić na /api/health jeśli masz taki endpoint
  method: 'GET',
  timeout: TIMEOUT
};

if (isDebug) {
  console.log('--- HEALTH CHECK DEBUG ---');
  console.log(`Target: http://${HOST}:${PORT}/`);
  console.log('ENV PORT:', process.env.PORT);
  console.log('Effective PORT:', PORT);
}

const req = http.request(options, (res) => {
  if (isDebug) {
    console.log(`Response Status: ${res.statusCode}`);
  }

  if (res.statusCode === 200) {
    if (isDebug) console.log('Check PASSED');
    process.exit(0);
  } else {
    console.error(`Health check failed: status code ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('timeout', () => {
  console.error(`Health check timeout (${TIMEOUT}ms)`);
  req.destroy();
  process.exit(1);
});

req.on('error', (err) => {
  console.error('Health check connection error:', err.message);
  if (isDebug) {
    console.error('Full Error:', err);
  }
  process.exit(1);
});

req.end();