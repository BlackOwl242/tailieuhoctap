3.3. Thiết kế hệ thống

3.3.1. Mục tiêu của thiết kế:

Thiết kế hệ thống là giai đoạn mang tính bản lề trong quy trình xây dựng phần mềm, giữ vai trò chuyển dịch toàn bộ các đặc tả yêu cầu nghiệp vụ thu được ở giai đoạn trước thành một đồ án kỹ thuật chi tiết làm cơ sở trực tiếp cho công tác lập trình. Khi các yêu cầu phần mềm được phân tích và đặc tả hoàn chỉnh, hoạt động thiết kế là một trong ba hoạt động cốt lõi không thể tách rời nhằm xây dựng và kiểm chứng phần mềm bao gồm: Thiết kế – Lập trình – Kiểm thử.

[[IMAGE: assets/diagrams/hinh_3_3_1_a_giai_doan_phan_mem.png | Caption: Hình ảnh 3.3.1.a. Các giai đoạn của phần mềm.]]

Dưới góc độ kỹ thuật công nghệ phần mềm, công đoạn thiết kế được phân rã thành các giai đoạn tuần tự nhằm bảo đảm tính toàn vẹn và khả năng kiểm soát chất lượng kỹ thuật cao nhất.

[[IMAGE: assets/diagrams/hinh_3_3_1_b_quy_trinh_thiet_ke.png | Caption: Hình ảnh 3.3.1.b. Quy trình thiết kế phần mềm.]]

Mục tiêu cụ thể của thiết kế hệ thống bao gồm:
- Thiết lập một kiến trúc tổng thể vững chắc theo mô hình ba tầng kết hợp phong cách dịch vụ web chuẩn RESTful API, bảo đảm sự độc lập hoàn toàn giữa giao diện người dùng, logic nghiệp vụ máy chủ và cơ sở dữ liệu.
- Xây dựng một cơ sở dữ liệu quan hệ hoàn chỉnh, chuyên nghiệp và đạt chuẩn ba dạng chuẩn (3NF) với 28 bảng thực thể nhằm quản lý toàn diện mọi mặt hoạt động của nền tảng tuyển dụng hiện đại, loại bỏ hoàn toàn hiện tượng dư thừa và dị thường dữ liệu.
- Định hình cấu trúc giao diện người dùng công thái học, trực quan, thân thiện và đáp ứng đa dạng kích thước màn hình thiết bị.

3.3.2. Thiết kế kiến trúc:

Hệ thống TalentConnect được xây dựng dựa trên hai bản thiết kế kiến trúc cốt lõi:

a. Sơ đồ phân rã chức năng (Functional Decomposition Diagram - FDD):
Sơ đồ phân rã toàn bộ hệ thống TalentConnect thành 4 nhánh chức năng nghiệp vụ độc lập: Phân hệ tài khoản và phân quyền; Phân hệ quản lý tin tuyển dụng và tìm kiếm; Phân hệ quản lý hồ sơ năng lực trực tuyến; và Phân hệ quản lý tuyển dụng theo phễu, kiểm duyệt và báo cáo.

[[IMAGE: assets/diagrams/hinh_3_9_fdd.png | Caption: Hình ảnh 3.3.2.a. Sơ đồ phân rã chức năng.]]

b. Sơ đồ Kiến trúc Tổng thể (Architecture Diagram):
Hệ thống tuân thủ mô hình kiến trúc ba tầng kết hợp giao thức truyền tải dữ liệu JSON qua HTTPS:
- Tầng trình diễn (Presentation Layer): Xây dựng bằng ReactJS và Tailwind CSS, giao tiếp bất đồng bộ qua Axios.
- Tầng nghiệp vụ (Business Logic Layer): Xây dựng bằng Node.js và Express.js, đảm nhiệm định tuyến API, xác thực bảo mật JWT, xử lý logic tìm kiếm lọc đa chiều và quản lý phễu ứng viên.
- Tầng dữ liệu (Data Access Layer): Sử dụng hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ (SQL Server hoặc MySQL) kết hợp kho lưu trữ tệp tài liệu số.

[[IMAGE: assets/diagrams/hinh_3_10_architecture.png | Caption: Hình ảnh 3.3.2.b. Sơ đồ kiến trúc tổng thể.]]

---

3.3.3. Thiết kế cơ sở dữ liệu:

3.3.3.1. Phân tích thực thể và Mối quan hệ (Entities & Relationships)

Để xây dựng một hệ thống tuyển dụng và tìm kiếm việc làm đạt chuẩn doanh nghiệp tương tự như các nền tảng lớn trên thị trường, hệ thống TalentConnect được thiết kế với 28 thực thể phân chia thành 6 phân vùng nghiệp vụ liên kết chặt chẽ:

1. Phân vùng Quản trị Tài khoản & Phân quyền bảo mật (RBAC): Gồm 7 bảng `Roles`, `Permissions`, `RolePermissions`, `Users`, `UserRoles`, `UserSessions`, `AuditLogs`.
2. Phân vùng Hồ sơ Ứng viên & Danh mục năng lực: Gồm 7 bảng `Candidates`, `CandidateEducations`, `CandidateExperiences`, `CandidateSkills`, `CandidateCertificates`, `CandidateProjects`, `Resumes`.
3. Phân vùng Đơn vị Tuyển dụng & Danh mục dùng chung: Gồm 4 bảng `Employers`, `CompanyLocations`, `Categories`, `Skills`.
4. Phân vùng Tin tuyển dụng & Yêu cầu công việc: Gồm 2 bảng `Jobs`, `JobSkills`.
5. Phân vùng Quy trình Tuyển dụng & Quản lý phễu ATS: Gồm 3 bảng `Applications`, `ApplicationHistories`, `Interviews`.
6. Phân vùng Tương tác, Giữ chân người dùng & Đánh giá: Gồm 5 bảng `SavedJobs`, `FollowedCompanies`, `CompanyReviews`, `JobAlerts`, `Notifications`.

3.3.3.2. Thiết kế ERD (Entity Relationship Diagram)

Sơ đồ thể hiện toàn bộ các thực thể, khóa chính (PK), khóa ngoại (FK) và mối quan hệ một - một, một - nhiều giữa các bảng dữ liệu trong hệ thống TalentConnect:

[[IMAGE: assets/diagrams/hinh_3_11_erd.png | Caption: Hình ảnh 3.3.3.2. Biểu đồ ERD.]]

3.3.3.3. Bảng từ điển dữ liệu chi tiết (28 bảng)

Dưới đây là đặc tả chi tiết cấu trúc dữ liệu của toàn bộ 28 bảng trong cơ sở dữ liệu TalentConnect:

Bảng 3.6: Bảng Vai trò người dùng (Roles)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| RoleID | INT | PK | Không | Mã định danh vai trò, tự động tăng |
| RoleName | NVARCHAR(50) | | Không | Tên vai trò (Ứng viên, Nhà tuyển dụng, Quản trị viên) |
| RoleCode | VARCHAR(30) | | Không | Mã định danh kỹ thuật (ROLE_CANDIDATE, ROLE_EMPLOYER, ROLE_ADMIN) |
| Description | NVARCHAR(255) | | Có | Mô tả phạm vi quyền hạn của vai trò |

Bảng 3.7: Bảng Danh mục quyền hạn chi tiết (Permissions)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| PermissionID | INT | PK | Không | Mã định danh quyền hạn, tự động tăng |
| PermissionName | NVARCHAR(100) | | Không | Tên quyền hạn (Đăng tin, Duyệt tin, Xem hồ sơ, Xuất báo cáo) |
| ModuleName | VARCHAR(50) | | Không | Tên phân hệ chức năng tương ứng |
| ActionCode | VARCHAR(50) | | Không | Mã hành vi thực thi (CREATE, READ, UPDATE, DELETE, MODERATE) |

Bảng 3.8: Bảng Gán quyền cho vai trò (RolePermissions)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| RoleID | INT | PK, FK | Không | Khóa ngoại tham chiếu bảng Roles |
| PermissionID | INT | PK, FK | Không | Khóa ngoại tham chiếu bảng Permissions |

Bảng 3.9: Bảng Tài khoản người dùng (Users)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| UserID | INT | PK | Không | Mã số tài khoản người dùng, tự động tăng |
| Email | VARCHAR(150) | | Không | Địa chỉ thư điện tử dùng để đăng nhập, duy nhất |
| PasswordHash | VARCHAR(255) | | Không | Chuỗi mật khẩu đã được băm mã hóa một chiều bằng Bcrypt |
| PhoneNumber | VARCHAR(15) | | Có | Số điện thoại liên lạc chính thức |
| AccountStatus | VARCHAR(20) | | Không | Trạng thái (Active, Pending, Suspended, Deleted) |
| EmailVerifiedAt | DATETIME | | Có | Thời điểm xác thực thư điện tử thành công |
| CreatedAt | DATETIME | | Không | Thời điểm đăng ký tài khoản |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật thông tin tài khoản |

Bảng 3.10: Bảng Phân vai trò người dùng (UserRoles)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| UserID | INT | PK, FK | Không | Khóa ngoại tham chiếu bảng Users |
| RoleID | INT | PK, FK | Không | Khóa ngoại tham chiếu bảng Roles |
| AssignedAt | DATETIME | | Không | Thời điểm phân bổ vai trò cho tài khoản |

Bảng 3.11: Bảng Quản lý phiên làm việc (UserSessions)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| SessionID | INT | PK | Không | Mã số định danh phiên làm việc, tự động tăng |
| UserID | INT | FK | Không | Khóa ngoại tham chiếu bảng Users |
| RefreshToken | VARCHAR(500) | | Không | Mã làm mới phiên làm việc |
| IPAddress | VARCHAR(45) | | Có | Địa chỉ IP của thiết bị đăng nhập |
| UserAgent | NVARCHAR(255) | | Có | Thông tin trình duyệt và hệ điều hành |
| ExpiresAt | DATETIME | | Không | Thời điểm hết hạn phiên làm việc |

Bảng 3.12: Bảng Nhật ký thao tác hệ thống (AuditLogs)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| LogID | BIGINT | PK | Không | Mã số nhật ký kiểm toán, tự động tăng |
| UserID | INT | FK | Có | Khóa ngoại tham chiếu tài khoản thực hiện thao tác |
| ActionType | VARCHAR(50) | | Không | Loại hành động (LOGIN, CREATE_JOB, APPROVE_EMPLOYER, DELETE_USER) |
| EntityName | VARCHAR(50) | | Không | Tên bảng dữ liệu bị tác động |
| EntityID | INT | | Có | Khóa chính của bản ghi bị tác động |
| Description | NVARCHAR(MAX) | | Có | Mô tả chi tiết dữ liệu thay đổi |
| CreatedAt | DATETIME | | Không | Thời điểm phát sinh hành động |

Bảng 3.13: Bảng Hồ sơ người tìm việc (Candidates)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CandidateID | INT | PK | Không | Mã định danh hồ sơ ứng viên, tự động tăng |
| UserID | INT | FK | Không | Khóa ngoại tham chiếu duy nhất tới bảng Users |
| FullName | NVARCHAR(100) | | Không | Họ và tên đầy đủ của người tìm việc |
| AvatarURL | VARCHAR(255) | | Có | Đường dẫn ảnh đại diện cá nhân |
| Gender | NVARCHAR(10) | | Có | Giới tính (Nam, Nữ, Khác) |
| DateOfBirth | DATE | | Có | Ngày tháng năm sinh |
| Address | NVARCHAR(255) | | Có | Địa chỉ nơi cư trú |
| ProvinceID | INT | | Có | Mã tỉnh thành phố làm việc |
| CurrentPosition | NVARCHAR(100) | | Có | Chức danh công việc hiện tại |
| DesiredSalaryMin | DECIMAL(12,2)| | Có | Mức lương mong muốn tối thiểu |
| DesiredSalaryMax | DECIMAL(12,2)| | Có | Mức lương mong muốn tối đa |
| IsOpenForWork | BIT | | Không | Trạng thái bật chế độ tìm việc để nhà tuyển dụng săn đón |
| BioSummary | NVARCHAR(MAX) | | Có | Tóm tắt mục tiêu và thế mạnh bản thân |

Bảng 3.14: Bảng Lịch sử học vấn ứng viên (CandidateEducations)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| EducationID | INT | PK | Không | Mã định danh bản ghi học vấn, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu bảng Candidates |
| SchoolName | NVARCHAR(150) | | Không | Tên trường đại học, cao đẳng hoặc cơ sở đào tạo |
| Major | NVARCHAR(100) | | Không | Ngành hoặc chuyên ngành đào tạo |
| Degree | NVARCHAR(50) | | Có | Bằng cấp đạt được (Cử nhân, Kỹ sư, Thạc sĩ) |
| StartDate | DATE | | Không | Ngày bắt đầu theo học |
| EndDate | DATE | | Có | Ngày tốt nghiệp hoặc dự kiến tốt nghiệp |
| IsCurrent | BIT | | Không | Cờ xác định có đang theo học hay không |
| GPA | DECIMAL(3,2) | | Có | Điểm trung bình tích lũy thang 4.0 |
| Description | NVARCHAR(500) | | Có | Thành tích học tập hoặc đề tài nghiên cứu |

Bảng 3.15: Bảng Lịch sử kinh nghiệm làm việc (CandidateExperiences)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ExperienceID | INT | PK | Không | Mã định danh kinh nghiệm, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu bảng Candidates |
| CompanyName | NVARCHAR(150) | | Không | Tên cơ quan hoặc doanh nghiệp từng công tác |
| Position | NVARCHAR(100) | | Không | Vị trí chức danh đảm nhiệm |
| StartDate | DATE | | Không | Ngày bắt đầu làm việc |
| EndDate | DATE | | Có | Ngày kết thúc công tác |
| IsCurrent | BIT | | Không | Cờ xác định có đang làm việc tại đây hay không |
| Responsibilities | NVARCHAR(MAX) | | Có | Mô tả các nhiệm vụ và trách nhiệm chính |
| Achievements | NVARCHAR(MAX) | | Có | Các thành tích nổi bật đạt được trong quá trình công tác |

Bảng 3.16: Bảng Kỹ năng ứng viên (CandidateSkills)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CandidateSkillID | INT | PK | Không | Mã định danh kỹ năng ứng viên, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu bảng Candidates |
| SkillID | INT | FK | Không | Khóa ngoại tham chiếu bảng Skills |
| ProficiencyLevel | INT | | Không | Mức độ thành thạo từ 1 đến 5 sao |
| YearsOfExperience| DECIMAL(3,1) | | Có | Số năm áp dụng kỹ năng trong thực tế |

Bảng 3.17: Bảng Chứng chỉ chuyên môn (CandidateCertificates)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CertificateID | INT | PK | Không | Mã định danh chứng chỉ, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu bảng Candidates |
| CertificateName | NVARCHAR(150) | | Không | Tên chứng chỉ chuyên môn hoặc ngoại ngữ |
| IssuingOrg | NVARCHAR(150) | | Không | Đơn vị hoặc tổ chức cấp chứng chỉ |
| IssueDate | DATE | | Không | Ngày cấp chứng chỉ |
| ExpirationDate | DATE | | Có | Ngày hết hạn hiệu lực |
| CredentialURL | VARCHAR(255) | | Có | Liên kết tra cứu tính xác thực của chứng chỉ |

Bảng 3.18: Bảng Dự án thực tế đã làm (CandidateProjects)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ProjectID | INT | PK | Không | Mã định danh dự án, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu bảng Candidates |
| ProjectName | NVARCHAR(150) | | Không | Tên dự án tham gia thực hiện |
| RoleInProject | NVARCHAR(100) | | Không | Vai trò đảm nhiệm trong dự án |
| TechStack | NVARCHAR(200) | | Có | Công nghệ và ngôn ngữ sử dụng |
| ProjectURL | VARCHAR(255) | | Có | Liên kết demo hoặc mã nguồn dự án |
| Description | NVARCHAR(MAX) | | Có | Mô tả mục tiêu và quy mô dự án |

Bảng 3.19: Bảng Bản lý lịch năng lực hoàn chỉnh (Resumes)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ResumeID | INT | PK | Không | Mã định danh bản lý lịch, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu bảng Candidates |
| ResumeTitle | NVARCHAR(150) | | Không | Tên gọi phân biệt của bản lý lịch |
| ResumeJSON | NVARCHAR(MAX) | | Có | Chuỗi dữ liệu có cấu trúc chứa toàn bộ nội dung CV |
| FileURL | VARCHAR(255) | | Có | Đường dẫn tệp PDF kết xuất lưu trữ trên máy chủ |
| TemplateID | VARCHAR(50) | | Không | Tên mẫu trình bày được lựa chọn |
| ThemeColor | VARCHAR(20) | | Không | Mã màu sắc chủ đạo của CV |
| ProfileScore | INT | | Không | Điểm hoàn thiện hồ sơ từ 0 đến 100% |
| IsDefault | BIT | | Không | Cờ xác định bản lý lịch mặc định dùng để ứng tuyển |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật nội dung gần nhất |

Bảng 3.20: Bảng Đơn vị tuyển dụng (Employers)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| EmployerID | INT | PK | Không | Mã số định danh doanh nghiệp, tự động tăng |
| UserID | INT | FK | Không | Khóa ngoại tham chiếu duy nhất tới bảng Users |
| CompanyName | NVARCHAR(200) | | Không | Tên đầy đủ của doanh nghiệp tuyển dụng |
| TaxCode | VARCHAR(20) | | Không | Mã số thuế doanh nghiệp phục vụ kiểm tra pháp lý |
| BusinessLicenseURL| VARCHAR(255) | | Có | Đường dẫn ảnh giấy phép đăng ký kinh doanh |
| CompanySize | VARCHAR(50) | | Có | Quy mô nhân sự (Dưới 50, 50-200, Trên 500 nhân sự) |
| Address | NVARCHAR(255) | | Không | Địa chỉ trụ sở chính của công ty |
| WebsiteURL | VARCHAR(255) | | Có | Liên kết trang web chính thức |
| LogoURL | VARCHAR(255) | | Có | Đường dẫn tệp ảnh biểu trưng doanh nghiệp |
| CoverImageURL | VARCHAR(255) | | Có | Đường dẫn ảnh bìa trang giới thiệu công ty |
| CompanyBio | NVARCHAR(MAX) | | Có | Bài viết giới thiệu văn hóa và chế độ đãi ngộ |
| VerificationStatus| VARCHAR(20) | | Không | Trạng thái phê duyệt (Pending, Approved, Rejected) |
| VerifiedByAdminID | INT | FK | Có | Khóa ngoại tham chiếu quản trị viên phê duyệt |
| VerifiedAt | DATETIME | | Có | Thời điểm phê duyệt doanh nghiệp |

Bảng 3.21: Bảng Địa điểm làm việc công ty (CompanyLocations)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| LocationID | INT | PK | Không | Mã định danh địa điểm làm việc, tự động tăng |
| EmployerID | INT | FK | Không | Khóa ngoại tham chiếu bảng Employers |
| LocationName | NVARCHAR(100) | | Không | Tên chi nhánh hoặc văn phòng đại diện |
| FullAddress | NVARCHAR(255) | | Không | Địa chỉ chi tiết nơi làm việc |
| ProvinceID | INT | | Không | Mã tỉnh thành phố |
| IsHeadquarter | BIT | | Không | Cờ xác định đây có phải trụ sở chính hay không |

Bảng 3.22: Bảng Danh mục ngành nghề (Categories)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CategoryID | INT | PK | Không | Mã định danh ngành nghề, tự động tăng |
| ParentCategoryID | INT | FK | Có | Khóa ngoại tham chiếu ngành nghề cha (phân cấp đa cấp) |
| CategoryName | NVARCHAR(100) | | Không | Tên phân loại ngành nghề công việc |
| Slug | VARCHAR(100) | | Không | Chuỗi định danh đường dẫn thân thiện URL |
| IconURL | VARCHAR(255) | | Có | Biểu tượng minh họa ngành nghề |

Bảng 3.23: Bảng Từ điển kỹ năng chuyên môn (Skills)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| SkillID | INT | PK | Không | Mã định danh kỹ năng, tự động tăng |
| CategoryID | INT | FK | Không | Khóa ngoại tham chiếu bảng Categories |
| SkillName | NVARCHAR(100) | | Không | Tên kỹ năng chuyên môn (Java, ReactJS, Kế toán thuế) |
| SkillCode | VARCHAR(50) | | Không | Mã kỹ năng chuẩn hóa phục vụ so khớp |

Bảng 3.24: Bảng Tin tuyển dụng (Jobs)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| JobID | INT | PK | Không | Mã số định danh bài đăng tuyển dụng, tự động tăng |
| EmployerID | INT | FK | Không | Khóa ngoại tham chiếu đơn vị tuyển dụng sở hữu |
| CategoryID | INT | FK | Không | Khóa ngoại tham chiếu danh mục ngành nghề |
| LocationID | INT | FK | Có | Khóa ngoại tham chiếu địa điểm làm việc cụ thể |
| JobTitle | NVARCHAR(200) | | Không | Tiêu đề bài đăng tuyển dụng |
| Quantity | INT | | Không | Số lượng nhân sự cần tuyển |
| JobDescription | NVARCHAR(MAX) | | Không | Chi tiết bản mô tả nhiệm vụ công việc |
| JobRequirements | NVARCHAR(MAX) | | Không | Các yêu cầu về năng lực, chuyên môn và kinh nghiệm |
| Benefits | NVARCHAR(MAX) | | Có | Các chính sách đãi ngộ, bảo hiểm, thưởng |
| SalaryMin | DECIMAL(12,2)| | Có | Mức lương tối thiểu trong khoảng đề xuất |
| SalaryMax | DECIMAL(12,2)| | Có | Mức lương tối đa trong khoảng đề xuất |
| IsNegotiableSalary| BIT | | Không | Cờ xác định mức lương thỏa thuận |
| EmploymentType | NVARCHAR(50) | | Không | Hình thức làm việc (Toàn thời gian, Bán thời gian, Remote) |
| ExperienceLevel | NVARCHAR(50) | | Có | Yêu cầu số năm kinh nghiệm (Chưa có, 1-3 năm, Trên 5 năm) |
| ExpirationDate | DATE | | Không | Ngày hết hạn tiếp nhận đơn ứng tuyển |
| JobStatus | VARCHAR(20) | | Không | Trạng thái (Draft, Pending, Active, Expired, Closed) |
| ViewCount | INT | | Không | Tổng số lượt người dùng nhấp xem tin |
| ApplyCount | INT | | Không | Tổng số lượng hồ sơ đã nộp vào bài đăng này |
| CreatedAt | DATETIME | | Không | Thời điểm đăng bài lên hệ thống |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật nội dung gần nhất |

Bảng 3.25: Bảng Kỹ năng yêu cầu của tin tuyển dụng (JobSkills)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| JobSkillID | INT | PK | Không | Mã định danh kỹ năng yêu cầu, tự động tăng |
| JobID | INT | FK | Không | Khóa ngoại tham chiếu bảng Jobs |
| SkillID | INT | FK | Không | Khóa ngoại tham chiếu bảng Skills |
| IsRequired | BIT | | Không | Cờ xác định kỹ năng bắt buộc hay ưu tiên |
| PriorityWeight | INT | | Không | Trọng số ưu tiên phục vụ thuật toán so khớp độ phù hợp |

Bảng 3.26: Bảng Đơn ứng tuyển (Applications)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ApplicationID | INT | PK | Không | Mã định danh đơn ứng tuyển, tự động tăng |
| JobID | INT | FK | Không | Khóa ngoại tham chiếu bài đăng tuyển dụng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu người tìm việc nộp đơn |
| ResumeID | INT | FK | Không | Khóa ngoại tham chiếu bản lý lịch được sử dụng |
| CoverLetter | NVARCHAR(MAX) | | Có | Thư giới thiệu bản thân gửi nhà tuyển dụng |
| ApplicationStatus| VARCHAR(20) | | Không | Trạng thái phễu (Submitted, Viewed, Interview, Offered, Accepted, Rejected) |
| MatchScore | DECIMAL(5,2) | | Có | Điểm tương thích giữa CV và JD (0 đến 100%) |
| InternalRating | INT | | Có | Đánh giá xếp hạng nội bộ của doanh nghiệp (1-5 sao) |
| AppliedAt | DATETIME | | Không | Thời điểm gửi đơn ứng tuyển |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật trạng thái mới nhất |

Bảng 3.27: Bảng Lịch sử chuyển trạng thái hồ sơ (ApplicationHistories)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| HistoryID | INT | PK | Không | Mã định danh lịch sử phễu, tự động tăng |
| ApplicationID | INT | FK | Không | Khóa ngoại tham chiếu bảng Applications |
| FromStatus | VARCHAR(20) | | Không | Trạng thái trước khi chuyển đổi |
| ToStatus | VARCHAR(20) | | Không | Trạng thái mới sau khi chuyển đổi |
| ChangedByUserID | INT | FK | Không | Khóa ngoại tham chiếu người thực hiện chuyển đổi |
| ChangeNote | NVARCHAR(500) | | Có | Ghi chú lý do chuyển đổi trạng thái |
| ChangedAt | DATETIME | | Không | Thời điểm thực hiện chuyển đổi |

Bảng 3.28: Bảng Quản lý lịch phỏng vấn (Interviews)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| InterviewID | INT | PK | Không | Mã định danh lịch phỏng vấn, tự động tăng |
| ApplicationID | INT | FK | Không | Khóa ngoại tham chiếu bảng Applications |
| EmployerID | INT | FK | Không | Khóa ngoại tham chiếu đơn vị tuyển dụng |
| InterviewTime | DATETIME | | Không | Thời gian tổ chức phỏng vấn |
| FormatType | VARCHAR(20) | | Không | Hình thức phỏng vấn (Online, Offline) |
| MeetingURL | VARCHAR(255) | | Có | Liên kết phòng họp trực tuyến |
| LocationAddress | NVARCHAR(255) | | Có | Địa chỉ phòng phỏng vấn trực tiếp |
| InterviewerName | NVARCHAR(100) | | Có | Tên người phỏng vấn đại diện công ty |
| ResultStatus | VARCHAR(20) | | Không | Kết quả phỏng vấn (Pending, Passed, Failed) |
| FeedbackNotes | NVARCHAR(MAX) | | Có | Đánh giá chi tiết của hội đồng phỏng vấn |

Bảng 3.29: Bảng Việc làm đã lưu (SavedJobs)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| SavedJobID | INT | PK | Không | Mã định danh bản ghi lưu việc, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu người tìm việc |
| JobID | INT | FK | Không | Khóa ngoại tham chiếu bài đăng được lưu |
| SavedAt | DATETIME | | Không | Thời điểm đánh dấu lưu công việc |

Bảng 3.30: Bảng Doanh nghiệp được theo dõi (FollowedCompanies)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| FollowID | INT | PK | Không | Mã định danh theo dõi, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu người tìm việc theo dõi |
| EmployerID | INT | FK | Không | Khóa ngoại tham chiếu doanh nghiệp được theo dõi |
| FollowedAt | DATETIME | | Không | Thời điểm bấm theo dõi doanh nghiệp |

Bảng 3.31: Bảng Đánh giá doanh nghiệp ẩn danh (CompanyReviews)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ReviewID | INT | PK | Không | Mã số định danh bài đánh giá, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu người đánh giá |
| EmployerID | INT | FK | Không | Khóa ngoại tham chiếu doanh nghiệp bị đánh giá |
| OverallRating | INT | | Không | Điểm đánh giá tổng quan từ 1 đến 5 sao |
| SalaryRating | INT | | Không | Điểm hài lòng về lương thưởng (1-5 sao) |
| TrainingRating | INT | | Không | Điểm cơ hội đào tạo và học hỏi (1-5 sao) |
| CultureRating | INT | | Không | Điểm văn hóa và môi trường làm việc (1-5 sao) |
| WorkLifeBalance | INT | | Không | Điểm cân bằng công việc và cuộc sống (1-5 sao) |
| Pros | NVARCHAR(MAX) | | Không | Nhận xét các ưu điểm nổi bật của công ty |
| Cons | NVARCHAR(MAX) | | Không | Nhận xét các điểm công ty cần cải thiện |
| ModerationStatus | VARCHAR(20) | | Không | Trạng thái duyệt của Admin (Pending, Approved, Rejected) |
| CreatedAt | DATETIME | | Không | Thời điểm gửi bài đánh giá |

Bảng 3.32: Bảng Đăng ký thông báo việc làm tự động (JobAlerts)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| AlertID | INT | PK | Không | Mã định danh thiết lập thông báo, tự động tăng |
| CandidateID | INT | FK | Không | Khóa ngoại tham chiếu người tìm việc |
| Keyword | NVARCHAR(100) | | Có | Từ khóa công việc quan tâm |
| CategoryID | INT | FK | Có | Khóa ngoại tham chiếu ngành nghề mong muốn |
| ProvinceID | INT | | Có | Địa bàn làm việc mong muốn |
| SalaryMin | DECIMAL(12,2)| | Có | Mức lương tối thiểu kỳ vọng |
| Frequency | VARCHAR(20) | | Không | Tần suất nhận thông báo (Daily, Weekly) |
| IsActive | BIT | | Không | Cờ xác định trạng thái kích hoạt thông báo |

Bảng 3.33: Bảng Thông báo hệ thống (Notifications)

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| NotificationID | INT | PK | Không | Mã định danh thông báo, tự động tăng |
| UserID | INT | FK | Không | Khóa ngoại tham chiếu tài khoản tiếp nhận |
| Title | NVARCHAR(150) | | Không | Tiêu đề tóm tắt của thông báo |
| Content | NVARCHAR(MAX) | | Không | Nội dung thông báo chi tiết |
| NotificationType | VARCHAR(50) | | Không | Phân loại (APPLICATION_UPDATE, INTERVIEW_INVITE, JOB_ALERT) |
| ReferenceID | INT | | Có | Khóa tham chiếu tới bản ghi nghiệp vụ liên quan |
| IsRead | BIT | | Không | Cờ xác định đã đọc hay chưa |
| CreatedAt | DATETIME | | Không | Thời điểm phát đi thông báo |

---

3.3.4. Thiết kế giao diện (Interface Design)

Thiết kế giao diện hệ thống TalentConnect tuân thủ nghiêm ngặt chuẩn mực trực quan, nhất quán và tối ưu hóa thao tác người dùng:

1. Thiết kế Màn hình Chính (Dashboard / Homepage):
Trung tâm điều khiển tiếp nhận người dùng với thanh tìm kiếm nổi bật, danh mục ngành nghề trọng điểm và danh sách việc làm hấp dẫn mới nhất.

[[IMAGE: assets/diagrams/hinh_3_12_ui_home.png | Caption: Hình ảnh 3.3.3.a. Màn hình chính.]]

2. Thiết kế một số màn hình chức năng:

2.1. Màn hình Đăng nhập & Đăng ký (Login / Register):
Màn hình cho phép chuyển đổi vai trò linh hoạt giữa Người tìm việc và Nhà tuyển dụng, bảo vệ phiên bằng mã băm an toàn.

[[IMAGE: assets/diagrams/hinh_3_16_ui_auth.png | Caption: Hình ảnh 3.3.3.b. Màn hình đăng nhập.]]

2.2. Màn hình Tạo hồ sơ trực tuyến (CV Builder):
Giao diện chia đôi màn hình độc đáo cho phép người dùng vừa nhập dữ liệu học vấn, kỹ năng ở cột trái vừa quan sát tệp tài liệu A4 hiển thị trực tiếp ở cột phải.

[[IMAGE: assets/diagrams/hinh_3_13_ui_cv_builder.png | Caption: Hình ảnh 3.3.3.c. Màn hình tạo hồ sơ trực tuyến.]]

2.3. Màn hình Tìm kiếm & Bộ lọc việc làm đa chiều:
Bố cục hai cột kết hợp thanh lọc tiêu chí chi tiết bên trái và danh sách thẻ việc làm phân trang bên phải.

[[IMAGE: assets/diagrams/hinh_3_14_ui_search_jobs.png | Caption: Hình ảnh 3.3.3.d. Màn hình tìm kiếm việc làm.]]

2.4. Màn hình Bảng phễu quản lý ứng viên (Kanban ATS):
Hiển thị 5 cột trạng thái tuyển dụng nằm ngang giúp chuyên viên nhân sự kéo thả thẻ ứng viên, xem trước CV và ghi chú đánh giá.

[[IMAGE: assets/diagrams/hinh_3_15_ui_kanban_ats.png | Caption: Hình ảnh 3.3.3.e. Màn hình Bảng phễu quản lý ứng viên.]]

2.5. Màn hình Bảng điều khiển Quản trị viên (Admin Dashboard):
Hiển thị tổng quan số liệu vận hành và danh sách kiểm duyệt bài đăng tuyển dụng theo thời gian thực.

[[IMAGE: assets/diagrams/hinh_3_17_ui_admin_dashboard.png | Caption: Hình ảnh 3.3.3.f. Màn hình Quản trị hệ thống.]]

---

3.4. Lập trình và cài đặt

3.4.1. Mục tiêu của giai đoạn

Chuyển đổi toàn bộ thiết kế kiến trúc, cơ sở dữ liệu 28 bảng và giao diện người dùng thành mã nguồn phần mềm hoàn chỉnh chạy được trên môi trường web.

3.4.2. Công việc chi tiết trong giai đoạn Lập trình

1. Lựa chọn công nghệ:
- Frontend: ReactJS kết hợp Tailwind CSS.
- Backend: Node.js kết hợp Express.js.
- Cơ sở dữ liệu: Hệ quản trị cơ sở dữ liệu quan hệ SQL Server.

2. Thiết lập môi trường phát triển & Cấu trúc mã nguồn:
Tổ chức mã nguồn theo mô hình 3 tầng phân tách rõ ràng giữa Controller, Service, Middleware và Model:

[[IMAGE: assets/diagrams/hinh_3_18_code_structure.png | Caption: Hình ảnh 3.4.2.a. Cấu trúc thư mục mã nguồn.]]

3. Lập trình giao diện (UI) và xử lý bất đồng bộ phía máy khách.
4. Lập trình xử lý nghiệp vụ máy chủ (Business Logic).
5. Lập trình kết nối cơ sở dữ liệu có bảo vệ tham số chống SQL Injection.
6. Tích hợp các mô-đun chức năng thành một hệ thống hoàn chỉnh.
7. Kiểm thử mức mã nguồn (Unit Testing) độc lập cho từng hàm nghiệp vụ.
