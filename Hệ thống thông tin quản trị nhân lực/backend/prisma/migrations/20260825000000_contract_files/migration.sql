-- Thêm đính kèm bản mềm cho hợp đồng lao động (Mục 4 — hồ sơ nhân sự)
ALTER TABLE "contracts" ADD COLUMN "fileName" TEXT;
ALTER TABLE "contracts" ADD COLUMN "fileUrl" TEXT;
