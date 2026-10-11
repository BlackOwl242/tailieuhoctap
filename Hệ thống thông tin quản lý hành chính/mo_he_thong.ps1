$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = 'http://127.0.0.1:8766/'
$launcher = Join-Path $root 'run.bat'

function Test-SystemReady {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing
        return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500)
    }
    catch {
        if ($_.Exception.Response) {
            $status = [int]$_.Exception.Response.StatusCode
            return ($status -ge 200 -and $status -lt 500)
        }
        return $false
    }
}

if (Test-SystemReady) {
    Write-Host 'Hệ thống đã chạy. Đang mở trình duyệt...'
    Start-Process $url
    exit 0
}

if (-not (Test-Path -LiteralPath $launcher)) {
    Write-Host "Không tìm thấy tệp khởi động: $launcher" -ForegroundColor Red
    exit 1
}

Write-Host 'Đang khởi động hệ thống. Lần đầu có thể mất vài phút để cài gói và dựng giao diện...'
Start-Process -FilePath $launcher -WorkingDirectory $root

for ($attempt = 0; $attempt -lt 180; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-SystemReady) {
        Write-Host 'Hệ thống đã sẵn sàng. Đang mở trình duyệt...'
        Start-Process $url
        exit 0
    }
}

Write-Host 'Máy chủ chưa phản hồi sau 3 phút. Kiểm tra cửa sổ máy chủ để xem lỗi khởi động.' -ForegroundColor Yellow
exit 1
