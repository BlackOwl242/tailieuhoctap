3.3. Thiết kế hệ thống

3.3.1. Mục tiêu của thiết kế

Thiết kế hệ thống là giai đoạn chuyển các đặc tả yêu cầu nghiệp vụ đã xác định ở giai đoạn phân tích thành bản thiết kế kỹ thuật chi tiết làm căn cứ trực tiếp cho việc lập trình. Sau khi yêu cầu phần mềm được phân tích và mô hình hóa, thiết kế kết nối chặt chẽ trong chuỗi ba hoạt động kỹ thuật chính của dự án gồm: Thiết kế – Lập trình – Kiểm thử.

[[IMAGE: assets/diagrams/hinh_3_3_1_a_giai_doan_phan_mem.png | Caption: Hình ảnh 3.3.1.a. Các giai đoạn của phần mềm.]]

Trong quy trình công nghệ phần mềm, công đoạn thiết kế được triển khai tuần tự từ kiến trúc tổng thể, cơ sở dữ liệu đến giao diện người dùng nhằm bảo đảm tính nhất quán giữa dữ liệu, quy tắc xử lý và màn hình thao tác.

[[IMAGE: assets/diagrams/hinh_3_3_1_b_quy_trinh_thiet_ke.png | Caption: Hình ảnh 3.3.1.b. Quy trình thiết kế phần mềm.]]

Thiết kế hệ thống hướng tới ba mục tiêu cụ thể: thiết lập kiến trúc ba tầng kết hợp giao diện lập trình ứng dụng RESTful API nhằm phân tách rõ tầng giao diện người dùng, tầng xử lý nghiệp vụ máy chủ và tầng cơ sở dữ liệu; xây dựng cơ sở dữ liệu quan hệ đạt dạng chuẩn 3 với 28 bảng dữ liệu để lưu trữ thống nhất thông tin tài khoản, hồ sơ ứng viên, doanh nghiệp, tin tuyển dụng và đơn ứng tuyển, hạn chế dư thừa dữ liệu và sai lệch khi cập nhật; đồng thời thiết kế giao diện người dùng rõ ràng, nhất quán về bố cục và phản hồi để hỗ trợ người tìm việc, nhà tuyển dụng và quản trị viên thao tác chính xác.

3.3.2. Thiết kế kiến trúc

Kiến trúc hệ thống TalentConnect thể hiện qua hai sơ đồ cốt lõi:

a. Sơ đồ phân rã chức năng:
Sơ đồ phân rã chức năng chia hệ thống TalentConnect thành 5 nhánh chức năng nghiệp vụ tương ứng với 5 tiến trình xử lý chính trên sơ đồ luồng dữ liệu mức 0: (1) Quản lý tài khoản và phân quyền; (2) Quản lý hồ sơ trực tuyến; (3) Quản lý tin tuyển dụng và kiểm duyệt; (4) Tìm kiếm, gợi ý và ứng tuyển; (5) Xử lý ứng viên và điều hành hệ thống.

[[IMAGE: assets/diagrams/hinh_3_9_fdd.png | Caption: Hình ảnh 3.3.2.a. Sơ đồ phân rã chức năng.]]

b. Sơ đồ Kiến trúc Tổng thể:
Hệ thống vận hành theo mô hình kiến trúc ba tầng, trao đổi dữ liệu định dạng JSON qua giao thức HTTPS. Tầng trình diễn sử dụng thư viện ReactJS kết hợp Tailwind CSS, gửi và nhận dữ liệu bất đồng bộ qua thư viện Axios để cập nhật danh sách việc làm, bộ lọc và biểu mẫu mà không phải tải lại toàn bộ trang. Tầng nghiệp vụ chạy trên nền tảng Node.js và Express.js, đảm nhận định tuyến các điểm cuối RESTful API, xác thực phiên đăng nhập bằng mã JWT, kiểm tra phân quyền theo vai trò và thực thi các quy tắc nghiệp vụ như tìm kiếm đa điều kiện, đối chiếu kỹ năng gợi ý, kiểm tra điều kiện nộp đơn và quản lý trạng thái ứng viên. Tầng dữ liệu sử dụng hệ quản trị cơ sở dữ liệu quan hệ Microsoft SQL Server 2022 kết hợp thư mục lưu trữ tệp PDF hồ sơ trên máy chủ nhằm bảo đảm toàn vẹn dữ liệu và kiểm soát quyền truy xuất tài liệu.

[[IMAGE: assets/diagrams/hinh_3_10_architecture.png | Caption: Hình ảnh 3.3.2.b. Sơ đồ kiến trúc tổng thể.]]

---

3.3.3. Thiết kế cơ sở dữ liệu

a. Phân tích thực thể và mối quan hệ:

Cơ sở dữ liệu của TalentConnect gồm 28 bảng quan hệ đạt dạng chuẩn 3, chia thành sáu nhóm nghiệp vụ: Nhóm thứ nhất là Quản trị tài khoản và phân quyền gồm bảy bảng Roles, Permissions, RolePermissions, Users, UserRoles, UserSessions, AuditLogs. Nhóm thứ hai là Hồ sơ ứng viên và danh mục năng lực gồm bảy bảng Candidates, CandidateEducations, CandidateExperiences, CandidateSkills, CandidateCertificates, CandidateProjects, Resumes. Nhóm thứ ba là Đơn vị tuyển dụng và danh mục dùng chung gồm bốn bảng Employers, CompanyLocations, Categories, Skills. Nhóm thứ tư là Tin tuyển dụng và yêu cầu công việc gồm hai bảng Jobs, JobSkills. Nhóm thứ năm là Ứng tuyển và xử lý hồ sơ gồm ba bảng Applications, ApplicationHistories, Interviews. Nhóm thứ sáu là Tương tác, lưu trữ và thông báo gồm năm bảng SavedJobs, FollowedCompanies, CompanyReviews, JobAlerts, Notifications.

b. Thiết kế biểu đồ thực thể quan hệ:

Sơ đồ thể hiện toàn bộ các thực thể, khóa chính, khóa ngoại và mối quan hệ một - một, một - nhiều giữa các bảng dữ liệu trong hệ thống TalentConnect:

[[IMAGE: assets/diagrams/hinh_3_11_erd.png | Caption: Hình ảnh 3.3.3.a. Biểu đồ thực thể quan hệ.]]

c. Bảng từ điển dữ liệu chi tiết gồm 28 bảng thực thể:

Dưới đây là đặc tả chi tiết cấu trúc dữ liệu của toàn bộ 28 bảng trong cơ sở dữ liệu TalentConnect:

Bảng 3.10: Bảng Vai trò người dùng 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| RoleID | INT | Khóa chính | Không | Mã định danh vai trò, tự động tăng |
| RoleName | NVARCHAR(50) | | Không | Tên vai trò gồm Ứng viên, Nhà tuyển dụng, Quản trị viên |
| RoleCode | VARCHAR(30) | | Không | Mã định danh kỹ thuật gồm ROLE_CANDIDATE, ROLE_EMPLOYER, ROLE_ADMIN |
| Description | NVARCHAR(255) | | Có | Mô tả phạm vi quyền hạn của vai trò |

Bảng 3.11: Bảng Danh mục quyền hạn chi tiết 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| PermissionID | INT | Khóa chính | Không | Mã định danh quyền hạn, tự động tăng |
| PermissionName | NVARCHAR(100) | | Không | Tên quyền hạn gồm Đăng tin, Duyệt tin, Xem hồ sơ, Xuất báo cáo |
| ModuleName | VARCHAR(50) | | Không | Tên phân hệ chức năng tương ứng |
| ActionCode | VARCHAR(50) | | Không | Mã hành vi thực thi gồm CREATE, READ, UPDATE, DELETE, MODERATE |

Bảng 3.12: Bảng Gán quyền cho vai trò 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| RoleID | INT | Khóa chính, Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Roles |
| PermissionID | INT | Khóa chính, Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Permissions |

Bảng 3.13: Bảng Tài khoản người dùng 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| UserID | INT | Khóa chính | Không | Mã số tài khoản người dùng, tự động tăng |
| Email | VARCHAR(150) | | Không | Địa chỉ thư điện tử dùng để đăng nhập, duy nhất |
| PasswordHash | VARCHAR(255) | | Không | Chuỗi mật khẩu đã được băm mã hóa một chiều bằng Bcrypt |
| PhoneNumber | VARCHAR(15) | | Có | Số điện thoại liên lạc chính thức |
| AccountStatus | VARCHAR(20) | | Không | Trạng thái tài khoản gồm Active, Pending, Suspended, Deleted |
| EmailVerifiedAt | DATETIME | | Có | Thời điểm xác thực thư điện tử thành công |
| CreatedAt | DATETIME | | Không | Thời điểm đăng ký tài khoản |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật thông tin tài khoản |

Bảng 3.14: Bảng Phân vai trò người dùng 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| UserID | INT | Khóa chính, Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Users |
| RoleID | INT | Khóa chính, Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Roles |
| AssignedAt | DATETIME | | Không | Thời điểm phân bổ vai trò cho tài khoản |

Bảng 3.15: Bảng Quản lý phiên làm việc 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| SessionID | INT | Khóa chính | Không | Mã số định danh phiên làm việc, tự động tăng |
| UserID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Users |
| RefreshToken | VARCHAR(500) | | Không | Mã làm mới phiên làm việc |
| IPAddress | VARCHAR(45) | | Có | Địa chỉ mạng của thiết bị đăng nhập |
| UserAgent | NVARCHAR(255) | | Có | Thông tin trình duyệt và hệ điều hành |
| ExpiresAt | DATETIME | | Không | Thời điểm hết hạn phiên làm việc |

Bảng 3.16: Bảng Nhật ký thao tác hệ thống 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| LogID | BIGINT | Khóa chính | Không | Mã nhật ký thao tác, tự động tăng |
| UserID | INT | Khóa ngoại | Có | Khóa ngoại tham chiếu tài khoản thực hiện thao tác |
| ActionType | VARCHAR(50) | | Không | Loại hành động gồm LOGIN, CREATE_JOB, APPROVE_EMPLOYER, DELETE_USER |
| EntityName | VARCHAR(50) | | Không | Tên bảng dữ liệu bị tác động |
| EntityID | INT | | Có | Khóa chính của bản ghi bị tác động |
| Description | NVARCHAR(MAX) | | Có | Mô tả chi tiết dữ liệu thay đổi |
| CreatedAt | DATETIME | | Không | Thời điểm phát sinh hành động |

Bảng 3.17: Bảng Hồ sơ người tìm việc 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CandidateID | INT | Khóa chính | Không | Mã định danh hồ sơ ứng viên, tự động tăng |
| UserID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu duy nhất tới bảng Users |
| FullName | NVARCHAR(100) | | Không | Họ và tên đầy đủ của người tìm việc |
| AvatarURL | VARCHAR(255) | | Có | Đường dẫn ảnh đại diện cá nhân |
| Gender | NVARCHAR(10) | | Có | Giới tính gồm Nam, Nữ, Khác |
| DateOfBirth | DATE | | Có | Ngày tháng năm sinh |
| Address | NVARCHAR(255) | | Có | Địa chỉ nơi cư trú |
| ProvinceID | INT | | Có | Mã tỉnh thành phố làm việc |
| CurrentPosition | NVARCHAR(100) | | Có | Chức danh công việc hiện tại |
| DesiredSalaryMin | DECIMAL(12,2)| | Có | Mức lương mong muốn tối thiểu |
| DesiredSalaryMax | DECIMAL(12,2)| | Có | Mức lương mong muốn tối đa |
| IsOpenForWork | BIT | | Không | Trạng thái nhận gợi ý việc làm phù hợp trên hệ thống |
| BioSummary | NVARCHAR(MAX) | | Có | Tóm tắt mục tiêu và thế mạnh bản thân |

Bảng 3.18: Bảng Lịch sử học vấn ứng viên 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| EducationID | INT | Khóa chính | Không | Mã định danh bản ghi học vấn, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Candidates |
| SchoolName | NVARCHAR(150) | | Không | Tên trường đại học, cao đẳng hoặc cơ sở đào tạo |
| Major | NVARCHAR(100) | | Không | Ngành hoặc chuyên ngành đào tạo |
| Degree | NVARCHAR(50) | | Có | Bằng cấp đạt được gồm Cử nhân, Kỹ sư, Thạc sĩ |
| StartDate | DATE | | Không | Ngày bắt đầu theo học |
| EndDate | DATE | | Có | Ngày tốt nghiệp hoặc dự kiến tốt nghiệp |
| IsCurrent | BIT | | Không | Cờ xác định có đang theo học hay không |
| GPA | DECIMAL(3,2) | | Có | Điểm trung bình tích lũy thang 4.0 |
| Description | NVARCHAR(500) | | Có | Thành tích học tập hoặc đề tài nghiên cứu |

Bảng 3.19: Bảng Lịch sử kinh nghiệm làm việc 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ExperienceID | INT | Khóa chính | Không | Mã định danh kinh nghiệm, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Candidates |
| CompanyName | NVARCHAR(150) | | Không | Tên cơ quan hoặc doanh nghiệp từng công tác |
| Position | NVARCHAR(100) | | Không | Vị trí chức danh đảm nhiệm |
| StartDate | DATE | | Không | Ngày bắt đầu làm việc |
| EndDate | DATE | | Có | Ngày kết thúc công tác |
| IsCurrent | BIT | | Không | Cờ xác định có đang làm việc tại đây hay không |
| Responsibilities | NVARCHAR(MAX) | | Có | Mô tả các nhiệm vụ và trách nhiệm chính |
| Achievements | NVARCHAR(MAX) | | Có | Các thành tích nổi bật đạt được trong quá trình công tác |

Bảng 3.20: Bảng Kỹ năng ứng viên 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CandidateSkillID | INT | Khóa chính | Không | Mã định danh kỹ năng ứng viên, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Candidates |
| SkillID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Skills |
| ProficiencyLevel | INT | | Không | Mức độ thành thạo từ 1 đến 5 sao |
| YearsOfExperience| DECIMAL(3,1) | | Có | Số năm áp dụng kỹ năng trong thực tế |

Bảng 3.21: Bảng Chứng chỉ chuyên môn 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CertificateID | INT | Khóa chính | Không | Mã định danh chứng chỉ, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Candidates |
| CertificateName | NVARCHAR(150) | | Không | Tên chứng chỉ chuyên môn hoặc ngoại ngữ |
| IssuingOrg | NVARCHAR(150) | | Không | Đơn vị hoặc tổ chức cấp chứng chỉ |
| IssueDate | DATE | | Không | Ngày cấp chứng chỉ |
| ExpirationDate | DATE | | Có | Ngày hết hạn hiệu lực |
| CredentialURL | VARCHAR(255) | | Có | Liên kết tra cứu tính xác thực của chứng chỉ |

Bảng 3.22: Bảng Dự án thực tế đã làm 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ProjectID | INT | Khóa chính | Không | Mã định danh dự án, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Candidates |
| ProjectName | NVARCHAR(150) | | Không | Tên dự án tham gia thực hiện |
| RoleInProject | NVARCHAR(100) | | Không | Vai trò đảm nhiệm trong dự án |
| TechStack | NVARCHAR(200) | | Có | Công nghệ và ngôn ngữ sử dụng |
| ProjectURL | VARCHAR(255) | | Có | Liên kết demo hoặc mã nguồn dự án |
| Description | NVARCHAR(MAX) | | Có | Mô tả mục tiêu và quy mô dự án |

Bảng 3.23: Bảng Bản lý lịch năng lực hoàn chỉnh 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ResumeID | INT | Khóa chính | Không | Mã định danh bản lý lịch, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Candidates |
| ResumeTitle | NVARCHAR(150) | | Không | Tên gọi phân biệt của bản lý lịch |
| ResumeJSON | NVARCHAR(MAX) | | Có | Chuỗi dữ liệu có cấu trúc chứa toàn bộ nội dung hồ sơ |
| FileURL | VARCHAR(255) | | Có | Đường dẫn tệp PDF kết xuất lưu trữ trên máy chủ |
| TemplateID | VARCHAR(50) | | Không | Tên mẫu trình bày được lựa chọn |
| ThemeColor | VARCHAR(20) | | Không | Mã màu sắc chủ đạo của hồ sơ |
| ProfileScore | INT | | Không | Điểm hoàn thiện hồ sơ từ 0 đến 100% |
| IsDefault | BIT | | Không | Cờ xác định bản lý lịch mặc định dùng để ứng tuyển |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật nội dung gần nhất |

Bảng 3.24: Bảng Đơn vị tuyển dụng 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| EmployerID | INT | Khóa chính | Không | Mã số định danh doanh nghiệp, tự động tăng |
| UserID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu duy nhất tới bảng Users |
| CompanyName | NVARCHAR(200) | | Không | Tên đầy đủ của doanh nghiệp tuyển dụng |
| TaxCode | VARCHAR(20) | | Không | Mã số thuế doanh nghiệp phục vụ kiểm tra pháp lý |
| BusinessLicenseURL| VARCHAR(255) | | Có | Đường dẫn ảnh giấy phép đăng ký kinh doanh |
| CompanySize | VARCHAR(50) | | Có | Quy mô nhân sự gồm dưới 50, từ 50 đến 200, trên 500 nhân sự |
| Address | NVARCHAR(255) | | Không | Địa chỉ trụ sở chính của công ty |
| WebsiteURL | VARCHAR(255) | | Có | Liên kết trang web chính thức |
| LogoURL | VARCHAR(255) | | Có | Đường dẫn tệp ảnh biểu trưng doanh nghiệp |
| CoverImageURL | VARCHAR(255) | | Có | Đường dẫn ảnh bìa trang giới thiệu công ty |
| CompanyBio | NVARCHAR(MAX) | | Có | Bài viết giới thiệu văn hóa và chế độ đãi ngộ |
| VerificationStatus| VARCHAR(20) | | Không | Trạng thái phê duyệt gồm Pending, Approved, Rejected |
| VerifiedByAdminID | INT | Khóa ngoại | Có | Khóa ngoại tham chiếu quản trị viên phê duyệt |
| VerifiedAt | DATETIME | | Có | Thời điểm phê duyệt doanh nghiệp |

Bảng 3.25: Bảng Địa điểm làm việc công ty 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| LocationID | INT | Khóa chính | Không | Mã định danh địa điểm làm việc, tự động tăng |
| EmployerID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Employers |
| LocationName | NVARCHAR(100) | | Không | Tên chi nhánh hoặc văn phòng đại diện |
| FullAddress | NVARCHAR(255) | | Không | Địa chỉ chi tiết nơi làm việc |
| ProvinceID | INT | | Không | Mã tỉnh thành phố |
| IsHeadquarter | BIT | | Không | Cờ xác định đây có phải trụ sở chính hay không |

Bảng 3.26: Bảng Danh mục ngành nghề 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| CategoryID | INT | Khóa chính | Không | Mã định danh ngành nghề, tự động tăng |
| ParentCategoryID | INT | Khóa ngoại | Có | Khóa ngoại tham chiếu ngành nghề cha, cho phép phân cấp nhiều tầng bậc |
| CategoryName | NVARCHAR(100) | | Không | Tên phân loại ngành nghề công việc |
| Slug | VARCHAR(100) | | Không | Chuỗi định danh đường dẫn thân thiện |
| IconURL | VARCHAR(255) | | Có | Biểu tượng minh họa ngành nghề |

Bảng 3.27: Bảng Từ điển kỹ năng chuyên môn 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| SkillID | INT | Khóa chính | Không | Mã định danh kỹ năng, tự động tăng |
| CategoryID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Categories |
| SkillName | NVARCHAR(100) | | Không | Tên kỹ năng chuyên môn như Java, ReactJS, Kế toán thuế |
| SkillCode | VARCHAR(50) | | Không | Mã kỹ năng chuẩn hóa phục vụ so khớp |

Bảng 3.28: Bảng Tin tuyển dụng 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| JobID | INT | Khóa chính | Không | Mã số định danh bài đăng tuyển dụng, tự động tăng |
| EmployerID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu đơn vị tuyển dụng sở hữu |
| CategoryID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu danh mục ngành nghề |
| LocationID | INT | Khóa ngoại | Có | Khóa ngoại tham chiếu địa điểm làm việc cụ thể |
| JobTitle | NVARCHAR(200) | | Không | Tiêu đề bài đăng tuyển dụng |
| Quantity | INT | | Không | Số lượng nhân sự cần tuyển |
| JobDescription | NVARCHAR(MAX) | | Không | Chi tiết bản mô tả nhiệm vụ công việc |
| JobRequirements | NVARCHAR(MAX) | | Không | Các yêu cầu về năng lực, chuyên môn và kinh nghiệm |
| Benefits | NVARCHAR(MAX) | | Có | Các chính sách đãi ngộ, bảo hiểm, thưởng |
| SalaryMin | DECIMAL(12,2)| | Có | Mức lương tối thiểu trong khoảng đề xuất |
| SalaryMax | DECIMAL(12,2)| | Có | Mức lương tối đa trong khoảng đề xuất |
| IsNegotiableSalary| BIT | | Không | Cờ xác định mức lương thỏa thuận |
| EmploymentType | NVARCHAR(50) | | Không | Hình thức làm việc gồm Toàn thời gian, Bán thời gian, Làm việc từ xa |
| ExperienceLevel | NVARCHAR(50) | | Có | Yêu cầu số năm kinh nghiệm gồm Chưa có, 1-3 năm, Trên 5 năm |
| ExpirationDate | DATE | | Không | Ngày hết hạn tiếp nhận đơn ứng tuyển |
| JobStatus | VARCHAR(20) | | Không | Trạng thái tin đăng gồm Draft, Pending, Active, Expired, Closed |
| ViewCount | INT | | Không | Tổng số lượt người dùng nhấp xem tin |
| ApplyCount | INT | | Không | Tổng số lượng hồ sơ đã nộp vào bài đăng này |
| CreatedAt | DATETIME | | Không | Thời điểm đăng bài lên hệ thống |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật nội dung gần nhất |

Bảng 3.29: Bảng Kỹ năng yêu cầu của tin tuyển dụng 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| JobSkillID | INT | Khóa chính | Không | Mã định danh kỹ năng yêu cầu, tự động tăng |
| JobID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Jobs |
| SkillID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Skills |
| IsRequired | BIT | | Không | Cờ xác định kỹ năng bắt buộc hay ưu tiên |
| PriorityWeight | INT | | Không | Trọng số ưu tiên của kỹ năng dùng để tính mức khớp |

Bảng 3.30: Bảng Đơn ứng tuyển 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ApplicationID | INT | Khóa chính | Không | Mã đơn ứng tuyển, tự động tăng |
| JobID | INT | Khóa ngoại | Không | Mã tin được chọn (tham chiếu bảng Jobs) |
| CandidateID | INT | Khóa ngoại | Không | Mã ứng viên gửi (tham chiếu bảng Candidates) |
| ResumeID | INT | Khóa ngoại | Không | Mã bản hồ sơ đã gửi (tham chiếu bảng Resumes) |
| CoverLetter | NVARCHAR(MAX) | | Có | Thư giới thiệu gửi kèm đơn ứng tuyển |
| ApplicationStatus| VARCHAR(20) | | Không | Trạng thái xử lý đơn: Submitted (Đã gửi hồ sơ), Viewed, Interview, Offered, Accepted, Rejected |
| MatchScore | DECIMAL(5,2) | | Có | Mức khớp kỹ năng (từ 0 đến 100%) |
| InternalRating | INT | | Có | Điểm đánh giá nội bộ của doanh nghiệp (từ 1 đến 5) |
| AppliedAt | DATETIME | | Không | Thời điểm gửi đơn ứng tuyển |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật trạng thái gần nhất |

Bảng 3.31: Bảng Lịch sử chuyển trạng thái hồ sơ 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| HistoryID | INT | Khóa chính | Không | Mã định danh lịch sử chuyển trạng thái, tự động tăng |
| ApplicationID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Applications |
| FromStatus | VARCHAR(20) | | Không | Trạng thái trước khi chuyển đổi |
| ToStatus | VARCHAR(20) | | Không | Trạng thái mới sau khi chuyển đổi |
| ChangedByUserID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu người thực hiện chuyển đổi |
| ChangeNote | NVARCHAR(500) | | Có | Ghi chú lý do chuyển đổi trạng thái |
| ChangedAt | DATETIME | | Không | Thời điểm thực hiện chuyển đổi |

Bảng 3.32: Bảng Quản lý lịch phỏng vấn 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| InterviewID | INT | Khóa chính | Không | Mã định danh lịch phỏng vấn, tự động tăng |
| ApplicationID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bảng Applications |
| EmployerID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu đơn vị tuyển dụng |
| InterviewTime | DATETIME | | Không | Thời gian tổ chức phỏng vấn |
| FormatType | VARCHAR(20) | | Không | Hình thức phỏng vấn gồm Online, Offline |
| MeetingURL | VARCHAR(255) | | Có | Liên kết phòng họp trực tuyến |
| LocationAddress | NVARCHAR(255) | | Có | Địa chỉ phòng phỏng vấn trực tiếp |
| InterviewerName | NVARCHAR(100) | | Có | Tên người phỏng vấn đại diện công ty |
| ResultStatus | VARCHAR(20) | | Không | Kết quả phỏng vấn gồm Pending, Passed, Failed |
| FeedbackNotes | NVARCHAR(MAX) | | Có | Đánh giá chi tiết của hội đồng phỏng vấn |

Bảng 3.33: Bảng Việc làm đã lưu 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| SavedJobID | INT | Khóa chính | Không | Mã định danh bản ghi lưu việc, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu người tìm việc |
| JobID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bài đăng được lưu |
| SavedAt | DATETIME | | Không | Thời điểm đánh dấu lưu công việc |

Bảng 3.34: Bảng Doanh nghiệp được theo dõi 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| FollowID | INT | Khóa chính | Không | Mã định danh theo dõi, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu người tìm việc theo dõi |
| EmployerID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu doanh nghiệp được theo dõi |
| FollowedAt | DATETIME | | Không | Thời điểm bấm theo dõi doanh nghiệp |

Bảng 3.35: Bảng Đánh giá doanh nghiệp ẩn danh 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ReviewID | INT | Khóa chính | Không | Mã số định danh bài đánh giá, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu người đánh giá |
| EmployerID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu doanh nghiệp bị đánh giá |
| OverallRating | INT | | Không | Điểm đánh giá tổng quan từ 1 đến 5 sao |
| SalaryRating | INT | | Không | Điểm hài lòng về lương thưởng theo thang 1 đến 5 sao |
| TrainingRating | INT | | Không | Điểm cơ hội đào tạo và học hỏi theo thang 1 đến 5 sao |
| CultureRating | INT | | Không | Điểm văn hóa và môi trường làm việc theo thang 1 đến 5 sao |
| WorkLifeBalance | INT | | Không | Điểm cân bằng công việc và cuộc sống theo thang 1 đến 5 sao |
| Pros | NVARCHAR(MAX) | | Không | Nhận xét các ưu điểm nổi bật của công ty |
| Cons | NVARCHAR(MAX) | | Không | Nhận xét các điểm công ty cần cải thiện |
| ModerationStatus | VARCHAR(20) | | Không | Trạng thái kiểm duyệt gồm Pending, Approved, Rejected |
| CreatedAt | DATETIME | | Không | Thời điểm gửi bài đánh giá |

Bảng 3.36: Bảng Đăng ký thông báo việc làm tự động 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| AlertID | INT | Khóa chính | Không | Mã định danh thiết lập thông báo, tự động tăng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu người tìm việc |
| Keyword | NVARCHAR(100) | | Có | Từ khóa công việc quan tâm |
| CategoryID | INT | Khóa ngoại | Có | Khóa ngoại tham chiếu ngành nghề mong muốn |
| ProvinceID | INT | | Có | Địa bàn làm việc mong muốn |
| SalaryMin | DECIMAL(12,2)| | Có | Mức lương tối thiểu kỳ vọng |
| Frequency | VARCHAR(20) | | Không | Tần suất nhận thông báo gồm Daily, Weekly |
| IsActive | BIT | | Không | Cờ xác định trạng thái kích hoạt thông báo |

Bảng 3.37: Bảng Thông báo hệ thống 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| NotificationID | INT | Khóa chính | Không | Mã định danh thông báo, tự động tăng |
| UserID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu tài khoản tiếp nhận |
| Title | NVARCHAR(150) | | Không | Tiêu đề tóm tắt của thông báo |
| Content | NVARCHAR(MAX) | | Không | Nội dung thông báo chi tiết |
| NotificationType | VARCHAR(50) | | Không | Phân loại gồm APPLICATION_UPDATE, INTERVIEW_INVITE, JOB_ALERT |
| ReferenceID | INT | | Có | Khóa tham chiếu tới bản ghi nghiệp vụ liên quan |
| IsRead | BIT | | Không | Cờ xác định đã đọc hay chưa |
| CreatedAt | DATETIME | | Không | Thời điểm phát đi thông báo |

d. Thiết kế dữ liệu chuyên sâu phục vụ tìm kiếm, gợi ý kỹ năng và nộp hồ sơ ứng tuyển:

Trên nền tảng 28 bảng dữ liệu của toàn hệ thống, nhóm các bảng trực tiếp tham gia vào luồng tìm kiếm, gợi ý kỹ năng và tiếp nhận đơn ứng tuyển liên kết chặt chẽ với nhau về mối quan hệ và ràng buộc toàn vẹn như sau:

[[IMAGE: assets/diagrams/hinh_3_11_b_erd_apply.png | Caption: Hình ảnh 3.3.3.b. Quan hệ dữ liệu phục vụ ứng tuyển.]]

Sơ đồ dùng ký hiệu chân quạ: hai vạch là đúng một; vòng tròn và một vạch là không hoặc một; vòng tròn và chân quạ là không hoặc nhiều. PK chỉ khóa chính, FK chỉ khóa ngoại. Các tên trường trong sơ đồ là tên dùng trong cơ sở dữ liệu. Một ứng viên có thể lưu nhiều hồ sơ và nộp nhiều đơn. Mỗi đơn gắn với đúng một ứng viên, một tin và một bản hồ sơ. Một doanh nghiệp có thể đăng nhiều tin; doanh nghiệp nhận đơn được xác định từ tin mà ứng viên đã chọn. Một tài khoản có thể nhận nhiều thông báo.

Trên sơ đồ quan hệ của luồng tiếp nhận đơn, bảng tài khoản Users lưu địa chỉ thư điện tử, số điện thoại và tình trạng truy cập; bảng Candidates lưu thông tin người tìm việc; bảng Employers lưu thông tin đơn vị tuyển dụng. Mỗi ứng viên hoặc doanh nghiệp gắn với một tài khoản qua khóa ngoại UserID, giúp phần mềm xác định chính xác người gửi hồ sơ và người nhận thông báo từ phiên đăng nhập mà không yêu cầu người dùng tự nhập mã nội bộ.

Bảng Resumes lưu từng bản hồ sơ mà ứng viên chuẩn bị, còn bảng Applications ghi nhận mã bản hồ sơ được dùng cho một lần nộp đơn cụ thể. Bản hồ sơ được chọn phải thuộc đúng ứng viên đang nộp đơn, và doanh nghiệp chỉ có quyền đọc đơn khi sở hữu tin tuyển dụng nhận đơn đó; việc biết mã đơn của doanh nghiệp khác không đủ điều kiện để truy cập tệp hồ sơ.

Nội dung hồ sơ đã nộp luôn được giữ nguyên theo từng đơn ứng tuyển. Khi ứng viên chỉnh sửa hồ sơ cho lần ứng tuyển sau, phần mềm tạo bản ghi mới, còn đơn cũ tiếp tục tham chiếu về bản đã gửi để nhà tuyển dụng và ứng viên luôn xem cùng một tài liệu.

Bảng Notifications lưu mã tài khoản nhận, tiêu đề, nội dung, loại thông báo và mã tham chiếu ReferenceID. Mã tham chiếu này giúp mở đúng đơn ứng tuyển hoặc lịch phỏng vấn khi người nhận nhấn vào thông báo; vì có thể trỏ đến nhiều bảng nghiệp vụ khác nhau nên trường này không vẽ thành khóa ngoại cứng chỉ nối vào bảng đơn ứng tuyển.

[[IMAGE: assets/diagrams/hinh_3_11_c_erd_skills.png | Caption: Hình ảnh 3.3.3.c. Đối chiếu kỹ năng ứng viên với kỹ năng yêu cầu.]]

Danh mục kỹ năng dùng chung Skills giúp hai bên đối chiếu trên cùng một hệ mã kỹ năng SkillID. Bảng CandidateSkills lưu các kỹ năng ứng viên đã khai báo, còn bảng JobSkills lưu các kỹ năng mà tin tuyển dụng yêu cầu kèm trọng số ưu tiên PriorityWeight. Mỗi dòng dữ liệu gắn với một kỹ năng xác định; một kỹ năng có thể xuất hiện ở nhiều hồ sơ ứng viên và nhiều tin tuyển dụng. Cấu trúc này cho phép hệ thống tính tỷ lệ khớp theo trọng số và chỉ rõ kỹ năng nào đã khớp, kỹ năng nào chưa khai báo thay vì chỉ đưa ra một con số tổng hợp.

Tại bảng đơn ứng tuyển Applications (Bảng 3.30), trạng thái ban đầu khi nộp đơn là Đã gửi hồ sơ. Các trạng thái tiếp theo do doanh nghiệp cập nhật gồm Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc, Nhận việc hoặc Chưa phù hợp; thao tác nhấn gửi của ứng viên không tự gán kết quả tuyển chọn hay điểm đánh giá nội bộ.

Về nguồn dữ liệu phục vụ giao diện, bảng Jobs cung cấp tiêu đề, số lượng cần tuyển, mô tả nhiệm vụ, yêu cầu, quyền lợi, khoảng lương, hình thức làm việc, kinh nghiệm, hạn nhận đơn và trạng thái tin; địa điểm làm việc, ngành nghề và tên pháp nhân được nối từ các bảng CompanyLocations, Categories và Employers. Khi ứng viên nhấn lưu tin để xem lại, bảng SavedJobs ghi nhận cặp mã ứng viên và mã tin cùng thời điểm lưu mà chưa tạo đơn ứng tuyển. Bản hồ sơ trong bảng Resumes cung cấp tên tệp, đường dẫn lưu trữ và ngày cập nhật; dung lượng và số trang được đọc trực tiếp từ tệp PDF để hiển thị trên màn hình kiểm tra. Khi ứng viên tải tệp PDF mới, tệp phải được lưu vào bảng Resumes trước khi gắn mã hồ sơ vào đơn ứng tuyển.

---

3.3.4. Thiết kế giao diện người dùng

Giao diện hệ thống TalentConnect giữ logo TalentConnect, nền trắng, nút cam đỏ, thẻ vàng, tím, xanh nhạt và khối xanh đen. Từng màn hình được phân tích theo mục tiêu, thao tác, phản hồi, cách xử lý lỗi và lý do thiết kế để phục vụ đúng quá trình tìm việc, ứng tuyển và quản lý tuyển dụng.

Thiết kế tham khảo cách tìm việc của TopCV và quy trình ứng tuyển của Indeed; đồng thời vận dụng nguyên tắc phản hồi trạng thái, quyền chủ động kiểm soát của người dùng, phòng tránh lỗi nhập liệu của Nielsen và hướng dẫn thiết kế biểu mẫu nhiều bước của W3C WAI. Các tiêu chí ở từng màn hình dùng để đánh giá bản thiết kế theo quy trình TalentConnect, chưa phải kết quả thử nghiệm với người dùng.

Trong luồng tìm kiếm, gợi ý và nộp hồ sơ ứng tuyển, tình huống dữ liệu minh họa xuyên suốt sử dụng ứng viên Nguyễn Minh Anh có mã ứng viên 17, tìm vị trí Frontend Developer tại Hà Nội, lương tối thiểu 14 triệu đồng, hình thức toàn thời gian, chọn tin của FPT Software có mã tin 241, sử dụng bản hồ sơ CV_MinhAnh_Frontend_2026.pdf có mã hồ sơ 41, đạt mức khớp kỹ năng 88% và nhận mã đơn TC-000381. Ứng viên tìm tin, đọc chi tiết, chọn hồ sơ đã lưu hoặc tải mới, kiểm tra rồi xác nhận gửi. Xem trước là tùy chọn; MH03 và MH04 thuộc cùng bước chuẩn bị. Tình huống phát sinh được xử lý tại bước tương ứng. Nếu cần đăng nhập, hệ thống giữ tin đang chọn để tiếp tục ứng tuyển.

Bảng 3.38: Bảng tổng hợp 22 màn hình giao diện người dùng của hệ thống TalentConnect

| Ký hiệu | Tên màn hình giao diện | Nhóm tác nhân sử dụng | Mục đích và chức năng nghiệp vụ chính |
| :---: | :--- | :--- | :--- |
| 3.3.4.a | Màn hình Trang chủ | Khách vãng lai, Người tìm việc | Tra cứu nhanh việc làm theo từ khóa, ngành nghề, địa điểm và xem tin nổi bật |
| 3.3.4.b | Màn hình Đăng nhập và Đăng ký | Toàn bộ người dùng | Xác thực định danh, đăng ký tài khoản theo vai trò và khôi phục phiên làm việc |
| 3.3.4.c | Màn hình Tạo hồ sơ trực tuyến | Người tìm việc | Biên soạn hồ sơ năng lực cấu trúc, khai báo kỹ năng và kết xuất tệp PDF khổ A4 |
| 3.3.4.d | Tìm kiếm và kết quả phù hợp (MH01) | Người tìm việc | Lọc đa tiêu chí, xem gợi ý mức khớp kỹ năng (MatchScore) và lưu tin tuyển dụng |
| 3.3.4.e | Chi tiết tin tuyển dụng - Phần đầu (MH02) | Người tìm việc | Xem thông tin công việc, pháp lý doanh nghiệp và bảng đối chiếu kỹ năng chi tiết |
| 3.3.4.f | Chi tiết tin tuyển dụng - Khi cuộn (MH02) | Người tìm việc | Đọc yêu cầu, quyền lợi, địa điểm làm việc và kích hoạt biểu mẫu ứng tuyển |
| 3.3.4.g | Chọn hồ sơ đã lưu và nhập thư (MH03) | Người tìm việc | Chọn bản hồ sơ PDF đã lưu, kiểm tra thông tin liên hệ và soạn thư giới thiệu |
| 3.3.4.h | Tải hồ sơ mới từ máy tính (MH04) | Người tìm việc | Tải tệp PDF mới tối đa 5 MB, kiểm tra định dạng và thao tác xem, thay, xóa tệp |
| 3.3.4.i | Xem trước bản hồ sơ sẽ gửi (MH05) | Người tìm việc | Đọc trực tiếp nội dung tệp PDF trong trình xem tài liệu trước khi xác nhận nộp |
| 3.3.4.k | Kiểm tra và xác nhận gửi hồ sơ (MH06) | Người tìm việc | Đối chiếu lần cuối người gửi, bản hồ sơ, thư giới thiệu và xác nhận chia sẻ dữ liệu |
| 3.3.4.l | Xác nhận ứng tuyển thành công (MH07) | Người tìm việc | Nhận mã đơn ứng tuyển (TC-000381), thời điểm gửi và trạng thái tiếp nhận ban đầu |
| 3.3.4.m | Không có việc làm phù hợp (MH08) | Người tìm việc | Giữ nguyên điều kiện lọc hiện tại và hỗ trợ nới lỏng từng tiêu chí để tìm lại |
| 3.3.4.n | Thông báo đơn ứng tuyển bị trùng (MH09) | Người tìm việc | Cảnh báo đã có đơn đang xử lý cho cùng vị trí và dẫn tới đơn đã ghi nhận |
| 3.3.4.o | Tin đóng trong lúc chuẩn bị hồ sơ (MH10) | Người tìm việc | Thông báo tin ngừng nhận đơn, bảo toàn nội dung đã nhập và gợi ý việc tương tự |
| 3.3.4.p | Quản lý đơn đã ứng tuyển và Lịch phỏng vấn | Người tìm việc | Theo dõi tiến trình xét duyệt 5 giai đoạn và xác nhận lịch hẹn phỏng vấn |
| 3.3.4.q | Quản lý hồ sơ pháp lý và Địa điểm công ty | Nhà tuyển dụng | Cập nhật mã số thuế, giấy phép kinh doanh PDF và danh sách chi nhánh làm việc |
| 3.3.4.r | Soạn thảo và gửi duyệt tin tuyển dụng mới | Nhà tuyển dụng | Nhập nội dung tin tuyển dụng và thiết lập kỹ năng bắt buộc, ưu tiên kèm trọng số |
| 3.3.4.s | Bảng quản lý ứng viên theo 5 giai đoạn | Nhà tuyển dụng | Sàng lọc hồ sơ ứng viên trực quan theo 5 cột trạng thái và ghi vết chuyển bước |
| 3.3.4.t | Chi tiết đơn, Chấm điểm và Đặt lịch phỏng vấn | Nhà tuyển dụng | Đọc CV ứng viên, chấm điểm nội bộ (InternalRating) và tạo lịch hẹn phỏng vấn |
| 3.3.4.u | Hàng đợi đối soát pháp lý và Duyệt tin đăng | Cán bộ kiểm duyệt | Kiểm tra pháp lý doanh nghiệp, rà soát nội dung tin chờ duyệt và phê duyệt/từ chối |
| 3.3.4.v | Bảng điều khiển Quản trị và Thống kê hệ thống | Quản trị viên hệ thống | Giám sát số liệu vận hành, quản lý tài khoản, danh mục dùng chung và nhật ký hệ thống |

Toàn bộ các màn hình chức năng của hệ thống được phân tích và thiết kế chi tiết như sau:

a. Màn hình Trang chủ:

[[IMAGE: assets/diagrams/hinh_3_12_ui_home.png | Caption: Hình ảnh 3.3.4.a. Màn hình Trang chủ hệ thống TalentConnect.]]

Màn hình Trang chủ cung cấp thanh tìm kiếm việc làm tại vị trí đầu trang, cho phép nhập từ khóa chức danh hoặc kỹ năng kết hợp chọn ngành nghề và địa điểm làm việc. Phía dưới trình bày danh mục các nhóm ngành nghề phổ biến và danh sách các tin tuyển dụng đang hoạt động, còn hạn nhận hồ sơ để khách chưa đăng nhập cũng có thể tra cứu và đọc tin công khai trước khi quyết định đăng nhập để lưu tin hoặc ứng tuyển.

b. Màn hình Đăng nhập và Đăng ký:

[[IMAGE: assets/diagrams/hinh_3_16_ui_auth.png | Caption: Hình ảnh 3.3.4.b. Màn hình Đăng nhập và Đăng ký tài khoản.]]

Giao diện xác thực người dùng cho phép chọn vai trò Người tìm việc hoặc Nhà tuyển dụng khi đăng ký tài khoản mới và đăng nhập vào hệ thống. Biểu mẫu kiểm tra định dạng thư điện tử, độ dài mật khẩu và hiển thị thông báo lỗi ngay tại trường nhập liệu khi thông tin chưa hợp lệ. Sau khi đăng nhập thành công, hệ thống cấp phiên làm việc và đưa người dùng về đúng trang hoặc vị trí tuyển dụng đang xem trước đó.

c. Màn hình Tạo và quản lý hồ sơ trực tuyến:

[[IMAGE: assets/diagrams/hinh_3_13_ui_cv_builder.png | Caption: Hình ảnh 3.3.4.c. Màn hình Tạo hồ sơ trực tuyến và xuất tệp PDF.]]

Giao diện biên soạn hồ sơ chia thành hai phần: bên trái là các biểu mẫu nhập thông tin cá nhân, mục tiêu nghề nghiệp, học vấn, kinh nghiệm làm việc, kỹ năng chuyên môn và dự án; bên phải là khung xem trước bản trình bày khổ A4. Ứng viên Nguyễn Minh Anh có thể cập nhật thông tin, chọn mẫu trình bày và xuất thành bản hồ sơ PDF như tệp CV_MinhAnh_Frontend_2026.pdf lưu trong kho hồ sơ cá nhân để sử dụng khi ứng tuyển.

d. Màn hình Tìm kiếm và kết quả phù hợp (MH01):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh01_tim_kiem.png | Caption: Hình ảnh 3.3.4.d. Danh sách việc làm, bộ lọc và gợi ý kỹ năng (MH01).]]

Màn hình giúp ứng viên thu hẹp danh sách và so sánh các vị trí trước khi đọc chi tiết. Người dùng nhập từ khóa, chọn địa điểm rồi nhấn Tìm kiếm; các điều kiện bên phải được thực hiện khi nhấn Áp dụng bộ lọc. Sau mỗi lần tìm, tổng số kết quả, nhãn điều kiện và danh sách phải cùng phản ánh lựa chọn đã áp dụng. Thay đổi điều kiện đưa kết quả về trang đầu để tránh bỏ sót tin; chuyển trang hoặc đổi thứ tự vẫn giữ bộ lọc. Các dòng tin đặt tên vị trí, doanh nghiệp, lương và kinh nghiệm ở vị trí nhất quán, giảm việc mở nhiều trang chỉ để so sánh. Ba thẻ phía trên gợi ý các tin có mức khớp kỹ năng cao trong kết quả hiện tại. Tỷ lệ 88% thể hiện đối chiếu kỹ năng, không phải xác suất được tuyển. Nhấn Lưu tin đổi trạng thái thành Đã lưu; nhấn tên vị trí hoặc Xem chi tiết mở MH02. Khi quay lại, từ khóa và điều kiện được giữ. Dấu x chỉ bỏ điều kiện tương ứng.

e. Màn hình Xem chi tiết tin tuyển dụng - Phần đầu trang và thông tin doanh nghiệp (MH02):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh02_chi_tiet_dau.png | Caption: Hình ảnh 3.3.4.e. Phần đầu trang công việc và thông tin doanh nghiệp (MH02).]]

Màn hình hỗ trợ quyết định có tiếp tục ứng tuyển hay không. Tên vị trí và doanh nghiệp được đặt trước lương, địa điểm, kinh nghiệm và hạn nhận hồ sơ để ứng viên xác định đúng công việc ngay khi mở tin. Khối doanh nghiệp cho biết đơn vị tuyển dụng; nhãn Đã xác thực thể hiện tình trạng xác thực của đơn vị, không thay thế việc đọc và cân nhắc điều kiện tuyển dụng. Nội dung nhiệm vụ được trình bày bên trái; phần kỹ năng bên phải giúp đối chiếu khả năng của ứng viên với yêu cầu. Tỷ lệ 88% đi cùng danh sách ba kỹ năng đã khai báo và một kỹ năng chưa khai báo, giúp hiểu cơ sở gợi ý thay vì chỉ nhìn một con số. Nhãn chữ vẫn cần rõ khi không phân biệt được màu. Thanh ứng tuyển giữ tên tin và hành động chính trong tầm nhìn khi cuộn. Nhấn Ứng tuyển ngay chuyển đến bước chuẩn bị hồ sơ của chính tin này; chưa gửi thông tin cho doanh nghiệp. Nếu chưa đăng nhập, ứng viên được đưa trở lại sau khi đăng nhập.

f. Màn hình Xem chi tiết tin tuyển dụng khi cuộn xuống (MH02 tiếp):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh02_chi_tiet_cuon.png | Caption: Hình ảnh 3.3.4.f. Phần yêu cầu, quyền lợi, địa điểm và cách ứng tuyển trên cùng trang (MH02 khi cuộn xuống).]]

Hình thể hiện phần tiếp theo của MH02 khi cuộn, không phải một bước ứng tuyển mới. Các nhóm yêu cầu, quyền lợi, địa điểm, thời gian làm việc và cách thức ứng tuyển giúp ứng viên kiểm tra những điều kiện ảnh hưởng trực tiếp đến quyết định nộp đơn. Chẳng hạn, kinh nghiệm tối thiểu, làm tại văn phòng và khung giờ làm việc cần được đọc cùng nhau; mức khớp kỹ năng cao chưa đủ để kết luận công việc phù hợp. Tên vị trí, doanh nghiệp và thanh ứng tuyển giữ ngữ cảnh để người dùng không nhầm sang tin khác sau khi đọc nội dung dài. Nhấn lưu chỉ đánh dấu tin; nhấn Ứng tuyển ngay mới mở biểu mẫu. Phần cách thức ứng tuyển giải thích cần chọn hồ sơ và kiểm tra trước khi xác nhận, giúp dự đoán bước tiếp theo. Nếu tin đã đóng hoặc hết hạn, giao diện phải nêu trạng thái và ngừng cho bắt đầu gửi hồ sơ. Trường hợp tin thay đổi sau lúc đọc được kiểm tra lại khi xác nhận.

g. Màn hình Chọn hồ sơ đã lưu và nhập thư giới thiệu (MH03):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh03_chon_ho_so.png | Caption: Hình ảnh 3.3.4.g. Thông tin liên hệ, lựa chọn bản hồ sơ và thư giới thiệu (MH03).]]

MH03 là bước chuẩn bị hồ sơ; chỉ báo Hồ sơ, Kiểm tra, Hoàn tất giúp ứng viên biết còn bước xác nhận phía sau. Khối vị trí bên phải nhắc lại doanh nghiệp nhận hồ sơ trong suốt thao tác. Thông tin liên hệ được điền từ tài khoản để giảm nhập lại; nút Chỉnh sửa cho phép kiểm tra và sửa dữ liệu dùng cho đơn này. Danh sách hồ sơ cho chọn một bản, thể hiện bằng dấu chọn và nền nổi bật. Tên tệp, dung lượng, ngày cập nhật và nhãn bản mặc định giúp phân biệt hai phiên bản; bản mặc định vẫn phải được ứng viên kiểm tra. Xem trước mở MH05 để đọc đúng tệp đang cân nhắc. Thư giới thiệu không bắt buộc; bộ đếm thể hiện số ký tự đã dùng trên giới hạn 2.000. Khi thiếu hồ sơ hoặc thông tin liên hệ không hợp lệ, lỗi cần chỉ rõ tại phần tương ứng và giữ nội dung đã nhập. Chuyển sang Tải hồ sơ mới không xóa thư và liên hệ. Nhấn Kiểm tra hồ sơ chuyển đến MH06 sau khi dữ liệu hợp lệ, chưa tạo đơn.

h. Màn hình Tải hồ sơ mới (MH04):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh04_tai_ho_so_moi.png | Caption: Hình ảnh 3.3.4.h. Bản hồ sơ tải mới và các thao tác xem, thay, xóa tệp (MH04).]]

MH04 là cách dùng tệp mới trong cùng bước chuẩn bị của MH03. Hướng dẫn PDF tối đa 5 MB đặt cạnh vùng tải để ứng viên biết yêu cầu trước khi chọn hoặc kéo thả tệp. Tương tác cần phân biệt chưa chọn, đang tải, đã sẵn sàng và tải lỗi. Khi đang tải, tiến độ thể hiện công việc đang diễn ra; nút Kiểm tra hồ sơ chỉ được dùng khi tệp tải xong và qua kiểm tra. Hình minh họa trạng thái hoàn tất với tên tệp, loại tệp, dung lượng, tỷ lệ 100% và các thao tác tiếp theo. Xem trước mở nội dung; Thay tệp cho chọn lại; Xóa tệp bỏ lựa chọn trong biểu mẫu này, không được làm người dùng hiểu là xóa toàn bộ hồ sơ đã lưu. Nếu sai định dạng, vượt dung lượng hoặc gián đoạn tải, thông báo phải nêu nguyên nhân và cách khắc phục ngay tại vùng tệp. Thư và thông tin liên hệ vẫn giữ khi thử lại hoặc đổi cách chọn hồ sơ.

i. Màn hình Xem trước bản hồ sơ sẽ gửi (MH05):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh05_xem_truoc_ho_so.png | Caption: Hình ảnh 3.3.4.i. Đọc nội dung hồ sơ trong công cụ xem tài liệu (MH05).]]

MH05 giúp phát hiện chọn nhầm phiên bản hoặc thông tin chưa cập nhật trước khi gửi. Tiêu đề nhắc doanh nghiệp nhận hồ sơ; thanh công cụ hiển thị tên tệp, loại, dung lượng và số trang để gắn nội dung đang đọc với lựa chọn ở biểu mẫu. Công cụ phải mở đúng bản đã chọn, không tự chuyển sang bản mặc định khác. Ứng viên dùng phóng to hoặc Vừa trang để đọc rõ; với tệp nhiều trang, vùng trang thu nhỏ và điều khiển trang phải cho xem đủ nội dung. Phần hướng dẫn bên phải tập trung vào ba việc thực tế: kiểm tra đúng phiên bản, đối chiếu email và số điện thoại, xem kinh nghiệm có phù hợp vị trí hay không. Nhấn Trở lại biểu mẫu giữ lựa chọn hồ sơ, thư và liên hệ. Đây là thao tác đọc tùy chọn, không sửa nội dung tệp hoặc tạo đơn. Nếu không mở được tài liệu, giao diện cần thông báo cụ thể và cho trở lại để thay tệp, thay vì hiển thị một vùng trắng.

k. Màn hình Kiểm tra và xác nhận gửi (MH06):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh06_kiem_tra_xac_nhan.png | Caption: Hình ảnh 3.3.4.k. Xác nhận người gửi, bản hồ sơ, thư và doanh nghiệp nhận (MH06).]]

MH06 là điểm kiểm tra cuối trước khi chia sẻ thông tin. Các nhóm người gửi, hồ sơ, thư giới thiệu và doanh nghiệp nhận được đặt cùng màn hình để ứng viên đối chiếu toàn bộ dữ liệu sẽ gửi. Xem hồ sơ mở đúng bản đang chọn; Chỉnh sửa và Quay lại chỉnh sửa đưa về phần chuẩn bị, giữ các thông tin còn lại. Ô đồng ý chia sẻ phải chưa được chọn khi vào bước này; hình minh họa trạng thái ứng viên đã chủ động chọn. Nội dung bên cạnh nêu rõ dữ liệu và doanh nghiệp nhận, tránh sự đồng ý thiếu thông tin. Nhấn Xác nhận gửi hồ sơ phải hiển thị đang gửi và tạm ngăn nhấn lặp. Hệ thống kiểm tra lại tình trạng tin, quyền dùng bản hồ sơ và đơn đang được xử lý trước khi ghi nhận. Thành công mở MH07; trùng đơn mở MH09; tin đóng mở MH10. Nếu mất kết nối sau khi nhấn gửi, cần giữ dữ liệu và xác minh đơn đã được ghi nhận hay chưa trước khi cho gửi lại.

l. Màn hình Xác nhận thành công và xem đơn đã gửi (MH07):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh07_xac_nhan_thanh_cong.png | Caption: Hình ảnh 3.3.4.l. Mã đơn, thời điểm gửi, bản hồ sơ và trạng thái tiếp nhận (MH07).]]

MH07 khép lại quá trình ứng tuyển bằng kết quả có thể kiểm tra lại. Thông báo thành công đặt đầu trang; phần chi tiết ghi tên vị trí, doanh nghiệp, mã TC-000381, thời điểm gửi, liên hệ và tên bản hồ sơ. Những thông tin này giúp ứng viên xác nhận đúng đơn vừa thực hiện, thay vì chỉ nhìn một lời báo thành công. Trạng thái Đã gửi hồ sơ cùng dòng chờ doanh nghiệp xem và phản hồi phân biệt việc hệ thống nhận đơn với việc doanh nghiệp đã đánh giá hoặc chấp nhận ứng viên. Xem tệp mở bản gắn với đơn; thư hiển thị là nội dung đã gửi. Khi ứng viên cập nhật hồ sơ cho lần ứng tuyển sau, tài liệu của đơn này vẫn được giữ để hai bên có cùng căn cứ. Người dùng có thể tìm lại đơn từ Đơn đã ứng tuyển; Tiếp tục tìm việc trở về danh sách. Thông báo email đến chậm không yêu cầu nộp lại khi đơn đã được ghi nhận.

m. Màn hình Không có việc làm phù hợp (MH08):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh08_khong_co_ket_qua.png | Caption: Hình ảnh 3.3.4.m. Giữ điều kiện tìm kiếm và hỗ trợ mở rộng kết quả (MH08).]]

MH08 xử lý việc tìm kiếm hoàn tất nhưng không có tin đáp ứng đồng thời các điều kiện. Từ khóa, địa điểm và nhãn bộ lọc vẫn hiển thị để ứng viên nhận ra nguyên nhân có thể nằm ở tổ hợp tiêu chí, thay vì cho rằng hệ thống không còn việc làm. Trong ví dụ, ngưỡng lương 50 triệu được nêu rõ và có hành động Bỏ điều kiện mức lương. Nhấn nút này chỉ bỏ ngưỡng lương, giữ từ khóa, địa điểm, kinh nghiệm và hình thức làm việc rồi tìm lại; số kết quả được cập nhật sau khi nhận dữ liệu. Ứng viên cũng có thể sửa từng điều kiện và nhấn Áp dụng bộ lọc, hoặc chủ động chọn Xóa bộ lọc. Giao diện không tự xóa toàn bộ lựa chọn, không hứa trước số tin sẽ tìm được. Trong lúc chờ phải thể hiện đang tìm; nếu lỗi kết nối thì báo chưa tải được dữ liệu và cho thử lại, không hiển thị 0 việc làm như một kết quả hợp lệ.

n. Màn hình Đã có đơn đang được xử lý (MH09):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh09_don_bi_trung.png | Caption: Hình ảnh 3.3.4.n. Thông báo nộp trùng gắn với đơn đã ghi nhận (MH09).]]

MH09 xuất hiện khi hệ thống xác định ứng viên đã có đơn cho cùng tin và đơn vẫn đang được xử lý. Hộp thông báo giữ nền biểu mẫu để người dùng nhận ra tình huống phát sinh từ thao tác vừa thực hiện. Tên vị trí, doanh nghiệp, mã đơn, thời điểm, trạng thái và bản hồ sơ giúp đối chiếu với lần nộp trước; thông báo nêu rõ lần xác nhận hiện tại không tạo đơn mới hoặc thay hồ sơ đã gửi. Mở đơn đã gửi đưa đến chi tiết của chính đơn được nêu; Quay lại tin tuyển dụng cho tiếp tục xem công việc. Không có hành động gửi lại trong hộp này vì dễ dẫn đến hiểu nhầm rằng có thể tạo thêm đơn bằng cách nhấn tiếp. Khi triển khai, thao tác bàn phím cần nằm trong hộp thông báo và chuyển đến nội dung phù hợp sau khi chọn một hành động. Đơn đã ghi nhận được giữ ngay cả khi hai yêu cầu gửi đến gần như đồng thời.

o. Màn hình Tin đóng trong lúc chuẩn bị hồ sơ (MH10):

[[IMAGE: assets/diagrams/hinh_3_3_4_mh10_tin_da_dong.png | Caption: Hình ảnh 3.3.4.o. Tin ngừng nhận hồ sơ và biểu mẫu giữ nội dung đã nhập (MH10).]]

MH10 xuất hiện khi tin ngừng nhận hồ sơ trong lúc ứng viên đang chuẩn bị hoặc xác nhận. Thông báo ở đầu biểu mẫu nêu đồng thời nguyên nhân và kết quả: tin đã đóng, đơn chưa được tạo. Cách diễn đạt này tránh để ứng viên hiểu mình nhập sai hoặc hồ sơ đã đến doanh nghiệp. Thông tin liên hệ, tên tệp và thư vẫn hiện để chứng minh phần đã chuẩn bị không bị xóa trong thao tác hiện tại. Nút Không thể gửi hồ sơ ngừng hoạt động; khối trạng thái bên phải giải thích lý do bằng chữ, không chỉ dùng màu. Xem việc làm tương tự đưa đến các tin còn nhận hồ sơ. Nội dung đã chuẩn bị không tự gửi sang vị trí khác: ứng viên phải đọc tin mới, kiểm tra người nhận và xác nhận lại. Dữ liệu nhập dở chỉ được giữ trong phiên chuẩn bị hiện tại để người dùng không hiểu nhầm rằng đơn ứng tuyển đã được ghi nhận. Kiểm tra tình trạng tin ngay khi ghi nhận đơn bảo đảm thông báo phản ánh kết quả thực tế.

p. Màn hình Quản lý đơn đã ứng tuyển, theo dõi tiến trình xét tuyển và Lịch hẹn phỏng vấn của Người tìm việc:

[[IMAGE: assets/diagrams/hinh_3_3_4_r_candidate_applications.png | Caption: Hình ảnh 3.3.4.p. Màn hình Quản lý đơn đã ứng tuyển, theo dõi tiến trình xét tuyển và lịch hẹn phỏng vấn của Người tìm việc.]]

Sau khi nộp hồ sơ thành công tại màn hình MH07, người tìm việc mở mục Quản lý việc làm để theo dõi toàn bộ danh sách các đơn đã ứng tuyển. Giao diện hiển thị thanh trạng thái 5 giai đoạn gồm Đã nộp hồ sơ, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp, giúp ứng viên biết chính xác hồ sơ của mình đã được nhà tuyển dụng mở xem hay chuyển bước xét duyệt lúc nào. Khi đơn ứng tuyển như mã đơn TC-000381 được chuyển sang giai đoạn Mời phỏng vấn, hệ thống hiển thị thẻ chi tiết lịch hẹn phỏng vấn gồm thời gian, hình thức phỏng vấn trực tuyến hoặc trực tiếp, đường dẫn phòng họp hoặc địa chỉ văn phòng, tên người phụ trách và nút xác nhận tham dự ngay trên màn hình.

q. Màn hình Quản lý hồ sơ pháp lý doanh nghiệp và Địa điểm làm việc của Nhà tuyển dụng:

[[IMAGE: assets/diagrams/hinh_3_3_4_v_employer_company_profile.png | Caption: Hình ảnh 3.3.4.q. Màn hình Quản lý hồ sơ pháp lý doanh nghiệp và danh sách địa điểm làm việc của Nhà tuyển dụng.]]

Trước khi công bố tin tuyển dụng lên hệ thống, nhà tuyển dụng phải hoàn thiện thông tin doanh nghiệp và gửi hồ sơ pháp lý để xác thực tại mục Quản lý thông tin công ty. Giao diện chia thành hai vùng chức năng: vùng bên trái dùng để cập nhật tên pháp nhân đầy đủ, mã số thuế doanh nghiệp 10 chữ số, lĩnh vực hoạt động, quy mô nhân sự, địa chỉ trang thông tin điện tử và tải lên bản quét Giấy chứng nhận đăng ký doanh nghiệp định dạng PDF; vùng bên phải hiển thị trạng thái Đã xác thực pháp lý cùng danh sách trụ sở và văn phòng chi nhánh của doanh nghiệp để gắn với từng tin tuyển dụng.

r. Màn hình Soạn thảo và gửi duyệt tin tuyển dụng mới kèm thiết lập trọng số kỹ năng:

[[IMAGE: assets/diagrams/hinh_3_3_4_s_employer_post_job.png | Caption: Hình ảnh 3.3.4.r. Màn hình Soạn thảo tin tuyển dụng mới và thiết lập kỹ năng yêu cầu cùng trọng số ưu tiên.]]

Màn hình hỗ trợ nhà tuyển dụng khởi tạo tin tuyển dụng mới hoặc chỉnh sửa tin nháp trước khi gửi kiểm duyệt. Bên trái là biểu mẫu nhập tiêu đề vị trí, ngành nghề, cấp bậc, hình thức làm việc, khoảng lương công bố, số lượng cần tuyển, hạn nhận hồ sơ và nội dung mô tả công việc, yêu cầu, quyền lợi chi tiết. Khung thiết lập kỹ năng yêu cầu bên phải cho phép nhà tuyển dụng chọn các kỹ năng chuẩn hóa từ từ điển hệ thống và phân loại từng kỹ năng thành Kỹ năng bắt buộc với trọng số từ 2 đến 5 hoặc Kỹ năng ưu tiên với trọng số bằng 1. Khung xem trước ở góc dưới tự động cộng tổng trọng số mẫu số làm căn cứ tính tỷ lệ khớp kỹ năng khi gợi ý việc làm cho ứng viên.

s. Màn hình Bảng quản lý ứng viên theo năm giai đoạn dành cho Nhà tuyển dụng:

[[IMAGE: assets/diagrams/hinh_3_15_ui_kanban_ats.png | Caption: Hình ảnh 3.3.4.s. Màn hình Bảng quản lý ứng viên theo năm giai đoạn dành cho Nhà tuyển dụng.]]

Nhà tuyển dụng tiếp nhận và xử lý các đơn ứng tuyển theo từng vị trí trên bảng quản lý gồm 5 giai đoạn: Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp. Trên mỗi thẻ ứng viên, hệ thống hiển thị tên ứng viên, mã đơn, thời điểm nộp, bản hồ sơ PDF đính kèm và tỷ lệ khớp kỹ năng để hỗ trợ sàng lọc nhanh. Khi chuyển thẻ ứng viên sang giai đoạn mới, hệ thống kiểm tra quy tắc chuyển trạng thái hợp lệ, cập nhật trạng thái đơn trong bảng Applications, ghi vết người thao tác cùng thời điểm vào bảng ApplicationHistories và gửi thông báo cho ứng viên.

t. Màn hình Chi tiết đơn ứng tuyển, chấm điểm đánh giá nội bộ và lập lịch phỏng vấn:

[[IMAGE: assets/diagrams/hinh_3_3_4_t_employer_interview_modal.png | Caption: Hình ảnh 3.3.4.t. Màn hình Đánh giá hồ sơ ứng viên nội bộ và thiết lập lịch hẹn phỏng vấn.]]

Khi nhà tuyển dụng nhấn vào một thẻ hồ sơ trên bảng quản lý như đơn TC-000381 của ứng viên Nguyễn Minh Anh, hệ thống mở màn hình chi tiết đơn ứng tuyển gồm hai khung song song. Khung bên trái hiển thị thông tin liên hệ của ứng viên, kết quả đối chiếu từng kỹ năng bắt buộc và kỹ năng ưu tiên với hồ sơ, toàn văn thư giới thiệu và trình đọc trực tiếp bản hồ sơ PDF mà ứng viên đã nộp. Khung bên phải cung cấp biểu mẫu chấm điểm đánh giá nội bộ từ 1 đến 5 sao kèm nhận xét chuyên môn và biểu mẫu thiết lập lịch hẹn phỏng vấn gồm vòng phỏng vấn, thời gian bắt đầu và kết thúc, hình thức phỏng vấn, đường dẫn trực tuyến hoặc địa điểm và hướng dẫn chuẩn bị trước khi lưu và gửi thông báo mời phỏng vấn cho ứng viên.

u. Màn hình Hàng đợi đối soát pháp lý doanh nghiệp và kiểm duyệt tin tuyển dụng chờ duyệt:

[[IMAGE: assets/diagrams/hinh_3_3_4_u_moderator_approval.png | Caption: Hình ảnh 3.3.4.u. Màn hình Đối soát pháp lý doanh nghiệp và kiểm duyệt tin tuyển dụng chờ duyệt.]]

Giao diện dành cho Cán bộ kiểm duyệt hiển thị danh sách các hồ sơ pháp lý doanh nghiệp mới đăng ký và danh sách các tin tuyển dụng đang ở trạng thái Chờ duyệt. Khi chọn một tin chờ duyệt ở cột bên trái, khung chi tiết bên phải hiển thị toàn bộ nội dung tin cùng bảng kiểm tra các tiêu chí bắt buộc: trạng thái xác thực mã số thuế và giấy phép kinh doanh của doanh nghiệp, tính minh bạch của mức lương, hạn nhận hồ sơ, danh sách kỹ năng gắn với tin và rà soát từ khóa vi phạm quy chế như yêu cầu thu phí đặt cọc. Cán bộ kiểm duyệt có thể nhấn Phê duyệt và công bố tin để chuyển trạng thái tin sang đang hoạt động, hoặc chọn Từ chối và yêu cầu chỉnh sửa kèm lý do cụ thể để nhà tuyển dụng cập nhật lại.

v. Màn hình Bảng điều khiển Quản trị viên và thống kê vận hành toàn hệ thống:

[[IMAGE: assets/diagrams/hinh_3_17_ui_admin_dashboard.png | Caption: Hình ảnh 3.3.4.v. Màn hình Bảng điều khiển quản trị viên và thống kê vận hành toàn hệ thống.]]

Giao diện dành cho Quản trị viên hệ thống cung cấp số liệu tổng hợp về tình trạng hoạt động của nền tảng TalentConnect: tổng số tài khoản theo từng nhóm vai trò, số lượng doanh nghiệp đã xác thực, số tin tuyển dụng đang hoạt động, tổng số đơn ứng tuyển đã tiếp nhận, biểu đồ thống kê theo ngành nghề và danh sách nhật ký thao tác hệ thống. Từ màn hình này, quản trị viên quản lý tài khoản người dùng, khóa hoặc mở khóa tài khoản vi phạm, cập nhật danh mục ngành nghề và chuẩn hóa từ điển kỹ năng dùng chung cho toàn hệ thống.

---

3.4. Lập trình và cài đặt

3.4.1. Lý do lựa chọn ngôn ngữ lập trình và nền tảng công nghệ

Để chuyển toàn bộ thiết kế kiến trúc ba tầng, cơ sở dữ liệu 28 bảng và hệ thống giao diện người dùng thành phần mềm chạy được trên môi trường web, nhóm lựa chọn bộ ngôn ngữ và nền tảng công nghệ gồm JavaScript/TypeScript với thư viện ReactJS ở phía giao diện, môi trường Node.js kết hợp bộ khung Express.js ở phía máy chủ và ngôn ngữ truy vấn T-SQL trên Hệ quản trị cơ sở dữ liệu Microsoft SQL Server 2022 ở tầng dữ liệu. Nhóm lựa chọn bộ công nghệ này dựa trên bốn căn cứ thực tế của dự án:

Về sự thống nhất ngôn ngữ lập trình, cả phía máy khách và phía máy chủ đều sử dụng JavaScript và TypeScript, giúp sáu thành viên trong nhóm dễ phối hợp, dùng chung quy tắc kiểm tra dữ liệu đầu vào, định dạng đối tượng JSON và rút ngắn thời gian làm quen công cụ trong 12 tuần của học phần.

Về chi phí và điều kiện công cụ, toàn bộ thư viện và phần mềm phát triển gồm ReactJS, Tailwind CSS, Node.js, Express.js, SQL Server Developer Edition, Visual Studio Code, Git và Postman đều miễn phí hoặc có bản phục vụ học tập, phù hợp với điều kiện dự án sinh viên không có kinh phí mua bản quyền thương mại hay thuê máy chủ chuyên dụng.

Về khả năng tổ chức giao diện, ReactJS chia màn hình thành các thành phần độc lập, đáp ứng tốt các luồng có nhiều trạng thái tương tác như bộ lọc việc làm kết hợp gợi ý kỹ năng ở MH01, biểu mẫu chuẩn bị và tải hồ sơ nhiều bước từ MH03 đến MH06 hoặc bảng quản lý ứng viên theo năm giai đoạn của nhà tuyển dụng.

Về bảo đảm toàn vẹn dữ liệu, Hệ quản trị cơ sở dữ liệu Microsoft SQL Server 2022 hỗ trợ chặt chẽ các ràng buộc khóa chính, khóa ngoại, điều kiện kiểm tra giá trị và cơ chế giao dịch, giúp kiểm soát tính nhất quán giữa 28 bảng quan hệ của TalentConnect.

3.4.2. Một số ưu điểm nổi trội của ngôn ngữ lập trình được lựa chọn

Bộ ngôn ngữ lập trình và nền tảng công nghệ được lựa chọn mang lại các ưu điểm kỹ thuật trực tiếp cho các chức năng cốt lõi của hệ thống TalentConnect:

Ở tầng giao diện, ReactJS quản lý trạng thái cục bộ và cập nhật từng phần màn hình, giúp giữ nguyên từ khóa, bộ lọc và vị trí danh sách khi ứng viên mở xem chi tiết tin ở MH02 rồi quay lại danh sách MH01, hoặc giữ nguyên thông tin liên hệ và thư giới thiệu khi ứng viên chuyển đổi giữa chọn hồ sơ đã lưu ở MH03, tải tệp mới ở MH04 và xem trước tài liệu ở MH05.

Ở tầng dịch vụ máy chủ, Node.js và Express.js vận hành theo cơ chế xử lý vào/ra bất đồng bộ không chặn, cho phép máy chủ đáp ứng đồng thời các yêu cầu truy vấn danh sách việc làm đa điều kiện, đọc và kiểm tra tệp PDF tải lên, kết xuất hồ sơ trực tuyến sang tệp PDF và ghi nhận thông báo cho doanh nghiệp cùng ứng viên.

Ở tầng cơ sở dữ liệu, ngôn ngữ T-SQL trên Microsoft SQL Server 2022 kết hợp các truy vấn nối bảng có chỉ mục với giao dịch kiểm soát mức cô lập dữ liệu, giúp tính chính xác mức khớp kỹ năng theo trọng số ưu tiên, kiểm tra quyền sở hữu bản hồ sơ và ngăn tạo hai đơn ứng tuyển trùng lặp khi có hai yêu cầu gửi đến gần như đồng thời cho cùng một vị trí tuyển dụng.

3.4.3. Tổ chức mã nguồn và một số đoạn mã lệnh cho các chức năng quan trọng

Mã nguồn của hệ thống tách biệt giữa thư mục giao diện máy khách và thư mục dịch vụ máy chủ. Trong đó, phía máy chủ chia thành năm tầng rõ ràng: tầng định tuyến, tầng trung gian xác thực và kiểm tra quyền, tầng điều khiển, tầng xử lý nghiệp vụ và tầng truy xuất dữ liệu. Cấu trúc phân tầng này giúp mã nguồn dễ kiểm tra lỗi và thuận lợi khi cập nhật từng chức năng theo các vòng của mô hình Xoắn ốc.

[[IMAGE: assets/diagrams/hinh_3_18_code_structure.png | Caption: Hình ảnh 3.4.3.a. Cấu trúc thư mục mã nguồn của hệ thống TalentConnect.]]

Tại tầng giao diện người dùng, các thành phần hiển thị danh sách việc làm, bộ lọc và biểu mẫu nộp hồ sơ kết nối với máy chủ qua các hàm gọi API bất đồng bộ, tự động đính kèm mã phiên đăng nhập JWT và tách bạch trường hợp không có kết quả phù hợp ở màn hình MH08 với trường hợp lỗi kết nối mạng.

[[IMAGE: assets/diagrams/hinh_3_4_2_b_ui_code.png | Caption: Hình ảnh 3.4.3.b. Đoạn mã lệnh giao diện người dùng và kết nối API tìm kiếm, ứng tuyển.]]

Tại tầng dịch vụ máy chủ, các hàm điều khiển và dịch vụ xác thực người dùng từ phiên đăng nhập JWT, đối chiếu danh sách mã kỹ năng ứng viên với kỹ năng yêu cầu của tin theo trọng số ưu tiên để tính mức khớp kỹ năng và phân loại rõ danh sách kỹ năng đã khớp cùng kỹ năng chưa khai báo.

[[IMAGE: assets/diagrams/hinh_3_4_2_c_backend_code.png | Caption: Hình ảnh 3.4.3.c. Đoạn mã lệnh dịch vụ máy chủ xử lý nghiệp vụ đối chiếu kỹ năng và tiếp nhận đơn.]]

Tại tầng truy xuất cơ sở dữ liệu, mọi câu lệnh T-SQL đều dùng truy vấn tham số hóa để phòng chống tấn công tiêm mã lệnh SQL. Đặc biệt, chức năng ghi nhận đơn ứng tuyển và cập nhật lịch sử trạng thái hồ sơ đặt trong khối giao dịch cơ sở dữ liệu, kiểm tra tin còn nhận hồ sơ và chưa có đơn đang xử lý của cùng ứng viên trước khi lưu bản ghi mới vào các bảng Applications, ApplicationHistories và Notifications.

[[IMAGE: assets/diagrams/hinh_3_4_2_d_db_code.png | Caption: Hình ảnh 3.4.3.d. Đoạn mã lệnh truy vấn tham số hóa và giao dịch ghi nhận đơn ứng tuyển trên SQL Server.]]
