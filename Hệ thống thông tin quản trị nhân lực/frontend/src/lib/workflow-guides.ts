export interface WorkflowStep { role: string; action: string; result: string; href: string; link: string }
export interface WorkflowHelp { title: string; summary: string; steps: WorkflowStep[]; blocked: string }

export const WORKFLOW_HELP = {
  overtime: {
    title: 'Làm thêm giờ', summary: 'Đăng ký → duyệt kế hoạch → xác nhận thực làm → chốt công và tính lương.',
    steps: [
      { role: 'Nhân viên', action: 'Chọn Đăng ký làm thêm, nhập ngày, giờ và lý do rồi gửi.', result: 'Đơn ở trạng thái Chờ duyệt.', href: '/overtime', link: 'Mở Làm thêm giờ' },
      { role: 'HR / quản lý / Giám đốc', action: 'Mở Phạm vi quản lý, chọn đơn của người khác rồi Duyệt kế hoạch.', result: 'Đã duyệt kế hoạch; chưa tính tiền OT.', href: '/overtime', link: 'Xử lý đơn OT' },
      { role: 'Người có quyền xác nhận', action: 'Sau ngày OT, chọn Xác nhận thực làm; nhập số giờ thực tế, giờ đêm, minh chứng và nhận xét. Nhập 0 nếu không thực hiện.', result: 'Giờ đã xác nhận trở thành căn cứ tính tiền trong kỳ lương.', href: '/hr-workflows?tab=attendance', link: 'Đến bước chốt công' },
    ], blocked: 'Không tự duyệt/xác nhận đơn của mình. Chưa hết ngày hoặc kỳ đã chốt thì chưa thể xác nhận. Chưa thấy nút xử lý: kiểm tra vai trò, phạm vi quản lý và trạng thái đơn.',
  },
  leave: {
    title: 'Nghỉ phép', summary: 'Kiểm tra quỹ → gửi đơn theo lịch ca → người khác phê duyệt.',
    steps: [
      { role: 'Nhân viên', action: 'Xem quỹ phép và cách phân bổ, chọn Đăng ký nghỉ phép, nhập loại nghỉ, khoảng ngày và lý do.', result: 'Hệ thống tính ngày nghỉ theo lịch ca và ngày lễ, không theo số ngày trên lịch.', href: '/leave', link: 'Mở Nghỉ phép' },
      { role: 'HR / quản lý', action: 'Mở danh sách thuộc phạm vi quản lý, xem đơn và duyệt hoặc từ chối.', result: 'Phép năm được trừ quỹ khi duyệt; công được cập nhật.', href: '/leave', link: 'Xử lý đơn nghỉ' },
      { role: 'HR', action: 'Đối chiếu đơn trước khi chốt công; ngày đã ghi công tác phải được đối soát trước khi duyệt phép.', result: 'Công và phép thống nhất trước tính lương.', href: '/hr-workflows?tab=attendance', link: 'Chốt công' },
    ], blocked: 'Không có ngày làm việc trong khoảng chọn, thiếu quỹ hoặc kỳ đã chốt sẽ không gửi/duyệt được. Quỹ cấp dự kiến cả năm khác với quỹ chỉ tích lũy đến hiện tại.',
  },
  travel: {
    title: 'Công tác và chi phí', summary: 'Đề xuất chuyến đi → duyệt → xác nhận ngày thực hiện; tạm ứng và quyết toán là các bước tài chính riêng.',
    steps: [
      { role: 'Nhân viên / người lập hộ có quyền', action: 'Chọn Đề xuất công tác, chọn đúng nhân viên, lịch trình và ngân sách rồi gửi.', result: 'Đơn chờ người khác phê duyệt.', href: '/expense-claims', link: 'Mở Công tác phí' },
      { role: 'HR / quản lý', action: 'Mở tab Đơn đề xuất công tác. Sau chuyến đi, chọn Xác nhận ngày thực hiện và chọn các ngày thực tế, đính đường dẫn minh chứng.', result: 'Ngày được xác nhận ghi công hưởng lương; duyệt lịch trình riêng chưa tạo công.', href: '/expense-claims', link: 'Xác nhận công tác' },
      { role: 'Người lập và kế toán', action: 'Chọn chuyến đi liên quan khi lập tạm ứng/bảng kê. Duyệt, ghi nhận chi tiền, rồi khóa đối soát và thu hồi phần tạm ứng dư nếu có.', result: 'Theo dõi được cả ngày công và thanh quyết toán của chuyến đi.', href: '/expense-claims', link: 'Tạm ứng và bảng kê' },
    ], blocked: 'Chỉ thấy hồ sơ trong quyền truy cập. Người lập không tự duyệt/chi tiền cho mình. Ngày công tác phải thuộc lịch ca, đã kết thúc và chưa chốt công; không trùng phép đã duyệt.',
  },
  assets: {
    title: 'Bàn giao và thu hồi tài sản', summary: 'HR giao tài sản → nhân viên xác nhận nhận → HR thu hồi khi bàn giao/nghỉ việc.',
    steps: [
      { role: 'HR / người quản lý tài sản', action: 'Chọn tài sản sẵn có, thực hiện Cấp phát và chọn nhân viên.', result: 'Tài sản chờ người nhận xác nhận.', href: '/assets', link: 'Mở Tài sản' },
      { role: 'Nhân viên được giao', action: 'Mở tài sản của mình, xác nhận tình trạng nhận hoặc từ chối nếu chưa thực nhận.', result: 'Nhận thành công: đã cấp phát. Từ chối: tài sản trở về kho.', href: '/assets', link: 'Xác nhận nhận tài sản' },
      { role: 'HR / người quản lý tài sản', action: 'Chọn Thu hồi và nhập biên bản/lý do sau khi kiểm tra tài sản thực tế.', result: 'Tài sản về kho, giữ lịch sử người được giao; làm được cả khi người đó đã khóa tài khoản.', href: '/assets', link: 'Thu hồi tài sản' },
    ], blocked: 'Tài sản còn chờ xác nhận vẫn thu hồi được; cần ghi lý do ít nhất 10 ký tự. Khóa tài khoản nhân viên không thay thế bước thu hồi tài sản.',
  },
  probation: {
    title: 'Kết luận thử việc', summary: 'Quản lý lập đánh giá → HR thẩm định → Giám đốc phê duyệt → áp dụng đúng ngày hiệu lực.',
    steps: [
      { role: 'Quản lý / người được phân quyền', action: 'Mở tab Thử việc, chọn nhân viên đang thử việc, nhập điểm, kết luận, ngày hiệu lực, đánh giá và minh chứng.', result: 'Đạt: cần điều khoản hợp đồng chính thức. Không đạt: không nhập lương/hợp đồng chính thức.', href: '/hr-workflows?tab=probation', link: 'Lập đánh giá thử việc' },
      { role: 'HR khác người lập', action: 'Kiểm tra hồ sơ rồi chọn HR xác minh.', result: 'Hồ sơ chuyển sang HR đã thẩm định.', href: '/hr-workflows?tab=probation', link: 'Thẩm định thử việc' },
      { role: 'Giám đốc khác người lập và thẩm định', action: 'Duyệt kết luận đạt hoặc không đạt. Từ chối kết luận nếu cần đánh giá lại.', result: 'Đến ngày hiệu lực: tiếp nhận chính thức hoặc kết thúc thử việc và tạo việc bàn giao.', href: '/assets', link: 'Kiểm tra tài sản bàn giao' },
    ], blocked: 'Cần các tài khoản độc lập ở từng bước, kể cả tài khoản quản trị. Quyết định có ngày tương lai chưa làm thay đổi trạng thái nhân viên ngay.',
  },
  promotion: {
    title: 'Thăng chức và điều chỉnh lương', summary: 'HR lập quyết định có chức danh mới → người khác duyệt → áp dụng theo ngày hiệu lực.',
    steps: [
      { role: 'HR', action: 'Mở Biến động nhân sự, tạo Điều chỉnh lương, chọn lý do Thăng chức; nhập chức danh, mức lương, khung lương và căn cứ.', result: 'Quyết định chờ phê duyệt, chưa đổi hồ sơ ngay.', href: '/personnel', link: 'Mở Biến động nhân sự' },
      { role: 'Giám đốc / cấp có quyền', action: 'Kiểm tra chức danh có thuộc khung lương được duyệt, rồi phê duyệt bằng tài khoản khác người lập.', result: 'Đến ngày hiệu lực, cập nhật lương, chức danh và lịch sử bổ nhiệm.', href: '/personnel', link: 'Duyệt quyết định' },
      { role: 'HR', action: 'Kiểm tra hồ sơ, lịch sử bổ nhiệm và cơ cấu lương cho chức danh mới.', result: 'Cơ cấu lương cũ được kết thúc; gán cơ cấu mới nếu vị trí có cơ cấu riêng.', href: '/payroll-engine', link: 'Kiểm tra cơ cấu lương' },
    ], blocked: 'Thiếu chức danh mới, chưa có khung hợp lệ hoặc mức ngoài khung sẽ bị chặn. Lương KPI không tự sinh quyết định thăng chức.',
  },
  recruitment: {
    title: 'Tuyển dụng và trạng thái ứng viên', summary: 'Duyệt chỉ tiêu → mở tuyển → sàng lọc/phỏng vấn → offer → nhận việc.',
    steps: [
      { role: 'Quản lý / tuyển dụng', action: 'Lập đề nghị chỉ tiêu; hoàn tất thẩm định và phê duyệt trước khi mở tuyển.', result: 'Đợt tuyển có căn cứ chỉ tiêu đã duyệt.', href: '/hr-workflows?tab=requisition', link: 'Chỉ tiêu tuyển dụng' },
      { role: 'Tuyển dụng / người phỏng vấn', action: 'Theo dõi hồ sơ ở ATS; cập nhật sàng lọc, kết quả phỏng vấn và offer đúng thứ tự.', result: 'Danh sách ứng viên liên kết phản ánh trạng thái ATS.', href: '/recruitment-ats', link: 'Mở Tuyển dụng ATS' },
      { role: 'Tuyển dụng', action: 'Ghi nhận phản hồi offer, thực hiện tiếp nhận theo các điều kiện hệ thống yêu cầu.', result: 'Tạo hồ sơ nhân viên và theo dõi hội nhập/thử việc.', href: '/hr-workflows?tab=onboarding', link: 'Theo dõi hội nhập' },
    ], blocked: 'Không dùng danh sách cũ để bỏ qua phỏng vấn hoặc offer. Ứng viên chưa liên kết ATS vẫn được quản lý như nguồn ứng viên cũ.',
  },
  kpi: {
    title: 'Giao và chốt KPI', summary: 'Tạo kỳ và xác định đối tượng → giao đủ mục tiêu → minh chứng/chấm điểm → đóng kỳ.',
    steps: [
      { role: 'HR / người có quyền tạo kỳ', action: 'Khởi tạo chu kỳ. Với doanh nghiệp, chọn toàn bộ nhân sự trong thời gian kỳ hoặc một danh sách cụ thể.', result: 'Phạm vi đánh giá được xác định rõ, không suy từ số người đã có KPI.', href: '/performance', link: 'Tạo kỳ đánh giá' },
      { role: 'Quản lý và nhân viên', action: 'Quản lý giao mục tiêu; nhân viên nộp minh chứng; người đánh giá chấm điểm và giải thích.', result: 'Mỗi người có đủ mục tiêu, trọng số, minh chứng và điểm.', href: '/performance', link: 'Giao và đánh giá KPI' },
      { role: 'Người có quyền đóng kỳ', action: 'Kiểm tra toàn bộ người thuộc phạm vi rồi đóng kỳ; nếu bị chặn, hoàn tất người được nêu trong thông báo.', result: 'Kỳ doanh nghiệp chỉ đóng khi đủ người và đủ dữ liệu. Khu vực công có thêm điều kiện theo loại kỳ.', href: '/performance', link: 'Kiểm tra và đóng kỳ' },
    ], blocked: 'Không tự giao KPI cho mình. Người mới trong thời gian kỳ toàn bộ cũng cần được xử lý. Chỉ chấm đủ cho người đã có mục tiêu chưa đủ điều kiện đóng kỳ.',
  },
  payroll: {
    title: 'Chốt công và trả lương', summary: 'Xử lý đơn/công → chốt tháng → tính lương → đối soát độc lập → duyệt/khóa → ghi nhận trả.',
    steps: [
      { role: 'Nhân viên / quản lý / HR', action: 'Xử lý nghỉ phép, OT, giải trình thiếu cặp và xác nhận công tác. Tại Quy trình & xác nhận → Chốt công, chốt tháng đã kết thúc.', result: 'Bản công đã chốt là căn cứ tính lương.', href: '/hr-workflows?tab=attendance', link: 'Mở bước chốt công' },
      { role: 'HR và người đối soát độc lập', action: 'Tạo kỳ lương; kiểm tra phiếu rồi đăng nhập tài khoản khác người tính để đối soát. Giám đốc khác người tính/đối soát phê duyệt.', result: 'Bảng lương được duyệt và khóa theo vai trò.', href: '/payroll-engine', link: 'Mở Tiền lương' },
      { role: 'Kế toán / quản trị có quyền', action: 'Sau khi chi trả thực tế, ghi hình thức và mã giao dịch/chứng từ để xác nhận đã trả.', result: 'Giữ bằng chứng thanh toán. Kỳ đã trả không được hủy để tính lại.', href: '/payroll-guide', link: 'Xem hướng dẫn lương chi tiết' },
    ], blocked: 'Còn đơn chờ duyệt hoặc OT chưa xác nhận thì chưa chốt được công. Mở lại công làm bảng lương cũ hết căn cứ: hủy kỳ chưa trả, chốt lại và tính mới. Hồ sơ lương người vào giữa tháng phải có hiệu lực từ ngày vào làm.',
  },
} satisfies Record<string, WorkflowHelp>;

export type WorkflowKey = keyof typeof WORKFLOW_HELP;
export const ROUTE_WORKFLOW: Record<string, WorkflowKey> = {
  '/overtime': 'overtime', '/leave': 'leave', '/assets': 'assets', '/expense-claims': 'travel',
  '/personnel': 'promotion', '/recruitment-ats': 'recruitment', '/performance': 'kpi', '/payroll-engine': 'payroll',
};
