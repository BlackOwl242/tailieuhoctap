import Link from 'next/link';
import { WORKFLOW_HELP, type WorkflowKey } from '@/lib/workflow-guides';

export function WorkflowGuide({ workflow, expanded = false }: { workflow: WorkflowKey; expanded?: boolean }) {
  const help = WORKFLOW_HELP[workflow];
  return <section className="no-print rounded-lg border border-border bg-card p-4 text-sm" aria-label={`Hướng dẫn ${help.title}`}>
    <p className="font-medium">{help.summary}</p>
    <details className="mt-2" open={expanded || undefined}>
      <summary className="w-fit cursor-pointer rounded-sm py-1 text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2">Xem từng bước và quyền thao tác</summary>
      <ol className="mt-3 grid gap-4 lg:grid-cols-3">
        {help.steps.map((step, index) => <li key={step.action} className="min-w-0 space-y-2">
          <p className="font-medium">{index + 1}. {step.role}</p>
          <p className="leading-6">{step.action}</p>
          <p className="leading-6 text-muted-foreground">Kết quả: {step.result}</p>
          <Link href={step.href} className="inline-block py-1 font-medium underline underline-offset-4">{step.link}</Link>
        </li>)}
      </ol>
      <p className="mt-4 border-t pt-3 leading-6 text-muted-foreground"><strong className="text-foreground">Nếu chưa thao tác được: </strong>{help.blocked}</p>
    </details>
    {!expanded && <Link href={`/workflow-guide#${workflow}`} className="mt-2 inline-block py-1 text-xs text-muted-foreground underline underline-offset-4">Hướng dẫn các quy trình liên quan</Link>}
  </section>;
}
