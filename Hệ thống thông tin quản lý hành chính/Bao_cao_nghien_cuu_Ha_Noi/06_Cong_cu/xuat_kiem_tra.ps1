param([string]$InputFile,[string]$OutputPdf,[switch]$UpdateFields)
$ErrorActionPreference = 'Stop'
$inputResolved = (Resolve-Path -LiteralPath $InputFile).Path
$pdfResolved = [System.IO.Path]::GetFullPath($OutputPdf)
[System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($pdfResolved)) | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$document = $null
try {
    $document = $word.Documents.Open($inputResolved,$false,(-not $UpdateFields.IsPresent),$false)
    if ($UpdateFields) {
        $document.Repaginate()
        $document.Fields.Update() | Out-Null
        foreach ($toc in $document.TablesOfContents) { $toc.Update() }
        foreach ($tof in $document.TablesOfFigures) {
            $updated = $false
            for ($attempt = 0; $attempt -lt 3; $attempt++) {
                try { $tof.Update(); $updated = $true; break }
                catch { Start-Sleep -Milliseconds 1000; $document.Repaginate() }
            }
            if (-not $updated) { throw 'Word chưa cập nhật được danh mục hình hoặc bảng.' }
        }
        $document.Repaginate()
        foreach ($toc in $document.TablesOfContents) { $toc.UpdatePageNumbers() }
        foreach ($tof in $document.TablesOfFigures) { $tof.UpdatePageNumbers() }
        $document.Save()
    }
    $document.ExportAsFixedFormat($pdfResolved,17)
    Write-Output ('Pages=' + $document.ComputeStatistics(2))
    Write-Output ('PDF=' + $pdfResolved)
} finally {
    if ($null -ne $document) { $document.Close(0) }
    if ($word.Documents.Count -eq 0) { $word.Quit() }
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
