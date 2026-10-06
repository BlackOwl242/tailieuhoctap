-- Keep the component catalog descriptive. Contract wage and statutory deductions
-- are calculated by payroll policy and must not be stored as structure line items.
UPDATE "hrms_salary_components"
SET "defaultAmount" = 0,
    "description" = CASE "code"
      WHEN 'BASIC' THEN 'Lương nền lấy từ hợp đồng hoặc quyết định có hiệu lực; không cấu hình trong khung phụ cấp.'
      WHEN 'BHXH' THEN 'Hệ thống tính tự động theo căn cứ đóng và chính sách bảo hiểm trong kỳ.'
      WHEN 'BHYT' THEN 'Hệ thống tính tự động theo căn cứ đóng và chính sách bảo hiểm trong kỳ.'
      WHEN 'BHTN' THEN 'Hệ thống tính tự động theo căn cứ đóng và chính sách bảo hiểm trong kỳ.'
      WHEN 'PIT' THEN 'Hệ thống tính tự động theo thu nhập tính thuế và chính sách trong kỳ.'
      ELSE "description"
    END,
    "updatedAt" = NOW()
WHERE "code" IN ('BASIC', 'BHXH', 'BHYT', 'BHTN', 'PIT');

UPDATE "hrms_salary_components"
SET "description" = 'Mức gợi ý; chỉ áp dụng khi được cấu hình trong khung theo vị trí/đơn vị.', "updatedAt" = NOW()
WHERE "code" = 'POSITION_ALLOW';

UPDATE "hrms_salary_components"
SET "description" = 'Mức gợi ý; mức chi và xử lý thuế theo chính sách có hiệu lực.', "updatedAt" = NOW()
WHERE "code" = 'LUNCH_ALLOW';

UPDATE "hrms_salary_components"
SET "description" = 'Mức gợi ý; thưởng thực tế cần quyết định/kết quả KPI được duyệt.', "updatedAt" = NOW()
WHERE "code" = 'KPI_BONUS';

-- Remove only the unused, unscoped demo structure. Never remove an assigned structure.
DELETE FROM "hrms_salary_structures" AS structure
WHERE structure."id" = 'struct-standard-tech'
  AND structure."jobTitle" IS NULL
  AND structure."orgUnitId" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "hrms_salary_structure_assignments" assignment
    WHERE assignment."structureId" = structure."id"
  );

-- Attach profiles to an approved, effective band only when their exact job title
-- matches exactly one eligible band. Existing explicit band assignments are kept.
WITH eligible_bands AS (
  SELECT band."id", titles."jobTitle"
  FROM "hrms_salary_bands" AS band
  CROSS JOIN LATERAL unnest(band."jobTitles") AS titles("jobTitle")
  WHERE band."status" = 'ACTIVE'
    AND band."approvedAt" IS NOT NULL
    AND band."effectiveFrom" <= CURRENT_DATE
    AND (band."effectiveTo" IS NULL OR band."effectiveTo" >= CURRENT_DATE)
), unique_title_bands AS (
  SELECT "jobTitle", (array_agg("id"))[1] AS "id"
  FROM eligible_bands
  GROUP BY "jobTitle"
  HAVING COUNT(*) = 1
)
UPDATE "users" AS employee
SET "salaryBandId" = match."id"
FROM unique_title_bands AS match
WHERE employee."salaryBandId" IS NULL
  AND employee."jobTitle" = match."jobTitle"
  AND employee."deletedAt" IS NULL
  AND employee."status" = 'ACTIVE'
  AND employee."employmentStatus" IN ('ACTIVE', 'PROBATION');
