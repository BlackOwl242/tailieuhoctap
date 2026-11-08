[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Definition }
if (-not $scriptDir) { $scriptDir = (Get-Location).Path }

if (Test-Path (Join-Path $scriptDir 'Bao_Cao_Bai_Tap_Lon_CNPM.md')) {
    $rootDir = $scriptDir
} elseif (Test-Path (Join-Path $scriptDir '..\Bao_Cao_Bai_Tap_Lon_CNPM.md')) {
    $rootDir = (Resolve-Path (Join-Path $scriptDir '..')).Path
} else {
    $rootDir = (Get-Location).Path
}

$mdFile = Join-Path $rootDir 'Bao_Cao_Bai_Tap_Lon_CNPM.md'
$docxFile = Join-Path $rootDir 'Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.docx'

Write-Host "Converting Markdown to Word (.docx) following Lecturer Slide 1.1, 1.2, 1.3 Standards..."

Stop-Process -Name "WINWORD" -Force -ErrorAction SilentlyContinue

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$doc = $word.Documents.Add()

# -------------------------------------------------------------
# 1. CONFIGURE BUILT-IN WORD STYLES (Times New Roman 13pt, 1.3 lines)
# -------------------------------------------------------------
$lineSpacing13 = [single]15.6 # 1.3 lines in Word COM (1.3 * 12pt = 15.6pt)

# Normal style
$styleNormal = $doc.Styles.Item("Normal")
$styleNormal.Font.Name = "Times New Roman"
$styleNormal.Font.Size = 13
$styleNormal.Font.ColorIndex = 1 # wdBlack
$styleNormal.ParagraphFormat.Alignment = 3 # wdAlignParagraphJustify
$styleNormal.ParagraphFormat.LineSpacingRule = 5 # wdLineSpaceMultiple
$styleNormal.ParagraphFormat.LineSpacing = $lineSpacing13
$styleNormal.ParagraphFormat.SpaceBefore = 6
$styleNormal.ParagraphFormat.SpaceAfter = 6
$styleNormal.ParagraphFormat.FirstLineIndent = [single]28.35 # 1.0 cm

# Heading 1 (Chapters, Lời cảm ơn, Lời cam đoan, Phụ lục)
$styleH1 = $doc.Styles.Item("Heading 1")
$styleH1.Font.Name = "Times New Roman"
$styleH1.Font.Size = 14
$styleH1.Font.Bold = $true
$styleH1.Font.Italic = $false
$styleH1.Font.ColorIndex = 1
$styleH1.ParagraphFormat.Alignment = 1 # Center
$styleH1.ParagraphFormat.LineSpacingRule = 5
$styleH1.ParagraphFormat.LineSpacing = $lineSpacing13
$styleH1.ParagraphFormat.SpaceBefore = 18
$styleH1.ParagraphFormat.SpaceAfter = 12
$styleH1.ParagraphFormat.FirstLineIndent = 0
$styleH1.ParagraphFormat.KeepWithNext = $true

# Heading 2 (1.1, 1.2, 2.1, 2.2, 3.1...)
$styleH2 = $doc.Styles.Item("Heading 2")
$styleH2.Font.Name = "Times New Roman"
$styleH2.Font.Size = 13
$styleH2.Font.Bold = $true
$styleH2.Font.Italic = $false
$styleH2.Font.ColorIndex = 1
$styleH2.ParagraphFormat.Alignment = 0 # Left
$styleH2.ParagraphFormat.LineSpacingRule = 5
$styleH2.ParagraphFormat.LineSpacing = $lineSpacing13
$styleH2.ParagraphFormat.SpaceBefore = 12
$styleH2.ParagraphFormat.SpaceAfter = 6
$styleH2.ParagraphFormat.FirstLineIndent = 0
$styleH2.ParagraphFormat.KeepWithNext = $true

# Heading 3 (1.2.1, 2.2.1, 3.1.1...) - 13pt Italic Regular (NOT Bold), indented 1.0 cm
$styleH3 = $doc.Styles.Item("Heading 3")
$styleH3.Font.Name = "Times New Roman"
$styleH3.Font.Size = 13
$styleH3.Font.Bold = $false
$styleH3.Font.Italic = $true
$styleH3.Font.ColorIndex = 1
$styleH3.ParagraphFormat.Alignment = 0 # Left
$styleH3.ParagraphFormat.LineSpacingRule = 5
$styleH3.ParagraphFormat.LineSpacing = $lineSpacing13
$styleH3.ParagraphFormat.SpaceBefore = 8
$styleH3.ParagraphFormat.SpaceAfter = 4
$styleH3.ParagraphFormat.LeftIndent = 0
$styleH3.ParagraphFormat.FirstLineIndent = [single]28.35 # 1.0 cm indent
$styleH3.ParagraphFormat.KeepWithNext = $true

# Configure TOC Styles (TOC 1, TOC 2, TOC 3) flush left (no indent) and fitting cleanly on 1 page
for ($i = -20; $i -ge -23; $i--) {
    try {
        $st = $doc.Styles.Item($i)
        $st.Font.Name = "Times New Roman"
        $st.Font.Size = 11.5
        $st.ParagraphFormat.FirstLineIndent = 0
        $st.ParagraphFormat.LeftIndent = 0
        $st.ParagraphFormat.RightIndent = 0
        $st.ParagraphFormat.LineSpacingRule = 0 # Single
        $st.ParagraphFormat.SpaceBefore = 0
        $st.ParagraphFormat.SpaceAfter = 1
        if ($i -eq -20) {
            # TOC 1 (Chapters)
            $st.Font.Bold = $true
            $st.Font.Italic = $false
            $st.ParagraphFormat.SpaceBefore = 1.5
        } elseif ($i -eq -21) {
            # TOC 2 (1.1, 1.2...)
            $st.Font.Bold = $false
            $st.Font.Italic = $false
        } else {
            # TOC 3 (1.2.1, 1.2.2...)
            $st.Font.Bold = $false
            $st.Font.Italic = $true
        }
    } catch {}
}

$selection = $word.Selection

function Set-StandardMargins($section, $wrd) {
    # Slide 1.2: Khổ A4 (210x297mm), Lề trên 2cm; lề dưới 2cm; lề trái 3,5cm; lề phải 1,5cm
    $section.PageSetup.PaperSize = 7 # wdPaperA4
    $section.PageSetup.TopMargin = $wrd.CentimetersToPoints(2.0)
    $section.PageSetup.BottomMargin = $wrd.CentimetersToPoints(2.0)
    $section.PageSetup.LeftMargin = $wrd.CentimetersToPoints(3.5)
    $section.PageSetup.RightMargin = $wrd.CentimetersToPoints(1.5)
}

# -------------------------------------------------------------
# 2. SECTION 1: COVER PAGES (WITH ELEGANT PAGE BORDER)
# -------------------------------------------------------------
$sec1 = $doc.Sections.Item(1)
Set-StandardMargins $sec1 $word

$sec1.Borders.Enable = $true
$sec1.Borders.Item(-1).LineStyle = 1
$sec1.Borders.Item(-1).LineWidth = 18
$sec1.Borders.Item(-2).LineStyle = 1
$sec1.Borders.Item(-2).LineWidth = 18
$sec1.Borders.Item(-3).LineStyle = 1
$sec1.Borders.Item(-3).LineWidth = 18
$sec1.Borders.Item(-4).LineStyle = 1
$sec1.Borders.Item(-4).LineWidth = 18
$sec1.Borders.DistanceFrom = 1

$logoPath = Join-Path $rootDir 'assets\diagrams\logo_hoc_vien.png'

function Write-Cover-Page {
    param([bool]$isInner)
    
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10
    $selection.ParagraphFormat.Alignment = 1 # Center
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LineSpacingRule = 0 # Single
    $selection.ParagraphFormat.SpaceBefore = 6
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
    $selection.ParagraphFormat.SpaceAfter = 04
    $selection.TypeText("__________________________________")
    $selection.TypeParagraph()
    
    if (Test-Path $logoPath) {
        $selection.ParagraphFormat.Alignment = 1
        $selection.ParagraphFormat.SpaceBefore = 10
        $selection.ParagraphFormat.SpaceAfter = 06
        $shape = $selection.InlineShapes.AddPicture($logoPath)
        $shape.Width = 265
        $shape.Height = 76
        $selection.TypeParagraph()
    }
    
    $selection.ParagraphFormat.Alignment = 1
    $selection.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
    $selection.ParagraphFormat.SpaceBefore = 10
    $selection.ParagraphFormat.SpaceAfter = 4
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.TypeText("TÊN ĐỀ TÀI:")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 15
    $selection.ParagraphFormat.SpaceBefore = 4
    $selection.ParagraphFormat.SpaceAfter = 6
    $selection.TypeText("Quy trình xây dựng Website tuyển dụng và tìm kiếm việc làm")
    $selection.TypeParagraph()
    $selection.TypeText("TalentConnect")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 13
    $selection.Font.Bold = $false
    $selection.ParagraphFormat.SpaceBefore = 0
    $selection.ParagraphFormat.SpaceAfter = 8
    $selection.TypeText("---------------------------------------------------------")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.ParagraphFormat.SpaceBefore = 4
    $selection.ParagraphFormat.SpaceAfter = 24
    $selection.TypeText("BÀI TẬP LỚN KẾT THÚC HỌC PHẦN")
    $selection.TypeParagraph()
    
    $selection.ParagraphFormat.Alignment = 0 # Left
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(2.2)
    $selection.ParagraphFormat.LineSpacingRule = 0 # Single
    $selection.ParagraphFormat.SpaceBefore = 2
    $selection.ParagraphFormat.SpaceAfter = 3
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    
    $selection.TypeText("Học phần : Công nghệ phần mềm")
    $selection.TypeParagraph()
    $selection.TypeText("GVHD      : Ths. Bùi Thị Thanh")
    $selection.TypeParagraph()
    
    if ($isInner) {
        $selection.TypeText("Sinh viên : Lê Quốc Huy – 2305HTTB011")
        $selection.TypeParagraph()
        $selection.TypeText("                  Nguyễn Như Hạ – 2305HTTA008")
        $selection.TypeParagraph()
        $selection.TypeText("                  Đỗ Minh Hiếu – 2305HTTA009")
        $selection.TypeParagraph()
        $selection.TypeText("                  Nguyễn Trần Quang Duy – 2405HTTB013")
        $selection.TypeParagraph()
        $selection.TypeText("                  Mai Hoàng Anh – 2305HTTB001")
        $selection.TypeParagraph()
        $selection.TypeText("                  Nguyễn Thị Ngân Hà – 2205HTTA019")
        $selection.TypeParagraph()
    } else {
        for ($i = 0; $i -lt 5; $i++) {
            $selection.TypeParagraph()
        }
    }
    
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LeftIndent = 0
    $selection.ParagraphFormat.Alignment = 1 # Center
    $selection.ParagraphFormat.SpaceBefore = 24
    $selection.ParagraphFormat.SpaceAfter = 0
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.TypeText("Hà Nội - 2026")
}

Write-Cover-Page -isInner $false
$selection.InsertBreak(7) # wdPageBreak
Write-Cover-Page -isInner $true

# BREAK TO SECTION 2 (FRONT MATTER & MAIN REPORT)
$selection.InsertBreak(2) # wdSectionBreakNextPage

# -------------------------------------------------------------
# 3. SECTION 2: FRONT MATTER & MAIN BODY (CONTINUOUS PAGE NUMBERS 1, 2, 3...)
# -------------------------------------------------------------
$sec2 = $doc.Sections.Item(2)
$sec2.Borders.Enable = $false
Set-StandardMargins $sec2 $word

$footer2 = $sec2.Footers.Item(1)
$footer2.LinkToPrevious = $false
$footer2.PageNumbers.NumberStyle = 0 # wdPageNumberStyleArabic (1, 2, 3...)
$footer2.PageNumbers.RestartNumberingAtSection = $false
$footerRange2 = $footer2.Range
$footerRange2.ParagraphFormat.Alignment = 1 # Center
$footerRange2.Font.Name = "Times New Roman"
$footerRange2.Font.Size = 13
$footer2.PageNumbers.Add(1, $true) # wdAlignPageNumberCenter

# -------------------------------------------------------------
# 4. PARSE MARKDOWN & EMIT TO WORD
# -------------------------------------------------------------
$lines = [System.IO.File]::ReadAllLines($mdFile, [System.Text.Encoding]::UTF8)

$inTable = $false
$tableRows = New-Object System.Collections.ArrayList
$pendingTableCaption = $null
$skipCoverLines = $true
$inTOCArea = $false
$inAppendix = $false
$mainBodyStarted = $false

function Write-FormattedText($text, $sel) {
    $cleanText = $text -replace '\*\*', '' -replace '\*', ''
    $sel.Font.Bold = $false
    $sel.Font.Italic = $false
    $sel.TypeText($cleanText)
}

function Flush-Table {
    param($rows, $sel, $wrd, $document, [ref]$pendingCaptionRef, [bool]$isApp)
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
            $sel.ParagraphFormat.SpaceBefore = 10
            $sel.ParagraphFormat.SpaceAfter = 4
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
        $table.Rows.Alignment = 1 # Center table on page
        $table.Rows.AllowBreakAcrossPages = $true
        $table.TopPadding = [single]4.0
        $table.BottomPadding = [single]4.0
        $table.LeftPadding = [single]5.0
        $table.RightPadding = [single]5.0
        
        $isAbbrTable = ($maxCols -eq 3 -and $parsedData.Count -gt 0 -and $parsedData[0][1] -match '(Từ|Chữ) viết tắt')
        $tblFontSize = if ($isAbbrTable -or $maxCols -le 4) { [int]13 } else { [int]12 }
        
        for ($i = 0; $i -lt $rowCount; $i++) {
            $rowObj = $parsedData[$i]
            for ($j = 0; $j -lt $rowObj.Count; $j++) {
                if ($j -lt $maxCols) {
                    $cText = [string]$rowObj[$j]
                    $cText = $cText -replace '<br\s*/?>', "`n" -replace '\*', '' -replace '`', ''
                    $cell = $table.Cell($i + 1, $j + 1)
                    $cell.Range.Text = $cText
                    if ($i -gt 0) {
                        if ($isAbbrTable) {
                            if ($j -in @(0, 1)) {
                                $cell.Range.ParagraphFormat.Alignment = 1
                            } else {
                                $cell.Range.ParagraphFormat.Alignment = 0
                            }
                            if ($j -eq 1) { $cell.Range.Font.Bold = $false }
                        } else {
                            if ($j -eq 0 -and $maxCols -gt 3 -and $cText.Length -lt 18) {
                                $cell.Range.ParagraphFormat.Alignment = 1
                            } else {
                                $cell.Range.ParagraphFormat.Alignment = 0
                            }
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
        $table.Range.ParagraphFormat.LineSpacing = [single]14.4 # 1.2 lines inside tables
        $table.Range.ParagraphFormat.SpaceBefore = 3
        $table.Range.ParagraphFormat.SpaceAfter = 3
        $table.Range.ParagraphFormat.KeepWithNext = $false
        
        $table.Rows.Item(1).Range.Font.Bold = $true
        $table.Rows.Item(1).Range.ParagraphFormat.Alignment = 1
        $table.Rows.Item(1).HeadingFormat = $false
        $table.Rows.Item(1).Range.ParagraphFormat.KeepWithNext = $true
        
        if ($isAbbrTable) {
            $table.Columns.Item(1).Width = 40
            $table.Columns.Item(2).Width = 105
            $table.Columns.Item(3).Width = 308
            for ($rIdx = 2; $rIdx -le $rowCount; $rIdx++) {
                $table.Cell($rIdx, 2).Range.Font.Bold = $false
            }
        } elseif (-not $isApp -and $maxCols -eq 5 -and $parsedData[0][1] -match 'Họ và tên') {
            $table.Columns.Item(1).Width = 26
            $table.Columns.Item(2).Width = 94
            $table.Columns.Item(3).Width = 66
            $table.Columns.Item(4).Width = 54
            $table.Columns.Item(5).Width = 213
        }
        
        $sel.SetRange($table.Range.End, $table.Range.End)
        $sel.ParagraphFormat.KeepWithNext = $false
        $sel.ParagraphFormat.SpaceBefore = 4
        $sel.ParagraphFormat.SpaceAfter = 6
        $sel.TypeParagraph()
    }
}

foreach ($line in $lines) {
    $tLine = $line.Trim()
    
    if ($skipCoverLines) {
        if ($tLine -eq 'LỜI CẢM ƠN') {
            $skipCoverLines = $false
        } else {
            continue
        }
    }
    
    if ($inTOCArea) {
        if ($tLine -cmatch '^DANH MỤC' -or $tLine -cmatch '^I\.\s+MỞ ĐẦU') {
            $inTOCArea = $false
            $selection.InsertBreak(7) # wdPageBreak before DANH MỤC
        } else {
            continue
        }
    }
    
    # Handle Appendix Section Transition
    if ($tLine -eq '[[APPENDIX_START]]') {
        if ($inTable) { Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix; $inTable = $false; $tableRows.Clear() }
        $inAppendix = $true
        $selection.InsertBreak(7) # wdPageBreak for Appendix
        continue
    }
    
    # Handle Page Break Tag (both Front Matter AND Main Body Chapters!)
    if ($tLine -match '<div style="page-break-after:\s*always;"></div>') {
        if ($inTable) { Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix; $inTable = $false; $tableRows.Clear() }
        $selection.InsertBreak(7) # wdPageBreak
        continue
    }
    
    if (-not $mainBodyStarted -and $tLine -cmatch '^I\.\s+MỞ ĐẦU') {
        $mainBodyStarted = $true
    }
    
    # Handle Image Tag
    if ($line -match '^\[\[IMAGE:\s*(.+?)\s*\|\s*Caption:\s*(.*?)\s*\]\]$') {
        if ($inTable) { Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix; $inTable = $false; $tableRows.Clear() }
        $relImg = $matches[1].Trim()
        $caption = $matches[2].Trim()
        $fullImgPath = Join-Path $rootDir $relImg
        
        if (Test-Path $fullImgPath) {
            $selection.Style = $doc.Styles.Item("Normal")
            $selection.ParagraphFormat.OutlineLevel = 10
            $selection.ParagraphFormat.Alignment = 1 # Center
            $selection.ParagraphFormat.FirstLineIndent = 0
            $selection.ParagraphFormat.LeftIndent = 0
            $selection.ParagraphFormat.LineSpacingRule = 0
            $selection.ParagraphFormat.SpaceBefore = 8
            $selection.ParagraphFormat.SpaceAfter = 4
            $selection.ParagraphFormat.KeepWithNext = $true
            
            $shape = $selection.InlineShapes.AddPicture($fullImgPath)
            $shape.LockAspectRatio = -1
            $shape.Width = 450
            if ($shape.Height -gt 650) {
                $shape.Height = 650
            }
            $selection.TypeParagraph()
            
            if ($caption -ne '') {
                $selection.Font.Name = 'Times New Roman'
                $selection.Font.Size = 13
                $selection.Font.Bold = $false
                $selection.Font.Italic = $true
                $selection.ParagraphFormat.Alignment = 1 # Center
                $selection.ParagraphFormat.LineSpacingRule = 5
                $selection.ParagraphFormat.LineSpacing = $lineSpacing13
                $selection.ParagraphFormat.SpaceBefore = 2
                $selection.ParagraphFormat.SpaceAfter = 10
                $selection.ParagraphFormat.KeepWithNext = $false
                $selection.TypeText($caption)
                $selection.TypeParagraph()
            }
        } else {
            Write-Warning "MISSING IMAGE FILE: $fullImgPath"
        }
        continue
    }
    
    # Table rows
    if ($tLine.StartsWith('|') -and $tLine.EndsWith('|')) {
        $inTable = $true
        $tableRows.Add($tLine) | Out-Null
        continue
    } else {
        if ($inTable) {
            Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix
            $inTable = $false
            $tableRows.Clear()
        }
    }
    
    if ($tLine -eq '' -or $tLine -eq '---') {
        continue
    }
    
    # Check for Table Caption (e.g. "Bảng 2.1:", "Bảng 3.1:", "Bảng PL.1:")
    if ($tLine -match '^Bảng\s+(PL\.)?\d+[\.\d]*:') {
        if ($inTable) {
            Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix
            $inTable = $false
            $tableRows.Clear()
        }
        $pendingTableCaption = $tLine
        continue
    }
    
    if ($pendingTableCaption) {
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 0
        $selection.ParagraphFormat.LineSpacingRule = 5
        $selection.ParagraphFormat.LineSpacing = $lineSpacing13
        $selection.ParagraphFormat.SpaceBefore = 3
        $selection.ParagraphFormat.SpaceAfter = 0
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 13
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.TypeText($pendingTableCaption)
        $selection.TypeParagraph()
        $pendingTableCaption = $null
    }
    
    # ---------------------------------------------------------
    # HANDLE TOC IN MARKDOWN (1-PAGE WORD NATIVE TOC)
    # ---------------------------------------------------------
    if ($tLine -eq 'Mục lục') {
        $inTOCArea = $true
        
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 0
        $selection.ParagraphFormat.SpaceAfter = 2
        $selection.TypeText("MỤC LỤC")
        $selection.TypeParagraph()
        
        $tocRange = $selection.Range
        $toc = $doc.TablesOfContents.Add($tocRange, $true, 1, 3, $null, $null, $true, $true, $null, $true, $true, $true)
        $selection.SetRange($toc.Range.End, $toc.Range.End)
        continue
    }
    

    
    # ---------------------------------------------------------
    # DANH MỤC CÁC CHỮ VIẾT TẮT / LỜI CẢM ƠN / LỜI CAM ĐOAN
    # ---------------------------------------------------------
    if ($tLine -cmatch '^DANH MỤC\s+.*VIẾT TẮT' -or $tLine -ceq 'LỜI CẢM ƠN' -or $tLine -ceq 'LỜI CAM ĐOAN') {
        $selection.Style = $doc.Styles.Item("Heading 1")
        $selection.ParagraphFormat.OutlineLevel = 1
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = if ($tLine -match '^LỜI') { 12 } else { 4 }
        $selection.ParagraphFormat.SpaceAfter = if ($tLine -match '^LỜI') { 8 } else { 4 }
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 1: Chapters I..V, PHỤ LỤC
    # ---------------------------------------------------------
    if ($tLine -cmatch '^(I|II|III|IV|V)\.\s+' -or $tLine -cmatch '^PHỤ LỤC:') {
        $selection.Style = $doc.Styles.Item("Heading 1")
        $selection.ParagraphFormat.OutlineLevel = 1
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 18
        $selection.ParagraphFormat.SpaceAfter = 12
        $selection.ParagraphFormat.KeepWithNext = $true
        $upperLine = $tLine.ToUpper([System.Globalization.CultureInfo]::GetCultureInfo("vi-VN"))
        $selection.TypeText($upperLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 2: Level 1 sections (1.1, 1.2, 2.1, 3.1...)
    # ---------------------------------------------------------
    if ($tLine -match '^\d+\.\d+\.\s+') {
        $selection.Style = $doc.Styles.Item("Heading 2")
        $selection.ParagraphFormat.OutlineLevel = 2
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 13
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 12
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 3: Level 2 sections (1.2.1, 2.2.1, 3.1.1...) - Italic, NOT Bold, indented 1.0 cm
    # ---------------------------------------------------------
    if ($tLine -match '^\d+\.\d+\.\d+\.\s+') {
        $selection.Style = $doc.Styles.Item("Heading 3")
        $selection.ParagraphFormat.OutlineLevel = 3
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 13
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.FirstLineIndent = [single]28.35 # 1.0 cm indent
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 8
        $selection.ParagraphFormat.SpaceAfter = 4
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # NORMAL BODY PARAGRAPH (Times New Roman 13pt, 1.3 lines)
    # ---------------------------------------------------------
    $workLine = $tLine -replace '`', ''
    
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10
    $selection.Font.Name = 'Times New Roman'
    $selection.Font.Size = 13
    $selection.Font.ColorIndex = 1
    $selection.ParagraphFormat.Alignment = 3 # Justify
    $selection.ParagraphFormat.LineSpacingRule = 5 # Multiple
    $selection.ParagraphFormat.LineSpacing = $lineSpacing13
    $selection.ParagraphFormat.SpaceBefore = 0
    $selection.ParagraphFormat.SpaceAfter = 0
    
    $isClosingSalutation = $workLine -match '^(Chúng em|Nhóm chúng em|Em)\s+xin\s+.*!$'
    $isShortSubHeader = ($workLine -match '^[a-zA-Z]\.\s+[^:]{2,150}:$' -and $workLine.Length -lt 160)
    $isRefItem = ($workLine -match '^(\[\d+\]|\d+\.)\s+')
    
    if ($isClosingSalutation) {
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 2 # Right
        $selection.ParagraphFormat.SpaceBefore = 4
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.ParagraphFormat.KeepWithNext = $false
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.Font.Size = 13
        $selection.TypeText($workLine)
    } elseif ($isRefItem) {
        $selection.ParagraphFormat.FirstLineIndent = [single]28.35
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 3 # Justify
        $selection.ParagraphFormat.LineSpacingRule = 5
        $selection.ParagraphFormat.LineSpacing = $lineSpacing13
        $selection.ParagraphFormat.SpaceBefore = 3
        $selection.ParagraphFormat.SpaceAfter = 3
        $selection.ParagraphFormat.KeepWithNext = $false
        $selection.Font.Bold = $false
        $selection.Font.Italic = $false
        $selection.Font.Size = 13
        Write-FormattedText $workLine $selection
    } elseif ($isShortSubHeader) {
        $selection.ParagraphFormat.FirstLineIndent = [single]28.35
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 6
        $selection.ParagraphFormat.SpaceAfter = 4
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.Font.Size = 13
        $selection.TypeText($workLine)
    } else {
        $selection.ParagraphFormat.FirstLineIndent = [single]28.35 # 1.0 cm
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 3 # Justify
        $selection.ParagraphFormat.SpaceBefore = 6
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.ParagraphFormat.KeepWithNext = $false
        $selection.Font.Bold = $false
        $selection.Font.Italic = $false
        $selection.Font.Size = 13
        Write-FormattedText $workLine $selection
    }
    $selection.TypeParagraph()
}

if ($inTable) {
    Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix
}

# -------------------------------------------------------------
# 5. UPDATE TABLE OF CONTENTS & RE-ASSERT COVER BORDERS
# -------------------------------------------------------------
Write-Host "Updating Table of Contents dynamically..."
function Format-TOC-Range($tObj, $dObj) {
    for ($i = -20; $i -ge -23; $i--) {
        try {
            $st = $dObj.Styles.Item($i)
            $st.Font.Name = "Times New Roman"
            $st.Font.Size = 11
            $st.ParagraphFormat.FirstLineIndent = 0
            $st.ParagraphFormat.LeftIndent = 0
            $st.ParagraphFormat.RightIndent = 0
            $st.ParagraphFormat.LineSpacingRule = 4 # wdLineSpaceExactly
            $st.ParagraphFormat.LineSpacing = [single]11.8
            $st.ParagraphFormat.SpaceBefore = 0
            $st.ParagraphFormat.SpaceAfter = 0
        } catch {}
    }
    $tObj.Range.Font.Name = "Times New Roman"
    $tObj.Range.Font.Size = 11
    $tObj.Range.ParagraphFormat.FirstLineIndent = 0
    $tObj.Range.ParagraphFormat.LeftIndent = 0
    $tObj.Range.ParagraphFormat.RightIndent = 0
    $tObj.Range.ParagraphFormat.LineSpacingRule = 4 # wdLineSpaceExactly
    $tObj.Range.ParagraphFormat.LineSpacing = [single]11.8
    $tObj.Range.ParagraphFormat.SpaceBefore = 0
    $tObj.Range.ParagraphFormat.SpaceAfter = 0
}

if ($doc.TablesOfContents.Count -gt 0) {
    $tocObj = $doc.TablesOfContents.Item(1)
    $tocObj.Update()
    Format-TOC-Range $tocObj $doc
    $doc.Repaginate()
    $tocObj.UpdatePageNumbers()
    Format-TOC-Range $tocObj $doc
}

function Add-Cover-Frame ($anchorPara) {
    $sh = $doc.Shapes.AddShape(1, 0, 0, 100, 100, $anchorPara.Range)
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

if ($doc.Paragraphs.Count -ge 20) {
    Add-Cover-Frame $doc.Paragraphs.Item(1)
    for ($idx = 2; $idx -le [math]::Min(50, $doc.Paragraphs.Count); $idx++) {
        $p = $doc.Paragraphs.Item($idx)
        if ($p.Range.Text -match "HỌC VIỆN CHÍNH TRỊ") {
            Add-Cover-Frame $p
            break
        }
    }
}

# -------------------------------------------------------------
# 6. SAVE & CLOSE
# -------------------------------------------------------------
$savePath = [string]$docxFile
$doc.SaveAs2($savePath, 16)
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "SUCCESS! Word document generated: $docxFile"
