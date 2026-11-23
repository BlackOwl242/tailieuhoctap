# ÔN NHANH TRƯỚC KHI THI VẤN ĐÁP: HỆ THỐNG THÔNG TIN TÁC NGHIỆP

> **Học phần:** Hệ thống thông tin tác nghiệp (ĐH Nội vụ Hà Nội — Người ra đề: Bùi Xuân Diện)  
> **Hình thức:** Vấn đáp · Chuẩn bị 15 phút (không tài liệu) · **Công thức nói miệng:** `Khái niệm 1 câu` → `Khung ý/Số lượng` → `Đánh giá (nếu hỏi)` → `1 Ví dụ cụ thể`.  
> **Tài liệu đầy đủ:** [DE_CUONG_ON_TAP_HTTT_TAC_NGHIEP.md](./DE_CUONG_ON_TAP_HTTT_TAC_NGHIEP.md)

---

### Câu 1. Anh (chị) hãy mô tả quy trình phát triển hệ thống thông tin theo quy trình thác nước?
- **Chốt:** Phát triển tuyến tính nối tiếp qua các pha; đầu ra pha trước là đầu vào pha sau (W.W. Royce, 1970); cho phép phản hồi pha liền kề khi có sai sót.
- **7 pha:** `Khảo sát & xác định yêu cầu → Phân tích → Thiết kế → Lập trình & Test đơn vị → Tích hợp & Test hệ thống → Triển khai → Vận hành & Bảo trì`.
- **Áp dụng & Ví dụ:** Hợp dự án yêu cầu rõ, ổn định ngay từ đầu (VD: Phần mềm kế toán chuẩn mực cố định hoặc hệ thống quản lý điểm thi quy chế ổn định).

### Câu 2. Anh (chị) hãy nêu ưu, nhược điểm của hệ thống thông tin phát triển theo quy trình tăng trưởng?
- **Chốt:** Xây dựng và bàn giao qua nhiều phiên bản (gia tăng); mỗi phiên bản cộng thêm chức năng mới trên nền kiến trúc lõi.
- **Ưu (5):** Có giá trị sử dụng sớm; nhận phản hồi sớm; chia nhỏ rủi ro; ưu tiên chức năng cốt lõi và linh hoạt sửa phần sau; dễ test từng phần.
- **Nhược (4):** Đòi hỏi thiết kế kiến trúc lõi rất chặt chẽ; tốn công tích hợp & test hồi quy; phức tạp quản lý nhiều phiên bản; dễ nát cấu trúc nếu thêm thiếu kiểm soát.
- **Ví dụ:** Hệ thống HRIS làm *Hồ sơ nhân sự* (v1) → *Chấm công* (v2) → *Tính lương* (v3).

### Câu 3. Anh (chị) hãy nêu ưu, nhược điểm của hệ thống thông tin phát triển theo quy trình xoắn ốc?
- **Chốt:** Mô hình lặp định hướng rủi ro (Barry Boehm); mỗi vòng đi qua 4 góc: `Mục tiêu/Phương án → Đánh giá rủi ro & Bản mẫu → Phát triển & Kiểm chứng → Đánh giá & Kế hoạch vòng sau`.
- **Ưu (4):** Xử lý rủi ro sớm; linh hoạt trước thay đổi; khách hàng kiểm chứng sớm qua bản mẫu; hợp dự án lớn, phức tạp, công nghệ mới.
- **Nhược (4):** Quản lý phức tạp; phụ thuộc chuyên gia rủi ro; tốn chi phí/thời gian và khó chốt hạn cứng; lãng phí nếu dùng cho dự án nhỏ.
- **Ví dụ:** Xây hệ thống eKYC xác thực khuôn mặt phải thử nghiệm rủi ro giả mạo (deepfake) ở vòng đầu trước khi đầu tư toàn diện.

### Câu 4. Anh (chị) hãy nêu vai trò của hệ thống thông tin trong tổ chức? Các nhân tố tác động đến hệ thống thông tin là gì?
- **Vai trò (5):** Tự động hóa tác nghiệp & tối ưu quy trình; hỗ trợ ra quyết định các cấp; kết nối liên phòng ban/liên tổ chức; nâng chất lượng dịch vụ & trải nghiệm; khai thác dữ liệu tạo tri thức & lợi thế cạnh tranh.
- **Nhân tố tác động (2 nhóm):**
  - *Bên trong (Tổ chức & Kỹ thuật):* Cơ cấu tổ chức, quy trình nghiệp vụ, chiến lược, văn hóa tổ chức, con người & cam kết lãnh đạo, chất lượng dữ liệu/công nghệ, ngân sách.
  - *Bên ngoài (Môi trường):* Pháp lý – chính sách nhà nước, tiến bộ KH-CN (Cloud/AI), cạnh tranh & đối tác, nhu cầu người dùng/xã hội.
- **Ví dụ:** Doanh nghiệp bị áp lực minh bạch chi tiêu và quy định thuế điện tử nên triển khai cổng duyệt mua sắm có chữ ký số.

### Câu 5. Các cách phân loại hệ thống thông tin là gì? Cho ví dụ?
- **5 cách phân loại chuẩn:**
  1. *Theo cấp quản lý/mục đích:* `TPS` (POS siêu thị) → `MIS` (Báo cáo doanh thu tháng) → `DSS` (Dự báo mở lớp/tuyến xe) → `EIS/ESS` (Dashboard CEO/IOC) + `OAS` (eOffice).
  2. *Theo chức năng nghiệp vụ:* `AIS` (MISA), `FIS` (TABMIS), `HRIS` (VNPT CCVC), Sản xuất (MES), Bán hàng/Marketing (CRM).
  3. *Theo phạm vi:* Cá nhân/nhóm, Phòng ban, Toàn tổ chức (ERP), Liên tổ chức (NDXP, EDI).
  4. *Theo ngành ứng dụng:* Hành chính công (Cổng DVC), Y tế (HIS), Giáo dục (LMS), Ngân hàng (Core Banking).
  5. *Theo mức tự động/tích hợp:* Thủ công ↔ Tự động hóa; Đơn lẻ ↔ Tích hợp (ERP/CRM/SCM/BI).

### Câu 6. Những đối tượng tham gia giao dịch điện tử là gì? Có bao nhiêu mô hình giao dịch trong tác nghiệp điện tử?
- **Đối tượng (4 chủ thể + trung gian):** **G** (Chính phủ/CQNN), **B** (Doanh nghiệp), **C** (Công dân/Người tiêu dùng), **E** (Cán bộ/Nhân viên) + các tổ chức trung gian (sàn, ngân hàng/cổng thanh toán, CA chữ ký số, logistics).
- **Số mô hình:** Từ `{B, C, G}` tạo ma trận **3 × 3 = 9 mô hình** (`B2B, B2C, B2G, C2B, C2C, C2G, G2B, G2C, G2G`); mở rộng thêm `E` có thêm **2 mô hình nội bộ (`G2E, B2E`)** → Tổng **11 mô hình** (phổ biến nhất 6–7 mô hình: `B2B, B2C, C2C, G2C, G2B, G2G, G2E`).

### Câu 7. Hãy trình bày các thành phần của cổng thông tin điện tử? Theo anh (chị) thành phần nào quan trọng nhất? Vì sao?
- **5 thành phần:** (1) Nội dung thông tin & dữ liệu mở; (2) Dịch vụ trực tuyến & ứng dụng tác nghiệp (Portlets); (3) Tương tác & tiện ích (tìm kiếm, hỏi đáp, phản ánh, chatbot); (4) Kiến trúc giao diện & bố cục (Header, Menu, Body/Portlets, Footer, đa thiết bị); (5) Hạ tầng kỹ thuật, CMS, SSO/RBAC, API liên thông & An toàn thông tin.
- **Quan trọng nhất:** **Dịch vụ trực tuyến / Tác nghiệp gắn với Dữ liệu lõi** (và lớp Bảo mật – Xác thực đi kèm) vì đây là yếu tố tạo giá trị thực chất giúp người dùng xử lý công việc và phân biệt Cổng TTĐT với website tin tức một chiều.

### Câu 8. Hãy trình bày các thành phần chính trong sơ đồ tổng thể Khung Kiến trúc Chính phủ điện tử Việt Nam 1.0? Thành phần nào là quan trọng nhất? Vì sao?
- **Căn cứ:** **Công văn 1178/BTTTT-THH (21/4/2015)** *(cập nhật: 2.0 năm 2019, 3.0 năm 2023, Chính phủ số 4.0 QĐ 292/QĐ-BKHCN năm 2025)*.
- **10 thành phần chính:** (1) Người sử dụng; (2) Kênh giao tiếp; (3) Cổng TTĐT Chính phủ; (4) Hệ thống kết nối, liên thông HTTT Trung ương – địa phương; (5) Kiến trúc CPĐT Bộ/Tỉnh; (6) Các HTTT / CSDL quốc gia; (7) Các HTTT ngoài CQNN; (8) Hạ tầng kỹ thuật; (9) Quản lý, chỉ đạo; (10) An toàn thông tin (xuyên suốt).
- **Quan trọng nhất:** **Hệ thống kết nối, liên thông HTTT Trung ương – địa phương (kết hợp CSDL quốc gia)** vì là trục xương sống xóa "ốc đảo dữ liệu", bảo đảm khai báo 1 lần và liên thông dịch vụ công *(kèm vai trò chỉ đạo của Quản lý, chỉ đạo và điều kiện sống còn của An toàn thông tin)*.

### Câu 9. Hãy trình bày về công nghệ và các thành phần cấu thành nên Portal?
- **Công nghệ:** Chuẩn **Portlet (JSR-168, JSR-286)** & **WSRP**; **SOA, Web Services (SOAP/REST), API, ESB**; xác thực **SSO (SAML, OAuth2/OIDC)** + **LDAP/AD + RBAC**; **CMS/ECM** & Search (**Elasticsearch/Solr**); HTML5/CSS3/JS/AJAX (Liferay, SharePoint, WebSphere Portal).
- **4 tầng cấu thành:** (1) Tầng trình bày (`Theme/Layout, Portlets, Aggregation Engine`); (2) Tầng thực thi (`Web Server, Portal Server, Portlet Container`); (3) Tầng dịch vụ lõi (`SSO/RBAC, Cá nhân hóa, CMS, Tìm kiếm, Workflow`); (4) Tầng tích hợp & dữ liệu (`API/ESB, CSDL`).

### Câu 10. Hãy trình bày khái niệm và đặc trưng của thương mại điện tử? Cho ví dụ minh họa?
- **Khái niệm:** Tiến hành một phần hoặc toàn bộ hoạt động thương mại qua phương tiện điện tử có kết nối Internet/mạng viễn thông (NĐ 52/2013/NĐ-CP).
- **6 đặc trưng:** Phi tiếp xúc; Hoạt động 24/7 không biên giới; Có ít nhất 3 chủ thể (gồm trung gian hạ tầng/thanh toán/vận chuyển); Chứng từ & hợp đồng điện tử; Tương tác cao & cá nhân hóa; Chi phí giao dịch/phân phối thấp.
- **Ví dụ:** Mua sách trên Shopee lúc nửa đêm từ TP.HCM giao ra Hà Nội qua ví điện tử; hoặc đặt vé máy bay điện tử Vietnam Airlines nhận mã vé qua email.

### Câu 11. Hãy so sánh hành chính điện tử và thương mại điện tử?
- **Giống:** Đều ứng dụng CNTT/Internet, Portal, CSDL, xác thực/chữ ký số, thanh toán số để giảm thời gian và chi phí giao dịch.
- **Khác (6 điểm chốt):**
  - *Bản chất & Mục tiêu:* HCĐT quản lý/dịch vụ công (**phi lợi nhuận**) ↔ TMĐT mua bán (**tối đa hóa lợi nhuận**).
  - *Chủ thể:* `G2C, G2B, G2G, G2E` ↔ `B2B, B2C, C2C`.
  - *Cạnh tranh:* Độc quyền công quyền ↔ Cạnh tranh tự do.
  - *Tài chính:* Ngân sách nhà nước/lệ phí quy định ↔ Cơ chế thị trường, định giá linh hoạt.
  - *Pháp lý:* NĐ 42/2022, NĐ 118/2025, Luật CĐS ↔ NĐ 52/2013, NĐ 85/2021, Luật Thương mại.
  - *Phạm vi:* Theo địa giới/thẩm quyền ↔ Xuyên biên giới mạnh.

### Câu 12. Hãy so sánh hai hình thức thương mại điện tử B2B và B2C?
- **Giống:** Đều là giao dịch TMĐT qua Internet nhằm mục tiêu kinh doanh.
- **Khác (8 điểm chốt):**
  - *Khách hàng:* Tổ chức/Doanh nghiệp ↔ Cá nhân tiêu dùng cuối.
  - *Quy mô đơn & giá:* Lớn, theo lô, giá thỏa thuận/hợp đồng ↔ Nhỏ lẻ, giá niêm yết công khai.
  - *Quyết định mua:* Phức tạp, lý trí, duyệt nhiều cấp, chu kỳ dài ↔ Nhanh, cảm xúc, 1 người quyết.
  - *Thanh toán:* Chuyển khoản hợp đồng, L/C, công nợ ↔ Thẻ, Ví điện tử, VietQR, COD.
  - *Quan hệ & Kênh:* Dài hạn, EDI/ERP/Sàn B2B (`Alibaba`) ↔ Ngắn/trung thành thương hiệu, Web/App bán lẻ (`Shopee Mall`).

### Câu 13. Hãy so sánh hành chính điện tử và chính quyền điện tử?
- **Mối quan hệ:** **HCĐT là hạt nhân nội bộ nằm trong Chính quyền điện tử (CQĐT)**.
- **Khác:**
  - *Phạm vi & Trọng tâm:* HCĐT hẹp hơn, hướng nội (tự động hóa văn bản, điều hành, quy trình nội bộ CQNN) ↔ CQĐT toàn diện cả trong lẫn ngoài (dịch vụ công, minh bạch, phục vụ xã hội 24/7).
  - *Chủ thể chính:* `G2E, G2G` ↔ `G2C, G2B, G2G, G2E`.
  - *Hệ thống tiêu biểu:* `eOffice`, Trục liên thông văn bản, CCVC ↔ Cổng DVC Quốc gia, VNeID, eTax, iHanoi.

### Câu 14. Hãy trình bày các giai đoạn phát triển và các loại hình giao dịch trong hành chính điện tử?
- **4 giai đoạn phát triển (Gartner/UN):** `1. Hiện diện/Thông tin` → `2. Tương tác` → `3. Giao dịch` → `4. Chuyển đổi/Tích hợp toàn diện` *(VN: trước là 4 mức NĐ 43/2011; từ 2022 là 2 mức một phần & toàn trình theo NĐ 42/2022)*.
- **Loại hình giao dịch:** 4 loại theo chủ thể (`G2C, G2B, G2G, G2E` kèm chiều ngược `C2G/B2G`) + 5 nhóm theo nghiệp vụ (Thông tin công; TTHC/DVC; Văn bản điều hành; Tài chính/thuế-phí; Mua sắm công & phản ánh).

### Câu 15. Phân biệt điểm khác biệt giữa Website và Portal?
- **Website:** Tập hợp trang web thông tin/dịch vụ đơn lẻ; tương tác 1 chiều hoặc đơn giản; ít cá nhân hóa; mọi người xem giao diện như nhau; chi phí thấp *(VD: web tin tức, web giới thiệu công ty)*.
- **Portal (Cổng TTĐT):** Điểm truy cập tập trung duy nhất tích hợp đa ứng dụng qua **Portlets**; tương tác đa chiều; bắt buộc **SSO + phân quyền RBAC**; **cá nhân hóa** theo vai trò; tích hợp sâu ERP/CSDL qua API/ESB *(VD: Cổng DVC Quốc gia, Cổng thông tin sinh viên)*.

### Câu 16. Vẽ mô hình mô tả nguyên tắc hoạt động của web động và giải thích nguyên tắc hoạt động của web động?
- **Sơ đồ 4 khối – 6 bước:** `Trình duyệt (Client) --(1) HTTP Request--> Web Server --(2) Chuyển xử lý--> Application Server (PHP/Java/.NET/Node) --(3) Truy vấn SQL--> Database --(4) ResultSet--> App Server --(5) Dựng HTML/JSON động--> Web Server --(6) HTTP Response--> Trình duyệt`.
- **Ví dụ:** Hai sinh viên vào cùng trang `/xem-diem`, máy chủ căn cứ `MaSV` trong phiên đăng nhập để truy vấn CSDL và trả về 2 bảng điểm khác nhau.

### Câu 17. Web service là gì? Có thể xác định Web Service qua những cách nào?
- **Khái niệm (W3C):** Hệ thống phần mềm hỗ trợ tương tác **máy-với-máy (M2M)** qua mạng bằng các chuẩn mở, độc lập ngôn ngữ và hệ điều hành.
- **Cách xác định kỹ thuật (4 cách):** Qua địa chỉ **URI/Endpoint URL**; qua tài liệu mô tả **WSDL** (SOAP) hoặc **OpenAPI/Swagger** (REST); qua danh bạ dịch vụ **UDDI** (hoặc API Catalog); qua định dạng thông điệp **XML/SOAP hoặc JSON/HTTP**.
- **Dấu hiệu nhận diện:** Truy cập qua mạng HTTP/S, dữ liệu chuẩn hóa XML/JSON, có đặc tả giao diện máy đọc được, giao tiếp giữa ứng dụng với ứng dụng.

### Câu 18. Kể tên các thành phần của Web Service? Nêu ưu, nhược điểm của Web service?
- **Thành phần:** 3 vai trò (`Service Provider – Service Registry – Service Requestor`) hoạt động theo `Publish – Find – Bind` + 4 công nghệ cốt lõi: **XML, SOAP, WSDL, UDDI** trên nền **HTTP/HTTPS** (hiện đại bổ sung REST/JSON).
- **Ưu điểm:** Độc lập nền tảng/ngôn ngữ; tích hợp liên thông cao; tái sử dụng; đi qua tường lửa HTTP dễ dàng; chuẩn mở.
- **Nhược điểm:** Chậm hơn gọi nội bộ do đóng gói XML/SOAP; phụ thuộc mạng & bên cung cấp; phức tạp về bảo mật & giao dịch phân tán.

### Câu 19. Anh (chị) hãy nêu quy trình xây dựng giải pháp tác nghiệp trên cổng thông tin điện tử? Cho ví dụ cụ thể?
- **7 bước chuẩn:** `1. Khảo sát hiện trạng & điểm nghẽn → 2. Chuẩn hóa quy trình & đặc tả yêu cầu (SLA, phân quyền) → 3. Thiết kế Portlet/CSDL/UI-UX/SSO/API → 4. Lập trình, cấu hình Workflow BPM & tích hợp ký số → 5. Kiểm thử & Pilot → 6. Đào tạo, chuyển giao & vận hành → 7. Theo dõi KPI & cải tiến`.
- **Ví dụ:** Số hóa quy trình **Mua sắm – thanh toán vật tư** trên Cổng nội bộ (liên thông Đơn vị yêu cầu → Trưởng bộ phận → Cung ứng lấy 3 báo giá → Kế toán check ngân sách qua API → Giám đốc ký số), giảm thời gian từ 7 ngày xuống dưới 2 ngày.

### Câu 20. Anh (chị) hãy nêu tên những thành phần cần bảo vệ trong một hệ thống thông tin? Cho 1 ví dụ minh họa?
- **6 thành phần:** (1) Dữ liệu/CSDL; (2) Phần cứng & hạ tầng vật lý; (3) Phần mềm; (4) Mạng truyền thông; (5) Con người & tài khoản định danh; (6) Quy trình nghiệp vụ, tài liệu & nhật ký (Audit Log).
- **1 ví dụ xuyên suốt (Cổng mua sắm điện tử):** Mã hóa & backup 3-2-1 cho CSDL báo giá *(Dữ liệu)*; khóa thẻ từ phòng server *(Phần cứng)*; vá lỗi SQLi *(Phần mềm)*; chia vùng mạng + HTTPS/VPN *(Mạng)*; MFA & chữ ký số lãnh đạo *(Con người)*; tách quyền tạo–duyệt và ghi Audit Log bất biến *(Quy trình & Log)*.

### Câu 21. Những yêu cầu về bảo mật hệ thống là gì? Cho ví dụ minh họa?
- **Bộ 3 nền tảng (CIA):** **Bí mật** *(Confidentiality — chỉ người có quyền mới xem được)*; **Toàn vẹn** *(Integrity — không sửa xóa sai lệch)*; **Sẵn sàng** *(Availability — luôn phục vụ khi cần)*.
- **4 yêu cầu mở rộng:** **Xác thực** (MFA/VNeID), **Phân quyền** (RBAC, đặc quyền tối thiểu), **Chống chối bỏ** (chữ ký số), **Truy vết/Kiểm toán** (Audit Log).
- **Ví dụ:** Giao dịch ngân hàng số dùng Smart OTP *(Xác thực)*, TLS *(Bí mật)*, kiểm tra toàn vẹn số tiền chuyển *(Toàn vẹn)*, chạy dự phòng 24/7 *(Sẵn sàng)* và lưu biên lai đối soát *(Chống chối bỏ & Truy vết)*.

### Câu 22. Anh (chị) hãy nêu những mục tiêu bảo mật trong hệ thống thông tin tác nghiệp? Cho ví dụ minh họa?
- **5 mục tiêu vận hành tác nghiệp:** (1) Bảo đảm CIA cho dữ liệu giao dịch hàng ngày; (2) Duy trì tính liên tục hoạt động kinh doanh/công vụ; (3) Chống giả mạo danh tính và gian lận nội bộ qua kiểm soát chéo; (4) Bảo đảm giá trị pháp lý, trách nhiệm giải trình và tuân thủ kiểm toán; (5) Bảo vệ tài sản, doanh thu và uy tín tổ chức.
- **Ví dụ:** Cổng mua sắm tách 4 vai trò RBAC (lập đề xuất ≠ duyệt chi), dùng MFA + chữ ký số, lưu Audit Log bất biến, cài DLP chống tuồn bảng giá thầu và sao lưu 3-2-1.

### Câu 23. Anh (chị) hãy kể tên những mối đe dọa đến an toàn của một hệ thống thông tin?
- **5 nhóm mối đe dọa:** (1) Tấn công mạng & mã độc bên ngoài (`Ransomware, Virus, DoS/DDoS, SQL Injection, XSS, nghe lén MITM`); (2) Kỹ nghệ xã hội & lừa đảo (`Phishing`, link/QR giả); (3) Nội bộ (`Cố ý`: tuồn dữ liệu, sửa số liệu; `Vô ý`: không khóa màn hình, cắm USB lạ, mật khẩu yếu, quên thu hồi quyền); (4) Lỗi phần mềm/cấu hình sai/hỏng phần cứng; (5) Thiên tai & xâm nhập vật lý (cháy nổ, ngập lụt, trộm thiết bị).

### Câu 24. Các yếu tố cần quan tâm đến khi xây dựng giải pháp tác nghiệp cho hệ thống thông tin điện tử?
- **7 yếu tố (`4 trụ + 3 bổ trợ`):** (1) Chuẩn hóa & đơn giản hóa quy trình (SLA rõ ràng, tránh số hóa hình thức); (2) Tuân thủ pháp lý & tiêu chuẩn kỹ thuật; (3) Kiến trúc mô-đun, API tích hợp & mở rộng; (4) Chất lượng & chuẩn hóa dữ liệu ("đúng, đủ, sạch, sống"); (5) An toàn bảo mật & sao lưu (Security by Design); (6) Con người, UI/UX & quản trị thay đổi; (7) Chi phí, nguồn lực & bộ chỉ số KPI đo hiệu suất.

### Câu 25. Những trở ngại trong quá trình thu thập và lưu trữ thông tin của các hệ thống thông tin tác nghiệp hiện nay?
- **3 trở ngại khâu thu thập:** Dữ liệu phân tán, thiếu chuẩn chung; sai sót do nhập liệu thủ công/thiếu kiểm tra hợp lệ; rào cản tâm lý giữ dữ liệu cục bộ, số hóa hình thức (lưu song song giấy) hoặc trao đổi qua tin nhắn cá nhân.
- **3 trở ngại khâu lưu trữ:** Quá tải dữ liệu phi cấu trúc (scan/ảnh/email) trong khi thiếu dữ liệu sạch; chi phí cao cho hạ tầng lưu trữ, sao lưu và bảo quản dài hạn; rủi ro tấn công Ransomware, lộ lọt dữ liệu cá nhân.

### Câu 26. Lợi ích của thương mại điện tử là gì? Cho ví dụ?
- **Doanh nghiệp (5):** Mở rộng thị trường 24/7 không biên giới; giảm chi phí mặt bằng/nhân sự/giấy tờ; tối ưu tồn kho & chuỗi cung ứng; cá nhân hóa chăm sóc khách hàng; tạo sân chơi bình đẳng cho SME.
- **Người tiêu dùng (4):** Mua mọi lúc mọi nơi; đa dạng lựa chọn & dễ so sánh giá/đánh giá; giá cạnh tranh nhiều ưu đãi; nhận sản phẩm số tức thì.
- **Xã hội (3):** Thúc đẩy kinh tế số & thanh toán không tiền mặt; hỗ trợ nông sản/vùng sâu; giảm ùn tắc & ô nhiễm.
- **Ví dụ:** Hợp tác xã nông sản Tây Bắc bán hàng OCOP qua Shopee/TikTok Shop ra cả nước mà không cần thuê cửa hàng tại Hà Nội hay TP.HCM.

### Câu 27. Mô tả đặc điểm hình thức hoạt động trong của mô hình thương mại điện tử B2B?
- **Đặc điểm (5):** Đơn hàng lớn theo lô; quy trình mua lý trí, đàm phán kỹ & duyệt nhiều cấp; giá linh hoạt theo hợp đồng/chiết khấu & thanh toán công nợ (L/C, trả chậm); quan hệ đối tác dài hạn; tích hợp chặt ERP/SCM/EDI và hóa đơn điện tử.
- **4 hình thức hoạt động:** (1) Thiên về Bên bán (`Sell-side` — cổng đại lý Dell Premier, Vinamilk); (2) Thiên về Bên mua (`Buy-side` — đấu thầu ngược của Samsung); (3) Sàn trung gian B2B (`Alibaba.com, Amazon Business`); (4) Thương mại cộng tác (`EDI/Extranet` tự động bổ sung tồn kho siêu thị).

### Câu 28. Mô tả hình thức hoạt động trong của mô hình thương mại điện tử B2C?
- **Luồng chuẩn 6 bước:** Xem danh mục → Thêm giỏ hàng → Nhập địa chỉ/mã giảm giá → Thanh toán → Đóng gói/giao vận → Nhận hàng & hậu mãi.
- **5 hình thức hoạt động phổ biến:** (1) Bán lẻ trực tiếp D2C qua Web/App riêng (`thegioididong.com`, `Apple Store`); (2) Sàn TMĐT trung gian (`Shopee Mall, Lazada, Tiki`); (3) Social Commerce & Livestream (`TikTok Shop, Facebook Live`); (4) Nội dung số & thuê bao (`Netflix, Spotify, ELSA Speak`); (5) Nền tảng trung gian dịch vụ/du lịch (`Grab, Traveloka, Booking`).

### Câu 29. Kể tên các hình thức thanh toán điện tử và các rủi ro trong thương mại điện tử? Cho ví dụ?
- **5 hình thức thanh toán điện tử:** (1) Thẻ ngân hàng (Credit/Debit/Prepaid); (2) Ví điện tử (MoMo, ZaloPay, VNPay); (3) Internet/Mobile Banking & VietQR; (4) Cổng thanh toán trung gian (OnePay, PayPal, Payoo); (5) Mobile Money / Tiền điện tử hợp pháp. *(Lưu ý: COD không phải thanh toán điện tử).*
- **6 nhóm rủi ro:** An ninh/gian lận thẻ & Phishing; Lộ lọt dữ liệu cá nhân; Hàng giả/kém chất lượng & bom hàng COD; Nghẽn/sập hệ thống khi Flash Sale; Thất lạc/hư hỏng khi vận chuyển; Tranh chấp pháp lý trang nước ngoài/không đăng ký.
- **Ví dụ:** Khách nhấn link giả mạo hoàn tiền, nhập OTP bị mất tiền *(gian lận thanh toán)*; hoặc mua hàng đúng đợt sale 11/11 bị trừ tiền nhưng đơn báo lỗi *(lỗi đồng bộ)*.

### Câu 30. Các hình thức hoạt động của thương mại điện tử ngày nay? Cho ví dụ minh họa?
- **7 hình thức (NĐ 52/2013 & 85/2021 + xu hướng mới):**
  1. Website/App TMĐT bán hàng (`thegioididong.com`).
  2. Sàn giao dịch TMĐT (`Shopee, Lazada, Alibaba`).
  3. Website khuyến mại trực tuyến (`Dealtoday, voucher ShopeeFood`).
  4. Website đấu giá trực tuyến (`eBay, đấu giá biển số xe vpa.com.vn`).
  5. Thương mại di động M-Commerce (`Grab, ví MoMo`).
  6. Social Commerce & Livestream (`TikTok Shop, Facebook Live`).
  7. TMĐT xuyên biên giới & Bán lẻ đa kênh Omnichannel (`Amazon Global Selling, FPT Shop mua online nhận tại cửa hàng`).

### Câu 31. Anh (chị) cho biết các thành phần của hệ thống thương mại điện tử là gì?
- **Theo Hệ sinh thái Turban (4 khối):** (1) Chủ thể tham gia (Người mua, Người bán, Trung gian, Hạ tầng, Nhà nước); (2) Cơ chế mua sắm (Storefront, E-Mall, Portal, App); (3) Công cụ người bán (E-Catalog, Search, Giỏ hàng, Định giá/Đấu giá); (4) Hạ tầng công nghệ & **5 trụ cột hỗ trợ** (Con người/Pháp lý – Marketing – Thanh toán điện tử – Logistics hoàn tất đơn – Bảo mật).
- **Theo Kỹ thuật Website (6 phân hệ):** Front-end; Back-end (CMS/OMS); CSDL; Cổng thanh toán; API Vận chuyển; Bảo mật & Phân tích.

### Câu 32. Anh (chị) hãy phân biệt website thương mại điện tử với website bán hàng dựa vào các yếu tố sau nào?
- **Căn cứ Nghị định 52/2013/NĐ-CP & 85/2021/NĐ-CP — 6 yếu tố:**
  1. *Bản chất/Mục đích:* Web bán hàng tự bán sản phẩm **của chính mình** ↔ Web dịch vụ TMĐT (Sàn) làm **sân chơi cho bên thứ ba** mua bán.
  2. *Chủ thể lập:* Cá nhân, hộ KD, DN ↔ Bắt buộc là **thương nhân/tổ chức**.
  3. *Chủ thể giao dịch:* 2 bên (`Khách ↔ Chủ web`) ↔ Đa bên (`Người mua ↔ Nhiều người bán` qua `Chủ sàn`).
  4. *Kỹ thuật:* Giỏ hàng đơn lẻ (hoặc giới thiệu/chốt đơn) ↔ Hệ thống đa gian hàng (Multi-vendor), ví/ký quỹ, nhiều đơn vị vận chuyển.
  5. *Thủ tục Bộ Công Thương:* **Thông báo** (logo xanh) ↔ **Đăng ký** (logo đỏ, thẩm định chặt hơn).
  6. *Trách nhiệm pháp lý:* Tự chịu trách nhiệm hàng hóa/bảo hành của mình ↔ Quản lý người bán, chống hàng giả, giải quyết tranh chấp.

### Câu 33. Kể tên các loại cơ sở dữ liệu phụ vụ website thương mại điện tử?
- **Theo nghiệp vụ (7 loại):** CSDL Sản phẩm & Danh mục; Khách hàng & Tài khoản; Đơn hàng & Giỏ hàng; Thanh toán & Tài chính; Kho hàng & Nhà cung cấp/Gian hàng; Khuyến mại & Đánh giá; Nhật ký hệ thống & Hành vi (Clickstream).
- **Theo công nghệ DBMS (4 loại):** CSDL Quan hệ SQL (`MySQL, PostgreSQL, SQL Server` — đơn hàng/tiền bạc ACID); Document NoSQL (`MongoDB` — thuộc tính sản phẩm đa dạng); Key-Value/Cache (`Redis` — session, giỏ hàng, Flash Sale); Search Engine (`Elasticsearch, Solr` — tìm kiếm & lọc mili-giây).

### Câu 34. Những rủi ro trong việc mua sắm online là gì? Cho ví dụ minh họa?
- **7 rủi ro góc độ người mua:** (1) Hàng giả, kém chất lượng, khác ảnh *(VD: đặt áo da nhận vải mỏng)*; (2) Web/shop giả mạo lừa chuyển cọc hoặc Phishing OTP *(VD: link giả trúng thưởng)*; (3) Lộ thông tin cá nhân *(VD: kẻ gian giả shipper gọi đọc đúng mã đơn lừa chuyển khoản)*; (4) Vận chuyển chậm, vỡ hỏng, tráo hàng; (5) Khó đổi trả & né bảo hành; (6) Giá ảo & phí ship ẩn cao; (7) Mua sắm bốc đồng & khó khiếu nại khi mua tự phát qua tin nhắn ngoài sàn.

### Câu 35. Kể tên các mối quan hệ đặc trưng của hành chính điện tử? Cho ví dụ?
- **4 mối quan hệ cốt lõi (`G2G – G2E – G2C – G2B`, kèm chiều ngược `C2G/B2G`):**
  1. `G2G` (CQNN – CQNN): Trục liên thông văn bản quốc gia, chia sẻ CSDL qua NDXP.
  2. `G2E` (CQNN – Công chức): Văn phòng điện tử `eOffice`, quản lý nhân sự `VNPT CCVC`.
  3. `G2C` (CQNN – Công dân): Nộp hồ sơ cấp đổi GPLX/khai sinh trên Cổng DVC Quốc gia bằng VNeID; phản ánh qua `iHanoi`.
  4. `G2B` (CQNN – Doanh nghiệp): Thuế điện tử `eTax`, hải quan `VNACCS`, đấu thầu `muasamcong.mpi.gov.vn`.

### Câu 36. Anh (chị) hãy nêu mục tiêu và lợi ích của hành chính điện tử đem lại?
- **5 Mục tiêu:** Nâng hiệu lực/hiệu quả bộ máy; Minh bạch & giải trình; Cải cách TTHC lấy dân làm trung tâm; Tiết kiệm ngân sách & chi phí xã hội; Tạo nền tảng lên CPĐT/Chính phủ số.
- **Lợi ích 3 phía:** *CQNN/Công chức* (luân chuyển văn bản từ nhiều ngày xuống vài phút, chấm KPI rõ, giảm kho giấy); *Người dân* (nộp 24/7, tra cứu tiến độ, bớt khai báo lại); *Doanh nghiệp & Xã hội* (giảm chi phí tuân thủ thuế/hải quan, tăng niềm tin & năng lực cạnh tranh).

### Câu 37. Các giai đoạn phát triển hành chính điện tử là gì? Giải thích và cho ví dụ về một giai đoạn?
- **4 giai đoạn:** `1. Hiện diện/Thông tin` → `2. Tương tác` → `3. Giao dịch` → `4. Chuyển đổi/Tích hợp toàn diện` *(VN: từ 4 mức NĐ 43/2011 sang 2 mức một phần/toàn trình NĐ 42/2022)*.
- **Giải thích & Ví dụ Giai đoạn 3 (Giao dịch):** Chuyển từ xem/tải biểu mẫu sang giải quyết trọn vẹn trên mạng nhờ 4 hạ tầng (định danh VNeID, quy trình Một cửa BPM, chữ ký số PKI, thanh toán trực tuyến). *Ví dụ:* Cấp đổi GPLX toàn trình trên Cổng DVC Quốc gia (đăng nhập VNeID → đối soát dân cư & khám sức khỏe điện tử → cán bộ thẩm định & lãnh đạo ký số → nộp lệ phí QR → nhận kết quả số & thẻ gửi bưu chính).

### Câu 38. Có bao nhiêu loại hình giao dịch trong hành chính điện tử? Cho ví dụ?
- **4 loại hình theo chủ thể:** `G2C` (đổi GPLX, khai sinh trên Cổng DVC Quốc gia); `G2B` (nộp thuế eTax, hải quan VNACCS, đấu thầu qua mạng); `G2G` (gửi văn bản qua Trục liên thông, chia sẻ dữ liệu qua NDXP); `G2E` (xử lý văn bản trên eOffice, quản lý hồ sơ CCVC). *(Ghi chú chiều ngược C2G/B2G).*
- **5 nhóm theo nghiệp vụ:** Thông tin công & dữ liệu mở; Giải quyết TTHC/DVC; Văn bản điều hành công vụ; Tài chính công/thuế-phí (TABMIS); Mua sắm công điện tử.

### Câu 39. Lợi ích mà chính phủ điện tử đem lại? Cho ví dụ?
- **5 lợi ích + Ví dụ thực tế VN:** (1) Phục vụ người dân/DN nhanh, tiết kiệm *(hợp nhất Cổng DVC Quốc gia 01/7/2025 + VNeID)*; (2) Điều hành nội bộ tức thời *(Trục liên thông văn bản quốc gia ký số toàn trình)*; (3) Minh bạch, chống tham nhũng *(đấu thầu qua mạng `muasamcong.mpi.gov.vn`, `iHanoi`)*; (4) Liên thông dữ liệu phục vụ chính sách *(Đề án 06 & trục NDXP)*; (5) Nâng năng lực cạnh tranh quốc gia *(Việt Nam xếp hạng **71/193** chỉ số EGDI năm 2024 của Liên hợp quốc)*.

### Câu 40. Anh (chị) hãy nêu những khó khăn trong xây dựng chính phủ điện tử ở Việt Nam hiện nay?
- **7 khó khăn (`3 cụm: Dữ liệu/Hạ tầng/An ninh – Con người/Thói quen – Thể chế/Tài chính`):**
  1. Dữ liệu còn phân tán, thiếu chuẩn và tâm lý "giữ dữ liệu" cục bộ.
  2. Đầu tư phân tán trước đây và chênh lệch hạ tầng vùng sâu, vùng xa.
  3. Thiếu nhân lực số chất lượng cao, nhất là ở cấp cơ sở (xã/phường).
  4. Thói quen làm việc giấy tờ và tình trạng *"số hóa hình thức"*.
  5. Áp lực an toàn thông tin, tấn công mạng (Ransomware, DDoS) và lừa đảo mạo danh CQNN.
  6. Khoảng cách số, thói quen và kỹ năng số hạn chế ở một bộ phận người dân.
  7. Hành lang pháp lý, cơ chế tài chính – đấu thầu thuê dịch vụ CNTT/AI đổi mới chậm hơn công nghệ.
