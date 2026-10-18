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
      text: 'HR chọn năm, thời gian bắt đầu và kết thúc. Kỳ ghi nhận chế độ doanh nghiệp hoặc khu vực công đang cấu hình để các mục tiêu và phép tính dùng đúng khung đã chọn.',
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
      text: 'Quản lý đối chiếu mục tiêu, kết quả và minh chứng. KPI định lượng tính theo chiều càng cao/càng thấp càng tốt hoặc đạt/không đạt, giới hạn 100 điểm; KPI định tính dùng rubric đã thống nhất. Phải ghi giải trình khi lưu điểm. Điểm kỳ = tổng (điểm KPI × trọng số / 100); tổng trọng số đủ 100%. Đây là quy ước chấm của doanh nghiệp, không phải công thức ISO bắt buộc.',
      href: '/performance?tab=goals', action: 'Rà soát kết quả',
    },
    {
      number: '6', title: 'Rà soát và đóng chu kỳ', owner: 'HR / Người có quyền quản lý chu kỳ', icon: CheckCircle2,
      text: 'HR rà soát từng người: tổng trọng số phải đủ 100%, mỗi KPI có điểm và minh chứng. Hệ thống chặn đóng kỳ nếu còn thiếu một trong các điều kiện này. Kết quả được lưu làm lịch sử; thưởng, tăng lương hoặc quyết định nhân sự cần quy chế và phê duyệt riêng.',
      href: '/performance?tab=cycles', action: 'Kiểm tra chu kỳ',
    },
  ] : [
    {
      number: '1', title: 'Tạo kỳ theo dõi và kỳ tổng hợp năm', owner: 'HR / Quản trị nhân sự', icon: Target,
      text: `Chọn công chức hoặc viên chức trong cấu hình tổ chức. Tạo kỳ tháng hoặc quý để ghi nhận điểm; cuối năm tạo kỳ tổng hợp từ đủ 12 tháng hoặc 4 quý đã khóa. Mỗi kỳ lưu căn cứ áp dụng (${publicRule}).`,
      href: '/performance?tab=cycles', action: 'Xem chu kỳ đánh giá',
    },
    {
      number: '2', title: 'Giao tiêu chí chung và nhiệm vụ', owner: 'Thủ trưởng đơn vị / Quản lý trực tiếp', icon: FileSearch,
      text: 'Mục tiêu có thể giao cho một người hoặc giao theo phòng ban/đơn vị; mục tiêu giao theo đơn vị được đánh giá riêng cho từng nhân viên. Nhóm tiêu chí chung và nhóm nhiệm vụ có trọng số riêng đủ 100%; tỷ trọng hai nhóm mặc định là 30/70. Mỗi nhiệm vụ ghi sản phẩm, chỉ số đo, thời hạn và căn cứ đối chiếu.',
      href: '/performance?tab=goals', action: 'Mở tiêu chí đánh giá',
    },
    {
      number: '3', title: 'Chấm kết quả định kỳ', owner: 'Quản lý trực tiếp / Nhân viên', icon: UserRoundCheck,
      text: `Với từng nhiệm vụ, ghi điểm số lượng, chất lượng và tiến độ. Công chức dùng tỷ trọng đều; với viên chức, nhập tỷ trọng theo quy chế của đơn vị. Ví dụ điểm nhiệm vụ 90, trọng số trong nhóm 25% và nhóm nhiệm vụ chiếm 70% thì mục tiêu đóng góp 90 × 25% × 70% = 15,75 điểm.`,
      href: '/performance?tab=cycles', action: 'Xem trạng thái chu kỳ',
    },
    {
      number: '4', title: 'Tổng hợp năm và chốt xếp loại', owner: 'Cơ quan có thẩm quyền / HR', icon: Scale,
      text: 'Điểm năm là trung bình cộng điểm các kỳ tháng hoặc quý đã khóa. Cấp có thẩm quyền xem điểm, điều kiện xếp loại, nhóm nhiệm vụ tương đồng và căn cứ kết luận. Tỷ lệ xuất sắc cùng ngoại lệ được kiểm tra trong phạm vi khu vực công; kết quả không tự nâng xếp loại vượt ngưỡng điểm.',
      href: '/performance?tab=calibration', action: 'Mở tổng hợp công vụ',
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
        className="border-b-0"
      />

      <Card className="border-primary/25 bg-primary/5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold"><Scale className="h-5 w-5 text-primary" />Khung áp dụng cho tổ chức này</h2>
        {isEnterprise ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><p className="font-medium">Kết quả KPI</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Đo tiến độ, chất lượng, sản lượng, mức phục vụ hoặc độ chính xác theo vị trí. Chỉ tiêu phải nằm trong phạm vi người được đánh giá có thể tác động và có nguồn dữ liệu để đối chiếu.</p></div>
            <div><p className="font-medium">Phạm vi giao</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Có KPI giao riêng cho cá nhân và KPI giao theo phòng ban/khối/đơn vị. Mục tiêu giao theo đơn vị được chấm riêng cho từng nhân viên nhận mục tiêu.</p></div>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><p className="font-medium">Khung điểm</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Một kỳ tối đa 100 điểm, gồm nhóm tiêu chí chung và nhóm kết quả nhiệm vụ. Tỷ trọng mặc định là 30% và 70%; trọng số đang dùng được lưu trong từng kỳ.</p></div>
            <div><p className="font-medium">Hiệu chuẩn thuộc khu vực công</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Hệ thống ghi kết luận cuối, nhóm nhiệm vụ, căn cứ và kiểm tra tỷ lệ xuất sắc trong phạm vi khu vực công. Không áp dụng tỷ lệ này cho doanh nghiệp; mẫu pháp quy và ký duyệt chính thức vẫn cần tích hợp, xác nhận theo từng cơ quan.</p></div>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">{isEnterprise ? 'Cách tính điểm KPI trong một kỳ' : 'Cách tính điểm đánh giá công vụ'}</h2>
        {isEnterprise ? <>
          <p className="text-sm leading-6 text-muted-foreground">Quản lý chấm từng KPI từ 0 đến 100 sau khi đối chiếu kết quả thực tế và minh chứng. Hệ thống tính riêng điểm cho từng nhân viên, kể cả với mục tiêu được giao theo phòng ban.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border p-4"><h3 className="font-medium">KPI cá nhân</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Giao đích danh cho một nhân viên; điểm và trọng số thuộc kỳ đánh giá của người đó.</p></div>
            <div className="rounded-lg border border-border p-4"><h3 className="font-medium">KPI phòng ban/đơn vị</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Hệ thống tạo một bản mục tiêu cho mỗi nhân viên đủ điều kiện trong đơn vị. Mỗi người có kết quả và minh chứng riêng; hiện chưa có điểm tổng hợp riêng cho phòng ban.</p></div>
          </div>
          <div className="rounded-lg bg-background p-4 text-sm leading-6">
            <p><b>Điểm đóng góp của một KPI</b> = điểm KPI × trọng số KPI / 100.</p>
            <p><b>Điểm chu kỳ của nhân viên</b> = tổng điểm đóng góp của các KPI.</p>
            <p className="text-muted-foreground">Tổng trọng số các KPI cá nhân và KPI được giao theo đơn vị của một nhân viên phải bằng 100%.</p>
            <p className="mt-2"><b>Ví dụ:</b> KPI cá nhân đạt 90 điểm, trọng số 40%; hai KPI phòng ban lần lượt đạt 80 điểm với trọng số 35% và 100 điểm với trọng số 25%.</p>
            <p>Điểm chu kỳ = 90 × 40 / 100 + 80 × 35 / 100 + 100 × 25 / 100 = 36 + 28 + 25 = <b>89/100 điểm</b>.</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">Đầu kỳ, quản lý và nhân viên thống nhất mục tiêu, đơn vị đo, nguồn kiểm chứng và thời hạn. Trong kỳ, nhân viên cập nhật kết quả cùng minh chứng; cuối kỳ, quản lý dùng các căn cứ đó để chấm. Kết quả KPI không tự thay đổi lương hoặc thưởng; quyết định đãi ngộ cần quy chế và phê duyệt riêng.</p>
        </> : <>
          <p className="text-sm leading-6 text-muted-foreground">Mỗi tiêu chí hoặc nhiệm vụ được chấm trên thang 0–100. Trọng số các tiêu chí phải đủ 100% trong từng nhóm. Tỷ trọng hai nhóm lấy theo cấu hình của kỳ, mặc định là 30% tiêu chí chung và 70% kết quả nhiệm vụ.</p>
          <div className="rounded-lg bg-background p-4 text-sm leading-6">
            <p><b>Điểm một nhiệm vụ</b> = điểm số lượng × tỷ trọng số lượng + điểm chất lượng × tỷ trọng chất lượng + điểm tiến độ × tỷ trọng tiến độ.</p>
            <p><b>Điểm nhóm</b> = tổng (điểm tiêu chí × trọng số tiêu chí trong nhóm / 100).</p>
            <p><b>Điểm kỳ</b> = điểm nhóm tiêu chí chung × tỷ trọng nhóm chung + điểm nhóm nhiệm vụ × tỷ trọng nhóm nhiệm vụ.</p>
            <p className="mt-2"><b>Ví dụ:</b> nhiệm vụ có điểm số lượng 90, chất lượng 80, tiến độ 100; tỷ trọng lần lượt 40%, 35%, 25%.</p>
            <p>Điểm nhiệm vụ = 90 × 40% + 80 × 35% + 100 × 25% = <b>89/100</b>.</p>
            <p>Nếu điểm nhóm chung là 85 và điểm nhóm nhiệm vụ là 89, điểm kỳ = 85 × 30% + 89 × 70% = <b>87,8/100 điểm</b>.</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">Với công chức, tỷ trọng số lượng, chất lượng và tiến độ được chia đều; với viên chức, dùng tỷ trọng đã cấu hình theo quy chế của đơn vị. Điểm năm là trung bình cộng điểm các kỳ tháng hoặc quý đã khóa; cấp có thẩm quyền xem điều kiện và hồ sơ trước khi kết luận xếp loại.</p>
        </>}
      </Card>

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
          <p className="text-sm leading-6 text-muted-foreground">Kỳ tháng hoặc quý cần đủ 100% trọng số ở từng nhóm, điểm chấm cho mọi tiêu chí và căn cứ cho mọi nhiệm vụ. Kỳ năm cần đủ 12 kỳ tháng hoặc 4 kỳ quý đã khóa; sau đó người có thẩm quyền lưu kết luận cho từng người. Kiểm tra tỷ lệ xếp loại chỉ diễn ra ở bước tổng hợp năm.</p>
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
