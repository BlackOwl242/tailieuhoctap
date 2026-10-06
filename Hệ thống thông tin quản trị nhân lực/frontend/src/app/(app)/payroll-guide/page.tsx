'use client';

import Link from 'next/link';
import {
  ArrowRight, BookOpen, Calculator, CheckCircle2, CircleHelp,
  Clock3, FileCheck2, Scale, ShieldCheck, UserRound, Wallet,
} from 'lucide-react';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { Button, Card } from '@/components/ui/primitives';
import { isEnterpriseSector, useOrgConfig } from '@/lib/org-config';

const enterpriseSteps = [
  {
    number: '1',
    title: 'Xác định mức trả cho công việc',
    text: 'Doanh nghiệp xem trách nhiệm của vị trí, yêu cầu kinh nghiệm và năng lực, mức trả trên thị trường, khả năng chi trả và sự công bằng giữa các vị trí. Từ đó HR đề xuất một khoảng lương thấp–tham chiếu–cao cho từng nhóm công việc; Ban Giám đốc duyệt khoảng này.',
    link: '/salary-bands',
    linkText: 'Mở khung lương theo vị trí',
    icon: Scale,
  },
  {
    number: '2',
    title: 'Thỏa thuận lương của từng người',
    text: 'Mức cụ thể của một nhân viên được ghi trong hợp đồng hoặc phụ lục đã duyệt. Khung lương giúp kiểm tra mức thỏa thuận có nằm trong khoảng của vị trí hay không; phần mềm không tự chọn mức giữa khung thay doanh nghiệp.',
    link: '/personnel',
    linkText: 'Xem biến động nhân sự và lương',
    icon: FileCheck2,
  },
  {
    number: '3',
    title: 'Chốt dữ liệu làm căn cứ tính kỳ lương',
    text: 'Nhân viên và quản lý kiểm tra ngày công, ca làm, nghỉ có lương hoặc không lương. Giờ làm thêm chỉ được đưa vào khi đơn đã được duyệt. HR xử lý sai lệch trước khi tạo bảng lương.',
    links: [
      { href: '/attendance', label: 'Bảng chấm công' },
      { href: '/leave', label: 'Nghỉ phép' },
      { href: '/overtime', label: 'Làm thêm giờ' },
    ],
    icon: Clock3,
  },
  {
    number: '4',
    title: 'Tính lương, kiểm tra và phê duyệt',
    text: 'HR chốt công tháng rồi mới tạo kỳ lương và kiểm tra từng phiếu, các khoản phát sinh. Người khác đối soát; Ban Giám đốc phê duyệt rồi khóa kỳ. Kế toán ghi nhận đã trả khi có hình thức thanh toán và mã giao dịch hoặc chứng từ chi.',
    link: '/payroll-engine',
    linkText: 'Mở bảng tính lương',
    icon: Calculator,
  },
];

const publicSteps = [
  {
    number: '1', title: 'Xác định chế độ và căn cứ trả lương',
    text: 'Cơ quan xác định người thuộc chế độ công chức hay viên chức, căn cứ ngạch/bậc hoặc chế độ trả lương áp dụng, phụ cấp và quyết định lương có hiệu lực. Chỉ dùng hệ số, mức lương cơ sở và phụ cấp sau khi được cơ quan có thẩm quyền xác nhận.',
    link: '/salary-ranks', linkText: 'Mở ngạch, bậc và hệ số', icon: Scale,
  },
  {
    number: '2', title: 'Ghi nhận quyết định lương có hiệu lực',
    text: 'Lưu ngạch/bậc, hệ số hoặc căn cứ tiền lương, phụ cấp, ngày hiệu lực và quyết định đi kèm trong hồ sơ nhân sự. Chức năng ngạch bậc hỗ trợ quản lý hồ sơ/xét nâng bậc; cần kiểm tra phiếu lương sau khi thay đổi.',
    link: '/employees', linkText: 'Mở hồ sơ nhân sự', icon: FileCheck2,
  },
  {
    number: '3', title: 'Đối soát công và khoản được hưởng',
    text: 'Kiểm tra ngày công, thời gian nghỉ, làm thêm và các khoản phụ cấp theo chế độ của cơ quan. Chốt sai lệch trước khi lập bảng lương.',
    links: [{ href: '/attendance', label: 'Bảng chấm công' }, { href: '/leave', label: 'Nghỉ phép' }, { href: '/overtime', label: 'Làm thêm giờ' }], icon: Clock3,
  },
  {
    number: '4', title: 'Tính, kiểm tra và phê duyệt',
    text: 'Lập kỳ lương từ căn cứ đã có hiệu lực, rà soát thu nhập, khoản trừ, thuế và bảo hiểm theo chính sách được duyệt. Đối chiếu kết quả với bảng tính/ quyết định của cơ quan trước khi khóa và ghi nhận thanh toán.',
    link: '/payroll-engine', linkText: 'Mở bảng tính lương', icon: Calculator,
  },
];

export default function PayrollGuidePage() {
  const [orgConfig] = useOrgConfig();
  const isEnterprise = isEnterpriseSector(orgConfig);
  const steps = isEnterprise ? enterpriseSteps : publicSteps;
  return (
    <div className="space-y-6 pb-12">
      <WorkspaceHeader
        title="Cách tính lương"
        description={isEnterprise
          ? 'Doanh nghiệp dùng khung lương theo vị trí, mức đã thỏa thuận và các thành phần lương; tiền thực nhận còn phụ thuộc ngày công và khoản cộng/trừ có căn cứ.'
          : `Hướng dẫn theo chế độ ${orgConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'viên chức' : 'công chức'} đã chọn. Đối chiếu ngạch/bậc, quyết định lương, phụ cấp và dữ liệu công trước khi tính.`}
        breadcrumbs={[{ label: 'Tiền lương' }, { label: 'Cách tính lương' }]}
        actions={<Link href="/payroll-engine"><Button><Calculator className="h-4 w-4" />Đi đến bảng tính lương</Button></Link>}
      />

      <Card className="border-primary/25 bg-primary/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-2">
            <h2 className="font-semibold">{isEnterprise ? 'Lương vị trí được xác định thế nào?' : 'Căn cứ nào quyết định lương khu vực công?'}</h2>
            {isEnterprise ? <>
              <p className="text-sm leading-6 text-muted-foreground">Doanh nghiệp xây khoảng lương từ trách nhiệm, độ khó, năng lực, kinh nghiệm, tham khảo thị trường, ngân sách và công bằng nội bộ. HR đề xuất khung theo vị trí; cấp có thẩm quyền duyệt. Mức từng người theo hợp đồng/quyết định có hiệu lực; phần mềm không tự khảo sát thị trường hay tự tăng lương theo điểm đánh giá.</p>
              <p className="text-sm leading-6 text-muted-foreground">Ngạch/bậc công vụ không áp dụng cho doanh nghiệp. Dùng khung lương và cấu trúc lương để quản lý dải trả, mức căn cứ và phụ cấp theo chính sách công ty.</p>
            </> : <>
              <p className="text-sm leading-6 text-muted-foreground">Cơ quan căn cứ loại nhân sự, ngạch/bậc hoặc chế độ tiền lương áp dụng, hệ số, phụ cấp và quyết định còn hiệu lực. Hồ sơ ngạch/bậc giúp theo dõi thông tin và quy trình nhân sự.</p>
              <p className="text-sm leading-6 text-muted-foreground">Lưu ý: bảng lương hiện tại chưa tự lấy hệ số ngạch/bậc nhân mức lương cơ sở. Cần nhập/đối chiếu căn cứ lương được duyệt và kiểm tra kết quả; không xem việc chọn chế độ khu vực công là bằng chứng bộ máy tính lương công vụ đã hoàn chỉnh.</p>
            </>}
          </div>
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Các bước tính lương">
        {steps.map(({ number, title, text, link, linkText, links, icon: Icon }) => (
          <Card key={number} className="flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{number}</span>
              <div className="space-y-2">
                <h2 className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary" />{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            </div>
            {link && <Link href={link} className="mt-auto inline-flex items-center gap-1 pl-12 text-sm font-medium text-primary hover:underline">{linkText}<ArrowRight className="h-4 w-4" /></Link>}
            {links && <div className="mt-auto flex flex-wrap gap-2 pl-12">{links.map(item => <Link key={item.href} href={item.href} className="rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">{item.label}</Link>)}</div>}
          </Card>
        ))}
      </section>

      <Card className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><BookOpen className="h-5 w-5 text-primary" />Hướng dẫn thao tác lương trong hệ thống</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Làm theo thứ tự dưới đây. Thiết lập chính sách, thành phần và cấu trúc ở trang Tiền lương; chỉ tạo kỳ sau khi dữ liệu công, nghỉ và làm thêm đã được đối soát.</p>
        </div>
        {isEnterprise ? <>
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">1. Cấu hình chính sách theo thời gian</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Mở <b>Tiền lương → Chính sách & quy tắc</b>. Chọn đúng phiên bản và khoảng ngày hiệu lực; kiểm tra căn cứ, tỷ lệ bảo hiểm, giảm trừ/biểu thuế, mức tối thiểu vùng và hệ số OT. Khi quy định hoặc chính sách công ty đổi, tạo phiên bản mới, ghi căn cứ và ngày áp dụng. Kỳ đã tính vẫn giữ bản chụp cũ. Chỉ Quản trị viên lưu được phần này.</p>
              <Link href="/payroll-engine?tab=policy" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Mở chính sách lương <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">2. Khai báo từng thành phần thu nhập/khấu trừ</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Trong tab <b>Thành phần lương</b>, tạo khoản như phụ cấp trách nhiệm, ăn trưa, thưởng hoặc khấu trừ. Mỗi khoản cần mã, tên, loại, nguồn căn cứ và số văn bản/quy chế. Chọn rõ chịu thuế, tính căn cứ bảo hiểm hay tính căn cứ OT. Nếu chưa có mức được duyệt, không tự đặt số; mức mặc định 0 không tự phát sinh thu nhập.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Mức mặc định là giá trị để đưa vào cấu trúc, không phải bằng chứng mọi nhân viên được hưởng. Khoản phụ thuộc ngày công/điều kiện cần mô tả điều kiện và kiểm tra kết quả từng phiếu.</p>
              <Link href="/payroll-engine?tab=components" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Mở thành phần lương <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">3. Tạo cấu trúc và gán đúng phạm vi</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
                <li>Trong tab <b>Cấu trúc lương</b>, chọn <b>Tạo cấu trúc thu nhập</b>, đặt tên và mô tả dễ nhận biết.</li>
                <li>Chọn chức danh để áp dụng cho người có chức danh đó; chọn thêm đơn vị nếu chỉ áp dụng trong một phòng ban.</li>
                <li>Để trống chức danh và chọn đơn vị để áp dụng chung cho đơn vị. Để trống cả hai thì chỉ dùng khi gán thủ công.</li>
                <li>Chọn thành phần và nhập mức theo chính sách đã duyệt, rồi tạo cấu trúc.</li>
                <li>Xem danh sách nhân sự trong phạm vi. Dùng <b>Gán riêng cho nhân viên</b> nếu một người có thỏa thuận khác; cấu trúc gán riêng được ưu tiên hơn quy tắc tự áp dụng.</li>
              </ol>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Lương cơ bản vẫn lấy từ hợp đồng/quyết định của từng người. Cấu trúc chủ yếu cộng các thành phần đã chọn; khung lương vị trí là khoảng kiểm tra, không tự thay mức hợp đồng.</p>
              <Link href="/payroll-engine?tab=structures" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Mở cấu trúc lương <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="font-semibold">4. Quản lý khung lương vị trí</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Từ cuối tab Cấu trúc lương, mở <b>Quản lý khung lương</b>. Khai báo khoảng thấp–tham chiếu–cao theo chức danh, ngày hiệu lực và trạng thái duyệt. Hệ thống dùng khung để đối chiếu và cảnh báo người dưới sàn/trên trần; không tự đổi lương hợp đồng hay tạo phụ cấp.</p>
              <Link href="/salary-bands" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Mở khung lương vị trí <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <h3 className="font-semibold">5. Tính và duyệt kỳ lương</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Đối soát chấm công, ca, nghỉ đã duyệt và đơn OT; sửa thiếu dữ liệu trước khi chốt công.</li>
              <li>Mở <b>Kỳ bảng lương</b> → <b>Tính bảng lương</b>, nhập tên kỳ và khoảng ngày rồi tạo kỳ.</li>
              <li>Mở từng phiếu, soát mức hợp đồng, ngày/giờ được trả, cấu trúc đang áp dụng, phụ cấp, OT, thuế, bảo hiểm và cảnh báo.</li>
              <li>Chuyển qua bước phê duyệt/khóa theo quyền của tài khoản; sau thanh toán ghi phương thức và mã tham chiếu/chứng từ.</li>
            </ol>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Nhân viên đăng nhập tài khoản cá nhân và mở <b>Phiếu lương của tôi</b> để xem các kỳ đã được công bố, khoản thu nhập/khấu trừ và bản in của mình.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/attendance" className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Chấm công</Link>
              <Link href="/leave" className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Nghỉ phép</Link>
              <Link href="/overtime" className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Làm thêm giờ</Link>
              <Link href="/payroll-engine?tab=runs" className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Kỳ bảng lương</Link>
              <Link href="/my-payslips" className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">Phiếu lương của tôi</Link>
            </div>
          </div>
        </> : <div className="rounded-lg border p-4 text-sm leading-6 text-muted-foreground">
          <p>Với chế độ khu vực công, bắt đầu bằng việc xác nhận loại nhân sự, ngạch/bậc hoặc chế độ trả lương và quyết định đang có hiệu lực trong hồ sơ. Chính sách lương và khoản phụ cấp phải do cơ quan có thẩm quyền xác nhận. Hiện hệ thống hỗ trợ lưu/đối chiếu dữ liệu nhưng chưa tự quy đổi đầy đủ hệ số công vụ thành lương; phải kiểm tra bảng tính bên ngoài trước khi chi trả.</p>
          <p className="mt-2">Sau đó đối soát công, phép và làm thêm; lập kỳ; rà soát từng phiếu và so với quyết định/bảng tính của cơ quan trước khi duyệt. Không dùng cấu trúc/phụ cấp doanh nghiệp để thay chế độ ngạch bậc.</p>
          <Link href="/salary-ranks" className="mt-3 inline-flex items-center gap-1 font-medium text-primary hover:underline">Mở hồ sơ ngạch bậc <ArrowRight className="h-4 w-4" /></Link>
        </div>}
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Tra nhanh: từng trường hợp ảnh hưởng lương ra sao?</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-muted/60"><tr><th className="px-4 py-3 font-semibold">Tình huống</th><th className="px-4 py-3 font-semibold">Hệ thống xử lý</th><th className="px-4 py-3 font-semibold">Cần kiểm tra ở đâu</th></tr></thead>
            <tbody className="divide-y text-muted-foreground">
              <tr><td className="px-4 py-3 font-medium text-foreground">Thiếu chấm công / thiếu cặp vào-ra</td><td className="px-4 py-3">Thời gian chưa được ghi nhận có thể làm giảm phần lương theo thời gian; không phải khoản trừ cố định giống nhau cho mọi người.</td><td className="px-4 py-3">Bảng chấm công, ca được xếp, giải trình và phiếu lương.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-foreground">Đi muộn, về sớm, thiếu giờ</td><td className="px-4 py-3">Dựa vào thời lượng công được ghi nhận so với lịch/ca; mức giảm phụ thuộc thời gian thiếu và căn cứ lương của cá nhân.</td><td className="px-4 py-3">Dữ liệu ngày công/giờ công và chi tiết tính trong phiếu.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-foreground">Phép năm có lương đã duyệt</td><td className="px-4 py-3">Được ghi nhận là thời gian hưởng lương khi trạng thái nghỉ được cập nhật đúng trên công.</td><td className="px-4 py-3">Đơn nghỉ, số dư phép và bảng công.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-foreground">Nghỉ không lương</td><td className="px-4 py-3">Không tính như ngày làm hưởng lương; ảnh hưởng phụ thuộc số ngày/giờ không hưởng và loại căn cứ trả.</td><td className="px-4 py-3">Đơn nghỉ và bảng công trước khi tạo kỳ.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-foreground">OT</td><td className="px-4 py-3">Chỉ đơn được duyệt mới vào lương; tiền dựa trên giờ, loại ngày, căn cứ lương giờ và chính sách OT hiệu lực.</td><td className="px-4 py-3">Đơn OT, giờ được duyệt, hệ số trong Chính sách & quy tắc, chi tiết phiếu.</td></tr>
              <tr><td className="px-4 py-3 font-medium text-foreground">Khác nhau giữa các vị trí/người</td><td className="px-4 py-3">Khác nhau do hợp đồng, mức lương căn cứ, cấu trúc được gán, ngày công, điều kiện hưởng và dữ liệu thuế/bảo hiểm; không có một mức trừ thiếu công dùng chung cho tất cả.</td><td className="px-4 py-3">Hồ sơ/hợp đồng, cấu trúc áp dụng và từng phiếu lương.</td></tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold"><Wallet className="h-4 w-4 text-primary" />Tính theo tháng, ngày công hay giờ?</h2>
        <p className="text-sm leading-6 text-muted-foreground">Cách trả phải khớp với hợp đồng. Với lương tháng, kỳ lương tính phần được hưởng theo số ngày làm việc theo lịch của người đó trong kỳ và số ngày được trả. Với lương ngày, lấy đơn giá ngày nhân số ngày được trả. Với lương giờ, lấy đơn giá giờ nhân số giờ được trả. Ngày nghỉ có lương được xử lý theo dữ liệu nghỉ đã duyệt; ngày nghỉ không lương không được tính như ngày làm hưởng lương.</p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4"><p className="text-sm font-semibold">Lương tháng</p><p className="mt-1 text-sm text-muted-foreground">Lương thỏa thuận ÷ ngày làm theo lịch trong kỳ × ngày được trả</p></div>
          <div className="rounded-lg border p-4"><p className="text-sm font-semibold">Lương ngày</p><p className="mt-1 text-sm text-muted-foreground">Đơn giá ngày × số ngày được trả</p></div>
          <div className="rounded-lg border p-4"><p className="text-sm font-semibold">Lương giờ</p><p className="mt-1 text-sm text-muted-foreground">Đơn giá giờ × số giờ được trả</p></div>
        </div>
        <div className="rounded-lg bg-muted p-4 text-sm leading-6">
          <p><b>Tiền trước khấu trừ</b> = lương theo hợp đồng và ngày/giờ được trả + phụ cấp, thưởng đủ điều kiện + tiền làm thêm đã duyệt.</p>
          <p className="mt-1"><b>Tiền thực nhận</b> = tiền trước khấu trừ − thuế và bảo hiểm áp dụng − khoản khấu trừ có căn cứ, chẳng hạn khoản vay được nhân viên ủy quyền khấu trừ.</p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-2 p-5">
          <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />{isEnterprise ? 'Điều chỉnh lương doanh nghiệp' : 'Nâng bậc và điều chỉnh lương công vụ'}</h2>
          <p className="text-sm leading-6 text-muted-foreground">{isEnterprise ? 'Kỳ đánh giá là một căn cứ xem xét, không tự tăng lương. Quản lý/HR cân nhắc trách nhiệm, năng lực, vị trí trong khung, ngân sách và công bằng nội bộ; đề xuất cần lý do, mức và ngày hiệu lực, được duyệt trước khi cập nhật hợp đồng và bảng lương.' : 'Việc nâng bậc/ngạch hoặc thay đổi chế độ phải đúng điều kiện, hồ sơ, thời hạn và quyết định của cấp có thẩm quyền. Kết quả đánh giá không tự thay đổi hệ số hoặc phiếu lương.'}</p>
          <Link href={isEnterprise ? '/personnel' : '/salary-ranks'} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">{isEnterprise ? 'Mở biến động lương' : 'Mở ngạch bậc khu vực công'} <ArrowRight className="h-4 w-4" /></Link>
        </Card>
        <Card className="space-y-2 p-5">
          <h2 className="flex items-center gap-2 font-semibold"><UserRound className="h-4 w-4 text-primary" />Các khoản trừ có giống nhau với mọi người không?</h2>
          <p className="text-sm leading-6 text-muted-foreground">Không. Thuế, bảo hiểm và các khoản khác phụ thuộc loại hợp đồng, dữ liệu cá nhân, thành phần thu nhập, điều kiện tham gia và chính sách đang áp dụng. Kế toán/HR cần duy trì cấu hình đúng kỳ hiệu lực và kiểm tra phiếu lương trước khi trả. Chỉ khấu trừ khoản vay khi có ủy quyền phù hợp.</p>
          <Link href="/payroll-engine?tab=policy" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Mở chính sách lương đang áp dụng <ArrowRight className="h-4 w-4" /></Link>
        </Card>
      </div>

      <Card className="border-dashed p-5">
        <h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" />Trong hệ thống, số liệu lấy từ đâu?</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{isEnterprise ? 'Mức căn cứ lấy từ hợp đồng/biến động đã duyệt; công và nghỉ đã duyệt xác định thời gian được trả; làm thêm lấy từ đơn đã duyệt; thành phần cộng/trừ lấy từ cấu trúc lương và các khoản có căn cứ. Khung lương theo vị trí là công cụ kiểm soát khoảng trả, không tự tạo mức lương.' : 'Hồ sơ ngạch/bậc, hệ số và quyết định lưu thông tin nhân sự; bảng công, ngày nghỉ và làm thêm là căn cứ thời gian. Vì bộ máy tính lương chưa tự quy đổi hệ số công vụ, cần đối chiếu bảng tính với quyết định và chính sách của cơ quan trước khi trả.'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={isEnterprise ? '/salary-bands' : '/salary-ranks'}><Button variant="outline" size="sm"><Scale className="h-4 w-4" />{isEnterprise ? 'Thiết lập khung lương' : 'Quản lý ngạch, bậc'}</Button></Link>
          <Link href="/payroll-engine"><Button size="sm"><Calculator className="h-4 w-4" />Tạo và xử lý kỳ lương</Button></Link>
        </div>
      </Card>

      <Card className="space-y-3 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold"><Calculator className="h-4 w-4 text-primary" />Công thức mà bảng lương hiện tại thực sự dùng</h2>
        <p className="text-sm leading-6 text-muted-foreground">Kỳ lương lấy mức lương từ hợp đồng/quyết định có hiệu lực. Nhân sự được nối với khung lương đã duyệt; cấu trúc thu nhập gắn với khung đó tự áp dụng theo chức danh/khung của người lao động. Cấu trúc gán riêng cho cá nhân được ưu tiên cho các khoản thu nhập bổ sung. Khung chỉ là khoảng tham chiếu, không thay lương cơ bản; phụ cấp/thưởng chỉ phát sinh khi có mức và căn cứ chính sách được cấu hình. Nếu chưa có khung phù hợp, phiếu ghi rõ chỉ dùng lương hợp đồng, không tự lấy phụ cấp ở khung khác. Hợp đồng theo ngày/giờ/tháng là căn cứ tính; kỳ trả hiện tại vẫn chốt theo tháng.</p>
        <div className="rounded-lg bg-muted p-4 text-sm leading-6">
          <p><b>Tổng thu nhập</b> = lương theo thời gian được trả + thành phần thu nhập theo cấu trúc + làm thêm đã duyệt + thưởng có hiệu lực.</p>
          <p className="mt-1"><b>Thực lĩnh</b> = tổng thu nhập − bảo hiểm người lao động − thuế TNCN theo chính sách kỳ lương − khoản khấu trừ được phép.</p>
          <p className="mt-1">Phụ cấp có thể tính theo công thức và tỷ lệ ngày được trả; khoản ăn trưa gắn với ngày có chấm công. Thành phần thu nhập có cờ chịu thuế/bảo hiểm riêng. Đi muộn, về sớm và thiếu giờ được đối chiếu với ca cá nhân, thể hiện riêng trên phiếu. Phép năm đã duyệt được tính hưởng lương; nghỉ không lương không cộng ngày công. Nghỉ ốm/thai sản được ghi nhận riêng để đối soát chế độ BHXH, không tự cộng thành lương do doanh nghiệp trả. OT đang chờ duyệt không được tính.</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">Luồng sử dụng: chốt công → tạo kỳ lương → kiểm tra từng phiếu và các cảnh báo → người có thẩm quyền duyệt/khóa kỳ → ghi nhận thanh toán bằng phương thức và mã tham chiếu. Kỳ lương hiện là bản nháp cho đến khi qua các bước duyệt.</p>
        <p className="text-xs leading-5 text-muted-foreground">
          {isEnterprise ? <>
            Mức tiền và tỷ lệ thực tế lấy từ phiên bản chính sách đang có hiệu lực trong kỳ ở tab Chính sách & quy tắc; nội dung hướng dẫn không phải nguồn cấu hình. Quản trị viên cần đối chiếu căn cứ trước khi lưu. Tham khảo <a className="underline" href="https://vanban.chinhphu.vn/?docid=215832&pageid=27160" target="_blank" rel="noreferrer">Nghị định 293/2025/NĐ-CP về lương tối thiểu</a>, <a className="underline" href="https://vanban.chinhphu.vn/?classid=1&docid=198540&pageid=27160&typegroupid=3" target="_blank" rel="noreferrer">Bộ luật Lao động 45/2019/QH14 về làm thêm giờ</a> và các văn bản thuế có hiệu lực trong kỳ (
            <a className="underline" href="https://vanban.chinhphu.vn/?docid=216495&pageid=27160" target="_blank" rel="noreferrer">Luật số 109/2025/QH15</a>,{' '}
            <a className="underline" href="https://vanban.chinhphu.vn/?docid=215927&pageid=27160" target="_blank" rel="noreferrer">Nghị quyết 110/2025/UBTVQH15</a>). Hãy xác minh cấu hình kỳ lương với kế toán/đơn vị tư vấn trước khi trả.
          </> : <>
            Chế độ hiện chọn: {orgConfig.publicPersonnelType === 'PUBLIC_EMPLOYEE' ? 'viên chức' : 'công chức'}. Ngạch/bậc hỗ trợ lưu hệ số và quy trình nâng bậc theo hồ sơ; bảng lương chưa tự động tính lương công vụ theo hệ số và mức lương cơ sở. Cần đối chiếu quy định áp dụng và bảng tính được duyệt của cơ quan.
          </>}
        </p>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4 text-primary" />Thiếu công, nghỉ phép và làm thêm được xử lý thế nào?</h2>
        <div className="space-y-3 text-sm leading-6 text-muted-foreground">
          <p><b className="text-foreground">Thiếu dữ liệu hoặc vắng không hưởng lương:</b> ngày làm theo lịch nhưng chưa có bản ghi chấm công, ngày vắng hoặc ngày thiếu cặp vào/ra chưa được HR giải trình sẽ có phần thời gian được trả bằng 0 trong phép tính hiện tại. Vì vậy, cần kiểm tra và sửa công trước khi chốt kỳ. Nếu đã chốt mà phát hiện sai, HR có thể mở lại kỳ công để điều chỉnh; bảng lương đã tạo cần được đối soát lại theo trạng thái phê duyệt.</p>
          <p><b className="text-foreground">Đi muộn/về sớm hoặc làm chưa đủ ca:</b> hệ thống dùng phút làm thực tế chia cho phút ca đã xếp, tối đa một ngày công. Ví dụ, ca 8 giờ nhưng ghi nhận 6 giờ thì phần lương theo thời gian của ngày đó là 6/8. Đây là tỷ lệ theo dữ liệu công; cần xác nhận quy chế nội bộ trước khi áp dụng cho trường hợp được miễn/điều chỉnh giờ.</p>
          <p><b className="text-foreground">Phép năm và nghỉ theo chế độ:</b> phép năm đã duyệt được tính là ngày hưởng lương khi bảng công cập nhật trạng thái. Nghỉ ốm và thai sản được tách khỏi phép năm để đối soát hồ sơ hưởng chế độ BHXH; không tự tính thành tiền lương doanh nghiệp. Nghỉ không lương không được cộng như ngày làm hưởng lương.</p>
          <p><b className="text-foreground">Làm thêm:</b> chỉ yêu cầu đã duyệt mới được tính. Hệ thống lấy số giờ đã duyệt, loại ngày và chính sách hệ số làm thêm đang cấu hình; đơn chờ duyệt/từ chối không được cộng. Ca đêm có thành phần riêng theo chính sách. Cần đối chiếu giờ, loại ngày và đơn giá trên phiếu trước khi duyệt bảng lương.</p>
          <p><b className="text-foreground">Điều kiện tạo kỳ:</b> bảng lương chỉ được tính sau khi chấm công của đủ tháng đã ở trạng thái đã chốt. Bộ máy kỳ lương hiện nhận kỳ tháng; căn cứ lương theo ngày hoặc giờ là đơn vị trả lương của hợp đồng, không phải kỳ trả hằng ngày/hằng giờ.</p>
        </div>
      </Card>

      <Card className="space-y-4 p-5 sm:p-6">
        <h2 className="font-semibold">Ví dụ mẫu trong hệ thống</h2>
        <p className="text-sm leading-6 text-muted-foreground">Các ví dụ dưới đây chỉ minh họa phần lương theo thời gian, chưa cộng phụ cấp/làm thêm và chưa trừ bảo hiểm, thuế hay khoản khấu trừ. Giả sử lịch cá nhân có 22 ngày làm việc, mỗi ngày 8 giờ trong tháng; số ngày này là giả định để tính ví dụ, không phải mẫu số cố định cho mọi tháng hay mọi nhân viên.</p>
        {isEnterprise ? <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
          <p className="font-semibold">Ví dụ thực tế từ bảng lương đã thanh toán tháng 09/2026</p>
          <p className="mt-1">Một phiếu đủ 22/22 ngày công có lương cơ bản 21.000.000 đ, phụ cấp ăn trưa 35.000 × 22 = 770.000 đ và phụ cấp trách nhiệm/nghiệp vụ 1.500.000 đ. Tổng thu nhập trước khấu trừ là <b>23.270.000 đ</b>.</p>
          <p className="mt-1">Phiếu đã trả ghi bảo hiểm 2.205.000 đ, thuế TNCN 503.250 đ, thực lĩnh <b>20.561.750 đ</b>. Cấu hình hiện hành áp dụng phụ cấp trách nhiệm như khoản lương trả đều nên tính vào căn cứ bảo hiểm và OT; vì vậy kỳ mới có thể khác cách khấu trừ ở phiếu tháng 9. Không tính lại kỳ đã thanh toán.</p>
          <p className="mt-1">Từ 01/07/2026, tiền ăn chi bằng tiền đến 1.200.000 đ/người/tháng không tính vào thu nhập chịu thuế theo Nghị định 253/2026/NĐ-CP; mức 35.000 đ/ngày trong cấu hình này cho tối đa 31 ngày là 1.085.000 đ.</p>
        </div> : null}
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-muted/60"><tr><th className="px-4 py-3 font-semibold">Cách trả / tình huống</th><th className="px-4 py-3 font-semibold">Phép tính minh họa</th><th className="px-4 py-3 font-semibold">Lương thời gian</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-4 py-3">Tháng: 22.000.000 đ; đủ 22 ngày được trả</td><td className="px-4 py-3">22.000.000 × 22 ÷ 22</td><td className="px-4 py-3 font-medium">22.000.000 đ</td></tr>
              <tr><td className="px-4 py-3">Tháng: có 1 ngày nghỉ không lương; 21 ngày được trả</td><td className="px-4 py-3">22.000.000 × 21 ÷ 22</td><td className="px-4 py-3 font-medium">21.000.000 đ</td></tr>
              <tr><td className="px-4 py-3">Tháng: 21 ngày làm đủ ca + 1 ngày nghỉ có lương đã ghi nhận</td><td className="px-4 py-3">22.000.000 × 22 ÷ 22</td><td className="px-4 py-3 font-medium">22.000.000 đ</td></tr>
              <tr><td className="px-4 py-3">Tháng: một ngày làm 6/8 giờ; 21 ngày còn lại đủ ca</td><td className="px-4 py-3">22.000.000 × 21,75 ÷ 22</td><td className="px-4 py-3 font-medium">21.750.000 đ</td></tr>
              <tr><td className="px-4 py-3">Ngày: 1.000.000 đ/ngày; 20 ngày được trả</td><td className="px-4 py-3">1.000.000 × 20</td><td className="px-4 py-3 font-medium">20.000.000 đ</td></tr>
              <tr><td className="px-4 py-3">Giờ: 100.000 đ/giờ; làm 160 giờ thường được trả</td><td className="px-4 py-3">100.000 × 160</td><td className="px-4 py-3 font-medium">16.000.000 đ</td></tr>
              <tr><td className="px-4 py-3">Làm thêm ngày thường: đơn đã duyệt 2 giờ; đơn giá giờ minh họa 100.000 đ, hệ số cấu hình 1,5</td><td className="px-4 py-3">2 × 100.000 × 1,5</td><td className="px-4 py-3 font-medium">300.000 đ cộng thêm</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">Số giờ làm thêm và hệ số trong ví dụ chỉ để minh họa. Kết quả thực tế lấy từ đơn làm thêm đã duyệt, lịch/loại ngày, đơn giá quy đổi và phiên bản chính sách của kỳ lương. Công thức giờ hiện hành cũng có thành phần phụ trội ca đêm. Hãy xem chi tiết từng phiếu và cảnh báo trước khi phê duyệt.</p>
      </Card>
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><BookOpen className="mt-0.5 h-4 w-4 shrink-0" />Các công thức trên giúp hiểu nguyên tắc. Mức đóng, thuế suất và điều kiện cụ thể phải theo quy định đang có hiệu lực và hồ sơ thực tế của từng người lao động.</p>
    </div>
  );
}
