# Giao diện hệ thống quản lý hành chính Hà Nội

Ứng dụng React, TypeScript và Vite. Trang công khai cung cấp các nhánh tới Cổng Dịch vụ công quốc gia và Trang thông tin Trung tâm Phục vụ hành chính công Hà Nội. Bàn xử lý cán bộ chạy cục bộ và dùng API Python trong thư mục cha.

## Chạy phát triển

```powershell
npm install
npm run dev
```

Khởi động API trong thư mục cha bằng `python app.py`, sau đó mở URL Vite. Dùng `npm run build` để biên dịch kiểm tra TypeScript và tạo gói frontend.

## Ranh giới vận hành

- Công dân không tạo tài khoản tại ứng dụng này; giao dịch trực tuyến được chuyển sang Cổng quốc gia, nơi công dân xác thực bằng VNeID.
- Tài khoản cán bộ của ứng dụng chỉ dùng dữ liệu cục bộ. Chưa kết nối hệ thống tài khoản, hồ sơ, thanh toán, ký số hoặc đồng bộ của cơ quan nhà nước.
- Thông tin cơ quan thực hiện chưa được xác minh cho mọi thủ tục. Với dữ liệu chưa có căn cứ, giao diện yêu cầu tra cứu và chọn cơ quan trên Cổng quốc gia.
