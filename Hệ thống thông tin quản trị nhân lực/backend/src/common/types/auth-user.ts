import type * as express from 'express';

/** Người dùng đã xác thực gắn vào request bởi JwtAuthGuard */
export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  roles: string[];
}

/** Request có thêm user (đã đăng nhập) và requestId (để truy vết log/audit) */
export type AuthedRequest = express.Request & { user?: AuthUser; requestId?: string };
