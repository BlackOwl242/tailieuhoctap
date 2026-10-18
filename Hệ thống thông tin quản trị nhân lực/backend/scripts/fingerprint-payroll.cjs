const { PrismaClient } = require('@prisma/client');
const { createHash } = require('node:crypto');
const { writeFileSync } = require('node:fs');
const prisma = new PrismaClient();
(async () => {
 const fingerprints = {};
 for (const model of ['hrmsPayrollRun', 'hrmsPayrollSlip', 'payrollPeriod', 'payslip']) {
   const rows = await prisma[model].findMany({ orderBy: { id: 'asc' } });
   fingerprints[model] = { count: rows.length, sha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex') };
 }
 if (process.argv[2]) writeFileSync(process.argv[2], JSON.stringify(fingerprints, null, 2));
 console.log(JSON.stringify(fingerprints));
})().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
