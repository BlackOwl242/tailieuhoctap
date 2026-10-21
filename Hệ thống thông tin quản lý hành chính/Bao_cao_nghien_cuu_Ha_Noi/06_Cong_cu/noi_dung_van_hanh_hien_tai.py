"""Shared current-runtime documentation for the report and operating guide."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DATE = '16/10/2026'
ROLE_ROWS = [
 ['Công dân và tổ chức', 'Tra cứu thủ tục, lập hồ sơ, tải tệp, bổ sung, khai chứng từ thu, đặt lịch, gửi PAKN và đánh giá', 'Mã hồ sơ và khóa tra cứu; nội dung và tệp gửi cho cơ quan'],
 ['Cán bộ tiếp nhận', 'Kiểm tra hồ sơ, tiếp nhận tại quầy hoặc trực tuyến, số hóa, lập Mẫu 01–03, định phí và phân công', 'Hồ sơ hợp lệ và hạn xử lý chuyển chuyên viên; yêu cầu bổ sung chuyển người nộp'],
 ['Chuyên viên thụ lý', 'Thẩm định hồ sơ được giao, lưu dự thảo, yêu cầu bổ sung, lập Mẫu 04 và trình duyệt', 'Dự thảo và căn cứ xử lý chuyển lãnh đạo'],
 ['Lãnh đạo phê duyệt', 'Phê duyệt, trả lại thụ lý, từ chối giải quyết; ký nội bộ nếu được phân quyền; ghi nhận phát hành Mẫu 06 đã ký', 'Bản đã duyệt và chữ ký nội bộ chuyển văn thư'],
 ['Văn thư phát hành', 'Kiểm tra chữ ký và điều kiện khoản thu, cấp số hiệu, phát hành, ghi người nhận và chứng cứ giao', 'Kết quả điện tử trong hồ sơ và xác nhận hoàn thành'],
 ['Kế toán và tài chính', 'Theo dõi khoản thu, kiểm tra chứng từ, ghi tham chiếu đối chiếu; lập, duyệt và ghi chứng từ hoàn', 'Trạng thái đối chiếu hoặc miễn thu cho phép tiếp tục ký và phát hành'],
 ['Quản trị hệ thống', 'Quản lý tài khoản, quyền, danh mục, cấu hình tờ khai, tin tức, báo cáo và dữ liệu được cấp', 'Quyền còn hiệu lực, danh mục và nội dung công khai; lưu lịch sử thay đổi'],
]
FLOW_ROWS = [
 ['1', 'Công dân hoặc cán bộ tiếp nhận', 'Gửi hồ sơ → CHO_TIEP_NHAN', 'Phiên bản tờ khai, cơ quan tiếp nhận, tệp và mã hồ sơ; người nộp giữ khóa tra cứu'],
 ['2', 'Cán bộ tiếp nhận', 'Tiếp nhận → DA_TIEP_NHAN', 'Mốc tiếp nhận, Giấy tiếp nhận Mẫu 01 và hạn theo thủ tục/lịch làm việc'],
 ['3', 'Cán bộ tiếp nhận', 'Phân công → DANG_THU_LY', 'Chuyên viên phụ trách và lịch sử phân công; khoản thu và căn cứ nếu phát sinh'],
 ['4', 'Chuyên viên', 'Lưu dự thảo và trình → TRINH_DUYET', 'Nội dung kết quả và ý kiến thẩm định; Mẫu 04 nếu đủ điều kiện gia hạn'],
 ['5', 'Lãnh đạo', 'Phê duyệt → DA_PHE_DUYET', 'Người duyệt, thời điểm và bản nội dung được chốt; có thể trả lại để sửa'],
 ['6', 'Người nộp, tài chính và người ký', 'Khai chứng từ → đối chiếu/miễn → ký nội bộ', 'Chữ ký Ed25519 và mã băm gắn đúng nội dung đã duyệt; vẫn giữ DA_PHE_DUYET'],
 ['7', 'Văn thư', 'Cấp số và phát hành → DA_PHAT_HANH', 'Số văn bản, nội dung phát hành và tài liệu trong hồ sơ'],
 ['8', 'Văn thư và người nhận', 'Ghi nhận giao → HOAN_THANH', 'Người nhận, kênh giao và số biên nhận/mã vận đơn/chứng cứ giao; người dân theo dõi kết quả'],
]
OVERVIEW = [
 'Hệ thống quản lý một hồ sơ hành chính xuyên suốt từ lúc gửi đến khi giao kết quả. Các vai trò dùng cùng mã hồ sơ, dữ liệu tờ khai, thành phần tài liệu, nghĩa vụ thu và nhật ký; mỗi người chỉ thực hiện lệnh được cấp trong phạm vi cơ quan và trạng thái phù hợp.',
 'Người dân thao tác qua các trang /thu-tuc, /nop-ho-so và /tra-cuu-ho-so. Trang chủ cung cấp các lối mở dịch vụ, lịch hẹn, PAKN và tin tức; khối tra cứu nhanh trùng lặp cùng bảng số liệu cạnh nó đã được gỡ. Trang tra cứu riêng yêu cầu đồng thời mã hồ sơ và khóa tra cứu trên biên nhận; số định danh hoặc số điện thoại không thay thế khóa này.',
 'Sáu vai trò cán bộ sử dụng /staff bằng tài khoản nội bộ được cấp. Quản trị viên hệ thống có thể kích hoạt tài khoản trực tiếp hoặc gửi đề nghị chờ duyệt theo quyền; thay đổi vai trò, đơn vị, hiệu lực và quyền ký được lưu lịch sử. Quản trị ứng dụng hiện có quyền xem dữ liệu hồ sơ trong hệ thống, chưa tách thành một vai trò quản trị hạ tầng độc lập.',
 'Phê duyệt, ký xác nhận nội bộ, phát hành và giao kết quả là các bước riêng. Ký Ed25519 kiểm tra tính toàn vẹn của dữ liệu kết quả đã duyệt; đây chưa phải chữ ký số trên tệp PDF bằng chứng thư công vụ. Tài khoản lãnh đạo có đủ quyền có thể thực hiện cả duyệt và ký; bản cài đặt không bắt buộc hai người khác nhau cho hai thao tác này. Khoản thu phải được đối chiếu hoặc miễn trước khi ký và phát hành.',
 'Nhánh bổ sung dùng Mẫu 02 và lưu giai đoạn quay lại; từ chối tiếp nhận dùng Mẫu 03; gia hạn dùng Mẫu 04 theo điều kiện của máy chủ. Dừng giải quyết dùng yêu cầu Mẫu 05, kiểm tra điều kiện, đính kèm bản Mẫu 06 đã được người có thẩm quyền ký rồi ghi nhận phát hành và chuyển DUNG. Số hóa chỉ ghi tệp người dùng thực sự tải lên, không tự coi bản tờ khai được tạo là bản quét giấy tờ.',
 'Khoản thu trong hệ thống là sổ theo dõi: người nộp khai mã chứng từ, tài chính đối chiếu và ghi tham chiếu. Hoàn phí có bước lập đề nghị, duyệt và ghi chứng từ thực hiện. Trạng thái ghi sổ không phải xác nhận chuyển tiền từ ngân hàng hoặc Kho bạc. Lịch hẹn, PAKN, tin tức và báo cáo sử dụng dữ liệu lưu trong cùng ứng dụng.',
 'Cổng Dịch vụ công quốc gia, VNeID, cơ sở dữ liệu dân cư/chuyên ngành, cổng thanh toán/Kho bạc, chứng thư số công vụ, bưu chính và kho lưu trữ ngoài chưa được cấu hình kết nối. Mô hình 36 use case, 37 lớp và giao tiếp mục tiêu tiếp tục được giữ để phát triển; bảng đối chiếu tại mục 6.5 xác định phần nào đã được hiện thực trong mã nguồn.',
]
UI_GROUP_ROWS = [
 ['Cổng công dân', '/; /thu-tuc; /nop-ho-so; /tra-cuu-ho-so', 'Trang chủ máy tính/điện thoại, danh mục và chi tiết thủ tục, nộp hồ sơ, tra cứu riêng, lịch hẹn, PAKN và tin tức'],
 ['Bàn làm việc', '/staff', 'Đăng nhập, tổng quan, hàng đợi theo từng vai trò, tiếp nhận tại quầy, chi tiết hồ sơ, SLA, nhật ký và tài khoản cá nhân'],
 ['Quản trị', '/staff', 'Tổng quan quản trị, danh bạ, ma trận RBAC, cấp tài khoản, báo cáo, danh mục và biên tập thủ tục, CMS, quyền ký và sổ khoản thu'],
 ['Cẩm nang', '/huong-dan; /huong-dan?role=intake', 'Đủ bảy đối tượng hướng dẫn; nút mở chức năng; tài khoản, phạm vi, ký nội bộ và Mẫu 06 khớp bản cài đặt'],
]
CMS_ROWS = [
 ['Bản nháp', 'Quản trị viên', 'Lưu nội bộ; chưa hiện ở cổng công dân'],
 ['Xuất bản và cập nhật', 'Quản trị viên', 'Hiện công khai; ghi phiên bản, thời điểm và người thao tác'],
 ['Lưu trữ và khôi phục nháp', 'Quản trị viên', 'Ẩn công khai hoặc trở về bản nháp; giữ lịch sử'],
 ['Xung đột phiên bản', 'Máy chủ', 'Từ chối ghi đè và yêu cầu tải lại'],
]
# Current implementation, rather than presumed production behavior of Hanoi.
_COVERAGE = [
 ('01','Đã có luồng nội bộ','/staff → Tài khoản','Cấp trực tiếp hoặc đề nghị chờ duyệt; quản lý vai trò, đơn vị, hiệu lực, quyền ký và thu hồi phiên. Admin được xem dữ liệu hệ thống; chưa tách vai trò quản trị hạ tầng riêng.'),
 ('02','Có một phần','/staff → Danh mục thủ tục','Có danh mục thủ tục, lĩnh vực và cơ quan tiếp nhận từ cấu hình/tài khoản. Chưa có bộ quản trị tổng quát cho mọi loại danh mục liên ngành.'),
 ('03','Có một phần','/staff → Danh mục thủ tục','Thêm, sửa, bãi bỏ và lưu phiên bản/lịch sử thủ tục; chưa có chu trình duyệt và công bố phiên bản theo lịch hiệu lực đầy đủ như thiết kế mục tiêu.'),
 ('04','Chưa triển khai giao diện cấu hình','Máy trạng thái trong app.py','Trạng thái và điều kiện chuyển bước được lập trình trong máy chủ; chưa có màn hình cho quản trị viên tự sửa máy trạng thái.'),
 ('05','Đã có luồng nội bộ','/nop-ho-so','Tờ khai năm bước, kiểm tra theo thủ tục/cơ quan, tệp thực tế và gửi hồ sơ. Chỉ tạo hồ sơ khi xác nhận bước cuối; cấp mã và khóa tra cứu riêng.'),
 ('06','Có một phần','/staff → Hộp xử lý','Luân chuyển giữa tiếp nhận, chuyên viên, lãnh đạo và văn thư qua phân công/trạng thái; chưa có bộ điều phối tuyến liên cơ quan tùy biến.'),
 ('07','Đã có luồng nội bộ','/staff → Chi tiết hồ sơ','Có các lệnh nghiệp vụ cố định, kiểm tra vai trò, cơ quan, trạng thái và phiên bản; lưu nhật ký trong giao dịch.'),
 ('08','Đã có luồng nội bộ','/tra-cuu-ho-so; /staff','Người nộp dùng mã và khóa để theo dõi; cán bộ theo dõi trạng thái, hạn, ý kiến và nhật ký trong phạm vi được cấp.'),
 ('09','Chưa triển khai','Mô hình UML trong tài liệu','Chưa có trình biên tập quy trình kéo thả trong ứng dụng. Sơ đồ quy trình đang là sản phẩm thiết kế.'),
 ('10','Đã có ký nội bộ','/staff → Hồ sơ đã duyệt','Ký Ed25519 dữ liệu kết quả đã duyệt, kiểm tra quyền còn hiệu lực, khoản thu và mã băm. Khóa do ứng dụng quản lý; chưa ký PDF bằng chứng thư công vụ. Không bắt buộc người ký khác người duyệt.'),
 ('11','Chưa kết nối ngoài','/staff → Kết nối','Chưa cấu hình dịch vụ ký, chứng thư số công vụ, thiết bị ký hoặc giao tiếp với nhà cung cấp bên ngoài.'),
 ('12','Đã có luồng nội bộ','/staff → Hộp xử lý','Kiểm tra hồ sơ trực tuyến, tiếp nhận tại quầy, lập Mẫu 01–03 và tính hạn theo cấu hình/lịch làm việc.'),
 ('13','Đã có luồng nội bộ','/staff; /tra-cuu-ho-so','Lập yêu cầu bổ sung, ghi nội dung cần bổ sung, nhận tệp từ người nộp và quay lại giai đoạn xử lý được lưu.'),
 ('14','Đã có luồng nội bộ','/staff → Chi tiết hồ sơ','Phân công chuyên viên trong cơ quan và lưu người được giao cùng nhật ký. Lệnh xử lý tiếp tục kiểm tra quyền/phạm vi.'),
 ('15','Có một phần','/staff → Chi tiết hồ sơ','Có thẩm định, dự thảo và ý kiến xử lý; chưa có nhiệm vụ phối hợp đa cơ quan với hạn và phản hồi độc lập như mô hình mục tiêu.'),
 ('16','Đã có luồng nội bộ','/staff → Chi tiết hồ sơ','Tách lệnh duyệt, ký nội bộ và phát hành. Văn thư kiểm tra chữ ký hợp lệ và khoản thu đã đối chiếu/miễn, nhập số và phát hành trong hệ thống; không phát hành sang hệ thống Thành phố.'),
 ('17','Đã có luồng nội bộ','/staff → Mẫu 05 và Mẫu 06','Lưu yêu cầu dừng đã ký, kiểm tra thời điểm và tư cách, lập dự thảo, đính kèm Mẫu 06 đã ký và ghi nhận phát hành trước khi chuyển DUNG; chưa nhận yêu cầu từ cổng quốc gia.'),
 ('18','Đã có luồng nội bộ','/staff → Hồ sơ đã phát hành','Ghi người nhận, phương thức và chứng cứ giao để hoàn thành. Mã vận đơn được nhập thủ công; chưa có API theo dõi bưu chính.'),
 ('19','Đã có luồng nội bộ','Chi tiết hồ sơ; danh sách; báo cáo','Xem/in các biểu mẫu Một cửa và kết quả, xuất CSV, in bảng kê và sổ theo dõi Mẫu 08 theo dữ liệu ứng dụng.'),
 ('20','Có một phần','Giao diện hồ sơ và nhật ký','Có thông báo kết quả thao tác, tiến độ và nhật ký trong ứng dụng. Chưa có dịch vụ gửi SMS/email hoặc xác nhận phát thông báo từ nhà cung cấp ngoài.'),
 ('21','Đã có luồng nội bộ','/tra-cuu-ho-so; /staff','Tra cứu công khai cần mã hồ sơ cùng khóa bí mật; tra cứu cán bộ bị giới hạn theo vai trò và cơ quan. Không tra cứu hồ sơ theo CCCD/số điện thoại để lấy khóa.'),
 ('22','Đã có cẩm nang theo vai trò','/huong-dan','Có bảy đối tượng và nút mở chức năng. Chi tiết thủ tục tra cứu tại danh mục; chưa có kho hướng dẫn nghiệp vụ theo ngày hiệu lực và công cụ tìm toàn văn như thiết kế mục tiêu.'),
 ('23','Đã có luồng nội bộ','/staff → Báo cáo theo cơ quan','Lọc theo cơ quan/kỳ, tổng hợp, mở danh sách chi tiết, xuất CSV và in Mẫu 08. Chưa gửi báo cáo tới nền tảng báo cáo ngoài.'),
 ('24','Có một phần','/staff → Báo cáo','Có các mẫu báo cáo và bảng kê lập trình sẵn; chưa có giao diện tự thiết kế, duyệt và công bố mẫu báo cáo động.'),
 ('25','Đã có luồng nội bộ','Tổng quan; Giám sát; Báo cáo','Thống kê từ dữ liệu ứng dụng theo phạm vi quyền. Trang chủ đã bỏ khối số liệu cạnh tra cứu nhanh; số liệu không đại diện cho toàn Thành phố.'),
 ('26','Đã có luồng nội bộ','/staff → Giám sát quy trình','Theo dõi trạng thái, hạn, tải xử lý và mở danh sách liên quan trong dữ liệu ứng dụng; chưa có số liệu thời gian thực từ hệ thống ngoài.'),
 ('27','Có một phần','/staff → Chi tiết và nhật ký','Ý kiến chỉ đạo gắn với trả lại, duyệt/từ chối và sự kiện hồ sơ. Chưa có đối tượng văn bản chỉ đạo, giao hạn và phản hồi độc lập.'),
 ('28','Có một phần','Hồ sơ và kho dữ liệu của ứng dụng','Lưu tài liệu tải lên và kết quả theo hồ sơ, kiểm tra quyền tải. Chưa có đầy đủ phân loại, hạn bảo quản và quản trị kho lưu trữ chuyên ngành.'),
 ('29','Chưa bật tái sử dụng','/nop-ho-so; /tra-cuu-ho-so','Có tải/xem tài liệu trong hồ sơ khi có quyền, nhưng chưa bật tự lấy hoặc tái sử dụng tài liệu theo CCCD/VNeID; chưa kết nối kho dữ liệu ngoài.'),
 ('30','Chưa kết nối ngoài','Hợp đồng tích hợp trong thiết kế','Chưa có điểm nhận sự kiện đã xác thực nguồn từ hệ thống bộ/ngành hoặc đối tác; không tự ghi nhận đồng bộ thành công.'),
 ('31','Chưa kết nối ngoài','Liên kết ngoài tới Cổng quốc gia','Liên kết mở website không phải API liên thông. Hồ sơ nộp trong ứng dụng chưa được gửi/đồng bộ sang Cổng Dịch vụ công quốc gia.'),
 ('32','Có sổ khoản thu nội bộ','/tra-cuu-ho-so; /staff → Tài chính','Lập khoản thu, người nộp khai phương thức và mã chứng từ; không kết nối cổng thanh toán, VietQR hoặc Kho bạc và không tự chuyển tiền.'),
 ('33','Đã có luồng đối chiếu nội bộ','/staff → Sổ khoản thu','Ghi tham chiếu đối chiếu; lập, duyệt và ghi chứng từ thực hiện hoàn trả. Không coi khai báo của người nộp là xác nhận từ ngân hàng/Kho bạc.'),
 ('34','Đã có luồng nội bộ','/staff → Tiếp nhận và chi tiết','Tải tệp quét thực tế, gắn thông tin thành phần/số trang và mã băm vào hồ sơ; không tự tạo ảnh/PDF để giả làm bản quét giấy tờ.'),
 ('35','Đã có luồng nội bộ','Trang chủ → PAKN; tra cứu hồ sơ','Gửi PAKN, cơ quan trả lời và công khai phản hồi; ghi đánh giá hồ sơ theo điều kiện. Chưa gửi dữ liệu tới iHanoi hay cổng ngoài.'),
 ('36','Chưa triển khai nộp lưu','Mô hình gói nộp lưu trong thiết kế','Có dữ liệu và tài liệu trong hồ sơ, nhưng chưa có luồng lập gói, kiểm tra thành phần, gửi kho lưu trữ và nhận biên nhận nộp lưu chuyên ngành.'),
]
MODEL = json.loads((ROOT / '03_Thiet_ke/Huong_doi_tuong/Danh_muc_ca_su_dung.json').read_text('utf-8'))
NAMES = {item['id']: item['name'] for item in MODEL}
COVERAGE = [{'id':'UC'+n,'name':NAMES['UC'+n],'status':status,'ui':ui,'note':note} for n,status,ui,note in _COVERAGE]

def manifest():
    data = json.loads((ROOT / '03_Thiet_ke/Anh_giao_dien_he_thong/Danh_muc_anh_giao_dien.json').read_text('utf-8'))
    if data.get('errors') or len(data['captures']) != 45:
        raise ValueError('Expected 45 successful current-interface captures')
    return data
