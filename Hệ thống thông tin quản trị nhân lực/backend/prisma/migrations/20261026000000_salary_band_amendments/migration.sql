ALTER TABLE "hrms_salary_bands" ADD COLUMN "supersedesId" TEXT;
CREATE UNIQUE INDEX "hrms_salary_bands_supersedesId_key" ON "hrms_salary_bands"("supersedesId");
ALTER TABLE "hrms_salary_bands" ADD CONSTRAINT "hrms_salary_bands_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "hrms_salary_bands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
