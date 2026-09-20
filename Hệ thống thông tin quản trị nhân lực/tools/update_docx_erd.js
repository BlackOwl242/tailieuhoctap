const AdmZip = require('adm-zip');
const fs = require('fs');

const docxPath = 'doc/PTTK_OOP_HR.docx';
const imgPath = 'doc/images/hinh_2_21_erd_database.png';

console.log('Reading docx...');
const zip = new AdmZip(docxPath);

// 1. Replace image130.png
console.log('Updating word/media/image130.png...');
const newImgBuf = fs.readFileSync(imgPath);
const imgW = newImgBuf.readUInt32BE(16);
const imgH = newImgBuf.readUInt32BE(20);
console.log(`Image dimensions: ${imgW} x ${imgH}`);
zip.updateFile('word/media/image130.png', newImgBuf);

// 2. Update extent in word/document.xml
console.log('Updating drawing extent in word/document.xml...');
let docXml = zip.readAsText('word/document.xml');

// Scale to fit nicely on single A4 portrait page
// Max height: ~23.2 cm = 8,250,000 EMU
const targetH = 8250000;
const cy = targetH;
const cx = Math.round(targetH * imgW / imgH);

const rId = 'rId137';
const idx = docXml.indexOf(rId);
if (idx === -1) {
  throw new Error('rId137 not found in document.xml');
}

const drawingStart = docXml.lastIndexOf('<w:drawing', idx);
const drawingEnd = docXml.indexOf('</w:drawing>', idx) + '</w:drawing>'.length;
const drawingXml = docXml.substring(drawingStart, drawingEnd);

const updatedDrawingXml = drawingXml
  .replace(/<wp:extent cx="[^"]+" cy="[^"]+"\/>/, `<wp:extent cx="${cx}" cy="${cy}"/>`)
  .replace(/<a:ext cx="[^"]+" cy="[^"]+"\/>/, `<a:ext cx="${cx}" cy="${cy}"/>`);

docXml = docXml.substring(0, drawingStart) + updatedDrawingXml + docXml.substring(drawingEnd);

zip.updateFile('word/document.xml', Buffer.from(docXml, 'utf8'));

zip.writeZip(docxPath);
console.log(`Updated ${docxPath} successfully! Extent: cx=${cx}, cy=${cy}`);
