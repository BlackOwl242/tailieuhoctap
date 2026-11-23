import { createHash } from 'node:crypto';

export interface AuditHashInput {
  prevHash?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  requestId?: string | null;
  createdAt: Date | string;
}

export interface AuditChainRow extends AuditHashInput {
  id: bigint | number | string;
  entryHash?: string | null;
}

export interface AuditChainVerifyResult {
  valid: boolean;
  totalRows: number;
  chainedRows: number;
  legacyRows: number;
  brokenAtId: string | null;
  reason?: string;
  latestHash: string | null;
}

function toUtcIsoMs(createdAt: Date | string): string {
  return (createdAt instanceof Date ? createdAt : new Date(createdAt)).toISOString();
}

/**
 * Tính mã băm SHA-256 theo chuỗi chuẩn hóa trùng khớp 1:1 với trigger PostgreSQL `audit_logs_chain_insert`.
 */
export function computeAuditEntryHash(input: AuditHashInput): string {
  const payload = [
    input.prevHash || 'GENESIS',
    input.actorId ?? '',
    input.action,
    input.entityType,
    input.entityId ?? '',
    input.requestId ?? '',
    toUtcIsoMs(input.createdAt),
  ].join('|');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

/** Kiểm chứng tính toàn vẹn chuỗi băm nhật ký kiểm toán SOX/ISO 27001. */
export function verifyAuditChain(rows: AuditChainRow[]): AuditChainVerifyResult {
  let legacyRows = 0;
  let chainedRows = 0;
  let expectedPrev = 'GENESIS';
  let latestHash: string | null = null;

  for (const row of rows) {
    if (!row.entryHash) {
      if (chainedRows > 0) {
        return {
          valid: false,
          totalRows: rows.length,
          chainedRows,
          legacyRows,
          brokenAtId: String(row.id),
          reason: 'Bản ghi thiếu entryHash xuất hiện sau khi chuỗi băm đã bắt đầu',
          latestHash,
        };
      }
      legacyRows += 1;
      continue;
    }

    chainedRows += 1;
    if ((row.prevHash || 'GENESIS') !== expectedPrev) {
      return {
        valid: false,
        totalRows: rows.length,
        chainedRows,
        legacyRows,
        brokenAtId: String(row.id),
        reason: 'prevHash không khớp với bản ghi liền trước',
        latestHash,
      };
    }

    const expectedHash = computeAuditEntryHash(row);
    if (row.entryHash !== expectedHash) {
      return {
        valid: false,
        totalRows: rows.length,
        chainedRows,
        legacyRows,
        brokenAtId: String(row.id),
        reason: 'entryHash không khớp nội dung bản ghi (nghi ngờ bị chỉnh sửa trực tiếp)',
        latestHash,
      };
    }

    expectedPrev = row.entryHash;
    latestHash = row.entryHash;
  }

  return {
    valid: true,
    totalRows: rows.length,
    chainedRows,
    legacyRows,
    brokenAtId: null,
    latestHash,
  };
}
