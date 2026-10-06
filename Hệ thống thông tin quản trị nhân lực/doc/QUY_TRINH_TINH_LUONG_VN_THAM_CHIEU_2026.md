# Quy trình tính lương Việt Nam — tham chiếu kỳ 2026

**Ngày rà soát:** 04/10/2026  
**Mục đích:** đặc tả quy trình nghiệp vụ cho bài tập HRMS và ghi rõ phần mã đã chạy so với phần chưa đủ căn cứ để coi là vận hành doanh nghiệp.

## Kết luận

Hệ thống đã có luồng chốt công → tính → đối soát → duyệt → khóa → ghi nhận thanh toán; tính lương dùng chính sách có phiên bản và lưu snapshot theo kỳ. Đợt sửa gần đây bổ sung lịch làm việc theo nhân viên, căn cứ bảo hiểm có thể đánh dấu theo cấu phần, cờ cấu phần làm căn cứ OT, quy đổi khoản lương thường xuyên đủ điều kiện ra đơn giá OT, cảnh báo đối chiếu lương tối thiểu tháng/giờ theo vùng, khấu trừ 10% cơ bản cho người cư trú không có hợp đồng/ngắn hạn đủ điều kiện và yêu cầu mã chứng từ trước khi kỳ được ghi là đã trả. Đây vẫn là nền tảng học tập/chạy thử, chưa phải dịch vụ C&B hoàn chỉnh: còn thiếu xác minh chứng từ thuế/BHXH, áp dụng các ngoại lệ theo hồ sơ, phân loại lương tháng/giờ/bán thời gian đầy đủ, quyết toán năm và đối soát tiền chi thực tế.

## Trình tự nghiệp vụ đề xuất

1. **Chốt dữ liệu nhân sự có hiệu lực:** hợp đồng và phụ lục lương, chức danh, đơn vị/vùng lương, ngày bắt đầu/kết thúc, căn cứ đóng bảo hiểm, mã số thuế, tình trạng cư trú, người phụ thuộc đã đăng ký, tài khoản nhận lương, cấu trúc lương và ủy quyền khấu trừ khoản vay.
2. **Chốt đầu vào theo kỳ:** ngày công và phép đã duyệt, ngày lễ, giờ làm ban đêm, OT đã duyệt, thưởng/quyết định có hiệu lực, phụ cấp và các khoản khấu trừ có hồ sơ. Khóa phiên bản công; mọi mở lại phải có lý do và lưu dấu vết.
3. **Tính lương gộp:** lấy lương theo hợp đồng/điều chỉnh hiệu lực từng ngày; tính theo công được hưởng, các thành phần lương theo cấu hình, OT theo loại ngày và phần ban đêm, tiền làm việc ban đêm, thưởng và truy lĩnh/truy thu.
4. **Tính phần đóng bảo hiểm:** xác định người thuộc diện tham gia, căn cứ đóng từ hợp đồng theo cấu phần pháp luật, ngày không đóng nếu có, mức sàn/trần đúng đối tượng và ngày hiệu lực; tách phần người lao động với phần người sử dụng lao động. Ghi rõ cả tiền kinh phí công đoàn ở chi phí doanh nghiệp; đoàn phí người lao động chỉ khấu trừ khi thuộc diện và có căn cứ.
5. **Khấu trừ thuế:** phân loại từng khoản chịu thuế/miễn thuế, trừ bảo hiểm bắt buộc và giảm trừ đã đăng ký; áp biểu thuế, cư trú, loại thu nhập và chính sách có hiệu lực theo kỳ. Giữ riêng phần thu nhập miễn thuế và chứng từ chứng minh.
6. **Khấu trừ khác:** chỉ áp dụng khoản đã được duyệt và có căn cứ (tạm ứng, hoàn ứng, khoản vay theo lịch trả đã thỏa thuận, khấu trừ hợp pháp khác). Không cho tổng khấu trừ vượt số thu nhập còn được trả; thiếu khả năng khấu trừ phải chuyển phần còn thiếu sang kỳ sau theo thỏa thuận/quy định.
7. **Rà soát độc lập:** người đối soát không phải người tính; kiểm tra tổng công, người hưởng lương, biến động lớn, lương tối thiểu, mức đóng, thuế, nợ vay, số âm, tài khoản trùng/lỗi và cân đối `gross − deductions = net`.
8. **Phê duyệt và khóa:** lãnh đạo phê duyệt; người tính không tự duyệt/khóa. Sau khi khóa chỉ sửa bằng quy trình mở lại có lý do hoặc bút toán điều chỉnh kỳ sau, không ghi đè phiếu lương đã duyệt.
9. **Thanh toán và đối chiếu:** lập lệnh ngân hàng/bảng chuyển khoản, lưu mã tham chiếu và ngày chi; đối chiếu tổng lệnh với tổng net, xử lý giao dịch trả về; chỉ đánh dấu đã chi sau khi có bằng chứng ngân hàng.
10. **Lưu trữ/đối soát nghĩa vụ:** lưu snapshot công, hợp đồng, chính sách, bảng lương, bằng chứng duyệt và chi; lập báo cáo khấu trừ/đóng nộp, quyết toán thuế năm, điều chỉnh BHXH và chứng từ kế toán theo kỳ.

## Tham số pháp lý đang dùng làm mốc

- **Thuế TNCN năm 2025:** áp dụng biểu 7 bậc và giảm trừ 11 triệu đồng/tháng cho bản thân, 4,4 triệu cho mỗi người phụ thuộc.
- **Thuế TNCN kỳ năm 2026:** biểu lũy tiến 5 bậc: đến 10 triệu 5%; trên 10–30 triệu 10%; trên 30–60 triệu 20%; trên 60–100 triệu 30%; trên 100 triệu 35%. Mức giảm trừ là 15,5 triệu/tháng cho bản thân và 6,2 triệu/người phụ thuộc. Riêng từ 01/07/2026, Nghị định 253/2026 hướng dẫn khấu trừ: người không ký HĐLĐ hoặc hợp đồng dưới 3 tháng bị khấu trừ 10% khi trả từ 5 triệu đồng/lần (dưới mức này, khấu trừ 10% nếu cá nhân yêu cầu). Nghị định cũng cho phép cá nhân cư trú có hồ sơ đủ điều kiện giảm trừ chi y tế trong nước tối đa 23 triệu/năm và giáo dục/đào tạo trong nước tối đa 24 triệu/năm; hệ thống hiện chưa quản lý chứng từ và phép giảm trừ này. Cần xử lý riêng người không cư trú, miễn thuế, các khoản chịu thuế và quyết toán năm. Thu nhập chịu thuế trừ bảo hiểm bắt buộc trước giảm trừ hợp lệ; cần nhận diện riêng miễn thuế đối với lương làm việc ban đêm và làm thêm giờ.
- **Ngày nghỉ hưởng lương năm 2026:** ngoài 11 ngày lễ/Tết theo Bộ luật Lao động, Nghị quyết 28/2026/QH16 bổ sung Ngày Văn hóa Việt Nam 24/11, thành 12 ngày hưởng lương. Mã đã được cập nhật để ngày 24/11 hằng năm từ 2026 được loại khỏi ngày công/ngày phép, kể cả khi cấu hình cơ sở dữ liệu đang có danh sách lễ rỗng. Các ngày lễ thay đổi theo lịch từng năm vẫn phải được C&B cấu hình và xác nhận; ngày nghỉ bù phụ thuộc lịch làm việc cũng cần được ghi vào lịch theo năm.
- **Mức lương tối thiểu vùng từ 01/01/2026:** vùng I 5.310.000 đồng/tháng hoặc 25.500 đồng/giờ; vùng II 4.730.000 hoặc 22.700; vùng III 4.140.000 hoặc 20.000; vùng IV 3.700.000 hoặc 17.800. Vùng lấy theo nơi hoạt động của người sử dụng lao động/chi nhánh; với hình thức trả lương khác phải quy đổi đúng thời giờ bình thường.
- **Trần căn cứ BHXH:** 20 lần mức tham chiếu; 46,8 triệu đồng/tháng đến hết 30/06/2026 và 50,6 triệu từ 01/07/2026 khi mức tham chiếu là 2,53 triệu. Tỷ lệ trong chính sách mặc định đang là người lao động 8% BHXH, 1,5% BHYT, 1% BHTN; doanh nghiệp 17% BHXH, 0,5% TNLĐ-BNN, 3% BHYT, 1% BHTN và 2% kinh phí công đoàn. Phải xác nhận đối tượng, căn cứ đóng và trường hợp được áp dụng tỷ lệ TNLĐ-BNN khác trước khi dùng.
- **BHTN:** trần tiền lương làm căn cứ đóng được giới hạn theo luật, gắn với 20 lần mức lương tối thiểu vùng; chính sách phần mềm hiện dùng vùng lương nhân 20.
- **OT:** tối thiểu 150% ngày thường, 200% ngày nghỉ hằng tuần, 300% ngày lễ/nghỉ hưởng lương. Làm việc ban đêm có thêm tối thiểu 30%; OT vào ban đêm còn cộng thêm 20% căn cứ theo mức tiền lương làm việc ban ngày tương ứng. Với quy ước chính sách đã cấu hình, tổng OT đêm tối thiểu lần lượt là 200%, 270%, 390%; ngày lễ đối với người hưởng lương tháng còn phải xử lý riêng tiền ngày lễ đã nằm trong lương tháng. Giới hạn mặc định 40 giờ/tháng, 200 giờ/năm; trường hợp được tổ chức tới 300 giờ cần điều kiện, thủ tục và bằng chứng riêng, không thể coi giới hạn mặc định là ngoại lệ đầy đủ.
- **Khấu trừ khoản vay:** hệ thống dùng lịch trả nợ đã duyệt, dư nợ thực tế và số tiền ròng còn lại làm trần kỹ thuật. Tỷ lệ nội bộ 30% trước đây đã được bỏ vì đó không phải giới hạn chung cho mọi khoản vay. Cần lưu thỏa thuận/ủy quyền của người lao động; mức 30% trong luật lao động áp cho trường hợp khấu trừ lương để bồi thường thiệt hại tài sản theo điều kiện luật định, không được áp máy móc sang mọi khoản vay.

Các mức này cần được cập nhật thành chính sách có người phê duyệt, ngày hiệu lực, căn cứ và lịch sử. Thay đổi luật hoặc địa bàn phải tạo phiên bản mới; phiếu đã khóa giữ nguyên snapshot của kỳ, không âm thầm tính lại theo chính sách mới.

## Những phần hiện đã nối trong mã

- `attendance-periods` buộc chốt công trước khi tạo payroll run; lưu snapshot và phiên bản. Chấm công giữ phút làm đêm của ca được chốt để tính phụ trội 30%.
- Lịch ngày lễ tự động giữ ngày 24/11 hằng năm từ 2026 theo Nghị quyết 28/2026/QH16; các ngày nghỉ theo lịch năm (như Tết) vẫn lấy từ cấu hình `HOLIDAYS` và cần C&B xác nhận trước khi tính công/lương.
- `hrms-payroll` chọn chính sách theo ngày đầu kỳ; lấy hợp đồng/phụ lục và cấu trúc có hiệu lực; mẫu lịch làm việc mặc định là thứ Hai–thứ Sáu, còn lịch phân ca có thể chọn các ngày trong tuần cho từng nhân viên. Đơn giá OT dùng lương hợp đồng/cấu trúc tháng cộng cấu phần được C&B đánh dấu thuộc tiền lương theo công việc, chia tổng giờ làm việc bình thường theo lịch; khoản ăn ca `LUNCH_ALLOW` bị loại. Phiếu lưu và giải trình số tiền/tháng, giờ chuẩn và đơn giá giờ.
- Chính sách 2025/2026 lưu cả mức sàn lương tháng và giờ theo vùng. Khi tính bảng lương, phiếu đánh dấu để HR rà soát nếu mức tháng hoặc đơn giá giờ quy đổi thấp hơn mốc. Đây là cảnh báo, không tự chặn; hệ thống chưa có loại hình trả lương tháng/giờ và trạng thái bán thời gian đủ rõ để tự kết luận trường hợp dưới mức tháng có hợp lệ hay không.
- Cấu phần lương có cờ chịu thuế và cờ thuộc căn cứ bảo hiểm; phần bảo hiểm lấy mức trên hợp đồng hoặc lương cơ bản cộng các phụ cấp thường xuyên/ổn định đã đánh dấu. Nhân viên cư trú không có hợp đồng hoặc có hợp đồng ngắn hơn ba tháng được tính khấu trừ 10% khi khoản chi trả chịu thuế đạt ngưỡng 5 triệu đồng/lần.
- Trạng thái kỳ lương có bước tính → đối soát → duyệt → khóa → chi; ngăn người tính tự duyệt/khóa. Ghi “đã trả” phải nhập phương thức và mã giao dịch/chứng từ; khoản vay chỉ được ghi giảm dư nợ trong cùng giao dịch sau khi có xác nhận đó.
- Phép tính được kiểm thử với 0 công, lương giữa tháng, giảm trừ người phụ thuộc, khoản vay, thuế theo năm, OT đêm ba loại ngày, lịch làm thứ Bảy và mức khấu trừ 10%. E2E PostgreSQL kiểm tra công → giải trình → khóa công → lương → duyệt → nhập mã thanh toán.
- Tạm ứng ghi nhận kênh tiền mặt/chuyển khoản. Chỉ khoản tiền mặt đã có kênh mới xuất phiếu chi 02-TT; chuyển khoản dùng phiếu theo dõi nội bộ và cần kèm giấy báo nợ/ủy nhiệm chi.

## Những điều kiện còn thiếu trước khi gọi là quy trình doanh nghiệp hoàn chỉnh

1. Ràng buộc và lưu bằng chứng hồ sơ thuế/BHXH: mã số thuế, cư trú theo năm, người phụ thuộc, ngày đăng ký giảm trừ, loại đối tượng và thời gian tham gia. Nhánh khấu trừ 10% hiện là quy tắc cơ bản, chưa có quy trình kiểm duyệt cam kết để tạm thời không khấu trừ.
2. Cờ cấu phần bảo hiểm và cờ thành phần lương làm căn cứ OT đã có. Cảnh báo sàn lương vùng đã được thêm theo chính sách 2025/2026, nhưng vẫn cần HR xác nhận vùng theo nơi làm việc, hình thức trả lương và cách đánh dấu từng cấu phần; chưa đủ dữ liệu để tự chặn trường hợp lương tháng thấp nhưng là bán thời gian/trả theo giờ. Sàn/trần bảo hiểm theo mọi đối tượng và ngoại lệ chưa được tự kiểm tra hoàn chỉnh.
3. Chưa bao phủ đầy đủ PIT cho người không cư trú theo từng loại thu nhập, thu nhập nhiều nơi, quyết toán năm, hoàn/truy thu, miễn thuế đặc thù và giảm trừ y tế tối đa 23 triệu/năm, giáo dục tối đa 24 triệu/năm với chứng từ đủ điều kiện.
4. Căn cứ người lao động đồng ý cho khấu trừ vay, quản lý tạm ứng lương, điều chỉnh truy thu/truy lĩnh, nghỉ thai sản/ốm hưởng từ BHXH, người vào/nghỉ giữa kỳ, điều kiện dưới ngưỡng ngày tham gia và các trường hợp tỷ lệ đóng đặc biệt.
5. Hồ sơ chấp thuận OT trong ngoại lệ tới 300 giờ/năm, kiểm tra thời gian nghỉ, tổng giờ theo tuần/ngày, và phân tách chính xác giờ ca đêm thường với giờ OT đêm.
6. Mã giao dịch/chứng từ chi hiện được yêu cầu và lưu, nhưng người dùng vẫn nhập thủ công; chưa xác minh sao kê ngân hàng hoặc tự đối chiếu giao dịch thành công/trả về. Cũng chưa có tích hợp nộp tờ khai/quyết toán, đối chiếu số đã nộp với cơ quan quản lý.
7. So khớp phiếu lương/mẫu báo cáo, chứng từ kế toán và số tổng hợp với biểu mẫu/hệ thống kê khai hiện hành. Mẫu 02-TT là chứng từ chi tiền mặt theo kế toán doanh nghiệp, không dùng thay chứng từ ngân hàng.
8. Cần có màn hình cấu hình/lưu lịch nghỉ theo từng năm, người xác nhận và lịch sử thay đổi; hiện ngày 24/11/2026 đã được áp dụng bắt buộc, nhưng lịch Tết và các ngày nghỉ hoán đổi còn do quản trị cấu hình qua API.

## Nguồn chính thức

- [Luật Thuế TNCN số 109/2025/QH15 — nội dung và thời điểm áp dụng năm 2026](https://xaydungchinhsach.chinhphu.vn/gioi-thieu-luat-thue-thu-nhap-ca-nhan-so-109-2025-qh15-119260123145437408.htm)
- [Luật số 09/2026/QH16 sửa đổi các luật thuế](https://vanban.chinhphu.vn/?docid=218095&pageid=27160&typegroupid=3)
- [Nghị định 253/2026/NĐ-CP — hướng dẫn thi hành Luật Thuế TNCN](https://vanban.chinhphu.vn/?classid=1&docid=218684&pageid=27160)
- [Khấu trừ 10% với tiền công không HĐLĐ/dưới 3 tháng theo NĐ253](https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-khau-tru-thue-thu-nhap-ca-nhan-119260703150410707.htm)
- [Giảm trừ chi phí y tế, giáo dục theo NĐ253](https://xaydungchinhsach.chinhphu.vn/giam-tru-chi-phi-y-te-giao-duc-dao-tao-khi-tinh-thue-thu-nhap-ca-nhan-119260917164738421.htm)
- [Văn bản hợp nhất 112/VBHN-VPQH — Luật Thuế TNCN](https://xaydungchinhsach.chinhphu.vn/luat-thue-thu-nhap-ca-nhan-119260623093630882.htm)
- [Nghị định 293/2025/NĐ-CP — mức lương tối thiểu vùng 2026](https://xaydungchinhsach.chinhphu.vn/nghi-dinh-so-293-2025-nd-cp-quy-dinh-muc-luong-toi-thieu-doi-voi-nguoi-lao-dong-lam-viec-theo-hop-dong-lao-dong-119251110172808433.htm)
- [Nghị định 145/2020/NĐ-CP — căn cứ lương giờ và cách tính OT, Điều 54–57](https://vbpl.moj.gov.vn/bokehoachvadautu/Pages/vbpq-toanvan.aspx?ItemID=152668&Keyword=145%2F2020%2FN%C4%90-CP)
- [Luật BHXH số 41/2024/QH15](https://vanban.chinhphu.vn/?classid=1&docid=211199&orggroupid=1&pageid=27160)
- [Mức trần căn cứ BHXH từ 01/07/2026](https://xaydungchinhsach.chinhphu.vn/tu-1-7-nhieu-khoan-tro-cap-bhxh-thay-doi-the-nao-khi-luong-co-so-tang-119260523163024829.htm)
- [Luật Việc làm số 74/2025/QH15](https://vanban.chinhphu.vn/?classid=1&docid=214560&pageid=27160)
- [Toàn văn Nghị quyết 28/2026/QH16 — ngày 24/11 nghỉ làm hưởng nguyên lương](https://xaydungchinhsach.chinhphu.vn/toan-van-nghi-quyet-so-28-2026-qh16-ve-phat-trien-van-hoa-viet-nam-119260508142130402.htm)
- [Nghị định 374/2025/NĐ-CP — bảo hiểm thất nghiệp](https://vanban.chinhphu.vn/?docid=216493&pageid=27160)
- [Bộ luật Lao động 45/2019/QH14 — Điều 98, 107](https://vanban.chinhphu.vn/?classid=1&docid=198540&pageid=27160&typegroupid=3)
- [Nghị định 145/2020/NĐ-CP — hướng dẫn tiền lương OT/ban đêm](https://vbpl.moj.gov.vn/bolaodong/Pages/vbpq-toanvan.aspx?ItemID=152668&dvid=318)
- [Luật Công đoàn 50/2024/QH15 — kinh phí công đoàn](https://congbao.chinhphu.vn/tai-ve-van-ban-so-50-2024-qh15-43589-53742?format=pdf)
- [Thông tư 99/2025/TT-BTC — Mẫu số 02-TT Phiếu chi](https://congbao.chinhphu.vn/tai-ve-van-ban-so-99-2025-tt-btc-46529-59631)

**Phạm vi kết luận:** đây là bản thiết kế và cấu hình tham chiếu cho bài tập, không thay thế tư vấn pháp lý/kế toán theo hợp đồng, loại hình doanh nghiệp và hồ sơ thật.
