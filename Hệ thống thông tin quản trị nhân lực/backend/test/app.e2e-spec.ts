import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E smoke — chạy khi có PostgreSQL thật:
 *   RUN_E2E=1 DATABASE_URL=... npm run test:e2e
 * Phủ 4 luồng P0: health → đăng nhập → luồng duyệt bài → tìm kiếm.
 */
const RUN = process.env.RUN_E2E === '1';
(RUN ? describe : describe.skip)('KMS API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let pmToken: string;
  let spaceId: string;
  let articleId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it('GET /healthz → 200', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/healthz').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /auth/login sai mật khẩu → 401 có cấu trúc lỗi', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@demo.local', password: 'wrong-password' })
      .expect(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.requestId).toBeDefined();
  });

  it('POST /auth/login đúng → access token cho ADMIN và PM', async () => {
    const admin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@demo.local', password: process.env.SEED_ADMIN_PW || 'Admin@123' })
      .expect(200);
    adminToken = admin.body.accessToken;

    const pm = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'pm.java@demo.local', password: process.env.SEED_PM_PW || 'Pm@123456' })
      .expect(200);
    pmToken = pm.body.accessToken;
    expect(pm.body.tokenType).toBe('Bearer');
  });

  it('PM tạo bài viết DRAFT trong Space của mình', async () => {
    const spaces = await request(app.getHttpServer())
      .get('/api/v1/spaces')
      .set('Authorization', `Bearer ${pmToken}`)
      .expect(200);
    const target =
      spaces.body.items.find((s: { slug: string }) => s.slug === 'devops-runbook') ?? spaces.body.items[0];
    spaceId = target.id;

    const created = await request(app.getHttpServer())
      .post(`/api/v1/spaces/${spaceId}/articles`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ title: 'Bài e2e kiểm thử luồng duyệt', contentMd: '# Nội dung e2e\nTừ khóa duy nhất: e2e-runbook-xyz.' })
      .expect(201);
    articleId = created.body.id;
    expect(created.body.status).toBe('DRAFT');
  });

  it('Luồng duyệt: submit → approve → PUBLISHED, tìm thấy bằng search', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/submit`)
      .set('Authorization', `Bearer ${pmToken}`)
      .expect(201);

    // ADMIN là MANAGER mọi Space → được duyệt
    await request(app.getHttpServer())
      .post(`/api/v1/articles/${articleId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE' })
      .expect(201);

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/articles/${articleId}`)
      .set('Authorization', `Bearer ${pmToken}`)
      .expect(200);
    expect(detail.body.status).toBe('PUBLISHED');

    const search = await request(app.getHttpServer())
      .get('/api/v1/search?q=e2e-runbook-xyz')
      .set('Authorization', `Bearer ${pmToken}`)
      .expect(200);
    expect(search.body.items.some((i: { id: string }) => i.id === articleId)).toBe(true);
  });

  it('RBAC: USER thường không được gọi route ADMIN', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${pmToken}`)
      .expect(403);
  });
});
