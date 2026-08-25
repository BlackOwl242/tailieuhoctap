import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new', args: ['--no-sandbox'],
});
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
const errs = [];
pg.on('pageerror', (e) => errs.push(String(e).slice(0, 2000)));
pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 2000)); });

const t = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@demo.local', password: 'Admin@123' }),
}).then((r) => r.json());
const me = await fetch('http://localhost:3001/api/v1/auth/me', { headers: { Authorization: `Bearer ${t.accessToken}` } }).then((r) => r.json());

await pg.goto('http://localhost:3005/login', { waitUntil: 'networkidle0' });
await pg.evaluate((a) => localStorage.setItem('kms-auth', JSON.stringify({ state: a, version: 0 })),
  { accessToken: t.accessToken, refreshToken: t.refreshToken, user: me });
await pg.goto('http://localhost:3005/employees/08aa5822-fd3c-4d8d-b771-9006809fa2be', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 3000));
console.log('URL:', pg.url());
console.log('=== ERRORS ===');
for (const e of errs) console.log(e, '\n---');
await b.close();
