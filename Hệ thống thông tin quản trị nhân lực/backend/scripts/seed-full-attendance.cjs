/* eslint-disable */
/**
 * Script seed dữ liệu chấm công đầy đủ cho toàn bộ nhân sự trong tháng 09/2026
 * Đảm bảo số ngày công thực tế sát chuẩn (20-22 ngày / 22 ngày công chuẩn),
 * tránh tình trạng thiếu 14-15 ngày công như dữ liệu test ban đầu.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toDateOnly(year, month, day) {
  // ISO date at UTC midnight for @db.Date column
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return new Date(`${year}-${m}-${d}T00:00:00.000Z`);
}

function timeOnDate(dateOnly, hour, minute) {
  const d = new Date(dateOnly);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('[Seed Attendance] Bắt đầu khởi tạo dữ liệu chấm công tháng 09/2026...');

  let sim = await prisma.attendanceDevice.findFirst({ where: { type: 'SIMULATOR' } });
  if (!sim) {
    const admin = await prisma.user.findFirst({ where: { roles: { some: { roleCode: 'ADMIN' } } } });
    const adminId = admin ? admin.id : 'usr-admin';
    sim = await prisma.attendanceDevice.create({
      data: { name: 'Máy Chấm Công Vân Tay Trụ Sở', type: 'SIMULATOR', createdById: adminId },
    });
  }

  const users = await prisma.user.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    select: { id: true, fullName: true, employeeCode: true },
  });

  console.log(`[Seed Attendance] Tìm thấy ${users.length} nhân viên active.`);

  // Danh sách các ngày làm việc (Thứ 2 - Thứ 6) trong tháng 09/2026:
  // Tháng 9/2026 có 30 ngày. 01/09 là Thứ 3.
  const workDaysInSept = [];
  for (let day = 1; day <= 30; day++) {
    const d = new Date(Date.UTC(2026, 8, day)); // month index 8 is September
    const dow = d.getUTCDay(); // 0 is Sun, 6 is Sat
    if (dow !== 0 && dow !== 6) {
      workDaysInSept.push(day);
    }
  }

  console.log(`[Seed Attendance] Tháng 09/2026 có tổng cộng ${workDaysInSept.length} ngày làm việc (chuẩn 22 công):`, workDaysInSept);

  let totalDaysUpserted = 0;
  let totalEventsCreated = 0;

  for (let i = 0; i < users.length; i++) {
    const u = users[i];

    // Xác định hồ sơ chấm công của nhân viên:
    // 85% nhân viên: Đủ 22/22 công
    // 10% nhân viên: 21/22 công (thiếu 1 ngày do quên chấm công hoặc nghỉ cá nhân)
    // 5% nhân viên: 20/22 công (thiếu 2 ngày)
    let missedDaysCount = 0;
    const hash = (i * 37 + 13) % 100;
    if (hash >= 95) missedDaysCount = 2;
    else if (hash >= 85) missedDaysCount = 1;

    // Chọn ngày bị thiếu (nếu có, không chọn ngày 2/9)
    const missedDaysSet = new Set();
    if (missedDaysCount > 0) {
      const candidates = workDaysInSept.filter(d => d !== 2);
      for (let m = 0; m < missedDaysCount; m++) {
        const pickIdx = (i * 7 + m * 5) % candidates.length;
        missedDaysSet.add(candidates[pickIdx]);
      }
    }

    for (const day of workDaysInSept) {
      const dateOnly = toDateOnly(2026, 9, day);

      // Ngày 02/09: Quốc khánh -> Nghỉ lễ hưởng 100% lương
      if (day === 2) {
        await prisma.attendanceDay.upsert({
          where: { userId_workDate: { userId: u.id, workDate: dateOnly } },
          create: {
            userId: u.id,
            workDate: dateOnly,
            firstInAt: null,
            lastOutAt: null,
            workedMinutes: 480,
            lateMinutes: 0,
            earlyMinutes: 0,
            status: 'HOLIDAY',
            eventCount: 0,
          },
          update: {
            firstInAt: null,
            lastOutAt: null,
            workedMinutes: 480,
            lateMinutes: 0,
            status: 'HOLIDAY',
            eventCount: 0,
          },
        });
        totalDaysUpserted++;
        continue;
      }

      // Nếu là ngày nhân viên vắng không phép (để có tỉ lệ thiếu 1-2 ngày)
      if (missedDaysSet.has(day)) {
        // Tạo trường hợp MISSING_PAIR (chỉ quẹt 1 lần rồi quên quẹt về) hoặc không có quẹt
        const isMissingPair = (day % 2 === 0);
        if (isMissingPair) {
          const inTime = timeOnDate(dateOnly, 8, 10);
          await prisma.attendanceEvent.create({
            data: {
              userId: u.id,
              deviceId: sim.id,
              source: 'MACHINE',
              occurredAt: inTime,
              payload: { punch: 'IN' },
            },
          });
          totalEventsCreated++;

          await prisma.attendanceDay.upsert({
            where: { userId_workDate: { userId: u.id, workDate: dateOnly } },
            create: {
              userId: u.id,
              workDate: dateOnly,
              firstInAt: inTime,
              lastOutAt: null,
              workedMinutes: 0,
              lateMinutes: 10,
              earlyMinutes: 0,
              status: 'MISSING_PAIR',
              eventCount: 1,
            },
            update: {
              firstInAt: inTime,
              lastOutAt: null,
              workedMinutes: 0,
              lateMinutes: 10,
              status: 'MISSING_PAIR',
              eventCount: 1,
            },
          });
          totalDaysUpserted++;
        }
        // Nếu không quẹt thì không tạo attendanceDay hoặc xóa nếu có
        continue;
      }

      // Ngày đi làm bình thường:
      // 5% ngẫu nhiên đi muộn 5-20 phút (status: LATE) nhưng vẫn tính ngày công
      const isLate = ((i * 13 + day * 7) % 20 === 0);
      const lateMinutes = isLate ? 10 + ((i + day) % 15) : 0;
      const inHour = 8;
      const inMin = isLate ? lateMinutes : Math.max(0, 0 - (day % 15)); // đến sớm từ 7:45 - 8:00
      const inTime = isLate ? timeOnDate(dateOnly, inHour, inMin) : timeOnDate(dateOnly, 7, 45 + (day % 15));

      // Giờ về: 17:30 - 18:00
      const outMin = 30 + ((i * 3 + day * 4) % 30);
      const outTime = timeOnDate(dateOnly, 17, outMin);
      const workedMinutes = Math.round((outTime - inTime) / 60000);

      // Tạo các event quẹt thẻ nếu chưa có
      await prisma.attendanceEvent.createMany({
        data: [
          { userId: u.id, deviceId: sim.id, source: 'MACHINE', occurredAt: inTime, payload: { punch: 'IN' } },
          { userId: u.id, deviceId: sim.id, source: 'MACHINE', occurredAt: outTime, payload: { punch: 'OUT' } },
        ],
      });
      totalEventsCreated += 2;

      await prisma.attendanceDay.upsert({
        where: { userId_workDate: { userId: u.id, workDate: dateOnly } },
        create: {
          userId: u.id,
          workDate: dateOnly,
          firstInAt: inTime,
          lastOutAt: outTime,
          workedMinutes,
          lateMinutes,
          earlyMinutes: 0,
          status: isLate ? 'LATE' : 'PRESENT',
          eventCount: 2,
        },
        update: {
          firstInAt: inTime,
          lastOutAt: outTime,
          workedMinutes,
          lateMinutes,
          earlyMinutes: 0,
          status: isLate ? 'LATE' : 'PRESENT',
          eventCount: 2,
        },
      });
      totalDaysUpserted++;
    }

    if ((i + 1) % 50 === 0 || i === users.length - 1) {
      console.log(`[Seed Attendance] Đã xử lý ${i + 1}/${users.length} nhân viên...`);
    }
  }

  console.log(`[Seed Attendance] HOÀN TẤT:`);
  console.log(`- Đã cập nhật ${totalDaysUpserted} bản ghi công hàng ngày (AttendanceDay)`);
  console.log(`- Đã tạo ${totalEventsCreated} sự kiện quẹt thẻ (AttendanceEvent)`);
}

main()
  .catch((e) => {
    console.error('[Seed Attendance] Lỗi:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
