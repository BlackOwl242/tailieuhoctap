[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = "c:\Users\legen\OneDrive\Documents\GitHub\tailieuhoctap\Quản trị hệ thống thông tin"
$brainDir = "C:\Users\legen\.gemini\antigravity\brain\5e0bafcb-0923-43e5-b661-9e5ebda749fe"
$mdFile = Join-Path $brainDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.md"

# Copy markdown to workspace too
Copy-Item -Path $mdFile -Destination (Join-Path $rootDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.md") -Force

$docxFile = Join-Path $rootDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.docx"
$pdfFile  = Join-Path $rootDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.pdf"
$phachDocx = Join-Path $rootDir "Phieu_Lam_Phach_Roi.docx"
$phachPdf  = Join-Path $rootDir "Phieu_Lam_Phach_Roi.pdf"

Write-Host "Building Bai_Tap_Lon_Quan_Tri_HTTT_VNA.docx and PDF..."

Stop-Process -Name "WINWORD" -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$doc = $word.Documents.Add()

# -------------------------------------------------------------
# 1. CONFIGURE BUILT-IN WORD STYLES (Times New Roman 13pt, 1.3 lines)
# -------------------------------------------------------------
$lineSpacing13 = [single]15.6 # 1.3 lines

# Normal style
$styleNormal = $doc.Styles.Item("Normal")
$styleNormal.Font.Name = "Times New Roman"
$styleNormal.Font.Size = 13
$styleNormal.Font.ColorIndex = 1
$styleNormal.ParagraphFormat.Alignment = 3 # Justify
$styleNormal.ParagraphFormat.LineSpacingRule = 5
$styleNormal.ParagraphFormat.LineSpacing = $lineSpacing13
$styleNormal.ParagraphFormat.SpaceBefore = 4
$styleNormal.ParagraphFormat.SpaceAfter = 4
$styleNormal.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0)

# Heading 1 (LỜI CẢM ƠN, LỜI CAM ĐOAN, DANH MỤC..., MỞ ĐẦU, CHƯƠNG I..IV, KẾT LUẬN, PHỤ LỤC)
$styleH1 = $doc.Styles.Item("Heading 1")
$styleH1.Font.Name = "Times New Roman"
$styleH1.Font.Size = 14
$styleH1.Font.Bold = $true
$styleH1.Font.Italic = $false
$styleH1.Font.ColorIndex = 1
$styleH1.ParagraphFormat.Alignment = 1 # Center
$styleH1.ParagraphFormat.LineSpacingRule = 5
$styleH1.ParagraphFormat.LineSpacing = $lineSpacing13
$styleH1.ParagraphFormat.SpaceBefore = 12
$styleH1.ParagraphFormat.SpaceAfter = 8
$styleH1.ParagraphFormat.FirstLineIndent = 0
$styleH1.ParagraphFormat.KeepWithNext = $true

# Heading 2 (1.1., 1.2., 2.1., 2.2., 3.1., 4.1...)
$styleH2 = $doc.Styles.Item("Heading 2")
$styleH2.Font.Name = "Times New Roman"
$styleH2.Font.Size = 13
$styleH2.Font.Bold = $true
$styleH2.Font.Italic = $false
$styleH2.Font.ColorIndex = 1
$styleH2.ParagraphFormat.Alignment = 0 # Left
$styleH2.ParagraphFormat.LineSpacingRule = 5
$styleH2.ParagraphFormat.LineSpacing = $lineSpacing13
$styleH2.ParagraphFormat.SpaceBefore = 10
$styleH2.ParagraphFormat.SpaceAfter = 4
$styleH2.ParagraphFormat.FirstLineIndent = 0
$styleH2.ParagraphFormat.KeepWithNext = $true

# Heading 3 (1.1.1., 1.1.2., 2.1.1...) - 13pt Regular Italic (NOT Bold), indented 1.0 cm, NOT in TOC!
$styleH3 = $doc.Styles.Item("Heading 3")
$styleH3.Font.Name = "Times New Roman"
$styleH3.Font.Size = 13
$styleH3.Font.Bold = $false
$styleH3.Font.Italic = $true
$styleH3.Font.ColorIndex = 1
$styleH3.ParagraphFormat.Alignment = 0 # Left
$styleH3.ParagraphFormat.LineSpacingRule = 5
$styleH3.ParagraphFormat.LineSpacing = $lineSpacing13
$styleH3.ParagraphFormat.SpaceBefore = 6
$styleH3.ParagraphFormat.SpaceAfter = 3
$styleH3.ParagraphFormat.LeftIndent = 0
$styleH3.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0)
$styleH3.ParagraphFormat.KeepWithNext = $true

# Configure TOC Styles (TOC 1 & TOC 2 ONLY)
for ($i = -20; $i -ge -22; $i--) {
    try {
        $st = $doc.Styles.Item($i)
        $st.Font.Name = "Times New Roman"
        $st.Font.Size = 12
        $st.ParagraphFormat.FirstLineIndent = 0
        $st.ParagraphFormat.RoundToGrid = $false
        $st.ParagraphFormat.LineSpacingRule = 5
        $st.ParagraphFormat.LineSpacing = [single]13.2
        $st.ParagraphFormat.SpaceBefore = 1
        $st.ParagraphFormat.SpaceAfter = 1
        if ($i -eq -20) {
            # TOC 1 (Level 1)
            $st.Font.Bold = $true
            $st.Font.Italic = $false
            $st.ParagraphFormat.LeftIndent = 0
            $st.ParagraphFormat.SpaceBefore = 3
        } elseif ($i -eq -21) {
            # TOC 2 (Level 2: 1.1., 1.2., ...)
            $st.Font.Bold = $false
            $st.Font.Italic = $false
            $st.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(0.5)
        }
    } catch {}
}

$selection = $word.Selection

function Set-StandardMargins($section, $wrd) {
    # Khổ A4 (210x297mm), Lề trên 2cm; lề dưới 2cm; lề trái 3,5cm; lề phải 1,5cm
    $section.PageSetup.PaperSize = 7 # wdPaperA4
    $section.PageSetup.TopMargin = $wrd.CentimetersToPoints(2.0)
    $section.PageSetup.BottomMargin = $wrd.CentimetersToPoints(2.0)
    $section.PageSetup.LeftMargin = $wrd.CentimetersToPoints(3.5)
    $section.PageSetup.RightMargin = $wrd.CentimetersToPoints(1.5)
}

# -------------------------------------------------------------
# 2. SECTION 1: COVER PAGE (WITH APAG LOGO & PAGE BORDER)
# -------------------------------------------------------------
$sec1 = $doc.Sections.Item(1)
Set-StandardMargins $sec1 $word

$logoPath = Join-Path $rootDir 'assets\diagrams\logo_hoc_vien.png'

function Write-Cover-Page {
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10
    $selection.ParagraphFormat.Alignment = 1 # Center
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LineSpacingRule = 0 # Single
    $selection.ParagraphFormat.SpaceBefore = 8
    $selection.ParagraphFormat.SpaceAfter = 2
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $false
    $selection.TypeText("HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH")
    $selection.TypeParagraph()
    
    $selection.Font.Bold = $true
    $selection.TypeText("HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG")
    $selection.TypeParagraph()
    
    $selection.Font.Bold = $false
    $selection.Font.Size = 12
    $selection.ParagraphFormat.SpaceBefore = 0
    $selection.ParagraphFormat.SpaceAfter = 8
    $selection.TypeText("__________________________________")
    $selection.TypeParagraph()
    
    if (Test-Path $logoPath) {
        $selection.ParagraphFormat.Alignment = 1
        $selection.ParagraphFormat.SpaceBefore = 14
        $selection.ParagraphFormat.SpaceAfter = 10
        $shape = $selection.InlineShapes.AddPicture($logoPath)
        $shape.Width = 265
        $shape.Height = 76
        $selection.TypeParagraph()
    }
    
    $selection.ParagraphFormat.Alignment = 1
    $selection.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
    $selection.ParagraphFormat.SpaceBefore = 14
    $selection.ParagraphFormat.SpaceAfter = 4
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.TypeText("TÊN ĐỀ TÀI:")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 15
    $selection.ParagraphFormat.SpaceBefore = 4
    $selection.ParagraphFormat.SpaceAfter = 6
    $selection.TypeText("Phân tích, đánh giá và đề xuất giải pháp nâng cấp Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 13
    $selection.Font.Bold = $false
    $selection.ParagraphFormat.SpaceBefore = 0
    $selection.ParagraphFormat.SpaceAfter = 10
    $selection.TypeText("---------------------------------------------------------")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.ParagraphFormat.SpaceBefore = 6
    $selection.ParagraphFormat.SpaceAfter = 28
    $selection.TypeText("BÀI TẬP LỚN KẾT THÚC HỌC PHẦN")
    $selection.TypeParagraph()
    
    $selection.ParagraphFormat.Alignment = 0 # Left
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(2.2)
    $selection.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
    $selection.ParagraphFormat.SpaceBefore = 4
    $selection.ParagraphFormat.SpaceAfter = 4
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    
    $selection.TypeText("Học phần : Quản trị hệ thống thông tin")
    $selection.TypeParagraph()
    $selection.TypeText("Mã phách : .......................................................")
    $selection.TypeParagraph()
    
    for ($i = 0; $i -lt 5; $i++) {
        $selection.TypeParagraph()
    }
    
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LeftIndent = 0
    $selection.ParagraphFormat.Alignment = 1 # Center
    $selection.ParagraphFormat.SpaceBefore = 28
    $selection.ParagraphFormat.SpaceAfter = 0
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.TypeText("Hà Nội - 2026")
}

Write-Cover-Page

# BREAK TO SECTION 2 (FRONT MATTER & MAIN REPORT)
$selection.InsertBreak(2) # wdSectionBreakNextPage

# -------------------------------------------------------------
# 3. SECTION 2: FRONT MATTER & MAIN BODY (PAGE NUMBERS 1, 2, 3...)
# -------------------------------------------------------------
$sec2 = $doc.Sections.Item(2)
$sec2.Borders.Enable = $false
Set-StandardMargins $sec2 $word

$footer2 = $sec2.Footers.Item(1)
$footer2.LinkToPrevious = $false
$footer2.PageNumbers.NumberStyle = 0
$footer2.PageNumbers.RestartNumberingAtSection = $true
$footer2.PageNumbers.StartingNumber = 1
$footerRange2 = $footer2.Range
$footerRange2.ParagraphFormat.Alignment = 1 # Center
$footerRange2.Font.Name = "Times New Roman"
$footerRange2.Font.Size = 13
$footer2.PageNumbers.Add(1, $true)

# Helper to write formatted inline text (**bold**, *italic*)
function Write-RichParagraph($text, $sel) {
    $clean = $text -replace '`', ''
    # Split by **bold** or *italic*
    $pattern = '(\*\*[^\*]+\*\*|\*[^\*]+\*)'
    $parts = [regex]::Split($clean, $pattern)
    foreach ($p in $parts) {
        if ($p -eq '') { continue }
        if ($p.StartsWith('**') -and $p.EndsWith('**') -and $p.Length -gt 4) {
            $sel.Font.Bold = $true
            $sel.Font.Italic = $false
            $sel.TypeText($p.Substring(2, $p.Length - 4))
        } elseif ($p.StartsWith('*') -and $p.EndsWith('*') -and $p.Length -gt 2) {
            $sel.Font.Bold = $false
            $sel.Font.Italic = $true
            $sel.TypeText($p.Substring(1, $p.Length - 2))
        } else {
            $sel.Font.Bold = $false
            $sel.Font.Italic = $false
            $sel.TypeText($p)
        }
    }
    $sel.Font.Bold = $false
    $sel.Font.Italic = $false
}

function Flush-Table {
    param($rows, $sel, $wrd, $document, [ref]$pendingCaptionRef)
    if ($rows.Count -lt 2) { return }
    
    $validRows = New-Object System.Collections.ArrayList
    foreach ($r in $rows) {
        if ($r -match '^\|?\s*:?-+:?\s*\|') { continue }
        $validRows.Add($r) | Out-Null
    }
    if ($validRows.Count -eq 0) { return }
    
    $rowCount = $validRows.Count
    $maxCols = 0
    $parsedData = New-Object System.Collections.ArrayList
    foreach ($r in $validRows) {
        $clean = $r -replace '^\|', '' -replace '\|$', ''
        $cells = $clean.Split('|')
        $cellList = New-Object System.Collections.ArrayList
        foreach ($c in $cells) {
            $cellList.Add($c.Trim()) | Out-Null
        }
        if ($cellList.Count -gt $maxCols) { $maxCols = $cellList.Count }
        $parsedData.Add($cellList) | Out-Null
    }
    
    if ($rowCount -gt 0 -and $maxCols -gt 0) {
        if ($pendingCaptionRef -and $pendingCaptionRef.Value) {
            $capText = $pendingCaptionRef.Value
            $pendingCaptionRef.Value = $null
            
            $sel.Style = $document.Styles.Item("Normal")
            $sel.ParagraphFormat.OutlineLevel = 10
            $sel.ParagraphFormat.FirstLineIndent = 0
            $sel.ParagraphFormat.LeftIndent = 0
            $sel.ParagraphFormat.Alignment = 0 # Left
            $sel.ParagraphFormat.LineSpacingRule = 5
            $sel.ParagraphFormat.LineSpacing = $lineSpacing13
            $sel.ParagraphFormat.SpaceBefore = 8
            $sel.ParagraphFormat.SpaceAfter = 3
            $sel.ParagraphFormat.KeepWithNext = $true
            $sel.Font.Name = 'Times New Roman'
            $sel.Font.Size = 13
            $sel.Font.Bold = $true
            $sel.Font.Italic = $false
            $sel.TypeText($capText)
            $sel.TypeParagraph()
        }
        
        $range = $sel.Range
        $table = $document.Tables.Add($range, $rowCount, $maxCols)
        $table.Borders.Enable = $true
        $table.Borders.InsideLineStyle = 1
        $table.Borders.OutsideLineStyle = 1
        $table.Rows.Alignment = 1 # Center
        $table.Rows.AllowBreakAcrossPages = $true
        $table.TopPadding = [single]3.5
        $table.BottomPadding = [single]3.5
        $table.LeftPadding = [single]4.5
        $table.RightPadding = [single]4.5
        
        $tblFontSize = if ($maxCols -le 3) { [int]12 } else { [int]11 }
        
        for ($i = 0; $i -lt $rowCount; $i++) {
            $rowObj = $parsedData[$i]
            for ($j = 0; $j -lt $rowObj.Count; $j++) {
                if ($j -lt $maxCols) {
                    $cText = [string]$rowObj[$j]
                    $cText = $cText -replace '<br\s*/?>', "`n" -replace '\*\*', '' -replace '\*', '' -replace '`', '' -replace '\$\\ge\$', '≥'
                    $cell = $table.Cell($i + 1, $j + 1)
                    $cell.Range.Text = $cText
                    if ($i -gt 0) {
                        if ($j -eq 0 -and $cText.Length -le 22) {
                            $cell.Range.ParagraphFormat.Alignment = 1
                        } else {
                            $cell.Range.ParagraphFormat.Alignment = 0
                        }
                    }
                }
            }
        }
        
        $table.Range.Font.Name = 'Times New Roman'
        $table.Range.Font.Size = $tblFontSize
        $table.Range.Font.Bold = $false
        $table.Range.ParagraphFormat.FirstLineIndent = 0
        $table.Range.ParagraphFormat.LineSpacingRule = 5
        $table.Range.ParagraphFormat.LineSpacing = [single]13.8
        $table.Range.ParagraphFormat.SpaceBefore = 2
        $table.Range.ParagraphFormat.SpaceAfter = 2
        $table.Range.ParagraphFormat.KeepWithNext = $false
        
        $table.Rows.Item(1).Range.Font.Bold = $true
        $table.Rows.Item(1).Range.ParagraphFormat.Alignment = 1
        $table.Rows.Item(1).HeadingFormat = -1
        $table.Rows.Item(1).Range.ParagraphFormat.KeepWithNext = $true
        
        $sel.SetRange($table.Range.End, $table.Range.End)
        $sel.ParagraphFormat.KeepWithNext = $false
        $sel.ParagraphFormat.SpaceBefore = 3
        $sel.ParagraphFormat.SpaceAfter = 5
        $sel.TypeParagraph()
    }
}

# Pre-collect Table List and Figure List from Markdown
$lines = [System.IO.File]::ReadAllLines($mdFile, [System.Text.Encoding]::UTF8)
$listOfTables = New-Object System.Collections.ArrayList
$listOfFigures = New-Object System.Collections.ArrayList

foreach ($ln in $lines) {
    $t = $ln.Trim()
    if ($t -match '^\*\*Bảng\s+\d+\.\d+\..*\*\*$') {
        $cleanCap = $t -replace '\*\*', ''
        $listOfTables.Add($cleanCap) | Out-Null
    } elseif ($t -match '^\*\*Hình\s+\d+\.\d+\..*\*\*$') {
        $cleanFig = $t -replace '\*\*', ''
        $listOfFigures.Add($cleanFig) | Out-Null
    }
}

$inTable = $false
$tableRows = New-Object System.Collections.ArrayList
$pendingTableCaption = $null
$skipCoverLines = $true
$tocInserted = $false

foreach ($line in $lines) {
    $tLine = $line.Trim()
    
    if ($skipCoverLines) {
        if ($tLine -eq '## LỜI CẢM ƠN') {
            $skipCoverLines = $false
        } else {
            continue
        }
    }
    
    # Table rows
    if ($tLine.StartsWith('|') -and $tLine.EndsWith('|')) {
        $inTable = $true
        $tableRows.Add($tLine) | Out-Null
        continue
    } else {
        if ($inTable) {
            Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption)
            $inTable = $false
            $tableRows.Clear()
            
            # Right after DANH MỤC TỪ VIẾT TẮT table, emit DANH MỤC BẢNG BIỂU & DANH MỤC HÌNH VÀ SƠ ĐỒ
            if ($tocInserted -and $listOfTables.Count -gt 0) {
                $selection.InsertBreak(7) # Page break
                
                # DANH MỤC BẢNG BIỂU
                $selection.Style = $doc.Styles.Item("Heading 1")
                $selection.ParagraphFormat.OutlineLevel = 1
                $selection.Font.Name = "Times New Roman"
                $selection.Font.Size = 14
                $selection.Font.Bold = $true
                $selection.ParagraphFormat.Alignment = 1
                $selection.TypeText("DANH MỤC BẢNG BIỂU")
                $selection.TypeParagraph()
                
                foreach ($tbCap in $listOfTables) {
                    $selection.Style = $doc.Styles.Item("Normal")
                    $selection.ParagraphFormat.OutlineLevel = 10
                    $selection.ParagraphFormat.FirstLineIndent = 0
                    $selection.ParagraphFormat.Alignment = 0
                    $selection.ParagraphFormat.SpaceBefore = 3
                    $selection.ParagraphFormat.SpaceAfter = 3
                    $selection.Font.Name = "Times New Roman"
                    $selection.Font.Size = 13
                    $selection.Font.Bold = $false
                    $selection.TypeText("• " + $tbCap)
                    $selection.TypeParagraph()
                }
                $listOfTables.Clear()
                
                # DANH MỤC HÌNH VÀ SƠ ĐỒ
                $selection.Style = $doc.Styles.Item("Heading 1")
                $selection.ParagraphFormat.OutlineLevel = 1
                $selection.Font.Name = "Times New Roman"
                $selection.Font.Size = 14
                $selection.Font.Bold = $true
                $selection.ParagraphFormat.Alignment = 1
                $selection.ParagraphFormat.SpaceBefore = 16
                $selection.TypeText("DANH MỤC HÌNH VÀ SƠ ĐỒ")
                $selection.TypeParagraph()
                
                foreach ($fgCap in $listOfFigures) {
                    $selection.Style = $doc.Styles.Item("Normal")
                    $selection.ParagraphFormat.OutlineLevel = 10
                    $selection.ParagraphFormat.FirstLineIndent = 0
                    $selection.ParagraphFormat.Alignment = 0
                    $selection.ParagraphFormat.SpaceBefore = 3
                    $selection.ParagraphFormat.SpaceAfter = 3
                    $selection.Font.Name = "Times New Roman"
                    $selection.Font.Size = 13
                    $selection.Font.Bold = $false
                    $selection.TypeText("• " + $fgCap)
                    $selection.TypeParagraph()
                }
                $listOfFigures.Clear()
            }
        }
    }
    
    if ($tLine -eq '' -or $tLine -eq '---') {
        continue
    }
    
    # Markdown Image ![alt](path)
    if ($tLine -match '^!\[(.*?)\]\((.+?)\)$') {
        $imgAlt = $matches[1].Trim()
        $imgRawPath = $matches[2].Trim() -replace '^/', '' -replace '/', '\'
        if (-not (Test-Path $imgRawPath)) {
            $fileName = Split-Path $imgRawPath -Leaf
            $alt1 = Join-Path $rootDir "assets\diagrams\$fileName"
            $alt2 = Join-Path $brainDir "assets\screenshots\$fileName"
            if (Test-Path $alt1) { $imgRawPath = $alt1 }
            elseif (Test-Path $alt2) { $imgRawPath = $alt2 }
        }
        
        if (Test-Path $imgRawPath) {
            $selection.Style = $doc.Styles.Item("Normal")
            $selection.ParagraphFormat.OutlineLevel = 10
            $selection.ParagraphFormat.Alignment = 1 # Center
            $selection.ParagraphFormat.FirstLineIndent = 0
            $selection.ParagraphFormat.LeftIndent = 0
            $selection.ParagraphFormat.LineSpacingRule = 0
            $selection.ParagraphFormat.SpaceBefore = 8
            $selection.ParagraphFormat.SpaceAfter = 3
            $selection.ParagraphFormat.KeepWithNext = $true
            
            $shape = $selection.InlineShapes.AddPicture($imgRawPath)
            $shape.LockAspectRatio = -1
            $shape.Width = 445
            if ($shape.Height -gt 540) {
                $shape.Height = 540
            }
            $selection.TypeParagraph()
        } else {
            Write-Warning "Missing image: $imgRawPath"
        }
        continue
    }
    
    # Table caption (**Bảng X.Y. ...**)
    if ($tLine -match '^\*\*Bảng\s+\d+\.\d+\..*\*\*$') {
        $pendingTableCaption = $tLine -replace '\*\*', ''
        continue
    }
    
    # Figure caption (**Hình X.Y. ...**)
    if ($tLine -match '^\*\*Hình\s+\d+\.\d+\..*\*\*$') {
        $figText = $tLine -replace '\*\*', ''
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.SpaceBefore = 2
        $selection.ParagraphFormat.SpaceAfter = 2
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 12.5
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.TypeText($figText)
        $selection.TypeParagraph()
        continue
    }
    
    # Source note under figure (*Nguồn: ...*)
    if ($tLine -match '^\*Nguồn:.*\*$') {
        $srcText = $tLine -replace '^\*', '' -replace '\*$', ''
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.SpaceBefore = 0
        $selection.ParagraphFormat.SpaceAfter = 8
        $selection.ParagraphFormat.KeepWithNext = $false
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 12
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.TypeText($srcText)
        $selection.TypeParagraph()
        continue
    }
    
    # LaTeX display formula
    if ($tLine.StartsWith('$$') -and $tLine.EndsWith('$$')) {
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.SpaceBefore = 6
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 13
        $selection.Font.Bold = $true
        $selection.Font.Italic = $true
        $selection.TypeText("Điểm rủi ro (R) = Khả năng xảy ra (P) × Mức độ tác động (I)   (Thang điểm từ 1 đến 25)")
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 1: ## ...
    # ---------------------------------------------------------
    if ($tLine -match '^##\s+(.+)$') {
        $h1Text = $matches[1].Trim()
        
        # Before DANH MỤC TỪ VIẾT TẮT, insert MỤC LỤC (showing ONLY Level 1 and Level 2!)
        if ($h1Text -eq 'DANH MỤC TỪ VIẾT TẮT' -and (-not $tocInserted)) {
            $selection.InsertBreak(7) # New page for MỤC LỤC
            
            $selection.Style = $doc.Styles.Item("Normal")
            $selection.ParagraphFormat.OutlineLevel = 10
            $selection.Font.Name = "Times New Roman"
            $selection.Font.Size = 14
            $selection.Font.Bold = $true
            $selection.ParagraphFormat.FirstLineIndent = 0
            $selection.ParagraphFormat.Alignment = 1 # Center
            $selection.ParagraphFormat.SpaceBefore = 6
            $selection.ParagraphFormat.SpaceAfter = 10
            $selection.TypeText("MỤC LỤC")
            $selection.TypeParagraph()
            
            $tocRange = $selection.Range
            # UpperHeadingLevel = 1, LowerHeadingLevel = 2 (ONLY Level 1 and Level 2! NO Level 3 1.1.1!)
            $toc = $doc.TablesOfContents.Add($tocRange, $true, 1, 2, $null, $null, $true, $true, $null, $true, $true, $false)
            $selection.SetRange($toc.Range.End, $toc.Range.End)
            
            $tocInserted = $true
        }
        
        # Page break before major sections
        if ($h1Text -ne 'LỜI CẢM ƠN') {
            $selection.InsertBreak(7) # wdPageBreak
        }
        
        $selection.Style = $doc.Styles.Item("Heading 1")
        $selection.ParagraphFormat.OutlineLevel = 1
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 10
        $selection.ParagraphFormat.SpaceAfter = 10
        $selection.ParagraphFormat.KeepWithNext = $true
        $upperH1 = $h1Text.ToUpper([System.Globalization.CultureInfo]::GetCultureInfo("vi-VN"))
        $selection.TypeText($upperH1)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 2: ### 1.1. ... or ### Phụ lục 1. ...
    # ---------------------------------------------------------
    if ($tLine -match '^###\s+(.+)$') {
        $h2Text = $matches[1].Trim()
        if ($h2Text -match '^Phụ lục') {
            $selection.Style = $doc.Styles.Item("Normal")
            $selection.ParagraphFormat.OutlineLevel = 10
        } else {
            $selection.Style = $doc.Styles.Item("Heading 2")
            $selection.ParagraphFormat.OutlineLevel = 2
        }
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 13
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 10
        $selection.ParagraphFormat.SpaceAfter = 4
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($h2Text)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 3: #### 1.1.1. ... (Indented 1.0 cm, Italic, NOT Bold, OutlineLevel = 10 so NEVER in TOC!)
    # ---------------------------------------------------------
    if ($tLine -match '^####\s+(.+)$') {
        $h3Text = $matches[1].Trim()
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10 # Body text level -> strictly excluded from TOC!
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 13
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0) # Thụt lề đầu dòng 1.0 cm
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 8
        $selection.ParagraphFormat.SpaceAfter = 4
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($h3Text)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # SUB-HEADINGS a. / b. (**a. Về những ưu điểm...**) -> Indented, Italic
    # ---------------------------------------------------------
    if ($tLine -match '^\*\*[a-z]\.\s+(.+)\*\*$') {
        $subText = $tLine -replace '\*\*', ''
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 13
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0)
        $selection.ParagraphFormat.Alignment = 0
        $selection.ParagraphFormat.SpaceBefore = 6
        $selection.ParagraphFormat.SpaceAfter = 3
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($subText)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # NORMAL BODY PARAGRAPH OR BULLET ITEM
    # ---------------------------------------------------------
    $workLine = $tLine -replace '\$P\$', 'P' -replace '\$I\$', 'I' -replace '\$P \\times I\$', 'P × I'
    if ($workLine.StartsWith('- ')) {
        $workLine = '• ' + $workLine.Substring(2)
    } elseif ($workLine.StartsWith('  - ')) {
        $workLine = '  + ' + $workLine.Substring(4)
    }
    
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10
    $selection.Font.Name = 'Times New Roman'
    $selection.Font.Size = 13
    $selection.Font.ColorIndex = 1
    $selection.ParagraphFormat.Alignment = 3 # Justify
    $selection.ParagraphFormat.LineSpacingRule = 5
    $selection.ParagraphFormat.LineSpacing = $lineSpacing13
    $selection.ParagraphFormat.LeftIndent = 0
    $selection.ParagraphFormat.FirstLineIndent = $word.CentimetersToPoints(1.0)
    $selection.ParagraphFormat.SpaceBefore = 3
    $selection.ParagraphFormat.SpaceAfter = 3
    $selection.ParagraphFormat.KeepWithNext = $false
    
    if ($workLine -eq 'Xin trân trọng cảm ơn!') {
        $selection.ParagraphFormat.Alignment = 2 # Right
        $selection.Font.Italic = $true
        $selection.TypeText($workLine)
    } else {
        Write-RichParagraph $workLine $selection
    }
    $selection.TypeParagraph()
}

if ($inTable) {
    Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption)
}

# -------------------------------------------------------------
# 5. UPDATE TABLE OF CONTENTS (STRICTLY LEVELS 1 & 2 ONLY) & ADD COVER FRAME
# -------------------------------------------------------------
Write-Host "Updating Table of Contents (Level 1 & Level 2 only)..."
if ($doc.TablesOfContents.Count -gt 0) {
    $tocObj = $doc.TablesOfContents.Item(1)
    $tocObj.UpperHeadingLevel = 1
    $tocObj.LowerHeadingLevel = 2
    $tocObj.IncludePageNumbers = $true
    $tocObj.RightAlignPageNumbers = $true
    $tocObj.UseHeadingStyles = $true
    $tocObj.UseFields = $false
    $tocObj.Update()
    $tocObj.Range.Font.Name = "Times New Roman"
    $tocObj.Range.Font.Size = 11.5
    $tocObj.Range.ParagraphFormat.LineSpacingRule = 0 # Single
    $tocObj.Range.ParagraphFormat.SpaceBefore = 1
    $tocObj.Range.ParagraphFormat.SpaceAfter = 1
    $doc.Repaginate()
    $tocObj.UpdatePageNumbers()
}

function Add-Cover-Frame ($targetDoc, $anchorPara) {
    $sh = $targetDoc.Shapes.AddShape(1, 0, 0, 100, 100, $anchorPara.Range)
    $sh.RelativeHorizontalPosition = 1
    $sh.RelativeVerticalPosition = 1
    $sh.Left = $word.CentimetersToPoints(2.5)
    $sh.Top = $word.CentimetersToPoints(1.5)
    $sh.Width = $word.CentimetersToPoints(17.0)
    $sh.Height = $word.CentimetersToPoints(26.7)
    $sh.Fill.Visible = 0
    $sh.Line.Weight = [single]2.25
    $sh.Line.ForeColor.RGB = 0
    $sh.WrapFormat.Type = 3
    $sh.ZOrder(1)
}

if ($doc.Paragraphs.Count -ge 5) {
    Add-Cover-Frame $doc $doc.Paragraphs.Item(1)
}

# Save Main DOCX and Export PDF
$doc.SaveAs2([string]$docxFile, 16)
$doc.ExportAsFixedFormat([string]$pdfFile, 17) # 17 = wdExportFormatPDF
$doc.Close()

# Copy PDF to brain artifact dir as well
Copy-Item -Path $pdfFile -Destination (Join-Path $brainDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.pdf") -Force

# -------------------------------------------------------------
# 6. BUILD DETACHABLE SLIP (Phieu_Lam_Phach_Roi.docx & .pdf)
# -------------------------------------------------------------
Write-Host "Building Phieu_Lam_Phach_Roi.docx and PDF..."
$docPhach = $word.Documents.Add()
$secP = $docPhach.Sections.Item(1)
Set-StandardMargins $secP $word

$selP = $word.Selection
$selP.Font.Name = "Times New Roman"
$selP.Font.Size = 14
$selP.ParagraphFormat.Alignment = 1 # Center
$selP.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
$selP.Font.Bold = $false
$selP.TypeText("HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH")
$selP.TypeParagraph()
$selP.Font.Bold = $true
$selP.TypeText("HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG")
$selP.TypeParagraph()
$selP.Font.Bold = $false
$selP.Font.Size = 12
$selP.TypeText("__________________________________")
$selP.TypeParagraph()

if (Test-Path $logoPath) {
    $selP.ParagraphFormat.SpaceBefore = 12
    $selP.ParagraphFormat.SpaceAfter = 8
    $shP = $selP.InlineShapes.AddPicture($logoPath)
    $shP.Width = 250
    $shP.Height = 72
    $selP.TypeParagraph()
}

$selP.Font.Size = 15
$selP.Font.Bold = $true
$selP.ParagraphFormat.SpaceBefore = 14
$selP.ParagraphFormat.SpaceAfter = 10
$selP.TypeText("PHIẾU LÀM PHÁCH RỜI BÀI TẬP LỚN KẾT THÚC HỌC PHẦN")
$selP.TypeParagraph()

$selP.Font.Size = 14
$selP.ParagraphFormat.Alignment = 0 # Left
$selP.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(1.2)
$selP.ParagraphFormat.SpaceBefore = 6
$selP.ParagraphFormat.SpaceAfter = 6

$infoLines = @(
    "1. Học phần: Quản trị hệ thống thông tin",
    "2. Tên đề tài: Phân tích, đánh giá và đề xuất giải pháp nâng cấp Hệ thống thông tin đặt vé và làm thủ tục trực tuyến của Hãng hàng không Quốc gia Việt Nam (Vietnam Airlines)",
    "3. Họ và tên sinh viên thực hiện: .................................................................",
    "4. Mã số sinh viên: ....................................................................................",
    "5. Lớp hành chính / Lớp tín chỉ: ...................................................................",
    "6. Giảng viên hướng dẫn / chấm thi: .............................................................",
    "7. Số điện thoại liên hệ: ..............................................................................",
    "8. Mã phách (Do bộ phận khảo thí ghi): ........................................................"
)
foreach ($il in $infoLines) {
    $selP.Font.Bold = $false
    $selP.TypeText($il)
    $selP.TypeParagraph()
}

$selP.ParagraphFormat.LeftIndent = 0
$selP.ParagraphFormat.Alignment = 1
$selP.ParagraphFormat.SpaceBefore = 36
$selP.Font.Bold = $true
$selP.TypeText("Hà Nội - 2026")

Add-Cover-Frame $docPhach $docPhach.Paragraphs.Item(1)

$docPhach.SaveAs2([string]$phachDocx, 16)
$docPhach.ExportAsFixedFormat([string]$phachPdf, 17)
$docPhach.Close()

$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "ALL DELIVERABLES BUILT SUCCESSFULLY!"
