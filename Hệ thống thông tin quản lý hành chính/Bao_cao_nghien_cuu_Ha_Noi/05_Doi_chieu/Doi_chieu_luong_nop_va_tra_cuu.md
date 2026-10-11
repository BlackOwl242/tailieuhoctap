# Đối chiếu luồng nộp và tra cứu hồ sơ

## Những sai lệch đã sửa

| Nội dung | Cách xử lý trong ứng dụng |
|---|---|
| Mở trang nộp có mã thủ tục | Hiển thị bước xác nhận thủ tục và cơ quan. Chưa tạo hồ sơ; chỉ lưu sau bước kiểm tra cuối cùng. |
| Một biểu mẫu chung cho mọi thủ tục | Dùng cấu hình tờ khai có phiên bản, trường bắt buộc và điều kiện theo đối tượng. Máy chủ kiểm tra lại toàn bộ khi gửi. |
| Giấy tờ không phân loại | Tải tệp theo từng thành phần; kiểm tra thành phần bắt buộc theo trường hợp. |
| Tra cứu suy ra mọi bước trước đã hoàn tất | Tiến độ dựa trên sự kiện đã lưu. Yêu cầu bổ sung tạm dừng đúng khâu; từ chối và dừng không đánh dấu các khâu sau hoàn tất. |
| Người dân không nhìn thấy khâu nội bộ đang xử lý | Công khai mốc chuyển thụ lý, trình duyệt, chuyển lại thụ lý và phê duyệt; không công khai dự thảo, ý kiến duyệt hoặc thông tin nội bộ. |
| Mức dịch vụ bị ghi mơ hồ | Phân biệt trực tuyến toàn trình, trực tuyến một phần và cung cấp thông tin. Có bộ lọc theo mức trong danh mục. |

## Thủ tục 1.004237

- Thẩm quyền theo văn bản Hà Nội: Sở Nông nghiệp và Môi trường; mức dịch vụ toàn trình.
- Phiếu Mẫu 02 dùng cho tổ chức, cá nhân trong nước; Mẫu 03 dùng cho cá nhân nước ngoài tại Việt Nam. Đây là hai phương án theo đối tượng, không yêu cầu cùng lúc cả hai mẫu.
- Tờ khai ghi địa chỉ, thông tin nhận dạng theo đối tượng, nội dung dữ liệu yêu cầu, mục đích, hình thức khai thác và cam kết. Trường hợp nước ngoài thêm quốc tịch, hộ chiếu và nơi làm việc hoặc học tập. Trường hợp tổ chức khai người ký, đại diện.
- Phiếu đính kèm phải có chữ ký hoặc xác nhận tương ứng. Kiểm tra tệp của ứng dụng chỉ xác nhận định dạng và thành phần; tính hợp lệ của chữ ký, dấu phải được cơ quan kiểm tra.
- 05 ngày làm việc áp dụng cho kiểm tra yêu cầu và thông báo nghĩa vụ tài chính nếu có. Không dùng mốc này như hạn trả mọi loại dữ liệu. Không ghi mặc định phí bằng 0 hoặc đánh dấu đã thanh toán.

Nguồn: [Quyết định 2273 của Hà Nội](https://datafiles.hanoi.gov.vn/gov-hni/6244/VanBan/2026/1/5/QDPVHCC-2273-2025.pdf), [chi tiết thủ tục trên Cổng quốc gia](https://dichvucong.gov.vn/p/home/dvc-tthc-thu-tuc-hanh-chinh-chi-tiet.html?ma_thu_tuc=6022), [mẫu phiếu trong Nghị định 73/2017/NĐ-CP](https://congbaocdn.chinhphu.vn/CongBaoCP/VanBan/2017/6/24031/18088-1-2017469-47073-2017-nd-cp.pdf), [sửa đổi trong Nghị định 22/2023/NĐ-CP](https://vbpl.vn/boquocphong/Pages/vbpq-toanvan.aspx?ItemID=166741&Keyword=).

## Thủ tục 2.000908

- Cơ quan tiếp nhận phải là cơ quan quản lý sổ gốc. Tuyến cụ thể đã có trong dữ liệu ứng dụng là UBND phường Tây Hồ; không tự áp dụng tuyến này cho các địa bàn khác.
- Khai tên người/tổ chức được cấp bản chính, giấy tờ đề nghị sao, số bản sao, tư cách yêu cầu và thông tin giúp tra sổ.
- Giấy tờ nhận dạng và giấy tờ chứng minh đại diện/quan hệ được yêu cầu theo trường hợp. Cổng thật có cơ chế khai thác dữ liệu để miễn nộp; ứng dụng chưa có kết nối đó nên không tự xác nhận đã khai thác dữ liệu hoặc tự miễn.
- Hạn trong ngày nhận đủ hồ sơ hợp lệ; sau 15 giờ chuyển sang ngày làm việc tiếp theo. Đúng 15 giờ chưa thuộc trường hợp “sau 15 giờ”.

Nguồn: [chi tiết thủ tục và Quyết định 858/QĐ-BTP trên Cổng quốc gia](https://dichvucong.gov.vn/p/home/dvc-tthc-thu-tuc-hanh-chinh-chi-tiet.html?ma_thu_tuc=2989&open_popup=1).

## Mức dịch vụ và phạm vi đã thực hiện

Danh mục theo Quyết định 492/QĐ-TTPVHCC gồm 1.120 thủ tục toàn trình, 921 thủ tục một phần và 34 thủ tục cung cấp thông tin. Đây là số liệu của văn bản công bố, không phải số thủ tục đã có biểu mẫu tiếp nhận trong ứng dụng. Hiện hai thủ tục ở trên có cấu hình tờ khai. Các thủ tục còn lại tiếp tục tra cứu được; việc nộp bị chặn khi chưa có tờ khai và thành phần hồ sơ phù hợp.

Nguồn: [Quyết định 492 của Hà Nội](https://vanban.hanoi.gov.vn/chi-tiet-van-ban/ve-viec-cong-bo-danh-muc-thu-tuc-hanh-chinh-thuc-hien-truc-tuyen-toan-trinh-truc-tuyen-mot-phan-cun-239862), [công bố số lượng theo ba nhóm](https://odien.hanoi.gov.vn/cai-cach-hanh-chinh-chuyen-doi-so/ha-noi-cong-bo-danh-muc-2075-thu-tuc-hanh-chinh-cung-cap-truc-tuyen-2839260420115150251.htm).

Chưa có căn cứ xác nhận tương đồng 100% với hệ thống tác nghiệp thật. Ứng dụng chưa kết nối VNeID, kho dữ liệu chuyên ngành, thanh toán, ký số và đồng bộ hồ sơ. Việc dùng mã/khóa tra cứu thay tài khoản người dân là cách hoạt động của ứng dụng hiện tại. Cổng chính thức sử dụng VNeID khi công dân thực hiện dịch vụ công trực tuyến; đây là khác biệt cần giữ rõ, không thể gọi là tương đồng 100%. Nguồn: [hướng dẫn về VNeID của Chính phủ](https://baochinhphu.vn/tu-1-7-chi-su-dung-duy-nhat-tai-khoan-vneid-khi-thuc-hien-dich-vu-cong-truc-tuyen-102240503133408329.htm). Quy trình thụ lý nội bộ cần cấu hình riêng theo quy trình điện tử được phê duyệt của từng thủ tục; các khâu đang hiển thị không chứng minh mọi thủ tục của cơ quan đều có cùng tuyến phê duyệt.

## Kiểm tra

21 bài kiểm tra tự động đã chạy đạt trên dữ liệu tạm, gồm API, phân quyền, thao tác hồ sơ, tờ khai, giấy tờ, phân loại dịch vụ, hạn giải quyết, tiến độ theo sự kiện, tài khoản và khóa tra cứu mã hóa. TypeScript, lint và bản dựng frontend chạy thành công. Trình duyệt đã kiểm tra luồng chọn cơ quan, khai người nộp, chuyển trường trong nước/nước ngoài và chặn thiếu Mẫu 03. Kết quả này kiểm tra ứng dụng hiện có, không phải nghiệm thu toàn bộ thủ tục hoặc hạ tầng của cơ quan nhà nước.

## Bổ sung thông tin người nộp và ký hiệu trường cần điền

Nhãn trường cần điền và thành phần cần đính kèm dùng dấu sao đỏ ngay cuối nhãn. Không dùng dòng chữ “bắt buộc” riêng dưới nhãn.

Nhóm liên hệ yêu cầu ít nhất một trong hai giá trị điện thoại hoặc email, nên dấu sao đặt ở nhãn nhóm “Số điện thoại hoặc email”, không đánh dấu cả hai ô là bắt buộc. Ô xác nhận kiểm tra hồ sơ ở bước cuối cũng có dấu sao. Máy chủ vẫn kiểm tra các điều kiện này khi gửi.

| Nguồn công khai | Thông tin đã đưa vào biểu mẫu 1.004237 | Phần không thể xác nhận chỉ từ nguồn công khai |
|---|---|---|
| Mẫu 02 của Nghị định 73/2017/NĐ-CP | Cơ quan nhận; tên và địa chỉ người yêu cầu; giấy tờ nhận dạng của cá nhân; điện thoại, fax, email; danh mục dữ liệu; mục đích; hình thức khai thác và nhận dữ liệu; cam kết; tệp phiếu có chữ ký. | Bố cục và điều kiện từng ô nhập sau khi đăng nhập Cổng quốc gia. |
| Mẫu 03 của cùng nghị định | Nơi làm việc hoặc học tập; quốc tịch, hộ chiếu; thông tin liên hệ; nội dung yêu cầu và phiếu có xác nhận của nơi làm việc hoặc học tập. | Việc cổng tự điền hoặc xác thực các giá trị từ VNeID và cơ sở dữ liệu chuyên ngành. |
| Hướng dẫn nộp trực tuyến công khai của Hà Nội | Tách người yêu cầu khỏi người thực hiện nộp thay; khai giấy tờ và liên hệ của người nộp thay khi chọn ủy quyền. | Số lượng và tên chính xác của mọi trường ở màn hình tác nghiệp riêng của thủ tục này. |

Số trường của từng thủ tục không giống nhau. Không nhân thêm trường bắt buộc từ biểu mẫu của thủ tục khác để tạo cảm giác đầy đủ; mọi yêu cầu cần có căn cứ từ mẫu phiếu hoặc quy trình công bố của chính thủ tục đó. Biểu mẫu hiện tại chưa thể được xác nhận là trùng 100% với giao diện sau đăng nhập của Cổng quốc gia.

Hướng dẫn nộp hồ sơ của Hà Nội phân biệt chủ yêu cầu và người thực hiện việc nộp khi được ủy quyền. Với thủ tục 1.004237, ứng dụng đã thêm lựa chọn tự nộp hoặc nộp thay; trường hợp nộp thay khai riêng họ tên, giấy tờ nhận dạng, ngày/nơi cấp nếu có, địa chỉ, điện thoại và email. Máy chủ kiểm tra trường theo trường hợp; các trường nộp thay không được lưu khi chọn tự nộp. Văn bản ủy quyền được đính kèm bổ sung nếu có, không tự đặt thành phần này là điều kiện pháp lý bắt buộc cho mọi yêu cầu. Đây là cách triển khai của ứng dụng dựa trên hướng dẫn công khai; chưa đối chiếu từng trường trên màn hình sau đăng nhập của riêng thủ tục 1.004237.

Nguồn đối chiếu giao diện: [Hướng dẫn của Hà Nội](https://taymo.hanoi.gov.vn/tin-tuc-su-kien/huong-dan-cong-dan-nop-ho-so-truc-tuyen-tren-cong-dich-vu-cong-quoc-gia-2696260522101136046.htm), [hướng dẫn của xã Tam Hưng](https://tamhung.hanoi.gov.vn/cai-cach-hanh-chinh/huong-dan-nop-ho-so-thu-tuc-hanh-chinh-tren-he-thong-thong-tin-giai-quyet-tthc-tp-ha-noi-2682250629062914313.htm). Hướng dẫn của Bộ Nông nghiệp và Môi trường có các trường họ tên, CCCD/hộ chiếu, ngày/nơi cấp, điện thoại, email, fax, địa chỉ; tờ khai và giấy tờ thay đổi theo thủ tục. Không áp dụng biểu mẫu chứng nhận Nhãn sinh thái trong hướng dẫn này cho thủ tục khai thác dữ liệu. [Tài liệu hướng dẫn của Bộ](https://dichvucong.mae.gov.vn/_layouts/15/wordTmp/HuongDanSuDung/HuongDanNopHoSo.pdf).

## Trang thông tin và quản lý khóa tra cứu

Trang chủ ưu tiên banner, tin nổi bật, chuyên mục và tiện ích theo bố cục trang Trung tâm. Tin công khai được đọc từ bảng `news_articles`; dữ liệu khởi tạo giữ các bài đã biên tập và nguồn công khai trước đó. Quản trị viên hệ thống dùng mục **Tin tức cổng thông tin** trong bàn cán bộ để tạo bản nháp, sửa, gắn chuyên mục/ảnh/nguồn chính thức, đánh dấu nổi bật, xuất bản, lưu trữ hoặc khôi phục. Hệ thống ghi nhật ký thao tác và kiểm tra phiên bản khi lưu; người dùng không có quyền quản trị không thể đọc hoặc thay đổi CMS. Cổng công dân chỉ nhận bản đã xuất bản. Chưa có đồng bộ tin mới tự động và chưa có quy trình duyệt nội dung thứ hai; quản trị viên chịu trách nhiệm rà soát nguồn trước khi xuất bản. Các chức năng nộp, tra cứu thủ tục, tra cứu hồ sơ và hướng dẫn mở trong ứng dụng. Các nút hành động chính dùng chung màu xanh đậm, hành động phụ dùng nền trắng và viền xanh.

Theo yêu cầu vận hành hiện tại, không triển khai SMS/email. Trang xác nhận gửi chỉ hiển thị mã hồ sơ. Máy chủ tự tạo khóa tra cứu, lưu riêng bằng mã hóa Fernet và lưu mã băm để kiểm tra. Khóa chỉ được mở qua API có phiên đăng nhập, CSRF và phạm vi hồ sơ của cán bộ tiếp nhận hoặc trả kết quả. Không đưa khóa vào danh sách hồ sơ, xuất dữ liệu hay nhật ký. Cấp lại tăng phiên bản hồ sơ và vô hiệu hóa khóa cũ. Khóa mã hóa phải được sao lưu và bảo vệ riêng; mất khóa mã hóa thì không khôi phục được các khóa đã lưu. Cách giao khóa thủ công là quy ước của ứng dụng được người dùng yêu cầu, không phải khẳng định đây là cơ chế của cổng chính thức.
