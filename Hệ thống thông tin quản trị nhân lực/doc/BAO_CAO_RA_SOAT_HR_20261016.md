# Báo cáo rà soát và cải thiện HRMIS

**Bắt đầu:** 16/10/2026. **Kết quả cập nhật:** 17/10/2026.
**Phạm vi:** mã nguồn, dữ liệu đang chạy, biểu mẫu và hai báo cáo HR/KPI của hệ thống học phần. Giao diện tiếp tục dùng bố cục, màu sắc, kiểu chữ và bộ thành phần hiện có.

## Kết quả đối chiếu

Đã kiểm tra 390 tài khoản và các quan hệ hồ sơ, hợp đồng, lương, chức vụ, quyết định và KPI. Lần chạy cuối không phát hiện lỗi hoặc mục cần rà soát trong bộ quy tắc đã xây dựng. Danh sách đầy đủ ở [kết quả từng tài khoản](KET_QUA_DOI_CHIEU_TUNG_TAI_KHOAN_20261017.md). Kết quả này phản ánh các kiểm tra cụ thể dưới đây, không phải chứng nhận bao quát mọi tình huống vận hành.

| Nội dung | Trước rà soát | Sau cập nhật |
| --- | --- | --- |
| Nhân sự và quyền truy cập | 388 người đang làm, 2 người đã nghỉ vẫn có tài khoản hoạt động; một quyết định nghỉ việc chưa áp đúng ngày | 387 người đang làm; 3 người đã nghỉ có tài khoản bị vô hiệu hóa |
| Hợp đồng | 386 người đang làm chưa có hợp đồng hiệu lực; nhiều hợp đồng mô phỏng còn ở bản nháp | Mỗi người đang làm có hợp đồng hiệu lực theo ngày; giữ lịch sử của người đã nghỉ |
| Bản điện tử hợp đồng | 391 hợp đồng chưa có tệp riêng | 391 hợp đồng có tệp riêng; không còn chỗ trống “Chưa khai báo” trong các bản sinh |
| Hồ sơ | Thiếu mã nhân viên, ngày sinh, thông tin nhận lương và một số hồ sơ chi tiết | 390 hồ sơ được hoàn thiện, trạng thái Đã xác minh, có người và thời điểm xác minh |
| Chức vụ | Có lịch sử bổ nhiệm khác đơn vị/chức danh hiện tại | Đóng bản ghi cũ không khớp, bổ sung vị trí hiện tại và giữ lịch sử |
| KPI | Có nhóm mục tiêu chưa đủ trọng số, chưa đủ khung mục tiêu cho nhân sự | 660 mục tiêu; các nhóm đã giao đủ tổng trọng số 100%; bổ sung 387 mục tiêu chưa chấm điểm |
| Cấu trúc dữ liệu | Chưa có trường xác minh hồ sơ và đo KPI định lượng | 102 mô hình, 31 phiên bản thay đổi cấu trúc đã áp dụng; các cột mới được bổ sung, không xóa cột cũ |

Thông tin bổ sung được ghi nguồn `ACADEMIC_SIMULATION`. Trạng thái Đã xác minh được hiển thị trong hệ thống theo yêu cầu trình diễn; không tạo chữ ký, chứng cứ đánh giá hoặc kết quả xác thực bên ngoài. Hợp đồng điện tử có khu vực ký để trống. Các mục tiêu mới chỉ tạo khung giao việc, không tự gán điểm đạt.

## Những quy trình đã sửa

**Hợp đồng và tiền lương.** Bản hợp đồng lấy tên, định danh, chức danh, nơi làm việc, mức lương và phụ cấp tương ứng từng người. Nội dung gồm các nhóm thông tin tại Điều 21 Bộ luật Lao động và hướng dẫn tại Thông tư 10/2020/TT-BLĐTBXH. Hợp đồng thử việc được đặt tên riêng; không gọi mọi bản hợp đồng là mẫu pháp quy thống nhất. Bản in dùng A4, Times New Roman, lề và khu vực ký rõ ràng. Khoản phụ cấp theo tỷ lệ được diễn đạt bằng tỷ lệ và mức tính; tiền ăn theo ngày được ghi theo đơn giá ngày công, không đưa công thức nội bộ vào điều khoản.

Phụ lục lương giữ thời hạn hợp đồng gốc và chỉ thay thế phụ lục lương trước đó. Bộ tính thuế tiếp tục xét thời hạn hợp đồng gốc; không đổi chế độ khấu trừ vì có phụ lục. Ngưỡng khấu trừ 10% được lưu theo chính sách: 2 triệu đồng/lần trước 01/07/2026, 5 triệu đồng/lần từ ngày này. Khi tạo hoặc sửa hợp đồng, hệ thống kiểm tra ngày tháng, thời hạn, mức lương, khung lương và hợp đồng chồng lấn.

**Lương tạm tính.** Bản xem trước ngày 17/10/2026 có 387 người, không có người bị bỏ khỏi phép tính và 8 trường hợp cần đối soát số dư. Bảo hiểm tháng có thể lớn hơn thu nhập đã ghi nhận đến giữa tháng; màn hình ghi rõ số dư âm là tạm tính và không dùng để chi trả. Bảng lương chính thức vẫn chặn tổng khấu trừ vượt thu nhập. Không bổ sung ngày công giả để làm đẹp kết quả.

**Điều chuyển và chức vụ.** Thuyên chuyển, bổ nhiệm, miễn nhiệm và bãi nhiệm được phân biệt với chấm dứt quan hệ lao động. Thay đổi chức vụ cập nhật đơn vị, chức danh và lịch sử theo ngày hiệu lực; không tự khóa tài khoản. Thay đổi lương cần căn cứ và khung phù hợp. Quyết định chưa tới ngày có hiệu lực không được áp dụng sớm.

**Khen thưởng và kỷ luật.** Kỷ luật lao động doanh nghiệp dùng bốn hình thức: khiển trách, kéo dài thời hạn nâng lương tối đa 6 tháng, cách chức và sa thải. Không cho nhập tiền phạt hoặc cắt lương thay kỷ luật. Phê duyệt cần số quyết định, căn cứ, hồ sơ minh chứng và xác nhận thủ tục. Quyết định có hiệu lực được nối vào lịch sử hồ sơ; sa thải dùng quy trình kết thúc lao động, thu hồi phiên đăng nhập và xử lý hợp đồng. Nâng lương bị chặn trong thời hạn kéo dài đã quyết định. Các nhánh công vụ dùng căn cứ riêng.

**KPI.** Mỗi chỉ tiêu có chiều đo, mức cần đạt, kết quả thực tế, đơn vị, minh chứng và giải trình. Người có quyền xác nhận kết quả; thiếu minh chứng thì không chấm điểm. Công thức phiên bản đang chạy:

- Càng cao càng tốt: `min(100, thực tế / mục tiêu × 100)`; mục tiêu phải dương.
- Càng thấp càng tốt: `min(100, mục tiêu / thực tế × 100)`; mục tiêu 0 chỉ đạt 100 khi thực tế cũng 0; mục tiêu dương và thực tế 0 đạt 100.
- Đạt/không đạt: thực tế 1 đạt 100, thực tế 0 đạt 0; không nhận giá trị trung gian.
- Định tính: quản lý chấm 0–100 theo bảng tiêu chí đã thống nhất, có minh chứng và giải trình.
- Điểm kỳ: tổng `điểm chỉ tiêu × trọng số / 100`, khi mọi chỉ tiêu đã có điểm và tổng trọng số bằng 100%.

Điểm KPI không tự tạo tiền thưởng, tăng lương hoặc quyết định nhân sự. Công thức có trần 120 trong phần nghiên cứu được ghi rõ là phương án tham khảo, khác quy tắc thang 100 đang triển khai.

## Tài liệu và cách diễn đạt

Đã biên tập hai báo cáo Word và bản Markdown HR: rút gọn các đoạn cảm ơn, cam đoan, định nghĩa và kết luận; thay cách diễn đạt quảng bá hoặc chung chung bằng nội dung có thể đối chiếu. Các từ như “snapshot”, “pipeline”, “rubric”, “baseline” được diễn đạt bằng tiếng Việt trong phần trình bày nghiệp vụ; giữ tên trường, API và thuật ngữ kỹ thuật khi cần tra mã nguồn. Sửa chỗ mô hình KPI ghi 26 bảng thành 24 bảng theo danh mục thực tế trong chính báo cáo.

Đã cập nhật số lượng mô hình dữ liệu, tệp trang, module, phiên bản cấu trúc và kết quả kiểm thử; bổ sung phụ lục giải thích dữ liệu đang chạy, hợp đồng, quyết định nhân sự, KPI và giới hạn đối chiếu. Mục lục và số trang được cập nhật bằng Microsoft Word. README được sửa mật khẩu trình diễn thành `123`, cách truy cập tệp có kiểm tra quyền và hướng dẫn kiểm thử trên cơ sở dữ liệu riêng. Hai báo cáo ngày 04/10 được giữ như hồ sơ lịch sử và có liên kết tới kết quả mới.

Tệp `anan-copy.docx` là tài liệu tham khảo về doanh nghiệp khác, không phải báo cáo HRMIS Saigon Technology; không thay tên hoặc số liệu của tài liệu này thành dữ liệu hệ thống.

Đã bổ sung ba hình còn thiếu trong bản Word HR cho trang cấu hình, nhật ký và điểm danh; cập nhật ảnh tổng quan, mục tiêu và hướng dẫn KPI từ ứng dụng ngày 17/10/2026. Các ảnh giao diện cũ được ghi rõ ngày chụp. Bản Markdown được khôi phục 40 tệp ảnh còn thiếu từ đúng hình đã nhúng trong Word; kiểm tra lại đủ 174 liên kết ảnh nội bộ.

## Bảo toàn dữ liệu và kiểm tra

Đã sao lưu cơ sở dữ liệu và thư mục tệp trước khi áp dụng. Docker dùng lại dịch vụ PostgreSQL và volume hiện có; chỉ dựng lại API/giao diện. Không xóa volume, không đặt lại Docker và không chạy bộ kiểm thử tích hợp trên cơ sở dữ liệu chính.

| Kiểm tra | Kết quả |
| --- | --- |
| Kiểm tra kiểu dữ liệu API và giao diện | Đạt |
| Kiểm thử đơn vị | 68/68, 13 bộ kiểm thử |
| Kiểm thử tích hợp trên PostgreSQL riêng | 7/7, 2 bộ kiểm thử |
| Dựng bản phát hành API và giao diện | Đạt |
| Chạy lại đồng bộ trên bản sao dữ liệu | Không tạo thêm hồ sơ, chức vụ, mục tiêu hoặc hợp đồng trùng |
| Đối chiếu từng tài khoản sau triển khai | 390 tài khoản, 0 lỗi, 0 mục cần rà soát trong các quy tắc đã định nghĩa |
| Phép tính và tổng lương đã lưu | Không phát hiện lệch tổng; không có phiếu thực lĩnh âm |
| Toàn bộ dữ liệu lương lịch sử trước/sau | Số dòng và mã băm SHA-256 của bốn bảng trùng nhau |
| Giao diện nhân sự, KPI, nhân viên | Không có lỗi JavaScript trong lần kiểm tra bằng trình duyệt |
| Bản hợp đồng | Kiểm tra đủ 391 tệp; xem bản in mẫu hợp đồng thường, thử việc và bản có nội dung dài |

Đối chiếu dữ liệu lương lịch sử:

| Bảng | Số dòng | SHA-256 trước và sau |
| --- | ---: | --- |
| `hrmsPayrollRun` | 4 | `fadb4ad77dbcd25cb7143694afedb4800dc7f371de3f357ee9f668265e02d560` |
| `hrmsPayrollSlip` | 1213 | `adf7ca2e51d5a7d3e20b59ffef516392a6558f4d16650919288c97d798b2f5e9` |
| `payrollPeriod` | 4 | `4632b6c27aaf4ba75555aac8e21f18ffc7175929c55c5986db89714af3653d7a` |
| `payslip` | 1188 | `5ed2fe5d3fdea70b89c10d7e1557e064338d025b7b69d0d678592ba600ac8498` |

Các bản sao lưu nằm tại `C:/Users/legen/.codex/backups/hrmis/20261016-before-review` và `C:/Users/legen/.codex/backups/hrmis/20261017-before-apply`. Ảnh ứng dụng trước cập nhật được giữ bằng nhãn `hrmis-api-before-20261016` và `hrmis-web-before-20261016`. Kết quả kiểm tra chi tiết nằm trong thư mục làm việc `scratch/hr-audit-20261016`; không đưa bản xuất chứa dữ liệu cá nhân vào kho mã nguồn.

Sau khi hoàn tất, đã lưu thêm `database.dump` và `uploads.tar.gz` tại `C:/Users/legen/.codex/backups/hrmis/20261017-after-review`. Bản sao cơ sở dữ liệu đã được kiểm tra danh mục khôi phục; chạy lại bước tạo hợp đồng mặc định không phát sinh hợp đồng hoặc tệp trùng.

## Phạm vi còn cần hoàn thiện

Chưa có kết nối xác thực căn cước, ngân hàng, thuế hoặc BHXH; chưa có đối chiếu sao kê tự động, quyết toán thuế năm hay đầy đủ hồ sơ ngoại lệ. Bảng lương tháng đang mở còn thiếu dữ liệu công; phải xử lý và chốt công trước khi tính lương chính thức. Chế độ công chức/viên chức, biểu mẫu pháp quy và mọi nhánh ngoại lệ cần được kiểm tra riêng theo đối tượng. Chi tiết nằm trong [quy trình lương](QUY_TRINH_TINH_LUONG_VN_THAM_CHIEU_2026.md).

ADMIN có quyền rộng để vận hành bản demo. Việc phân công người tính, người đối soát, lãnh đạo duyệt và kế toán chi được kiểm tra trong luồng lương, nhưng không đồng nghĩa đã kiểm định toàn bộ ma trận quyền của mọi phân hệ. Bằng chứng kiểm tra không thay thế việc nghiệm thu 47 use case và mọi điều kiện kết hợp.

Hợp đồng thử việc lịch sử có lưu mức lương thử việc nhưng chưa có bản chốt mức lương chính thức tương ứng đúng giai đoạn để tự đối chiếu tỷ lệ 85%. Bản điện tử được lập lại theo hồ sơ đang lưu, không phải bản quét đã ký trong quá khứ. Việc bổ sung bản điện tử không sửa số tiền hoặc ngày của hợp đồng lịch sử.

Căn cứ bảo vệ dữ liệu trong báo cáo đã cập nhật sang Luật 91/2025/QH15 và Nghị định 356/2025/NĐ-CP, có hiệu lực từ 01/01/2026; Nghị định 13/2023/NĐ-CP được ghi nhận là văn bản đã hết hiệu lực. Mô tả trên màn hình điểm danh nêu đúng biện pháp mã hóa đang có, tránh diễn đạt như một kết quả chứng nhận tuân thủ.

ISO 30414:2025 được tham khảo về báo cáo vốn nhân lực; ISO 30405:2023 về tuyển dụng. Phạm vi công khai của các tiêu chuẩn không quy định một công thức KPI chung cho mọi vị trí và không chứng minh HRMIS đã được chứng nhận. Biểu mẫu doanh nghiệp được đối chiếu theo nội dung cần có, không gán yêu cầu trình bày văn bản hành chính nhà nước cho mọi hợp đồng lao động.

## Nguồn đối chiếu

- [Bộ luật Lao động 45/2019/QH14](https://vanban.chinhphu.vn/?docid=198540&pageid=27160): nội dung hợp đồng, các hình thức kỷ luật và nguyên tắc không phạt tiền/cắt lương thay kỷ luật.
- [Thông tư 10/2020/TT-BLĐTBXH](https://vbpl.vn/botuphap/Pages/vbpq-toanvan.aspx?ItemID=146696): hướng dẫn nội dung hợp đồng lao động.
- [Giải thích thời hạn kéo dài nâng lương](https://chinhsachonline.chinhphu.vn/nguoi-lao-dong-bi-ky-luat-tinh-thoi-han-nang-luong-the-nao-76608.htm).
- [Hướng dẫn khấu trừ thuế theo Nghị định 253/2026/NĐ-CP](https://xaydungchinhsach.chinhphu.vn/quy-dinh-moi-ve-khau-tru-thue-thu-nhap-ca-nhan-119260703150410707.htm).
- [Thông tư 111/2013/TT-BTC](https://chinhphu.vn/?docid=169566&pageid=27160): quy tắc khấu trừ cho giai đoạn trước chính sách mới.
- [ISO 30414:2025](https://www.iso.org/standard/30414): phạm vi yêu cầu và khuyến nghị báo cáo vốn nhân lực.
- [ISO 30405:2023](https://www.iso.org/standard/79488.html): hướng dẫn tuyển dụng.
- [Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15](https://vanban.chinhphu.vn/?classid=1&docid=214590&pageid=27160&typegroup=) và [Nghị định 356/2025/NĐ-CP](https://vbpl.vn/TW/Pages/vbpq-toanvan.aspx?ItemID=187276), Điều 42: thời điểm áp dụng và việc hết hiệu lực Nghị định 13/2023/NĐ-CP.
- Các nguồn về thuế, bảo hiểm, lương tối thiểu và giờ làm được dẫn theo từng nội dung trong [quy trình lương tham chiếu](QUY_TRINH_TINH_LUONG_VN_THAM_CHIEU_2026.md).
