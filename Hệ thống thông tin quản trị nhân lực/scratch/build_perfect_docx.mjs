import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  Footer,
  PageNumber,
  ImageRun,
} from 'docx';

// Helper: parse PNG dimensions from IHDR chunk
function getPngDimensions(buf) {
  if (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  }
  return { width: 600, height: 400 };
}

// Helper: Parse inline markdown formatting (**bold**, *italic*, `code`) into docx TextRuns
function parseInlineFormatting(text, overrides = {}) {
  const runs = [];
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
  const regex = /(\*\*.*?\*\*|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      runs.push(
        new TextRun({
          text: inner,
          font: 'Times New Roman',
          size: overrides.size || 26,
          bold: true,
          color: overrides.color || '000000',
          ...overrides,
        })
      );
    } else if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      const inner = part.slice(1, -1);
      runs.push(
        new TextRun({
          text: inner,
          font: 'Times New Roman',
          size: overrides.size || 26,
          italics: true,
          color: overrides.color || '000000',
          ...overrides,
        })
      );
    } else if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      runs.push(
        new TextRun({
          text: inner,
          font: 'Consolas',
          size: overrides.size ? overrides.size - 2 : 22,
          color: '000000',
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: part,
          font: 'Times New Roman',
          size: overrides.size || 26,
          bold: overrides.bold || false,
          italics: overrides.italics || false,
          color: overrides.color || '000000',
        })
      );
    }
  }

  return runs;
}

export async function convertMarkdownToDocx(mdPath, docxPath) {
  const mdContent = fs.readFileSync(mdPath, 'utf-8');
  const lines = mdContent.split('\n');
  const baseDir = path.dirname(mdPath);

  const children = [];

  let inCodeBlock = false;
  let codeBuffer = [];
  let codeLang = '';

  let inTable = false;
  let tableLines = [];

  const flushTable = () => {
    if (tableLines.length === 0) return;

    const rows = [];
    let isHeader = true;

    for (const tLine of tableLines) {
      if (tLine.replace(/\|/g, '').replace(/-/g, '').replace(/:/g, '').trim() === '') {
        continue;
      }

      const rawCells = tLine.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (rawCells.length === 0) continue;

      const cells = rawCells.map((cellText) => {
        const trimmedCell = cellText.trim();
        const runs = parseInlineFormatting(trimmedCell, {
          size: 22,
          bold: isHeader,
        });

        return new TableCell({
          children: [
            new Paragraph({
              children: runs,
              alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
              spacing: { before: 60, after: 60 },
            }),
          ],
          shading: isHeader ? { fill: 'F2F2F2' } : undefined,
          margins: { top: 100, bottom: 100, left: 140, right: 140 },
        });
      });

      rows.push(
        new TableRow({
          children: cells,
          tableHeader: isHeader,
        })
      );

      if (isHeader) isHeader = false;
    }

    if (rows.length > 0) {
      children.push(
        new Table({
          rows: rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' },
          },
        })
      );
      children.push(new Paragraph({ spacing: { after: 120 } }));
    }

    tableLines = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 0. Handle Markdown Images: ![alt](path)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      if (inTable) flushTable();

      const altText = imgMatch[1];
      let imgRelPath = imgMatch[2];
      const imgFullPath = path.resolve(baseDir, imgRelPath);

      if (fs.existsSync(imgFullPath)) {
        const imgBuffer = fs.readFileSync(imgFullPath);
        const { width: origWidth, height: origHeight } = getPngDimensions(imgBuffer);

        // Standard A4 printable area width is ~560pt. Max width ~540px.
        const MAX_WIDTH = 540;
        const MAX_HEIGHT = 800; // Allow tall vertical diagrams to expand nicely

        let targetWidth = origWidth;
        let targetHeight = origHeight;

        if (targetWidth > MAX_WIDTH) {
          const ratio = MAX_WIDTH / targetWidth;
          targetWidth = MAX_WIDTH;
          targetHeight = Math.round(targetHeight * ratio);
        }

        if (targetHeight > MAX_HEIGHT) {
          const ratio = MAX_HEIGHT / targetHeight;
          targetHeight = MAX_HEIGHT;
          targetWidth = Math.round(targetWidth * ratio);
        }

        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imgBuffer,
                transformation: {
                  width: targetWidth,
                  height: targetHeight,
                },
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 140, after: 60 },
          })
        );

        if (altText) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: altText,
                  font: 'Times New Roman',
                  size: 22, // 11pt
                  italics: true,
                  bold: true,
                  color: '000000',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 140 },
            })
          );
        }

        // Check if next lines are duplicate caption lines (e.g. *Hình X.X...* or **Hình X.X...**)
        let nextIdx = i + 1;
        while (nextIdx < lines.length && !lines[nextIdx].trim()) {
          nextIdx++;
        }
        if (nextIdx < lines.length) {
          const nextTrimmed = lines[nextIdx].trim();
          if (
            (nextTrimmed.startsWith('*Hình ') || nextTrimmed.startsWith('_Hình ') || nextTrimmed.startsWith('**Hình ')) &&
            !nextTrimmed.includes('.') // Only skip short caption lines that match figure title
          ) {
            i = nextIdx; // Skip duplicate caption line
          } else if (
            nextTrimmed.replace(/[*_]/g, '').trim() === altText.replace(/[*_]/g, '').trim()
          ) {
            i = nextIdx; // Skip identical caption line
          }
        }
      }
      continue;
    }

    // 1. Handle Code Blocks
    if (trimmed.startsWith('```')) {
      if (inTable) flushTable();

      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLang = trimmed.replace('```', '').trim().toLowerCase();
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        // Suppress diagram code blocks from outputting into document
        if (codeLang === 'mermaid' || codeLang === 'plantuml') {
          continue;
        }

        const fullCode = codeBuffer.join('\n');
        const codeParagraphs = [
          new Paragraph({
            children: [
              new TextRun({
                text: '[MÃ NGUỒN / CẤU HÌNH]',
                font: 'Times New Roman',
                size: 20,
                bold: true,
                color: '000000',
              }),
            ],
            spacing: { before: 40, after: 60 },
          }),
        ];

        const codeLines = fullCode.split('\n');
        for (const cl of codeLines) {
          codeParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cl || ' ',
                  font: 'Consolas',
                  size: 18, // 9pt
                  color: '000000',
                }),
              ],
              spacing: { line: 220, before: 0, after: 0 },
            })
          );
        }

        children.push(
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: codeParagraphs,
                    shading: { fill: 'FAFAFA' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
                    },
                    margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  }),
                ],
              }),
            ],
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        children.push(new Paragraph({ spacing: { after: 140 } }));
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // 2. Handle Markdown Tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableLines.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // 3. Skip Horizontal Rules (---)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      children.push(new Paragraph({ spacing: { before: 60, after: 60 } }));
      continue;
    }

    // 4. Skip empty lines
    if (!trimmed) {
      continue;
    }

    // 5. Handle Headings
    if (trimmed.startsWith('# ')) {
      const headingText = trimmed.replace(/^#\s+/, '');
      const isMajorPart = headingText.includes('CHƯƠNG') || headingText.includes('PHẦN') || headingText.includes('TÊN ĐỀ TÀI') || headingText.includes('BÁO CÁO') || headingText.includes('LỜI CẢM ƠN') || headingText.includes('MỤC LỤC') || headingText.includes('DANH MỤC');

      children.push(
        new Paragraph({
          children: parseInlineFormatting(headingText, {
            size: 30, // 15pt
            bold: true,
            color: '000000',
          }),
          alignment: isMajorPart ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 240, after: 120, line: 312 },
          pageBreakBefore: isMajorPart,
        })
      );
    } else if (trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^##\s+/, '');
      children.push(
        new Paragraph({
          children: parseInlineFormatting(headingText, {
            size: 28, // 14pt
            bold: true,
            color: '000000',
          }),
          alignment: AlignmentType.LEFT,
          spacing: { before: 200, after: 80, line: 312 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^###\s+/, '');
      children.push(
        new Paragraph({
          children: parseInlineFormatting(headingText, {
            size: 26, // 13pt
            bold: true,
            color: '000000',
          }),
          alignment: AlignmentType.LEFT,
          spacing: { before: 160, after: 60, line: 312 },
        })
      );
    } else if (trimmed.startsWith('#### ')) {
      const headingText = trimmed.replace(/^####\s+/, '');
      children.push(
        new Paragraph({
          children: parseInlineFormatting(headingText, {
            size: 26, // 13pt
            bold: true,
            italics: true,
            color: '000000',
          }),
          alignment: AlignmentType.LEFT,
          spacing: { before: 120, after: 40, line: 312 },
        })
      );
    }
    // 6. Handle Bullet Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listText = trimmed.replace(/^[-*]\s+/, '');
      children.push(
        new Paragraph({
          children: parseInlineFormatting(listText, { size: 26 }),
          bullet: { level: 0 },
          spacing: { before: 20, after: 40, line: 312 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
    // 7. Handle Blockquotes (>)
    else if (trimmed.startsWith('> ')) {
      const quoteText = trimmed.replace(/^>\s+/, '');
      children.push(
        new Paragraph({
          children: parseInlineFormatting(quoteText, { size: 24, italics: true }),
          spacing: { before: 80, after: 80, line: 312 },
          indent: { left: 400 },
          alignment: AlignmentType.JUSTIFIED,
        })
      );
    }
    // 8. Handle Captions / Notes
    else if (trimmed.startsWith('**Bảng ') || trimmed.startsWith('_Ghi chú')) {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(trimmed, {
            size: 24,
            italics: true,
            color: '000000',
          }),
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 80, after: 100, line: 312 },
        })
      );
    }
    // 9. Normal Paragraphs
    else {
      children.push(
        new Paragraph({
          children: parseInlineFormatting(trimmed, { size: 26, color: '000000' }),
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 567 }, // 1.0 cm first line indent
          spacing: { before: 0, after: 80, line: 312 }, // 1.3 line spacing
        })
      );
    }
  }

  if (inTable) flushTable();

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 26,
            color: '000000',
          },
          paragraph: {
            spacing: { line: 312, after: 80 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // 210mm
              height: 16838, // 297mm
            },
            margin: {
              top: 1134, // 2.0 cm
              bottom: 1134, // 2.0 cm
              left: 1701, // 3.0 cm (Đóng gáy)
              right: 1134, // 2.0 cm
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Times New Roman',
                    size: 22,
                    color: '000000',
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100 },
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(docxPath, buffer);
  console.log(`Successfully generated DOCX: ${docxPath}`);
}

async function main() {
  const pttkMd = path.resolve('doc/PTTK_OOP_HR.md');
  const pttkDocx = path.resolve('doc/PTTK_OOP_HR.docx');
  await convertMarkdownToDocx(pttkMd, pttkDocx);
}

main().catch(console.error);
