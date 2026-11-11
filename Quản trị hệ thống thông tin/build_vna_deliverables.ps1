[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rootDir = "c:\Users\legen\OneDrive\Documents\GitHub\tailieuhoctap\Quản trị hệ thống thông tin"
$brainDir = "C:\Users\legen\.gemini\antigravity\brain\71477c02-39f2-4215-b8bd-cb27d572d109"
$mdFile = Join-Path $rootDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.md"

# Copy markdown to workspace artifact dir if exists
if (Test-Path $brainDir) { Copy-Item -Path $mdFile -Destination (Join-Path $brainDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.md") -Force }

$docxFile = Join-Path $rootDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.docx"
$pdfFile  = Join-Path $rootDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.pdf"

Write-Host "Converting Markdown to Word (.docx) and PDF following TalentConnect & Phu luc 05 Standard 100%..."

Stop-Process -Name "WINWORD" -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0

$doc = $word.Documents.Add()

# -------------------------------------------------------------
# 1. CONFIGURE BUILT-IN WORD STYLES (Times New Roman 13pt, 1.3 lines)
# -------------------------------------------------------------
$lineSpacing13 = [single]15.6 # 1.3 lines in Word COM (12pt * 1.3 = 15.6pt)

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

# Heading 1 (Chapters I..VI, PHỤ LỤC, LỜI CẢM ƠN, LỜI CAM ĐOAN, DANH MỤC...)
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

# Heading 2 (1.1., 1.2., 2.1., 2.2., 3.1...)
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

# Heading 3 (1.2.1., 2.2.1., 3.1.1...) - 13pt Italic Regular (NOT Bold), indented 1.0 cm
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
$styleH3.ParagraphFormat.SpaceAfter = 6
$styleH3.ParagraphFormat.LeftIndent = 0
$styleH3.ParagraphFormat.FirstLineIndent = [single]28.35 # 1.0 cm indent
$styleH3.ParagraphFormat.KeepWithNext = $true

# Configure TOC Styles (TOC 1, TOC 2 ONLY - flush left)
for ($i = -20; $i -ge -22; $i--) {
    try {
        $st = $doc.Styles.Item($i)
        $st.Font.Name = "Times New Roman"
        $st.Font.Size = 13
        $st.ParagraphFormat.FirstLineIndent = 0
        $st.ParagraphFormat.LeftIndent = 0
        $st.ParagraphFormat.RightIndent = 0
        $st.ParagraphFormat.LineSpacingRule = 5
        $st.ParagraphFormat.LineSpacing = $lineSpacing13
        $st.ParagraphFormat.SpaceBefore = 2
        $st.ParagraphFormat.SpaceAfter = 3
        if ($i -eq -20) {
            # TOC 1 (Chapters)
            $st.Font.Bold = $true
            $st.Font.Italic = $false
            $st.ParagraphFormat.SpaceBefore = 4
        } elseif ($i -eq -21) {
            # TOC 2 (1.1., 1.2....)
            $st.Font.Bold = $false
            $st.Font.Italic = $false
        }
    } catch {}
}

$selection = $word.Selection

function Set-StandardMargins($section, $wrd) {
    $section.PageSetup.PaperSize = 7 # wdPaperA4
    $section.PageSetup.TopMargin = $wrd.CentimetersToPoints(2.0)
    $section.PageSetup.BottomMargin = $wrd.CentimetersToPoints(2.0)
    $section.PageSetup.LeftMargin = $wrd.CentimetersToPoints(3.5)
    $section.PageSetup.RightMargin = $wrd.CentimetersToPoints(1.5)
    $section.PageSetup.HeaderDistance = $wrd.CentimetersToPoints(1.0)
    $section.PageSetup.FooterDistance = $wrd.CentimetersToPoints(1.0)
}

# -------------------------------------------------------------
# 2. SECTION 1: MẪU BÌA 1 + TRANG BÌA PHỤ
# -------------------------------------------------------------
$sec1 = $doc.Sections.Item(1)
Set-StandardMargins $sec1 $word
$sec1.PageSetup.BottomMargin = $word.CentimetersToPoints(1.6)

$logoPath = Join-Path $rootDir 'assets\diagrams\logo_hoc_vien.png'

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

function Write-Cover-Page {
    param([bool]$isInner)
    
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10
    $selection.ParagraphFormat.Alignment = 1 # Center
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LineSpacingRule = 0 # Single
    $selection.ParagraphFormat.SpaceBefore = 4
    $selection.ParagraphFormat.SpaceAfter = 2
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 13
    $selection.Font.Bold = $false
    $selection.TypeText("HỌC VIỆN CHÍNH TRỊ QUỐC GIA HỒ CHÍ MINH")
    Add-Cover-Frame $selection.Paragraphs.Item(1)
    $selection.TypeParagraph()
    
    $selection.Font.Bold = $true
    $selection.TypeText("HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG")
    $selection.TypeParagraph()
    
    $selection.Font.Bold = $false
    $selection.Font.Size = 12
    $selection.ParagraphFormat.SpaceBefore = 0
    $selection.ParagraphFormat.SpaceAfter = 6
    $selection.TypeText("__________________________________")
    $selection.TypeParagraph()
    
    if (Test-Path $logoPath) {
        $selection.ParagraphFormat.Alignment = 1
        $selection.ParagraphFormat.SpaceBefore = 8
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.TypeParagraph()
        $selection.TypeParagraph()
        $shape = $selection.InlineShapes.AddPicture($logoPath)
        $shape.Width = 265
        $shape.Height = 76
        $selection.TypeParagraph()
        $selection.TypeParagraph()
        $selection.TypeParagraph()
    }
    
    $selection.ParagraphFormat.Alignment = 1
    $selection.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
    $selection.ParagraphFormat.SpaceBefore = 6
    $selection.ParagraphFormat.SpaceAfter = 4
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.TypeText("TÊN ĐỀ TÀI:")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 14
    $selection.ParagraphFormat.SpaceBefore = 4
    $selection.ParagraphFormat.SpaceAfter = 6
    $selection.TypeText("PHÂN TÍCH, ĐÁNH GIÁ VÀ ĐỀ XUẤT GIẢI PHÁP NÂNG CẤP, HOÀN THIỆN HỆ THỐNG THÔNG TIN ĐẶT VÉ VÀ LÀM THỦ TỤC TRỰC TUYẾN CỦA HÃNG HÀNG KHÔNG QUỐC GIA VIỆT NAM (VIETNAM AIRLINES)")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 13
    $selection.Font.Bold = $false
    $selection.ParagraphFormat.SpaceBefore = 0
    $selection.ParagraphFormat.SpaceAfter = 8
    $selection.TypeText("---------------------------------------------------------")
    $selection.TypeParagraph()
    
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.ParagraphFormat.SpaceBefore = 6
    $selection.ParagraphFormat.SpaceAfter = 20
    $selection.TypeText("BÀI TẬP LỚN KẾT THÚC HỌC PHẦN")
    $selection.TypeParagraph()
    
    $selection.ParagraphFormat.Alignment = 0 # Left
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(1.8)
    $selection.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
    $selection.ParagraphFormat.SpaceBefore = 2
    $selection.ParagraphFormat.SpaceAfter = 4
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    
    $selection.ParagraphFormat.LineSpacingRule = 1 # 1.5 lines
    $selection.TypeText("Học phần : Quản trị hệ thống thông tin")
    $selection.TypeParagraph()
    $selection.TypeText("GVHD      : ThS. Lê Hoàng Diệp")
    $selection.TypeParagraph()
    $selection.TypeText("Sinh viên : Lê Quốc Huy – 2305HTTB011")
    $selection.TypeParagraph()
    $selection.TypeText("Lớp          : 2305HTTB")
    $selection.TypeParagraph()
    for ($i = 0; $i -lt 3; $i++) {
        $selection.TypeParagraph()
    }
    
    $selection.ParagraphFormat.FirstLineIndent = 0
    $selection.ParagraphFormat.LeftIndent = 0
    $selection.ParagraphFormat.Alignment = 1 # Center
    $selection.ParagraphFormat.SpaceBefore = 54
    $selection.ParagraphFormat.SpaceAfter = 0
    $selection.Font.Size = 14
    $selection.Font.Bold = $true
    $selection.TypeText("Hà Nội - 2026")
}

# Page 1: Mẫu Bìa 1 (Phụ lục 05)
Write-Cover-Page -isInner $false
$selection.InsertBreak(7) # wdPageBreak

# Page 2: Trang bìa phụ (Phiếu làm phách để rời tại tệp Phieu_Lam_Phach_Roi.pdf theo đúng quy định)
Write-Cover-Page -isInner $true

# BREAK TO SECTION 2 (FRONT MATTER & MAIN REPORT)
$selection.InsertBreak(2) # wdSectionBreakNextPage

# -------------------------------------------------------------
# 3. SECTION 2: FRONT MATTER & MAIN BODY
#    Page numbers in Bottom Footer Centered (Times New Roman 13pt), matching sample document!
# -------------------------------------------------------------
$sec2 = $doc.Sections.Item(2)
$sec2.Borders.Enable = $false
Set-StandardMargins $sec2 $word
$sec2.PageSetup.DifferentFirstPageHeaderFooter = 0

# Unlink and clean all headers & footers in Section 2 and Section 1 FIRST
foreach ($hfIdx in @(1, 2, 3)) {
    $sec2.Headers.Item($hfIdx).LinkToPrevious = $false
    $sec2.Headers.Item($hfIdx).Range.Delete()
    $sec2.Footers.Item($hfIdx).LinkToPrevious = $false
    $sec2.Footers.Item($hfIdx).Range.Delete()
    $sec1.Headers.Item($hfIdx).Range.Delete()
    $sec1.Footers.Item($hfIdx).Range.Delete()
}

# Configure Section 2 page numbering in Bottom Footer Centered (matching sample Bao_Cao_Bai_Tap_Lon_CNPM_TalentConnect.pdf)
$footer2 = $sec2.Footers.Item(1) # wdHeaderFooterPrimary (bottom footer)
$footer2.PageNumbers.NumberStyle = 0 # wdPageNumberStyleArabic (1, 2, 3...)
$footer2.PageNumbers.RestartNumberingAtSection = $false

$fRange = $footer2.Range
$fRange.ParagraphFormat.Alignment = 1 # wdAlignParagraphCenter
$fRange.ParagraphFormat.FirstLineIndent = 0
$fRange.ParagraphFormat.LeftIndent = 0
$fRange.ParagraphFormat.SpaceBefore = 0
$fRange.ParagraphFormat.SpaceAfter = 0
$doc.Fields.Add($fRange, 33) | Out-Null # 33 = wdFieldPage
$footer2.Range.ParagraphFormat.Alignment = 1 # Center
$footer2.Range.Font.Name = "Times New Roman"
$footer2.Range.Font.Size = 13
$footer2.Range.Font.Bold = $false
$footer2.Range.Font.Italic = $false
$footer2.Range.Font.ColorIndex = 1 # wdBlack

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
$nextPageBreak = $false

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
            $sel.ParagraphFormat.PageBreakBefore = 0
            $sel.ParagraphFormat.FirstLineIndent = 0
            $sel.ParagraphFormat.LeftIndent = 0
            $sel.ParagraphFormat.Alignment = 0 # Left
            $sel.ParagraphFormat.LineSpacingRule = 5
            $sel.ParagraphFormat.LineSpacing = $lineSpacing13
            $sel.ParagraphFormat.SpaceBefore = 8
            $sel.ParagraphFormat.SpaceAfter = 4
            $sel.ParagraphFormat.KeepWithNext = $true
            $sel.Font.Name = 'Times New Roman'
            $sel.Font.Size = 13
            $sel.Font.Bold = $true
            $sel.Font.Italic = $false
            $sel.TypeText($capText)
            $sel.TypeParagraph()
        }
        
        $sel.ParagraphFormat.PageBreakBefore = 0
        $range = $sel.Range
        $table = $document.Tables.Add($range, $rowCount, $maxCols)
        $table.Borders.Enable = $true
        $table.Borders.InsideLineStyle = 1
        $table.Borders.OutsideLineStyle = 1
        $table.Rows.Alignment = 1 # Center table on page
        $table.Rows.AllowBreakAcrossPages = $true
        $table.TopPadding = [single]3.5
        $table.BottomPadding = [single]3.5
        $table.LeftPadding = [single]4.0
        $table.RightPadding = [single]4.0
        
        $isAbbrTable = ($maxCols -eq 3 -and $parsedData.Count -gt 0 -and $parsedData[0][1] -match '(Từ|Chữ) viết tắt')
        $isDictTable = ($maxCols -eq 5 -and $parsedData.Count -gt 0 -and $parsedData[0][0] -match '(Tên cột dữ liệu|Trường dữ liệu)')
        $tblFontSize = if ($isAbbrTable) { [single]13.0 } elseif ($isDictTable) { [single]12.0 } elseif ($maxCols -le 6) { [single]12.5 } else { [single]12.0 }
        
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
                        } elseif ($isDictTable) {
                            if ($j -in @(2, 3)) {
                                $cell.Range.ParagraphFormat.Alignment = 1
                            } else {
                                $cell.Range.ParagraphFormat.Alignment = 0
                            }
                        } else {
                            $isCenteredCell = ($j -eq 0 -and $maxCols -gt 3 -and $cText.Length -lt 18) -or ($cText -match '^\d+([,\.]\d+)?(\s*/\s*5,0|\s*%|\s*\([\d,]+%\))?$') -or ($cText -match '^(Tốt|Rất tốt|Khá|Khá - Tốt|Cần cải thiện)$')
                            if ($isCenteredCell) {
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
        $table.Range.ParagraphFormat.LineSpacing = [single]14.0
        $table.Range.ParagraphFormat.SpaceBefore = 2
        $table.Range.ParagraphFormat.SpaceAfter = 2
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
        } elseif ($maxCols -eq 2 -and $parsedData[0][0] -match 'Thuộc tính ca sử dụng') {
            $table.Columns.Item(1).Width = 115
            $table.Columns.Item(2).Width = 338
        } elseif ($isDictTable) {
            $table.LeftPadding = [single]3.5
            $table.RightPadding = [single]3.5
            $table.Columns.Item(1).Width = 102
            $table.Columns.Item(2).Width = 96
            $table.Columns.Item(3).Width = 60
            $table.Columns.Item(4).Width = 56
            $table.Columns.Item(5).Width = 139
        } elseif ($maxCols -eq 6 -and $parsedData[0][0] -match 'Mã rủi ro') {
            $table.LeftPadding = [single]3.5
            $table.RightPadding = [single]3.5
            $table.Columns.Item(1).Width = 42
            $table.Columns.Item(2).Width = 86
            $table.Columns.Item(3).Width = 72
            $table.Columns.Item(4).Width = 48
            $table.Columns.Item(5).Width = 52
            $table.Columns.Item(6).Width = 153
        } elseif ($maxCols -eq 6 -and $parsedData[0][0] -match 'Mã nghiệp vụ') {
            $table.LeftPadding = [single]3.5
            $table.RightPadding = [single]3.5
            $table.Columns.Item(1).Width = 46
            $table.Columns.Item(2).Width = 95
            $table.Columns.Item(3).Width = 58
            $table.Columns.Item(4).Width = 58
            $table.Columns.Item(5).Width = 98
            $table.Columns.Item(6).Width = 98
        } elseif ($maxCols -eq 6 -and $parsedData[0][0] -match 'Mã tiêu chí') {
            $table.LeftPadding = [single]3.5
            $table.RightPadding = [single]3.5
            $table.Columns.Item(1).Width = 46
            $table.Columns.Item(2).Width = 68
            $table.Columns.Item(3).Width = 147
            $table.Columns.Item(4).Width = 58
            $table.Columns.Item(5).Width = 64
            $table.Columns.Item(6).Width = 70
        } elseif ($maxCols -eq 6 -and $parsedData[0][0] -match 'Chức năng nghiệp vụ') {
            $table.LeftPadding = [single]3.5
            $table.RightPadding = [single]3.5
            $table.Columns.Item(1).Width = 103
            $table.Columns.Item(2).Width = 68
            $table.Columns.Item(3).Width = 70
            $table.Columns.Item(4).Width = 70
            $table.Columns.Item(5).Width = 72
            $table.Columns.Item(6).Width = 70
        } elseif ($maxCols -eq 8 -and $parsedData[0][0] -match 'Mã (tiêu chí|chỉ tiêu)') {
            $table.LeftPadding = [single]2.5
            $table.RightPadding = [single]2.5
            $table.Columns.Item(1).Width = 42
            $table.Columns.Item(2).Width = 151
            $table.Columns.Item(3).Width = 44
            $table.Columns.Item(4).Width = 44
            $table.Columns.Item(5).Width = 44
            $table.Columns.Item(6).Width = 44
            $table.Columns.Item(7).Width = 44
            $table.Columns.Item(8).Width = 40
        } elseif ($maxCols -eq 10 -and $parsedData[0][0] -match 'Mã phiếu') {
            $table.TopPadding = [single]2.5
            $table.BottomPadding = [single]2.5
            $table.LeftPadding = [single]2.5
            $table.RightPadding = [single]2.5
            $table.Range.ParagraphFormat.LineSpacing = [single]14.0
            $table.Range.ParagraphFormat.SpaceBefore = 2
            $table.Range.ParagraphFormat.SpaceAfter = 2
            $table.Columns.Item(1).Width = 40
            $table.Columns.Item(2).Width = 85
            $table.Columns.Item(3).Width = 25
            $table.Columns.Item(4).Width = 25
            $table.Columns.Item(5).Width = 25
            $table.Columns.Item(6).Width = 25
            $table.Columns.Item(7).Width = 25
            $table.Columns.Item(8).Width = 25
            $table.Columns.Item(9).Width = 38
            $table.Columns.Item(10).Width = 140
        } elseif ($maxCols -eq 4 -and $parsedData[0][0] -match 'Giai đoạn triển khai') {
            $table.Columns.Item(1).Width = 95
            $table.Columns.Item(2).Width = 68
            $table.Columns.Item(3).Width = 148
            $table.Columns.Item(4).Width = 142
        } elseif ($maxCols -eq 5 -and $parsedData[0][0] -match 'Nhóm thành phần HTTT') {
            $table.Columns.Item(1).Width = 88
            $table.Columns.Item(2).Width = 64
            $table.Columns.Item(3).Width = 64
            $table.Columns.Item(4).Width = 62
            $table.Columns.Item(5).Width = 175
        } elseif ($maxCols -eq 5 -and $parsedData[0][1] -match 'Đặc tính thông tin') {
            $table.Columns.Item(1).Width = 36
            $table.Columns.Item(2).Width = 76
            $table.Columns.Item(3).Width = 142
            $table.Columns.Item(4).Width = 139
            $table.Columns.Item(5).Width = 60
        } elseif ($maxCols -eq 5 -and $parsedData[0][1] -match '(Luồng dữ liệu|Tên tác nhân|Tên ca sử dụng)') {
            $table.Columns.Item(1).Width = 42
            $table.Columns.Item(2).Width = 86
            $table.Columns.Item(3).Width = 76
            $table.Columns.Item(4).Width = 109
            $table.Columns.Item(5).Width = 140
        } elseif ($maxCols -eq 4 -and $parsedData[0][1] -match '(Thành phần hệ thống|Tên màn hình)') {
            $table.Columns.Item(1).Width = 36
            $table.Columns.Item(2).Width = 92
            $table.Columns.Item(3).Width = 160
            $table.Columns.Item(4).Width = 165
        } elseif ($maxCols -eq 4 -and $parsedData[0][0] -match 'Nhóm phân loại') {
            $table.Columns.Item(1).Width = 76
            $table.Columns.Item(2).Width = 92
            $table.Columns.Item(3).Width = 105
            $table.Columns.Item(4).Width = 180
        }
        
        $sel.SetRange($table.Range.End, $table.Range.End)
        $sel.ParagraphFormat.KeepWithNext = $false
        $sel.ParagraphFormat.PageBreakBefore = 0
        $sel.ParagraphFormat.SpaceBefore = 2
        $sel.ParagraphFormat.SpaceAfter = 6
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
            $nextPageBreak = $true
        } else {
            continue
        }
    }
    
    # Handle Page Break Tag using PageBreakBefore on the next paragraph (NEVER creates a blank page!)
    if ($tLine -match '<div style="page-break-after:\s*always;"></div>') {
        if ($inTable) { Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix; $inTable = $false; $tableRows.Clear() }
        $nextPageBreak = $true
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
            $selection.ParagraphFormat.PageBreakBefore = 0
            $selection.ParagraphFormat.Alignment = 1 # Center image
            $selection.ParagraphFormat.FirstLineIndent = 0
            $selection.ParagraphFormat.LeftIndent = 0
            $selection.ParagraphFormat.LineSpacingRule = 0
            $selection.ParagraphFormat.SpaceBefore = 6
            $selection.ParagraphFormat.SpaceAfter = 2
            $selection.ParagraphFormat.KeepWithNext = $true
            
            $shape = $selection.InlineShapes.AddPicture($fullImgPath)
            $shape.LockAspectRatio = -1
            $shape.Width = 450
            if ($shape.Height -gt 620) {
                $shape.Height = 620
            }
            $selection.TypeParagraph()
            
            if ($caption -ne '') {
                # Match sample document: Centered, Italic, NOT Bold, 13pt Times New Roman
                $selection.Font.Name = 'Times New Roman'
                $selection.Font.Size = 13
                $selection.Font.Bold = $false
                $selection.Font.Italic = $true
                $selection.ParagraphFormat.Alignment = 1 # Center
                $selection.ParagraphFormat.FirstLineIndent = 0
                $selection.ParagraphFormat.LeftIndent = 0
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
        $selection.ParagraphFormat.PageBreakBefore = 0
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 0
        $selection.ParagraphFormat.LineSpacingRule = 5
        $selection.ParagraphFormat.LineSpacing = $lineSpacing13
        $selection.ParagraphFormat.SpaceBefore = 6
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
    # HANDLE TOC IN MARKDOWN (WORD NATIVE TOC, LEVELS 1-2 ONLY)
    # ---------------------------------------------------------
    if ($tLine -eq 'Mục lục') {
        $inTOCArea = $true
        
        $selection.Style = $doc.Styles.Item("Normal")
        $selection.ParagraphFormat.OutlineLevel = 10
        $selection.ParagraphFormat.PageBreakBefore = -1 # Always start MỤC LỤC on a new page without blank pages
        $nextPageBreak = $false
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 12
        $selection.ParagraphFormat.SpaceAfter = 12
        $selection.TypeText("MỤC LỤC")
        $selection.TypeParagraph()
        $selection.ParagraphFormat.PageBreakBefore = 0
        
        $tocRange = $selection.Range
        $toc = $doc.TablesOfContents.Add($tocRange, $true, 1, 2, $null, $null, $true, $true, $null, $true, $true, $true)
        $selection.SetRange($toc.Range.End, $toc.Range.End)
        continue
    }
    
    # ---------------------------------------------------------
    # DANH MỤC TỪ/ THUẬT NGỮ VIẾT TẮT / LỜI CẢM ƠN / LỜI CAM ĐOAN / PHỤ LỤC
    # ---------------------------------------------------------
    if ($tLine -cmatch '^DANH MỤC\s+.*VIẾT TẮT' -or $tLine -ceq 'LỜI CẢM ƠN' -or $tLine -ceq 'LỜI CAM ĐOAN' -or $tLine -ceq 'PHỤ LỤC') {
        if ($tLine -ceq 'PHỤ LỤC') {
            $inAppendix = $true
        }
        $selection.Style = $doc.Styles.Item("Heading 1")
        $selection.ParagraphFormat.OutlineLevel = 1
        if ($tLine -ceq 'LỜI CẢM ƠN') {
            $selection.ParagraphFormat.PageBreakBefore = 0
        } else {
            $selection.ParagraphFormat.PageBreakBefore = -1
        }
        $nextPageBreak = $false
        $selection.Font.Name = "Times New Roman"
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 18
        $selection.ParagraphFormat.SpaceAfter = 12
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        $selection.ParagraphFormat.PageBreakBefore = 0
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 1: Chapters I..VI (Single-line centered bold 14pt matching sample document)
    # ---------------------------------------------------------
    if ($tLine -cmatch '^(I|II|III|IV|V|VI)\.\s+(.+)$') {
        $selection.Style = $doc.Styles.Item("Heading 1")
        $selection.ParagraphFormat.OutlineLevel = 1
        $selection.ParagraphFormat.PageBreakBefore = -1 # Start every chapter at top of a new page with ZERO blank pages
        $nextPageBreak = $false
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 14
        $selection.Font.Bold = $true
        $selection.Font.Italic = $false
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.Alignment = 1 # Center
        $selection.ParagraphFormat.SpaceBefore = 18
        $selection.ParagraphFormat.SpaceAfter = 12
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        $selection.ParagraphFormat.PageBreakBefore = 0
        continue
    }
    
    # ---------------------------------------------------------
    # HEADING 2: Level 2 sections (1.1., 1.2., 2.1., 3.1., 4.1., 5.1., 7.1., 7.2.)
    # ---------------------------------------------------------
    if ($tLine -match '^\d+\.\d+\.\s+') {
        $selection.Style = $doc.Styles.Item("Heading 2")
        $selection.ParagraphFormat.OutlineLevel = 2
        $selection.ParagraphFormat.PageBreakBefore = 0
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
    # HEADING 3: Level 3 sections (1.2.1., 2.2.1., 3.1.1...) - Italic, NOT Bold, indented 1.0 cm, NOT in TOC
    # ---------------------------------------------------------
    if ($tLine -match '^\d+\.\d+\.\d+\.\s+') {
        $selection.Style = $doc.Styles.Item("Heading 3")
        $selection.ParagraphFormat.OutlineLevel = 10 # Body text outline level so it never enters TOC
        $selection.ParagraphFormat.PageBreakBefore = 0
        $selection.Font.Name = 'Times New Roman'
        $selection.Font.Size = 13
        $selection.Font.Bold = $false
        $selection.Font.Italic = $true
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.FirstLineIndent = [single]28.35 # 1.0 cm indent
        $selection.ParagraphFormat.Alignment = 0 # Left
        $selection.ParagraphFormat.SpaceBefore = 8
        $selection.ParagraphFormat.SpaceAfter = 6
        $selection.ParagraphFormat.KeepWithNext = $true
        $selection.TypeText($tLine)
        $selection.TypeParagraph()
        continue
    }
    
    # ---------------------------------------------------------
    # NORMAL BODY PARAGRAPH (Times New Roman 13pt, SpaceBefore = 6pt, SpaceAfter = 6pt)
    # ---------------------------------------------------------
    $workLine = $tLine -replace '`', ''
    
    $selection.Style = $doc.Styles.Item("Normal")
    $selection.ParagraphFormat.OutlineLevel = 10
    if ($nextPageBreak) {
        $selection.ParagraphFormat.PageBreakBefore = -1
        $nextPageBreak = $false
    } else {
        $selection.ParagraphFormat.PageBreakBefore = 0
    }
    $selection.Font.Name = 'Times New Roman'
    $selection.Font.Size = 13
    $selection.Font.ColorIndex = 1
    $selection.ParagraphFormat.Alignment = 3 # Justify
    $selection.ParagraphFormat.LineSpacingRule = 5 # Multiple
    $selection.ParagraphFormat.LineSpacing = $lineSpacing13
    $selection.ParagraphFormat.SpaceBefore = 6
    $selection.ParagraphFormat.SpaceAfter = 6
    
    $isClosingSalutation = $workLine -match '^(Chúng em|Nhóm chúng em|Em|Tôi|Xin)\s+.*!$'
    $isShortSubHeader = ($workLine -match '^[a-zA-Z]\.\s+[^:]{2,150}:$' -and $workLine.Length -lt 160)
    $isRefItem = ($workLine -match '^(\[\d+\]|\d+\.)\s+')
    
    if ($isClosingSalutation) {
        $selection.ParagraphFormat.FirstLineIndent = 0
        $selection.ParagraphFormat.LeftIndent = 0
        $selection.ParagraphFormat.Alignment = 2 # Right
        $selection.ParagraphFormat.SpaceBefore = 12
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
        $selection.ParagraphFormat.SpaceAfter = 6
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
    $selection.ParagraphFormat.PageBreakBefore = 0
}

if ($inTable) {
    Flush-Table $tableRows $selection $word $doc ([ref]$pendingTableCaption) $inAppendix
}

# -------------------------------------------------------------
# 5. APPEND FINAL PAGE: PHIẾU CHẤM ĐIỂM HÌNH THỨC THI BÀI TẬP LỚN/TIỂU LUẬN (Phụ lục 05 Page 5)
# -------------------------------------------------------------
$selection.Style = $doc.Styles.Item("Normal")
$selection.ParagraphFormat.OutlineLevel = 10
$selection.ParagraphFormat.PageBreakBefore = -1 # Start on new page without risking a blank page
$selection.Font.Name = "Times New Roman"
$selection.Font.Size = 14
$selection.Font.Bold = $true
$selection.Font.Italic = $false
$selection.ParagraphFormat.FirstLineIndent = 0
$selection.ParagraphFormat.Alignment = 1 # Center
$selection.ParagraphFormat.SpaceBefore = 12
$selection.ParagraphFormat.SpaceAfter = 14
$selection.TypeText("PHIẾU CHẤM ĐIỂM HÌNH THỨC THI BÀI TẬP LỚN/TIỂU LUẬN")
$selection.TypeParagraph()
$selection.ParagraphFormat.PageBreakBefore = 0

$gradeRange = $selection.Range
$gradeTbl = $doc.Tables.Add($gradeRange, 3, 5)
$gradeTbl.Borders.Enable = $true
$gradeTbl.Borders.InsideLineStyle = 1
$gradeTbl.Borders.OutsideLineStyle = 1
$gradeTbl.Rows.Alignment = 1 # Center

# Column widths matching Page 5 of Phụ lục 05 (total = 453 pt)
$gradeTbl.Columns.Item(1).Width = 110
$gradeTbl.Columns.Item(2).Width = 110
$gradeTbl.Columns.Item(3).Width = 65
$gradeTbl.Columns.Item(4).Width = 90
$gradeTbl.Columns.Item(5).Width = 78

# Set tall blank scoring row height (Row 3) BEFORE vertical cell merging
$gradeTbl.Rows.Item(3).HeightRule = 1 # wdRowHeightAtLeast
$gradeTbl.Rows.Item(3).Height = 260

# Populate headers before merging
$gradeTbl.Cell(2, 1).Range.Text = "CB chấm thi số 1"
$gradeTbl.Cell(2, 2).Range.Text = "CB chấm thi số 2"
$gradeTbl.Cell(2, 3).Range.Text = "Bằng số"
$gradeTbl.Cell(2, 4).Range.Text = "Bằng chữ"

# Merge Row 1 Col 1..2, Row 1 Col 3..4, and vertically Col 5 Row 1..2
$gradeTbl.Cell(1, 1).Merge($gradeTbl.Cell(1, 2))
$gradeTbl.Cell(1, 2).Merge($gradeTbl.Cell(1, 3))
$gradeTbl.Cell(1, 3).Merge($gradeTbl.Cell(2, 5))

$gradeTbl.Cell(1, 1).Range.Text = "Điểm, Chữ kí (Ghi rõ họ tên) của cán bộ chấm thi"
$gradeTbl.Cell(1, 2).Range.Text = "Điểm thống nhất của bài thi"
$gradeTbl.Cell(1, 3).Range.Text = "Chữ kí xác nhận của cán bộ nhận bài thi"

$gradeTbl.Range.Font.Name = "Times New Roman"
$gradeTbl.Range.Font.Size = 13
$gradeTbl.Range.Font.Bold = $true
$gradeTbl.Range.ParagraphFormat.Alignment = 1 # Center
$gradeTbl.Range.ParagraphFormat.FirstLineIndent = 0
$gradeTbl.Range.ParagraphFormat.SpaceBefore = 4
$gradeTbl.Range.ParagraphFormat.SpaceAfter = 4

$selection.SetRange($gradeTbl.Range.End, $gradeTbl.Range.End)
$selection.TypeParagraph()
$selection.Style = $doc.Styles.Item("Normal")
$selection.ParagraphFormat.OutlineLevel = 10
$selection.ParagraphFormat.Alignment = 1 # Center
$selection.ParagraphFormat.FirstLineIndent = 0
$selection.ParagraphFormat.SpaceBefore = 10
$selection.Font.Name = "Times New Roman"
$selection.Font.Size = 12
$selection.Font.Bold = $false
$selection.Font.Italic = $true
$selection.TypeText("Trang này sinh viên đóng vào cuối tiểu luận/bài tập lớn (đặt giữa trang cuối và bìa sau)")
$selection.TypeParagraph()

# -------------------------------------------------------------
# 6. UPDATE TABLE OF CONTENTS
# -------------------------------------------------------------
Write-Host "Updating Table of Contents dynamically..."
function Format-TOC-Range($tObj, $dObj) {
    for ($i = -20; $i -ge -22; $i--) {
        try {
            $st = $dObj.Styles.Item($i)
            $st.Font.Name = "Times New Roman"
            $st.Font.Size = 12
            $st.ParagraphFormat.FirstLineIndent = 0
            $st.ParagraphFormat.LeftIndent = 0
            $st.ParagraphFormat.RightIndent = 0
            $st.ParagraphFormat.LineSpacingRule = 5
            $st.ParagraphFormat.LineSpacing = [single]13.2
            $st.ParagraphFormat.SpaceBefore = 0
            $st.ParagraphFormat.SpaceAfter = 1.5
            if ($i -eq -20) {
                $st.Font.Bold = $true
                $st.Font.Italic = $false
                $st.ParagraphFormat.SpaceBefore = 2
            } else {
                $st.Font.Bold = $false
                $st.Font.Italic = $false
            }
        } catch {}
    }
    $tObj.Range.Font.Name = "Times New Roman"
    $tObj.Range.Font.Size = 12
    $tObj.Range.ParagraphFormat.FirstLineIndent = 0
    $tObj.Range.ParagraphFormat.LeftIndent = 0
    $tObj.Range.ParagraphFormat.RightIndent = 0
    $tObj.Range.ParagraphFormat.LineSpacingRule = 5
    $tObj.Range.ParagraphFormat.LineSpacing = [single]13.2
    foreach ($p in $tObj.Range.Paragraphs) {
        $pText = $p.Range.Text.Trim()
        if ($pText -match '^\d+\.\d+\.') {
            $p.Range.Font.Bold = $false
            $p.Range.Font.Italic = $false
        } elseif ($pText.Length -gt 0) {
            $p.Range.Font.Bold = $true
            $p.Range.Font.Italic = $false
        }
    }
}

if ($doc.TablesOfContents.Count -gt 0) {
    $tocObj = $doc.TablesOfContents.Item(1)
    $tocObj.UpperHeadingLevel = 1
    $tocObj.LowerHeadingLevel = 2
    $tocObj.Update()
    Format-TOC-Range $tocObj $doc
    $doc.Repaginate()
    $tocObj.UpdatePageNumbers()
    Format-TOC-Range $tocObj $doc
}

# -------------------------------------------------------------
# 7. SAVE DOCX & EXPORT PDF
# -------------------------------------------------------------
$doc.SaveAs2([string]$docxFile, 16)
$doc.ExportAsFixedFormat([string]$pdfFile, 17) # 17 = wdExportFormatPDF
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

# Copy PDF to brain artifact dir as well
if (Test-Path $brainDir) { Copy-Item -Path $pdfFile -Destination (Join-Path $brainDir "Bai_Tap_Lon_Quan_Tri_HTTT_VNA.pdf") -Force }

Write-Host "SUCCESS! Word and PDF documents generated: $docxFile and $pdfFile"
