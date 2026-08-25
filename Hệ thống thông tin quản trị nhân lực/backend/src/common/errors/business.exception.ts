import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain error carrying a stable machine-readable `code` so the frontend can
 * map it to a friendly Vietnamese message without parsing strings.
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    // Nhận cả số nguyên (ví dụ 423 Locked) ngoài các giá trị enum HttpStatus
    status: number = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super(message, status);
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  FORBIDDEN: 'FORBIDDEN',
  SPACE_FORBIDDEN: 'SPACE_FORBIDDEN',
  SPACE_ROLE_REQUIRED: 'SPACE_ROLE_REQUIRED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  SLUG_EXISTS: 'SLUG_EXISTS',
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  QR_TOKEN_INVALID: 'QR_TOKEN_INVALID',
  QR_TOKEN_EXPIRED: 'QR_TOKEN_EXPIRED',
  ALREADY_CHECKED_IN: 'ALREADY_CHECKED_IN',
  FACE_NOT_ENROLLED: 'FACE_NOT_ENROLLED',
  FACE_NOT_MATCHED: 'FACE_NOT_MATCHED',
  FACE_CONSENT_REQUIRED: 'FACE_CONSENT_REQUIRED',
  DEVICE_SIGNATURE_INVALID: 'DEVICE_SIGNATURE_INVALID',
  CSV_PARSE_ERROR: 'CSV_PARSE_ERROR',
  HANDOVER_NOT_CLOSABLE: 'HANDOVER_NOT_CLOSABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
