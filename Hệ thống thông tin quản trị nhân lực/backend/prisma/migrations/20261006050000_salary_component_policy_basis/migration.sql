ALTER TABLE "hrms_salary_components"
  ADD COLUMN "basisType" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "basisReference" TEXT;

UPDATE "hrms_salary_components"
SET "basisType" = CASE
      WHEN "code" = 'BASIC' THEN 'CONTRACT'
      WHEN "code" IN ('BHXH', 'BHYT', 'BHTN', 'PIT') THEN 'LAW'
      ELSE 'COMPANY_POLICY'
    END,
    "basisReference" = CASE "code"
      WHEN 'BASIC' THEN 'Bộ luật Lao động 45/2019/QH14, Điều 90; mức và phụ cấp cụ thể theo hợp đồng/quyết định có hiệu lực.'
      WHEN 'BHXH' THEN 'Luật Bảo hiểm xã hội 41/2024/QH15, Điều 33; người lao động đóng 8% căn cứ đóng, áp dụng đúng đối tượng và trần.'
      WHEN 'BHYT' THEN 'Luật Bảo hiểm y tế 25/2008/QH12, sửa đổi bởi Luật 51/2024/QH15; Nghị định 188/2025/NĐ-CP: tổng 4,5%, người lao động chịu 1/3 (1,5%).'
      WHEN 'BHTN' THEN 'Luật Việc làm 74/2025/QH15 và văn bản hướng dẫn hiện hành; mức người lao động tối đa 1%, xác định theo đối tượng và căn cứ đóng.'
      WHEN 'PIT' THEN 'Luật Thuế thu nhập cá nhân 109/2025/QH15 và Nghị định 253/2026/NĐ-CP, hiệu lực từ 01/07/2026; chịu thuế, miễn trừ và khấu trừ theo tình trạng cá nhân.'
      ELSE NULL
    END,
    "updatedAt" = NOW();

-- Mức mẫu không phải phê duyệt đãi ngộ. Không cộng phụ cấp cho nhân sự cho tới
-- khi HR gắn khoản đó vào cấu trúc theo chính sách doanh nghiệp đã được ban hành.
UPDATE "hrms_salary_components"
SET "defaultAmount" = 0,
    "description" = CASE "code"
      WHEN 'POSITION_ALLOW' THEN 'Chính sách đãi ngộ doanh nghiệp; cần nhập số quyết định/quy chế trước khi đưa vào cấu trúc lương.'
      WHEN 'LUNCH_ALLOW' THEN 'Chính sách phúc lợi doanh nghiệp; cần nhập số quyết định/quy chế và điều kiện hưởng trước khi áp dụng.'
      ELSE "description"
    END,
    "updatedAt" = NOW()
WHERE "code" IN ('POSITION_ALLOW', 'LUNCH_ALLOW');

INSERT INTO "hrms_salary_components"
  ("id", "code", "name", "type", "isTaxApplicable", "isInsuranceApplicable", "isOvertimeApplicable", "isFormulaBased", "formula", "defaultAmount", "description", "basisType", "basisReference", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'RESPONSIBILITY_ALLOW', 'Phụ cấp Trách nhiệm / Nghiệp vụ', 'EARNING', TRUE, FALSE, FALSE, FALSE, NULL, 0,
   'Chưa khai báo chính sách doanh nghiệp. Mức 1.500.000 đ trong phiếu mẫu tháng 09/2026 là số hard-code, không có căn cứ đãi ngộ; không dùng làm mặc định.',
   'COMPANY_POLICY', NULL, NOW(), NOW())
ON CONFLICT ("code") DO UPDATE
SET "defaultAmount" = 0,
    "description" = EXCLUDED."description",
    "basisType" = 'COMPANY_POLICY',
    "basisReference" = NULL,
    "updatedAt" = NOW();
