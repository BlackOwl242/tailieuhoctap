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

Write-Host "Converting Markdown to Word (.docx) with Perfect Academic Formatting & True Headings..."

Stop-Process -Name "WINWORD" -Force -ErrorAction SilentlyContinue

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$doc = $word.Documents.Add()

# -------------------------------------------------------------
# 1. CONFIGURE BUILT-IN WORD STYLES
# -------------------------------------------------------------
# Normal style
$styleNormal = $doc.Styles.Item("Normal")
$styleNormal.Font.Name = "Times New Roman"
$styleNormal.Font.Size = 13
$styleNormal.Font.ColorIndex = 1 # wdBlack
$styleNormal.ParagraphFormat.Alignment = 3 # wdAlignParagraphJustify
$styleNormal.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
$styleNormal.ParagraphFormat.SpaceBefore = 6
$styleNormal.ParagraphFormat.SpaceAfter = 6
$styleNormal.ParagraphFormat.FirstLineIndent = 36

# Heading 1 (Chapters, Lời cảm ơn, Lời cam đoan)
$styleH1 = $doc.Styles.Item("Heading 1")
$styleH1.Font.Name = "Times New Roman"
$styleH1.Font.Size = 14
$styleH1.Font.Bold = $true
$styleH1.Font.ColorIndex = 1
$styleH1.ParagraphFormat.Alignment = 1 # Center
$styleH1.ParagraphFormat.LineSpacingRule = 1
$styleH1.ParagraphFormat.SpaceBefore = 18
$styleH1.ParagraphFormat.SpaceAfter = 12
$styleH1.ParagraphFormat.FirstLineIndent = 0
$styleH1.ParagraphFormat.KeepWithNext = $true

# Heading 2 (1.1, 1.2, 2.1, 2.2, 3.1...)
$styleH2 = $doc.Styles.Item("Heading 2")
$styleH2.Font.Name = "Times New Roman"
$styleH2.Font.Size = 13
$styleH2.Font.Bold = $true
$styleH2.Font.ColorIndex = 1
$styleH2.ParagraphFormat.Alignment = 0 # Left
$styleH2.ParagraphFormat.LineSpacingRule = 1
$styleH2.ParagraphFormat.SpaceBefore = 12
$styleH2.ParagraphFormat.SpaceAfter = 6
$styleH2.ParagraphFormat.FirstLineIndent = 0
$styleH2.ParagraphFormat.KeepWithNext = $true

# Heading 3 (1.2.1, 2.2.1, 3.1.1...)
$styleH3 = $doc.Styles.Item("Heading 3")
$styleH3.Font.Name = "Times New Roman"
$styleH3.Font.Size = 13
$styleH3.Font.Bold = $false
$styleH3.Font.Italic = $true
$styleH3.Font.ColorIndex = 1
$styleH3.ParagraphFormat.Alignment = 0 # Left
$styleH3.ParagraphFormat.LineSpacingRule = 1
$styleH3.ParagraphFormat.SpaceBefore = 8
$styleH3.ParagraphFormat.SpaceAfter = 4
$styleH3.ParagraphFormat.FirstLineIndent = 0
$styleH3.ParagraphFormat.KeepWithNext = $true

# Heading 4 (2.2.1.1, 3.2.3.1...)
$styleH4 = $doc.Styles.Item("Heading 4")
$styleH4.Font.Name = "Times New Roman"
$styleH4.Font.Size = 13
$styleH4.Font.Bold = $true
$styleH4.Font.ColorIndex = 1
$styleH4.ParagraphFormat.Alignment = 0 # Left
$styleH4.ParagraphFormat.LineSpacingRule = 1
$styleH4.ParagraphFormat.SpaceBefore = 6
$styleH4.ParagraphFormat.SpaceAfter = 3
$styleH4.ParagraphFormat.FirstLineIndent = 0
$styleH4.ParagraphFormat.KeepWithNext = $true

# Configure TOC Styles (TOC 1 = -20, TOC 2 = -21, TOC 3 = -22, TOC 4 = -23)
for ($i = -20; $i -ge -23; $i--) {
    try {
        $st = $doc.Styles.Item($i)
        $st.Font.Name = "Times New Roman"
        $st.Font.Size = 13
        $st.ParagraphFormat.LeftIndent = 0
        $st.ParagraphFormat.FirstLineIndent = 0
        if ($i -eq -20) {
            $st.Font.Bold = $true
            $st.ParagraphFormat.SpaceBefore = 6
            $st.ParagraphFormat.SpaceAfter = 2
        } else {
            $st.Font.Bold = $false
            $st.ParagraphFormat.SpaceBefore = 1.5
            $st.ParagraphFormat.SpaceAfter = 1.5
        }
    } catch {}
}

$selection = $word.Selection

# -------------------------------------------------------------
# 2. SECTION 1: COVER PAGES (WITH ELEGANT PAGE BORDER)
# -------------------------------------------------------------
$sec1 = $doc.Sections.Item(1)
$sec1.PageSetup.PaperSize = 7 # wdPaperA4
$sec1.PageSetup.TopMargin = $word.CentimetersToPoints(2.0)
$sec1.PageSetup.BottomMargin = $word.CentimetersToPoints(2.0)
$sec1.PageSetup.LeftMargin = $word.CentimetersToPoints(3.0)
$sec1.PageSetup.RightMargin = $word.CentimetersToPoints(2.0)

# Apply Page Border on Section 1 (Top, Left, Bottom, Right)
$sec1.Borders.Enable = $true
$sec1.Borders.Item(-1).LineStyle = 1 # wdLineStyleSingle
$sec1.Borders.Item(-1).LineWidth = 18 # 2.25 pt
$sec1.Borders.Item(-2).LineStyle = 1
$sec1.Borders.Item(-2).LineWidth = 18
$sec1.Borders.Item(-3).LineStyle = 1
$sec1.Borders.Item(-3).LineWidth = 18
$sec1.Borders.Item(-4).LineStyle = 1
$sec1.Borders.Item(-4).LineWidth = 18
$sec1.Borders.DistanceFrom = 1 # wdBorderDistanceFromPageEdge

$logoPath = Join-Path $rootDir 'assets\diagrams\logo_hoc_vien.png'

function Write-Cover-Page {
    param([bool]$isInner)
    
    # 1. Academy Header
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10
    $selection.ParagraphFormat.Alignment = 1 # Center
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
    
    # Thin divider line under header
    $selection.Font.Bold = $false
    $selection.Font.Size = 12
    $selection.ParagraphFormat.SpaceBefore = 0
    $selection.ParagraphFormat.SpaceAfter = 14
    $selection.TypeText("__________________________________")
    $selection.TypeParagraph()
    
    # 2. Logo
    if (Test-Path $logoPath) {
        $selection.ParagraphFormat.Alignment = 1
        $selection.ParagraphFormat.SpaceBefore = 10
        $selection.ParagraphFormat.SpaceAfter = 16
        $shape = $selection.InlineShapes.AddPicture($logoPath)
        $shape.Width = 265
        $shape.Height = 76
        $selection.TypeParagraph()
    }
    
    # 3. Topic Title
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
    
    # 4. Info Block
    $selection.ParagraphFormat.Alignment = 0 # Left
    $selection.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(2.2)
    $selection.ParagraphFormat.LineSpacingRule = 0 # Single
    $selection.ParagraphFormat.SpaceBefore = 2
    $selection.ParagraphFormat.SpaceAfter = 3
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 13
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
        # Outer cover vertical padding
        for ($i = 0; $i -lt 5; $i++) {
            $selection.TypeParagraph()
        }
    }
    
    # 5. Footer: Hà Nội - 2026
    $selection.ParagraphFormat.LeftIndent = 0
    $selection.ParagraphFormat.Alignment = 1 # Center
    $selection.ParagraphFormat.SpaceBefore = 28
    $selection.ParagraphFormat.SpaceAfter = 0
    $selection.Font.Bold = $true
    $selection.TypeText("Hà Nội - 2026")
}

# Write Cover 1
Write-Cover-Page -isInner $false
$selection.InsertBreak(7) # wdPageBreak

# Write Cover 2
Write-Cover-Page -isInner $true

# BREAK TO SECTION 2 (BODY & TOC)
$selection.InsertBreak(2) # wdSectionBreakNextPage

# -------------------------------------------------------------
# 3. SECTION 2: BODY & TOC (NO PAGE BORDER)
# -------------------------------------------------------------
$sec2 = $doc.Sections.Item(2)
$sec2.Borders.Enable = $false
$sec2.PageSetup.PaperSize = 7
$sec2.PageSetup.TopMargin = $word.CentimetersToPoints(2.0)
$sec2.PageSetup.BottomMargin = $word.CentimetersToPoints(2.0)
$sec2.PageSetup.LeftMargin = $word.CentimetersToPoints(3.0)
$sec2.PageSetup.RightMargin = $word.CentimetersToPoints(2.0)

# Add Page Numbering in Footer (Bottom-Center, Times New Roman 12pt)
$footer = $sec2.Footers.Item(1) # wdHeaderFooterPrimary
$footer.LinkToPrevious = $false
$footer.PageNumbers.RestartNumberingAtSection = $true
$footer.PageNumbers.StartingNumber = 1
$footerRange = $footer.Range
$footerRange.ParagraphFormat.Alignment = 1 # Center
$footerRange.Font.Name = "Times New Roman"
$footerRange.Font.Size = 12
$footer.PageNumbers.Add(1, $true) # wdAlignPageNumberCenter

# -------------------------------------------------------------
# 4. PARSE MARKDOWN & EMIT TO WORD
# -------------------------------------------------------------
$lines = [System.IO.File]::ReadAllLines($mdFile, [System.Text.Encoding]::UTF8)

$inTable = $false
$tableRows = New-Object System.Collections.ArrayList
$pendingTableCaption = $null
$skipCoverLines = $true # We already generated the cover programmatically
$inTOCArea = $false

function Write-FormattedText($text, $sel) {
    if ($text -notmatch '\*\*') {
        $sel.Font.Bold = $false
        $sel.TypeText($text)
        return
    }
    $parts = $text -split '\*\*'
    $boldState = $false
    foreach ($p in $parts) {
        if ($p.Length -gt 0) {
            $sel.Font.Bold = $boldState
            $sel.TypeText($p)
        }
        $boldState = -not $boldState
    }
    $sel.Font.Bold = $false
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
        # If we have a pending table caption, emit it right before the table
        if ($pendingCaptionRef -and $pendingCaptionRef.Value) {
            $capText = $pendingCaptionRef.Value
            $pendingCaptionRef.Value = $null
            
            $sel.Style = $document.Styles.Item("Normal")
            $sel.ParagraphFormat.OutlineLevel = 10
            $sel.ParagraphFormat.FirstLineIndent = 0
            $sel.ParagraphFormat.LeftIndent = 0
            $sel.ParagraphFormat.Alignment = 0 # Left
            $sel.ParagraphFormat.SpaceBefore = 10
            $sel.ParagraphFormat.SpaceAfter = 3
            $sel.ParagraphFormat.KeepWithNext = $true
            $sel.Font.Name = 'Times New Roman'
            $sel.Font.Size = 13
            $sel.Font.Bold = $true
            $sel.Font.Italic = $false
            $sel.TypeText($capText)
            $sel.TypeParagraph()
            
            # The paragraph where the table will be inserted must ALSO have KeepWithNext = $true
            $sel.ParagraphFormat.FirstLineIndent = 0
            $sel.ParagraphFormat.LeftIndent = 0
            $sel.ParagraphFormat.SpaceBefore = 0
            $sel.ParagraphFormat.SpaceAfter = 0
            $sel.ParagraphFormat.KeepWithNext = $true
        }
        
        $range = $sel.Range
        $table = $document.Tables.Add($range, $rowCount, $maxCols)
        $table.Borders.Enable = $true
        $table.Borders.InsideLineStyle = 1
        $table.Borders.OutsideLineStyle = 1
        $table.Rows.Alignment = 1 # Center table on page
        $table.Rows.AllowBreakAcrossPages = $false
        $table.TopPadding = 3
        $table.BottomPadding = 3
        $table.LeftPadding = 5
        $table.RightPadding = 5
        $table.Range.Font.Name = 'Times New Roman'
        $table.Range.Font.Size = 13
        $table.Range.ParagraphFormat.LineSpacingRule = 0
        $table.Range.ParagraphFormat.SpaceBefore = 2
        $table.Range.ParagraphFormat.SpaceAfter = 2
        $table.Range.ParagraphFormat.KeepWithNext = $false
        $isAbbrTable = ($maxCols -eq 3 -and $parsedData.Count -gt 0 -and $parsedData[0][1] -match 'Từ viết tắt')
        
        for ($i = 0; $i -lt $rowCount; $i++) {
            $rowObj = $parsedData[$i]
            for ($j = 0; $j -lt $rowObj.Count; $j++) {
                if ($j -lt $maxCols) {
                    $cText = [string]$rowObj[$j]
                    $cText = $cText -replace '<br\s*/?>', "`n" -replace '\*\*', ''
                    $cell = $table.Cell($i + 1, $j + 1)
                    $cell.Range.Text = $cText
                    $cell.Range.Font.Name = 'Times New Roman'
                    $cell.Range.Font.Size = 13
                    $cell.Range.ParagraphFormat.FirstLineIndent = 0
                    $cell.Range.ParagraphFormat.LineSpacingRule = 0
                    $cell.Range.ParagraphFormat.SpaceBefore = 2
                    $cell.Range.ParagraphFormat.SpaceAfter = 2
                    $cell.Range.ParagraphFormat.KeepWithNext = $false
                    
                    if ($i -eq 0) {
                        # Header row: Bold, Center, NO SHADING
                        $cell.Range.Font.Bold = $true
                        $cell.Range.ParagraphFormat.Alignment = 1
                        $cell.Shading.BackgroundPatternColor = 16777215 # White
                    } else {
                        if ($isAbbrTable) {
                            if ($j -eq 0) {
                                $cell.Range.ParagraphFormat.Alignment = 1 # Center STT
                                $cell.Range.Font.Bold = $false
                            } elseif ($j -eq 1) {
                                $cell.Range.ParagraphFormat.Alignment = 1 # Center Abbr
                                $cell.Range.Font.Bold = $true
                            } else {
                                $cell.Range.ParagraphFormat.Alignment = 0 # Left Meaning
                                $cell.Range.Font.Bold = $false
                            }
                        } else {
                            $cell.Range.Font.Bold = $false
                            if ($j -eq 0 -and $maxCols -gt 2) {
                                $cell.Range.ParagraphFormat.Alignment = 1
                            } else {
                                $cell.Range.ParagraphFormat.Alignment = 0
                            }
                        }
                    }
                }
            }
        }
        if ($isAbbrTable) {
            $table.Columns.Item(1).Width = 38
            $table.Columns.Item(2).Width = 95
            $table.Columns.Item(3).Width = 320
        }
        $table.Rows.Item(1).HeadingFormat = $true
        $table.Rows.Item(1).Range.ParagraphFormat.KeepWithNext = $true
        $sel.SetRange($table.Range.End, $table.Range.End)
        $sel.ParagraphFormat.KeepWithNext = $false
        $sel.ParagraphFormat.SpaceBefore = 0
        $sel.ParagraphFormat.SpaceAfter = 6
        $sel.TypeParagraph()
    }
}

foreach ($line in $lines) {
    $tLine = $line.Trim()
    
    # Skip markdown cover lines until "LỜI CẢM ƠN"
    if ($skipCoverLines) {
        if ($tLine -eq 'LỜI CẢM ƠN') {
            $skipCoverLines = $false
        } else {
            continue
        }
    }
    
    # Handle Page Break Tag
    if ($tLine -match '<div style="page-break-after:\s*always;"></div>') {
        if ($inTable) { Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption); $inTable = $false; $tableRows.Clear() }
        $selection.InsertBreak(7) # wdPageBreak
        continue
    }
    
    # Handle Image Tag
    if ($line -match '^\[\[IMAGE:\s*(.+?)\s*\|\s*Caption:\s*(.*?)\s*\]\]$') {
        if ($inTable) { Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption); $inTable = $false; $tableRows.Clear() }
        $relImg = $matches[1].Trim()
        $caption = $matches[2].Trim()
        $fullImgPath = Join-Path $rootDir $relImg
        
        if (Test-Path $fullImgPath) {
            $selection.Style = $doc.Styles.Item("Normal")
            $selection.ParagraphFormat.OutlineLevel = 10
            $selection.ParagraphFormat.Alignment = 1 # Center
            $selection.ParagraphFormat.FirstLineIndent = 0
            $selection.ParagraphFormat.LeftIndent = 0
            $selection.ParagraphFormat.SpaceBefore = 8
            $selection.ParagraphFormat.SpaceAfter = 2
            $selection.ParagraphFormat.KeepWithNext = $true
            
            $shape = $selection.InlineShapes.AddPicture($fullImgPath)
            if ($shape.Width -gt 450) {
                $ratio = 450.0 / $shape.Width
                $shape.Width = 450
                $shape.Height = $shape.Height * $ratio
            }
            $selection.TypeParagraph()
            
            # Caption
            if ($caption -ne '') {
                $selection.Font.Name = 'Times New Roman'
                $selection.Font.Size = 11
                $selection.Font.Bold = $false
                $selection.Font.Italic = $true
                $selection.ParagraphFormat.Alignment = 1 # Center
                $selection.ParagraphFormat.SpaceBefore = 2
                $selection.ParagraphFormat.SpaceAfter = 8
                $selection.ParagraphFormat.KeepWithNext = $false
                $selection.TypeText($caption)
                $selection.TypeParagraph()
            }
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
            Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption)
            $inTable = $false
            $tableRows.Clear()
        }
    }
    
    if ($tLine -eq '' -or $tLine -eq '---') {
        continue
    }
    
    # Check for Table Caption
    if ($tLine -match '^Bảng\s+\d+[\.\d]*:') {
        if ($inTable) {
            Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption)
            $inTable = $false
            $tableRows.Clear()
        }
        $pendingTableCaption = $tLine
        continue
    }
    
    # If there was a pending table caption, but the current non-empty line is NOT a table row, flush the caption as standalone text
    if ($pendingTableCaption) {
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 0
        $selection.ParagraphFormat.SpaceBefore = 10
        $selection.ParagraphFormat.SpaceAfter = 4
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
    # HANDLE TOC IN MARKDOWN (REPLACE STATIC TEXT WITH WORD TOC)
    # ---------------------------------------------------------
    if ($tLine -eq 'Mục lục') {
        $inTOCArea = $true
        
        # Output "MỤC LỤC" title (not indexed in TOC)
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 14
        $selection.ParagraphFormat.SpaceAfter = 8
        $selection.TypeText("MỤC LỤC")
        $selection.TypeParagraph()
        
        # Add Word Native Table of Contents
        $tocRange = $selection.Range
        # Add(Range, UseHeadingStyles, UpperHeadingLevel, LowerHeadingLevel, UseFields, TableID, RightAlignPageNumbers, IncludePageNumbers, AddedStyles, UseHyperlinks, HidePageNumbersInWeb, UseOutlineLevels)
        $toc = $doc.TablesOfContents.Add($tocRange, $true, 1, 2, $null, $null, $true, $true, $null, $true, $true, $true)
        $selection.SetRange($toc.Range.End, $toc.Range.End)
        $selection.TypeParagraph()
        $selection.InsertBreak(7) # wdPageBreak
        continue
    }
    
    # Skip static TOC lines until we hit Chapter I or DANH MỤC
    if ($inTOCArea) {
        if ($tLine -match '^I\.\s+M[ởỞ]\s+đ[ầuẦU]' -or $tLine -match '^DANH MỤC') {
            $inTOCArea = $false
        } else {
            continue
        }
    }
    
    # ---------------------------------------------------------
    # DANH MỤC TỪ/ THUẬT NGỮ VIẾT TẮT
    # ---------------------------------------------------------
    if ($tLine -match '^DANH MỤC\s+(TỪ/\s*THUẬT NGỮ|CÁC TỪ)\s+VIẾT TẮT') {
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 14
        $selection.ParagraphFormat.SpaceAfter = 8
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 1: Chapters, Lời cảm ơn, Lời cam đoan, Tài liệu tham khảo
    # ---------------------------------------------------------
    if ($tLine -match '^(I|II|III|IV|V)\.\s+' -or $tLine -eq 'LỜI CẢM ƠN' -or $tLine -eq 'LỜI CAM ĐOAN' -or $tLine -match '^TÀI LIỆU THAM KHẢO') {
        $selection.Style = $doc.Styles.Item("Heading 1")
        $selection.ParagraphFormat.OutlineLevel = 1
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.ParagraphFormat.Alignment = 1 # Center
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
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 3: Level 2 sections (1.2.1, 2.2.1, 3.1.1...)
    # ---------------------------------------------------------
    if ($tLine -match '^\d+\.\d+\.\d+\.\s+') {
        $selection.Style = $doc.Styles.Item("Heading 3")
        $selection.ParagraphFormat.OutlineLevel = 3
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 13
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # NORMAL BODY PARAGRAPH
    # ---------------------------------------------------------
    $isBullet = $line -match '^\s*-\s+(.+)'
    $workLine = if ($isBullet) { $matches[1] } else { $line }
    
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10 # Body text
    $selection.Font.Name = 'Times New Roman'
    $selection.Font.Size = 13
    $selection.Font.ColorIndex = 1
    $selection.ParagraphFormat.Alignment = 3 # Justify
    $selection.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
    $selection.ParagraphFormat.SpaceBefore = 6
    $selection.ParagraphFormat.SpaceAfter = 6
    
    # Table caption (e.g. "Bảng 3.1: Ma trận RACI")
    $isTableCaption = $workLine -match '^Bảng\s+\d+[\.\d]*:'
    # Image caption (e.g. "Hình ảnh 3.1: Sơ đồ...")
    $isImageCaption = $workLine -match '^Hình ảnh\s+\d+[\.\d]*:'
    # Table note (e.g. "*Ghi chú RACI: ...*")
    $isTableNote = $workLine -match '^\*(Ghi chú[^*]*)\*$'
    # Standalone short subheader (e.g. "a. Khái niệm và sự ra đời:", "Nội dung 1:")
    $isShortSubHeader = ($workLine -match '^[a-z]\.\s+[^:]{2,120}:?' -and $workLine.Length -lt 140) -or `
                        ($workLine -match '^\*?\s*Nội dung \d+:' -and $workLine.Length -lt 80)
    
    if ($isBullet) {
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(0.8)
        $selection.ParagraphFormat.SpaceBefore = 3
        $selection.ParagraphFormat.SpaceAfter = 3
        $selection.ParagraphFormat.KeepWithNext = $false
        $selection.Font.Bold = $false
        $selection.Font.Italic = $false
        $selection.TypeText([char]0x2022 + " ")
        Write-FormattedText $workLine $selection
    } elseif ($isImageCaption) {
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 2
        $selection.ParagraphFormat.SpaceAfter = 8
        $selection.ParagraphFormat.KeepWithNext = $false
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.Font.Size = 11
        $selection.TypeText($workLine)
    } elseif ($isTableNote) {
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 2
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.ParagraphFormat.KeepWithNext = $false
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.Font.Size = 11
        $selection.TypeText($matches[1])
    } elseif ($isShortSubHeader) {
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 6
        $selection.ParagraphFormat.SpaceAfter = 3
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.Font.Size = 13
        $cleanSubHeader = $workLine -replace '^\*\s*', ''
        $selection.TypeText($cleanSubHeader)
    } else {
        $selection.ParagraphFormat.FirstLineIndent = 36 # 1.27 cm standard indent
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
    Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption)
}

# -------------------------------------------------------------
# 5. UPDATE TABLE OF CONTENTS & RE-ASSERT COVER BORDERS
# -------------------------------------------------------------
Write-Host "Updating Table of Contents dynamically..."
if ($doc.TablesOfContents.Count -gt 0) {
    $doc.TablesOfContents.Item(1).Update()
}

# Add Outer Border Frames to Cover 1 and Cover 2
function Add-Cover-Frame ($anchorPara) {
    $sh = $doc.Shapes.AddShape(1, 0, 0, 100, 100, $anchorPara.Range)
    $sh.RelativeHorizontalPosition = 1 # wdRelativeHorizontalPositionPage
    $sh.RelativeVerticalPosition = 1   # wdRelativeVerticalPositionPage
    $sh.Left = $word.CentimetersToPoints(2.0)
    $sh.Top = $word.CentimetersToPoints(1.5)
    $sh.Width = $word.CentimetersToPoints(17.0)
    $sh.Height = $word.CentimetersToPoints(26.7)
    $sh.Fill.Visible = 0 # No fill
    $sh.Line.Weight = 2.25 # 2.25 pt
    $sh.Line.ForeColor.RGB = 0 # Black
    $sh.WrapFormat.Type = 3 # Behind text
    $sh.ZOrder(1) # Send to back
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
$doc.SaveAs2($savePath, 16) # 16 = wdFormatXMLDocument (.docx)
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Write-Host "SUCCESS! Word document generated: $docxFile"