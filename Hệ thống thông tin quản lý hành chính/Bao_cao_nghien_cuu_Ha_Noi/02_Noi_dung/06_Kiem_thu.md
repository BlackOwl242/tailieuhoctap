# VI. KIỂM THỬ VÀ ĐÁNH GIÁ

## 6.1. Mục tiêu và phạm vi kiểm thử

Kiểm thử nhằm chứng minh thiết kế được triển khai đúng quy trình đã phê duyệt và không làm sai quyền, thời hạn, dữ liệu hoặc chứng từ. Bộ kịch bản trong chương này là kế hoạch kiểm thử dành cho giai đoạn phát triển tiếp theo. Chưa có phần mềm hoặc môi trường được cấp để thực thi, nên trạng thái của các ca là chưa thực hiện. Báo cáo không ghi tỷ lệ đạt, thời gian đo hoặc số lỗi đã sửa như kết quả thực nghiệm.

Phạm vi gồm yêu cầu chức năng YC01 đến YC14 và chỉ tiêu phi chức năng PC01 đến PC08. Thử tích hợp phải kiểm tra cả thành công, thất bại, thông báo trùng và phản hồi đến muộn. Thử nghiệp vụ tập trung hồ sơ của thủ tục chuyên sâu tại đúng cơ quan giải quyết. Dữ liệu, chứng thư và thanh toán đều sử dụng môi trường thử được phép.

Bảng 6.1: Các mức kiểm thử và trách nhiệm

| Mức | Mục đích | Người thực hiện |
| --- | --- | --- |
| Thành phần | Quy tắc hạn, chuyển bước và kiểm tra dữ liệu | Đơn vị phát triển |
| Tích hợp | Giao tiếp, chữ ký, lỗi và thử lại | Các đơn vị kỹ thuật liên quan |
| Hệ thống | Luồng hoàn chỉnh và quyền giữa vai trò | Nhóm kiểm thử |
| Nghiệp vụ | Chứng từ, thẩm quyền và cách xử lý ngoại lệ | Cán bộ đơn vị sử dụng |
| An toàn | Truy cập sai quyền, phiên, đầu vào và tệp | Nhóm được giao kiểm tra an toàn |
| Phục hồi | Khôi phục dữ liệu và hoạt động | Vận hành phối hợp nghiệp vụ |

## 6.2. Chuẩn bị dữ liệu và điều kiện thử

Bộ dữ liệu phải phản ánh sự khác nhau giữa người yêu cầu và chủ thể hộ tịch, hồ sơ có và không có ủy quyền, dữ liệu đối chiếu đủ và thiếu. Không sử dụng giấy tờ thật của người dân chỉ vì cần hình ảnh giống thực tế. Dữ liệu giả lập có nhãn trong môi trường thử, nhưng nhãn đó không đi vào chứng từ vận hành.

Bảng 6.2: Bộ dữ liệu kiểm thử đề xuất

| Bộ | Thành phần | Mục đích |
| --- | --- | --- |
| DL01 | Hồ sơ tự yêu cầu, dữ liệu hộ tịch khớp | Luồng thuận lợi |
| DL02 | Đại diện có văn bản hợp lệ | Kiểm tra quan hệ và giao kết quả |
| DL03 | Đại diện thiếu căn cứ | Chặn thao tác không đủ quyền |
| DL04 | Thiếu trường hoặc thành phần áp dụng | Yêu cầu bổ sung có căn cứ |
| DL05 | Dữ liệu hộ tịch không tìm thấy hoặc mâu thuẫn | Nhánh kiểm tra chuyên môn |
| DL06 | Nhận trước, đúng và sau 15 giờ; ngày nghỉ | Ranh giới tính hạn |
| DL07 | Thông báo thu trùng, sai tiền và đến muộn | Tài chính và xử lý lặp |
| DL08 | Ký sai, chứng thư hết hạn và bản bị sửa | Phát hành và kiểm tra tính toàn vẹn |
| DL09 | Mất kết nối và đích nhận đã xử lý | Đồng bộ và thử lại |
| DL10 | Hai cán bộ cập nhật cùng hồ sơ | Kiểm soát đồng thời |

Trước mỗi đợt thử cần ghi phiên bản ứng dụng, danh mục thủ tục, lịch làm việc, quyền và các thành phần phụ thuộc. Mỗi ca có điều kiện ban đầu và cách đưa hệ thống về trạng thái đó. Nếu ca phụ thuộc một ca trước, phải ghi quan hệ; không để người thực hiện tự suy ra từ thứ tự bảng. Sau thử, dữ liệu phát sinh được dọn theo quy trình bảo vệ và không lẫn với báo cáo vận hành.

## 6.3. Kịch bản kiểm thử chức năng

### 6.3.1. Phiên bản và quyền hồ sơ

Bảng 6.3: Kiểm thử danh mục và quyền

| Mã | Dữ liệu, điều kiện | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| KT01 | Hai phiên bản có thời gian hiệu lực khác | Tiếp nhận trước và sau ngày đổi | Mỗi hồ sơ giữ đúng phiên bản áp dụng |
| KT02 | Phiên bản của cơ quan khác | Chọn sai cơ quan rồi gửi | Không nhận sai nhánh; có hướng dẫn |
| KT03 | Người A và hồ sơ của B không có quan hệ | Đổi mã hồ sơ trong truy cập | Không xem hoặc tải được dữ liệu của B |
| KT04 | Hồ sơ đại diện DL02 và DL03 | Thử nộp và nhận kết quả | Chỉ trường hợp đủ căn cứ được tiếp tục |

### 6.3.2. Kê khai và tiếp nhận

Bảng 6.4: Kiểm thử dữ liệu đầu vào và tiếp nhận

| Mã | Dữ liệu, điều kiện | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| KT05 | Dữ liệu xác thực đầy đủ | Nạp dữ liệu và gửi | Nguồn được lưu; không yêu cầu lại giấy đã thay hợp lệ |
| KT06 | Dữ liệu không có hoặc kết nối lỗi | Thực hiện kê khai | Có nhánh xử lý rõ; không tự kết luận sai |
| KT07 | Yêu cầu hợp lệ DL01 | Cán bộ tiếp nhận | Cấp một mã; giấy hẹn khớp hạn và phiên bản |
| KT08 | Cùng mã yêu cầu gửi hai lần | Gửi lại sau mất phản hồi | Chỉ một hồ sơ; phản hồi định danh đã tạo |

### 6.3.3. Ngoại lệ, phân công và thẩm định

Bảng 6.5: Kiểm thử tác nghiệp chuyên môn

| Mã | Dữ liệu, điều kiện | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| KT09 | Thiếu thành phần áp dụng DL04 | Yêu cầu bổ sung rồi nhận bản bổ sung | Lưu giai đoạn, căn cứ và lịch sử; đúng nhánh quay lại |
| KT10 | Yêu cầu ngoài thẩm quyền | Từ chối thiếu hoặc đủ lý do | Thiếu lý do bị chặn; đủ căn cứ sinh đúng phiếu |
| KT11 | Người xử lý khác cơ quan | Phân công rồi đổi người | Không cấp sai quyền; lịch sử được giữ |
| KT12 | Kết quả tra cứu mâu thuẫn DL05 | Đối chiếu và trình duyệt | Không tự sửa nguồn; lưu ý kiến và bằng chứng |

### 6.3.4. Ký, phát hành và tài chính

Bảng 6.6: Kiểm thử kết quả và khoản thu

| Mã | Dữ liệu, điều kiện | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| KT13 | Ký lỗi hoặc chứng thư không hợp lệ DL08 | Ký và phát hành | Chưa phát hành; lỗi có thông tin xử lý |
| KT14 | Bản đã ký bị đổi nội dung | Kiểm tra rồi phát hành | Phát hiện sai toàn vẹn; không dùng bản bị đổi |
| KT15 | Cùng thông báo thanh toán gửi lặp | Nhận nhiều lần | Một giao dịch được ghi; không tăng khoản thu |
| KT16 | Thông báo sai tiền hoặc sai hồ sơ | Xác nhận thu | Đưa đối soát; không tự đánh dấu đã thanh toán đủ |

### 6.3.5. Trả kết quả và thời hạn

Bảng 6.7: Kiểm thử giao nhận và hạn xử lý

| Mã | Dữ liệu, điều kiện | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| KT17 | Kho nhận không đáp ứng DL09 | Gửi kết quả | Đã phát hành giữ nguyên; đồng bộ ghi lỗi và chờ xử lý |
| KT18 | Đích đã nhận nhưng phản hồi mất | Gửi lại cùng mã | Không tạo hai lần giao; có bằng chứng đối chiếu |
| KT19 | DL06 trước, đúng, sau 15 giờ và ngày nghỉ | Tiếp nhận và tính hạn | Khớp bảng ranh giới đã được nghiệp vụ duyệt |
| KT20 | Hồ sơ quá hạn và có điều chỉnh | Kiểm tra cảnh báo rồi trả | Giữ hạn ban đầu; có giải trình; không chặn giao vì quá hạn |

### 6.3.6. Dừng, đồng thời và quản trị

Bảng 6.8: Kiểm thử trách nhiệm và truy vết

| Mã | Dữ liệu, điều kiện | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| KT21 | Đề nghị dừng trước và sau phát hành | Xem xét và quyết định | Xử lý theo giai đoạn; không thu hồi kết quả bằng sửa trạng thái |
| KT22 | Hai phiên mở cùng hồ sơ DL10 | Cùng cập nhật | Một cập nhật thành công; bản cũ nhận xung đột |
| KT23 | Quyền cán bộ bị thu hồi | Dùng phiên cũ tiếp tục | Thao tác bị từ chối; có sự kiện theo dõi |
| KT24 | Cấu hình thủ tục sửa chưa duyệt | Áp dụng vào hồ sơ mới | Bản nháp không có hiệu lực; truy được người sửa và duyệt |

## 6.4. Kiểm thử chuyên sâu về thời hạn

Cách tính hạn là điểm nối giữa pháp lý và thiết kế. Với thủ tục giải quyết trong ngày, đơn vị nghiệp vụ cần xác nhận mốc tiếp nhận hợp lệ, thời gian đóng ngày, ngày nghỉ và trường hợp phát sinh ngoài giờ. Bảng dưới sử dụng dữ liệu thời gian giả lập để kiểm tra cách diễn đạt điều kiện, không xác lập giờ làm việc thực tế của Sở Tư pháp.

Bảng 6.9: Bộ trường hợp ranh giới tính hạn

| Trường hợp | Điều kiện | Quy tắc cần xác nhận |
| --- | --- | --- |
| TG01 | Nhận 14:59 ngày làm việc | Hạn trong ngày theo lịch áp dụng |
| TG02 | Nhận đúng 15:00 | Làm rõ cách hiểu mốc trong cấu hình được duyệt |
| TG03 | Nhận 15:01 ngày làm việc | Hạn ngày làm việc tiếp theo theo phương án |
| TG04 | Ngày tiếp theo là ngày nghỉ | Chuyển đến ngày làm việc hợp lệ |
| TG05 | Công dân gửi tối nhưng cán bộ nhận hôm sau | Phân biệt gửi với tiếp nhận hợp lệ |
| TG06 | Có điều chỉnh hạn được phê duyệt | Giữ cả hạn gốc và hạn mới |
| TG07 | Lỗi kết nối trong giờ xử lý | Không tự loại trừ thời gian nếu thiếu căn cứ |

## 6.5. Kiểm thử an toàn và khả năng tiếp cận

Bảng 6.10: Kiểm thử an toàn có phạm vi được phép

| Mã | Tình huống | Tiêu chí mong đợi |
| --- | --- | --- |
| AT01 | Truy cập hồ sơ ngoài quyền qua giao tiếp trực tiếp | Từ chối ở máy chủ; không lộ tệp |
| AT02 | Dùng phiên hết hạn hoặc đã thu hồi | Không thực hiện được hành động |
| AT03 | Đầu vào chứa lệnh hoặc mã thực thi | Không thực thi; dữ liệu được xử lý an toàn |
| AT04 | Tệp không đúng loại và tệp thử an toàn | Cách ly hoặc từ chối theo quy tắc |
| AT05 | Giả chữ ký thông báo tài chính | Không ghi giao dịch thành công |
| AT06 | Gửi lại thông điệp có mã trùng | Không lặp tác động nghiệp vụ |
| AT07 | Tải kết quả bằng đường dẫn đã hết hạn | Không lấy được tài liệu |
| AT08 | Kiểm tra nhật ký và thông báo lỗi | Không chứa khóa, mật khẩu hoặc nội dung cá nhân không cần thiết |

Bảng 6.11: Kiểm thử khả năng sử dụng và tiếp cận

| Mã | Thao tác | Tiêu chí |
| --- | --- | --- |
| TC01 | Chỉ dùng bàn phím | Thực hiện được luồng chính và thấy vị trí chọn |
| TC02 | Phóng to giao diện | Không mất trường hoặc nút trọng yếu |
| TC03 | Dùng công cụ hỗ trợ đọc | Nhãn trường và trạng thái có ý nghĩa |
| TC04 | Nhập sai trường bắt buộc | Nêu vị trí, lý do và cách sửa |
| TC05 | Xem cảnh báo hạn không phân biệt màu | Hiểu được trạng thái qua chữ và biểu tượng |
| TC06 | Mất phiên trong khi kê khai | Có hướng tiếp tục và không lộ dữ liệu trên máy chung |

## 6.6. Kiểm thử tải, phục hồi và tiêu chí nghiệm thu

Kế hoạch tải sử dụng hồ sơ giả lập theo tỷ lệ thao tác dự kiến được đơn vị sử dụng xác nhận. Thử tăng tải từng bước để xác định đường cơ sở và điểm giới hạn; không tự công bố 12.000 người dùng đồng thời khi chưa có cấu hình hoặc mục tiêu được giao. Đo phân vị thời gian đáp ứng, tỷ lệ lỗi, độ dài hàng đợi, thời gian truy vấn và tài nguyên. Thời gian của dịch vụ bên ngoài được ghi riêng.

Bảng 6.12: Kịch bản phi chức năng đề xuất

| Mã | Kịch bản | Tiêu chí kiểm tra |
| --- | --- | --- |
| PT01 | Tăng tải danh sách và tiếp nhận theo bậc | 95% thao tác nội bộ không quá 2 giây ở tải nghiệm thu |
| PT02 | Chạy đồng thời tiếp nhận và báo cáo | Không cấp trùng; báo cáo không làm ngừng tiếp nhận |
| PT03 | Ngừng một tiến trình gửi nền rồi khởi động lại | Không mất thông điệp; không lặp kết quả |
| PT04 | Phục hồi cơ sở dữ liệu và tài liệu | Đạt mục tiêu đã thống nhất; dữ liệu đối chiếu khớp |
| PT05 | Thay chứng thư và quay phiên bản ứng dụng | Không mất quyền hoặc dữ liệu ngoài kế hoạch |
| PT06 | Duy trì tải nhiều giờ | Không tăng tài nguyên hoặc hàng đợi mất kiểm soát |

Điều kiện nghiệm thu gồm toàn bộ yêu cầu bắt buộc có bằng chứng, không còn lỗi gây sai thẩm quyền, lộ dữ liệu, sai khoản thu, mất hồ sơ hoặc phát hành sai bản. Lỗi còn lại phải có đánh giá tác động, phương án và người chấp thuận. Cán bộ nghiệp vụ ký xác nhận chứng từ và luồng xử lý; kỹ thuật xác nhận tích hợp, dữ liệu và phục hồi. Hai nhóm xác nhận không thay thế nhau.

## 6.7. Biểu mẫu ghi nhận và đánh giá

Bảng 6.13: Trường thông tin của biên bản thực hiện ca kiểm thử

| Trường | Nội dung cần ghi |
| --- | --- |
| Mã ca và yêu cầu | Liên kết với ma trận truy vết |
| Phiên bản thử | Ứng dụng, dữ liệu, cấu hình và thời điểm |
| Người thực hiện | Danh tính và vai trò được giao |
| Điều kiện ban đầu | Mã dữ liệu, quyền và trạng thái |
| Kết quả quan sát | Nội dung thực tế, không chỉ ghi đạt hoặc không đạt |
| Bằng chứng | Ảnh, nhật ký đã bảo vệ dữ liệu hoặc mã giao dịch |
| Sai lệch và lỗi | Mã lỗi, mức ảnh hưởng và người phụ trách |
| Kết luận | Đạt, không đạt, bị chặn hoặc chưa thực hiện |
| Kiểm tra lại | Phiên bản sửa, ngày và bằng chứng mới |

Tỷ lệ đạt chỉ được tính trên ca đã thực hiện có kết luận, còn ca bị chặn và chưa thực hiện phải báo cáo riêng. Không gộp ca chưa chạy thành đạt vì chức năng có trong thiết kế. Hiệu quả thực tế của tái cấu trúc cần khảo sát sau triển khai với kỳ, mẫu và phương pháp tương ứng, không thể suy ra từ việc mọi ca kỹ thuật đều đạt.

## 6.8. Kiểm thử bổ sung cho phạm vi toàn hệ thống

### 6.8.1. Dữ liệu và ma trận lựa chọn thủ tục

Mẫu nghiệm thu cần gồm cá nhân tự thực hiện, cá nhân đại diện và tổ chức; thủ tục có thu và không thu; tiếp nhận trực tuyến, trực tiếp, bưu chính; xử lý tại Thành phố và tại bộ; luồng tuần tự và phối hợp; kết quả điện tử và phương thức trả được quy định. Hai thủ tục phân tích trong báo cáo mới chứng minh được một số khác biệt, không đại diện cho toàn bộ danh mục. Đơn vị chuyên môn phải chọn thêm trường hợp có xác minh, thực địa hoặc nghĩa vụ tài chính phức tạp khi thuộc phạm vi triển khai.

Bộ dữ liệu thử gồm các phiên bản trước và sau ngày hiệu lực, cơ quan đổi tên hoặc chuyển nhiệm vụ, tài khoản đã thu hồi, sự kiện ngoài bị lặp hoặc đảo thứ tự, tài liệu được thay thế và gói nộp lưu thiếu thành phần. Mỗi dữ liệu phải có nguồn tạo, điều kiện mong đợi và người phê duyệt. Không dùng hồ sơ công dân thật làm dữ liệu thử chỉ để giảm công chuẩn bị.

Bảng 6.14: Ca kiểm thử bổ sung cho toàn hệ thống

| Mã | Điều kiện hoặc tình huống | Thao tác kiểm tra | Kết quả mong đợi |
| --- | --- | --- | --- |
| HT01 | Cơ quan đổi tên, hồ sơ cũ còn mở | Cập nhật danh mục và mở chứng từ cũ | Lịch sử giữ cơ quan gốc; cơ quan kế thừa được ghi riêng |
| HT02 | Hai tuyến có khoảng hiệu lực giao nhau | Gửi hai cấu hình cạnh tranh cho cùng phiên bản | Chặn cấu hình mâu thuẫn; không tiếp nhận hai tuyến |
| HT03 | Người dân nộp trực tuyến rồi tới điểm hỗ trợ | Tra cứu và hỗ trợ trên cùng mã | Không tạo hồ sơ mới; lưu người hỗ trợ và kênh phù hợp |
| HT04 | Tệp số hóa thiếu trang hoặc không đọc được | Kiểm tra trước khi xác nhận số hóa | Yêu cầu xử lý lại; không gắn trạng thái đủ tài liệu |
| HT05 | Người giao dịch không có quyền đại diện tổ chức | Nộp và nhận kết quả cho tổ chức | Từ chối thao tác ngoài quyền; ghi căn cứ kiểm tra |
| HT06 | Một ý kiến bắt buộc chưa hoàn tất | Tổng hợp và trình duyệt hồ sơ liên thông | Chặn trình hoặc yêu cầu căn cứ ngoại lệ được duyệt |
| HT07 | Cùng mã sự kiện gửi hai lần, rồi sửa nội dung | Nhận lặp và nhận lại nội dung khác | Một tác động; nội dung khác bị giữ đối chiếu |
| HT08 | Hồ sơ đổi tuyến giữa lúc xử lý | Bàn giao và tiếp tục xử lý tại nơi nhận | Có xác nhận, giữ hạn và mã; không mất nhiệm vụ |
| HT09 | Chứng thư hết hiệu lực hoặc bản thay sau ký | Kiểm tra và đề nghị phát hành | Không phát hành bản sai; lưu bằng chứng kiểm tra |
| HT10 | Giấy tờ trong kho đã bị thay thế | Dùng lại cho hồ sơ mới | Hiển thị tình trạng; không mặc nhiên chọn bản cũ |
| HT11 | Kho địa phương không có giấy tờ phù hợp | Truy vấn kho quốc gia theo quyền | Ghi nguồn và mốc; không trả giấy tờ của chủ thể khác |
| HT12 | Gói nộp lưu thiếu ý kiến hoặc lệch băm | Gửi gói và nhận phản hồi kho | Không đánh dấu đã nhận; lưu lý do và bản sửa |
| HT13 | Đổi người đại diện hoặc kênh liên hệ | Gửi thông báo tới người được phép | Người cũ không nhận dữ liệu sau khi hết quyền |
| HT14 | Phản ánh thái độ phục vụ trên hồ sơ đã giải quyết | Phân loại, chuyển và trả lời | Có đầu mối trả lời; không sửa quyết định hồ sơ |
| HT15 | Một mã xuất hiện tại Thành phố và bộ | Tổng hợp theo nguồn tại một mốc chốt | Không đếm hai hồ sơ; báo riêng chênh lệch |
| HT16 | Thủ tục 2.000908 được cấu hình không thu phí | Tiếp nhận và trả qua các kênh được phép | Không phát sinh khoản bắt buộc hoặc màn hình thu phí |
| HT17 | Tài khoản chỉ có quyền một cơ quan | Tìm kiếm, in và xuất danh sách toàn Thành phố | Chỉ trả hồ sơ trong quyền; nhật ký ghi kết xuất |
| HT18 | Mất kết nối bộ, sau đó nhận sự kiện cũ | Theo dõi và khôi phục đồng bộ | Hiển thị mốc cuối; sự kiện cũ không ghi đè trạng thái mới |
| HT19 | Luật mới có ngày hiệu lực tương lai | Mở hồ sơ trước, sau mốc và hồ sơ chuyển tiếp | Áp dụng đúng căn cứ; không đổi tự động hồ sơ cũ |
| HT20 | Trợ giúp lấy nguồn hết hiệu lực hoặc thiếu căn cứ | Yêu cầu hướng dẫn cán bộ | Ghi rõ nguồn, cảnh báo hoặc chuyển hỏi nghiệp vụ |

Bộ ca từ mục 6.3 đến 6.8 có 64 ca, gồm 44 ca trọng tâm và 20 ca bổ sung, đều chưa thực hiện; mục 6.9 tiếp tục bổ sung ca đối chiếu từng chức năng. Kết quả mong đợi là tiêu chí để thử khi được cấp môi trường; không phải số liệu vận hành. Với giao tiếp bộ, cần thử cả phía gửi, phía nhận và đối chiếu sau lỗi, vì thử riêng từng phần mềm có thể không phát hiện mã hoặc trạng thái khác nhau.

### 6.8.2. Kiểm chứng từ đầu đến cuối và quyết định nghiệm thu

Một ca hoàn chỉnh phải đi từ danh tính người yêu cầu, chọn phiên bản và tuyến, tiếp nhận hợp lệ, giải quyết, ký, phát hành, thực hiện nghĩa vụ áp dụng, giao kết quả đến nộp lưu. Bằng chứng gồm dữ liệu đã lưu, chứng từ, bản ký kiểm tra được, sự kiện tại nguồn và biên nhận ở nơi đích. Ảnh màn hình báo thành công chưa đủ chứng minh chuỗi này hoàn tất.

Phải thử ranh giới lỗi tại trước và sau điểm ghi giao dịch, đồng thời, gửi lại, khởi động lại tiến trình và phục hồi từ sao lưu. Sau mỗi ca lỗi, đối chiếu số hồ sơ, khoản thu, bản phát hành và thông điệp chờ, thay vì chỉ kiểm tra ứng dụng có mở được. Những ca cần dữ liệu hoặc phản hồi bên ngoài chưa có phải được ghi bị chặn, không thay bằng giả lập rồi công bố kết quả tích hợp thực tế.

Nghiệm thu từng nhóm chức năng cần người nghiệp vụ xác nhận kết quả và người kỹ thuật xác nhận dữ liệu, quyền, tích hợp, phục hồi. Chấp nhận giới hạn ở môi trường thử không tự xác nhận năng lực sản xuất; trước mở rộng phải kiểm tra thêm quy mô, hỗ trợ và phương án vận hành. Không dùng tổng số ca hoặc độ dài tài liệu để thay cho bằng chứng thực hiện.

## 6.9. Bộ ca đối chiếu 31 chức năng

Mã CF có hai chữ số tương ứng mã CN ở mục 3.9. Bộ ca kiểm tra điểm dễ sai của từng chức năng, bổ sung cho các chuỗi nghiệp vụ và ca phi chức năng trước đó. Với mỗi ca phải kiểm tra cả thao tác được phép và thao tác bị từ chối, dữ liệu sau xử lý và nhật ký. Các hệ thống đích giả lập chỉ phục vụ kiểm tra cục bộ; xác nhận liên thông thực tế cần phối hợp hai bên.

Bảng 6.15: Kịch bản đối chiếu từng chức năng

| Mã | Điều kiện trước | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| CF01 | Cán bộ chuyển cơ quan, còn phiên truy cập cũ | Thu hồi quyền rồi thao tác bằng phiên cũ | Quyền cũ bị chặn; phân công tồn được chuyển có chứng cứ |
| CF02 | Cơ quan đổi tên, có hồ sơ trước ngày đổi | Cập nhật danh mục, mở chứng từ cũ | Hồ sơ mới dùng tên hiệu lực; bản đã phát hành giữ nguyên |
| CF03 | Hai phiên bản thủ tục kế tiếp nhau | Nộp tại trước và sau ngày hiệu lực | Chọn đúng phiên bản, thẩm quyền, hạn và tuyến |
| CF04 | Hồ sơ đã giao, một kho chưa đồng bộ | Tra cứu và chạy báo cáo trạng thái | Hiển thị riêng trạng thái giao và đồng bộ; không lùi nghiệp vụ |
| CF05 | Biểu mẫu có trường theo điều kiện | Nộp nhánh không cần và cần trường đó | Không bắt trường ngoài điều kiện; báo đúng thiếu trong nhánh cần |
| CF06 | Bên nhận chuyển hồ sơ chưa xác nhận | Chuyển rồi làm mất phản hồi | Có đầu mối chịu trách nhiệm, không mất hồ sơ hoặc chuyển trùng |
| CF07 | Hồ sơ đã nhận theo quy trình cũ | Phê duyệt quy trình mới khi hồ sơ đang mở | Hồ sơ cũ giữ phiên bản hoặc chuyển theo quyết định có căn cứ |
| CF08 | Sự kiện nguồn đến muộn và đảo thứ tự | Dựng lịch sử tiến trình | Giữ mốc nguồn và mốc nhận, không lùi trạng thái hoặc giấu chậm |
| CF09 | Sơ đồ có vòng lặp, bước không tới được | Kiểm tra rồi đề nghị phát hành cấu hình | Phát hiện nhánh lỗi; không phát hành cấu hình chưa có điều kiện thoát |
| CF10 | Chứng thư và bản kết quả có thể đối chiếu | Ký rồi thay một byte nội dung | Bản bị sửa không được xác nhận hợp lệ hoặc phát hành |
| CF11 | Dịch vụ ký đã xử lý nhưng mất phản hồi | Gửi lại cùng mã yêu cầu | Đối chiếu bản đã ký; không tạo tác động ký mới ngoài chủ ý |
| CF12 | Cùng yêu cầu gửi qua hai lần kết nối | Tiếp nhận đồng thời | Chỉ cấp một mã chính thức, một giấy hẹn và một hồ sơ |
| CF13 | Bổ sung trong hai giai đoạn khác nhau | Yêu cầu và nộp bổ sung | Giữ giai đoạn, lý do, bản cũ; hạn theo quy tắc từng trường hợp |
| CF14 | Hai người cùng phân công hồ sơ | Lưu bằng cùng phiên bản ban đầu | Một cập nhật thành công; người sau nhận xung đột, không ghi đè |
| CF15 | Hai ý kiến bắt buộc, chỉ có một bản trả | Đề nghị tổng hợp và trình | Chặn hoặc yêu cầu căn cứ được phép; không coi im lặng là đồng ý |
| CF16 | Người phê duyệt ngoài thẩm quyền phiên bản | Thử duyệt bằng quyền cơ quan khác | Bị từ chối, giữ trạng thái và ghi nhật ký |
| CF17 | Hồ sơ có khoản thu và nhiệm vụ còn mở | Quyết định dừng theo căn cứ | Có thông báo và xử lý nghĩa vụ còn lại, không xóa lịch sử |
| CF18 | Thông báo đã gửi nhưng chưa có biên nhận | Thử ghi đã giao kết quả | Không xác nhận giao chỉ từ trạng thái gửi thông báo |
| CF19 | Tài khoản chỉ có quyền xem một phạm vi | Kết xuất danh sách ngoài phạm vi | Bị chặn hoặc lọc đúng quyền; có nhật ký xuất |
| CF20 | Một sự kiện nhắc việc gửi lặp | Xử lý lại sự kiện nhiều lần | Không gửi trùng ngoài chính sách; không lộ nội dung nhạy cảm |
| CF21 | Biết mã hồ sơ của người khác | Tra cứu và tải tài liệu trực tiếp | Không mở nội dung ngoài quyền, kể cả qua đường dẫn tệp |
| CF22 | Câu hỏi có nguồn cũ và nguồn mới | Yêu cầu hướng dẫn cán bộ | Dùng nguồn còn hiệu lực, nêu căn cứ; thiếu căn cứ thì chuyển hỏi |
| CF23 | Một hồ sơ có mã ở Thành phố và hệ thống bộ | Tổng hợp báo cáo cùng kỳ | Chỉ đếm một hồ sơ; lưu nguồn và mốc chốt |
| CF24 | Mẫu số chỉ số thay đổi trong kỳ sau | Phát hành mẫu mới rồi xem báo cáo cũ | Báo cáo cũ giữ định nghĩa; bản mới ghi hiệu lực và công thức |
| CF25 | Có hồ sơ đang quá hạn và đã trả trễ | Thống kê tồn đọng và đúng hạn | Không gộp hai loại; công thức có tử, mẫu và loại trừ |
| CF26 | Lãnh đạo chỉ được xem số tổng hợp | Mở bảng điều hành rồi xem hồ sơ chi tiết | Không tự có quyền xem nội dung cá nhân từ quyền xem chỉ số |
| CF27 | Chỉ đạo yêu cầu thay hạn không có căn cứ | Nhập nhiệm vụ và thử sửa hạn | Lưu chỉ đạo; không tự đổi hạn pháp lý hoặc xóa hạn gốc |
| CF28 | Đại diện hết quyền khai thác kho | Thu hồi quyền và mở bản đã liên kết | Chặn khai thác ngoài hiệu lực; giữ chứng cứ dùng trước đó |
| CF29 | Tài liệu kho đã bị thay thế | Dùng lại cho hồ sơ mới | Kiểm tra hiệu lực và bản thay thế; không tự coi tệp cũ là đạt |
| CF30 | Một mã sự kiện đến lại với nội dung khác | Nhận hai bản thông điệp | Giữ chứng cứ, phát hiện xung đột, không ghi đè im lặng |
| CF31 | Kết quả có mã địa phương và mã quốc gia | Đồng bộ, mất phản hồi rồi gửi lại | Giữ liên kết mã và phiên bản; chỉ một bản tác động hợp lệ |

Tổng bộ thiết kế có 95 ca, gồm 44 ca trọng tâm, 20 ca mở rộng và 31 ca chức năng; tất cả chưa thực hiện. Bao phủ 31 mục chức năng vẫn chưa đồng nghĩa bao phủ mọi nhánh pháp luật chuyên ngành. Khi có thêm thủ tục, phải bổ sung ca cho khác biệt về thành phần, chủ thể, thẩm quyền, thời hạn, phối hợp, phí và kết quả, rồi truy vết tới phiên bản áp dụng.
