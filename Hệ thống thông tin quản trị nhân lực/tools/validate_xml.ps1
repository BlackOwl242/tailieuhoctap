Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path 'doc/PTTK_OOP_HR.docx').ProviderPath)
foreach ($entry in $zip.Entries) {
    if ($entry.FullName.EndsWith('.xml') -or $entry.FullName.EndsWith('.rels')) {
        $stream = $entry.Open()
        $reader = New-Object System.IO.StreamReader($stream)
        $text = $reader.ReadToEnd()
        $reader.Close()
        $stream.Close()
        try {
            $xmlDoc = New-Object System.Xml.XmlDocument
            $xmlDoc.LoadXml($text)
        } catch {
            Write-Host ("ERROR in " + $entry.FullName + ": " + $_.Exception.Message)
        }
    }
}
$zip.Dispose()
Write-Host 'Finished checking XML.'
