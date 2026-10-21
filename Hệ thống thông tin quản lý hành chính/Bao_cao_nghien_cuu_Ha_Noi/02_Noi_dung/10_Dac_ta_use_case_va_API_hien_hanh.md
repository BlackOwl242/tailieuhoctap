# Đặc tả use case và API sau biên tập

Cập nhật ngày 21/10/2026. Phần dưới diễn giải yêu cầu thiết kế; mức triển khai được ghi riêng để đối chiếu với ứng dụng. Tên trường, kiểu dữ liệu và các điều kiện chi tiết được giữ trong các tệp JSON hiện có.

## Quy ước API

Phản hồi thành công theo đặc tả dùng mã 200 và các trường maTuongQuan, duLieu, phienBanMoi. Các mã lỗi chung là 400, 401, 403, 404, 409, 422 và 503; ý nghĩa được giữ trong Hop_dong_36_thao_tac.json. POST dùng khóa yêu cầu theo người gọi và nội dung; GET không áp dụng khóa chống lặp.

## UC01 Quản lý tài khoản

Quyền được cấp theo đề nghị có căn cứ và thời hạn. Người duyệt phải khác người đề nghị; hệ thống lưu lịch sử để xác định quyền của cán bộ tại từng thời điểm.

**Điều kiện:** Người đề nghị không tự phê duyệt quyền của mình

**Hậu điều kiện:** Quyền đã được phê duyệt được áp dụng theo thời hạn; hệ thống lưu người phê duyệt và lịch sử thay đổi quyền.

**API tham chiếu:** `POST /api/v1/nghiep-vu/capQuyen`.

**Kết quả trả về:** Trả thông tin quyền được áp dụng, thời hạn và phiên bản tài khoản sau khi quyết định cấp quyền được lưu.

**Tình huống lỗi riêng:** Người đề nghị tự duyệt quyền; đề nghị chưa được duyệt hoặc quyền đã hết thời hạn.

## UC02 Quản lý danh mục dùng chung

Danh mục cung cấp mã và thông tin dùng chung cho các phân hệ. Mỗi bản cập nhật gắn với nguồn và khoảng hiệu lực. Ứng dụng hiện đã lưu lịch sử chỉnh sửa; việc quản lý hiệu lực liên ngành cần tiếp tục hoàn thiện.

**Điều kiện:** Mã không trùng và khoảng hiệu lực không chồng lấn

**Hậu điều kiện:** Danh mục có bản cập nhật với mã, nguồn và thời gian hiệu lực. Thông tin cũ được giữ để tra cứu hồ sơ đã tiếp nhận.

**API tham chiếu:** `POST /api/v1/nghiep-vu/congBoDanhMuc`.

**Kết quả trả về:** Trả bản danh mục đã cập nhật, gồm mã, nguồn và khoảng hiệu lực.

**Tình huống lỗi riêng:** Mã danh mục bị trùng hoặc khoảng hiệu lực chồng lấn với bản đang sử dụng.

## UC03 Công bố phiên bản thủ tục

Theo thiết kế, phiên bản thủ tục phải được duyệt và công bố theo ngày hiệu lực. Hồ sơ đang giải quyết giữ phiên bản đã tiếp nhận. Ứng dụng hiện mới hỗ trợ lưu thay đổi và phiên bản, chưa có đầy đủ quy trình duyệt công bố.

**Điều kiện:** Quyết định và tuyến xử lý đã được phê duyệt

**Hậu điều kiện:** Phiên bản thủ tục được công bố theo ngày hiệu lực. Hồ sơ đang giải quyết tiếp tục sử dụng phiên bản đã gắn khi tiếp nhận.

**API tham chiếu:** `POST /api/v1/nghiep-vu/congBoPhienBan`.

**Kết quả trả về:** Trả phiên bản thủ tục đã công bố và ngày bắt đầu áp dụng.

**Tình huống lỗi riêng:** Thiếu quyết định, tuyến xử lý chưa được duyệt hoặc yêu cầu sửa phiên bản đã gắn với hồ sơ.

## UC04 Cấu hình trạng thái hồ sơ

Cấu hình xác định trạng thái, sự kiện và quyền chuyển bước. Theo thiết kế, các đường chuyển trạng thái phải được kiểm tra và phê duyệt trước khi áp dụng. Ứng dụng hiện quy định các điều kiện này trong mã nguồn và tệp cấu hình, chưa có màn hình biên tập trạng thái.

**Điều kiện:** Các bước kết thúc đều có thể đạt tới từ bước bắt đầu; thao tác chuyển bước phải đúng quyền.

**Hậu điều kiện:** Cấu hình lưu các trạng thái, sự kiện, điều kiện và quyền chuyển bước đã được kiểm tra, phê duyệt.

**API tham chiếu:** `POST /api/v1/nghiep-vu/cauHinhTrangThai`.

**Kết quả trả về:** Trả cấu hình trạng thái cùng kết quả kiểm tra điều kiện chuyển bước.

**Tình huống lỗi riêng:** Nhánh không có đường kết thúc hoặc chuyển bước chưa được khai báo quyền hợp lệ.

## UC05 Chuẩn bị và gửi hồ sơ điện tử

Người nộp chọn thủ tục và cơ quan, kê khai thông tin, đính kèm tài liệu rồi kiểm tra trước khi gửi. Ứng dụng mở luồng năm bước cho hai thủ tục đã cấu hình. Sau khi lưu thành công, hồ sơ nhận mã để liên hệ và tra cứu theo quyền.

**Điều kiện:** Đúng chủ thể, đủ trường bắt buộc và đúng tuyến

**Hậu điều kiện:** Hồ sơ được lưu ở trạng thái chờ tiếp nhận, kèm tờ khai, tài liệu, cơ quan nhận và mã hồ sơ để người nộp theo dõi.

**API tham chiếu:** `POST /api/v1/nghiep-vu/guiYeuCau`.

**Kết quả trả về:** Trả mã hồ sơ và phiên bản sau khi tờ khai, tài liệu và cơ quan nhận đã được lưu.

**Tình huống lỗi riêng:** Thiếu trường hoặc tài liệu bắt buộc, sai chủ thể hay cơ quan; cùng mã gửi lại nhưng nội dung khác.

## UC06 Luân chuyển hồ sơ

Thiết kế bàn giao hồ sơ xác định đơn vị gửi, đơn vị nhận và thời điểm bên nhận xác nhận đủ thông tin. Ứng dụng hiện luân chuyển giữa các vai trò trong cùng cơ quan; tuyến bàn giao liên cơ quan còn cần phát triển.

**Điều kiện:** Đích có thẩm quyền và xác nhận nhận đủ

**Hậu điều kiện:** Gói bàn giao được lưu cùng đơn vị gửi, đơn vị nhận và xác nhận tiếp nhận. Mã hồ sơ, hạn giải quyết và trách nhiệm bàn giao được giữ lại.

**API tham chiếu:** `POST /api/v1/nghiep-vu/chuyenTuyen`.

**Kết quả trả về:** Trả kết quả bàn giao, đơn vị nhận và thông tin xác nhận còn cần theo dõi.

**Tình huống lỗi riêng:** Đơn vị nhận không có thẩm quyền hoặc chưa xác nhận nhận đủ gói bàn giao.

## UC07 Thực hiện bước quy trình

Cán bộ xem công việc được giao, ghi bằng chứng và thực hiện thao tác được phép. Máy chủ kiểm tra vai trò, trạng thái và phiên bản hồ sơ trước khi lưu để tránh ghi đè khi có cập nhật đồng thời.

**Điều kiện:** Đúng phân công, đúng trạng thái và đủ dữ liệu chuyển bước

**Hậu điều kiện:** Kết quả xử lý được ghi vào bước hiện tại; hồ sơ chuyển sang trạng thái được phép và lưu bằng chứng của người thực hiện.

**API tham chiếu:** `POST /api/v1/nghiep-vu/chuyenBuoc`.

**Kết quả trả về:** Trả trạng thái và phiên bản hồ sơ sau khi thực hiện bước xử lý.

**Tình huống lỗi riêng:** Sai phân công, thiếu bằng chứng hoặc phiên bản hồ sơ đã thay đổi.

## UC08 Theo dõi tiến trình hồ sơ

Người nộp dùng mã hồ sơ và khóa tra cứu để xem các mốc xử lý, thời hạn và yêu cầu bổ sung. Cán bộ theo dõi trong phạm vi cơ quan và nhiệm vụ được giao; ý kiến nội bộ được phân quyền riêng.

**Điều kiện:** Chủ thể có quyền xem hồ sơ này

**Hậu điều kiện:** Người yêu cầu xem được các mốc xử lý, thời hạn và thông báo công khai của hồ sơ thuộc quyền truy cập.

**API tham chiếu:** `GET /api/v1/nghiep-vu/xemTienTrinh`.

**Kết quả trả về:** Trả tiến trình, thời hạn và thông báo công khai trong phạm vi được xem.

**Tình huống lỗi riêng:** Hồ sơ không tồn tại trong phạm vi được xem hoặc chủ thể không đủ quyền truy cập.

## UC09 Thiết kế quy trình trực quan

Chức năng đề xuất cho phép tạo các bước xử lý và điều kiện chuyển bước. Bản quy trình được kiểm tra cấu trúc, gồm cách tổng hợp các nhánh song song, trước khi trình phê duyệt. Ứng dụng hiện chưa có màn hình thiết kế quy trình trực quan.

**Điều kiện:** Đồ thị hợp lệ, mọi nhánh có lối ra được xác định

**Hậu điều kiện:** Bản quy trình lưu các bước, điều kiện và kết quả kiểm tra cấu trúc. Chỉ bản hợp lệ mới được trình phê duyệt để áp dụng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/kiemTraDoThi`.

**Kết quả trả về:** Trả kết quả kiểm tra đồ thị và bản quy trình đủ điều kiện trình duyệt.

**Tình huống lỗi riêng:** Đồ thị không hợp lệ, nhánh thiếu lối ra hoặc thiếu quy tắc tổng hợp khi xử lý song song.

## UC10 Ký kết quả theo thẩm quyền

Người ký kiểm tra đúng phiên bản dự thảo đã duyệt trước khi ký. Ứng dụng hiện dùng chữ ký Ed25519 nội bộ và lưu người ký, thời điểm, giá trị băm. Việc dùng chứng thư số công vụ cần được tích hợp riêng.

**Điều kiện:** Dự thảo được duyệt, chứng thư phù hợp và còn giá trị

**Hậu điều kiện:** Chữ ký hợp lệ được gắn với đúng phiên bản dự thảo đã duyệt; hệ thống lưu người ký, thời điểm và kết quả kiểm tra chữ ký.

**API tham chiếu:** `POST /api/v1/nghiep-vu/kyBanDuThao`.

**Kết quả trả về:** Trả phiên bản tài liệu đã ký và kết quả kiểm tra chữ ký trên chính tài liệu đó.

**Tình huống lỗi riêng:** Dự thảo chưa được duyệt, tệp không khớp giá trị băm hoặc chứng thư không đạt điều kiện.

## UC11 Kết nối dịch vụ ký

Thiết kế kết nối dịch vụ ký yêu cầu cấu hình xác thực riêng và kiểm tra phản hồi trên tài liệu được phép. Khóa bí mật được quản lý tách khỏi hồ sơ. Ứng dụng hiện chưa kết nối nhà cung cấp chứng thư công vụ.

**Điều kiện:** Đúng hợp đồng và môi trường đã được cấp phép

**Hậu điều kiện:** Cấu hình dịch vụ ký và kết quả kết nối thử được lưu. Dịch vụ chỉ được sử dụng cho nghiệp vụ sau khi kiểm tra đạt yêu cầu.

**API tham chiếu:** `POST /api/v1/nghiep-vu/kiemTraKetNoiKy`.

**Kết quả trả về:** Trả kết quả kiểm tra kết nối dịch vụ ký và thông tin cấu hình được phép công khai.

**Tình huống lỗi riêng:** Sai cấu hình xác thực, chưa được cấp môi trường hoặc phản hồi dịch vụ ký không hợp lệ.

## UC12 Kiểm tra và tiếp nhận hồ sơ

Cán bộ kiểm tra chủ thể, thành phần và thẩm quyền rồi chọn tiếp nhận, yêu cầu bổ sung hoặc từ chối có căn cứ. Hồ sơ đủ điều kiện được lập giấy hẹn; thời hạn được tính theo thủ tục và lịch làm việc.

**Điều kiện:** Đủ điều kiện theo phiên bản thủ tục đang áp dụng

**Hậu điều kiện:** Hồ sơ đủ điều kiện chuyển sang đã tiếp nhận và có giấy hẹn theo quy tắc thời hạn của thủ tục. Hồ sơ chưa đủ điều kiện nhận thông báo tương ứng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/tiepNhan`.

**Kết quả trả về:** Trả hồ sơ đã tiếp nhận, phiên bản mới và thông tin giấy hẹn.

**Tình huống lỗi riêng:** Hồ sơ chưa đủ thành phần, sai thẩm quyền hoặc không đáp ứng phiên bản thủ tục áp dụng.

## UC13 Yêu cầu và nhận bổ sung

Yêu cầu bổ sung nêu rõ tài liệu còn thiếu và căn cứ. Khi người nộp phản hồi, cán bộ đối chiếu với yêu cầu đang mở trước khi cho hồ sơ tiếp tục từ giai đoạn đã lưu. Điều chỉnh hạn được ghi nhận theo quy định áp dụng.

**Điều kiện:** Bổ sung được đối chiếu với đúng yêu cầu còn mở

**Hậu điều kiện:** Tài liệu bổ sung được gắn với yêu cầu còn mở. Sau khi cán bộ xác nhận đủ, hồ sơ tiếp tục từ giai đoạn đã lưu và ghi nhận điều chỉnh hạn theo quy định.

**API tham chiếu:** `POST /api/v1/nghiep-vu/ghiNhanBoSung`.

**Kết quả trả về:** Trả kết quả đối chiếu tài liệu bổ sung, giai đoạn tiếp tục xử lý và thông tin hạn được áp dụng.

**Tình huống lỗi riêng:** Không có yêu cầu bổ sung còn mở hoặc tài liệu phản hồi chưa đáp ứng nội dung được yêu cầu.

## UC14 Phân công xử lý

Người được giao hồ sơ phải còn quyền và thuộc cơ quan giải quyết. Khi phân công lại, hệ thống kết thúc phân công cũ, lưu người nhận mới và thời điểm bàn giao.

**Điều kiện:** Người nhận còn quyền và hồ sơ chưa kết thúc

**Hậu điều kiện:** Hồ sơ có người chịu trách nhiệm hiện hành. Phân công cũ được kết thúc và lịch sử bàn giao được lưu khi thay đổi người xử lý.

**API tham chiếu:** `POST /api/v1/nghiep-vu/giaoNhiemVu`.

**Kết quả trả về:** Trả người được phân công hiện hành cùng phiên bản phân công mới.

**Tình huống lỗi riêng:** Người nhận đã hết quyền, sai cơ quan hoặc hồ sơ đã kết thúc.

## UC15 Thẩm định và phối hợp

Chuyên viên lưu kết quả thẩm tra và căn cứ trước khi lập dự thảo, trình duyệt. Hai thủ tục đang mở có bước đối chiếu sổ gốc hoặc kiểm tra dữ liệu và nghĩa vụ tài chính riêng. Nhiệm vụ phối hợp liên cơ quan trong mô hình chưa được hiện thực đầy đủ.

**Điều kiện:** Đủ ý kiến bắt buộc hoặc có căn cứ xử lý thay thế

**Hậu điều kiện:** Dự thảo được lập từ dữ liệu và ý kiến đã kiểm tra; hồ sơ lưu căn cứ thẩm định và những ý kiến phối hợp cần thiết để trình duyệt.

**API tham chiếu:** `POST /api/v1/nghiep-vu/tongHopYKien`.

**Kết quả trả về:** Trả bản tổng hợp ý kiến hợp lệ, căn cứ thẩm định và tham chiếu dự thảo.

**Tình huống lỗi riêng:** Thiếu ý kiến bắt buộc, chưa đủ căn cứ thẩm định hoặc dùng phản hồi lỗi làm dữ liệu kết luận.

## UC16 Phê duyệt và phát hành

Lãnh đạo duyệt hoặc trả lại dự thảo để sửa. Người được cấp quyền ký ký bản đã duyệt; văn thư kiểm tra điều kiện, cấp số và phát hành. Bản kết quả đã ký được giữ nguyên để phục vụ giao nhận và tra cứu.

**Điều kiện:** Đúng thẩm quyền, chữ ký hợp lệ và đủ căn cứ

**Hậu điều kiện:** Kết quả được phát hành với số văn bản, người ký và phiên bản đã duyệt. Nội dung đã ký được giữ nguyên để giao nhận và tra cứu.

**API tham chiếu:** `POST /api/v1/nghiep-vu/phatHanh`.

**Kết quả trả về:** Trả số văn bản, bản kết quả phát hành và thời điểm phát hành.

**Tình huống lỗi riêng:** Chưa đủ phê duyệt, chữ ký không hợp lệ hoặc bản phát hành khác phiên bản đã ký.

## UC17 Dừng giải quyết theo yêu cầu

Bộ phận Một cửa tiếp nhận Mẫu 05, kiểm tra người yêu cầu, kênh, thời điểm và tình trạng giải quyết. Nếu đáp ứng điều kiện, Mẫu 06 được lập để người có thẩm quyền ký và phát hành. Sau đó hồ sơ mới được ghi nhận dừng; việc trả giấy tờ và hoàn phí được theo dõi riêng.

**Điều kiện:** Chỉ nhận yêu cầu trực tiếp/bưu chính sau khi hồ sơ được tiếp nhận hợp lệ và trước khi ban hành quyết định hoặc văn bản thông báo kết quả; không dừng khi đã có kết quả/thông báo hoặc thuộc ngoại lệ chuyên ngành; chỉ tài khoản có quyền ký còn hiệu lực mới ghi nhận phát hành

**Hậu điều kiện:** Yêu cầu dừng và Thông báo dừng được lưu. Hồ sơ chỉ chuyển sang DUNG sau khi Mẫu 06 đã được ký, phát hành; việc trả giấy tờ và hoàn phí được theo dõi riêng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/chuanBiThongBaoDung`.

**Kết quả trả về:** Trả bản Thông báo dừng được chuẩn bị và kết quả kiểm tra điều kiện. Ký, phát hành Mẫu 06 được thực hiện bằng lệnh riêng tại mục 6.2.

**Tình huống lỗi riêng:** Yêu cầu không đúng chủ thể, kênh hoặc thời điểm; đã có kết quả; người phát hành thiếu quyền ký còn hiệu lực.

## UC18 Giao và xác nhận kết quả

Cán bộ xác minh người nhận và phương thức đã đăng ký trước khi giao kết quả. Hệ thống lưu thời điểm, kênh và chứng cứ giao; trường hợp chưa giao được phải ghi lý do để tiếp tục xử lý.

**Điều kiện:** Người nhận có quyền, kết quả đã phát hành

**Hậu điều kiện:** Hệ thống lưu người nhận, thời điểm, phương thức và chứng cứ giao. Nếu chưa giao được, hồ sơ ghi lý do để tiếp tục theo dõi.

**API tham chiếu:** `POST /api/v1/nghiep-vu/xacNhanGiao`.

**Kết quả trả về:** Trả thông tin giao nhận đã lưu, gồm người nhận, kênh và chứng cứ.

**Tình huống lỗi riêng:** Kết quả chưa phát hành, người nhận chưa được xác minh hoặc chưa có chứng cứ giao nhận.

## UC19 In và kết xuất tài liệu

Người dùng chọn mẫu hoặc kết quả, kiểm tra phiên bản rồi xem trước khi in hay tải tệp. Bản dự thảo được ghi rõ để người nhận phân biệt với bản đã phát hành.

**Điều kiện:** Có quyền kết xuất và dùng đúng mẫu

**Hậu điều kiện:** Người dùng nhận bản in hoặc tệp đúng mẫu, đúng phiên bản và phạm vi được phép; hệ thống ghi nhận lần kết xuất.

**API tham chiếu:** `POST /api/v1/nghiep-vu/ketXuatTaiLieu`.

**Kết quả trả về:** Trả bản in hoặc tệp kết xuất đúng mẫu và phiên bản được phép.

**Tình huống lỗi riêng:** Thiếu quyền kết xuất, chọn sai mẫu hoặc tài liệu không đúng phiên bản được phép.

## UC20 Gửi thông báo và nhắc việc

Thông báo phát sinh từ sự kiện hồ sơ hoặc lịch nhắc. Thiết kế quy định nơi nhận, kênh gửi và cách theo dõi lỗi. Ứng dụng hiện hiển thị thông tin trong hệ thống, chưa gửi SMS hoặc email tự động.

**Điều kiện:** Đúng người nhận, đúng mục đích và mức công khai

**Hậu điều kiện:** Thông báo được tạo cho đúng người nhận, kênh và sự kiện. Kết quả gửi hoặc lỗi gửi được lưu để theo dõi và thử lại.

**API tham chiếu:** `POST /api/v1/nghiep-vu/lapThongBao`.

**Kết quả trả về:** Trả mã thông báo, nơi nhận, kênh gửi và trạng thái xử lý thông báo.

**Tình huống lỗi riêng:** Nơi nhận, kênh hoặc mức công khai không phù hợp; gửi lại làm thay đổi mã thông báo.

## UC21 Tra cứu theo phạm vi

Kết quả tìm kiếm được lọc theo quyền trước khi hiển thị danh sách, tổng số hoặc cho kết xuất. Người dùng chỉ mở được hồ sơ trong phạm vi được giao.

**Điều kiện:** Phạm vi quyền được áp dụng trước khi trả kết quả

**Hậu điều kiện:** Kết quả tìm kiếm, tổng số và dữ liệu kết xuất chỉ gồm hồ sơ thuộc phạm vi được cấp quyền; việc tra cứu không thay đổi trạng thái hồ sơ.

**API tham chiếu:** `GET /api/v1/nghiep-vu/timKiemCoQuyen`.

**Kết quả trả về:** Trả danh sách phân trang và tổng số đã lọc theo quyền.

**Tình huống lỗi riêng:** Bộ lọc vượt phạm vi được cấp quyền hoặc kết quả tổng hợp có thể làm lộ hồ sơ ngoài quyền.

## UC22 Tra cứu hướng dẫn cho cán bộ

Cẩm nang hiện hướng dẫn thao tác theo trách nhiệm và có liên kết mở chức năng. Mô hình còn đề xuất kho hướng dẫn theo ngày hiệu lực và tra cứu toàn văn; các khả năng này chưa được triển khai đầy đủ.

**Điều kiện:** Tài liệu còn hiệu lực và có nguồn kiểm chứng

**Hậu điều kiện:** Cán bộ nhận được hướng dẫn kèm nguồn và thời điểm áp dụng. Tài liệu hết hiệu lực được nhận diện trước khi dùng làm căn cứ xử lý.

**API tham chiếu:** `GET /api/v1/nghiep-vu/traCuuCanCu`.

**Kết quả trả về:** Trả hướng dẫn, nguồn và thông tin hiệu lực phù hợp ngày áp dụng.

**Tình huống lỗi riêng:** Không có nguồn phù hợp ngày áp dụng hoặc tài liệu hướng dẫn đã hết hiệu lực.

## UC23 Tổng hợp báo cáo theo kỳ

Báo cáo tổng hợp hồ sơ theo mẫu, cơ quan và kỳ thống kê. Người lập đối chiếu tổng số và các trường hợp loại trừ trước khi kết xuất. Báo cáo vận hành trong ứng dụng sử dụng dữ liệu cục bộ; kết nối báo cáo ngoài cần phát triển thêm.

**Điều kiện:** Mẫu được duyệt và dữ liệu thuộc phạm vi được giao

**Hậu điều kiện:** Báo cáo thể hiện mẫu, kỳ thống kê, nguồn dữ liệu và thời điểm tổng hợp; các số liệu và trường hợp loại trừ có thể được đối chiếu lại.

**API tham chiếu:** `GET /api/v1/nghiep-vu/tongHopBaoCao`.

**Kết quả trả về:** Trả báo cáo theo mẫu, kỳ, cơ quan và thời điểm tổng hợp đã chọn.

**Tình huống lỗi riêng:** Chưa xác định mẫu hay kỳ, dữ liệu ngoài phạm vi hoặc tổng hợp trùng hồ sơ giữa các nguồn.

## UC24 Quản lý mẫu báo cáo

Theo thiết kế, mẫu báo cáo lưu công thức, điều kiện loại trừ và phiên bản được phê duyệt. Ứng dụng hiện dùng mẫu đã lập trình, chưa có công cụ cho người quản trị tự thiết kế và công bố mẫu mới.

**Điều kiện:** Công thức có mẫu đối chiếu và người phê duyệt

**Hậu điều kiện:** Phiên bản mẫu báo cáo được công bố cùng công thức và điều kiện loại trừ đã duyệt. Các báo cáo đã lập giữ nguyên phiên bản mẫu áp dụng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/congBoMauBaoCao`.

**Kết quả trả về:** Trả phiên bản mẫu báo cáo và công thức được công bố.

**Tình huống lỗi riêng:** Công thức chưa được kiểm tra, thiếu người phê duyệt hoặc sửa mẫu của báo cáo đã lập.

## UC25 Thống kê hồ sơ

Người dùng chọn chỉ tiêu, cơ quan và khoảng thời gian để xem số liệu. Kết quả cần đi kèm công thức, thời điểm cập nhật và dữ liệu hồ sơ dùng để đối chiếu theo quyền.

**Điều kiện:** Tập hồ sơ chuẩn và quy tắc mẫu số đã được xác định

**Hậu điều kiện:** Kết quả thống kê hiển thị chỉ tiêu, cơ quan, khoảng thời gian và công thức tính; người có quyền có thể đối chiếu các hồ sơ tạo nên chỉ tiêu.

**API tham chiếu:** `GET /api/v1/nghiep-vu/thongKeHoSo`.

**Kết quả trả về:** Trả số liệu thống kê cùng chỉ tiêu, công thức và khoảng thời gian áp dụng.

**Tình huống lỗi riêng:** Chưa xác định công thức, mẫu số hoặc nguồn hồ sơ; dữ liệu chưa được cập nhật đầy đủ.

## UC26 Theo dõi và truy vấn điều hành

Màn hình giám sát cho biết hồ sơ sắp hạn, quá hạn và cán bộ đang phụ trách. Lãnh đạo dùng thông tin này để đôn đốc xử lý; cảnh báo không tự làm thay đổi thời hạn giải quyết.

**Điều kiện:** Chỉ truy vấn đơn vị được giao quản lý

**Hậu điều kiện:** Lãnh đạo xem được hồ sơ cần theo dõi và người phụ trách trong đơn vị được giao quản lý. Cảnh báo giữ nguyên thời hạn pháp lý của hồ sơ.

**API tham chiếu:** `GET /api/v1/nghiep-vu/truyVanDieuHanh`.

**Kết quả trả về:** Trả danh sách hồ sơ cần theo dõi và người phụ trách trong phạm vi quản lý.

**Tình huống lỗi riêng:** Truy vấn đơn vị ngoài quyền quản lý hoặc bộ lọc thời hạn không hợp lệ.

## UC27 Ban hành chỉ đạo xử lý

Thiết kế chỉ đạo điều hành có người nhận, trách nhiệm và hạn phản hồi riêng. Ứng dụng hiện lưu ý kiến khi duyệt, trả lại hoặc từ chối; quy trình ban hành và theo dõi văn bản chỉ đạo còn cần bổ sung.

**Điều kiện:** Người chỉ đạo có quyền và nơi nhận được xác định

**Hậu điều kiện:** Chỉ đạo được lưu với nội dung, nơi nhận, người chịu trách nhiệm và hạn phản hồi; tiến độ tiếp nhận và trả lời được theo dõi riêng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/banHanhChiDao`.

**Kết quả trả về:** Trả chỉ đạo đã lưu với nơi nhận, trách nhiệm và hạn phản hồi.

**Tình huống lỗi riêng:** Người chỉ đạo thiếu quyền, nơi nhận chưa được xác định hoặc nội dung vượt thẩm quyền.

## UC28 Quản trị tài liệu trong kho

Mô hình kho tài liệu quản lý nguồn, phiên bản, hiệu lực và quyền khai thác. Ứng dụng hiện đã lưu tệp hồ sơ và kiểm tra quyền truy cập; phân loại và thời hạn bảo quản của kho chuyên ngành chưa hoàn thiện.

**Điều kiện:** Đúng chủ sở hữu, căn cứ quyền và hạn bảo quản

**Hậu điều kiện:** Tài liệu có thông tin phân loại, phiên bản và hiệu lực; quyền khai thác được cấp hoặc thu hồi theo chủ thể và căn cứ đã xác định.

**API tham chiếu:** `POST /api/v1/nghiep-vu/capQuyenKho`.

**Kết quả trả về:** Trả thông tin quyền khai thác tài liệu và thời hạn sau khi cập nhật.

**Tình huống lỗi riêng:** Không có căn cứ khai thác, sai chủ sở hữu hoặc quyền vượt thời hạn bảo quản cho phép.

## UC29 Tái sử dụng tài liệu trong kho

Theo thiết kế, người nộp chọn tài liệu được phép dùng lại và kiểm tra nội dung còn phù hợp với thủ tục đích. Hồ sơ giữ tham chiếu đến nguồn tài liệu. Ứng dụng hiện chưa có chức năng tái sử dụng tài liệu từ hồ sơ khác.

**Điều kiện:** Tài liệu hợp lệ, đúng chủ thể và phù hợp thủ tục đích

**Hậu điều kiện:** Hồ sơ ghi tham chiếu đến tài liệu nguồn còn hợp lệ, người sử dụng và thành phần được đáp ứng; việc dùng lại tuân theo quyền khai thác.

**API tham chiếu:** `POST /api/v1/nghiep-vu/dungLaiTaiLieu`.

**Kết quả trả về:** Trả tham chiếu tài liệu nguồn đã gắn với thành phần hồ sơ.

**Tình huống lỗi riêng:** Tài liệu đã bị thay thế, bị thu hồi quyền hoặc không phù hợp thành phần hồ sơ đích.

## UC30 Nhận sự kiện từ hệ thống kết nối

Giao tiếp đề xuất kiểm tra danh tính nguồn, nội dung, mã và thứ tự sự kiện trước khi áp dụng. Thông điệp trùng mã nhưng khác nội dung được giữ để đối chiếu. Ứng dụng hiện chưa có kết nối nhận sự kiện từ hệ thống đối tác.

**Điều kiện:** Nguồn hợp lệ, đúng hợp đồng và không sai thứ tự

**Hậu điều kiện:** Sự kiện hợp lệ được ghi nhận và áp dụng đúng thứ tự. Thông điệp trùng mã nhưng khác nội dung được tách riêng để đối chiếu.

**API tham chiếu:** `POST /api/v1/nghiep-vu/nhanSuKien`.

**Kết quả trả về:** Trả kết quả ghi nhận sự kiện, thứ tự áp dụng hoặc yêu cầu đối chiếu.

**Tình huống lỗi riêng:** Nguồn không được xác thực, sự kiện sai thứ tự hoặc trùng mã nhưng khác nội dung.

## UC31 Trao đổi với cổng quốc gia

Thiết kế trao đổi với cổng quốc gia dùng mã tương quan để theo dõi một yêu cầu qua nhiều lần gửi. Biên nhận và kết quả áp dụng được lưu riêng. Ứng dụng hiện có liên kết mở cổng, chưa gửi hồ sơ hoặc đồng bộ trạng thái qua API.

**Điều kiện:** Thông điệp được tạo từ giao dịch nghiệp vụ đã lưu

**Hậu điều kiện:** Thông điệp lưu mã tương quan và biên nhận của bên nhận. Nếu chưa có phản hồi hợp lệ, hệ thống giữ thông điệp để gửi lại và tiếp tục theo dõi.

**API tham chiếu:** `POST /api/v1/nghiep-vu/guiThongDiep`.

**Kết quả trả về:** Trả kết quả gửi, biên nhận hợp lệ hoặc thông tin cần gửi lại.

**Tình huống lỗi riêng:** Phản hồi không hợp lệ, chưa xác định bên nhận đã áp dụng hoặc dịch vụ ngoài chưa đáp ứng.

## UC32 Thanh toán khoản thu

Người nộp xem thông báo khoản thu rồi thực hiện nghĩa vụ qua phương thức được hỗ trợ. Ứng dụng hiện ghi giao dịch và chứng từ thử nghiệm; việc chuyển tiền qua ngân hàng hoặc Kho bạc chưa được tích hợp.

**Điều kiện:** Khoản thu thực sự áp dụng và đúng người trả

**Hậu điều kiện:** Giao dịch được gắn với khoản thu, người nộp và chứng từ. Trạng thái thanh toán chỉ được xác nhận theo phản hồi hoặc bằng chứng hợp lệ của quy trình áp dụng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/taoGiaoDichThu`.

**Kết quả trả về:** Trả giao dịch được tạo cho khoản thu và thông tin theo dõi thanh toán.

**Tình huống lỗi riêng:** Khoản thu không áp dụng, sai người nộp hoặc số tiền không khớp nghĩa vụ đã thông báo.

## UC33 Đối soát thu và hoàn

Cán bộ tài chính ghép giao dịch với khoản thu và chứng từ để đối soát. Chênh lệch cần có căn cứ xử lý; đề nghị hoàn được duyệt riêng trước khi ghi chứng từ thực hiện. Trong ứng dụng, các bước này được ghi nhận cục bộ.

**Điều kiện:** Thông báo được xác thực và mã giao dịch duy nhất

**Hậu điều kiện:** Giao dịch lưu kết quả đối soát hoặc chênh lệch cần xử lý. Đề nghị hoàn trả có quyết định phê duyệt và chứng từ thực hiện riêng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/doiSoat`.

**Kết quả trả về:** Trả kết quả đối soát và chênh lệch hoặc đề nghị hoàn cần xử lý.

**Tình huống lỗi riêng:** Thông báo chưa được xác thực, không ghép được giao dịch hoặc đề nghị hoàn chưa được duyệt.

## UC34 Số hóa hồ sơ giấy

Cán bộ quét đủ trang, kiểm tra chất lượng và đối chiếu với bản được xuất trình. Bản số hóa được lưu theo đúng thành phần hồ sơ, kèm nguồn, số trang, giá trị băm và thông tin xác nhận.

**Điều kiện:** Đọc được, đầy đủ, đúng hồ sơ và đúng quy định xác nhận

**Hậu điều kiện:** Bản số hóa được gắn đúng thành phần hồ sơ, kèm số trang, nguồn, giá trị băm và người xác nhận; phiên bản cũ được giữ để tra cứu.

**API tham chiếu:** `POST /api/v1/nghiep-vu/xacNhanSoHoa`.

**Kết quả trả về:** Trả phiên bản bản số hóa, số trang, nguồn và giá trị băm đã xác nhận.

**Tình huống lỗi riêng:** Tệp không đọc được, thiếu trang, sai thành phần hoặc thiếu xác nhận đúng thẩm quyền.

## UC35 Gửi phản ánh và đánh giá

Người dân gửi phản ánh hoặc đánh giá và giữ mã theo dõi. Cơ quan tiếp nhận trả lời hoặc yêu cầu làm rõ trong phạm vi được giao. Kết quả phản ánh không tự sửa quyết định giải quyết hồ sơ.

**Điều kiện:** Đúng kênh, không trùng yêu cầu cùng nội dung

**Hậu điều kiện:** Phản ánh hoặc đánh giá được lưu với nội dung và mã theo dõi; cơ quan tiếp nhận có thể trả lời hoặc yêu cầu bổ sung qua quy trình tương ứng.

**API tham chiếu:** `POST /api/v1/nghiep-vu/guiPhanAnh`.

**Kết quả trả về:** Trả mã theo dõi phản ánh hoặc đánh giá và thông tin tiếp nhận.

**Tình huống lỗi riêng:** Sai kênh tiếp nhận hoặc gửi trùng cùng nội dung; phản ánh không được dùng để tự sửa quyết định hồ sơ.

## UC36 Lập gói và nộp lưu hồ sơ

Thiết kế nộp lưu tập hợp hồ sơ kết thúc thành gói có danh mục và phiên bản rõ ràng. Tệp và giá trị băm được kiểm tra trước khi gửi, sau đó lưu biên nhận hoặc lý do trả lại của kho. Chức năng nộp lưu chưa có trong ứng dụng hiện tại.

**Điều kiện:** Hồ sơ kết thúc và đủ thành phần được duyệt

**Hậu điều kiện:** Gói nộp lưu có danh mục tệp, phiên bản và giá trị băm. Biên nhận của kho được lưu; gói bị trả lại giữ lý do để bổ sung đúng phiên bản.

**API tham chiếu:** `POST /api/v1/nghiep-vu/nopLuu`.

**Kết quả trả về:** Trả tham chiếu gói nộp lưu và biên nhận hoặc lý do kho trả lại gói.

**Tình huống lỗi riêng:** Hồ sơ chưa kết thúc, thiếu tệp, sai giá trị băm hoặc kho không chấp nhận gói nộp lưu.
