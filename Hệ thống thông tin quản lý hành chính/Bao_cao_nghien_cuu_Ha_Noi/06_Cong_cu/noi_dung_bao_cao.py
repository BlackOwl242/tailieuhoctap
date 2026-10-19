"""Nội dung dùng chung cho báo cáo và hướng dẫn vận hành."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DATE = '19/10/2026'  # Ngày chụp ảnh.
OVERVIEW = [
 'Giao diện hệ thống gồm cổng dành cho người dân và bàn làm việc dành cho cán bộ. Người dân có thể tìm thủ tục, chuẩn bị hồ sơ, nộp trực tuyến và theo dõi kết quả. Cán bộ sử dụng bàn làm việc để tiếp nhận, phân công, thẩm định, phê duyệt và trả kết quả. Dữ liệu được lưu theo từng hồ sơ để các bộ phận tiếp tục xử lý và theo dõi những công việc đã thực hiện.',
 'Trên cổng công dân, danh mục thủ tục cung cấp thông tin về cơ quan giải quyết, thành phần hồ sơ, thời hạn và khoản thu. Biểu mẫu nộp hồ sơ được chia thành năm bước, từ lựa chọn thủ tục đến kiểm tra thông tin trước khi gửi. Sau khi gửi, người nộp nhận mã hồ sơ và khóa tra cứu để theo dõi tiến độ, bổ sung tài liệu và xem kết quả.',
 'Bàn làm việc được tổ chức theo trách nhiệm của từng cán bộ. Hồ sơ đã tiếp nhận được chuyển cho chuyên viên phụ trách; dự thảo sau thẩm định được trình lãnh đạo phê duyệt. Văn thư kiểm tra chữ ký, cấp số, phát hành và ghi nhận việc giao kết quả. Với hồ sơ có khoản thu, bộ phận tài chính đối chiếu chứng từ hoặc ghi nhận miễn thu trước khi hồ sơ được ký và phát hành.',
 'Các tình huống phát sinh được xử lý ngay trong hồ sơ. Yêu cầu bổ sung, từ chối tiếp nhận và gia hạn lần lượt sử dụng Mẫu 02, Mẫu 03 và Mẫu 04. Trường hợp dừng giải quyết được theo dõi bằng yêu cầu Mẫu 05 và thông báo Mẫu 06 đã ký, phát hành. Mỗi thao tác đều gắn với người thực hiện, thời điểm và tài liệu liên quan.',
]
ROLE_ROWS = [
 ['Công dân, tổ chức','Tìm thủ tục, kê khai, gửi và bổ sung tài liệu; theo dõi tiến độ, khai chứng từ và nhận kết quả','Hồ sơ cùng tài liệu gửi đến cơ quan giải quyết'],
 ['Cán bộ tiếp nhận','Kiểm tra thành phần, tiếp nhận trực tuyến hoặc tại quầy, lập phiếu và phân công xử lý','Hồ sơ hợp lệ, giấy hẹn và chuyên viên phụ trách'],
 ['Chuyên viên thụ lý','Thẩm định, ghi ý kiến, chuẩn bị dự thảo và trình duyệt; xử lý bổ sung hoặc gia hạn','Dự thảo kết quả và căn cứ giải quyết'],
 ['Lãnh đạo','Phê duyệt hoặc trả lại dự thảo; ký khi được cấp quyền; ghi nhận phát hành thông báo dừng','Kết quả đã duyệt và thông tin người ký'],
 ['Văn thư','Kiểm tra điều kiện phát hành, cấp số và ghi nhận việc giao kết quả','Văn bản phát hành và chứng cứ giao nhận'],
 ['Kế toán, tài chính','Đối chiếu khoản thu; lập, duyệt và ghi nhận chứng từ hoàn trả','Kết quả đối chiếu, căn cứ miễn thu hoặc hoàn trả'],
 ['Quản trị viên','Quản lý tài khoản, quyền, danh mục thủ tục, biểu mẫu, tin tức và báo cáo','Tài khoản còn hiệu lực và cấu hình phục vụ tác nghiệp'],
]
FLOW_ROWS = [
 ['1','Người nộp hoặc cán bộ tiếp nhận','Gửi hồ sơ','Tạo mã hồ sơ, lưu tờ khai, tài liệu và cơ quan tiếp nhận; trạng thái CHO_TIEP_NHAN'],
 ['2','Cán bộ tiếp nhận','Tiếp nhận','Lưu Mẫu 01 và hạn giải quyết; chuyển DA_TIEP_NHAN'],
 ['3','Cán bộ tiếp nhận','Phân công','Ghi chuyên viên phụ trách; chuyển DANG_THU_LY'],
 ['4','Chuyên viên','Thẩm định, trình duyệt','Lưu ý kiến và dự thảo; chuyển TRINH_DUYET'],
 ['5','Lãnh đạo','Phê duyệt','Chốt nội dung và người duyệt; chuyển DA_PHE_DUYET'],
 ['6','Tài chính và người ký','Đối chiếu khoản thu, ký','Lưu chứng từ, căn cứ miễn thu và chữ ký gắn với nội dung đã duyệt'],
 ['7','Văn thư','Phát hành','Cấp số, lưu bản phát hành; chuyển DA_PHAT_HANH'],
 ['8','Văn thư, người nhận','Giao kết quả','Lưu người nhận, kênh giao và chứng cứ; chuyển HOAN_THANH'],
]
UI_GROUP_ROWS = [
 ['Cổng công dân','Trang chủ và các dịch vụ trực tuyến','Danh mục, chi tiết thủ tục, nộp và tra cứu hồ sơ, lịch hẹn, phản ánh và tin tức'],
 ['Bàn làm việc','Các chức năng tác nghiệp','Tổng quan, hộp xử lý, tiếp nhận tại quầy, chi tiết hồ sơ, giám sát tiến độ và nhật ký'],
 ['Quản trị','Tài khoản và cấu hình','Phân quyền, báo cáo, danh mục, biên tập tin tức, quyền ký và sổ khoản thu'],
 ['Hướng dẫn','Cẩm nang theo vai trò','Hướng dẫn cho công dân, tổ chức và sáu vai trò cán bộ, kèm liên kết đến chức năng cần dùng'],
]
CMS_ROWS = [
 ['Lưu bản nháp','Quản trị viên','Giữ nội dung để tiếp tục biên tập'],
 ['Xuất bản, cập nhật','Quản trị viên','Hiển thị bài trên cổng công dân và lưu lịch sử thay đổi'],
 ['Lưu trữ, khôi phục','Quản trị viên','Ẩn bài đã lưu trữ hoặc đưa về bản nháp để chỉnh sửa'],
 ['Kiểm tra phiên bản','Hệ thống','Yêu cầu tải lại khi bài đã được sửa bởi thao tác khác'],
]
IMPLEMENTATION_NOTES = [
 'Ứng dụng được xây dựng bằng React, TypeScript và Python, sử dụng SQLite để lưu hồ sơ và dữ liệu tác nghiệp. Các chức năng tiếp nhận, phân công, thẩm định, phê duyệt, phát hành và giao kết quả dùng chung thông tin hồ sơ. Nhật ký giúp xác định người thực hiện và kiểm tra những thay đổi trong quá trình giải quyết.',
 'Phần hướng dẫn được tổ chức theo bảy nhóm người sử dụng. Người dân được hướng dẫn cách chuẩn bị, gửi và tra cứu hồ sơ; cán bộ được hướng dẫn các công việc thuộc trách nhiệm của mình. Quản trị viên cấp tài khoản và quản lý quyền trong ứng dụng. Các báo cáo tổng hợp số liệu từ hồ sơ đã lưu theo cơ quan, thủ tục và kỳ thống kê.',
 'Bộ cấu hình biểu mẫu có 2.075 bản ghi tham chiếu, gồm 1.547 bản ghi mang nhãn nguồn official-dvcqg-eform, 525 bản ghi mang nhãn qd492-configured-eform và 3 bản ghi chưa có nhãn nguồn. Dữ liệu này được dùng để dựng tờ khai và danh sách tài liệu cần nộp. Trước khi áp dụng cho một thủ tục cụ thể, cơ quan nghiệp vụ cần đối chiếu thành phần, thời hạn, phí và thẩm quyền với văn bản đang có hiệu lực.',
 'Các kết nối với Cổng Dịch vụ công quốc gia, VNeID, cơ sở dữ liệu dân cư, thanh toán, chứng thư số công vụ, bưu chính và lưu trữ ngoài chưa được triển khai. Vì vậy, ứng dụng hiện sử dụng chữ ký Ed25519 để kiểm tra tính toàn vẹn của dữ liệu kết quả và ghi nhận chứng từ thu, hoàn phí do người sử dụng cung cấp. Việc tích hợp các dịch vụ trên cần có tài khoản, giao diện kết nối và môi trường do đơn vị quản lý cấp.',
]
_COVERAGE = [
 ('01','Đã hỗ trợ','Quản lý tài khoản','Cấp, khóa tài khoản; thay đổi vai trò, đơn vị, thời hạn và quyền ký. Tài khoản quản trị được xem hồ sơ; việc tách riêng quyền quản trị hạ tầng cần bổ sung.'),
 ('02','Hỗ trợ một phần','Danh mục thủ tục','Quản lý thủ tục, lĩnh vực và cơ quan tiếp nhận. Các danh mục liên ngành khác cần tiếp tục hoàn thiện.'),
 ('03','Hỗ trợ một phần','Cập nhật thủ tục','Lưu thay đổi và phiên bản thủ tục. Cần bổ sung quy trình duyệt, công bố phiên bản theo ngày hiệu lực.'),
 ('04','Chưa hỗ trợ','Cấu hình trạng thái','Trạng thái và điều kiện chuyển bước được quy định trong chương trình; chưa có màn hình cho quản trị viên tự cấu hình.'),
 ('05','Đã hỗ trợ','Nộp hồ sơ trực tuyến','Kê khai qua năm bước, tải tài liệu, kiểm tra và gửi. Hồ sơ được cấp mã cùng khóa tra cứu sau khi người nộp xác nhận.'),
 ('06','Hỗ trợ một phần','Hộp xử lý','Chuyển hồ sơ giữa tiếp nhận, chuyên viên, lãnh đạo và văn thư. Tuyến xử lý liên cơ quan tùy biến cần bổ sung.'),
 ('07','Đã hỗ trợ','Chi tiết hồ sơ','Thực hiện nghiệp vụ theo vai trò, cơ quan và trạng thái; kiểm tra phiên bản và lưu nhật ký thay đổi.'),
 ('08','Đã hỗ trợ','Theo dõi tiến độ','Người nộp tra cứu bằng mã và khóa. Cán bộ theo dõi thời hạn, ý kiến và nhật ký trong phạm vi được giao.'),
 ('09','Chưa hỗ trợ','Thiết kế quy trình','Quy trình được thể hiện bằng sơ đồ UML. Chức năng biên tập quy trình trực quan cần phát triển thêm.'),
 ('10','Ký trong ứng dụng','Ký kết quả','Ký dữ liệu đã duyệt bằng Ed25519, kiểm tra quyền và khoản thu. Lãnh đạo đủ quyền có thể vừa duyệt vừa ký. Chứng thư số công vụ cần tích hợp riêng.'),
 ('11','Chưa kết nối','Dịch vụ ký số','Cần tích hợp chứng thư, thiết bị hoặc dịch vụ ký của nhà cung cấp được phép sử dụng.'),
 ('12','Đã hỗ trợ','Tiếp nhận hồ sơ','Kiểm tra hồ sơ trực tuyến hoặc tại quầy, lập Mẫu 01–03 và tính hạn theo thủ tục, lịch làm việc.'),
 ('13','Đã hỗ trợ','Bổ sung hồ sơ','Gửi yêu cầu, nhận tài liệu bổ sung và tiếp tục xử lý từ giai đoạn đã lưu.'),
 ('14','Đã hỗ trợ','Phân công chuyên viên','Chọn chuyên viên trong cơ quan, lưu trách nhiệm được giao và lịch sử phân công.'),
 ('15','Hỗ trợ một phần','Thẩm định hồ sơ','Ghi ý kiến, soạn dự thảo và trình duyệt. Cần bổ sung nhiệm vụ phối hợp liên cơ quan có thời hạn và phản hồi riêng.'),
 ('16','Đã hỗ trợ','Duyệt, phát hành','Thực hiện riêng từng bước duyệt, ký và cấp số phát hành; kiểm tra chữ ký cùng điều kiện khoản thu.'),
 ('17','Đã hỗ trợ','Dừng giải quyết','Lưu Mẫu 05, kiểm tra điều kiện, lập thông báo và ghi nhận Mẫu 06 đã ký, phát hành trước khi kết thúc hồ sơ.'),
 ('18','Đã hỗ trợ','Trả kết quả','Ghi người nhận, phương thức và chứng cứ giao. Mã vận đơn được nhập để theo dõi thủ công.'),
 ('19','Đã hỗ trợ','In biểu mẫu, báo cáo','Xem và in biểu mẫu, kết quả, bảng kê và sổ Mẫu 08; xuất danh sách ra CSV.'),
 ('20','Hỗ trợ một phần','Thông báo hồ sơ','Hiển thị tiến độ và thông báo trong ứng dụng. Việc gửi SMS, thư điện tử cần tích hợp dịch vụ ngoài.'),
 ('21','Đã hỗ trợ','Tra cứu hồ sơ','Tra cứu bằng mã hồ sơ và khóa riêng; cán bộ tìm theo phạm vi cơ quan và quyền được cấp.'),
 ('22','Đã hỗ trợ cẩm nang','Hướng dẫn sử dụng','Có hướng dẫn theo bảy nhóm người dùng và liên kết mở chức năng. Cần bổ sung kho hướng dẫn theo hiệu lực và công cụ tìm toàn văn.'),
 ('23','Đã hỗ trợ','Báo cáo theo cơ quan','Tổng hợp theo kỳ, mở danh sách hồ sơ, xuất CSV và in Mẫu 08. Kết nối nền tảng báo cáo ngoài cần bổ sung.'),
 ('24','Hỗ trợ một phần','Mẫu báo cáo','Sử dụng các mẫu đã lập trình. Chức năng tự thiết kế, duyệt và công bố mẫu báo cáo cần phát triển thêm.'),
 ('25','Đã hỗ trợ','Thống kê hồ sơ','Tổng hợp hồ sơ trong ứng dụng theo phạm vi quyền, cơ quan, trạng thái và kỳ báo cáo.'),
 ('26','Đã hỗ trợ','Giám sát tiến độ','Theo dõi hồ sơ sắp hạn, quá hạn và khối lượng công việc; mở danh sách chi tiết để xem trách nhiệm xử lý.'),
 ('27','Hỗ trợ một phần','Ý kiến xử lý','Ghi ý kiến khi duyệt, trả lại hoặc từ chối. Cần bổ sung văn bản chỉ đạo có người nhận, hạn trả lời và phản hồi riêng.'),
 ('28','Hỗ trợ một phần','Tài liệu hồ sơ','Lưu tài liệu, kết quả và kiểm tra quyền truy cập. Phân loại, hạn bảo quản và quản lý kho chuyên ngành cần hoàn thiện.'),
 ('29','Chưa hỗ trợ','Tái sử dụng tài liệu','Cần kết nối nguồn dữ liệu, xác minh chủ thể và quyền khai thác trước khi dùng lại tài liệu từ hồ sơ khác.'),
 ('30','Chưa kết nối','Nhận dữ liệu liên thông','Cần xây dựng giao diện nhận sự kiện, xác thực nguồn gửi và đối chiếu dữ liệu với hệ thống đối tác.'),
 ('31','Chưa kết nối','Cổng Dịch vụ công quốc gia','Ứng dụng có liên kết mở cổng quốc gia. Việc gửi hồ sơ và đồng bộ trạng thái qua API cần triển khai thêm.'),
 ('32','Theo dõi khoản thu','Kê khai chứng từ','Lập khoản thu và ghi phương thức, mã chứng từ do người nộp cung cấp. Thanh toán trực tuyến cần tích hợp ngân hàng hoặc Kho bạc.'),
 ('33','Đối chiếu chứng từ','Sổ khoản thu','Ghi tham chiếu đối chiếu; lập, duyệt và ghi nhận chứng từ hoàn trả. Xác nhận giao dịch tự động phụ thuộc kết nối tài chính.'),
 ('34','Đã hỗ trợ','Số hóa hồ sơ','Tải bản quét, ghi thành phần, số trang và mã băm để quản lý tài liệu trong hồ sơ.'),
 ('35','Đã hỗ trợ','Phản ánh, đánh giá','Tiếp nhận phản ánh, phân công trả lời, công khai phản hồi và ghi đánh giá hồ sơ. Kết nối iHanoi cần bổ sung.'),
 ('36','Chưa hỗ trợ','Nộp lưu hồ sơ','Cần phát triển việc lập gói, kiểm tra thành phần, gửi kho lưu trữ và nhận biên nhận nộp lưu.'),
]
MODEL=json.loads((ROOT/'03_Thiet_ke/Huong_doi_tuong/Danh_muc_ca_su_dung.json').read_text('utf-8'))
NAMES={r['id']:r['name'] for r in MODEL}
COVERAGE=[{'id':'UC'+n,'name':NAMES['UC'+n],'status':s,'ui':ui,'note':note} for n,s,ui,note in _COVERAGE]
UI_TITLES={
 1:'Trang chủ dịch vụ công Hà Nội trên máy tính',
 2:'Trang chủ trên điện thoại',
 3:'Danh mục thủ tục công dân',
 4:'Chi tiết thủ tục và thông tin thực hiện',
 5:'Bước 1 chọn thủ tục và cơ quan tiếp nhận',
 6:'Bước 2 khai thông tin người yêu cầu',
 7:'Bước 3 tờ khai theo thủ tục được chọn',
 8:'Bước 4 thành phần hồ sơ và tài liệu đính kèm',
 9:'Bước 5 kiểm tra trước khi gửi hồ sơ',
 10:'Tra cứu hồ sơ bằng mã và khóa tra cứu',
 11:'Đặt lịch hẹn tại bộ phận một cửa',
 12:'Gửi phản ánh, kiến nghị',
 13:'Chi tiết tin tức công khai',
 14:'Đăng nhập bàn cán bộ',
 15:'Tổng quan công việc cán bộ tiếp nhận',
 16:'Hộp xử lý hồ sơ theo phạm vi cơ quan',
 17:'Lập phiếu tiếp nhận trực tiếp tại quầy',
 18:'Chi tiết hồ sơ và thao tác được phép',
 19:'Hộp xử lý của chuyên viên thụ lý',
 20:'Hộp xử lý của lãnh đạo phê duyệt',
 21:'Hộp xử lý của văn thư phát hành',
 22:'Hộp xử lý của cán bộ tài chính',
 23:'Giám sát tiến độ và hạn xử lý hồ sơ',
 24:'Nhật ký xử lý và luân chuyển hồ sơ',
 25:'Trạng thái tích hợp và dịch vụ nội bộ',
 26:'Thông tin tài khoản và phạm vi quyền',
 27:'Bảo mật tài khoản và phiên đăng nhập',
 28:'Tổng quan quản trị hệ thống',
 29:'Danh bạ tài khoản và phân quyền',
 30:'Đề nghị cấp mới và điều chỉnh quyền tài khoản',
 31:'Biểu mẫu lập đề nghị cấp tài khoản',
 32:'Báo cáo hồ sơ theo cơ quan và trạng thái',
 33:'Danh mục thủ tục trong bàn quản trị',
 34:'Chi tiết và dữ liệu tham chiếu thủ tục',
 35:'Danh sách và trạng thái tin trên cổng',
 36:'Biểu mẫu biên tập tin tức',
 37:'Quản lý quyền ký thử nghiệm nội bộ',
 38:'Sổ khoản thu và đối soát trong phạm vi cơ quan',
 39:'Hướng dẫn người dân: tra cứu và lập hồ sơ',
 40:'Hướng dẫn cán bộ: Cán bộ tiếp nhận',
 41:'Hướng dẫn cán bộ: Chuyên viên thụ lý',
 42:'Hướng dẫn cán bộ: Lãnh đạo phê duyệt',
 43:'Hướng dẫn cán bộ: Văn thư phát hành',
 44:'Hướng dẫn cán bộ: Cán bộ tài chính',
 45:'Hướng dẫn cán bộ: Quản trị hệ thống',
}

def manifest():
    data=json.loads((ROOT/'03_Thiet_ke/Anh_giao_dien_he_thong/Danh_muc_anh_giao_dien.json').read_text('utf-8'))
    if data.get('errors') or len(data['captures'])!=45:
        raise ValueError('Bộ ảnh phải có đủ 45 màn hình và không có lỗi chụp.')
    return data
