/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Seed dữ liệu demo — chạy MỘT LẦN khi database còn trống (SEED_ON_FIRST_RUN).
 * Toàn bộ quá trình nằm trong MỘT transaction kèm advisory lock:
 * - không bao giờ để lại dữ liệu nửa vững nếu gián đoạn giữa chừng;
 * - hai tiến trình seed chạy song song cũng không xung đột nhau.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Khóa tư vấn cấp transaction — chặn hai bản seed chạy đồng thời
  await prisma.$executeRawUnsafe(`SELECT pg_advisory_lock(727101)`);
  try {
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0 && !process.argv.includes('--force')) {
      console.log(`[seed] Database already has ${existingUsers} users — skipping.`);
      return;
    }

    console.log('[seed] Seeding demo data...');
    await prisma.$transaction(async (tx) => {
      // Dọn sạch mọi bảng nghiệp vụ (phòng khi lần trước bị ngắt giữa chừng)
      await tx.$executeRawUnsafe(`TRUNCATE TABLE
        "attendance_corrections","attendance_days","attendance_events","attendance_devices",
        "face_embeddings","handover_items","handover_checklists",
        "onboarding_item_progress","onboarding_assignments","onboarding_path_items","onboarding_paths",
        "bookmarks","space_follows","article_views","reactions","comments","article_reviews",
        "attachments","article_tags","tags","categories","article_versions","articles",
        "space_members","spaces","audit_logs","notifications","settings",
        "refresh_tokens","user_roles","roles","users","org_units" CASCADE`);

      const passwordHash = await bcrypt.hash('Admin@123', 12);
      const hashOf = (pw) => bcrypt.hashSync(pw, 12);

      // ---------------------------------------------------------------- tổ chức
      const bod = await tx.orgUnit.create({ data: { name: 'Ban Giám đốc', code: 'BGD' } });
      const hr = await tx.orgUnit.create({ data: { name: 'Ban Tổ chức – Hành chính – Nhân sự', code: 'TC-HC-NS', parentId: bod.id, path: `/${bod.id}/` } });
      for (const [i, name] of ['Tổ Tuyển dụng', 'Tổ Hồ sơ & Hợp đồng', 'Tổ Tiền lương – Bảo hiểm', 'Tổ Hành chính – Văn thư'].entries()) {
        await tx.orgUnit.create({ data: { name, code: `HR-${i + 1}`, parentId: hr.id, path: `/${bod.id}/${hr.id}/`, sortOrder: i } });
      }
      const delivery = await tx.orgUnit.create({ data: { name: 'Khối Chuyển giao Dự án', code: 'DELIVERY', parentId: bod.id, path: `/${bod.id}/` } });
      let javaSquadId = null;
      for (const city of ['TP.HCM', 'Đà Nẵng']) {
        const center = await tx.orgUnit.create({ data: { name: `Trung tâm ${city}`, code: `DEV-${city === 'TP.HCM' ? 'SGN' : 'DAD'}`, parentId: delivery.id, path: `/${bod.id}/${delivery.id}/` } });
        let i = 0;
        for (const squad of ['Nhóm Java', 'Nhóm .NET', 'Nhóm PHP/NodeJS', 'Nhóm Ứng dụng di động', 'Nhóm Kiểm thử', 'Nhóm DevOps']) {
          i++;
          const sq = await tx.orgUnit.create({ data: { name: `${squad} (${city})`, code: `SQ-${city === 'TP.HCM' ? 'S' : 'D'}${i}`, parentId: center.id, path: `/${bod.id}/${delivery.id}/${center.id}/`, sortOrder: i } });
          if (city === 'TP.HCM' && squad === 'Nhóm Java') javaSquadId = sq.id;
        }
      }

      // ---------------------------------------------------------------- vai trò
      await tx.role.createMany({
        data: [
          { code: 'ADMIN', name: 'Quản trị viên', description: 'Toàn quyền quản trị hệ thống: Cấu hình tham số, phân quyền vai trò RBAC, cơ cấu tổ chức và nhật ký kiểm toán.' },
          { code: 'KM_MANAGER', name: 'Cán bộ Nhân sự', description: 'Chủ trì các phân hệ nghiệp vụ: Hồ sơ nhân sự, Hợp đồng, Chấm công, Tiền lương, Tuyển dụng và Báo cáo BLLĐ.' },
          { code: 'USER', name: 'Nhân viên', description: 'Cổng tự phục vụ ESS: Chấm công, nộp đơn phép/OT, tra cứu phiếu lương và sơ đồ tổ chức.' },
        ],
        skipDuplicates: true,
      });

      // ---------------------------------------------------------------- người dùng
      // (kèm hồ sơ nhân sự HRMIS: mã NV, ngày vào, trạng thái, lương cơ bản)
      const admin = await tx.user.create({
        data: {
          email: 'admin@demo.local', passwordHash, fullName: 'Nguyễn Hoàng Nam',
          jobTitle: 'Quản trị hệ thống', orgUnitId: bod.id,
          employeeCode: 'NV0001', hireDate: new Date('2019-03-01'), employmentStatus: 'ACTIVE', baseSalary: 35000000,
          roles: { create: [{ roleCode: 'ADMIN' }] },
        },
      });
      const km = await tx.user.create({
        data: {
          email: 'km.manager@demo.local', passwordHash: hashOf('Manager@123'), fullName: 'Võ Thị Thanh Hà',
          jobTitle: 'Chuyên viên chính Ban TC-HC-NS', orgUnitId: hr.id,
          employeeCode: 'NV0002', hireDate: new Date('2018-06-11'), employmentStatus: 'ACTIVE', baseSalary: 32000000,
          expertise: ['quy-trình', 'chính-sách', 'onboarding'],
          roles: { create: [{ roleCode: 'KM_MANAGER' }] },
        },
      });
      const pm = await tx.user.create({
        data: {
          email: 'pm.java@demo.local', passwordHash: hashOf('Pm@123456'), fullName: 'Lê Minh Tuấn',
          jobTitle: 'Trưởng nhóm Java', orgUnitId: javaSquadId,
          employeeCode: 'NV0003', hireDate: new Date('2020-09-14'), employmentStatus: 'ACTIVE', baseSalary: 40000000,
          expertise: ['java', 'spring', 'fintech'],
          roles: { create: [{ roleCode: 'USER' }] },
        },
      });
      const fresher = await tx.user.create({
        data: {
          email: 'dev.fresher@demo.local', passwordHash: hashOf('Fresher@123'), fullName: 'Đỗ Gia Hân',
          jobTitle: 'Lập trình viên Java (Fresher)', orgUnitId: javaSquadId,
          employeeCode: 'NV0004', hireDate: new Date(Date.now() - 45 * 86400000), employmentStatus: 'PROBATION', baseSalary: 12000000,
          expertise: ['java'],
          roles: { create: [{ roleCode: 'USER' }] },
        },
      });
      const editor = await tx.user.create({
        data: {
          email: 'editor.qa@demo.local', passwordHash: hashOf('Editor@123'), fullName: 'Hồ Ngọc Sơn',
          jobTitle: 'Trưởng nhóm Kiểm thử', expertise: ['qa', 'automation'],
          employeeCode: 'NV0005', hireDate: new Date('2021-02-22'), employmentStatus: 'ACTIVE', baseSalary: 30000000,
          roles: { create: [{ roleCode: 'USER' }] },
        },
      });

      // ------------------------------------------------- dữ liệu demo HRMIS (Mục 4)
      const thisYear = new Date().getFullYear();
      await tx.leaveBalance.createMany({
        data: [
          { userId: admin.id, year: thisYear, entitled: 12, used: 2 },
          { userId: km.id, year: thisYear, entitled: 13, used: 5 },
          { userId: pm.id, year: thisYear, entitled: 12, used: 3 },
          { userId: fresher.id, year: thisYear, entitled: 12, used: 0 },
          { userId: editor.id, year: thisYear, entitled: 12, used: 1 },
        ],
      });
      await tx.leaveRequest.create({
        data: {
          userId: fresher.id, type: 'ANNUAL',
          startDate: new Date(thisYear, 11, 24), endDate: new Date(thisYear, 11, 25),
          days: 2, reason: 'Về quê thăm gia đình cuối năm', status: 'PENDING',
        },
      });
      await tx.overtimeRequest.create({
        data: {
          userId: pm.id, workDate: new Date(thisYear, new Date().getMonth(), 15),
          hours: 3, reason: 'Release bản demo cho khách hàng Úc', status: 'APPROVED',
          approverId: km.id, decidedAt: new Date(),
        },
      });
      const requisition = await tx.jobRequisition.create({
        data: {
          title: 'Tuyển 2 Lập trình viên Flutter cho dự án di động', position: 'Lập trình viên Flutter',
          headcount: 2, reason: 'Nhận thêm giai đoạn 2 của dự án cho khách hàng Úc',
          status: 'APPROVED', requestedById: pm.id, decidedById: admin.id, decidedAt: new Date(),
        },
      });
      await tx.candidate.createMany({
        data: [
          { requisitionId: requisition.id, fullName: 'Vũ Công Nghệ', email: 'vutech@example.com', source: 'LinkedIn', stage: 'INTERVIEW', rating: 4 },
          { requisitionId: requisition.id, fullName: 'Đặng Thị Ứng', email: 'dangung@example.com', source: 'VietnamWorks', stage: 'SCREENING' },
          { requisitionId: requisition.id, fullName: 'Hoàng Văn Offer', email: 'hoangoffer@example.com', source: 'Giới thiệu nội bộ', stage: 'OFFER', rating: 5 },
        ],
      });
      await tx.performanceReview.create({
        data: {
          userId: pm.id, reviewerId: km.id, period: `${thisYear}-H1`, score: 88,
          strengths: 'Quản lý tiến độ tốt, giữ chân được nhân sự chủ chốt',
          improvements: 'Cần tăng cường tài liệu hóa kiến trúc dự án',
          status: 'SUBMITTED',
        },
      });
      const course = await tx.trainingCourse.create({
        data: {
          title: 'Chuyển đổi nền tảng NodeJS cho nhóm PHP', description: 'Khóa chuyển đổi 6 tuần theo lộ trình công nghệ',
          startDate: new Date(thisYear, 9, 1), endDate: new Date(thisYear, 10, 15),
          capacity: 12, status: 'ONGOING', createdById: km.id,
        },
      });
      await tx.trainingEnrollment.create({ data: { courseId: course.id, userId: fresher.id, status: 'ENROLLED' } });
      // Tài liệu demo kèm NỘI DUNG thật (xem + tải được ngay — Mục 8)
      const { CONTENT: DOC_CONTENT } = require('./update-doc-content.cjs');
      await tx.hrDocument.createMany({
        data: [
          { title: 'Nội quy lao động 2026', category: 'POLICY', processArea: 'chung', version: '3.1', description: 'Nội quy áp dụng toàn công ty theo BLĐ 2019.', tags: ['nội-quy', 'bắt-buộc'], uploadedById: km.id, contentMd: DOC_CONTENT['Nội quy lao động 2026'] },
          { title: 'Biểu mẫu Đơn xin nghỉ phép', category: 'FORM', processArea: 'chấm công', version: '1.2', description: 'Mẫu đơn nghỉ phép năm / ốm / không lương.', tags: ['biểu-mẫu', 'nghỉ-phép'], uploadedById: km.id, contentMd: DOC_CONTENT['Biểu mẫu Đơn xin nghỉ phép'] },
          { title: 'Quy trình tuyển dụng 9 bước', category: 'PROCESS', processArea: 'tuyển dụng', version: '2.0', description: 'Từ phiếu đề xuất đến hội nhập ba bộ phận.', tags: ['tuyển-dụng', 'quy-trình'], uploadedById: km.id, contentMd: DOC_CONTENT['Quy trình tuyển dụng 9 bước'] },
          { title: 'Quy trình bàn giao công việc khi thôi việc', category: 'PROCESS', processArea: 'biến động nhân sự', version: '1.0', description: 'Checklist 4 xác nhận bắt buộc trước khi phát hành quyết định.', tags: ['bàn-giao', 'thôi-việc'], uploadedById: admin.id, contentMd: DOC_CONTENT['Quy trình bàn giao công việc khi thôi việc'] },
        ],
      });
      await tx.contract.create({
        data: {
          userId: fresher.id, contractNo: `HDTV-${thisYear}-004`, type: 'PROBATION',
          startDate: new Date(Date.now() - 45 * 86400000),
          endDate: new Date(Date.now() + 15 * 86400000),
          baseSalary: 12000000, insuranceSalary: 12000000, createdById: km.id,
        },
      });
      await tx.certificate.create({
        data: {
          userId: pm.id, name: 'AWS Certified Solutions Architect', certNo: 'AWS-SAA-00342',
          issuedBy: 'Amazon Web Services', issuedDate: new Date('2023-05-20'),
          expiryDate: new Date(`${thisYear + 1}-05-20`), storageSpot: 'Tủ A2-03',
        },
      });

      // ---------------------------------------------------------------- danh mục & thẻ
      const catProcess = await tx.category.create({ data: { name: 'Quy trình', slug: 'quy-trinh' } });
      const catTech = await tx.category.create({ data: { name: 'Kỹ thuật', slug: 'ky-thuat' } });
      const catPolicy = await tx.category.create({ data: { name: 'Chính sách', slug: 'chinh-sach' } });
      const tags = {};
      for (const n of ['java', 'dotnet', 'devops', 'qa', 'bảo-mật', 'release']) {
        tags[n] = await tx.tag.create({ data: { name: n, slug: n.toLowerCase().replace(/\s+/g, '-') } });
      }

      // ---------------------------------------------------------------- spaces
      const spaceDefs = [
        { slug: 'quy-trinh-phat-trien', name: 'Quy trình phát triển', visibility: 'PUBLIC', color: '#2563eb', icon: 'git-branch', desc: 'Toàn bộ quy trình làm việc chuẩn của các nhóm dự án.' },
        { slug: 'devops-runbook', name: 'DevOps Runbook', visibility: 'RESTRICTED', color: '#16a34a', icon: 'server', desc: 'Runbook triển khai, vận hành và xử lý sự cố.' },
        { slug: 'chinh-sach-nhan-su', name: 'Chính sách nhân sự', visibility: 'PUBLIC', color: '#9333ea', icon: 'users', desc: 'Nội quy, chế độ đãi ngộ theo pháp luật lao động.' },
        { slug: 'du-an-fintech-au', name: 'Kiến thức dự án — Fintech AU', visibility: 'PRIVATE', color: '#dc2626', icon: 'lock', desc: 'Không gian riêng của dự án Fintech Úc.' },
        { slug: 'qa-kiem-thu', name: 'QA & Kiểm thử', visibility: 'PUBLIC', color: '#ea580c', icon: 'bug', desc: 'Chiến lược kiểm thử và tiêu chí chất lượng.' },
        { slug: 'onboarding', name: 'Onboarding', visibility: 'PUBLIC', color: '#0891b2', icon: 'rocket', desc: 'Mọi thứ nhân viên mới cần đọc trong tuần đầu.' },
      ];
      const spaces = {};
      for (const def of spaceDefs) {
        spaces[def.slug] = await tx.space.create({
          data: {
            slug: def.slug, name: def.name, description: def.desc, icon: def.icon,
            color: def.color, visibility: def.visibility, createdBy: admin.id,
            members: { create: [{ userId: admin.id, spaceRole: 'MANAGER' }, { userId: km.id, spaceRole: 'MANAGER' }] },
          },
        });
      }
      await tx.spaceMember.create({ data: { spaceId: spaces['devops-runbook'].id, userId: pm.id, spaceRole: 'MANAGER' } });
      await tx.spaceMember.create({ data: { spaceId: spaces['devops-runbook'].id, userId: fresher.id, spaceRole: 'VIEWER' } });
      // Một số thành viên đã có sẵn từ khai báo Space ở trên → bỏ qua bản trùng
      await tx.spaceMember.createMany({
        data: [
          { spaceId: spaces['qa-kiem-thu'].id, userId: editor.id, spaceRole: 'MANAGER' },
          { spaceId: spaces['du-an-fintech-au'].id, userId: pm.id, spaceRole: 'MANAGER' },
          { spaceId: spaces['onboarding'].id, userId: km.id, spaceRole: 'MANAGER' },
        ],
        skipDuplicates: true,
      });

      // ---------------------------------------------------------------- bài viết
      let versionSeq = 0;
      async function makeArticle(spaceSlug, authorId, title, summary, contentMd, status, opts = {}) {
        versionSeq++;
        const base = title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 50);
        const publishedAt = status === 'PUBLISHED' || status === 'ARCHIVED'
          ? new Date(Date.now() - Math.floor(Math.random() * 60) * 86_400_000) : null;
        // Bài viết trước (chưa trỏ phiên bản) → tạo v1 → cập nhật con trỏ hiện hành
        const article = await tx.article.create({
          data: {
            spaceId: spaces[spaceSlug].id, authorId, title, slug: `${base}-${versionSeq}`, summary, status,
            categoryId: opts.categoryId ?? null,
            publishedAt, archivedAt: status === 'ARCHIVED' ? new Date() : null,
            viewCount: opts.views ?? Math.floor(Math.random() * 300),
          },
        });
        const version = await tx.articleVersion.create({
          data: {
            articleId: article.id, versionNo: 1, title, contentMd,
            changeNote: 'Tạo ban đầu', authorId,
          },
        });
        await tx.article.update({ where: { id: article.id }, data: { currentVersionId: version.id } });
        for (const name of opts.tagNames ?? []) {
          if (tags[name]) await tx.articleTag.create({ data: { articleId: article.id, tagId: tags[name].id } });
        }
        return article;
      }

      const a1 = await makeArticle('quy-trinh-phat-trien', pm.id, 'Quy trình code review chuẩn', 'Ba bước bắt buộc trước khi merge: tự review, review chéo, PM duyệt.', `# Quy trình code review chuẩn\n\n## 1. Tự review\nTác giả tự kiểm tra trước khi gửi: build xanh, test pass, không log nhạy cảm.\n\n## 2. Review chéo\nÍt nhất **1 đồng nghiệp** duyệt; với module tài chính cần **2 người**.\n\n## 3. PM duyệt\nMerge chỉ khi có dấu duyệt của Trưởng nhóm trên pull request.\n\n> Nguyên tắc: mọi quyết định đều để lại vết trong PR.`, 'PUBLISHED', { categoryId: catProcess.id, tagNames: ['java'], views: 420 });
      const a2 = await makeArticle('devops-runbook', pm.id, 'Runbook triển khai Java lên production', 'Các bước deploy an toàn cho dịch vụ Java trên Kubernetes.', `# Runbook triển khai Java\n\n1. Kiểm tra pipeline CI xanh trên nhánh \`main\`.\n2. Chạy migration cần thiết.\n3. Deploy canary 10% lưu lượng trong 15 phút.\n4. Theo dõi dashboard lỗi < 0.5% rồi mở 100%.\n5. Nếu sự cố: rollback và báo DevOps ngay.\n\n## Checklist sau triển khai\n- [ ] Smoke test API chính\n- [ ] Cảnh báo Sentry im lặng\n- [ ] Ghi chú release vào Space này`, 'PUBLISHED', { categoryId: catTech.id, tagNames: ['java', 'devops', 'release'], views: 610 });
      const a3 = await makeArticle('chinh-sach-nhan-su', km.id, 'Chính sách phép năm theo Bộ luật Lao động 2019', '12 ngày phép/năm, cộng thêm 1 ngày mỗi 5 năm công tác.', `# Chính sách phép năm\n\nTheo **Điều 65 Bộ luật Lao động 2019**:\n\n- Nhân viên làm đủ 12 tháng được **12 ngày phép năm**;\n- Cộng thêm **1 ngày mỗi 5 năm** công tác;\n- Xin phép trên hệ thống, quản lý duyệt, quỹ phép trừ ngay khi duyệt.\n\n## Làm thêm giờ\n150% ngày thường · 200% ngày nghỉ tuần · 300% ngày lễ (Điều 98 BLĐ 2019).`, 'PUBLISHED', { categoryId: catPolicy.id, views: 380 });
      const a4 = await makeArticle('qa-kiem-thu', editor.id, 'Tiêu chí hoàn thành kiểm thử trước release', 'Definition of Done cho hoạt động QA trong dự án.', `# Tiêu chí kiểm thử trước release\n\n- Coverage dòng ≥ **80%** với module core;\n- Không có bug mức Critical/High mở;\n- Regression suite pass 100%;\n- Biên bản kiểm thử được đính kèm vào ticket release.`, 'PUBLISHED', { categoryId: catTech.id, tagNames: ['qa'], views: 250 });
      const a5 = await makeArticle('onboarding', km.id, 'Chào mừng đến với Saigon Technology!', 'Điểm khởi đầu cho mọi nhân viên mới.', `# Chào mừng bạn!\n\nTuần đầu tiên của bạn:\n\n1. Đọc **Quy trình code review chuẩn**;\n2. Cài đặt môi trường theo hướng dẫn trong Space DevOps;\n3. Làm quen mentor trong nhóm dự án;\n4. Hoàn thành lộ trình hội nhập được giao.\n\nCó gì cứ hỏi trong phần bình luận — chúng tôi luôn sẵn sàng giúp!`, 'PUBLISHED', { categoryId: catPolicy.id, views: 500 });
      const a6 = await makeArticle('onboarding', km.id, 'Cài đặt môi trường phát triển Java', 'JDK 21, IntelliJ, Docker và cấu hình repository nội bộ.', `# Cài đặt môi trường Java\n\n\`\`\`bash\nsdk install java 21-tem\nsdk install maven\ndocker compose up -d postgres redis\n\`\`\`\n\nSau đó xin quyền truy cập repository từ bộ phận IT (tự động qua checklist hội nhập).`, 'PUBLISHED', { categoryId: catTech.id, tagNames: ['java'], views: 290 });
      const a7 = await makeArticle('quy-trinh-phat-trien', admin.id, 'Chính sách bảo mật thông tin ISO 27001', 'Cam kết bảo mật của công ty và trách nhiệm cá nhân.', `# Bảo mật ISO 27001\n\n- Không chia sẻ tài khoản cá nhân;\n- Mã hóa dữ liệu khách hàng khi truyền và lưu trữ;\n- Báo cáo sự cố trong vòng 30 phút cho bộ phận bảo mật;\n- Thu hồi toàn bộ quyền truy cập trong ngày làm việc cuối khi nghỉ việc.`, 'PUBLISHED', { categoryId: catPolicy.id, tagNames: ['bảo-mật'], views: 330 });
      await makeArticle('du-an-fintech-au', pm.id, 'Kiến trúc hệ thống thanh toán Fintech AU', 'Tổng quan kiến trúc microservices của dự án (nội bộ dự án).', `# Kiến trúc Fintech AU\n\n> **TÀI LIỆU NỘI BỘ** — chỉ thành viên dự án được xem.\n\n- API Gateway: Kong\n- Payment service: Spring Boot\n- Ledger: PostgreSQL partitioned\n- Sự kiện: Kafka topics per merchant`, 'PUBLISHED', { categoryId: catTech.id, views: 95 });
      await makeArticle('devops-runbook', pm.id, 'Xử lý sự cố Redis cache stampede', 'Bài học từ sự cố 03/2026 và runbook phòng ngừa.', `# Cache stampede — sự cố 03/2026\n\n**Diễn biến:** Redis restart → 40k request/s đổ thẳng vào Postgres.\n\n**Giải pháp áp dụng:**\n1. Request coalescing ở tầng service;\n2. TTL ngẫu nhiên ±10% tránh đồng loạt hết hạn;\n3. Warm-up cache trước giờ cao điểm.`, 'PENDING_REVIEW', { categoryId: catTech.id, tagNames: ['devops'] });
      await makeArticle('qa-kiem-thu', editor.id, 'Kế hoạch chuyển sang automation E2E bằng Playwright', 'Đề xuất lộ trình 2 quý cho automation.', `# Automation E2E với Playwright\n\n- Q1: smoke suite cho 5 luồng chính;\n- Q2: tích hợp vào CI, chặn merge khi fail;\n- Công cụ: Playwright + Allure report.`, 'PENDING_REVIEW', { categoryId: catTech.id, tagNames: ['qa'] });
      await makeArticle('quy-trinh-phat-trien', fresher.id, 'Ghi chú tìm hiểu về design pattern Observer', 'Bài nháp cá nhân đang soạn.', `# Observer pattern\n\nĐang viết dở...`, 'DRAFT', {});
      await makeArticle('chinh-sach-nhan-su', km.id, 'Quy trình nghiêm khắc cũ (đã thay thế)', 'Phiên bản cũ — đã bị thay thế bởi chính sách mới.', `Nội dung cũ, không còn hiệu lực.`, 'ARCHIVED', {});

      // ---------------------------------------------------------------- tương tác
      await tx.comment.create({
        data: {
          articleId: a2.id, authorId: fresher.id, body: 'Bước deploy canary thì mình theo dõi metric nào ạ?',
          isQuestion: true,
          replies: { create: { articleId: a2.id, authorId: pm.id, body: 'Theo error rate và p99 latency trên Grafana nhé!' } },
        },
      });
      await tx.comment.create({
        data: { articleId: a1.id, authorId: editor.id, body: 'Rất rõ ràng, đề xuất bổ sung checklist cho UI test.' },
      });
      for (const uid of [km.id, editor.id, fresher.id]) {
        await tx.reaction.create({ data: { articleId: a2.id, userId: uid } }).catch(() => undefined);
      }
      await tx.article.update({ where: { id: a2.id }, data: { helpfulCount: 3 } });
      await tx.reaction.create({ data: { articleId: a1.id, userId: fresher.id } }).catch(() => undefined);
      await tx.article.update({ where: { id: a1.id }, data: { helpfulCount: 1 } });
      await tx.spaceFollow.createMany({
        data: [
          { userId: fresher.id, spaceId: spaces['devops-runbook'].id },
          { userId: fresher.id, spaceId: spaces['quy-trinh-phat-trien'].id },
          { userId: editor.id, spaceId: spaces['quy-trinh-phat-trien'].id },
        ],
      }).catch(() => undefined);
      await tx.bookmark.create({ data: { userId: fresher.id, articleId: a2.id } }).catch(() => undefined);

      // ---------------------------------------------------------------- onboarding
      const path = await tx.onboardingPath.create({
        data: {
          title: 'Lộ trình fresher Java — 2 tuần đầu',
          description: 'Các bài đọc bắt buộc trước khi tham gia dự án thực tế.',
          targetJobTitle: 'Lập trình viên Java (Fresher)',
          createdBy: km.id,
          items: {
            create: [
              { articleId: a5.id, sortOrder: 0 },
              { articleId: a6.id, sortOrder: 1 },
              { articleId: a1.id, sortOrder: 2 },
              { articleId: a7.id, sortOrder: 3 },
              { articleId: a3.id, sortOrder: 4 },
            ],
          },
        },
        include: { items: true },
      });
      const assignment = await tx.onboardingAssignment.create({
        data: { pathId: path.id, userId: fresher.id, dueDate: new Date(Date.now() + 10 * 86_400_000) },
      });
      for (const item of path.items.slice(0, 2)) {
        await tx.onboardingItemProgress.create({ data: { assignmentId: assignment.id, itemId: item.id } });
      }

      // ---------------------------------------------------------------- handover
      await tx.handoverChecklist.create({
        data: {
          ownerUserId: pm.id, leavingDate: new Date(Date.now() + 30 * 86_400_000),
          items: {
            create: [
              { title: 'Bàn giao công việc cho người kế nhiệm', status: 'DONE', completedAt: new Date() },
              { title: 'Văn bản hóa tri thức quan trọng thành bài viết trong KMS', status: 'DONE', completedAt: new Date(), articleId: a2.id },
              { title: 'Xóa mẫu khuôn mặt & thu hồi quyền truy cập hệ thống', status: 'DONE', completedAt: new Date() },
              { title: 'Chuyển giao bookmark / runbook cá nhân' },
              { title: 'Quyết toán công nợ và tài sản' },
            ],
          },
        },
      });

      // ---------------------------------------------------------------- thiết bị & settings
      const crypto = require('node:crypto');
      await tx.attendanceDevice.create({
        data: {
          name: 'Kiosk Tầng 3 — TP.HCM', type: 'QR_KIOSK', location: 'Văn phòng TP.HCM',
          secretHash: crypto.createHash('sha256').update('kiosk-demo-secret-do-not-use-in-prod').digest('hex'),
          createdById: admin.id,
        },
      });
      await tx.attendanceDevice.create({
        data: { name: 'Simulator', type: 'SIMULATOR', createdById: admin.id },
      });
      await tx.setting.createMany({
        data: [
          { key: 'WORK_START', value: '08:00', updatedBy: admin.id },
          { key: 'WORK_END', value: '17:30', updatedBy: admin.id },
        ],
      }).catch(() => undefined);
    }, { maxWait: 15000, timeout: 60000 });

    console.log('[seed] Done ✔');
    console.log('[seed] Accounts:');
    console.log('  admin@demo.local / Admin@123          (ADMIN)');
    console.log('  km.manager@demo.local / Manager@123   (KM_MANAGER)');
    console.log('  pm.java@demo.local / Pm@123456        (USER — Trưởng nhóm)');
    console.log('  dev.fresher@demo.local / Fresher@123  (USER — Nhân viên mới)');
    console.log('  editor.qa@demo.local / Editor@123     (USER — EDITOR Space QA)');
  } finally {
    await prisma.$executeRawUnsafe(`SELECT pg_advisory_unlock(727101)`).catch(() => undefined);
  }
}

main()
  .then(async () => {
    // Seed thêm 43 nhân viên demo tên Việt thực tế (idempotent — Mục 3)
    const { seedEmployees } = require('./seed-employees.cjs');
    const { seedAll } = require('./seed-all-employees.cjs');
    const bcrypt = require('bcryptjs');
    const r = await seedEmployees(prisma, (pw) => bcrypt.hashSync(pw, 10));
    console.log(`[seed] nhân viên demo: tạo mới ${r.created}, bỏ qua ${r.skipped}`);
    await seedAll();

    // Seed 184 Ngạch bậc lương tiêu chuẩn & Hồ sơ Toàn diện
    const { seedPersonnelData } = require('./seed-personnel-ranks.cjs');
    await seedPersonnelData();

    // Seed Phân hệ Mở rộng Chuẩn mực Frappe HRMS
    const { seedFrappeHrms } = require('./seed-frappe-hrms.cjs');
    await seedFrappeHrms();
  })
  .catch((e) => {
    console.error('[seed] Failed:', e.message || e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
