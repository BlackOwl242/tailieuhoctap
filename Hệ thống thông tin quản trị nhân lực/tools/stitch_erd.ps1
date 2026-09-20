Add-Type -AssemblyName System.Drawing

$col1Path = Join-Path $PSScriptRoot "col1.png"
$col2Path = Join-Path $PSScriptRoot "col2.png"
$outPath = Join-Path $PSScriptRoot "..\doc\images\hinh_2_21_erd_database.png"

$img1 = [System.Drawing.Image]::FromFile($col1Path)
$img2 = [System.Drawing.Image]::FromFile($col2Path)

$padding = 16
$colGap = 24

$totalW = $padding * 2 + $img1.Width + $colGap + $img2.Width
$maxH = [Math]::Max($img1.Height, $img2.Height)
$totalH = $padding * 2 + $maxH

$bmp = New-Object System.Drawing.Bitmap($totalW, $totalH)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)

$g.DrawImage($img1, $padding, $padding, $img1.Width, $img1.Height)
$col2X = $padding + $img1.Width + $colGap
$g.DrawImage($img2, $col2X, $padding, $img2.Width, $img2.Height)

$g.Dispose()
$img1.Dispose()
$img2.Dispose()

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Host "Successfully stitched ERD: $($totalW) x $($totalH) -> $outPath"
