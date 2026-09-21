async function main() {
  const accounts = [
    { email: 'ceo@saigontechnology.vn', pw: 'Admin@123', expectedRole: 'BOD' },
    { email: 'chairman@saigontechnology.vn', pw: 'Admin@123', expectedRole: 'SHAREHOLDER' },
    { email: 'admin@demo.local', pw: 'Admin@123', expectedRole: 'ADMIN' },
    { email: 'km.manager@demo.local', pw: 'Manager@123', expectedRole: 'KM_MANAGER' },
  ];

  for (const acc of accounts) {
    try {
      const res = await fetch('http://localhost:3001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.pw }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`✗ Login FAIL for ${acc.email}:`, data);
        continue;
      }

      // Check me profile
      const meRes = await fetch('http://localhost:3001/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      const me = await meRes.json();
      console.log(`✓ Login SUCCESS: ${acc.email} | Name: ${me.fullName} | Job: ${me.jobTitle} | Roles:`, me.roles);
    } catch (e) {
      console.error(`Error for ${acc.email}:`, e.message);
    }
  }
}

main();
