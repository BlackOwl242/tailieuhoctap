# Đề cương Ôn thi Lý thuyết Công nghệ phần mềm

> **Nguồn đối chiếu 100%:**
> - Toàn bộ **24 câu hỏi** được trích nguyên văn từng chữ từ **Slide 261 – 266** (Ảnh `170` – `176`) trên bài giảng PowerPoint của giảng viên.
> - Toàn bộ **câu trả lời** bám sát 100% nội dung trong tài liệu `bai-giang-cong-nghe-phan-mem.md` và nguyên văn nội dung các slide bài giảng của học phần.

---

## Hình thức thi và cách trả lời (Slide 260 / Ảnh 171)

- **Cấu trúc điểm:** Vấn đáp lý thuyết (**3 điểm**) + Bài tập lớn (**7 điểm**).
- **Cấu trúc trả lời vấn đáp chuẩn theo tài liệu:**
  `Khái niệm` → `Đặc điểm / Quy trình` → `Ưu nhược điểm` → `Ví dụ áp dụng`.

---

## Chương 1. Đại cương về phần mềm (Slide 261 / Ảnh 170)

> *Ghi chú từ tài liệu `bai-giang-cong-nghe-phan-mem.md` (dòng 35): Bộ ảnh chỉ có slide câu hỏi của Chương 1, không có slide giảng chi tiết chương này. Nội dung dưới đây giữ nguyên 100% khung trả lời trong tài liệu `bai-giang-cong-nghe-phan-mem.md` (dòng 30–34).*

### 1. Phần mềm là gì? Bộ phận chính nào cấu thành nên phần mềm?
- **Phần mềm và các bộ phận cấu thành:** Gồm 3 bộ phận chính phối hợp với nhau để giải quyết một nhiệm vụ:
  1. **Chương trình** (các câu lệnh thực thi).
  2. **Dữ liệu / Cấu trúc dữ liệu**.
  3. **Tài liệu liên quan** (tài liệu phát triển, vận hành và hướng dẫn sử dụng).

### 2. Phần mềm thường được phân thành mấy loại? Là những loại nào – cho ví dụ?
- **Phân loại phần mềm chính:**
  1. **Phần mềm hệ thống:** Dùng để quản lý phần cứng và tạo môi trường cho các phần mềm khác hoạt động *(Ví dụ: Hệ điều hành Windows, Linux, trình biên dịch, driver)*.
  2. **Phần mềm ứng dụng:** Phục vụ trực tiếp các nhu cầu công việc, nghiệp vụ của người dùng *(Ví dụ: Phần mềm văn phòng MS Word/Excel, phần mềm quản lý bán hàng, quản lý nhân sự/tuyển dụng)*.

### 3. Công nghệ phần mềm là gì? Mục tiêu của công nghệ phần mềm là gì?
- **Công nghệ phần mềm là gì:** Là việc áp dụng quy trình, phương pháp và công cụ một cách có hệ thống để phát triển, vận hành và bảo trì phần mềm.
- **Mục tiêu của công nghệ phần mềm:** Tạo ra phần mềm đáp ứng đúng yêu cầu của người dùng với **chất lượng**, **thời gian** và **chi phí** phù hợp.

### 4. Để đánh giá 1 phần mềm tốt cần đạt được những tiêu chí nào?
- **Các tiêu chí đánh giá một phần mềm tốt:**
  1. **Tính đúng đắn / Đáp ứng chức năng** (thực hiện đúng yêu cầu).
  2. **Độ tin cậy** (hoạt động ổn định, chính xác).
  3. **Tính dễ sử dụng** (giao diện thân thiện, dễ thao tác).
  4. **Hiệu năng** (tốc độ xử lý nhanh, tối ưu tài nguyên).
  5. **Tính bảo mật** (an toàn dữ liệu và phân quyền).
  6. **Khả năng bảo trì và mở rộng** (dễ sửa lỗi, nâng cấp khi có thay đổi).

---

## Chương 2. Mô hình vòng đời phần mềm (Slide 262 / Ảnh 172)

*(Đối chiếu nguyên văn Slide 001 – 052 và bảng tổng hợp tại `bai-giang-cong-nghe-phan-mem.md` dòng 39–49)*

### 1. Mô tả mô hình thác đổ. Nêu ưu và nhược điểm của mô hình thác đổ. Ứng dụng của mô hình thác nước (waterfall model)
- **Mô tả mô hình thác đổ (Waterfall model – Slide 016–019):**
  - Là mô hình phát triển phần mềm cổ điển do W.W. Royce phát minh (1970).
  - Các giai đoạn đi tuần tự; hoàn tất giai đoạn trước rồi mới chuyển sang giai đoạn sau.
  - Quá trình phát triển phần mềm là dòng chảy qua các pha:
    `Xác định yêu cầu` → `Phân tích` → `Thiết kế` → `Cài đặt` → `Tích hợp` → `Bảo trì` → `Thôi sử dụng`.
  - Có tính lặp giữa các pha: nếu trong một pha phát hiện sai sót hoặc không phù hợp thì quay lại hiệu chỉnh ở pha trước.
- **Ưu điểm (Slide 020 & tài liệu dòng 43):**
  - Dễ sử dụng, dễ tiếp cận, dễ lập kế hoạch, quản lý mốc và tài liệu.
  - Sản phẩm phát triển theo các giai đoạn được xác định rõ ràng.
  - Phát hiện sớm các lỗi.
  - Là mô hình được sử dụng rộng rãi nhất.
- **Nhược điểm (Slide 021–022 & tài liệu dòng 43):**
  - Khó thích nghi khi yêu cầu thay đổi; những thay đổi có thể gây ra lẫn lộn khi nhóm phát triển làm việc.
  - Khách hàng thường khó phát biểu mọi yêu cầu một cách tường minh ngay từ đầu.
  - Bản chất tuyến tính dẫn tới *"các trạng thái tắc nghẽn" (blocking states)*: nhóm phát triển ở pha sau phải chờ đợi sự chuyển giao công việc từ nhóm khác ở pha trước (thường xảy ra vào thời gian đầu và cuối của quy trình phần mềm).
- **Ứng dụng (Slide 023–024 & tài liệu dòng 43):**
  - Các dự án nhỏ, ngắn hạn.
  - Các dự án ít có sự thay đổi về yêu cầu (yêu cầu rõ ràng và ổn định).

### 2. Mô tả mô hình bản mẫu. Nêu ưu và nhược điểm của mô hình bản mẫu. Ứng dụng của mô hình bản mẫu.
- **Mô tả mô hình bản mẫu (Rapid prototyping model – Slide 026–035):**
  - Tạo phiên bản thử (bản mẫu) để người dùng xem, dùng thử, phản hồi, rồi làm rõ yêu cầu và hoàn thiện hệ thống.
  - **Bản chất (Slide 035):** *"Mô hình bản mẫu (rapid prototyping model) thực chất là mô hình thác đổ, nhưng pha xác định yêu cầu được thay bằng bản mẫu."*
  - **Cách làm bản mẫu (Slide 028–030):** Đầu tiên thu thập yêu cầu khách hàng → *"thiết kế nhanh"* (chỉ tập trung biểu diễn các khía cạnh của phần mềm mà người dùng nhìn thấy được) → giới thiệu bản mẫu để khách hàng chạy thử, đánh giá, góp ý kiến (Vòng lặp: `Lắng nghe khách hàng` → `Xây dựng/hiệu chỉnh bản mẫu` → `Khách hàng chạy thử bản mẫu`).
  - **Quy trình tổng thể (Slide 033):** `Bản mẫu` → `Phân tích` → `Thiết kế` → `Cài đặt` → `Tích hợp` → `Bảo trì` → `Thôi sử dụng`.
- **Ưu điểm (Slide 038–039 & tài liệu dòng 44):**
  - Khách hàng được tương tác sớm với hệ thống.
  - Người phát triển xác định nhanh chóng và chính xác được yêu cầu (hiểu đúng nhu cầu và giao diện sớm).
  - Có thể phát hiện được những yêu cầu mới.
- **Nhược điểm (Slide 040–042 & tài liệu dòng 44):**
  - Hệ thống xây dựng có thể mang cấu trúc nghèo nàn với những lựa chọn không tốt, dẫn đến chất lượng thấp và khó bảo trì sau một thời gian dài (phải kiểm soát chất lượng kiến trúc).
  - Khách hàng hối thúc nhà phát triển hoàn thành sản phẩm ngay sau khi thấy được bản mẫu đầu tiên (do dễ tưởng bản mẫu đã là sản phẩm hoàn chỉnh).
- **Ứng dụng (Slide 036–037):**
  - Thích hợp với các hệ thống vừa và nhỏ, đặc biệt là khi yêu cầu chưa rõ ràng.
  - Sử dụng hiệu quả khi kết hợp với các mô hình khác.

### 3. Mô tả mô hình xây dựng và hiệu chỉnh. Nêu ưu và nhược điểm của mô hình xây dựng và hiệu chỉnh. Ứng dụng của mô hình xây dựng và hiệu chỉnh
- **Mô tả mô hình xây dựng và hiệu chỉnh (Build-and-Fix model – Slide 043–046):**
  - Trong mô hình này, **không có các pha phân tích, thiết kế**.
  - Người phát triển sau khi trao đổi với khách hàng sẽ viết một phiên bản ban đầu (phiên bản đầu tiên).
  - Phần mềm được chạy thử với sự quan sát của khách hàng, liên tục được sửa dần (hiệu chỉnh) theo phản hồi cho đến khi khách hàng vừa ý.
  - Sau khi được khách hàng chấp nhận, phần mềm được đưa vào sử dụng và bảo trì (`Xây dựng phiên bản đầu tiên` ⇄ `Hiệu chỉnh cho đến khi khách hàng vừa ý` → `Bảo trì` → `Thôi sử dụng`).
- **Ưu điểm (Tài liệu dòng 45):**
  - Nhanh với bài toán nhỏ, mục tiêu còn đang khám phá (không tốn thời gian phân tích, thiết kế ban đầu).
- **Nhược điểm (Slide 049–050 & tài liệu dòng 45):**
  - Thiếu cấu trúc dễ gây khó bảo trì và mở rộng; nhược điểm thể hiện rất rõ trong giai đoạn bảo trì (sửa lỗi và cập nhật).
  - Nếu phần mềm đã được sử dụng sau một thời gian dài khiến chính người viết chương trình cũng quên đi dòng lệnh, hoặc việc bảo trì do một người khác thực hiện thì sẽ rất khó khăn.
- **Ứng dụng (Slide 051–052 & tài liệu dòng 45):**
  - Thích hợp cho phần mềm nhỏ, một người viết và ít có khả năng phải sửa đổi trong quá trình sử dụng.
  - Không hợp với các dự án lớn do nhiều người viết.

### 4. So sánh mô hình thác đổ và mô hình bản mẫu
- **Điểm giống nhau (Slide 033, 035, 056):**
  - Cùng hướng tới chuyển giao cho khách hàng phiên bản hoàn chỉnh, thỏa mãn tất cả các yêu cầu và có thể sử dụng ngay.
  - Sau pha đầu tiên (xác định yêu cầu), cả hai mô hình đều đi tuần tự qua các pha: `Phân tích` → `Thiết kế` → `Cài đặt` → `Tích hợp` → `Bảo trì` → `Thôi sử dụng`.
- **Điểm khác nhau (Tổng hợp từ Slide 016–042 & bảng dòng 41–44):**

| Tiêu chí | Mô hình thác đổ (Waterfall) | Mô hình bản mẫu (Prototype) |
| :--- | :--- | :--- |
| **Cách làm** | Các giai đoạn đi tuần tự từ *Xác định yêu cầu* đến *Bảo trì*; hoàn tất giai đoạn trước rồi mới chuyển sang giai đoạn sau. | Thực chất là mô hình thác đổ, nhưng **pha xác định yêu cầu được thay bằng bản mẫu** (tạo phiên bản thử để người dùng xem, phản hồi, rồi làm rõ yêu cầu). |
| **Ưu điểm** | Dễ sử dụng, dễ tiếp cận, dễ lập kế hoạch, quản lý mốc và tài liệu; các giai đoạn xác định rõ ràng. | Khách hàng được tương tác sớm với hệ thống; giúp hiểu đúng nhu cầu, giao diện sớm và phát hiện yêu cầu mới. |
| **Hạn chế** | Khó thích nghi khi yêu cầu thay đổi; khách hàng khó phát biểu tường minh mọi yêu cầu ngay từ đầu; dễ xảy ra trạng thái tắc nghẽn (*blocking states*). | Dễ khiến khách hàng tưởng bản mẫu đã là sản phẩm hoàn chỉnh và hối thúc bàn giao; hệ thống có thể mang cấu trúc nghèo nàn, khó bảo trì lâu dài. |
| **Ứng dụng** | Các dự án nhỏ, ngắn hạn; các dự án có yêu cầu rõ ràng, ổn định (ít thay đổi). | Các hệ thống vừa và nhỏ, đặc biệt khi yêu cầu chưa rõ ràng; kết hợp hiệu quả với các mô hình khác. |

---

## Chương 3. Quy trình phát triển, kiểm thử và bảo trì phần mềm (Slide 263 – 264 / Ảnh 173 – 174)

*(Đối chiếu nguyên văn Slide 081 – 146 và `bai-giang-cong-nghe-phan-mem.md` dòng 51–71)*

### 1. Nêu quy trình xây dựng phần mềm?
- **Khái niệm:** Quy trình xây dựng phần mềm (*software process*) là cách thức làm ra phần mềm, bao gồm vòng đời phần mềm, các công cụ và những người tham gia phát triển phần mềm; mô tả toàn bộ các pha mà phần mềm phải trải qua từ khi xác định yêu cầu cho đến khi bảo trì và thôi sử dụng.
- **Các bước / giai đoạn chính trong quy trình xây dựng phần mềm (Tài liệu dòng 53 & Slide Chương 3):**
  1. **Xác định yêu cầu** (thu thập yêu cầu phần mềm, phần cứng, dữ liệu, con người).
  2. **Phân tích và đặc tả yêu cầu** (mô hình thông tin, mô hình chức năng, mô hình hành vi).
  3. **Thiết kế phần mềm** (chia làm 4 giai đoạn kỹ thuật: *Thiết kế kiến trúc*, *Thiết kế dữ liệu*, *Thiết kế thủ tục*, *Thiết kế giao diện*).
  4. **Lập trình (Cài đặt / Xây dựng)** (viết mã tạo các module chương trình).
  5. **Kiểm thử** (kiểm thử và tích hợp phần mềm).
  6. **Bảo trì** (thay đổi, sửa chữa, nâng cấp phần mềm sau khi bàn giao và sử dụng).

### 2. Mục đích của việc xác định yêu cầu là gì? Thông thường phần mềm thường được chia làm mấy loại (yêu cầu)?
- **Mục đích của việc xác định yêu cầu:**
  - Nắm bắt được những yêu cầu của khách hàng; xác định rõ các dịch vụ mà hệ thống được mong đợi phải cung cấp và các ràng buộc mà hệ thống phải tuân thủ khi vận hành.
- **Phân loại yêu cầu phần mềm (Tài liệu dòng 53 & Slide Chương 3):**
  - **Theo tính chất yêu cầu (2 loại):**
    1. **Yêu cầu chức năng:** Các chức năng, dịch vụ nghiệp vụ mà phần mềm phải thực hiện.
    2. **Yêu cầu phi chức năng:** Các ràng buộc về hiệu năng, bảo mật, độ tin cậy, tính dễ sử dụng, khả năng bảo trì.
  - **Theo các thành phần trong khâu xác định yêu cầu (4 loại):**
    1. **Yêu cầu phần mềm.**
    2. **Yêu cầu phần cứng.**
    3. **Yêu cầu về dữ liệu.**
    4. **Yêu cầu về con người.**

### 3. Xác định phần mềm là xác định những nội dung gì? Sử dụng phương pháp nào để xác định yêu cầu?
- **Xác định phần mềm (xác định yêu cầu) là xác định những nội dung:**
  1. Bài toán của đề tài và phạm vi hệ thống.
  2. Đối tượng người dùng (yêu cầu về con người).
  3. Các chức năng chính của hệ thống (yêu cầu chức năng / yêu cầu phần mềm).
  4. Yêu cầu về dữ liệu (dữ liệu đầu vào, đầu ra, dữ liệu lưu trữ).
  5. Yêu cầu phần cứng và các yêu cầu phi chức năng.
- **Phương pháp sử dụng để xác định yêu cầu (Nguyên văn Slide Chương 3):**
  1. **Quan sát hệ thống hiện tại.**
  2. **Thảo luận (phỏng vấn) với người sử dụng và khách hàng.**
  3. **Phân tích công việc** (và nghiên cứu tài liệu, biểu mẫu hiện hành).
  4. **Xây dựng bản mẫu (Prototyping) / Khảo sát.**

### 4. Đặc tả phần mềm là gì? Mục đích của việc đặc tả phần mềm là gì?
- **Đặc tả phần mềm (Đặc tả yêu cầu phần mềm – Slide 081–082) là gì:**
  - Là công việc xây dựng các tài liệu đặc tả yêu cầu rất rõ ràng theo hướng của người phát triển (khác với tài liệu xác định yêu cầu viết bằng ngôn ngữ tự nhiên của khách hàng), trong đó sử dụng các công cụ như: **mô hình hóa** (sơ đồ phân rã chức năng, sơ đồ luồng dữ liệu DFD mức ngữ cảnh - mức 0 - mức 1, mô hình thực thể liên kết ER), **tập hợp các kịch bản sử dụng**, **các nguyên mẫu**.
- **Mục đích của việc đặc tả phần mềm (Tài liệu dòng 53 – Ảnh 081–082):**
  1. **Thống nhất giữa người dùng và người phát triển** (tránh gây hiểu nhầm giữa khách hàng và người phát triển).
  2. **Giúp các nhóm phát triển trao đổi với nhau** (làm cơ sở cho thiết kế và lập trình).
  3. **Làm cơ sở kiểm tra (kiểm thử) sản phẩm có đúng yêu cầu hay không.**

### 5. Nguyên tắc thiết kế giao diện
- **Nguyên tắc thiết kế thực đơn (Menu) và giao diện trong bài giảng (Slide mục 3.3.5):**
  1. **Về mặt ngữ nghĩa:** Mỗi thực đơn / màn hình phải có tiêu đề rõ nghĩa, từng mục phải mô tả rõ chức năng sẽ được thực hiện.
  2. **Về mặt chức năng:** Phân các thực đơn / thành phần điều khiển thuộc cùng một nhóm chức năng vào những mục riêng biệt.
  3. **Về mặt kích thước:** Số lượng các mục trên thực đơn không nên vượt quá chiều dài màn hình; có thể dùng thực đơn nhiều cấp để thay thế những thực đơn quá dài.
  4. **Đảm bảo tính nhất quán, dễ sử dụng và thân thiện với người dùng:** Bố cục, màu sắc, phông chữ đồng nhất; có kiểm tra dữ liệu đầu vào và thông báo/xác nhận rõ ràng để hạn chế thao tác sai.

### 6. Kiểm thử phần mềm là gì? Nguyên tắc để kiểm thử phần mềm là gì?
- **Kiểm thử phần mềm là gì (Tài liệu dòng 55 – Ảnh 127):**
  - Kiểm thử phần mềm là đánh giá và xác minh phần mềm hoạt động theo yêu cầu, phát hiện lỗi và nâng cao chất lượng phần mềm.
  - *(Quy trình kiểm thử trong Ảnh 130: Phân tích yêu cầu kiểm thử → Lập kế hoạch → Thiết kế ca kiểm thử → Chuẩn bị môi trường → Thực hiện → Báo lỗi → Kiểm thử lại và hồi quy → Tổng kết).*
- **Nguyên tắc để kiểm thử phần mềm (Tài liệu dòng 55–56 – Ảnh 133):**
  1. **Bám sát yêu cầu khách hàng.**
  2. **Lập kế hoạch trước.**
  3. **Đi từ ít đến nhiều** (kiểm thử từ thành phần nhỏ đến toàn hệ thống).
  4. **Kiểm thử trên nhiều khía cạnh.**
  5. **Có người kiểm thử độc lập.**

### 7. Có mấy cách để kiểm thử phần mềm? Đó là những cách nào?
- **Có 3 cách kiểm thử phần mềm (Tài liệu dòng 57–61 – Ảnh 134–137):**
  1. **Kiểm thử hộp trắng (White-box):** Dựa vào cấu trúc và luồng điều khiển bên trong; hướng đến bao phủ nhánh/đường đi.
  2. **Kiểm thử hộp đen (Black-box):** Dựa vào đầu vào, đầu ra và yêu cầu chức năng, không cần biết mã bên trong. Kỹ thuật ví dụ: *phân vùng tương đương, giá trị biên, bảng quyết định*.
  3. **Kiểm thử hộp xám (Gray-box):** Kết hợp hai cách trên; người kiểm thử biết một phần cấu trúc bên trong.

### 8. Bảo trì phần mềm là gì? Bảo trì phần mềm thường được chia thành mấy loại?
- **Bảo trì phần mềm là gì (Tài liệu dòng 63 – Ảnh 138):**
  - Bảo trì là thay đổi phần mềm sau khi bàn giao và đang được sử dụng.
- **Bảo trì phần mềm được chia thành 4 loại (Tài liệu dòng 63–70 – Ảnh 142):**

| Loại bảo trì | Mục đích |
| :--- | :--- |
| **1. Sửa lỗi (Corrective)** | Sửa lỗi phát hiện khi vận hành. |
| **2. Thích nghi (Adaptive)** | Điều chỉnh theo môi trường mới như hệ điều hành, phần cứng, cơ sở dữ liệu. |
| **3. Hoàn thiện (Perfective)** | Cải tiến, tối ưu hoặc bổ sung theo nhu cầu người dùng. |
| **4. Phòng ngừa (Preventive)** | Cải thiện mã và cấu trúc để giảm lỗi trong tương lai. |

---

## Chương 4. Quản lý dự án và rủi ro (Slide 265 – 266 / Ảnh 175 – 176)

*(Đối chiếu nguyên văn Slide 147 – 169 và `bai-giang-cong-nghe-phan-mem.md` dòng 72–78)*

### 1. Thế nào là quản lý dự án? Yếu tố nào đánh giá sự thành công của một dự án?
- **Dự án và Quản lý dự án (Tài liệu dòng 74 – Ảnh 148):**
  - **Dự án:** Có mục tiêu, thời điểm bắt đầu/kết thúc và kinh phí định trước.
  - **Quản lý dự án:** Gồm quy hoạch, tổ chức nhân sự, điều khiển và kiểm tra tiến độ để dự án hoàn thành.
- **Yếu tố đánh giá sự thành công của một dự án (Tài liệu dòng 74, 78 – Ảnh 150–151):**
  - Hoàn thành đúng **thời hạn (tiến độ)** đã định.
  - Nằm trong **kinh phí (ngân sách)** định trước.
  - Đạt **chất lượng** và đáp ứng đúng **mục tiêu / yêu cầu** của khách hàng.

### 2. Yếu tố nào đánh giá sự thành công của dự án và yếu tố nào để đánh giá sự không thành công của một dự án?
- **Yếu tố đánh giá sự thành công của dự án (Tài liệu dòng 78 – Ảnh 150–151):**
  - Yêu cầu rõ ràng.
  - Kế hoạch khả thi.
  - Nhân sự phù hợp.
  - Giao tiếp tốt và kiểm soát chặt chẽ tiến độ, chất lượng, rủi ro (đảm bảo dự án hoàn thành đúng hạn, đúng kinh phí và đạt yêu cầu).
- **Yếu tố đánh giá sự không thành công (thất bại) của dự án (Tài liệu dòng 76, 78 – Ảnh 152, 160):**
  - Dự án bị trễ thời hạn, vượt kinh phí định trước, hoặc không đạt chất lượng/yêu cầu đề ra.
  - Nguyên nhân dẫn đến không thành công: yêu cầu ban đầu chưa đầy đủ, thay đổi không kiểm soát, dự toán sai, phụ thuộc bên ngoài, vấn đề về đội ngũ nhân sự, thiếu theo dõi tiến độ và khó khăn khi kết thúc dự án.

### 3. Các hoạt động chủ yếu của quản lý dự án là gì?
- **3 hoạt động chủ yếu của quản lý dự án (Tài liệu dòng 74–75 – Ảnh 153–157):**
  1. **Lập kế hoạch:** Kế hoạch cần liệt kê **công việc**, **quan hệ phụ thuộc**, **người thực hiện** và **thời hạn** (Ảnh 154).
  2. **Phân công nhiệm vụ (Bố trí nhân sự).**
  3. **Lựa chọn giải pháp.**

### 4. Quản lý rủi ro là gì? Làm thế nào để xác định được rủi ro của một dự án phần mềm?
- **Rủi ro và Quản lý rủi ro là gì (Tài liệu dòng 76 – Ảnh 161–164):**
  - **Rủi ro:** Là biến cố chưa chắc xảy ra nhưng nếu xảy ra sẽ tác động đến dự án.
  - **Quản lý rủi ro:** Là **nhận diện, phân tích, ứng phó và giám sát rủi ro**.
- **Làm thế nào để xác định được rủi ro của một dự án phần mềm (Tài liệu dòng 76 – Ảnh 160):**
  - Rà soát các nhóm rủi ro thường gặp trong dự án phần mềm:
    1. Yêu cầu ban đầu chưa đầy đủ.
    2. Thay đổi yêu cầu không kiểm soát.
    3. Dự toán sai (về thời gian, chi phí).
    4. Phụ thuộc bên ngoài.
    5. Vấn đề về đội ngũ nhân sự.
    6. Theo dõi tiến độ thiếu.
    7. Khó khăn khi kết thúc dự án.

### 5. Nhận diện rủi ro bằng cách nào? Phương pháp nào để phân tích rủi ro của dự án?
- **Nhận diện rủi ro bằng cách nào (Ảnh 160–162):**
  - Dựa vào danh sách các rủi ro điển hình của dự án phần mềm (yêu cầu, dự toán, đội ngũ, phụ thuộc bên ngoài, theo dõi tiến độ), rà soát theo từng công việc trong kế hoạch dự án và kinh nghiệm từ các dự án thực tế.
- **Phương pháp phân tích rủi ro của dự án (Ảnh 163–164):**
  - Đánh giá từng rủi ro dựa trên 2 yếu tố: **Khả năng xảy ra (xác suất)** và **Mức độ tác động (ảnh hưởng)** đến dự án, từ đó xếp hạng mức độ ưu tiên của rủi ro để lập biện pháp phòng ngừa và ứng phó phù hợp.

### 6. Quản lý chất lượng phần mềm là gì? Những yếu tố nào ảnh hưởng đến chất lượng phần mềm?
- **Quản lý chất lượng phần mềm là gì (Slide 259 / Ảnh 169 & Tài liệu dòng 78):**
  - Là các hoạt động lập kế hoạch, đảm bảo và kiểm soát chất lượng trong suốt quá trình phát triển nhằm đảm bảo phần mềm đáp ứng đúng yêu cầu và các tiêu chí chất lượng (tính đúng đắn, độ tin cậy, dễ sử dụng, hiệu năng, bảo mật, khả năng bảo trì).
- **Những yếu tố ảnh hưởng đến chất lượng phần mềm (Tài liệu dòng 78):**
  - Mức độ rõ ràng và đầy đủ của yêu cầu.
  - Kế hoạch dự án và quy trình phát triển (phân tích, thiết kế, lập trình, kiểm thử, bảo trì).
  - Năng lực và sự phối hợp của đội ngũ nhân sự.
  - Giải pháp công nghệ và công tác kiểm soát tiến độ, chất lượng, rủi ro.

### 7. Phương pháp phổ biến trong quản lý dự án, mô hình quản lý dự án phần mềm hiệu quả Agile
- **Mô hình quản lý dự án Agile (Tài liệu dòng 78):**
  - Chia công việc của dự án thành **nhiều vòng lặp ngắn** và **nhận phản hồi thường xuyên** từ khách hàng sau mỗi vòng.
  - Giúp dự án linh hoạt, dễ dàng thích nghi khi yêu cầu thay đổi và sớm bàn giao sản phẩm có giá trị sử dụng.

### 8. Phương pháp phổ biến trong quản lý dự án, mô hình quản lý dự án phần mềm hiệu quả Waterfall (thác nước)
- **Mô hình quản lý dự án Waterfall – Thác nước (Tài liệu dòng 43, 78):**
  - Thực hiện theo **kế hoạch tuần tự** và **kiểm soát chặt chẽ theo từng giai đoạn** (hoàn tất giai đoạn trước rồi mới chuyển sang giai đoạn sau).
  - Dễ lập kế hoạch, quản lý các mốc thời gian và tài liệu; hiệu quả khi yêu cầu của dự án đã rõ ràng và ổn định ngay từ đầu.
