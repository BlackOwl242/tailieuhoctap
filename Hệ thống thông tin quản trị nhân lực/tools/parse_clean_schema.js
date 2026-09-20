const fs = require('fs');

const content = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Normalize line endings
const cleanContent = content.replace(/\r\n/g, '\n');

// Split into models
const modelRegex = /model\s+(\w+)\s+\{([\s\S]*?)\n\}/g;
let match;
const parsed = {};
const relations = [];

// Also collect enums
const enumRegex = /enum\s+(\w+)\s+\{([\s\S]*?)\n\}/g;
const enums = new Set();
let enumMatch;
while ((enumMatch = enumRegex.exec(cleanContent)) !== null) {
  enums.add(enumMatch[1]);
}
console.log('Enums found:', enums.size, Array.from(enums));

while ((match = modelRegex.exec(cleanContent)) !== null) {
  const mName = match[1];
  const inside = match[2];
  const lines = inside.split('\n');

  let tableName = mName;
  const mapMatch = inside.match(/@@map\("([^"]+)"\)/);
  if (mapMatch) tableName = mapMatch[1];

  const scalars = [];
  const relNavs = [];

  for (let rawLine of lines) {
    const l = rawLine.trim();
    if (!l || l.startsWith('//') || l.startsWith('@@')) continue;

    // Check for @relation(fields: [...], references: [...])
    const relMatch = l.match(/@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*references:\s*\[([^\]]+)\]/);
    if (relMatch) {
      const fkField = relMatch[1].trim();
      const refField = relMatch[2].trim();
      const targetType = l.split(/\s+/)[1].replace('?', '').replace('[]', '');
      relations.push({
        fromModel: mName,
        fkField,
        targetModel: targetType,
        refField
      });
    }

    // Parse field
    const tokens = l.split(/\s+/);
    if (tokens.length >= 2) {
      const fName = tokens[0];
      const rawType = tokens[1];
      const fType = rawType.replace('?', '').replace('[]', '');
      const attrs = l.substring(l.indexOf(rawType) + rawType.length);

      const isPk = attrs.includes('@id');
      const isUq = attrs.includes('@unique');
      const isFk = attrs.includes('@relation') || fName.endsWith('Id') || fName.endsWith('Code');

      const standardScalars = ['String', 'Int', 'BigInt', 'Float', 'Decimal', 'Boolean', 'DateTime', 'Json'];
      const isScalar = standardScalars.includes(fType) || enums.has(fType);

      if (isScalar) {
        scalars.push({ fName, fType, rawType, isPk, isUq, isFk });
      } else {
        relNavs.push({ fName, targetType: fType });
      }
    }
  }

  parsed[mName] = { tableName, scalars, relNavs };
}

console.log('Total parsed models:', Object.keys(parsed).length);
console.log('Total explicit relations:', relations.length);

fs.writeFileSync('tools/clean_schema_parsed.json', JSON.stringify({ models: parsed, relations }, null, 2));
console.log('Saved tools/clean_schema_parsed.json');
