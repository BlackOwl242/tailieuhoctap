CREATE TABLE "hrms_competency_standards" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "applicableJobTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "behavioralAnchors" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hrms_competency_standards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hrms_competency_standards_code_key" ON "hrms_competency_standards"("code");
CREATE INDEX "hrms_competency_standards_isActive_code_idx" ON "hrms_competency_standards"("isActive", "code");

INSERT INTO "hrms_competency_standards" ("id", "code", "name", "description", "behavioralAnchors", "updatedAt") VALUES
('competency-standard-communication', 'COMMUNICATION', 'Giao tiếp công việc', 'Truyền đạt thông tin rõ ràng, đúng đối tượng và kiểm tra người nhận đã hiểu; đánh giá bằng tình huống công việc thực tế.', $$["Cần hỗ trợ thường xuyên để truyền đạt yêu cầu; thông tin thường thiếu hoặc khó hiểu.","Truyền đạt được việc quen thuộc theo hướng dẫn; đôi khi cần nhắc bổ sung bối cảnh hoặc xác nhận.","Trình bày rõ việc, thời hạn và kết quả mong đợi; lắng nghe và phản hồi phù hợp trong công việc thường ngày.","Điều chỉnh cách trao đổi theo người nhận; xử lý bất đồng bằng dữ kiện và giúp nhóm thống nhất cách làm.","Thiết lập cách giao tiếp hiệu quả cho nhóm; hướng dẫn người khác và xử lý các cuộc trao đổi phức tạp, nhạy cảm."]$$::jsonb, CURRENT_TIMESTAMP),
('competency-standard-collaboration', 'COLLABORATION', 'Phối hợp và làm việc nhóm', 'Phối hợp có trách nhiệm với đồng nghiệp và bộ phận liên quan để đạt kết quả chung.', $$["Thường bỏ sót bàn giao hoặc cần nhắc mới phối hợp.","Phối hợp tốt với hướng dẫn; cập nhật tiến độ khi được yêu cầu.","Chủ động bàn giao, giữ cam kết và chia sẻ thông tin cần thiết với các bên liên quan.","Gỡ vướng liên bộ phận, cân bằng ưu tiên và giúp nhóm cùng hoàn thành cam kết.","Xây dựng cách phối hợp bền vững giữa nhiều nhóm; dẫn dắt giải quyết xung đột lợi ích phức tạp."]$$::jsonb, CURRENT_TIMESTAMP),
('competency-standard-problem-solving', 'PROBLEM_SOLVING', 'Giải quyết vấn đề', 'Nhận diện nguyên nhân, cân nhắc lựa chọn và kiểm chứng kết quả xử lý.', $$["Chủ yếu nhận biết vấn đề sau khi xảy ra và cần chỉ dẫn từng bước.","Xử lý được tình huống quen thuộc theo quy trình; biết báo khi vượt thẩm quyền.","Tự phân tích nguyên nhân thường gặp, chọn cách xử lý phù hợp và kiểm tra kết quả.","Giải quyết vấn đề mới hoặc phức tạp bằng dữ kiện; ngăn tái diễn và chia sẻ bài học.","Định hình phương pháp xử lý vấn đề cho đơn vị; tháo gỡ vấn đề có ảnh hưởng rộng và lâu dài."]$$::jsonb, CURRENT_TIMESTAMP),
('competency-standard-ownership', 'OWNERSHIP', 'Tinh thần trách nhiệm', 'Nhận trách nhiệm với cam kết, chất lượng và việc theo dõi đến khi hoàn tất.', $$["Thường xuyên cần nhắc về thời hạn hoặc chất lượng đầu ra.","Hoàn thành việc rõ ràng khi có hướng dẫn và nhắc tiến độ.","Tự theo dõi cam kết, báo sớm rủi ro và hoàn thành đầu ra theo yêu cầu.","Chủ động xử lý rủi ro, nhận trách nhiệm khi có sai sót và hỗ trợ người khác đạt kết quả.","Tạo chuẩn trách nhiệm cho nhóm; cải thiện cơ chế theo dõi và giữ kết quả ổn định ở phạm vi rộng."]$$::jsonb, CURRENT_TIMESTAMP),
('competency-standard-professional', 'PROFESSIONAL_SKILL', 'Năng lực chuyên môn', 'Mức độ áp dụng kiến thức và kỹ năng chuyên môn để tạo ra đầu ra đúng yêu cầu công việc.', $$["Chưa nắm vững thao tác nền tảng; cần hướng dẫn trực tiếp thường xuyên.","Thực hiện được tác vụ quen thuộc theo quy trình và có kiểm tra.","Độc lập hoàn thành phần việc đúng tiêu chuẩn vị trí; biết khi nào cần xin hỗ trợ.","Xử lý trường hợp khó, nâng chất lượng đầu ra và hướng dẫn đồng nghiệp.","Định hình thực hành chuyên môn của nhóm; giải quyết bài toán mới và tạo cải tiến có tác động rõ."]$$::jsonb, CURRENT_TIMESTAMP);

ALTER TABLE "hrms_competency_assessments"
    ADD COLUMN "managerLevel" INTEGER,
    ADD COLUMN "managerEvidenceUrl" TEXT,
    ADD COLUMN "managerAssessedBy" TEXT,
    ADD COLUMN "managerAssessedAt" TIMESTAMP(3),
    ADD COLUMN "status" TEXT NOT NULL DEFAULT 'SELF_SUBMITTED';
