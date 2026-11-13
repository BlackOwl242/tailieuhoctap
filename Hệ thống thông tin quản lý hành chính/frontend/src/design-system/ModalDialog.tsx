import { X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

export function ModalDialog({
  open,
  title,
  description,
  wide = false,
  onClose,
  footer,
  children,
}: {
  open: boolean
  title: string
  description?: string
  wide?: boolean
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className={`hcds-dialog ${wide ? 'hcds-dialog--wide' : ''}`.trim()}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      onClick={event => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="hcds-dialog__header">
        <div>
          <h2 id={titleId} className="hcds-dialog__title">
            {title}
          </h2>
          {description && (
            <p id={descId} className="hcds-dialog__desc">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          className="hcds-dialog__close"
          onClick={onClose}
          aria-label="Đóng hộp thoại"
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <div className="hcds-dialog__body">{children}</div>
      {footer && <div className="hcds-dialog__footer">{footer}</div>}
    </dialog>
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận thực hiện',
  cancelLabel = 'Hủy bỏ',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  busy?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <ModalDialog
      open={open}
      title={title}
      onClose={busy ? () => {} : onClose}
      footer={
        <>
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${tone === 'danger' ? 'warning' : 'primary'}`}
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? 'Đang xử lý...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="hcds-dialog__message">{message}</p>
    </ModalDialog>
  )
}

export function SideDrawer({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="hcds-drawer"
      aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
      onClick={event => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className="hcds-dialog__header">
        <div>
          <h2 id={titleId} className="hcds-dialog__title">
            {title}
          </h2>
          {subtitle && (
            <p className="hcds-dialog__desc">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          className="hcds-dialog__close"
          onClick={onClose}
          aria-label="Đóng ngăn thao tác"
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <div className="hcds-dialog__body">{children}</div>
      {footer && <div className="hcds-dialog__footer">{footer}</div>}
    </dialog>
  )
}
