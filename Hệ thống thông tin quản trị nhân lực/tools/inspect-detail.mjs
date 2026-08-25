const t = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@demo.local', password: 'Admin@123' }),
}).then((r) => r.json());
const d = await fetch('http://localhost:3001/api/v1/employees/08aa5822-fd3c-4d8d-b771-9006809fa2be', {
  headers: { Authorization: `Bearer ${t.accessToken}` },
}).then((r) => r.json());
for (const [k, v] of Object.entries(d)) {
  if (v !== null && typeof v === 'object') console.log(k, '=', JSON.stringify(v).slice(0, 150));
}
console.log('--- scalars ---');
for (const [k, v] of Object.entries(d)) {
  if (v === null || typeof v !== 'object') console.log(k, '=', JSON.stringify(v));
}
