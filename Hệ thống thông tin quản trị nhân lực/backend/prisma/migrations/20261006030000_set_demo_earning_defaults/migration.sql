-- Use the existing HRMIS payroll examples as the default amounts in this demo.
-- Defaults only prefill a salary structure; they are not paid unless the component
-- is explicitly included in a structure applicable to an employee.
UPDATE "hrms_salary_components"
SET "defaultAmount" = CASE "code"
      WHEN 'POSITION_ALLOW' THEN 3000000
      WHEN 'LUNCH_ALLOW' THEN 730000
      ELSE "defaultAmount"
    END,
    "description" = CASE "code"
      WHEN 'POSITION_ALLOW' THEN 'Mức mẫu HRMIS: 3.000.000 đ/tháng; chỉ chi trả khi được thêm vào cấu trúc lương theo chức danh/đơn vị đã duyệt.'
      WHEN 'LUNCH_ALLOW' THEN 'Mức mẫu HRMIS: 730.000 đ/tháng; khi áp dụng trong cấu trúc sẽ tính theo ngày có chấm công.'
      ELSE "description"
    END,
    "updatedAt" = NOW()
WHERE "code" IN ('POSITION_ALLOW', 'LUNCH_ALLOW');
