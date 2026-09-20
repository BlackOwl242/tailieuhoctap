const AdmZip = require('adm-zip');

const path = require('path');

const docxPath = path.join(__dirname, '..', 'doc', 'PTTK_OOP_HR.docx');
const zip = new AdmZip(docxPath);
const xml = zip.readAsText('word/document.xml');
const rels = zip.readAsText('word/_rels/document.xml.rels');

console.log('=== VERIFY ALL FIGURES 2.100 TO 2.118 ===');

for (let n = 100; n <= 118; n++) {
  const figNum = '2.' + n;
  const figId = '2_' + n;

  // 1. Check in TOC
  const tocReg = new RegExp(`<w:hyperlink w:anchor="_Toc_fig_${figId}"[^>]*>[\\s\\S]*?<w:t>([^<]+)<\\/w:t>[\\s\\S]*?<w:t>([0-9]+)<\\/w:t>[\\s\\S]*?<\\/w:hyperlink>`);
  const tocMatch = xml.match(tocReg);
  const tocStr = tocMatch ? `${tocMatch[1]} (Page ${tocMatch[2]})` : 'MISSING IN TOC';

  // 2. Check in Body (bookmark and caption)
  const bmNeedle = `w:name="_Toc_fig_${figId}"`;
  const hasBm = xml.lastIndexOf(bmNeedle) !== -1;

  // Caption text
  const capReg = new RegExp(`Hình ${figNum}: [^<]+`);
  const capMatch = xml.match(capReg);
  const capStr = capMatch ? capMatch[0] : (n <= 103 ? 'N/A' : 'MISSING CAPTION');

  console.log(`[Fig ${figNum}] TOC: ${tocStr}`);
  console.log(`         Body Bookmark: ${hasBm ? 'OK' : 'FAIL'}, Caption: ${capStr}`);
}

const errs = xml.match(/Error![^<]*/g);
console.log('\nBroken bookmarks in entire Word doc:', errs ? errs : '0 errors (PASS)');
