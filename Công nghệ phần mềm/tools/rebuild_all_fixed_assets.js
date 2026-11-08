const { execSync } = require('child_process');
const path = require('path');

console.log('==============================================================');
console.log(' REBUILDING ALL FIXED ACADEMIC DIAGRAMS, UI MOCKUPS & CODE ASSETS');
console.log('==============================================================');

execSync(`node "${path.join(__dirname, 'rebuild_part1_academic_diagrams.js')}"`, { stdio: 'inherit' });
execSync(`node "${path.join(__dirname, 'rebuild_part2_ui_and_code.js')}"`, { stdio: 'inherit' });

console.log('==============================================================');
console.log(' ALL 22 ASSETS REBUILT SUCCESSFULLY IN assets/diagrams/!');
console.log('==============================================================');
