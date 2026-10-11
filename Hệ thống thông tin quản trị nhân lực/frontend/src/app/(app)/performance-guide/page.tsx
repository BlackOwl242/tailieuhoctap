'use client';

import Link from 'next/link';
import {
  ArrowRight, BellRing, Calendar, CheckCircle2, ClipboardCheck, FileSearch,
  Scale, Target, UserRoundCheck,
} from 'lucide-react';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { Button, Card } from '@/components/ui/primitives';
import { isEnterpriseSector, useOrgConfig } from '@/lib/org-config';

export default function PerformanceGuidePage() {
  const [orgConfig] = useOrgConfig();
  const isEnterprise = isEnterpriseSector(orgConfig);
  const publicEmployee = orgConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE';
  const publicRule = publicEmployee ? 'Nghị định 233/2026/NĐ-CP' : 'Nghị định 335/2025/NĐ-CP';

  const steps = isEnterprise ? [
    {
      number: '1', title: 'Tạo chu kỳ đánh giá', owner: 'HR / Quản trị nhân sự', icon: Calendar,
      text: 'HR chọn năm, ngày bắt đầu và ngày kết thúc tại mục Chu kỳ đánh giá. Chu kỳ chụp lại chế độ doanh nghiệp hoặc khu vực công đang cấu hình; chỉ tạo một kỳ khi phạm vi thời gian và cách đánh giá đã rõ.',
      href: '/performance?tab=cycles', action: 'Mở chu kỳ',
    },
    {
      number: '2', title: 'Xác định mục tiêu theo công việc', owner: 'Trưởng bộ phận / Quản lý trực tiếp', icon: Target,
      text: 'Chọn chỉ tiêu mà nhân viên có thể tác động; ghi mức cần đạt, cách đo, thời hạn và nguồn đối chiếu. Với đơn vị, mục tiêu được tạo thành bản ghi riêng cho từng nhân sự đủ điều kiện trong đơn vị và các đơn vị cấp dưới. Quản lý phải quy đổi chỉ tiêu chung thành phần việc có thể đánh giá công bằng.',
      href: '/performance?tab=goals', action: 'Mở mục tiêu KPI',
    },
    {
      number: '3', title: 'Giao KPI và báo cho nhân viên', owner: 'HR hoặc Quản lý được phân quyền', icon: BellRing,
      text: 'Chọn phạm vi cá nhân hoặc phòng ban/khối. Khi giao theo đơn vị, hệ thống tạo mục tiêu cho từng nhân sự đang làm việc trong phạm vi đó, kiểm tra trùng tên và tổng trọng số, rồi gửi một thông báo in-app cho mỗi người nhận. Người giao không tự giao mục tiêu cho chính mình.',
      href: '/performance?tab=goals', action: 'Giao mục tiêu',
    },
    {
      number: '4', title: 'Cập nhật kết quả trong kỳ', owner: 'Nhân viên', icon: FileSearch,
      text: 'Nhân viên mở mục Thông báo hoặc Đánh giá KPI, xem chỉ tiêu được giao và nhập kết quả thực tế. Đính kèm căn cứ có thể kiểm tra như báo cáo, biên bản nghiệm thu, số liệu công việc hoặc tài liệu vận hành. KPI doanh nghiệp chưa tự lấy số liệu từ CRM, Jira hay hệ thống nghiệp vụ khác.',
      href: '/notifications', action: 'Mở thông báo',
    },
    {
      number: '5', title: 'Đối chiếu và chấm từng KPI', owner: 'Quản lý trực tiếp', icon: UserRoundCheck,
      text: 'Quản lý xem chỉ số, kết quả và minh chứng; trao đổi với nhân viên về chênh lệch hoặc yếu tố ngoài khả năng kiểm soát. Hệ thống chỉ cho lưu điểm 0–100 khi KPI đã có minh chứng. Điểm kỳ bằng tổng điểm từng KPI nhân với trọng số.',
      href: '/performance?tab=goals', action: 'Rà soát kết quả',
    },
    {
      number: '6', title: 'Rà soát và đóng chu kỳ', owner: 'HR / Người có quyền quản lý chu kỳ', icon: CheckCircle2,
      text: 'HR rà soát danh sách nhân sự, tổng trọng số 100% cho từng người, điểm và minh chứng. Hệ thống chặn đóng kỳ nếu còn mục tiêu thiếu trọng số, điểm hoặc minh chứng. Sau khi đóng, kết quả được giữ làm lịch sử; thưởng, tăng lương hoặc quyết định nhân sự vẫn cần quy chế và phê duyệt riêng.',
      href: '/performance?tab=cycles', action: 'Kiểm tra chu kỳ',
    },
  ] : [
    {
      number: '1', title: 'Tạo kỳ theo đúng loại đơn vị', owner: 'HR / Quản trị nhân sự', icon: Target,
      text: `Chọn loại nhân sự công chức hoặc viên chức trong cấu hình tổ chức trước khi tạo kỳ. Kỳ đánh giá lưu ảnh chụp chế độ và căn cứ áp dụng (${publicRule}); thay đổi cấu hình chỉ ảnh hưởng các kỳ mới.`,
      href: '/performance?tab=cycles', action: 'Xem chu kỳ đánh giá',
    },
    {
      number: '2', title: 'Giao tiêu chí và nhiệm vụ', owner: 'Thủ trưởng đơn vị / Quản lý trực tiếp', icon: FileSearch,
      text: 'Khung hiện tại chia 30 điểm cho tiêu chí chung và 70 điểm cho kết quả thực hiện nhiệm vụ; từng nhóm có tổng trọng số riêng bằng 100%. Nhập kết quả, căn cứ và nhận xét theo nhiệm vụ được giao.',
      href: '/performance?tab=goals', action: 'Mở tiêu chí đánh giá',
    },
    {
      number: '3', title: 'Chấm và rà soát theo thẩm quyền', owner: 'Quản lý, HR và người có thẩm quyền', icon: UserRoundCheck,
      text: 'Người có thẩm quyền xem điểm, điều kiện xếp loại, nhóm nhiệm vụ tương đồng và căn cứ kết luận. Hệ thống lưu quyết định, lý do và bước hiệu chuẩn; không tự nâng mức xếp loại vượt ngưỡng điểm.',
      href: '/performance?tab=cycles', action: 'Xem trạng thái chu kỳ',
    },
    {
      number: '4', title: 'Lưu kết luận và đóng kỳ', owner: 'Cơ quan có thẩm quyền / HR', icon: Scale,
      text: 'Tỷ lệ xếp loại xuất sắc và ngoại lệ chỉ được kiểm tra trong phạm vi khu vực công theo nhóm đơn vị, nhóm nhiệm vụ và quy định áp dụng. Đây không phải hạn ngạch KPI doanh nghiệp. Biểu mẫu pháp quy, chữ ký số và toàn bộ quy trình phê duyệt cơ quan cần được cấu hình, kiểm chứng riêng.',
      href: '/performance?tab=cycles', action: 'Kiểm tra trạng thái kỳ',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Quy trình đánh giá KPI"
        description={isEnterprise
          ? 'Hướng dẫn đánh giá KPI theo chế độ doanh nghiệp tư nhân đã chọn trong cấu hình tổ chức.'
          : `Hướng dẫn đánh giá công chức hoặc viên chức theo chế độ tổ chức đã chọn; căn cứ hiện hành: ${publicRule}.`}
        breadcrumbs={[{ label: 'Phát triển' }, { label: 'Cách đánh giá nhân sự' }]}
        actions={<Link href="/performance"><Button><ClipboardCheck className="h-4 w-4" />Đi đến đánh giá KPI</Button></Link>}
      />

      <Card className="border-primary/25 bg-primary/5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold"><Scale className="h-5 w-5 text-primary" />Khung áp dụng cho tổ chức này</h2>
        {isEnterprise ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><p className="font-medium">Kết quả KPI</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Đo tiến độ, chất lượng, sản lượng, mức phục vụ hoặc độ chính xác theo vị trí. Chỉ tiêu phải nằm trong phạm vi người được đánh giá có thể tác động và có nguồn dữ liệu để đối chiếu.</p></div>
            <div><p className="font-medium">Cách tổng hợp điểm</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Quản lý chấm từng KPI trên thang 0–100 dựa vào kết quả và minh chứng. Điểm chu kỳ là tổng điểm KPI nhân với trọng số của từng mục tiêu; tổng trọng số phải bằng 100%.</p></div>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><p className="font-medium">Điểm đánh giá</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Kỳ công vụ hiện dùng 30 điểm tiêu chí chung và 70 điểm kết quả nhiệm vụ. Mức xếp loại phải căn cứ ngưỡng điểm, điều kiện pháp lý, nhận xét và kết luận của cấp có thẩm quyền.</p></div>
            <div><p className="font-medium">Hiệu chuẩn thuộc khu vực công</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Hệ thống ghi kết luận cuối, nhóm nhiệm vụ, căn cứ và kiểm tra tỷ lệ xuất sắc trong phạm vi khu vực công. Không áp dụng tỷ lệ này cho doanh nghiệp; mẫu pháp quy và ký duyệt chính thức vẫn cần tích hợp, xác nhận theo từng cơ quan.</p></div>
          </div>
        )}
      </Card>

      {isEnterprise && <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="font-semibold">Kết quả được tính từ đâu?</h2>
        <p className="text-sm leading-6 text-muted-foreground">Người quản lý thiết lập mục tiêu, chỉ số đo và trọng số; nhân viên cập nhật kết quả cùng minh chứng trong kỳ. Cuối kỳ, quản lý đối chiếu dữ liệu đã ghi nhận và chấm từng KPI. Hệ thống hiện lưu kết quả và minh chứng do người dùng nhập, chưa tự lấy số liệu từ doanh số, ticket, SLA hay các hệ thống nghiệp vụ khác.</p>
        <div className="rounded-lg bg-background p-4 text-sm leading-6">
          <p><b>Điểm KPI</b> = điểm do quản lý chấm sau khi đối chiếu kết quả và minh chứng.</p>
          <p><b>Điểm chu kỳ</b> = tổng điểm mục tiêu × trọng số mục tiêu; trọng số mục tiêu của nhân viên phải cộng đủ 100%.</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">Vì vậy, để đánh giá sát thực tế, đầu kỳ hai bên nên thống nhất mức gốc, mục tiêu, đơn vị đo, nguồn kiểm chứng, thời hạn và cách xử lý yếu tố ngoài khả năng kiểm soát. Trong kỳ cập nhật kết quả cùng minh chứng; cuối kỳ dùng chứng cứ đó để chấm. KPI không tự quyết định tăng lương hoặc thưởng; P3 vẫn cần chính sách và quy trình phê duyệt riêng.</p>
      </Card>}

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Các bước đánh giá nhân sự">
        {steps.map(({ number, title, owner, icon: Icon, text, href, action }) => (
          <Card key={number} className="flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{number}</span>
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</h2>
                <p className="text-xs font-medium text-foreground">Phụ trách: {owner}</p>
                <p className="text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </div>
            <Link href={href} className="mt-auto inline-flex items-center gap-1 pl-12 text-sm font-medium text-primary hover:underline">{action}<ArrowRight className="h-4 w-4" /></Link>
          </Card>
        ))}
      </section>

      <Card className="space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="font-semibold">Ai làm gì trong một kỳ đánh giá?</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Mỗi kết quả cần có người giao mục tiêu, người thực hiện, người đối chiếu và người chịu trách nhiệm đóng kỳ.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border p-4"><h3 className="font-medium">HR / Nhân sự</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Tạo kỳ, chọn thời gian, theo dõi mục tiêu và nhắc các đơn vị còn thiếu kết quả, minh chứng hoặc trọng số.</p></div>
          <div className="rounded-lg border border-border p-4"><h3 className="font-medium">Trưởng bộ phận / Quản lý</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Thống nhất mục tiêu phù hợp vai trò; rà kết quả và minh chứng; chấm KPI cho nhân viên thuộc phạm vi quản lý. Không tự chấm KPI của chính mình.</p></div>
          <div className="rounded-lg border border-border p-4"><h3 className="font-medium">Nhân viên</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Nhận thông báo trong hệ thống khi được giao KPI, xem mục tiêu trong kỳ, cập nhật kết quả và cung cấp căn cứ có thể đối chiếu.</p></div>
          <div className="rounded-lg border border-border p-4"><h3 className="font-medium">Người có thẩm quyền</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{isEnterprise ? 'HR hoặc người được phân quyền kiểm tra điều kiện hoàn tất và đóng kỳ. Kết quả KPI không tự quyết định lương, thưởng hay bổ nhiệm.' : 'Với kỳ công vụ, người có thẩm quyền lưu kết luận cuối và căn cứ áp dụng; HR kiểm tra điều kiện và tỷ lệ trước khi khóa kỳ.'}</p></div>
        </div>
      </Card>

      <Card className="space-y-3 border-border p-5 sm:p-6">
        <h2 className="font-semibold">Điều kiện để đóng kỳ</h2>
        {isEnterprise ? (
          <p className="text-sm leading-6 text-muted-foreground">Mỗi nhân viên trong kỳ phải có tổng trọng số KPI bằng 100%. Từng KPI phải có kết quả chấm của quản lý và ít nhất một minh chứng. Nếu một người còn thiếu bất kỳ điều kiện nào, hệ thống không cho chuyển kỳ sang trạng thái hoàn tất. Đơn vị có thể xem hồ sơ còn thiếu bằng cách lọc theo phòng ban hoặc khối trong tab Mục tiêu.</p>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">Mỗi người cần đủ 100% trọng số trong nhóm tiêu chí chung và nhóm kết quả nhiệm vụ; phần kết quả nhiệm vụ phải có minh chứng. Người có thẩm quyền phải lưu kết luận cho từng người. Hệ thống kiểm tra điều kiện và tỷ lệ xếp loại trước khi đóng kỳ công vụ.</p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2 p-5">
          <h2 className="font-semibold">Điểm tổng hợp có tự động thay đổi tiền lương không?</h2>
          <p className="text-sm leading-6 text-muted-foreground">Không. Kết quả đánh giá là căn cứ quản trị. Việc thưởng, điều chỉnh lương hoặc quyết định nhân sự phải theo quy chế, hồ sơ và phê duyệt riêng của tổ chức. Hệ thống hiện không tự nối kết quả KPI sang P3 hoặc tự phát sinh khoản lương.</p>
        </Card>
        <Card className="space-y-2 p-5">
          <h2 className="font-semibold">Bắt đầu trong hệ thống</h2>
          <p className="text-sm leading-6 text-muted-foreground">Kiểm tra chế độ trong Cấu hình tổ chức → tạo chu kỳ → nhập mục tiêu hoặc tiêu chí và minh chứng → đánh giá → rà soát kết quả → lưu quyết định cần thiết → đóng kỳ theo đúng chế độ.</p>
          <div className="flex flex-wrap gap-2">
            <Link href="/performance?tab=cycles"><Button size="sm"><ClipboardCheck className="h-4 w-4" />Mở chu kỳ KPI</Button></Link>
            <Link href="/admin/org-units"><Button variant="outline" size="sm">Cấu hình tổ chức</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
