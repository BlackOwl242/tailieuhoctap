$ErrorActionPreference = "Stop"

$docPath = (Resolve-Path "doc/PTTK_OOP_HR.docx").ProviderPath
Write-Host "Opening document: $docPath"

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = [Microsoft.Office.Interop.Word.WdAlertLevel]::wdAlertsNone

try {
    $doc = $word.Documents.Open($docPath)
    Write-Host "Document opened. Updating fields..."

    # Update all fields in document
    $doc.Fields.Update()

    # Update all Tables of Contents
    foreach ($toc in $doc.TablesOfContents) {
        Write-Host "Updating Table of Contents..."
        $toc.Update()
    }

    # Update all Tables of Figures
    foreach ($tof in $doc.TablesOfFigures) {
        Write-Host "Updating Table of Figures..."
        $tof.Update()
    }

    # Update fields again to ensure page references are exact
    $doc.Fields.Update()

    Write-Host "Saving document..."
    $doc.Save()
    Write-Host "Saved successfully."
}
catch {
    Write-Host "Error occurred: $_"
    throw $_
}
finally {
    if ($doc) {
        $doc.Close([ref]$false)
    }
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}

Write-Host "All done!"
