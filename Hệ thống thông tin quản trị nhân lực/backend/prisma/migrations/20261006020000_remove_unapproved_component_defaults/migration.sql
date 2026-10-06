-- Position bands approve base-pay ranges, not flat allowances or KPI awards.
-- Clear invented seed defaults so a new salary structure cannot apply them by accident.
UPDATE "hrms_salary_components"
SET "defaultAmount" = 0,
    "description" = CASE "code"
      WHEN 'POSITION_ALLOW' THEN 'Chưa có mức mặc định được duyệt; chỉ áp dụng khi cấu hình chính sách theo vị trí/đơn vị.'
      WHEN 'LUNCH_ALLOW' THEN 'Chưa có mức mặc định được duyệt; mức chi và xử lý thuế theo chính sách có hiệu lực.'
      ELSE "description"
    END,
    "updatedAt" = NOW()
WHERE "code" IN ('POSITION_ALLOW', 'LUNCH_ALLOW');

-- KPI awards are paid through approved award decisions, not as a recurring component.
DELETE FROM "hrms_salary_components" AS component
WHERE component."code" = 'KPI_BONUS'
  AND NOT EXISTS (
    SELECT 1 FROM "hrms_salary_structure_items" item
    WHERE item."componentId" = component."id"
  );
