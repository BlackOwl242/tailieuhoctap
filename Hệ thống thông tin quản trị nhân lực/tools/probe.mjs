import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  headless: 'new', args: ['--no-sandbox'],
});
const pg = await b.newPage();
await pg.setViewport({ width: 1440, height: 900 });
pg.on('response', (r) => {
  if (r.url().includes('/api/')) console.log('API', r.status(), r.request().method(), r.url().replace('http://localhost:8080', ''));
});
pg.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 200)); });
const t = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@demo.local', password: 'Admin@123' }),
}).then((r) => r.json());
const me = await fetch('http://localhost:3001/api/v1/auth/me', { headers: { Authorization: `Bearer ${t.accessToken}` } }).then((r) => r.json());
await pg.goto('http://localhost:8080/login', { waitUntil: 'networkidle0' });
await pg.evaluate((a) => localStorage.setItem('kms-auth', JSON.stringify({ state: a, version: 0 })),
  { accessToken: t.accessToken, refreshToken: t.refreshToken, user: me });
await pg.goto('http://localhost:8080/employees', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 2500));
const txt = await pg.evaluate(() => document.body.innerText.slice(0, 500));
console.log('URL:', pg.url());
console.log('BODY:', txt.replace(/\n/g, ' | '));
const stored = await pg.evaluate(() => localStorage.getItem('kms-auth')?.slice(0, 120));
console.log('STORED:', stored);
await b.close();
