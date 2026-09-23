$docxPath = "C:\Users\legen\OneDrive\Documents\GitHub\tailieuhoctap\Công nghệ phần mềm\Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($docxPath, $false, $true)

Write-Host "=== VERIFYING TOC ==="
$toc = $doc.TablesOfContents.Item(1)
$tocText = $toc.Range.Text
$tocPage = $toc.Range.Information(1) # wdActiveEndPageNumber
Write-Host "TOC Page: $tocPage"

$tocLines = $tocText -split "`r`n|`n|`r" | Where-Object { $_.Trim() -ne '' }
Write-Host "TOC Entries Count: $($tocLines.Count)"

$h3InToc = 0
foreach ($tl in $tocLines) {
    if ($tl -match '^\s*\d+\.\d+\.\d+\.') {
        $h3InToc++
    }
}
Write-Host "TOC Level 3 entries count (Must be 0): $h3InToc"

if ($h3InToc -eq 0) {
    Write-Host "SUCCESS: TOC contains ONLY Level 1 and Level 2 headings! (No 1.1.1, no 3.1.1)" -ForegroundColor Green
} else {
    Write-Host "FAIL: Found $h3InToc Level 3 entries in TOC!" -ForegroundColor Red
}

Write-Host "`nAll TOC Entries:"
foreach ($tl in $tocLines) {
    Write-Host "  $($tl.Trim())"
}

Write-Host "`n=== VERIFYING HEADING 3 FORMATTING IN BODY ==="
$h3Count = 0
$h3BoldCount = 0
$h3ItalicCount = 0
$h4Count = 0

foreach ($p in $doc.Paragraphs) {
    $text = $p.Range.Text.Trim()
    if ($text -match '^\d+\.\d+\.\d+\.\s+') {
        $h3Count++
        if ($p.Range.Font.Bold -eq -1 -or $p.Range.Font.Bold -eq $true) { $h3BoldCount++ }
        if ($p.Range.Font.Italic -eq -1 -or $p.Range.Font.Italic -eq $true) { $h3ItalicCount++ }
    }
    if ($text -match '^\d+\.\d+\.\d+\.\d+\.\s+') {
        $h4Count++
    }
}

Write-Host "Heading 3 count in body: $h3Count"
Write-Host "Heading 3 with Bold=True (Must be 0): $h3BoldCount"
Write-Host "Heading 3 with Italic=True (Must be $h3Count): $h3ItalicCount"
Write-Host "Heading 4 count in body (Must be 0): $h4Count"

if ($h3BoldCount -eq 0 -and $h3ItalicCount -eq $h3Count -and $h4Count -eq 0) {
    Write-Host "SUCCESS: Heading 3 is strictly non-bold italic, and Heading 4 count is 0!" -ForegroundColor Green
} else {
    Write-Host "CHECK: Heading 3 bold=$h3BoldCount, italic=$h3ItalicCount, h4=$h4Count" -ForegroundColor Yellow
}

Write-Host "`n=== DOCUMENT STATISTICS ==="
Write-Host "Total Pages: $($doc.ComputeStatistics(2))"
Write-Host "Total Tables: $($doc.Tables.Count)"
Write-Host "Total Inline Shapes (Images): $($doc.InlineShapes.Count)"
Write-Host "Total Shapes (Borders): $($doc.Shapes.Count)"

$doc.Close($false)
$word.Quit()
