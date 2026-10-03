# VII. QUẢN TRỊ HỆ THỐNG VÀ KẾT LUẬN

## 7.1. Quản trị trách nhiệm và phối hợp

Quản trị hệ thống là việc xác lập người quyết định, quy tắc thay đổi, chất lượng dữ liệu và cơ chế kiểm tra. Đơn vị phát triển phần mềm hỗ trợ giải pháp kỹ thuật nhưng không có thẩm quyền quyết định một hồ sơ đủ điều kiện hoặc tự thay thời hạn pháp lý. Cơ quan nghiệp vụ chịu trách nhiệm về nội dung quy trình; đơn vị vận hành chịu trách nhiệm duy trì và bảo vệ dịch vụ theo nhiệm vụ được giao.

Bảng 7.1: Phân công quản trị đề xuất

| Hoạt động | Đơn vị chịu trách nhiệm nội dung | Đơn vị phối hợp |
| --- | --- | --- |
| Cấu hình thủ tục và mẫu | Đơn vị kiểm soát thủ tục, cơ quan chuyên môn | Đơn vị phát triển và vận hành |
| Thẩm quyền và phân công | Cơ quan giải quyết | Tổ chức cán bộ và quản trị |
| Kết nối ngành Tư pháp | Đầu mối chuyên ngành có thẩm quyền | Trung tâm và đơn vị kỹ thuật |
| Vận hành hạ tầng | Đơn vị được giao vận hành | Phát triển và an toàn |
| Thu, miễn giảm và đối soát | Bộ phận tài chính có thẩm quyền | Đơn vị thanh toán và nghiệp vụ |
| Bảo vệ dữ liệu | Đơn vị quản lý dữ liệu theo nhiệm vụ | An toàn, nghiệp vụ và pháp chế |
| Kiểm tra chất lượng | Đơn vị giám sát được giao | Cơ quan sử dụng và vận hành |

Ma trận được cụ thể hóa bằng quyết định và đầu mối thực tế trước triển khai. Việc ghi tên cơ quan trong phương án công khai giúp xác định nhóm trách nhiệm, nhưng không đủ để suy ra cá nhân đang phụ trách hay hợp đồng vận hành hiện hành. Danh sách liên hệ nội bộ cần được cập nhật riêng và không đặt trong bản công khai của báo cáo.

## 7.2. Phân quyền và quản lý tài khoản

Bảng 7.2: Ma trận quyền nghiệp vụ theo vai trò

| Vai trò | Tiếp nhận | Thụ lý | Ký và phát hành | Cấu hình |
| --- | --- | --- | --- | --- |
| Người yêu cầu | Gửi hồ sơ có quan hệ | Xem tiến độ được phép | Nhận kết quả có quyền | Không |
| Tiếp nhận | Kiểm tra và xác nhận | Xem luồng liên quan | Xác nhận giao được phân công | Không |
| Chuyên viên | Xem hồ sơ được giao | Thẩm định, dự thảo | Trình duyệt | Không |
| Lãnh đạo | Xem phạm vi cơ quan | Phân công, kiểm tra | Phê duyệt đúng thẩm quyền | Duyệt cấu hình nghiệp vụ nếu được giao |
| Văn thư | Xem bản cần phát hành | Không thay ý kiến chuyên môn | Cấp số và phát hành | Danh mục văn thư theo nhiệm vụ |
| Tài chính | Xem thông tin cần thu | Đối soát khoản thu | Chứng từ tài chính | Mức thu theo phê duyệt |
| Quản trị nghiệp vụ | Không ra quyết định hồ sơ | Không | Không | Lập phiên bản cấu hình |
| Quản trị kỹ thuật | Không mặc nhiên có quyền | Không | Không | Cấu hình kỹ thuật theo nhiệm vụ |
| Kiểm tra | Chỉ đọc trong phạm vi giao | Chỉ đọc | Chỉ đọc | Xem lịch sử |

Quyền hiệu lực là giao của vai trò, phạm vi cơ quan, quan hệ hồ sơ và thời hạn được giao. Người có vai trò thụ lý nhưng không được phân công không mặc nhiên sửa mọi hồ sơ của cơ quan. Quyền ký được kiểm tra theo thẩm quyền hoặc ủy quyền và hiệu lực tại thời điểm ký. Quyền quản trị nền tảng không đồng nghĩa quyền đọc mọi tài liệu.

Quy trình tài khoản gồm đề nghị, phê duyệt, cấp quyền, kiểm tra định kỳ và thu hồi. Khi cán bộ thay đổi vị trí hoặc nghỉ công tác, quyền cũ bị thu hồi và phiên liên quan được xử lý theo chính sách. Trường hợp cần hỗ trợ khẩn cấp sử dụng quyền tạm, có thời điểm hết hiệu lực và kiểm tra sau sử dụng. Không duy trì tài khoản chung cho nhiều cán bộ vì làm mất khả năng xác định trách nhiệm.

## 7.3. Quản trị danh mục, dữ liệu và thay đổi

### 7.3.1. Quy trình thay đổi cấu hình

Bảng 7.3: Quy trình thay đổi có kiểm soát

| Bước | Nội dung | Bằng chứng |
| --- | --- | --- |
| Đề nghị | Nêu vấn đề, căn cứ và phạm vi | Phiếu thay đổi |
| Phân tích | Xác định hồ sơ, mẫu, quyền và tích hợp bị tác động | Danh sách ảnh hưởng |
| Chuẩn bị | Tạo phiên bản và phương án chuyển tiếp | Bản cấu hình nháp |
| Kiểm thử | Thử ranh giới hiệu lực và ngoại lệ | Kết quả ca liên quan |
| Phê duyệt | Chấp thuận nội dung và thời điểm áp dụng | Ý kiến người có thẩm quyền |
| Áp dụng | Sao lưu, triển khai và kiểm tra | Nhật ký phát hành |
| Theo dõi | Đánh giá sai lệch và quyết định kết thúc | Biên bản sau thay đổi |

Một thay đổi có thể ảnh hưởng nhiều lớp. Chẳng hạn, thay thời hạn cần cập nhật quy tắc tính, giấy hẹn, báo cáo và bộ thử; thay thẩm quyền cần cập nhật lựa chọn cơ quan, phân quyền và tuyến chuyển. Người sửa cấu hình không tự phê duyệt bản sửa của mình. Thiết kế giữ bản cũ để giải thích hồ sơ đã tiếp nhận và để quay lui khi cần.

### 7.3.2. Chất lượng và bảo vệ dữ liệu

Bảng 7.4: Kiểm soát chất lượng dữ liệu

| Tiêu chí | Cách phát hiện | Cách xử lý |
| --- | --- | --- |
| Đầy đủ | Thiếu phiên bản, hạn hoặc người phụ trách | Giao chủ sở hữu xác minh, không tự điền giả |
| Nhất quán | Phát hành nhưng thiếu bản ký | Khoanh phạm vi và đối chiếu nguồn |
| Không trùng | Mã hồ sơ hoặc mã giao dịch lặp | Giữ chứng cứ, xử lý theo quyền |
| Có nguồn | Dữ liệu đối chiếu thiếu định danh nguồn | Xác minh lại và bổ sung chứng cứ |
| Cập nhật đúng | Thông tin thay đổi không có lịch sử | Kiểm tra nhật ký và quy trình sửa |
| Hợp lệ theo thời điểm | Dùng mẫu hết hiệu lực cho hồ sơ mới | Sửa cấu hình và đánh giá hồ sơ bị ảnh hưởng |

Quản trị bảo vệ dữ liệu phải xác định mục đích xử lý, chủ thể chịu trách nhiệm, nơi lưu, bên nhận và thời hạn. Cần phân biệt căn cứ xử lý trong thực hiện nhiệm vụ công với các hoạt động khác như gửi thông tin giới thiệu hoặc sử dụng cho nghiên cứu. Việc một cơ quan có quyền giải quyết thủ tục không tạo quyền khai thác không giới hạn. Thiết kế hạn chế thu thập và chia sẻ đúng phần cần thiết, đồng thời tổ chức tiếp nhận yêu cầu về dữ liệu theo quy định. [9]

## 7.4. Chỉ số điều hành và đánh giá hiệu quả

Chỉ số điều hành có công thức, kỳ, đối tượng và nguồn dữ liệu. Không dùng số thao tác ký để thay số hồ sơ đã giao kết quả. Hồ sơ có nhiều bản sửa chỉ được tính một lần trong tổng theo hồ sơ, còn số phiên bản là chỉ báo chất lượng khác. Báo cáo ngày cần ghi mốc chốt dữ liệu để giải thích chênh lệch với báo cáo theo thời gian thực.

Bảng 7.5: Chỉ số quản trị đề xuất

| Chỉ số | Công thức hoặc định nghĩa | Điểm cần kiểm soát |
| --- | --- | --- |
| Hồ sơ tiếp nhận | Số mã chính thức phát sinh trong kỳ | Không đếm bản nháp và gửi lặp |
| Tỷ lệ trả đúng hạn | Hồ sơ giao trong hạn chia hồ sơ đã giao thuộc kỳ | Chốt mẫu số và hạn áp dụng |
| Hồ sơ đang quá hạn | Đang xử lý và vượt hạn tại mốc chốt | Không trộn với hồ sơ hoàn thành trễ |
| Tỷ lệ bổ sung | Hồ sơ có yêu cầu bổ sung chia hồ sơ tiếp nhận | Phân biệt giai đoạn và nguyên nhân |
| Kết quả chưa giao | Đã phát hành nhưng chưa có bằng chứng giao | Tách lỗi đồng bộ và kênh bưu chính |
| Tài chính chưa đối soát | Khoản thu có sai lệch hoặc chưa khớp | Không gộp với thanh toán chưa thực hiện |
| Tỷ lệ dữ liệu dùng lại | Hồ sơ dùng dữ liệu hợp lệ chia hồ sơ đủ điều kiện | Mẫu số không phải mọi hồ sơ |
| Mức hài lòng | Theo thang và mẫu khảo sát thống nhất | Nêu số phản hồi và tỷ lệ tham gia |

Bộ chỉ số theo Quyết định 766/QĐ-TTg ngày 23/06/2022 được dùng làm tài liệu tham chiếu về đánh giá phục vụ. Cách tính trong hệ thống phải đối chiếu quy định và hướng dẫn áp dụng hiện hành; thiết kế không tự đặt phép trừ điểm cho từng thao tác quá hạn. Các chỉ số đề xuất trong bảng trên phục vụ điều hành nội bộ và không được trình bày như công thức chính thức của bộ chỉ số quốc gia. [10]

## 7.5. Đánh giá phương án và kiến nghị

### 7.5.1. Giá trị của phương án nghiên cứu

Phương án kết nối các nội dung của vòng đời hệ thống bằng một trường hợp nghiệp vụ có nguồn. Tiếp nhận được liên hệ với phiên bản thủ tục và hạn; thẩm định được liên hệ với chứng cứ dữ liệu; ký và trả được liên hệ với phiên bản tài liệu và giao nhận. Nhờ đó, yêu cầu có thể được kiểm chứng bằng bộ ca thay vì chỉ mô tả tên chức năng.

Bảng 7.6: Đóng góp và bằng chứng trong hồ sơ nghiên cứu

| Nội dung | Sản phẩm | Giá trị sử dụng |
| --- | --- | --- |
| Phân tích hệ thống thực tế | Nguồn và ranh giới hiện trạng | Có cơ sở để kiểm tra đối tượng nghiên cứu |
| Phân tích nghiệp vụ | Use case, quy tắc và ngoại lệ | Trao đổi với cán bộ chuyên môn |
| Thiết kế | Trạng thái, dữ liệu, giao tiếp và màn hình | Cơ sở phát triển và rà soát kỹ thuật |
| Triển khai, vận hành | Điều kiện, chuyển đổi và phục hồi | Chuẩn bị tổ chức đưa vào sử dụng |
| Kiểm thử | Truy vết và ca có điều kiện mong đợi | Chuẩn bị kiểm chứng khi có môi trường |
| Quản trị | Quyền, thay đổi và chỉ số | Xác lập trách nhiệm và kiểm soát |

### 7.5.2. Kiến nghị theo thứ tự ưu tiên

Bảng 7.7: Kiến nghị hoàn thiện và điều kiện thực hiện

| Ưu tiên | Kiến nghị | Điều kiện hoặc đầu mối |
| --- | --- | --- |
| 1 | Xác nhận phiên bản nhánh thủ tục và quy tắc hạn | Cơ quan nghiệp vụ và kiểm soát thủ tục |
| 1 | Chuẩn hóa quan hệ người yêu cầu, chủ thể và đại diện | Nghiệp vụ, dữ liệu và pháp chế |
| 1 | Đối chiếu giao tiếp quốc gia và ngành Tư pháp | Đặc tả được đơn vị kết nối cung cấp |
| 2 | Tách trạng thái chuyên môn, giao và đồng bộ | Kiểm tra khả năng hiện hữu trước sửa |
| 2 | Kiểm tra các ca lặp, đồng thời và ký thất bại | Môi trường thử được cấp |
| 2 | Diễn tập khôi phục trọn dữ liệu và tài liệu | Phương án phục hồi được duyệt |
| 3 | Đánh giá hiệu quả sau tái cấu trúc | Dữ liệu sau triển khai và phương pháp khảo sát |

## 7.6. Chi phí, nhà cung cấp và rủi ro

### 7.6.1. Đánh giá chi phí và lợi ích

Chi phí phải được tính trên phạm vi dịch vụ, thời gian sử dụng và khối lượng thực tế. Dự toán không chỉ gồm phần mềm: chuyển đổi dữ liệu, số hóa, tích hợp, tập huấn, trực vận hành, bảo vệ dữ liệu, phục hồi và bàn giao cũng tiêu thụ nguồn lực. Nghiên cứu chưa có hợp đồng hay sổ chi phí của hệ thống Hà Nội nên không đưa ra giá mua hoặc khoản tiết kiệm thực tế. Mô hình dưới đây là công cụ lập phương án khi có số liệu được xác nhận.

Bảng 7.8: Cấu phần tổng chi phí trong ba năm đề xuất

| Cấu phần | Đơn vị và căn cứ tính | Điều kiện đối chiếu |
| --- | --- | --- |
| Chuẩn bị và chuyển đổi | Ngày công khảo sát, hồ sơ làm sạch, lượt tập huấn | Xác nhận khối lượng và trách nhiệm nghiệm thu |
| Phần mềm và kết nối | Phạm vi chức năng, số tuyến tích hợp, lần thay đổi | Phân biệt phí ban đầu với duy trì và nâng cấp |
| Hạ tầng và lưu trữ | Dung lượng theo lớp dữ liệu, tài nguyên xử lý, băng thông | Tính cả dự phòng, bản sao và tăng trưởng |
| Vận hành và bảo vệ | Nhân sự trực, giám sát, diễn tập, kiểm tra và hỗ trợ | Gắn với giờ phục vụ và mức dịch vụ cam kết |
| Chuyển giao và kết thúc | Xuất dữ liệu, kiểm chứng chuyển đổi, hỗ trợ tiếp quản | Có tiêu chí nhận đủ và xóa bản sao đúng quy định |

Tổng chi phí ba năm bằng chi phí ban đầu cộng chi phí duy trì từng năm, chi phí thay đổi được dự kiến và chi phí kết thúc. Cần tránh tính hai lần tài nguyên đã nằm trong giá dịch vụ. Khi so sánh phương án, cùng một phạm vi nghiệp vụ, mức phục vụ, nghĩa vụ lưu trữ và rủi ro phải được giữ nhất quán; một phương án rẻ hơn nhưng thiếu phục hồi không phải phương án tương đương.

Lợi ích được đánh giá riêng theo người dân, cán bộ và ngân sách. Thời gian người dân giảm được có thể ước tính bằng chênh lệch thời gian đo trên các hồ sơ tương đồng nhân số hồ sơ đủ điều kiện; đó là lợi ích xã hội, không tự động là khoản ngân sách tiết kiệm. Ngày công được giải phóng chỉ trở thành tiết kiệm chi tiêu nếu có thay đổi chi phí thực tế được chứng minh. Số lượt nộp trực tuyến tăng cũng chưa chứng minh giảm tổng thời gian xử lý nếu hồ sơ vẫn phải bổ sung nhiều lần.

### 7.6.2. Quản trị nhà cung cấp và khả năng tiếp quản

Tài liệu hướng dẫn năm 2023 có thông tin đơn vị biên soạn là Công ty TNHH Hệ thống thông tin FPT. Chứng cứ này xác nhận nguồn của tài liệu trong giai đoạn đó, không đủ để kết luận nhà cung cấp hiện tại, giá hợp đồng hay quyền sở hữu từng thành phần vào năm 2026. Các điều kiện dưới đây là đề xuất cho hoạt động quản trị dịch vụ. [16]

Bảng 7.9: Điều kiện kiểm soát dịch vụ và tiếp quản

| Nội dung | Hồ sơ cần nhận | Tiêu chí kiểm chứng |
| --- | --- | --- |
| Phạm vi và mức dịch vụ | Danh mục chức năng, giờ hỗ trợ, cách đo gián đoạn | Thống nhất nguồn đo và trường hợp loại trừ |
| Thay đổi và tích hợp | Phiên bản cấu hình, hợp đồng giao tiếp, lịch thay đổi | Có thử tương thích và phương án quay lui |
| Quyền quản trị | Danh sách tài khoản, phân quyền, quyền truy cập hỗ trợ | Có phê duyệt, thời hạn và nhật ký sử dụng |
| Tài sản và dữ liệu | Danh mục phần mềm, cấu hình, dữ liệu, tài liệu và khóa | Xác định bên quản lý; khóa ký được bàn giao theo thẩm quyền |
| Tiếp quản và kết thúc | Bộ xuất dữ liệu, hướng dẫn phục hồi, danh sách tồn đọng | Thử nhập lại, kiểm tra chữ ký và đối chiếu tổng số |

Không chấp nhận bàn giao chỉ có tệp dữ liệu mà thiếu phiên bản thủ tục, lịch sử trạng thái và quan hệ tài liệu. Bộ bàn giao phải giúp đơn vị tiếp quản tái lập hồ sơ có bằng chứng. Hợp đồng cần quy định phối hợp khi hệ thống bộ thay đổi, khi phải khôi phục dữ liệu hoặc khi phát hiện sự cố bảo vệ dữ liệu. Việc hỗ trợ từ xa cần cấp quyền theo vụ việc và kết thúc quyền sau xử lý, thay vì giữ tài khoản quản trị dùng chung.

### 7.6.3. Danh mục rủi ro và chủ thể xử lý

Rủi ro trong bảng là nhận định thiết kế, không phải các sự cố đã được xác nhận xảy ra tại Hà Nội. Mức ưu tiên được xác định theo tác động nghiệp vụ và khả năng phát hiện, rồi điều chỉnh bằng dữ liệu vận hành. Cơ quan chủ quản phải phê duyệt phần rủi ro còn lại sau kiểm soát.

Bảng 7.10: Rủi ro trọng yếu của phương án

| Rủi ro | Hệ quả cần ngăn chặn | Biện pháp và đầu mối |
| --- | --- | --- |
| Chọn sai hệ thống xử lý | Hồ sơ chuyển sai nơi, chậm hạn | Quản lý tuyến theo hiệu lực; đầu mối thủ tục xác nhận |
| Sự kiện liên thông lặp hoặc đảo thứ tự | Trạng thái lùi, thống kê trùng | Hộp nhận sự kiện, khóa chống lặp; đơn vị tích hợp đối soát |
| Quy tắc hết hiệu lực | Áp sai mẫu, thẩm quyền hoặc hạn | Phê duyệt phiên bản và thử ranh giới ngày; nghiệp vụ chủ trì |
| Số hóa hoặc ký không hợp lệ | Kết quả không đọc được, khó sử dụng lại | Kiểm tra tệp và chữ ký trước phát hành; văn thư phối hợp |
| Truy cập hoặc xuất quá phạm vi | Lộ dữ liệu và mất khả năng truy cứu | Quyền theo mục đích, nhật ký xuất; chủ sở hữu dữ liệu kiểm tra |
| Bản sao không phục hồi được | Mất hồ sơ hoặc gián đoạn kéo dài | Phục hồi thử cả tài liệu và dữ liệu; đầu mối vận hành chịu trách nhiệm |
| Phụ thuộc nhà cung cấp | Không tiếp quản được khi đổi dịch vụ | Bộ bàn giao kiểm chứng được; chủ quản kiểm tra định kỳ |
| Chỉ số điều hành sai mẫu số | Đánh giá sai kết quả phục vụ | Chốt nguồn và đối soát mã hồ sơ; đầu mối báo cáo xác nhận |

## 7.7. Đối chiếu mức độ bao phủ của nghiên cứu

### 7.7.1. Hai mươi khía cạnh của toàn hệ thống

Chín nhóm chức năng theo Thông tư 11/2025/TT-BKHCN được đối chiếu ở Chương 2 và truy vết ở Chương 3. Ma trận dưới đây bổ sung các khía cạnh ngoài chức năng để tránh đồng nhất việc mô tả một quy trình với việc nghiên cứu toàn hệ thống. Một khía cạnh được phân tích trong báo cáo không có nghĩa mọi chi tiết triển khai thực tế đã được xác minh. [18]

Bảng 7.11: Ma trận phạm vi và khoảng trống chứng cứ

| Khía cạnh | Nội dung đã phân tích | Chứng cứ hoặc phần còn cần khảo sát |
| --- | --- | --- |
| 1. Tồn tại và lịch sử | Mốc vận hành, hướng dẫn, hoạt động năm 2026 | Nguồn công khai [15], [16], [23] |
| 2. Tổ chức và trách nhiệm | Cơ quan, chi nhánh, điểm tiếp nhận, phân quyền | Cần sơ đồ tổ chức và phân công hiện hành chi tiết |
| 3. Pháp lý và phiên bản | Hai cấp, dữ liệu, an ninh, lưu trữ, chuyển tiếp hộ tịch | Văn bản [17], [18], [24] đến [28] |
| 4. Chín nhóm chức năng | Đối chiếu chức năng, yêu cầu và kiểm thử | Chưa có quyền vào môi trường cán bộ để xác nhận từng chức năng |
| 5. Quy trình và ngoại lệ | Hai thủ tục, hạn, bổ sung, dừng, phối hợp | Nguồn [2], [22]; cần xác nhận nhánh cấu hình đang dùng |
| 6. Người dùng và khả năng tiếp cận | Công dân, đại diện, cán bộ, hỗ trợ, nhiều kênh | Cần khảo sát người dùng và thử với công nghệ hỗ trợ |
| 7. Dữ liệu và chất lượng | 35 thực thể, nguồn, lịch sử, tệp và chống trùng | Từ điển đề xuất; chưa có lược đồ vận hành thực tế |
| 8. Kiến trúc xử lý | Phân hệ, trạng thái, giao dịch và hàng đợi | Kiến trúc đề xuất; cần đặc tả nội bộ để đối chiếu |
| 9. Liên thông | Quốc gia, hệ thống bộ, phân tuyến và đối soát | Chỉ đạo [19]; chưa có hợp đồng giao tiếp từng đối tác |
| 10. Ký và giá trị kết quả | Phiên bản ký, kiểm tra, phát hành và giao nhận | Tập huấn [23]; cần chính sách khóa và chứng thư hiện hữu |
| 11. Bảo vệ dữ liệu | Mục đích, quyền, chia sẻ, yêu cầu và lưu giữ | Căn cứ [9], [24]; cần hồ sơ đánh giá và quy trình nội bộ |
| 12. An ninh hệ thống | Ranh giới tin cậy, kiểm soát truy cập, nhật ký | Căn cứ [25]; chưa có hồ sơ cấp độ và đánh giá hiện trạng |
| 13. Triển khai và chuyển đổi | Điều kiện đưa vào dùng, làm sạch và quay lui | Kế hoạch đề xuất; cần khối lượng dữ liệu và lịch triển khai |
| 14. Năng lực và hiệu năng | Mô hình tải, dung lượng, hàng đợi và tăng trưởng | Ví dụ tính minh họa; cần số đo giờ cao điểm thực tế |
| 15. Vận hành và sự cố | Giám sát, phân loại, khôi phục kết nối, đối soát | Quy trình đề xuất; cần nhật ký và mức dịch vụ được duyệt |
| 16. Liên tục phục vụ | Sao lưu, khôi phục, diễn tập và chuyển chế độ | Chưa có kết quả diễn tập của hệ thống đang vận hành |
| 17. Kiểm thử và nghiệm thu | 95 ca, truy vết, dữ liệu thử và bằng chứng | Các ca chưa thực hiện; cần môi trường và người nghiệm thu |
| 18. Kho và lưu trữ | Kho cá nhân, hồ sơ tác nghiệp, nộp lưu và biên nhận | Căn cứ [26], [27]; cần danh mục thời hạn và kết nối lưu trữ |
| 19. Kinh tế và nhà cung cấp | Chi phí ba năm, lợi ích, bàn giao và rủi ro | Chưa có hợp đồng, đơn giá và số liệu chi phí thực tế |
| 20. Hiệu quả và quản trị | Chỉ số, mẫu số, thay đổi và trách nhiệm | Báo cáo công khai [20]; cần dữ liệu gốc để kiểm tra tác động |

### 7.7.2. Điều kiện khép kín nghiên cứu thực địa

Để chuyển từ nghiên cứu tài liệu sang đánh giá thực địa, cần đối chiếu chức năng trên môi trường được phép, phỏng vấn cán bộ ở từng vai trò và lấy mẫu hồ sơ theo cả trường hợp đúng hạn, bổ sung, từ chối, phối hợp và lỗi đồng bộ. Mỗi khoảng trống được ghi người cung cấp, ngày nhận, phiên bản và kết quả kiểm tra. Chứng cứ có dữ liệu cá nhân phải được xử lý theo mục đích nghiên cứu và phạm vi được phép; báo cáo chỉ sử dụng phần đã ẩn danh phù hợp.

Đánh giá tác động cần so sánh các hồ sơ tương đồng về thủ tục, mức phức tạp, cơ quan và thời điểm. Số liệu công khai sáu tháng đầu năm 2026 mô tả kết quả trong một kỳ; không tự chứng minh riêng phần đóng góp của phần mềm hoặc của một thay đổi quy trình. Khảo sát hài lòng phải nêu tỷ lệ phản hồi và khả năng người không phản hồi có đặc điểm khác. Hồ sơ được cán bộ hỗ trợ nhập trực tuyến cần được nhận diện khi đánh giá khả năng người dân tự sử dụng dịch vụ. [20]

## 7.8. Kết luận và giới hạn

Nghiên cứu lựa chọn Hệ thống thông tin giải quyết thủ tục hành chính thành phố Hà Nội, có bằng chứng vận hành và sử dụng thực tế. Báo cáo phân tích chín nhóm chức năng và hai mươi khía cạnh của vòng đời hệ thống, đồng thời dùng nhánh cấp bản sao trích lục hộ tịch theo phương án 1811 và thủ tục cấp bản sao từ sổ gốc theo Quyết định 663 để kiểm tra chiều sâu nghiệp vụ. Phạm vi năm 2026 được đặt trong quan hệ với Cổng Dịch vụ công quốc gia và các hệ thống tập trung của bộ, tránh giả định toàn bộ hồ sơ đều xử lý trên một hệ thống thành phố. [1], [15], [18], [19], [22], [23]

Giới hạn của nghiên cứu là chưa được tiếp cận đặc tả nội bộ, môi trường cán bộ, nhật ký và kết quả thử của hệ thống vận hành. Do đó, phần kiến trúc, dữ liệu và giao tiếp là phương án đề xuất; các mục tiêu dịch vụ cần được xác nhận; hiệu quả dự kiến của văn bản chưa được coi là kết quả đo. Bước phát triển tiếp theo là khảo sát có sự phối hợp của đơn vị sử dụng, kiểm tra từng khoảng trống chứng cứ và thử nghiệm bộ thiết kế trên môi trường được phép.

Kết luận về chất lượng một hệ thống quản lý hành chính cần dựa vào khả năng giải quyết hồ sơ đúng thẩm quyền, đúng hạn và có bằng chứng, đồng thời bảo vệ dữ liệu và duy trì phục vụ. Hình thức trình bày nhất quán giúp người đọc theo dõi lập luận, nhưng giá trị của báo cáo vẫn phụ thuộc sự chính xác của nguồn và khả năng kiểm chứng các quyết định thiết kế.
