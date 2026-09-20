const AdmZip = require('adm-zip');
const z = new AdmZip('doc/PTTK_OOP_HR_backup.docx');
const rels = z.getEntry('word/_rels/document.xml.rels').getData().toString('utf-8');

// Find ALL rels that reference hinh files
const matches = [...rels.matchAll(/Id="(rId\d+)"[^>]*Target="media\/(hinh[^"]*)"/g)];
console.log('Rels referencing hinh_* files:');
for (const m of matches) {
  console.log(`  ${m[1]} -> ${m[2]}`);
}

// Also check the document.xml around where hinh_2_1 appears
const x = z.getEntry('word/document.xml').getData().toString('utf-8');
const idx1 = x.indexOf('hinh_2_1');
const idx2 = x.indexOf('hinh_2_2');
if (idx1 > -1) {
  console.log('\n--- Context around hinh_2_1 ---');
  console.log(x.substring(Math.max(0, idx1 - 300), idx1 + 100).replace(/</g, '\n<'));
}
if (idx2 > -1) {
  console.log('\n--- Context around hinh_2_2 ---');
  console.log(x.substring(Math.max(0, idx2 - 300), idx2 + 100).replace(/</g, '\n<'));
}
