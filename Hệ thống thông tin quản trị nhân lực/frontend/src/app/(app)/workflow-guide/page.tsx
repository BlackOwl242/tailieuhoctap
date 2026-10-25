'use client';

import { useState } from 'react';
import { WorkspaceHeader } from '@/components/common/workspace-header';
import { WorkflowGuide } from '@/components/common/workflow-guide';
import { Input, Label } from '@/components/ui/primitives';
import { WORKFLOW_HELP, type WorkflowKey } from '@/lib/workflow-guides';

export default function WorkflowGuidePage() {
  const [search, setSearch] = useState('');
  const entries = Object.entries(WORKFLOW_HELP).filter(([, help]) => `${help.title} ${help.summary} ${help.steps.map(step => step.role).join(' ')}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')));
  return <div className="space-y-5 pb-12">
    <WorkspaceHeader title="Hướng dẫn thao tác" description="Chọn việc bạn cần làm; mỗi quy trình chỉ rõ ai thao tác, bấm ở đâu, kết quả và cách xử lý khi bị chặn." breadcrumbs={[{ label: 'Bàn làm việc' }, { label: 'Hướng dẫn thao tác' }]} />
    <div className="max-w-lg space-y-2"><Label htmlFor="workflow-search">Tìm theo công việc hoặc vai trò</Label><Input id="workflow-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Ví dụ: làm thêm, thử việc, HR, kế toán" /></div>
    <p className="text-sm leading-6 text-muted-foreground">Tài khoản có nhiều vai trò vẫn phải tuân thủ phê duyệt độc lập. Mỗi người đăng nhập tài khoản của mình; nút xử lý xuất hiện theo quyền, phạm vi và trạng thái hồ sơ.</p>
    <nav aria-label="Chọn quy trình" className="flex flex-wrap gap-2">{entries.map(([key, help]) => <a key={key} href={`#${key}`} className="rounded-md border px-3 py-2 text-sm hover:bg-muted">{help.title}</a>)}</nav>
    {!entries.length && <p role="status">Chưa tìm thấy quy trình. Thử từ khóa ngắn hơn hoặc tên vai trò.</p>}
    {entries.map(([key, help]) => <div key={key} id={key} className="scroll-mt-20 space-y-3"><h2 className="text-lg font-semibold">{help.title}</h2><WorkflowGuide workflow={key as WorkflowKey} expanded /></div>)}
  </div>;
}
