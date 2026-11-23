type EmployeeCodeDb = {
  user: {
    findMany: (args: {
      where: { employeeCode: { startsWith: string } };
      select: { employeeCode: true };
    }) => Promise<Array<{ employeeCode: string | null }>>;
    findUnique: (args: {
      where: { employeeCode: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
  setting?: {
    findMany: (args: {
      where: { key: { in: string[] } };
    }) => Promise<Array<{ key: string; value: unknown }>>;
  };
};

/** Sinh mã nhân viên tuần tự duy nhất (mặc định NV0001...) theo cấu hình hệ thống. */
export async function generateNextEmployeeCode(db: EmployeeCodeDb): Promise<string> {
  let prefix = 'NV';
  let padding = 4;
  if (db.setting?.findMany) {
    const settings = await db.setting.findMany({
      where: { key: { in: ['EMPLOYEE_CODE_PREFIX', 'EMPLOYEE_CODE_PADDING'] } },
    });
    for (const s of settings) {
      if (s.key === 'EMPLOYEE_CODE_PREFIX' && typeof s.value === 'string' && /^[A-Z0-9_-]{1,10}$/i.test(s.value.trim())) {
        prefix = s.value.trim().toUpperCase();
      }
      if (s.key === 'EMPLOYEE_CODE_PADDING' && typeof s.value === 'number' && Number.isInteger(s.value) && s.value >= 3 && s.value <= 8) {
        padding = s.value;
      }
    }
  }

  const rows = await db.user.findMany({
    where: { employeeCode: { startsWith: prefix } },
    select: { employeeCode: true },
  });
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^${escapedPrefix}(\\d+)$`, 'i');
  let maxNum = 0;
  for (const row of rows) {
    const match = row.employeeCode?.match(pattern);
    if (!match) continue;
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num > maxNum) maxNum = num;
  }
  let n = maxNum + 1;
  for (;;) {
    const code = `${prefix}${String(n).padStart(padding, '0')}`;
    const dup = await db.user.findUnique({ where: { employeeCode: code }, select: { id: true } });
    if (!dup) return code;
    n += 1;
  }
}
