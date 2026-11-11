import { buildLookupUrl, buildVerificationMatrix } from './printUtils'

export function QrCodeBadge({ code, size = 76 }: { code: string; size?: number }) {
  const url = buildLookupUrl(code)
  const matrix = buildVerificationMatrix(url)
  const viewSize = matrix.length + 8
  return (
    <div className="qr-verification-badge" title={`Tra cứu trực tuyến: ${url}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label={`Mã ma trận tra cứu hồ sơ ${code}`}
      >
        <rect
          width={viewSize}
          height={viewSize}
          fill="#ffffff"
          stroke="#d5dfec"
          strokeWidth="0.6"
        />
        {matrix.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c + 4}
                y={r + 4}
                width="1"
                height="1"
                fill="#1b365d"
              />
            ) : null,
          ),
        )}
      </svg>
      <div className="qr-verification-meta">
        <small>MÃ TRA CỨU TRỰC TUYẾN</small>
        <b className="tabular-nums">{code}</b>
        <span>/tra-cuu-ho-so?code={code}</span>
      </div>
    </div>
  )
}
