$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
if (Test-Path (Join-Path $scriptDir 'Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx')) {
    $rootDir = $scriptDir
} elseif (Test-Path (Join-Path $scriptDir '..\Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx')) {
    $rootDir = (Resolve-Path (Join-Path $scriptDir '..')).Path
} else {
    $rootDir = (Get-Location).Path
}
$docxPath = Join-Path $rootDir 'Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($docxPath)

Write-Host "=== VERIFYING SHAPES (BORDERS) ==="
Write-Host "Total Shapes: $($doc.Shapes.Count)"
for ($i = 1; $i -le $doc.Shapes.Count; $i++) {
    $s = $doc.Shapes.Item($i)
    $page = $s.Anchor.Information(1) # 1 = wdActiveEndPageNumber
    Write-Host ("Shape " + $i + " on Page " + $page + ": Left=" + $s.Left + ", Top=" + $s.Top + ", Width=" + $s.Width + ", Height=" + $s.Height)
}

Write-Host "`n=== VERIFYING TOC ==="
$toc = $doc.TablesOfContents.Item(1)
Write-Host "TOC Page: $($toc.Range.Information(1))"
Write-Host "TOC Lines Count: $(($toc.Range.Text -split [char]13).Count)"
Write-Host "TOC First 3 lines:"
$tocLines = $toc.Range.Text -split [char]13
for ($i = 0; $i -lt [math]::Min(5, $tocLines.Count); $i++) {
    Write-Host ("  Line " + ($i + 1) + ": " + $tocLines[$i].Trim())
}

Write-Host "`n=== DOCUMENT STATISTICS ==="
Write-Host "Total Pages: $($doc.ComputeStatistics(2))"
Write-Host "Total Paragraphs: $($doc.Paragraphs.Count)"
Write-Host "Total Inline Shapes (Images): $($doc.InlineShapes.Count)"

$doc.Close()
$word.Quit()
