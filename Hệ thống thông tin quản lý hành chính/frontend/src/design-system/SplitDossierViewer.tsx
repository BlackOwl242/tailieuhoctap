import {
  Download,
  ExternalLink,
  FileText,
  Printer,
  RotateCw,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { renderOfficialDraft, type OfficialSlipKind } from '../officialForms'
import { toDate } from '../portalUtils'
import { printOfficialSlip } from '../printUtils'
import type { CaseFile } from '../types'

type InspectableDoc = {
  id: string
  name: string
  url: string
  category: 'Tệp công dân nộp' | 'Thông báo bổ sung' | 'Kết quả giải quyết'
  isImage: boolean
}

const SLIP_OPTIONS: { kind: OfficialSlipKind; label: string }[] = [
  { kind: 'MAU_01', label: 'Mẫu 01 · Giấy tiếp nhận & hẹn trả' },
  { kind: 'MAU_02', label: 'Mẫu 02 · Phiếu yêu cầu bổ sung' },
  { kind: 'MAU_03', label: 'Mẫu 03 · Phiếu từ chối tiếp nhận' },
  { kind: 'MAU_04', label: 'Mẫu 04 · Phiếu xin lỗi & gia hạn' },
  { kind: 'MAU_05', label: 'Mẫu 05 · Yêu cầu rút/dừng hồ sơ' },
  { kind: 'MAU_06', label: 'Mẫu 06 · Thông báo dừng giải quyết' },
]

function isImageFilename(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name)
}

export function SplitDossierViewer({
  item,
  defaultSlip = 'MAU_01',
}: {
  item: CaseFile
  defaultSlip?: OfficialSlipKind
}) {
  const docs = useMemo<InspectableDoc[]>(() => {
    const list: InspectableDoc[] = []
    ;(item.attachments || []).forEach((att, idx) => {
      const url = att.downloadUrl || att.url || ''
      if (url) {
        list.push({
          id: `att-${idx}`,
          name: att.name,
          url,
          category: 'Tệp công dân nộp',
          isImage: isImageFilename(att.name),
        })
      }
    })
    const suppDoc = item.supplement?.noticeDocument
    if (suppDoc && (suppDoc.downloadUrl || suppDoc.url)) {
      list.push({
        id: 'supp-doc',
        name: suppDoc.name,
        url: suppDoc.downloadUrl || suppDoc.url || '',
        category: 'Thông báo bổ sung',
        isImage: isImageFilename(suppDoc.name),
      })
    }
    const resDoc = item.result?.document
    if (resDoc && (resDoc.downloadUrl || resDoc.url)) {
      list.push({
        id: 'res-doc',
        name: resDoc.name,
        url: resDoc.downloadUrl || resDoc.url || '',
        category: 'Kết quả giải quyết',
        isImage: isImageFilename(resDoc.name),
      })
    }
    ;(item.result?.files || []).forEach((file, idx) => {
      if (file.downloadUrl) {
        list.push({
          id: `res-file-${idx}`,
          name: file.name,
          url: file.downloadUrl,
          category: 'Kết quả giải quyết',
          isImage: isImageFilename(file.name),
        })
      }
    })
    return list
  }, [item])

  const [mode, setMode] = useState<'files' | 'forms'>(() => (docs.length > 0 ? 'files' : 'forms'))
  const [selectedDocId, setSelectedDocId] = useState<string>(() => docs[0]?.id || '')
  const [selectedSlip, setSelectedSlip] = useState<OfficialSlipKind>(defaultSlip)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  const currentDoc = docs.find(d => d.id === selectedDocId) || docs[0]
  const signature = item.result?.signature

  const draftHtml = useMemo(
    () => renderOfficialDraft(selectedSlip, item, { autoPrint: false }),
    [selectedSlip, item],
  )

  return (
    <aside className="dossier-viewer" aria-label="Khung đối chiếu tài liệu và biểu mẫu pháp lý">
      <div className="dossier-viewer__bar">
        <div className="dossier-viewer__modes" role="tablist" aria-label="Chế độ khung xem trực tiếp">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'files'}
            className={`dossier-viewer__mode-btn ${mode === 'files' ? 'is-active' : ''}`.trim()}
            onClick={() => setMode('files')}
          >
            Tệp hồ sơ & Kết quả ({docs.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'forms'}
            className={`dossier-viewer__mode-btn ${mode === 'forms' ? 'is-active' : ''}`.trim()}
            onClick={() => setMode('forms')}
          >
            Biểu mẫu pháp lý A4 (01–06)
          </button>
        </div>

        {mode === 'forms' && (
          <button
            type="button"
            className="dossier-viewer__tool-btn"
            onClick={() => printOfficialSlip(selectedSlip, item)}
          >
            <Printer size={14} strokeWidth={1.75} aria-hidden="true" />
            <span>In văn bản A4</span>
          </button>
        )}
      </div>

      {signature?.verified && (
        <div className="dossier-viewer__sig-banner">
          <span>
            <ShieldCheck size={15} strokeWidth={2} aria-hidden="true" />{' '}
            <b>Chữ ký số toàn vẹn (Ed25519):</b> {signature.signer}
          </span>
          <span className="tabular-nums">{toDate(signature.signedAt)}</span>
        </div>
      )}

      {mode === 'files' ? (
        <>
          {docs.length > 0 ? (
            <>
              <div className="dossier-viewer__subbar">
                <select
                  aria-label="Chọn tệp đính kèm để đối chiếu"
                  className="dossier-viewer__select"
                  value={currentDoc?.id || ''}
                  onChange={e => {
                    setSelectedDocId(e.target.value)
                    setZoom(100)
                    setRotation(0)
                  }}
                >
                  {docs.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      [{doc.category}] {doc.name}
                    </option>
                  ))}
                </select>

                <div className="dossier-viewer__tools">
                  {currentDoc?.isImage && (
                    <>
                      <button
                        type="button"
                        className="dossier-viewer__tool-btn"
                        onClick={() => setZoom(z => Math.max(50, z - 25))}
                        aria-label="Thu nhỏ ảnh"
                        title="Thu nhỏ"
                      >
                        <ZoomOut size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <span className="tabular-nums dossier-viewer__zoom-readout">
                        {zoom}%
                      </span>
                      <button
                        type="button"
                        className="dossier-viewer__tool-btn"
                        onClick={() => setZoom(z => Math.min(200, z + 25))}
                        aria-label="Phóng to ảnh"
                        title="Phóng to"
                      >
                        <ZoomIn size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="dossier-viewer__tool-btn"
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        aria-label="Xoay ảnh 90 độ"
                        title="Xoay 90°"
                      >
                        <RotateCw size={14} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </>
                  )}
                  {currentDoc && (
                    <>
                      <a
                        href={currentDoc.url}
                        download={currentDoc.name}
                        className="dossier-viewer__tool-btn"
                        title="Tải tệp về máy"
                      >
                        <Download size={14} strokeWidth={1.75} aria-hidden="true" />
                        <span>Tải về</span>
                      </a>
                      <a
                        href={currentDoc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="dossier-viewer__tool-btn"
                        title="Mở rộng sang cửa sổ riêng"
                        aria-label="Mở tệp sang cửa sổ riêng"
                      >
                        <ExternalLink size={14} strokeWidth={1.75} aria-hidden="true" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              <div className="dossier-viewer__stage">
                {currentDoc?.isImage ? (
                  <div className="dossier-viewer__img-wrap">
                    <img
                      src={currentDoc.url}
                      alt={currentDoc.name}
                      className="dossier-viewer__img"
                      style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      }}
                    />
                  </div>
                ) : currentDoc ? (
                  <iframe
                    src={currentDoc.url}
                    title={`Xem trực tiếp tài liệu ${currentDoc.name}`}
                    className="dossier-viewer__iframe"
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div className="dossier-viewer__stage">
              <div className="dossier-viewer__empty-card">
                <FileText size={28} strokeWidth={1.5} color="var(--color-fg-secondary)" aria-hidden="true" />
                <p className="dossier-viewer__empty-title">
                  Hồ sơ chưa có tệp đính kèm điện tử
                </p>
                <p className="dossier-viewer__empty-hint">
                  Bạn có thể chuyển sang tab Biểu mẫu pháp lý A4 để đối chiếu và in Giấy tiếp nhận (Mẫu 01) kèm mã QR tra cứu.
                </p>
                <button
                  type="button"
                  className="button secondary compact-btn"
                  onClick={() => setMode('forms')}
                >
                  Xem dự thảo Mẫu 01 (A4)
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="dossier-viewer__subbar">
            <label htmlFor="slip-preview-select" className="hcds-locked-notice">
              Chọn biểu mẫu Nghị định 30/2020/NĐ-CP:
            </label>
            <select
              id="slip-preview-select"
              className="dossier-viewer__select"
              value={selectedSlip}
              onChange={e => setSelectedSlip(e.target.value as OfficialSlipKind)}
            >
              {SLIP_OPTIONS.map(opt => (
                <option key={opt.kind} value={opt.kind}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="dossier-viewer__stage">
            <iframe
              srcDoc={draftHtml}
              title={`Xem trước A4 ${selectedSlip} - ${item.code}`}
              className="dossier-viewer__iframe gov-legal-a4"
            />
          </div>
        </>
      )}
    </aside>
  )
}
