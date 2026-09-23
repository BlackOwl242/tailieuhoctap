# BỘ BIỂU ĐỒ UML ĐẦY ĐỦ 47 USE CASE - HRMS THẾ GIỚI DI ĐỘNG (MWG)

> Tài liệu kèm theo `doc/PTTK_OOP_HR_MWG.md`, sinh thống nhất cho **47 Use Case chia 10 nhóm nghiệp vụ bán lẻ**.
> **Mọi biểu đồ đều khai báo `skinparam linetype ortho` nên các đường nối được kẻ THẲNG VUÔNG GÓC, không méo mó.**
> Cách dùng: sao chép từng khối ```plantuml``` dán vào plantuml.com (hoặc plugin IDE PlantUML) để xuất ảnh PNG/SVG chèn vào báo cáo.

**Cấu trúc tài liệu:**
- A. Biểu đồ Use Case (Cây phân cấp tác nhân + Tổng quát 10 nhóm + 10 nhóm phân hệ chi tiết)
- B. Biểu đồ Trình tự (Sequence Diagrams) các kịch bản bán lẻ trọng tâm
- C. Biểu đồ Hoạt động (Activity Diagrams) các quy trình then chốt
- D. Biểu đồ Trạng thái (State Machine Diagrams) các thực thể cốt lõi
- E. Biểu đồ Gói (Package Diagram) & Kiến trúc phần mềm 3 tầng
- F. Biểu đồ Lớp (Class Diagrams) 10 phân hệ nghiệp vụ & Mô hình miền Domain Model
- G. Mô hình CSDL quan hệ mở rộng cho Điểm danh đa nguồn (GPS, FaceID, Wifi, Vân tay)

---

## A. BIỂU ĐỒ USE CASE

### A.00. Biểu đồ cây phân cấp Tác nhân (Actor Generalization)

```plantuml
@startuml
left to right direction
skinparam shadowing false
skinparam defaultFontSize 11

actor "Quản lý Siêu thị\n(Store Manager - SM)" as SM
actor "Quản lý Khu vực\n(Area Manager - AM)" as AM
actor "Chuyên viên\nTuyển dụng Mass" as CVTD
actor "Chuyên viên\nHồ sơ & Hợp đồng" as CVHS
actor "Chuyên viên\nC&B Tập đoàn" as CVTL

actor "Nhân viên Bán lẻ\n(Tác nhân chung)" as NV

actor "Nhân viên\nHành chính & Tài sản" as NVHC
actor "Kế toán viên\nChi nhánh & Kho" as KTV
actor "Chuyên viên Đào tạo\n& Văn hóa L&D" as CVDT
actor "Đại diện\nNgười lao động" as DDNLD
actor "Ban Tổng Giám đốc\n(CEO Tập đoàn / Chuỗi)" as GD
actor "Quản lý Kỹ thuật\nIT Hệ thống" as NVIT

SM <|-- NV
AM <|-- NV
CVTD <|-- NV
CVHS <|-- NV
CVTL <|-- NV

NV --|> NVHC
NV --|> KTV
NV --|> CVDT
NV --|> DDNLD
NV --|> GD
NV --|> NVIT
@enduml
```
_Hình 2.1. Biểu đồ cây phân cấp Tác nhân (Actor Generalization) — "Nhân viên Bán lẻ" làm tác nhân chung kế thừa ra các vai trò chuyên biệt hóa trong hệ sinh thái bán lẻ MWG._

---

### A.0. Biểu đồ Use Case Tổng quan Hệ thống (47 Use Case, 10 Nhóm)

```plantuml
@startuml
left to right direction
skinparam linetype ortho
skinparam shadowing false
skinparam packageStyle rectangle
skinparam defaultFontSize 11

' Tác nhân phía bên trái
actor "Chuyên viên\nTuyển dụng Mass" as CVTD
actor "Quản trị viên\nIT Hệ thống" as NVIT
actor "Chuyên viên\nHồ sơ & Hợp đồng" as CVHS
actor "Quản lý Siêu thị\n(Store Manager)" as SM
actor "Nhân viên Bán lẻ\n(Tác nhân chung)" as NV
actor "Chuyên viên Đào tạo\n& Văn hóa L&D" as CVDT

rectangle "HỆ THỐNG QUẢN TRỊ NHÂN LỰC MWG (47 USE CASE)" {
  usecase "I. Chuẩn cán bộ & Báo cáo Nhà nước\n(UC40-UC43)" as GI
  usecase "B. Tuyển dụng & Mass ATS\n(UC04-UC08)" as GB
  usecase "A. Quản trị hệ thống & Cấu trúc chuỗi\n(UC01-UC03)" as GA
  usecase "J. Quản trị tri thức & Điều hành\n(UC44-UC47)" as GJ
  usecase "C. Hồ sơ nhân sự, HĐLĐ & Hội nhập\n(UC09-UC14)" as GC
  usecase "G. Biến động nhân sự & Thôi việc\n(UC32-UC36)" as GG
  usecase "E. Chấm công GPS & Phân ca xoay\n(UC18-UC25)" as GE
  usecase "F. Tiền lương 3P & Phúc lợi\n(UC26-UC31)" as GF
  usecase "D. Cổng tự phục vụ di động (App)\n(UC15-UC17)" as GD_uc
  usecase "H. Đánh giá CSAT & Thăng cấp SM\n(UC37-UC39)" as GH
}

' Tác nhân phía bên phải
actor "Ban Tổng Giám đốc\n(CEO MWG)" as GD
actor "Quản lý Khu vực\n(Area Manager - AM)" as AM
actor "Kế toán viên\nChi nhánh & Kho" as KTV
actor "Đại diện\nNgười lao động" as DDNLD
actor "Chuyên viên\nC&B Tập đoàn" as CVTL
actor "Nhân viên\nHành chính & Tài sản" as NVHC

CVTD --> GB

NVIT --> GA
NVIT --> GJ

CVHS --> GC
CVHS --> GI
CVHS --> GG

SM --> GB
SM --> GC
SM --> GE
SM --> GG
SM --> GH

NV --> GA
NV --> GC
NV --> GD_uc
NV --> GE
NV --> GF
NV --> GG
NV --> GH
NV --> GJ

CVDT --> GH

GB <-- GD
GC <-- GD
GF <-- GD
GG <-- GD
GI <-- GD
GJ <-- GD

GB <-- AM
GE <-- AM
GG <-- AM
GJ <-- AM

GB <-- KTV
GF <-- KTV

GG <-- DDNLD
GH <-- DDNLD

GE <-- CVTL
GF <-- CVTL
GG <-- CVTL

GF <-- NVHC
@enduml
```
_Hình 2.2. Biểu đồ Use Case tổng quan Hệ thống Quản trị nhân lực MWG — 10 nhóm chức năng, 47 use case, tác nhân phân bố đều hai bên, đường nối thẳng vuông góc ortho có mũi tên chỉ định rõ ràng._

---

### A.1. Nhóm A - Quản trị hệ thống & Cơ cấu tổ chức chuỗi

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Toàn thể nhân viên" as NV
actor "Quản trị viên IT" as IT
actor "Ban Tổng Giám đốc" as BOD

rectangle "Nhóm A - Quản trị hệ thống & Cơ cấu tổ chức chuỗi" {
  (UC01 Đăng nhập & Xác thực hệ thống đa nền tảng) as UC01
  (UC02 Quản trị người dùng & Phân quyền RBAC bán lẻ) as UC02
  (UC03 Quản trị cơ cấu tổ chức chuỗi & Cây siêu thị) as UC03
}

NV -- UC01
IT -- UC02
IT -- UC03
BOD -- UC03
@enduml
```
_Hình 2.3. Biểu đồ Use Case Phân hệ Quản trị hệ thống và Cơ cấu tổ chức (Nhóm A: UC01 - UC03)._

---

### A.2. Nhóm B - Tuyển dụng & Ứng viên (Mass ATS)

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Quản lý Siêu thị" as SM
actor "Quản lý Khu vực" as AM
actor "Chuyên viên Tuyển dụng" as TD
actor "Ban Giám đốc" as BOD
actor "Ứng viên" as UV

rectangle "Nhóm B - Tuyển dụng & Mass ATS" {
  (UC04 Lập phiếu đề xuất tuyển dụng nhân sự siêu thị) as UC04
  (UC05 Thẩm định chỉ tiêu & Kiểm soát định biên chuỗi) as UC05
  (UC06 Phê duyệt kế hoạch tuyển dụng số lượng lớn) as UC06
  (UC07 Quản lý hồ sơ ứng viên & Phễu tuyển dụng Mass ATS) as UC07
  (UC08 Gửi thông báo trúng tuyển & Thư mời nhận việc điện tử) as UC08
}

SM -- UC04
AM -- UC05
BOD -- UC06
TD -- UC07
TD -- UC08
UV -- UC08
@enduml
```
_Hình 2.4. Biểu đồ Use Case Phân hệ Tuyển dụng và Mass ATS (Nhóm B: UC04 - UC08)._

---

### A.3. Nhóm C - Hồ sơ nhân sự, Hợp đồng điện tử & Hội nhập

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Chuyên viên Hồ sơ" as HS
actor "Nhân viên Bán lẻ" as NV
actor "Quản lý Siêu thị" as SM
actor "Ban Giám đốc" as BOD

rectangle "Nhóm C - Hồ sơ, Hợp đồng & Hội nhập" {
  (UC09 Quản lý hồ sơ nhân viên bán lẻ toàn diện) as UC09
  (UC10 Quản lý hợp đồng lao động & Ký kết điện tử E-Sign) as UC10
  (UC11 Quản lý văn bằng, chứng chỉ chuyên môn & Dược sĩ) as UC11
  (UC12 Mượn - trả hồ sơ, bằng cấp bản gốc lưu kho) as UC12
  (UC13 Đánh giá thử việc tại siêu thị & Ký HĐLĐ chính thức) as UC13
  (UC14 Lộ trình hội nhập văn hóa 'Tận tâm phục vụ khách hàng') as UC14
}

HS -- UC09
HS -- UC10
NV -- UC10
HS -- UC11
NV -- UC12
HS -- UC12
SM -- UC13
BOD -- UC13
NV -- UC14
SM -- UC14
@enduml
```
_Hình 2.5. Biểu đồ Use Case Phân hệ Hồ sơ nhân sự, Hợp đồng và Hội nhập (Nhóm C: UC09 - UC14)._

---

### A.4. Nhóm D - Cổng tự phục vụ di động (Mobile ESS)

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Toàn thể nhân viên" as NV
actor "Chuyên viên Hồ sơ" as HS
actor "Quản trị viên IT" as IT

rectangle "Nhóm D - Cổng tự phục vụ di động (Mobile ESS)" {
  (UC15 Cổng tự phục vụ nhân viên di động MWG App) as UC15
  (UC16 Quản lý thông tin cá nhân phân cấp 3 mức độ) as UC16
  (UC17 Thẩm định & Phê duyệt đề xuất đổi thông tin định danh) as UC17
}

NV -- UC15
NV -- UC16
HS -- UC17
IT -- UC17
@enduml
```
_Hình 2.6. Biểu đồ Use Case Phân hệ Cổng tự phục vụ nhân viên di động (Nhóm D: UC15 - UC17)._

---

### A.5. Nhóm E - Chấm công, Phân ca & Điểm danh đa nguồn

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Nhân viên siêu thị" as NV
actor "Quản lý Siêu thị" as SM
actor "Chuyên viên C&B" as CB
actor "Quản trị viên IT" as IT

rectangle "Nhóm E - Chấm công, Phân ca & Điểm danh đa nguồn" {
  (UC18 Ghi nhận sự kiện chấm công & Điểm danh vào/ra ca) as UC18
  (UC19 Điểm danh di động GPS Geofencing & FaceID nhận diện) as UC19
  (UC20 Quản trị kết nối thiết bị máy chấm công Tổng kho DC) as UC20
  (UC21 Đăng ký & Xét duyệt nghỉ phép trực tuyến qua app) as UC21
  (UC22 Đăng ký & Phê duyệt làm thêm giờ OT mùa cao điểm) as UC22
  (UC23 Lập lịch và phân ca xoay tại siêu thị) as UC23
  (UC24 Giải trình bổ sung giờ công & Xử lý lệch công) as UC24
  (UC25 Tổng hợp & Chốt bảng chấm công tháng toàn hệ thống) as UC25
}

NV -- UC18
NV -- UC19
IT -- UC20
NV -- UC21
SM -- UC21
NV -- UC22
SM -- UC22
SM -- UC23
NV -- UC24
SM -- UC24
CB -- UC25
SM -- UC25
@enduml
```
_Hình 2.7. Biểu đồ Use Case Phân hệ Chấm công, Phân ca và Điểm danh đa nguồn (Nhóm E: UC18 - UC25)._

---

### A.6. Nhóm F - Tiền lương 3P, Doanh số & Phúc lợi bán lẻ

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Chuyên viên C&B" as CB
actor "Ban Tổng Giám đốc" as BOD
actor "Nhân viên bán lẻ" as NV
actor "Kế toán viên" as KTV
actor "Nhân viên Hành chính" as HC

rectangle "Nhóm F - Tiền lương 3P, Doanh số & Phúc lợi" {
  (UC26 Cấu hình công thức lương 3P & Hoa hồng doanh số) as UC26
  (UC27 Vận hành chức năng tính lương tự động 65.000 nhân sự) as UC27
  (UC28 Phê duyệt & Khóa bất biến kỳ lương Locked Payroll) as UC28
  (UC29 Quản lý tạm ứng lương & Khoản vay quỹ phúc lợi MWG) as UC29
  (UC30 Quản lý đề xuất công tác thị trường & Quyết toán chi phí) as UC30
  (UC31 Quản lý cấp phát & Thu hồi đồng phục, công cụ bán hàng) as UC31
}

CB -- UC26
CB -- UC27
CB -- UC28
BOD -- UC28
NV -- UC29
KTV -- UC29
NV -- UC30
KTV -- UC30
HC -- UC31
NV -- UC31
@enduml
```
_Hình 2.8. Biểu đồ Use Case Phân hệ Tiền lương, Doanh số và Phúc lợi (Nhóm F: UC26 - UC31)._

---

### A.7. Nhóm G - Biến động nhân sự & Thôi việc tại siêu thị

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Quản lý Khu vực" as AM
actor "Quản lý Siêu thị" as SM
actor "Chuyên viên C&B" as CB
actor "Đại diện Công đoàn" as CĐ
actor "Ban Giám đốc" as BOD
actor "Nhân viên" as NV

rectangle "Nhóm G - Biến động nhân sự & Thôi việc" {
  (UC32 Đề xuất & Phê duyệt điều chuyển nhân sự giữa các siêu thị) as UC32
  (UC33 Đề xuất & Phê duyệt điều chỉnh bậc lương theo tay nghề) as UC33
  (UC34 Đề xuất & Phê duyệt khen thưởng nhân sự bán lẻ xuất sắc) as UC34
  (UC35 Xử lý kỷ luật lao động & Vi phạm nội quy siêu thị) as UC35
  (UC36 Quy trình bàn giao thôi việc 4 khâu cấp tốc tại siêu thị) as UC36
}

AM -- UC32
BOD -- UC32
SM -- UC33
CB -- UC33
SM -- UC34
BOD -- UC34
SM -- UC35
CĐ -- UC35
BOD -- UC35
NV -- UC36
SM -- UC36
CB -- UC36
@enduml
```
_Hình 2.9. Biểu đồ Use Case Phân hệ Biến động nhân sự và Thôi việc (Nhóm G: UC32 - UC36)._

---

### A.8. Nhóm H - Đánh giá CSAT, Đào tạo & Khiếu nại

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Nhân viên bán lẻ" as NV
actor "Quản lý Siêu thị" as SM
actor "Chuyên viên L&D" as LD
actor "Đại diện Công đoàn" as CĐ

rectangle "Nhóm H - Đánh giá CSAT, Đào tạo & Khiếu nại" {
  (UC37 Đánh giá năng lực phục vụ CSAT & Thăng cấp SM) as UC37
  (UC38 Quản trị chương trình đào tạo nghiệp vụ & E-Learning) as UC38
  (UC39 Tiếp nhận & Giải quyết khiếu nại lao động bảo mật) as UC39
}

NV -- UC37
SM -- UC37
LD -- UC37
LD -- UC38
NV -- UC38
NV -- UC39
CĐ -- UC39
LD -- UC39
@enduml
```
_Hình 2.10. Biểu đồ Use Case Phân hệ Đánh giá CSAT, Đào tạo và Khiếu nại (Nhóm H: UC37 - UC39)._

---

### A.9. Nhóm I - Hồ sơ cán bộ & Báo cáo cơ quan nhà nước

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Chuyên viên Hồ sơ" as HS
actor "Ban Giám đốc" as BOD

rectangle "Nhóm I - Hồ sơ cán bộ & Báo cáo cơ quan nhà nước" {
  (UC40 Quản lý hồ sơ cán bộ quản lý theo chuẩn Mẫu 2C-BNV) as UC40
  (UC41 Quản trị danh mục ngạch bậc lương chuẩn Nghị định 204) as UC41
  (UC42 Tự động rà soát & Phê duyệt nâng bậc lương định kỳ) as UC42
  (UC43 Kết xuất biểu mẫu báo cáo nhà nước SYLL 2C, Báo cáo LĐ) as UC43
}

HS -- UC40
HS -- UC41
HS -- UC42
BOD -- UC42
HS -- UC43
@enduml
```
_Hình 2.11. Biểu đồ Use Case Phân hệ Hồ sơ cán bộ và Báo cáo cơ quan nhà nước (Nhóm I: UC40 - UC43)._

---

### A.10. Nhóm J - Quản trị tri thức & Điều hành hệ thống

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
left to right direction
actor "Toàn thể nhân viên" as NV
actor "Ban Tổng Giám đốc" as BOD
actor "Quản lý Khu vực" as AM
actor "Quản trị viên IT" as IT

rectangle "Nhóm J - Quản trị tri thức & Điều hành hệ thống" {
  (UC44 Quản lý không gian tri thức & Quy trình thao tác chuẩn SOP) as UC44
  (UC45 Tìm kiếm tri thức sản phẩm & Danh bạ chuyên gia nội bộ) as UC45
  (UC46 Bảng điều khiển phân tích nhân sự thời gian thực HR Dashboard) as UC46
  (UC47 Nhật ký kiểm toán hệ thống & Cấu hình tham số bán lẻ) as UC47
}

NV -- UC44
NV -- UC45
BOD -- UC46
AM -- UC46
IT -- UC47
@enduml
```
_Hình 2.12. Biểu đồ Use Case Phân hệ Quản trị tri thức và Điều hành hệ thống (Nhóm J: UC44 - UC47)._

---

## B. BIỂU ĐỒ TRÌNH TỰ (SEQUENCE DIAGRAMS)

### B.1. UC01 - Đăng nhập & Xác thực JWT đa nền tảng

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
autonumber

actor "Nhân viên" as User
boundary "Giao diện Đăng nhập\n(Web/App)" as UI
control "AuthController" as Auth
entity "UserService" as Service
database "PostgreSQL" as DB

User -> UI: Nhập mã NV & Mật khẩu
UI -> Auth: POST /api/auth/login {employeeCode, password}
Auth -> Service: validateCredentials(employeeCode, password)
Service -> DB: SELECT * FROM users WHERE code = employeeCode
DB --> Service: Thông tin User & Hash Mật khẩu
Service -> Service: bcrypt.compare(password, passwordHash)
alt Xác thực thành công
  Service -> Service: generateJWT(userId, roles)
  Service -> DB: UPDATE users SET lastLogin = NOW()
  Service --> Auth: {accessToken, refreshToken, userProfile}
  Auth --> UI: HTTP 200 OK + JWT Tokens
  UI --> User: Điều hướng tới Dashboard theo vai trò
else Sai thông tin đăng nhập
  Service --> Auth: Error("Invalid credentials")
  Auth --> UI: HTTP 401 Unauthorized
  UI --> User: Cảnh báo sai mật khẩu (Đếm lần sai)
end
@enduml
```
_Hình 2.13. Biểu đồ trình tự Use Case Đăng nhập & Xác thực hệ thống (UC01)._

---

### B.2. UC19 - Điểm danh di động GPS Geofencing & FaceID

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
autonumber

actor "Nhân viên Siêu thị" as NV
boundary "MWG Mobile App\n(/check-in)" as App
control "AttendanceController" as Ctrl
entity "GeoFenceService" as Geo
entity "FaceRecognitionService" as Face
database "PostgreSQL" as DB

NV -> App: Mở ứng dụng, bấm "Điểm danh vào ca"
App -> App: Đọc tọa độ GPS hiện tại & BSSID Wifi
App -> App: Chụp ảnh khuôn mặt & trích xuất vector đặc trưng
App -> Ctrl: POST /api/attendance/check-in {lat, lng, bssid, faceVector}
Ctrl -> Geo: verifyLocation(storeId, lat, lng)
Geo -> DB: SELECT latitude, longitude, radius FROM stores WHERE id = storeId
DB --> Geo: Tọa độ siêu thị & Bán kính (50m)
Geo -> Geo: Tính khoảng cách Haversine (distance <= 50m?)
alt Nằm ngoài phạm vi siêu thị
  Geo --> Ctrl: LocationError("Outside store geofence")
  Ctrl --> App: HTTP 403 Forbidden ("Bạn đang ở ngoài phạm vi siêu thị")
  App --> NV: Cảnh báo từ chối điểm danh
else Trong phạm vi siêu thị
  Ctrl -> Face: matchFaceEmbedding(employeeId, faceVector)
  Face -> DB: SELECT embedding FROM face_embeddings WHERE empId = employeeId
  DB --> Face: Vector khuôn mặt mẫu
  Face -> Face: Cosine Similarity >= 0.85?
  alt Khuôn mặt không khớp / Giả mạo
    Face --> Ctrl: FaceMismatchError()
    Ctrl --> App: HTTP 400 Bad Request ("Khuôn mặt không khớp")
    App --> NV: Yêu cầu chụp lại khuôn mặt
  else Xác thực sinh trắc thành công
    Ctrl -> DB: INSERT INTO attendance_events (empId, storeId, eventType='CHECK_IN', timestamp=NOW())
    DB --> Ctrl: Event Record Saved
    Ctrl --> App: HTTP 200 OK ("Điểm danh thành công lúc HH:mm")
    App --> NV: Thông báo điểm danh thành công
  end
end
@enduml
```
_Hình 2.14. Biểu đồ trình tự Use Case Điểm danh di động GPS Geofencing & FaceID (UC19)._

---

### B.3. UC23 - Lập lịch và phân ca xoay tại siêu thị (Store Scheduling)

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
autonumber

actor "Quản lý Siêu thị (SM)" as SM
boundary "Giao diện Phân ca\n(/shifts)" as UI
control "ShiftController" as Ctrl
entity "ShiftSchedulingService" as Svc
database "PostgreSQL" as DB
boundary "Push Notification" as Push

SM -> UI: Mở bảng xếp ca tuần của siêu thị
UI -> Ctrl: GET /api/shifts/week?storeId=ST01&week=42
Ctrl -> DB: SELECT * FROM shift_assignments WHERE storeId=ST01
DB --> Ctrl: Lịch ca hiện tại & Danh sách nhân viên
Ctrl --> UI: Hiển thị ma trận nhân sự - ngày trong tuần
SM -> UI: Gán ca (Ca 1: 7h30-15h30, Ca 2: 14h30-22h00) cho từng nhân viên
SM -> UI: Bấm "Kiểm tra & Công bố lịch ca"
UI -> Ctrl: POST /api/shifts/publish {shiftData}
Ctrl -> Svc: validateShiftConstraints(shiftData)
Svc -> Svc: Kiểm tra khoảng nghỉ >= 12h giữa 2 ca
Svc -> Svc: Kiểm tra số giờ làm <= 48h/tuần
alt Vi phạm ràng buộc giờ làm
  Svc --> Ctrl: ValidationError("Nhân viên NV01 nghỉ dưới 12h giữa 2 ca")
  Ctrl --> UI: Cảnh báo lỗi xung đột ca
  UI --> SM: Hiển thị cảnh báo để điều chỉnh lại
else Hợp lệ toàn bộ
  Svc -> DB: UPSERT INTO shift_assignments (empId, shiftId, date, status='PUBLISHED')
  DB --> Svc: Saved
  Svc -> Push: sendPushNotification("Lịch ca tuần mới đã được công bố")
  Ctrl --> UI: HTTP 200 OK ("Công bố lịch ca thành công")
  UI --> SM: Thông báo hoàn tất
end
@enduml
```
_Hình 2.15. Biểu đồ trình tự Use Case Lập lịch và phân ca xoay tại siêu thị (UC23)._

---

### B.4. UC27 - Vận hành chức năng tính lương tự động cho hơn 65.000 nhân sự

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
autonumber

actor "Chuyên viên C&B" as CB
boundary "Giao diện Tính lương\n(/payroll-engine)" as UI
control "PayrollController" as Ctrl
entity "PayrollBatchService" as Batch
entity "RetailPayrollCalculator" as Calc
database "PostgreSQL" as DB
entity "ERP System" as ERP

CB -> UI: Chọn kỳ lương (Tháng/Năm), bấm "Chạy tính lương tự động"
UI -> Ctrl: POST /api/payroll/run-batch {periodId}
Ctrl -> Batch: executePayrollBatch(periodId)
Batch -> DB: SELECT * FROM payroll_periods WHERE id = periodId AND status = 'OPEN'
DB --> Batch: Kỳ công hợp lệ
Batch -> DB: SELECT * FROM attendance_summaries WHERE periodId = periodId
DB --> Batch: 65.000+ bản ghi ngày công, OT, ca đêm
Batch -> ERP: GET /api/retail/store-sales & incentives {periodId}
ERP --> Batch: Dữ liệu doanh số siêu thị & hoa hồng sản phẩm
loop Xử lý song song từng nhân viên (Parallel Workers)
  Batch -> Calc: computeSalarySlip(employee, attendance, salesData)
  Calc -> Calc: Tính Lương thời gian = (Lương cơ bản / Ngày công chuẩn) * Công thực tế
  Calc -> Calc: Tính Tiền OT & Phụ cấp ca đêm
  Calc -> Calc: Tính Thưởng doanh số siêu thị (Store Target) & Hoa hồng sản phẩm
  Calc -> Calc: Khấu trừ BHXH, BHYT, BHTN (10.5%)
  Calc -> Calc: Tính Thuế TNCN lũy tiến 7 bậc sau giảm trừ gia cảnh
  Calc -> Calc: Khấu trừ nợ tạm ứng, vay quỹ phúc lợi (khống chế <= 30% lương Net)
  Calc --> Batch: SalarySlip Data
end
Batch -> DB: BULK INSERT INTO salary_slips (periodId, employeeData, status='DRAFT')
DB --> Batch: 65.000+ Slips Created
Batch --> Ctrl: Batch Process Completed
Ctrl --> UI: HTTP 200 OK (Thống kê tổng quỹ lương & Cảnh báo bất thường)
UI --> CB: Hiển thị bảng tổng hợp quỹ lương toàn quốc
@enduml
```
_Hình 2.16. Biểu đồ trình tự Use Case Vận hành chức năng tính lương tự động (UC27)._

---

### B.5. UC36 - Quy trình bàn giao thôi việc 4 khâu cấp tốc tại siêu thị

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
autonumber

actor "Nhân viên thôi việc" as NV
actor "Quản lý Siêu thị" as SM
actor "Chuyên viên C&B" as CB
actor "Kế toán viên" as KTV
control "ResignationController" as Ctrl
entity "HandoverService" as Svc
database "PostgreSQL" as DB

NV -> Ctrl: Nộp đơn thôi việc trên app MWG
Ctrl -> DB: INSERT INTO resignation_requests (empId, lastWorkingDate, status='PENDING')
SM -> Ctrl: Phê duyệt đơn thôi việc
Ctrl -> Svc: generateStoreHandoverChecklist(resignationId)
Svc -> DB: INSERT INTO handover_checklists (4 khâu: Siêu thị, IT, C&B, Kế toán)
DB --> Svc: Checklist Created

SM -> Ctrl: Xác nhận Khâu 1: Thu hồi két tiền, đồng phục, kiểm kê kho
Ctrl -> DB: UPDATE handover_items SET status='COMPLETED' WHERE step='STORE'

Svc -> Svc: Khâu 2 (IT tự động): Lên lịch khóa tài khoản lúc 23:59:59

CB -> Ctrl: Xác nhận Khâu 3: Chốt công tháng cuối, tính tiền phép thừa, báo giảm BHXH
Ctrl -> DB: UPDATE handover_items SET status='COMPLETED' WHERE step='CB'

KTV -> Ctrl: Xác nhận Khâu 4: Quyết toán nợ tạm ứng, đối soát công nợ
Ctrl -> DB: UPDATE handover_items SET status='COMPLETED' WHERE step='ACCOUNTING'

Svc -> DB: SELECT COUNT(*) FROM handover_items WHERE status != 'COMPLETED'
DB --> Svc: 0 (Đã hoàn tất 4/4 khâu)
Svc -> DB: UPDATE resignation_requests SET status='APPROVED_FOR_TERMINATION'
Svc -> DB: UPDATE users SET isActive=false, status='TERMINATED' at 23:59:59
DB --> Svc: User Disabled
Svc --> NV: Gửi thông báo quyết toán quyền lợi tài chính thành công
@enduml
```
_Hình 2.17. Biểu đồ trình tự Use Case Bàn giao thôi việc 4 khâu cấp tốc tại siêu thị (UC36)._

---

## C. BIỂU ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAMS)

### C.1. Luồng hoạt động Điểm danh di động GPS & FaceID (UC19)

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false

start
:Nhân viên mở chức năng "Điểm danh" trên app MWG;
:Ứng dụng kích hoạt GPS và quét mã Wifi BSSID;
if (Vị trí nằm trong bán kính 50m quanh siêu thị?) then (Có)
  if (Khớp mã BSSID Wifi nội bộ cửa hàng?) then (Có)
    :Kích hoạt camera trước quét khuôn mặt;
    :Trích xuất vector Face Embedding;
    if (Độ tương đồng >= 85% & Phát hiện người thật?) then (Khớp)
      :Ghi nhận sự kiện chấm công vào CSDL;
      :Hiển thị thông báo "Điểm danh thành công";
      stop
    else (Không khớp)
      :Báo lỗi "Khuôn mặt không khớp";
      :Cho phép thử lại tối đa 3 lần;
      stop
    end if
  else (Sai Wifi)
    :Yêu cầu kết nối đúng Wifi nội bộ của siêu thị;
    stop
  end if
else (Ngoài bán kính)
  :Hiển thị lỗi "Bạn đang ở ngoài phạm vi siêu thị";
  :Chặn điểm danh;
  stop
endif
@enduml
```
_Hình 2.18. Biểu đồ hoạt động quy trình điểm danh di động GPS & FaceID (UC19)._

---

### C.2. Luồng hoạt động Tính toán tiền lương bán lẻ 3P tự động (UC27)

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false

start
:Chuyên viên C&B bấm "Chạy tính lương tự động";
:Hệ thống kiểm tra trạng thái bảng chấm công tháng;
if (Bảng công đã được chốt (LOCKED)?) then (Có)
  :Đồng bộ số liệu doanh số siêu thị và hoa hồng ERP;
  :Khởi chạy xử lý theo lô 65.000 nhân sự;
  fork
    :Tính lương thời gian theo công thực tế;
  fork again
    :Tính tiền OT và phụ cấp ca đêm;
  fork again
    :Tính thưởng doanh số siêu thị & hoa hồng sản phẩm;
  end fork
  :Tổng hợp Tổng thu nhập trước thuế (Gross);
  :Khấu trừ bảo hiểm bắt buộc BHXH, BHYT, BHTN (10.5%);
  :Tính thuế TNCN theo biểu lũy tiến từng phần 7 bậc;
  :Khấu trừ nợ tạm ứng, vay phúc lợi (đảm bảo <= 30% Net);
  :Sinh bảng thanh toán lương dự thảo (DRAFT);
  :Hiển thị báo cáo tổng quỹ lương và cảnh báo ngoại lệ;
  stop
else (Chưa chốt công)
  :Báo lỗi "Bảng chấm công chưa được chốt sổ";
  :Hủy tiến trình tính lương;
  stop
endif
@enduml
```
_Hình 2.19. Biểu đồ hoạt động quy trình tính toán tiền lương bán lẻ 3P (UC27)._

---

## D. BIỂU ĐỒ TRẠNG THÁI (STATE MACHINE DIAGRAMS)

### D.1. Vòng đời Nhân viên Bán lẻ MWG

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false

[*] --> APPLICANT: Nộp hồ sơ tuyển dụng Mass ATS
APPLICANT --> OFFERED: Đạt phỏng vấn tập trung
OFFERED --> ONBOARDING: Xác nhận nhận việc điện tử
ONBOARDING --> PROBATION: Bắt đầu làm việc tại siêu thị (HĐ thử việc)
PROBATION --> OFFICIAL: Đánh giá thử việc Đạt (Ký HĐLĐ chính thức)
PROBATION --> TERMINATED: Không đạt yêu cầu thử việc
OFFICIAL --> SUSPENDED: Tạm hoãn HĐLĐ (Nghĩa vụ quân sự, thai sản)
SUSPENDED --> OFFICIAL: Quay lại làm việc
OFFICIAL --> TERMINATING: Nộp đơn xin thôi việc được duyệt
TERMINATING --> TERMINATED: Hoàn tất 4/4 khâu bàn giao siêu thị
TERMINATED --> [*]
@enduml
```
_Hình 2.20. Biểu đồ trạng thái vòng đời Nhân viên bán lẻ tại MWG._

---

### D.2. Vòng đời Kỳ tính lương (PayrollPeriod)

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false

[*] --> DRAFT: Khởi tạo kỳ lương tháng mới
DRAFT --> CALCULATED: Chạy chức năng tính lương tự động xong
CALCULATED --> DRAFT: Phát hiện sai sót, tính toán lại
CALCULATED --> REVIEWED: Kế toán đối soát khớp đúng số liệu
REVIEWED --> APPROVED: Tổng Giám đốc ký duyệt điện tử
APPROVED --> LOCKED: Bấm "Khóa kỳ lương bất biến"
note right of LOCKED: Không thể chỉnh sửa số liệu.\nXuất file chi trả ngân hàng.
LOCKED --> [*]
@enduml
```
_Hình 2.21. Biểu đồ trạng thái Kỳ tính lương bán lẻ._

---

## E. BIỂU ĐỒ GÓI VÀ KIẾN TRÚC PHẦN MỀM 3 TẦNG

### E.1. Sơ đồ Kiến trúc Phần mềm 3 Tầng phân tán của MWG

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
skinparam packageStyle rectangle

package "TẦNG GIAO DIỆN NGƯỜI DÙNG (PRESENTATION TIER)" {
  [MWG Mobile App\n(React Native iOS/Android)] as MobileApp
  [Admin Web Portal\n(Next.js & Tailwind CSS)] as WebAdmin
  [Kiosk Attendance\n(Web Tablet / FaceID)] as Kiosk
}

package "TẦNG XỬ LÝ NGHIỆP VỤ (BUSINESS LOGIC TIER - NestJS)" {
  [API Gateway & Auth (JWT/RBAC)] as Gateway
  [Store Scheduling Engine (Phân ca xoay)] as ShiftEngine
  [Geo & FaceID Verification Service] as GeoService
  [Mass ATS Workflow Engine] as AtsEngine
  [Retail Payroll Engine (Lương 3P & ERP)] as PayrollEngine
  [Background Job Queue (Redis BullQueue)] as JobQueue
}

package "TẦNG LƯU TRỮ DỮ LIỆU (DATA TIER)" {
  database "PostgreSQL 16\n(87 Bảng quan hệ - Partitioned)" as MainDB
  database "Redis Cache\n(Session & Geofence Store Data)" as Cache
  [AWS S3 / MinIO\n(Tài liệu số & Hợp đồng E-Sign)] as FileStore
}

cloud "HỆ THỐNG NGOÀI (EXTERNAL SYSTEMS)" {
  [ERP Bán lẻ MWG\n(Doanh số siêu thị & Hoa hồng)] as ERP
  [Hệ thống Ngân hàng\n(Chi lương tự động VCB/BIDV)] as Bank
  [Tổng kho DC Hardware\n(Máy chấm công vân tay ZKTeco)] as DC_HW
}

MobileApp --> Gateway: HTTPS / REST API
WebAdmin --> Gateway: HTTPS / REST API
Kiosk --> Gateway: HTTPS / REST API

Gateway --> ShiftEngine
Gateway --> GeoService
Gateway --> AtsEngine
Gateway --> PayrollEngine

PayrollEngine --> ERP: Đồng bộ doanh số & Incentive
PayrollEngine --> Bank: Xuất lệnh chi lương
GeoService --> DC_HW: Đồng bộ dữ liệu quẹt thẻ kho

ShiftEngine --> JobQueue
PayrollEngine --> JobQueue

ShiftEngine --> MainDB
AtsEngine --> MainDB
PayrollEngine --> MainDB
GeoService --> Cache
Gateway --> Cache
AtsEngine --> FileStore

@enduml
```
_Hình 2.22. Sơ đồ kiến trúc phần mềm 3 tầng phân tán tối ưu hóa cho chuỗi bán lẻ quy mô lớn MWG._

---

## F. BIỂU ĐỒ LỚP CHI TIẾT (CLASS DIAGRAMS)

### F.1. Biểu đồ Lớp Miền Cốt lõi (Domain Model) của Hệ thống HRMS MWG

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
skinparam classAttributeIconSize 0

class OrgUnit {
  - id: String
  - code: String
  - name: String
  - type: UnitType
  - parentId: String
  + getSubUnits()
  + getHeadCount()
}

class StoreLocation {
  - id: String
  - storeCode: String
  - address: String
  - latitude: Float
  - longitude: Float
  - geofenceRadius: Float
  - wifiBssid: String
  + isWithinRange(lat, lng): Boolean
}

class Employee {
  - id: String
  - employeeCode: String
  - fullName: String
  - idCardNumber: String
  - email: String
  - phone: String
  - status: EmployeeStatus
  - currentStoreId: String
  + getActiveContract(): Contract
  + getLeaveBalance(): LeaveBalance
}

class WorkShift {
  - id: String
  - shiftCode: String
  - shiftName: String
  - startTime: Time
  - endTime: Time
  - isOvernight: Boolean
}

class ShiftAssignment {
  - id: String
  - employeeId: String
  - storeId: String
  - shiftId: String
  - date: Date
  - isSwapped: Boolean
  + swapWith(otherEmployee)
}

class AttendanceEvent {
  - id: String
  - employeeId: String
  - storeId: String
  - eventTime: DateTime
  - eventType: EventType
  - verifyMethod: VerifyMethod
  - isVerified: Boolean
}

class Contract {
  - id: String
  - contractNumber: String
  - contractType: ContractType
  - basicSalary: Decimal
  - startDate: Date
  - endDate: Date
  - eSignatureStatus: ESignStatus
  + signViaOtp(otpCode)
}

class SalarySlip {
  - id: String
  - periodId: String
  - employeeId: String
  - basicSalary: Decimal
  - storeSalesBonus: Decimal
  - productIncentive: Decimal
  - csatBonus: Decimal
  - otPay: Decimal
  - deductions: Decimal
  - netPay: Decimal
  - isLocked: Boolean
  + lockSlip()
}

OrgUnit "1" *-- "many" OrgUnit: cha - con
OrgUnit "1" -- "0..1" StoreLocation: vị trí siêu thị
OrgUnit "1" -- "many" Employee: trực thuộc
Employee "1" -- "many" Contract: ký kết
Employee "1" -- "many" ShiftAssignment: phân ca
WorkShift "1" -- "many" ShiftAssignment: mẫu ca
Employee "1" -- "many" AttendanceEvent: chấm công
Employee "1" -- "many" SalarySlip: nhận lương
@enduml
```
_Hình 2.23. Biểu đồ lớp miền cốt lõi của hệ thống Quản trị nhân lực MWG (Domain Model)._

---

## G. MÔ HÌNH CSDL MỞ RỘNG CHO ĐIỂM DANH ĐA NGUỒN

```plantuml
@startuml
skinparam linetype ortho
skinparam shadowing false
skinparam classAttributeIconSize 0

entity "StoreLocation" as store {
  * id : varchar(36) [PK]
  --
  * storeCode : varchar(20) [UQ]
  * storeName : varchar(150)
  * latitude : decimal(10,8)
  * longitude : decimal(11,8)
  * geofenceRadius : float (default 50.0)
  * wifiBssid : varchar(50)
  * isActive : boolean
}

entity "FaceEmbedding" as face {
  * id : varchar(36) [PK]
  --
  * employeeId : varchar(36) [FK]
  * vectorData : text (encrypted)
  * algorithmVersion : varchar(20)
  * registeredAt : timestamp
}

entity "AttendanceDevice" as dev {
  * id : varchar(36) [PK]
  --
  * deviceSerial : varchar(50) [UQ]
  * warehouseId : varchar(36)
  * ipAddress : varchar(45)
  * deviceType : varchar(30) (FINGERPRINT/CARD)
  * lastSyncAt : timestamp
}

entity "AttendanceEvent" as event {
  * id : varchar(36) [PK]
  --
  * employeeId : varchar(36) [FK]
  * storeId : varchar(36) [FK]
  * eventTime : timestamp
  * eventType : varchar(10) (CHECK_IN / CHECK_OUT)
  * verifyMethod : varchar(20) (GPS_FACE / WIFI / FINGERPRINT)
  * latitude : decimal(10,8)
  * longitude : decimal(11,8)
  * rawBssid : varchar(50)
  * isFraudSuspected : boolean
}

entity "AttendanceDay" as day {
  * id : varchar(36) [PK]
  --
  * employeeId : varchar(36) [FK]
  * workDate : date
  * assignedShiftId : varchar(36)
  * firstCheckIn : timestamp
  * lastCheckOut : timestamp
  * workHours : decimal(4,2)
  * otHours : decimal(4,2)
  * status : varchar(20) (FULL / LATE / EARLY / ABSENT)
}

entity "AttendanceCorrection" as corr {
  * id : varchar(36) [PK]
  --
  * attendanceDayId : varchar(36) [FK]
  * reason : varchar(255)
  * proofAttachment : varchar(255)
  * approvedBy : varchar(36) (Store Manager SM)
  * status : varchar(20) (PENDING / APPROVED / REJECTED)
}

store ||--o{ event : "được ghi nhận tại"
face ||--o{ event : "đối chiếu sinh trắc"
dev ||--o{ event : "truyền sự kiện từ kho"
event }o--|| day : "tổng hợp thành"
day ||--o{ corr : "giải trình sai lệch"
@enduml
```
_Hình 2.24. Mô hình cơ sở dữ liệu mở rộng cho phân hệ chấm công đa nguồn phân tán tại MWG._
