# Bài giảng Công nghệ phần mềm

Tài liệu ôn thi từ 182 ảnh chụp bài giảng. Phần đầu tập trung vào **lý thuyết** và **bài tập lớn**; bên dưới là toàn bộ ảnh gốc theo thứ tự đã gửi để đối chiếu. Phần tóm tắt là dàn ý ôn tập, không phải bản chép nguyên văn từng slide.

## Mục lục

- [Nội dung thi và cách ôn](#nội-dung-thi-và-cách-ôn)
- [Câu hỏi lý thuyết trọng tâm](#câu-hỏi-lý-thuyết-trọng-tâm)
- [Bài tập lớn: yêu cầu và checklist](#bài-tập-lớn-yêu-cầu-và-checklist)
- [Ảnh bài giảng gốc](#ảnh-bài-giảng-gốc)
- [Các mô hình vòng đời phần mềm](#các-mô-hình-vòng-đời-phần-mềm) — ảnh 001–079
- [Bài tập về mô hình vòng đời](#bài-tập-về-mô-hình-vòng-đời) — ảnh 080
- [Phân tích, thiết kế, lập trình, kiểm thử và bảo trì](#phân-tích-thiết-kế-lập-trình-kiểm-thử-và-bảo-trì) — ảnh 081–146
- [Quản lý dự án phần mềm](#quản-lý-dự-án-phần-mềm) — ảnh 147–169
- [Slide ôn thi lý thuyết](#slide-ôn-thi-lý-thuyết) — ảnh 170–176
- [Slide hướng dẫn bài tập lớn](#slide-hướng-dẫn-bài-tập-lớn) — ảnh 177–182

## Nội dung thi và cách ôn

Theo [slide nội dung thi](anh/171.png), phần thi gồm **vấn đáp lý thuyết (3 điểm)** và **bài tập lớn (7 điểm)**. Các [slide ôn lý thuyết](anh/170.png) nêu câu hỏi theo chương; các [slide bài tập lớn](anh/177.png) nêu yêu cầu về báo cáo và sản phẩm.

Thứ tự ôn nên là: (1) nắm chắc đề tài và tự giải thích từng phần trong bài tập lớn; (2) học định nghĩa, quy trình và so sánh các mô hình; (3) luyện trả lời miệng các câu hỏi ở ảnh 170–176. Khi trả lời, dùng cấu trúc **khái niệm → đặc điểm/quy trình → ưu nhược điểm → ví dụ áp dụng**.

## Câu hỏi lý thuyết trọng tâm

### Chương 1 — Đại cương về phần mềm

[Slide câu hỏi chương 1](anh/170.png) yêu cầu chuẩn bị:

1. **Phần mềm là gì, gồm những bộ phận nào?** Nêu chương trình, dữ liệu/cấu trúc dữ liệu và tài liệu liên quan; giải thích chúng phối hợp để giải quyết một nhiệm vụ.
2. **Phần mềm được phân loại ra sao?** Chuẩn bị ví dụ cho phần mềm hệ thống, phần mềm ứng dụng và các nhóm mà giảng viên đã dạy.
3. **Công nghệ phần mềm là gì, mục tiêu là gì?** Trình bày việc áp dụng quy trình, phương pháp và công cụ có hệ thống để phát triển, vận hành và bảo trì phần mềm; mục tiêu là phần mềm đáp ứng yêu cầu với chất lượng, thời gian và chi phí phù hợp.
4. **Đánh giá phần mềm tốt theo tiêu chí nào?** Nêu tính đúng đắn/chức năng, độ tin cậy, dễ sử dụng, hiệu năng, bảo mật, khả năng bảo trì và mở rộng; minh họa bằng ví dụ.

*Bộ ảnh chỉ có slide câu hỏi của chương 1, không có slide giảng chi tiết chương này. Các gợi ý trên là khung trả lời để bạn đối chiếu lại với giáo trình của lớp.*

### Chương 2 — Mô hình vòng đời phần mềm

[Slide câu hỏi chương 2](anh/172.png) nhấn mạnh mô hình **thác nước**, **bản mẫu** và **xây dựng và hiệu chỉnh**. Với mỗi mô hình, cần nói được cách vận hành, ưu nhược điểm và trường hợp sử dụng.

| Mô hình | Cách làm | Ưu điểm | Hạn chế / khi dùng |
| --- | --- | --- | --- |
| Thác nước | Các giai đoạn đi tuần tự; hoàn tất giai đoạn trước rồi mới chuyển sang giai đoạn sau. | Dễ lập kế hoạch, quản lý mốc và tài liệu. | Khó thích nghi khi yêu cầu thay đổi; phù hợp khi yêu cầu rõ và ổn định. |
| Bản mẫu | Tạo phiên bản thử để người dùng xem, phản hồi, rồi làm rõ yêu cầu và hoàn thiện hệ thống. | Giúp hiểu đúng nhu cầu và giao diện sớm. | Dễ khiến người dùng tưởng bản mẫu đã là sản phẩm hoàn chỉnh; phải kiểm soát chất lượng kiến trúc. |
| Xây dựng và hiệu chỉnh | Viết một bản ban đầu rồi sửa dần theo phản hồi. | Nhanh với bài toán nhỏ, mục tiêu còn đang khám phá. | Thiếu cấu trúc dễ gây khó bảo trì và mở rộng; không hợp dự án lớn. |
| Tăng dần | Chia sản phẩm thành nhiều bản phát hành, mỗi bản thêm chức năng. | Có giá trị sử dụng sớm, dễ nhận phản hồi. | Cần thiết kế nền tảng và tích hợp các phần cẩn thận. |
| Xoắn ốc | Lặp nhiều vòng, mỗi vòng xác định mục tiêu, phân tích rủi ro, phát triển và đánh giá. | Chú trọng quản lý rủi ro; hợp dự án lớn, phức tạp. | Tốn công quản lý, cần kinh nghiệm đánh giá rủi ro. |

Đối chiếu với ảnh [001–025](anh/001.png) (thác nước), [026–052](anh/026.png) (bản mẫu và xây dựng/hiệu chỉnh), [053–065](anh/053.png) (tăng dần) và [066–079](anh/066.png) (xoắn ốc). [Bài tập trong ảnh 080](anh/080.png) yêu cầu so sánh **bản mẫu với xây dựng và hiệu chỉnh**, **tăng dần với tăng dần đồng thời**, và xác định đối tượng, quan hệ, sơ đồ chức năng cho một hệ thống quản lý.

### Chương 3 — Quy trình phát triển, kiểm thử và bảo trì

Khi phân tích và đặc tả yêu cầu, cần nêu **vì sao phải đặc tả**: thống nhất giữa người dùng và người phát triển, giúp các nhóm phát triển trao đổi, và làm cơ sở kiểm tra sản phẩm có đúng yêu cầu hay không ([ảnh 081–082](anh/081.png)). Hãy phân biệt yêu cầu chức năng với yêu cầu phi chức năng, và nắm các bước phân tích, thiết kế kiến trúc/dữ liệu/giao diện, lập trình, kiểm thử, bảo trì.

**Kiểm thử phần mềm** là đánh giá và xác minh phần mềm hoạt động theo yêu cầu, phát hiện lỗi và nâng chất lượng ([ảnh 127](anh/127.png)). Quy trình trong [ảnh 130](anh/130.png): phân tích yêu cầu kiểm thử → lập kế hoạch → thiết kế ca kiểm thử → chuẩn bị môi trường → thực hiện → báo lỗi → kiểm thử lại và hồi quy → tổng kết. Các nguyên tắc trên [ảnh 133](anh/133.png): bám yêu cầu khách hàng, lập kế hoạch trước, đi từ ít đến nhiều, kiểm thử nhiều khía cạnh và có người kiểm thử độc lập.

**Các cách kiểm thử** ([ảnh 134–137](anh/134.png)):

- **Hộp trắng:** dựa vào cấu trúc và luồng điều khiển bên trong; hướng đến bao phủ nhánh/đường đi.
- **Hộp đen:** dựa vào đầu vào, đầu ra và yêu cầu chức năng, không cần biết mã bên trong. Kỹ thuật ví dụ: phân vùng tương đương, giá trị biên, bảng quyết định.
- **Hộp xám:** kết hợp hai cách trên; người kiểm thử biết một phần cấu trúc bên trong.

**Bảo trì** là thay đổi phần mềm sau khi bàn giao và đang được sử dụng ([ảnh 138](anh/138.png)). Bốn loại trên [ảnh 142](anh/142.png):

| Loại | Mục đích |
| --- | --- |
| Sửa lỗi (corrective) | Sửa lỗi phát hiện khi vận hành. |
| Thích nghi (adaptive) | Điều chỉnh theo môi trường mới như hệ điều hành, phần cứng, cơ sở dữ liệu. |
| Hoàn thiện (perfective) | Cải tiến, tối ưu hoặc bổ sung theo nhu cầu người dùng. |
| Phòng ngừa (preventive) | Cải thiện mã và cấu trúc để giảm lỗi trong tương lai. |

### Chương 4 — Quản lý dự án và rủi ro

Theo [ảnh 148](anh/148.png), **dự án** có mục tiêu, thời điểm bắt đầu/kết thúc và kinh phí định trước. **Quản lý dự án** gồm quy hoạch, tổ chức nhân sự, điều khiển và kiểm tra tiến độ để dự án hoàn thành. Các hoạt động chủ yếu là lập kế hoạch, phân công nhiệm vụ và lựa chọn giải pháp ([ảnh 153](anh/153.png)). Kế hoạch cần liệt kê công việc, quan hệ phụ thuộc, người thực hiện và thời hạn ([ảnh 154](anh/154.png)).

**Rủi ro** là biến cố chưa chắc xảy ra nhưng nếu xảy ra sẽ tác động đến dự án. Quản lý rủi ro là nhận diện, phân tích, ứng phó và giám sát rủi ro ([ảnh 161–164](anh/161.png)). Ví dụ trong [ảnh 160](anh/160.png): yêu cầu ban đầu chưa đầy đủ, thay đổi không kiểm soát, dự toán sai, phụ thuộc bên ngoài, đội ngũ, theo dõi thiếu và khó khăn khi kết thúc dự án. Khi vấn đáp, nêu **rủi ro cụ thể của chính bài tập lớn** và cách phòng ngừa/ứng phó.

[Slide câu hỏi chương 4](anh/174.png) còn hỏi yếu tố thành công/thất bại, quản lý chất lượng và mô hình quản lý dự án. Có thể trả lời theo các ý: yêu cầu rõ, kế hoạch khả thi, nhân sự phù hợp, giao tiếp và kiểm soát tiến độ, chất lượng, rủi ro. Với Agile, nhấn mạnh chia việc thành vòng ngắn và nhận phản hồi thường xuyên; với thác nước, nhấn mạnh kế hoạch tuần tự và kiểm soát theo giai đoạn.

## Bài tập lớn: yêu cầu và checklist

[Slide phần 2](anh/177.png) nêu bài tập lớn về **quy trình xây dựng một phần mềm**. Bạn cần tự giải thích được đề tài, yêu cầu, sơ đồ, thiết kế, công nghệ, kiểm thử và bảo trì của chính nhóm mình. [Ảnh 158](anh/158.png) còn yêu cầu áp dụng quản lý dự án: lập kế hoạch, bố trí nhân sự, lựa chọn giải pháp; [ảnh 168](anh/168.png) yêu cầu chỉ ra rủi ro và biện pháp ứng phó.

### Cấu trúc báo cáo

Theo [ảnh 180](anh/180.png), báo cáo nên có: trang bìa; mục lục (các mục con sắp xếp rõ); danh mục chữ viết tắt nếu có nhiều; phần mở đầu; phần nội dung; phần kết luận; tài liệu tham khảo; phụ lục nếu cần. [Ảnh 178](anh/178.png) nêu yêu cầu trình bày và trích dẫn; cần kiểm tra bản báo cáo cuối cùng theo hướng dẫn của giảng viên.

### Nội dung phải chuẩn bị để bảo vệ

1. **Xác định yêu cầu:** nêu bài toán của đề tài, người dùng, chức năng chính, yêu cầu dữ liệu và yêu cầu phi chức năng.
2. **Phân tích và đặc tả:** dùng sơ đồ phù hợp để mô tả hệ thống; [ảnh 181](anh/181.png) nhắc tới sơ đồ luồng dữ liệu, sơ đồ mức ngữ cảnh, mức 0 và mức 1. Tự giải thích từng tác nhân, luồng dữ liệu và kho dữ liệu.
3. **Thiết kế:** trình bày các chức năng chính và giao diện của phần mềm ([ảnh 182](anh/182.png)); giải thích vì sao thiết kế đáp ứng yêu cầu.
4. **Lập trình:** nêu ngôn ngữ/công nghệ đã chọn và lý do chọn; biết mô tả luồng xử lý của chức năng quan trọng ([ảnh 182](anh/182.png)).
5. **Kiểm thử:** đưa ra phương pháp kiểm thử, ví dụ đầu vào, kết quả mong đợi, kết quả thực tế và cách xử lý lỗi ([ảnh 182](anh/182.png)).
6. **Bảo trì:** nêu các loại bảo trì và ví dụ áp dụng vào sản phẩm của nhóm ([ảnh 182](anh/182.png)).
7. **Quản lý dự án:** giải thích kế hoạch, phân công thành viên, giải pháp đã chọn, rủi ro đã gặp hoặc dự kiến và cách ứng phó ([ảnh 158](anh/158.png), [168](anh/168.png)).

**Tự kiểm tra trước khi thi:** Mỗi thành viên phải trình bày được phần mình làm, giải thích được toàn bộ sơ đồ và trả lời được câu “vì sao nhóm chọn cách này?”. Chuẩn bị ít nhất một ví dụ xuyên suốt từ **yêu cầu → thiết kế → lập trình → kiểm thử → bảo trì**.

## Ảnh bài giảng gốc

## Các mô hình vòng đời phần mềm

Mô hình thác nước, bản mẫu, xây dựng và hiệu chỉnh, tăng dần, tăng dần đồng thời, xoắn ốc.

### Ảnh 001

![Bài giảng, ảnh 001](anh/001.png)

### Ảnh 002

![Bài giảng, ảnh 002](anh/002.png)

### Ảnh 003

![Bài giảng, ảnh 003](anh/003.png)

### Ảnh 004

![Bài giảng, ảnh 004](anh/004.png)

### Ảnh 005

![Bài giảng, ảnh 005](anh/005.png)

### Ảnh 006

![Bài giảng, ảnh 006](anh/006.png)

### Ảnh 007

![Bài giảng, ảnh 007](anh/007.png)

### Ảnh 008

![Bài giảng, ảnh 008](anh/008.png)

### Ảnh 009

![Bài giảng, ảnh 009](anh/009.png)

### Ảnh 010

![Bài giảng, ảnh 010](anh/010.png)

### Ảnh 011

![Bài giảng, ảnh 011](anh/011.png)

### Ảnh 012

![Bài giảng, ảnh 012](anh/012.png)

### Ảnh 013

![Bài giảng, ảnh 013](anh/013.png)

### Ảnh 014

![Bài giảng, ảnh 014](anh/014.png)

### Ảnh 015

![Bài giảng, ảnh 015](anh/015.png)

### Ảnh 016

![Bài giảng, ảnh 016](anh/016.png)

### Ảnh 017

![Bài giảng, ảnh 017](anh/017.png)

### Ảnh 018

![Bài giảng, ảnh 018](anh/018.png)

### Ảnh 019

![Bài giảng, ảnh 019](anh/019.png)

### Ảnh 020

![Bài giảng, ảnh 020](anh/020.png)

### Ảnh 021

![Bài giảng, ảnh 021](anh/021.png)

### Ảnh 022

![Bài giảng, ảnh 022](anh/022.png)

### Ảnh 023

![Bài giảng, ảnh 023](anh/023.png)

### Ảnh 024

![Bài giảng, ảnh 024](anh/024.png)

### Ảnh 025

![Bài giảng, ảnh 025](anh/025.png)

### Ảnh 026

![Bài giảng, ảnh 026](anh/026.png)

### Ảnh 027

![Bài giảng, ảnh 027](anh/027.png)

### Ảnh 028

![Bài giảng, ảnh 028](anh/028.png)

### Ảnh 029

![Bài giảng, ảnh 029](anh/029.png)

### Ảnh 030

![Bài giảng, ảnh 030](anh/030.png)

### Ảnh 031

![Bài giảng, ảnh 031](anh/031.png)

### Ảnh 032

![Bài giảng, ảnh 032](anh/032.png)

### Ảnh 033

![Bài giảng, ảnh 033](anh/033.png)

### Ảnh 034

![Bài giảng, ảnh 034](anh/034.png)

### Ảnh 035

![Bài giảng, ảnh 035](anh/035.png)

### Ảnh 036

![Bài giảng, ảnh 036](anh/036.png)

### Ảnh 037

![Bài giảng, ảnh 037](anh/037.png)

### Ảnh 038

![Bài giảng, ảnh 038](anh/038.png)

### Ảnh 039

![Bài giảng, ảnh 039](anh/039.png)

### Ảnh 040

![Bài giảng, ảnh 040](anh/040.png)

### Ảnh 041

![Bài giảng, ảnh 041](anh/041.png)

### Ảnh 042

![Bài giảng, ảnh 042](anh/042.png)

### Ảnh 043

![Bài giảng, ảnh 043](anh/043.png)

### Ảnh 044

![Bài giảng, ảnh 044](anh/044.png)

### Ảnh 045

![Bài giảng, ảnh 045](anh/045.png)

### Ảnh 046

![Bài giảng, ảnh 046](anh/046.png)

### Ảnh 047

![Bài giảng, ảnh 047](anh/047.png)

### Ảnh 048

![Bài giảng, ảnh 048](anh/048.png)

### Ảnh 049

![Bài giảng, ảnh 049](anh/049.png)

### Ảnh 050

![Bài giảng, ảnh 050](anh/050.png)

### Ảnh 051

![Bài giảng, ảnh 051](anh/051.png)

### Ảnh 052

![Bài giảng, ảnh 052](anh/052.png)

### Ảnh 053

![Bài giảng, ảnh 053](anh/053.png)

### Ảnh 054

![Bài giảng, ảnh 054](anh/054.png)

### Ảnh 055

![Bài giảng, ảnh 055](anh/055.png)

### Ảnh 056

![Bài giảng, ảnh 056](anh/056.png)

### Ảnh 057

![Bài giảng, ảnh 057](anh/057.png)

### Ảnh 058

![Bài giảng, ảnh 058](anh/058.png)

### Ảnh 059

![Bài giảng, ảnh 059](anh/059.png)

### Ảnh 060

![Bài giảng, ảnh 060](anh/060.png)

### Ảnh 061

![Bài giảng, ảnh 061](anh/061.png)

### Ảnh 062

![Bài giảng, ảnh 062](anh/062.png)

### Ảnh 063

![Bài giảng, ảnh 063](anh/063.png)

### Ảnh 064

![Bài giảng, ảnh 064](anh/064.png)

### Ảnh 065

![Bài giảng, ảnh 065](anh/065.png)

### Ảnh 066

![Bài giảng, ảnh 066](anh/066.png)

### Ảnh 067

![Bài giảng, ảnh 067](anh/067.png)

### Ảnh 068

![Bài giảng, ảnh 068](anh/068.png)

### Ảnh 069

![Bài giảng, ảnh 069](anh/069.png)

### Ảnh 070

![Bài giảng, ảnh 070](anh/070.png)

### Ảnh 071

![Bài giảng, ảnh 071](anh/071.png)

### Ảnh 072

![Bài giảng, ảnh 072](anh/072.png)

### Ảnh 073

![Bài giảng, ảnh 073](anh/073.png)

### Ảnh 074

![Bài giảng, ảnh 074](anh/074.png)

### Ảnh 075

![Bài giảng, ảnh 075](anh/075.png)

### Ảnh 076

![Bài giảng, ảnh 076](anh/076.png)

### Ảnh 077

![Bài giảng, ảnh 077](anh/077.png)

### Ảnh 078

![Bài giảng, ảnh 078](anh/078.png)

### Ảnh 079

![Bài giảng, ảnh 079](anh/079.png)

## Bài tập về mô hình vòng đời

### Ảnh 080

![Bài giảng, ảnh 080](anh/080.png)

## Phân tích, thiết kế, lập trình, kiểm thử và bảo trì

### Ảnh 081

![Bài giảng, ảnh 081](anh/081.png)

### Ảnh 082

![Bài giảng, ảnh 082](anh/082.png)

### Ảnh 083

![Bài giảng, ảnh 083](anh/083.png)

### Ảnh 084

![Bài giảng, ảnh 084](anh/084.png)

### Ảnh 085

![Bài giảng, ảnh 085](anh/085.png)

### Ảnh 086

![Bài giảng, ảnh 086](anh/086.png)

### Ảnh 087

![Bài giảng, ảnh 087](anh/087.png)

### Ảnh 088

![Bài giảng, ảnh 088](anh/088.png)

### Ảnh 089

![Bài giảng, ảnh 089](anh/089.png)

### Ảnh 090

![Bài giảng, ảnh 090](anh/090.png)

### Ảnh 091

![Bài giảng, ảnh 091](anh/091.png)

### Ảnh 092

![Bài giảng, ảnh 092](anh/092.png)

### Ảnh 093

![Bài giảng, ảnh 093](anh/093.png)

### Ảnh 094

![Bài giảng, ảnh 094](anh/094.png)

### Ảnh 095

![Bài giảng, ảnh 095](anh/095.png)

### Ảnh 096

![Bài giảng, ảnh 096](anh/096.png)

### Ảnh 097

![Bài giảng, ảnh 097](anh/097.png)

### Ảnh 098

![Bài giảng, ảnh 098](anh/098.png)

### Ảnh 099

![Bài giảng, ảnh 099](anh/099.png)

### Ảnh 100

![Bài giảng, ảnh 100](anh/100.png)

### Ảnh 101

![Bài giảng, ảnh 101](anh/101.png)

### Ảnh 102

![Bài giảng, ảnh 102](anh/102.png)

### Ảnh 103

![Bài giảng, ảnh 103](anh/103.png)

### Ảnh 104

![Bài giảng, ảnh 104](anh/104.png)

### Ảnh 105

![Bài giảng, ảnh 105](anh/105.png)

### Ảnh 106

![Bài giảng, ảnh 106](anh/106.png)

### Ảnh 107

![Bài giảng, ảnh 107](anh/107.png)

### Ảnh 108

![Bài giảng, ảnh 108](anh/108.png)

### Ảnh 109

![Bài giảng, ảnh 109](anh/109.png)

### Ảnh 110

![Bài giảng, ảnh 110](anh/110.png)

### Ảnh 111

![Bài giảng, ảnh 111](anh/111.png)

### Ảnh 112

![Bài giảng, ảnh 112](anh/112.png)

### Ảnh 113

![Bài giảng, ảnh 113](anh/113.png)

### Ảnh 114

![Bài giảng, ảnh 114](anh/114.png)

### Ảnh 115

![Bài giảng, ảnh 115](anh/115.png)

### Ảnh 116

![Bài giảng, ảnh 116](anh/116.png)

### Ảnh 117

![Bài giảng, ảnh 117](anh/117.png)

### Ảnh 118

![Bài giảng, ảnh 118](anh/118.png)

### Ảnh 119

![Bài giảng, ảnh 119](anh/119.png)

### Ảnh 120

![Bài giảng, ảnh 120](anh/120.png)

### Ảnh 121

![Bài giảng, ảnh 121](anh/121.png)

### Ảnh 122

![Bài giảng, ảnh 122](anh/122.png)

### Ảnh 123

![Bài giảng, ảnh 123](anh/123.png)

### Ảnh 124

![Bài giảng, ảnh 124](anh/124.png)

### Ảnh 125

![Bài giảng, ảnh 125](anh/125.png)

### Ảnh 126

![Bài giảng, ảnh 126](anh/126.png)

### Ảnh 127

![Bài giảng, ảnh 127](anh/127.png)

### Ảnh 128

![Bài giảng, ảnh 128](anh/128.png)

### Ảnh 129

![Bài giảng, ảnh 129](anh/129.png)

### Ảnh 130

![Bài giảng, ảnh 130](anh/130.png)

### Ảnh 131

![Bài giảng, ảnh 131](anh/131.png)

### Ảnh 132

![Bài giảng, ảnh 132](anh/132.png)

### Ảnh 133

![Bài giảng, ảnh 133](anh/133.png)

### Ảnh 134

![Bài giảng, ảnh 134](anh/134.png)

### Ảnh 135

![Bài giảng, ảnh 135](anh/135.png)

### Ảnh 136

![Bài giảng, ảnh 136](anh/136.png)

### Ảnh 137

![Bài giảng, ảnh 137](anh/137.png)

### Ảnh 138

![Bài giảng, ảnh 138](anh/138.png)

### Ảnh 139

![Bài giảng, ảnh 139](anh/139.png)

### Ảnh 140

![Bài giảng, ảnh 140](anh/140.png)

### Ảnh 141

![Bài giảng, ảnh 141](anh/141.png)

### Ảnh 142

![Bài giảng, ảnh 142](anh/142.png)

### Ảnh 143

![Bài giảng, ảnh 143](anh/143.png)

### Ảnh 144

![Bài giảng, ảnh 144](anh/144.png)

### Ảnh 145

![Bài giảng, ảnh 145](anh/145.png)

### Ảnh 146

![Bài giảng, ảnh 146](anh/146.png)

## Quản lý dự án phần mềm

### Ảnh 147

![Bài giảng, ảnh 147](anh/147.png)

### Ảnh 148

![Bài giảng, ảnh 148](anh/148.png)

### Ảnh 149

![Bài giảng, ảnh 149](anh/149.png)

### Ảnh 150

![Bài giảng, ảnh 150](anh/150.png)

### Ảnh 151

![Bài giảng, ảnh 151](anh/151.png)

### Ảnh 152

![Bài giảng, ảnh 152](anh/152.png)

### Ảnh 153

![Bài giảng, ảnh 153](anh/153.png)

### Ảnh 154

![Bài giảng, ảnh 154](anh/154.png)

### Ảnh 155

![Bài giảng, ảnh 155](anh/155.png)

### Ảnh 156

![Bài giảng, ảnh 156](anh/156.png)

### Ảnh 157

![Bài giảng, ảnh 157](anh/157.png)

### Ảnh 158

![Bài giảng, ảnh 158](anh/158.png)

### Ảnh 159

![Bài giảng, ảnh 159](anh/159.png)

### Ảnh 160

![Bài giảng, ảnh 160](anh/160.png)

### Ảnh 161

![Bài giảng, ảnh 161](anh/161.png)

### Ảnh 162

![Bài giảng, ảnh 162](anh/162.png)

### Ảnh 163

![Bài giảng, ảnh 163](anh/163.png)

### Ảnh 164

![Bài giảng, ảnh 164](anh/164.png)

### Ảnh 165

![Bài giảng, ảnh 165](anh/165.png)

### Ảnh 166

![Bài giảng, ảnh 166](anh/166.png)

### Ảnh 167

![Bài giảng, ảnh 167](anh/167.png)

### Ảnh 168

![Bài giảng, ảnh 168](anh/168.png)

### Ảnh 169

![Bài giảng, ảnh 169](anh/169.png)

## Slide ôn thi lý thuyết

### Ảnh 170

![Bài giảng, ảnh 170](anh/170.png)

### Ảnh 171

![Bài giảng, ảnh 171](anh/171.png)

### Ảnh 172

![Bài giảng, ảnh 172](anh/172.png)

### Ảnh 173

![Bài giảng, ảnh 173](anh/173.png)

### Ảnh 174

![Bài giảng, ảnh 174](anh/174.png)

### Ảnh 175

![Bài giảng, ảnh 175](anh/175.png)

### Ảnh 176

![Bài giảng, ảnh 176](anh/176.png)

## Slide hướng dẫn bài tập lớn

### Ảnh 177

![Bài giảng, ảnh 177](anh/177.png)

### Ảnh 178

![Bài giảng, ảnh 178](anh/178.png)

### Ảnh 179

![Bài giảng, ảnh 179](anh/179.png)

### Ảnh 180

![Bài giảng, ảnh 180](anh/180.png)

### Ảnh 181

![Bài giảng, ảnh 181](anh/181.png)

### Ảnh 182

![Bài giảng, ảnh 182](anh/182.png)

