'use client';

import Link from 'next/link';
import {
  ArrowRight, BookOpenCheck, CheckCircle2, ClipboardCheck, FileSearch,
  MessageSquareText, Scale, Target, UserRoundCheck,
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
      number: '1', title: 'Thống nhất mục tiêu công việc', icon: Target,
      text: 'Đầu kỳ, quản lý và nhân viên thống nhất kết quả cần đạt theo vị trí. Mỗi mục tiêu nêu rõ cách đo, hạn hoàn thành, nguồn dữ liệu và tỷ trọng; tổng tỷ trọng mục tiêu của một người bằng 100%.',
      href: '/performance-360?tab=goals', action: 'Mở mục tiêu KPI',
    },
    {
      number: '2', title: 'Cập nhật kết quả và minh chứng', icon: FileSearch,
      text: 'Trong kỳ, ghi kết quả đo được và căn cứ như sản phẩm bàn giao, số liệu vận hành, phản hồi khách hàng hoặc biên bản nghiệm thu. Quản lý xem xét yếu tố ngoài khả năng kiểm soát của người được đánh giá.',
      href: '/performance-360?tab=goals', action: 'Cập nhật kết quả',
    },
    {
      number: '3', title: 'Đánh giá theo vai trò', icon: UserRoundCheck,
      text: 'Nhân viên tự đánh giá, quản lý trực tiếp và đồng nghiệp đánh giá theo quy chế doanh nghiệp. Mô hình mặc định hiện tại là 20% tự đánh giá, 30% đồng nghiệp, 50% quản lý; với quản lý có cấp dưới là 20% tự đánh giá, 20% đồng nghiệp, 50% cấp trên, 10% cấp dưới.',
      href: '/performance-360?tab=reviews', action: 'Mở phản hồi nhiều nguồn',
    },
    {
      number: '4', title: 'Trao đổi và chốt kết quả', icon: MessageSquareText,
      text: 'Quản lý trao đổi về mục tiêu, điểm số và minh chứng; ghi nhận ý kiến khác biệt và lý do điều chỉnh trước khi chốt. Doanh nghiệp tự ban hành quy chế xếp loại và thưởng; không dùng hạn ngạch công vụ.',
      href: '/performance-360?tab=cycles', action: 'Xem chu kỳ đánh giá',
    },
  ] : [
    {
      number: '1', title: 'Tạo kỳ theo đúng loại đơn vị', icon: Target,
      text: `Chọn loại nhân sự công chức hoặc viên chức trong cấu hình tổ chức trước khi tạo kỳ. Kỳ đánh giá lưu ảnh chụp chế độ và căn cứ áp dụng (${publicRule}); thay đổi cấu hình chỉ ảnh hưởng các kỳ mới.`,
      href: '/performance-360?tab=cycles', action: 'Xem chu kỳ đánh giá',
    },
    {
      number: '2', title: 'Đánh giá tiêu chí chung và nhiệm vụ', icon: FileSearch,
      text: 'Khung hiện tại chia 30 điểm cho tiêu chí chung và 70 điểm cho kết quả thực hiện nhiệm vụ; từng nhóm có tổng trọng số riêng bằng 100%. Nhập kết quả, căn cứ và nhận xét theo nhiệm vụ được giao.',
      href: '/performance-360?tab=goals', action: 'Mở tiêu chí đánh giá',
    },
    {
      number: '3', title: 'Rà soát và kết luận đúng thẩm quyền', icon: UserRoundCheck,
      text: 'Người có thẩm quyền xem điểm, điều kiện xếp loại, nhóm nhiệm vụ tương đồng và căn cứ kết luận. Hệ thống lưu quyết định, lý do và bước hiệu chuẩn; không tự nâng mức xếp loại vượt ngưỡng điểm.',
      href: '/performance-360?tab=cycles', action: 'Xem trạng thái chu kỳ',
    },
    {
      number: '4', title: 'Kiểm tra tỷ lệ trước khi đóng kỳ', icon: Scale,
      text: 'Tỷ lệ xếp loại xuất sắc và ngoại lệ chỉ được kiểm tra trong phạm vi khu vực công theo nhóm đơn vị, nhóm nhiệm vụ và quy định áp dụng. Đây không phải hạn ngạch KPI doanh nghiệp. Biểu mẫu pháp quy, chữ ký số và toàn bộ quy trình phê duyệt cơ quan cần được cấu hình, kiểm chứng riêng.',
      href: '/performance-360?tab=cycles', action: 'Kiểm tra trạng thái kỳ',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Cách đánh giá nhân sự"
        description={isEnterprise
          ? 'Hướng dẫn đánh giá KPI theo chế độ doanh nghiệp tư nhân đã chọn trong cấu hình tổ chức.'
          : `Hướng dẫn đánh giá công chức hoặc viên chức theo chế độ tổ chức đã chọn; căn cứ hiện hành: ${publicRule}.`}
        breadcrumbs={[{ label: 'Phát triển' }, { label: 'Cách đánh giá nhân sự' }]}
        actions={<Link href="/performance-360"><Button><ClipboardCheck className="h-4 w-4" />Đi đến đánh giá KPI</Button></Link>}
      />

      <Card className="border-primary/25 bg-primary/5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold"><Scale className="h-5 w-5 text-primary" />Khung áp dụng cho tổ chức này</h2>
        {isEnterprise ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><p className="font-medium">Kết quả KPI</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Đo tiến độ, chất lượng, sản lượng, mức phục vụ hoặc độ chính xác theo vị trí. Chỉ tiêu phải nằm trong phạm vi người được đánh giá có thể tác động và có nguồn dữ liệu để đối chiếu.</p></div>
            <div><p className="font-medium">Trọng số phản hồi theo vai trò</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Nhân viên: 20% tự đánh giá, 30% đồng nghiệp, 50% quản lý. Quản lý có cấp dưới: 20% tự đánh giá, 20% đồng nghiệp, 50% cấp trên, 10% cấp dưới. Tổng tỷ trọng là 100%; không áp dụng hạn ngạch xếp loại công vụ.</p></div>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div><p className="font-medium">Điểm đánh giá</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Kỳ công vụ hiện dùng 30 điểm tiêu chí chung và 70 điểm kết quả nhiệm vụ. Mức xếp loại phải căn cứ ngưỡng điểm, điều kiện pháp lý, nhận xét và kết luận của cấp có thẩm quyền.</p></div>
            <div><p className="font-medium">Hiệu chuẩn thuộc khu vực công</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Hệ thống ghi kết luận cuối, nhóm nhiệm vụ, căn cứ và kiểm tra tỷ lệ xuất sắc trong phạm vi khu vực công. Không áp dụng tỷ lệ này cho doanh nghiệp; mẫu pháp quy và ký duyệt chính thức vẫn cần tích hợp, xác nhận theo từng cơ quan.</p></div>
          </div>
        )}
      </Card>

      {isEnterprise && <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="font-semibold">Phần mềm đang gọi là KPI có đúng nghĩa KPI không?</h2>
        <p className="text-sm leading-6 text-muted-foreground">Đây là quy trình quản lý hiệu suất có mục tiêu KRA/KPI và phản hồi 360, không phải bộ máy KPI tự động nối với dữ liệu vận hành. Người tạo mục tiêu nhập chỉ tiêu và trọng số; nhân viên tự chấm, quản lý chấm và phản hồi đồng nghiệp/cấp dưới được tổng hợp theo vai trò. Phần mềm hiện lưu mục tiêu, điểm và trọng số; chưa tự lấy doanh số, ticket, SLA hay số liệu từ hệ thống nghiệp vụ để tính tỷ lệ hoàn thành mục tiêu.</p>
        <div className="rounded-lg bg-background p-4 text-sm leading-6">
          <p><b>Điểm mục tiêu</b> = điểm đánh giá thủ công của các nguồn × trọng số nguồn đánh giá.</p>
          <p><b>Điểm chu kỳ</b> = tổng điểm mục tiêu × trọng số mục tiêu; trọng số mục tiêu của nhân viên phải cộng đủ 100%.</p>
          <p className="mt-1 text-muted-foreground">Nhân viên không có cấp dưới: 20% tự đánh giá + 30% đồng nghiệp + 50% quản lý. Quản lý có cấp dưới: 20% tự đánh giá + 20% đồng nghiệp + 50% cấp trên + 10% cấp dưới.</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">Vì vậy, để đánh giá sát thực tế, đầu kỳ hai bên nên thống nhất mức gốc, mục tiêu, đơn vị đo, nguồn kiểm chứng, thời hạn và cách xử lý yếu tố ngoài khả năng kiểm soát. Trong kỳ cập nhật kết quả cùng minh chứng; cuối kỳ dùng chứng cứ đó để chấm. KPI không tự quyết định tăng lương hoặc thưởng; P3 vẫn cần chính sách và quy trình phê duyệt riêng.</p>
      </Card>}

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Các bước đánh giá nhân sự">
        {steps.map(({ number, title, icon: Icon, text, href, action }) => (
          <Card key={number} className="flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{number}</span>
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </div>
            <Link href={href} className="mt-auto inline-flex items-center gap-1 pl-12 text-sm font-medium text-primary hover:underline">{action}<ArrowRight className="h-4 w-4" /></Link>
          </Card>
        ))}
      </section>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" />Phát triển năng lực sau đánh giá</h2>
        <ol className="space-y-3 text-sm leading-6 text-muted-foreground">
          <li><b className="text-foreground">1. Chọn chuẩn theo chức danh.</b> Mô tả năng lực cần có và hành vi quan sát được ở từng mức, không dựa vào thâm niên đơn thuần.</li>
          <li><b className="text-foreground">2. Ghi ví dụ và căn cứ.</b> Nêu tình huống, việc đã làm, kết quả và tài liệu phù hợp để người đánh giá đối chiếu.</li>
          <li><b className="text-foreground">3. Thẩm định và trao đổi.</b> So sánh minh chứng với chuẩn, lưu nhận xét và làm rõ khác biệt giữa các bên.</li>
          <li><b className="text-foreground">4. Lập kế hoạch cải thiện.</b> Chọn khoảng trống cụ thể, hoạt động phát triển, tiêu chí thành công và thời hạn theo dõi.</li>
        </ol>
        <Link href="/competency-development"><Button variant="outline" size="sm"><BookOpenCheck className="h-4 w-4" />Mở năng lực và kế hoạch phát triển</Button></Link>
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
            <Link href="/performance-360?tab=cycles"><Button size="sm"><ClipboardCheck className="h-4 w-4" />Mở chu kỳ đánh giá</Button></Link>
            <Link href="/admin/org-units"><Button variant="outline" size="sm">Cấu hình tổ chức</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
