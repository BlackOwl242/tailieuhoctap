3.3. Thiết kế hệ thống

3.3.1. Mục tiêu của thiết kế

Thiết kế hệ thống là giai đoạn mang tính bản lề trong quy trình xây dựng phần mềm, giữ vai trò chuyển dịch toàn bộ các đặc tả yêu cầu nghiệp vụ thu được ở giai đoạn trước thành một đồ án kỹ thuật chi tiết làm cơ sở trực tiếp cho công tác lập trình. Khi các yêu cầu phần mềm được phân tích và đặc tả hoàn chỉnh, hoạt động thiết kế là một trong ba hoạt động cốt lõi không thể tách rời nhằm xây dựng và kiểm chứng phần mềm bao gồm: Thiết kế – Lập trình – Kiểm thử.

[[IMAGE: assets/diagrams/hinh_3_3_1_a_giai_doan_phan_mem.png | Caption: Hình ảnh 3.3.1.a. Các giai đoạn của phần mềm.]]

Dưới góc độ kỹ thuật công nghệ phần mềm, công đoạn thiết kế được phân rã thành các giai đoạn tuần tự nhằm bảo đảm tính toàn vẹn và khả năng kiểm soát chất lượng kỹ thuật cao nhất.

[[IMAGE: assets/diagrams/hinh_3_3_1_b_quy_trinh_thiet_ke.png | Caption: Hình ảnh 3.3.1.b. Quy trình thiết kế phần mềm.]]

Mục tiêu cụ thể của thiết kế hệ thống bao gồm ba định hướng trọng tâm. Thứ nhất là thiết lập một kiến trúc tổng thể vững chắc theo mô hình ba tầng kết hợp phong cách dịch vụ web chuẩn, bảo đảm sự độc lập hoàn toàn giữa giao diện người dùng, logic nghiệp vụ máy chủ và cơ sở dữ liệu. Thứ hai là xây dựng một cơ sở dữ liệu quan hệ hoàn chỉnh, chuyên nghiệp và đạt chuẩn ba dạng chuẩn với hai mươi tám bảng thực thể nhằm quản lý toàn diện mọi mặt hoạt động của nền tảng tuyển dụng hiện đại, loại bỏ hoàn toàn hiện tượng dư thừa và dị thường dữ liệu. Thứ ba là định hình cấu trúc giao diện người dùng công thái học, trực quan, thân thiện và đáp ứng tối ưu trên đa dạng kích thước màn hình thiết bị.

3.3.2. Thiết kế kiến trúc

Hệ thống TalentConnect được xây dựng dựa trên hai bản thiết kế kiến trúc cốt lõi:

a. Sơ đồ phân rã chức năng:
Sơ đồ phân rã toàn bộ hệ thống TalentConnect thành 4 nhánh chức năng nghiệp vụ độc lập: Phân hệ tài khoản và phân quyền; Phân hệ quản lý tin tuyển dụng và tìm kiếm; Phân hệ quản lý hồ sơ năng lực trực tuyến; và Phân hệ quản lý tuyển dụng theo phễu, kiểm duyệt và báo cáo.

[[IMAGE: assets/diagrams/hinh_3_9_fdd.png | Caption: Hình ảnh 3.3.2.a. Sơ đồ phân rã chức năng.]]

b. Sơ đồ Kiến trúc Tổng thể:
Hệ thống tuân thủ mô hình kiến trúc ba tầng kết hợp giao thức truyền tải dữ liệu JSON qua giao thức bảo mật HTTPS. Cụ thể, tầng trình diễn được xây dựng bằng ReactJS kết hợp Tailwind CSS, thực hiện giao tiếp bất đồng bộ thông qua thư viện Axios để mang lại trải nghiệm tương tác mượt mà cho người dùng. Tầng nghiệp vụ được phát triển trên nền tảng Node.js và Express.js, đảm nhiệm vai trò định tuyến các giao diện lập trình ứng dụng, xác thực bảo mật bằng mã định danh bảo mật JSON Web Token, đồng thời xử lý logic nghiệp vụ tìm kiếm, bộ lọc đa chiều và quy trình quản lý phễu ứng viên. Tầng dữ liệu sử dụng hệ quản trị cơ sở dữ liệu quan hệ mạnh mẽ kết hợp cùng kho lưu trữ tệp tài liệu số nhằm đảm bảo tính toàn vẹn và khả năng truy xuất dữ liệu an toàn, hiệu quả.

[[IMAGE: assets/diagrams/hinh_3_10_architecture.png | Caption: Hình ảnh 3.3.2.b. Sơ đồ kiến trúc tổng thể.]]

---

3.3.3. Thiết kế cơ sở dữ liệu

a. Phân tích thực thể và mối quan hệ:

Để xây dựng một hệ thống tuyển dụng và tìm kiếm việc làm đạt chuẩn doanh nghiệp tương tự như các nền tảng lớn trên thị trường, hệ thống TalentConnect được thiết kế với 28 thực thể phân chia thành sáu phân vùng nghiệp vụ liên kết chặt chẽ. Phân vùng thứ nhất là Quản trị tài khoản và phân quyền bảo mật gồm bảy bảng Roles, Permissions, RolePermissions, Users, UserRoles, UserSessions, AuditLogs. Phân vùng thứ hai là Hồ sơ ứng viên và danh mục năng lực gồm bảy bảng Candidates, CandidateEducations, CandidateExperiences, CandidateSkills, CandidateCertificates, CandidateProjects, Resumes. Phân vùng thứ ba là Đơn vị tuyển dụng và danh mục dùng chung gồm bốn bảng Employers, CompanyLocations, Categories, Skills. Phân vùng thứ tư là Tin tuyển dụng và yêu cầu công việc gồm hai bảng Jobs, JobSkills. Phân vùng thứ năm là Quy trình tuyển dụng và quản lý phễu ứng viên gồm ba bảng Applications, ApplicationHistories, Interviews. Phân vùng thứ sáu là Tương tác, giữ chân người dùng và đánh giá gồm năm bảng SavedJobs, FollowedCompanies, CompanyReviews, JobAlerts, Notifications.

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
| LogID | BIGINT | Khóa chính | Không | Mã số nhật ký kiểm toán, tự động tăng |
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
| IsOpenForWork | BIT | | Không | Trạng thái bật chế độ tìm việc để nhà tuyển dụng săn đón |
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
| PriorityWeight | INT | | Không | Trọng số ưu tiên phục vụ thuật toán so khớp độ phù hợp |

Bảng 3.30: Bảng Đơn ứng tuyển 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| ApplicationID | INT | Khóa chính | Không | Mã định danh đơn ứng tuyển, tự động tăng |
| JobID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bài đăng tuyển dụng |
| CandidateID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu người tìm việc nộp đơn |
| ResumeID | INT | Khóa ngoại | Không | Khóa ngoại tham chiếu bản lý lịch được sử dụng |
| CoverLetter | NVARCHAR(MAX) | | Có | Thư giới thiệu bản thân gửi nhà tuyển dụng |
| ApplicationStatus| VARCHAR(20) | | Không | Trạng thái phễu gồm Submitted, Viewed, Interview, Offered, Accepted, Rejected |
| MatchScore | DECIMAL(5,2) | | Có | Điểm tương thích hồ sơ theo thang từ 0 đến 100% |
| InternalRating | INT | | Có | Đánh giá xếp hạng nội bộ theo thang từ 1 đến 5 sao |
| AppliedAt | DATETIME | | Không | Thời điểm gửi đơn ứng tuyển |
| UpdatedAt | DATETIME | | Không | Thời điểm cập nhật trạng thái mới nhất |

Bảng 3.31: Bảng Lịch sử chuyển trạng thái hồ sơ 

| Tên cột dữ liệu | Kiểu dữ liệu | Khóa | Cho phép rỗng | Diễn giải chi tiết |
| :--- | :--- | :---: | :---: | :--- |
| HistoryID | INT | Khóa chính | Không | Mã định danh lịch sử phễu, tự động tăng |
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

---

3.3.4. Thiết kế giao diện người dùng

Thiết kế giao diện hệ thống TalentConnect tuân thủ nghiêm ngặt chuẩn mực trực quan, nhất quán, tiện dụng và tối ưu hóa thao tác người dùng. Toàn bộ các màn hình chức năng được phân tích và thiết kế chi tiết như sau:

a. Màn hình Trang chủ:

Màn hình chính là trung tâm điều khiển tiếp nhận người dùng với thanh tìm kiếm việc làm nổi bật ngay tại vị trí trung tâm, tích hợp các bộ lọc nhanh theo từ khóa, ngành nghề và khu vực địa lý. Phía dưới là danh mục các nhóm ngành nghề trọng điểm được minh họa bằng các biểu tượng trực quan, cùng danh sách các vị trí việc làm hấp dẫn mới nhất được tự động cập nhật, giúp người tìm việc dễ dàng tiếp cận cơ hội nghề nghiệp ngay từ lần đầu truy cập mà không cần đăng nhập.

[[IMAGE: assets/diagrams/hinh_3_12_ui_home.png | Caption: Hình ảnh 3.3.4.a. Màn hình chính.]]

b. Màn hình Đăng nhập và Đăng ký:

Giao diện định danh và xác thực người dùng cho phép chuyển đổi vai trò linh hoạt giữa Người tìm việc và Nhà tuyển dụng trên cùng một biểu mẫu hiện đại. Hệ thống tích hợp đầy đủ các cơ chế xác thực an toàn bao gồm mã hóa mật khẩu một chiều bcrypt, cấp phát chuỗi khóa định danh bảo mật phiên làm việc, tính năng gửi liên kết xác thực thư điện tử kích hoạt tài khoản và quy trình cấp lại mật khẩu quên thông qua mã xác thực một lần.

[[IMAGE: assets/diagrams/hinh_3_16_ui_auth.png | Caption: Hình ảnh 3.3.4.b. Màn hình Đăng nhập và Đăng ký.]]

c. Màn hình Tạo hồ sơ trực tuyến:

Giao diện biên soạn hồ sơ trực quan được thiết kế theo bố cục chia đôi màn hình độc đáo. Cột bên trái cung cấp các khối biểu mẫu nhập liệu có cấu trúc gồm thông tin cá nhân, mục tiêu nghề nghiệp, quá trình học vấn, kinh nghiệm làm việc, kỹ năng chuyên môn và chứng chỉ; trong khi cột bên phải liên tục cập nhật và hiển thị trực tiếp tệp tài liệu A4 theo thời gian thực. Người dùng có thể linh hoạt chuyển đổi giữa nhiều mẫu giao diện chuyên nghiệp và kết xuất tệp tài liệu số định dạng PDF đạt chuẩn in ấn.

[[IMAGE: assets/diagrams/hinh_3_13_ui_cv_builder.png | Caption: Hình ảnh 3.3.4.c. Màn hình Tạo hồ sơ trực tuyến.]]

d. Màn hình Tìm kiếm và Bộ lọc việc làm đa chiều:

Giao diện tìm kiếm việc làm chuyên sâu được tổ chức hai cột công thái học. Cột bên trái trang bị bộ công cụ lọc tiêu chí đa chiều cho phép người dùng sàng lọc việc làm chính xác theo mức lương kỳ vọng, cấp bậc chuyên môn, loại hình hợp đồng, ngành nghề và tỉnh thành; cột bên phải hiển thị danh sách các thẻ việc làm kèm thông tin tóm tắt và cơ chế phân trang tối ưu. Người dùng có thể nhấn lưu việc làm yêu thích hoặc bấm nộp đơn ứng tuyển nhanh chóng.

[[IMAGE: assets/diagrams/hinh_3_14_ui_search_jobs.png | Caption: Hình ảnh 3.3.4.d. Màn hình Tìm kiếm và Bộ lọc việc làm đa chiều.]]

e. Màn hình Bảng phễu quản lý ứng viên:

Trung tâm điều phối quy trình tuyển dụng dành riêng cho nhà tuyển dụng, được tổ chức trực quan theo mô hình bảng Kanban gồm 5 cột trạng thái nằm ngang: Hồ sơ mới nộp, Đạt sơ loại, Mời phỏng vấn, Đề xuất nhận việc và Chưa phù hợp. Chuyên viên nhân sự có thể thực hiện thao tác kéo thả thẻ ứng viên linh hoạt giữa các giai đoạn phễu, xem trước nhanh hồ sơ lý lịch, chấm điểm đánh giá năng lực nội bộ và kích hoạt hệ thống tự động gửi thư điện tử thông báo trạng thái tới ứng viên.

[[IMAGE: assets/diagrams/hinh_3_15_ui_kanban_ats.png | Caption: Hình ảnh 3.3.4.e. Màn hình Bảng phễu quản lý ứng viên.]]

f. Màn hình Bảng điều khiển Quản trị viên:

Bảng điều khiển điều hành trung tâm dành cho Quản trị viên và Cán bộ kiểm duyệt hệ thống, cung cấp các biểu đồ thống kê trực quan về các chỉ số hiệu suất vận hành chính theo thời gian thực như số người dùng mới, số tin đăng tuyển, số lượt ứng tuyển; đồng thời tích hợp hàng đợi thẩm định hồ sơ pháp lý doanh nghiệp và công cụ kiểm duyệt nội dung tin bài phòng chống tin rác và lừa đảo.

[[IMAGE: assets/diagrams/hinh_3_17_ui_admin_dashboard.png | Caption: Hình ảnh 3.3.4.f. Màn hình Bảng điều khiển Quản trị viên.]]

---

3.4. Lập trình và cài đặt

3.4.1. Mục tiêu của giai đoạn

Chuyển đổi toàn bộ thiết kế kiến trúc, cơ sở dữ liệu 28 bảng và giao diện người dùng thành mã nguồn phần mềm hoàn chỉnh chạy được trên môi trường web.

3.4.2. Công việc chi tiết trong giai đoạn Lập trình

Để hiện thực hóa toàn bộ các phân hệ chức năng và mô hình dữ liệu đã được thiết kế, giai đoạn lập trình và cài đặt được triển khai qua bảy nội dung công việc kỹ thuật trọng tâm:

Thứ nhất là công tác lựa chọn công nghệ và thiết lập bộ khung ứng dụng. Tầng giao diện người dùng được phát triển bằng thư viện ReactJS kết hợp khuôn khổ định dạng Tailwind CSS, cung cấp trải nghiệm tương tác động mượt mà và khả năng đáp ứng Responsive trên mọi thiết bị. Tầng dịch vụ máy chủ sử dụng môi trường thực thi NodeJS kết hợp bộ khung ExpressJS để xây dựng hệ thống giao diện lập trình ứng dụng theo chuẩn dịch vụ web REST chuẩn mực. Tầng lưu trữ dữ liệu sử dụng Hệ quản trị cơ sở dữ liệu quan hệ Microsoft SQL Server 2022, bảo đảm tính toàn vẹn giao dịch và hiệu năng truy vấn cao.

Thứ hai là thiết lập môi trường phát triển và chuẩn hóa cấu trúc mã nguồn. Dự án được tổ chức mô-đun hóa theo mô hình phân tầng chặt chẽ gồm tầng điều khiển Controller tiếp nhận yêu cầu, tầng dịch vụ Service xử lý logic nghiệp vụ, tầng trung gian Middleware xác thực định danh và kiểm tra quyền hạn, và tầng mô hình dữ liệu Model thực hiện truy vấn tương tác cơ sở dữ liệu. Cấu trúc này giúp mã nguồn sáng sủa, dễ đọc, dễ bảo trì và thuận lợi cho việc phát triển phối hợp nhóm.

[[IMAGE: assets/diagrams/hinh_3_18_code_structure.png | Caption: Hình ảnh 3.4.2.a. Cấu trúc thư mục mã nguồn.]]

Thứ ba là lập trình giao diện người dùng và cơ chế xử lý bất đồng bộ phía máy khách, bảo đảm hiển thị trực quan các biểu mẫu nhập liệu và đồng bộ trạng thái thời gian thực. Mô-đun giao diện được cấu trúc theo các thành phần dùng chung, phân tách rõ ràng giữa trạng thái cục bộ và luồng dữ liệu truyền từ máy chủ thông qua giao diện lập trình ứng dụng.

[[IMAGE: assets/diagrams/hinh_3_4_2_b_ui_code.png | Caption: Hình ảnh 3.4.2.b. Lập trình giao diện người dùng và kết nối giao diện lập trình ứng dụng.]]

Thứ tư là lập trình xử lý các nghiệp vụ máy chủ trung tâm, bao gồm xác thực tài khoản qua chuỗi khóa định danh bảo mật, mã hóa mật khẩu một chiều bcrypt, thuật toán đối khớp từ khóa gợi ý việc làm và quy trình luân chuyển trạng thái phễu ứng viên Kanban. Mọi nghiệp vụ đều được kiểm soát bởi các hàm trung gian kiểm tra tính hợp lệ của tham số trước khi thực thi.

[[IMAGE: assets/diagrams/hinh_3_4_2_c_backend_code.png | Caption: Hình ảnh 3.4.2.c. Lập trình dịch vụ máy chủ và thuật toán xử lý nghiệp vụ trung tâm.]]

Thứ năm là lập trình kết nối và tối ưu hóa truy vấn cơ sở dữ liệu, sử dụng cơ chế truyền tham số an toàn nhằm triệt tiêu hoàn toàn nguy cơ tấn công SQL Injection, kết hợp tạo các chỉ mục Index tối ưu hóa thời gian thực thi truy vấn dưới 500 mili-giây. Các giao dịch tài chính và luồng ứng tuyển đều áp dụng cơ chế quản lý giao dịch nghiêm ngặt.

[[IMAGE: assets/diagrams/hinh_3_4_2_d_db_code.png | Caption: Hình ảnh 3.4.2.d. Lập trình truy vấn kết nối và tối ưu cơ sở dữ liệu Microsoft SQL Server.]]

Thứ sáu là tích hợp các mô-đun chức năng thành một hệ thống phần mềm hoàn chỉnh, liên kết thông suốt các luồng dữ liệu giữa tầng giao diện, dịch vụ máy chủ và cơ sở dữ liệu quan hệ.

Thứ bảy là thực hiện kiểm thử mức mã nguồn độc lập cho từng hàm nghiệp vụ trọng yếu, phát hiện và sửa chữa kịp thời các sai lệch logic trước khi chuyển giao sang giai đoạn kiểm thử hệ thống.


