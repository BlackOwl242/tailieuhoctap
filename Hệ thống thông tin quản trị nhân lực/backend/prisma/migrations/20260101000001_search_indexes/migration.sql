-- Chỉ mục phục vụ tìm kiếm toàn văn và chấm công (doc/KMS_PLAN.md mục 4.6)
-- Lưu ý: cột giữ tên camelCase do Prisma sinh (không dùng @map)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tìm kiếm mờ trên tiêu đề bài viết (bắt cả từ con / thiếu dấu)
CREATE INDEX IF NOT EXISTS "articles_title_trgm_idx" ON "articles" USING gin ("title" gin_trgm_ops);

-- Danh sách bài viết theo trạng thái + thời gian xuất bản
CREATE INDEX IF NOT EXISTS "articles_status_published_idx" ON "articles" ("status", "publishedAt" DESC);

-- Bảng công theo người dùng + ngày
CREATE INDEX IF NOT EXISTS "attendance_days_user_date_idx" ON "attendance_days" ("userId", "workDate");

-- Sự kiện chấm công theo thời gian
CREATE INDEX IF NOT EXISTS "attendance_events_occurred_idx" ON "attendance_events" ("occurredAt");
