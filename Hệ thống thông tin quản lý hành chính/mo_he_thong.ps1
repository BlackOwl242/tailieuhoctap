$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = 'http://127.0.0.1:8766/'
$launcher = Join-Path $root 'run.bat'
$port = 8766

function Test-SystemReady {
    try {
        $response = Invoke-RestMethod -Uri ($url + 'api/health') -TimeoutSec 2
        return ($response.status -eq 'ok')
    }
    catch {
        return $false
    }
}

function Test-PortOpen {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $result = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        if (-not $result.AsyncWaitHandle.WaitOne(500)) { return $false }
        $client.EndConnect($result)
        return $true
    }
    catch { return $false }
    finally { $client.Close() }
}

if (Test-SystemReady) {
    Write-Host 'Hệ thống đã chạy. Đang mở trình duyệt...'
    Start-Process $url
    exit 0
}

if (Test-PortOpen) {
    Write-Host "Cổng $port đang được một ứng dụng khác sử dụng, nhưng đây không phải máy chủ của hệ thống." -ForegroundColor Red
    Write-Host 'Hãy đóng ứng dụng đang dùng cổng này rồi mở lại MO_HE_THONG.bat.'
    exit 1
}

if (-not (Test-Path -LiteralPath $launcher)) {
    Write-Host "Không tìm thấy tệp khởi động: $launcher" -ForegroundColor Red
    exit 1
}

Write-Host 'Đang khởi động hệ thống. Lần đầu có thể mất vài phút để cài gói và dựng giao diện...'
$serverProcess = Start-Process -FilePath $launcher -WorkingDirectory $root -PassThru

for ($attempt = 0; $attempt -lt 300; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-SystemReady) {
        Write-Host 'Hệ thống đã sẵn sàng. Đang mở trình duyệt...'
        Start-Process $url
        exit 0
    }
    if ($serverProcess.HasExited) {
        Write-Host 'Tiến trình máy chủ đã dừng trước khi sẵn sàng. Hãy xem thông báo lỗi ở cửa sổ máy chủ.' -ForegroundColor Red
        exit 1
    }
    if (($attempt + 1) % 10 -eq 0) {
        Write-Host "Đang chờ máy chủ phản hồi... ($($attempt + 1)/300 giây)"
    }
}

Write-Host 'Máy chủ chưa phản hồi sau 5 phút. Kiểm tra cửa sổ máy chủ để xem lỗi khởi động.' -ForegroundColor Yellow
exit 1
