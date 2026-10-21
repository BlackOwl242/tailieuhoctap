# Phương án biên tập văn phong báo cáo

Ngày rà soát: 21/10/2026.

Tài liệu được rà soát: bản Word và PDF hiện hành của báo cáo xây dựng hệ thống quản lý tiếp nhận và giải quyết thủ tục hành chính tại Hà Nội. Bản PDF có 205 trang. Những số trang dưới đây là số trang của tệp PDF, tính cả hai trang bìa.

## 1. Nhận xét chung

Một số đoạn còn giống văn bản được ghép từ mẫu đặc tả và các lần cập nhật. Biểu hiện rõ nhất là câu hậu điều kiện dùng chung cho nhiều nghiệp vụ, phần mô tả API lặp nguyên đoạn, cách gọi tên nặng thuật ngữ và các đoạn nhắc lại phạm vi triển khai. Những dấu hiệu này là vấn đề về cách viết; không đủ để kết luận ai hoặc công cụ nào đã viết tài liệu.

Phần hướng dẫn thao tác ở chương 5 và các đoạn giải thích vai trò nhìn chung có thể giữ. Cần biên tập có chọn lọc, ưu tiên câu thiếu nghĩa cụ thể và các đoạn trùng nội dung. Những tiêu đề cột như “Tác nhân”, “Đầu vào”, “Tiền điều kiện”, “Hậu điều kiện” vẫn cần thống nhất giữa các bảng để người đọc tra cứu.

Phương án đã được thực hiện ngày 21/10/2026. Các số trang và trích đoạn trong tài liệu này ghi nhận bản trước khi biên tập.

## 2. Những phần cần ưu tiên

| Mức | Vị trí | Vấn đề được ghi nhận | Phương án |
| --- | --- | --- | --- |
| 1 | Mục 3.3, các bảng đặc tả use case | 30 ô hậu điều kiện cùng ghi “Kết quả đã xác nhận và nhật ký được lưu cùng giao dịch; thử lại không ghi trùng”. Câu này chưa cho biết kết quả riêng của từng nghiệp vụ. | Viết lại hậu điều kiện cho từng use case. Đưa quy tắc lưu giao dịch, nhật ký và xử lý yêu cầu lặp vào phần quy ước chung. |
| 1 | Mục 6.1, 36 bảng đặc tả API, trang 165–184 | Phần mã lỗi lặp nguyên văn 36 lần; câu “Mã 200; maTuongQuan, duLieu, phienBanMoi; chỉ sau xác nhận đọc hoặc ghi” cũng lặp 36 lần. | Trình bày định dạng phản hồi và ý nghĩa mã lỗi một lần ở đầu mục. Mỗi API nêu dữ liệu trả về và điều kiện lỗi riêng. Giữ những quy tắc cần thiết khi bảng được xuất thành tài liệu độc lập. |
| 1 | Chương 3, các use case chưa được hiện thực đầy đủ | Một số đoạn dùng thì hiện tại như đang mô tả chức năng đã chạy, trong khi bảng đánh giá ở mục 6.5 ghi chưa hỗ trợ hoặc hỗ trợ một phần. | Nêu rõ đây là yêu cầu thiết kế ngay ở đầu mục 3.3; xác định tình trạng triển khai ở đầu từng ca có khác biệt đáng kể. Các bước thiết kế sau đó được trình bày bình thường. |
| 1 | Bảng 3.5 và Bảng 6.4 | Cụm “Không có bước kết thúc không thể đến” dùng hai tầng phủ định, khó hiểu. | Diễn đạt trực tiếp điều kiện của đồ thị quy trình; giữ riêng điều kiện phân quyền. |
| 2 | Mục 1.1, trang 15 | Hai câu đầu cùng giải thích mục đích dự án; phần sau gộp mục tiêu, lịch sử hệ thống và giới hạn khảo sát trong một đoạn dài. | Rút phần mục đích thành một đoạn; chuyển lịch sử và nguồn khảo sát thành đoạn tiếp theo. |
| 2 | Lời cảm ơn | Có đoạn trình bày 36 use case, hai thủ tục đã cấu hình và giới hạn đánh giá. Đây là nội dung của phần mở đầu hoặc kết quả triển khai. | Giữ lời cảm ơn ngắn, cụ thể; chuyển thông tin kỹ thuật sang chương 1 hoặc chương 6. |
| 2 | Mục 1.2, chương 5, mục 6.3–6.4 và kết luận | Phạm vi 2.075 mục tham chiếu, hai thủ tục được mở và các kết nối còn thiếu được nhắc lại ở nhiều nơi. Một số lần nhắc chưa bổ sung thông tin cho phần đang đọc. | Trình bày phạm vi tổng quát ở mục 1.2, chi tiết giới hạn ở mục 6.4. Chương 5 chỉ giải thích giới hạn gắn với thủ tục đang hướng dẫn; kết luận tóm tắt ngắn. |
| 2 | Mục 5.5, trang 164 | Câu “không sửa dữ liệu gốc để tạo cảm giác đã đồng bộ trực tiếp” giống lời giải thích về quá trình sửa tài liệu và suy đoán động cơ. | Chỉ nêu chênh lệch, nguồn được giữ và tình trạng chưa xác minh lại. |
| 2 | Mục 6.3, trang 186 | Cách viết “mã đã có cấu hình”, “quy trình đã chốt”, “mốc đang theo dõi” chưa chỉ rõ đối tượng. | Gọi đúng đối tượng: mã thủ tục, cấu hình được lưu trong hồ sơ, mốc kiểm tra yêu cầu hoặc hạn giải quyết. |
| 2 | Mục 7.2, trang 194 | “Các kiểm tra bổ sung sau chỉnh sửa cuối cũng đạt” là câu cập nhật công việc, thiếu số lượng và phạm vi. | Chỉ giữ kết quả có thể truy về bằng chứng kiểm tra; chuyển diễn biến các lần sửa sang nhật ký thay đổi nếu cần. |
| 2 | Bảng 7.1, trang 193 | Các cụm “Chốt phạm vi”, “Nghiệp vụ phê duyệt cấu hình”, “Kiểm thử bất biến” quá nén, có chỗ thiếu chủ thể. | Viết thành công việc và điều kiện hoàn thành có thể hiểu độc lập. |
| 3 | Tên bảng, mục và thuật ngữ trong phần diễn giải | Các cách gọi “Bốn phạm vi không được đếm lẫn”, “Hợp đồng thao tác”, “quan hệ đầy đủ” có thể làm báo cáo nặng thuật ngữ hoặc giống lời nhắc của người biên tập. | Đặt tên theo nội dung; giải thích thuật ngữ kỹ thuật ở lần xuất hiện đầu. |

## 3. Các ví dụ sửa cụ thể

### 3.1. Rút phần giới thiệu bị lặp ý

Vị trí: mục 1.1, trang PDF 15.

Đoạn hiện tại mở đầu bằng tên đầy đủ của đề tài và câu “phát triển ứng dụng phục vụ việc tiếp nhận, xử lý và theo dõi hồ sơ theo từng cơ quan”, sau đó tiếp tục giải thích lại mục đích qua người dân, cán bộ và lãnh đạo.

Đề xuất:

> Đề tài xây dựng ứng dụng quản lý hồ sơ hành chính theo cơ chế một cửa tại Hà Nội. Người dân có thể nộp và theo dõi hồ sơ; cán bộ tiếp nhận, phân công, thụ lý, phê duyệt và trả kết quả theo trách nhiệm được giao. Lãnh đạo theo dõi tiến độ và thời hạn giải quyết của cơ quan.

Đoạn lịch sử hệ thống từ năm 2023 và việc chuyển cửa truy cập năm 2025 được giữ thành đoạn riêng, kèm các dẫn nguồn hiện có. Tên đề tài trên bìa giữ nguyên.

### 3.2. Viết hậu điều kiện theo kết quả nghiệp vụ

Vị trí: mục 3.3; ví dụ UC01 ở trang 32 và UC05 ở trang 40.

Hiện tại, 30 ca dùng chung:

> Kết quả đã xác nhận và nhật ký được lưu cùng giao dịch; thử lại không ghi trùng.

Ví dụ thay thế theo từng ca:

- **UC01 Quản lý tài khoản:** “Quyền đã được phê duyệt được áp dụng theo thời hạn; hệ thống lưu người phê duyệt và lịch sử thay đổi.”
- **UC05 Chuẩn bị và gửi hồ sơ:** “Hồ sơ được lưu ở trạng thái chờ tiếp nhận, kèm tờ khai, tài liệu và mã hồ sơ để người nộp theo dõi.”
- **UC18 Giao và xác nhận kết quả:** “Hệ thống lưu người nhận, thời điểm, phương thức và chứng cứ giao. Nếu chưa giao được, hồ sơ lưu lý do để tiếp tục theo dõi.”

Quy tắc không ghi trùng và việc lưu cùng giao dịch vẫn được giữ trong phần quy ước chung. Khi sửa chính thức phải đối chiếu trạng thái và nhánh ngoại lệ của từng ca, không thay cả 30 ô bằng một mẫu mới.

### 3.3. Bỏ hai tầng phủ định

Vị trí: Bảng 3.5 và Bảng 6.4.

Hiện tại:

> Không có bước kết thúc không thể đến hoặc chuyển bước trái quyền.

Đề xuất:

> Các nhánh quy trình phải có đường đi đến bước kết thúc. Mỗi thao tác chuyển bước phải đáp ứng quyền được quy định.

Cần đối chiếu lại mô hình để xác định yêu cầu có bao gồm mọi nhánh đang hoạt động hay mọi nút trong bản thiết kế. Không dùng sửa văn phong để tự bổ sung quy tắc chưa có trong mô hình.

### 3.4. Sửa cụm gây nhầm giữa “trình duyệt” và “trình phê duyệt”

Vị trí: UC04, mục 3.3.

Hiện tại:

> Bản cấu hình được kiểm tra đường đi và trình duyệt trước khi áp dụng, trong khi khoản thu và giao nhận vẫn được theo dõi riêng.

Đề xuất:

> Theo thiết kế, cấu hình phải được kiểm tra các đường chuyển trạng thái và phê duyệt trước khi áp dụng. Khoản thu và giao nhận có trạng thái theo dõi riêng.

Từ “Theo thiết kế” làm rõ phạm vi của chức năng; “phê duyệt” tránh nhầm với trình duyệt web. Cần thống nhất với luồng trình và duyệt trong mô hình.

### 3.5. Làm rõ tình trạng của thiết kế quy trình trực quan

Vị trí: UC09, trang 49 và bảng đánh giá tại mục 6.5.

Hiện tại:

> Bản quy trình được thiết kế bằng các bước, điều kiện và mối liên hệ giữa chúng. Hệ thống kiểm tra cấu trúc trước khi trình duyệt, đặc biệt với các nhánh song song cần có quy tắc tổng hợp kết quả.

Đề xuất:

> Chức năng đề xuất cho phép tạo các bước xử lý và điều kiện chuyển bước. Trước khi phê duyệt, bản quy trình phải được kiểm tra cấu trúc, gồm cả cách tổng hợp kết quả của các nhánh song song. Ứng dụng hiện chưa có màn hình thiết kế quy trình trực quan.

Thông tin tình trạng này đặt một lần trong đặc tả UC09; các bước còn lại mô tả yêu cầu thiết kế.

### 3.6. Viết rõ chủ thể thực hiện

Vị trí: mục 5.3, trang 163.

Hiện tại:

> Cán bộ chuyên viên phải ghi kết quả đối chiếu, tham chiếu sổ và căn cứ kiểm tra trước khi trình.

Đề xuất:

> Trước khi trình duyệt, chuyên viên ghi kết quả đối chiếu, số sổ hoặc bản ghi đã kiểm tra và căn cứ xác định quyền yêu cầu.

Hiện tại:

> Luồng không mở khoản thu hành chính; chi phí bưu chính được xem xét riêng.

Đề xuất:

> Hệ thống không cho lập khoản thu hành chính đối với thủ tục này. Chi phí bưu chính, nếu có, được xử lý riêng.

Câu này mô tả cách triển khai của ứng dụng. Căn cứ pháp lý về khoản thu tiếp tục được trình bày ở phần thông tin thủ tục.

### 3.7. Viết phần đối chiếu nguồn theo kết quả quan sát

Vị trí: mục 5.5, trang 164.

Hiện tại:

> Báo cáo giữ dấu vết khác biệt, không sửa dữ liệu gốc để tạo cảm giác đã đồng bộ trực tiếp.

Đề xuất:

> Chênh lệch được ghi trong biên bản đối chiếu. Bản nguồn được giữ nguyên vì chưa lấy lại được bản công bố để xác minh.

Giữ thông tin ngày đối chiếu, nguồn đã lưu và cách sử dụng kết quả tìm kiếm. Bỏ cách diễn đạt về “tạo cảm giác”.

### 3.8. Rút cách mô tả phản hồi API

Vị trí: 36 bảng tại mục 6.1, trang 165–184.

Hiện tại:

> Mã 200; maTuongQuan, duLieu, phienBanMoi; chỉ sau xác nhận đọc hoặc ghi.

Đề xuất tổ chức:

1. Đầu mục 6.1 giải thích cấu trúc phản hồi, ý nghĩa mã tương quan, phiên bản và quy tắc gửi lại yêu cầu.
2. Các mã lỗi chung được giải thích trong một bảng dùng chung. Những mã chỉ áp dụng cho một số thao tác phải được ghi rõ.
3. Dòng “Thành công” của từng thao tác mô tả kết quả cụ thể, ví dụ với tiếp nhận: “Hồ sơ chuyển sang trạng thái đã tiếp nhận; phản hồi trả phiên bản mới và thông tin giấy hẹn.”
4. Giữ nguyên tên trường, đường dẫn và mã trạng thái trong phần đặc tả. Đối chiếu hợp đồng trước khi thay câu diễn giải; không tự thêm mã 201, trường mới hoặc khả năng chưa được thiết kế.

Mục 6.1 cần tiếp tục ghi rõ đây là đặc tả tham chiếu. API thực tế của ứng dụng được nhận diện riêng như bản báo cáo hiện hành.

### 3.9. Giải thích cấu hình được lưu trong hồ sơ

Vị trí: mục 6.3, trang 186.

Hiện tại có các cụm:

> bản chụp cấu hình quy trình trong trường workflow
>
> mã đã có cấu hình phải đáp ứng điều kiện kiểm tra trước khi tiếp tục

Đề xuất cho phần diễn giải:

> Khi tạo hồ sơ, hệ thống lưu một bản cấu hình quy trình áp dụng cho hồ sơ đó. Việc cập nhật cấu hình dùng cho các hồ sơ mới không làm thay đổi cấu hình đã lưu. Với hồ sơ cũ chưa có cấu hình, hệ thống kiểm tra mã thủ tục và các điều kiện xử lý trước khi cho tiếp tục.

Tên trường `workflow`, phiên bản cấu hình và cách xử lý từng nhóm hồ sơ cũ được giữ ở phần kỹ thuật ngay sau đoạn giải thích. Giữ đầy đủ điều kiện chặn xử lý đối với thủ tục chưa được hỗ trợ.

### 3.10. Sửa cách ghi kết quả kiểm tra

Vị trí: mục 7.2, trang 194.

Hiện tại:

> Các kiểm tra bổ sung sau chỉnh sửa cuối cũng đạt; TypeScript và bản dựng Vite đã hoàn thành.

Đề xuất:

> Kiểm tra TypeScript và quá trình tạo bản dựng giao diện bằng Vite hoàn thành không có lỗi.

Kết quả 46 bài hồi quy được giữ trong câu trước, kèm ngày và môi trường. Nếu muốn giữ thông tin về các lượt kiểm tra bổ sung, phải trỏ đến danh sách bài và kết quả đã ghi nhận; tránh câu “cũng đạt” không xác định phạm vi.

### 3.11. Viết điều kiện hoàn thành bằng câu đầy đủ

Vị trí: Bảng 7.1, trang 193.

| Cách viết hiện tại | Đề xuất |
| --- | --- |
| Chốt phạm vi, phiên bản nguồn, vai trò và dữ liệu được phép | Xác định phạm vi triển khai, nguồn áp dụng, vai trò và dữ liệu được sử dụng. |
| Nghiệp vụ phê duyệt cấu hình | Cấu hình đã được người phụ trách nghiệp vụ phê duyệt. |
| Kiểm thử bất biến và phục hồi dữ liệu đạt | Các kiểm tra về quy tắc bắt buộc và khôi phục dữ liệu đã đạt yêu cầu. |

Trong phần kỹ thuật, “bất biến” vẫn có thể được dùng sau khi giải thích đó là những ràng buộc phải luôn được giữ, ví dụ phạm vi truy cập hoặc tính toàn vẹn dữ liệu.

### 3.12. Sửa các tên mục chưa tự nhiên

| Vị trí | Tên hiện tại | Tên đề xuất |
| --- | --- | --- |
| Bảng 1.2 | Bốn phạm vi không được đếm lẫn | Phạm vi của nhóm chức năng, use case và danh mục thủ tục |
| Mục 4.2 | Lớp miền và quan hệ đầy đủ | Mô hình lớp và quan hệ dữ liệu |
| Mục 5.1 | Thư viện 2.075 hồ sơ thủ tục | Danh mục 2.075 thủ tục và hướng dẫn tra cứu |
| Chương 6 | Đặc tả chuyển sang lập trình | Đặc tả kỹ thuật và kết quả triển khai |
| Mục 6.1 | Hợp đồng thao tác và dữ liệu | Đặc tả API và dữ liệu trao đổi |

“Hồ sơ thủ tục” trong tên mục 5.1 dễ bị hiểu là hồ sơ do người dân nộp. Nội dung phần này là danh mục tham chiếu và hướng dẫn, nên dùng đúng tên đối tượng. “Hợp đồng giao tiếp” là thuật ngữ kỹ thuật có thể giữ khi được giải thích ở đầu mục.

## 4. Cách xử lý các nội dung được nhắc lại

| Nội dung | Nơi trình bày đầy đủ | Cách dùng ở các phần khác |
| --- | --- | --- |
| Mục đích dự án | Mở đầu chương 1 | Kết luận tập trung vào kết quả đã thực hiện. |
| Danh mục 2.075 dòng và hai thủ tục mở tiếp nhận | Mục 1.2 | Chương 5 ghi thông tin từng thủ tục; mục 6.4 dẫn lại phạm vi khi đánh giá kết quả. |
| Kết nối với hệ thống ngoài còn thiếu | Mục 6.4 | Chỉ nhắc tại use case hoặc hướng dẫn khi ảnh hưởng trực tiếp đến thao tác đang mô tả. |
| Quy tắc phiên bản, nhật ký, giao dịch và gửi lại yêu cầu | Quy ước chung của đặc tả và mục 6.2–6.3 | Mỗi use case giữ hậu điều kiện riêng và ngoại lệ đặc thù. |
| Ngày cập nhật, lần dựng giao diện, kiểm tra sau sửa | Bằng chứng kiểm tra hoặc phụ lục thay đổi | Phần kết quả giữ số liệu đã xác nhận, ngày và môi trường cần thiết. |

Không xóa mọi lần nhắc lại. Cần giữ lời giải thích tại nơi người đọc có thể hiểu sai thẩm quyền, thời hạn, khoản thu, giá trị kết quả hoặc tình trạng triển khai.

## 5. Trình tự biên tập đề xuất

1. **Sửa câu khó hiểu và sai đối tượng.** Ưu tiên hai tầng phủ định, “trình duyệt”, “mã đã có cấu hình”, “luồng không mở” và các câu cập nhật công việc không rõ phạm vi.
2. **Viết lại hậu điều kiện của các use case.** Xác định dữ liệu, trạng thái hoặc quyền thay đổi sau mỗi nghiệp vụ. Phần thiết kế và phần đã hiện thực phải được nhận diện rõ.
3. **Rút các quy ước API dùng chung.** Giữ 36 bảng để truy vết, nhưng tránh chép nguyên nội dung chung vào mọi bảng trong bản báo cáo liên tục. Tài liệu API độc lập có thể tiếp tục nhắc lại quy ước cần thiết.
4. **Biên tập phần mở đầu, giới hạn và kết luận.** Bỏ câu lặp mục tiêu; dồn giải thích phạm vi về đúng mục; kết luận nêu kết quả và việc còn phải làm.
5. **Thống nhất tên mục và thuật ngữ.** Dùng “use case (use case)” ở lần đầu, sau đó thống nhất; giữ nguyên mã UC, tên API, trường dữ liệu và tên thủ tục chính thức.
6. **Đồng bộ các bản tài liệu.** Sửa bản thảo Markdown và nội dung nguồn tạo báo cáo tương ứng, cập nhật Word, mục lục và danh mục, rồi xuất PDF từ Word đã lưu.
7. **Kiểm tra sau biên tập.** So sánh mã thủ tục, con số, dẫn nguồn, tên vai trò và điều kiện nghiệp vụ; rà ảnh, bảng và ngắt trang sau khi nội dung được rút gọn.

## 6. Các nguyên tắc giữ nguyên

- Giữ tên chính thức của đề tài, học phần, cơ quan, thủ tục và văn bản được trích dẫn.
- Giữ những thuật ngữ nghiệp vụ cần thiết như thụ lý, thẩm quyền, căn cứ, phê duyệt, đối soát và phiên bản; sửa cách dùng khi thiếu đối tượng hoặc lặp thừa.
- Giữ mã thủ tục, số lượng đã được xác nhận, ngày đối chiếu và số nguồn; chỉnh văn phong không thay thế việc kiểm tra dữ liệu.
- Giữ các điều kiện bảo vệ dữ liệu, giới hạn quyền, thời hạn, nghĩa vụ tài chính và sự khác nhau giữa thiết kế với chức năng đã chạy.
- Giữ nguyên ảnh giao diện và ảnh nguồn. Các chú thích do tác giả viết được biên tập, còn nội dung trích nguyên văn phải giữ dấu hiệu trích dẫn và nguồn.
- Không thay hàng loạt từ “cần”, “được”, “chưa” hoặc “căn cứ”. Mỗi câu được xét theo ý nghĩa và ngữ cảnh.

Kết quả mong muốn là báo cáo rõ ý, bớt lặp và có giọng văn học thuật tự nhiên. Không dùng điểm số hoặc tỷ lệ “AI” làm tiêu chí hoàn thành.
