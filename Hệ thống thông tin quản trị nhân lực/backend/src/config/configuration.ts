export interface AppConfig {
  env: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshExpiresInDays: number;
  corsOrigin: string;
  uploadDir: string;
  uploadMaxMb: number;
  logLevel: string;
  seedOnFirstRun: boolean;
  defaultAdminEmail: string;
  defaultAdminPassword: string;
  qrTokenTtlSec: number;
  faceEmbeddingKey: string;
  faceMatchThreshold: number;
  attendanceWorkStart: string;
  attendanceWorkEnd: string;
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV || 'production',
  port: Number(process.env.PORT || 3001),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresInDays: Number(process.env.REFRESH_EXPIRES_IN_DAYS || 7),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || '/app/uploads',
  uploadMaxMb: Number(process.env.UPLOAD_MAX_MB || 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  seedOnFirstRun: (process.env.SEED_ON_FIRST_RUN || 'true') === 'true',
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@demo.local',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123',
  qrTokenTtlSec: Number(process.env.QR_TOKEN_TTL_SEC || 30),
  faceEmbeddingKey: process.env.FACE_EMBEDDING_KEY || '',
  faceMatchThreshold: Number(process.env.FACE_MATCH_THRESHOLD || 0.55),
  attendanceWorkStart: process.env.ATTENDANCE_WORK_START || '08:00',
  attendanceWorkEnd: process.env.ATTENDANCE_WORK_END || '17:30',
});
