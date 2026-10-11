param([Parameter(Mandatory=$true)][string]$Report, [Parameter(Mandatory=$true)][string]$Output)
$ErrorActionPreference = 'Stop'
$reportPath = (Resolve-Path -LiteralPath $Report).Path
$outputPath = [System.IO.Path]::GetFullPath($Output)
$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($reportPath, $false, $false)
    $document.Fields.Update() | Out-Null
    foreach ($toc in $document.TablesOfContents) { $toc.Update() }
    foreach ($list in $document.TablesOfFigures) { $list.Update() }
    $document.Repaginate()
    $document.Save()
    $document.ExportAsFixedFormat($outputPath, 17)
    Write-Output "Rendered with Microsoft Word: $outputPath"
} finally {
    if ($document) { $document.Close(0) }
    if ($word) { $word.Quit() }
}
