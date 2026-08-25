/* eslint-disable */
/**
 * Bộ mô phỏng máy chấm công — sinh sự kiện MACHINE cho N ngày gần nhất
 * (bỏ cuối tuần), có chủ đích tạo bản ghi lệch (thiếu giờ ra) và đi muộn
 * để hàng đợi xử lý lệch có dữ liệu thật khi demo.
 * Cách chạy: node scripts/simulate-device.cjs [số_ngày]
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const days = Number(process.argv[2] || 14);

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function minuteToDate(day, minutes) {
  const x = new Date(day);
  x.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return x;
}

async function main() {
  let sim = await prisma.attendanceDevice.findFirst({ where: { type: 'SIMULATOR' } });
  if (!sim) {
    const admin = await prisma.user.findFirst({ where: { roles: { some: { roleCode: 'ADMIN' } } } });
    sim = await prisma.attendanceDevice.create({ data: { name: 'Simulator', type: 'SIMULATOR', createdById: admin.id } });
  }
  const users = await prisma.user.findMany({ where: { deletedAt: null, status: 'ACTIVE' }, select: { id: true } });
  const base = startOfDay(new Date());
  let created = 0;

  for (let d = days; d >= 1; d--) {
    const date = new Date(base); date.setDate(base.getDate() - d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    for (const u of users) {
      const exists = await prisma.attendanceEvent.count({
        where: { userId: u.id, occurredAt: { gte: date, lt: new Date(date.getTime() + 86400000) } },
      });
      if (exists > 0) continue;
      const lateMin = Math.random() < 0.3 ? Math.floor(Math.random() * 20) : 0;
      await prisma.attendanceEvent.create({ data: { userId: u.id, deviceId: sim.id, source: 'MACHINE', occurredAt: minuteToDate(date, 480 + lateMin), payload: { punch: 'IN' } } });
      created++;
      if (Math.random() > 0.05) {
        await prisma.attendanceEvent.create({ data: { userId: u.id, deviceId: sim.id, source: 'MACHINE', occurredAt: minuteToDate(date, 1050 + Math.floor(Math.random() * 45)), payload: { punch: 'OUT' } } });
        created++;
      }
    }
  }
  // Tổng hợp lại bảng công toàn bộ người dùng trong khoảng đã sinh
  for (const u of users) {
    for (let d = days; d >= 1; d--) {
      const date = startOfDay(new Date(base.getTime() - d * 86400000));
      await aggregateDay(u.id, date);
    }
  }
  console.log(`[simulate] created ${created} events for ${users.length} users over ${days} days`);
}

/** Tổng hợp công một ngày (mirror logic của backend service). */
async function aggregateDay(userId, dayStart) {
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const events = await prisma.attendanceEvent.findMany({
    where: { userId, occurredAt: { gte: dayStart, lt: dayEnd } },
    orderBy: { occurredAt: 'asc' },
  });
  const mins = (x) => x.getHours() * 60 + x.getMinutes();
  let firstIn = null; let lastOut = null;
  for (const e of events) {
    const punch = (e.payload && e.payload.punch) || (mins(e.occurredAt) < 720 ? 'IN' : 'OUT');
    if (punch === 'IN') firstIn = firstIn || e.occurredAt; else lastOut = e.occurredAt;
  }
  const late = firstIn ? Math.max(0, mins(firstIn) - 480) : 0;
  const early = lastOut ? Math.max(0, 1050 - mins(lastOut)) : 0;
  const worked = firstIn && lastOut ? Math.max(0, Math.round((lastOut - firstIn) / 60000)) : 0;
  let status = 'PRESENT';
  if (events.length % 2 !== 0) status = 'MISSING_PAIR';
  else if (late > 0) status = 'LATE';
  else if (early > 15) status = 'EARLY_LEAVE';
  await prisma.attendanceDay.upsert({
    where: { userId_workDate: { userId, workDate: dayStart } },
    create: { userId, workDate: dayStart, firstInAt: firstIn, lastOutAt: lastOut, workedMinutes: worked, lateMinutes: late, earlyMinutes: early, status, eventCount: events.length },
    update: { firstInAt: firstIn, lastOutAt: lastOut, workedMinutes: worked, lateMinutes: late, earlyMinutes: early, status, eventCount: events.length },
  });
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
