/**
 * Fail-fast environment validation.
 * The API refuses to boot with a missing/weak JWT_SECRET so a demo stack can
 * never silently run in an unsafe mode when deployed for real.
 */
export function validateEnv(env: Record<string, unknown>): void {
  const errors: string[] = [];

  const jwtSecret = String(env.JWT_SECRET ?? '');
  if (!jwtSecret || jwtSecret.length < 32) {
    errors.push(
      'JWT_SECRET is missing or shorter than 32 characters. ' +
        'Provide a strong secret (e.g. `openssl rand -base64 48`) before starting the API.',
    );
  }
  if (!env.DATABASE_URL) {
    errors.push('DATABASE_URL is required.');
  }

  const num = (key: string, fallback: number): number => {
    const raw = env[key];
    if (raw === undefined || raw === '') return fallback;
    const parsed = Number(raw);
    if (Number.isNaN(parsed)) {
      errors.push(`${key} must be a number (got "${String(raw)}").`);
      return fallback;
    }
    return parsed;
  };
  num('PORT', 3001);
  num('UPLOAD_MAX_MB', 10);
  num('QR_TOKEN_TTL_SEC', 30);
  num('FACE_MATCH_THRESHOLD', 0.55);
  num('REFRESH_EXPIRES_IN_DAYS', 7);

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }
}
