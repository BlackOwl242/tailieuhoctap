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
          <Link href="/regulations" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Xem quy chế và chính sách <ArrowRight className="h-4 w-4" /></Link>
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
        <p className="text-sm leading-6 text-muted-foreground">Kỳ lương lấy mức lương từ hợp đồng/quyết định có hiệu lực. Khung lương tự khớp chính xác theo chức danh và có thể tinh chỉnh theo đơn vị; khung gán riêng cho cá nhân được ưu tiên. Nếu chưa có khung phù hợp, phiếu ghi rõ chỉ dùng lương hợp đồng, không tự lấy phụ cấp ở khung khác. Hợp đồng theo ngày/giờ/tháng là căn cứ tính; kỳ trả hiện tại vẫn chốt theo tháng.</p>
        <div className="rounded-lg bg-muted p-4 text-sm leading-6">
          <p><b>Tổng thu nhập</b> = lương theo thời gian được trả + thành phần thu nhập theo cấu trúc + làm thêm đã duyệt + thưởng có hiệu lực.</p>
          <p className="mt-1"><b>Thực lĩnh</b> = tổng thu nhập − bảo hiểm người lao động − thuế TNCN theo chính sách kỳ lương − khoản khấu trừ được phép.</p>
          <p className="mt-1">Phụ cấp có thể tính theo công thức và tỷ lệ ngày được trả; khoản ăn trưa gắn với ngày có chấm công. Thành phần thu nhập có cờ chịu thuế/bảo hiểm riêng. Đi muộn, về sớm và thiếu giờ được đối chiếu với ca cá nhân, thể hiện riêng trên phiếu. Phép năm đã duyệt được tính hưởng lương; nghỉ không lương không cộng ngày công. Nghỉ ốm/thai sản được ghi nhận riêng để đối soát chế độ BHXH, không tự cộng thành lương do doanh nghiệp trả. OT đang chờ duyệt không được tính.</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">Luồng sử dụng: chốt công → tạo kỳ lương → kiểm tra từng phiếu và các cảnh báo → người có thẩm quyền duyệt/khóa kỳ → ghi nhận thanh toán bằng phương thức và mã tham chiếu. Kỳ lương hiện là bản nháp cho đến khi qua các bước duyệt.</p>
        <p className="text-xs leading-5 text-muted-foreground">
          {isEnterprise ? <>
            Các mức thuế, bảo hiểm và điều kiện khấu trừ phụ thuộc chính sách có hiệu lực trong kỳ; quản trị viên cần kiểm tra phiên bản cấu hình trước mỗi kỳ trả lương. Mức lương tối thiểu vùng 2026 theo <a className="underline" href="https://vanban.chinhphu.vn/?docid=215832&pageid=27160" target="_blank" rel="noreferrer">Nghị định 293/2025/NĐ-CP</a>; tiền làm thêm theo <a className="underline" href="https://vanban.chinhphu.vn/?classid=1&docid=198540&pageid=27160&typegroupid=3" target="_blank" rel="noreferrer">Bộ luật Lao động 45/2019/QH14</a>. Thuế tiền lương năm 2026 áp dụng biểu thuế 5 bậc từ kỳ tính thuế 2026 (
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
