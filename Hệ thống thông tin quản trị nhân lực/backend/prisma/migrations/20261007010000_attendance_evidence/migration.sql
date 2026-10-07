CREATE TABLE "hrms_attendance_evidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workDate" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_attendance_evidence_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hrms_attendance_evidence_userId_workDate_idx" ON "hrms_attendance_evidence"("userId", "workDate");

ALTER TABLE "hrms_attendance_evidence" ADD CONSTRAINT "hrms_attendance_evidence_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hrms_attendance_evidence" ADD CONSTRAINT "hrms_attendance_evidence_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
