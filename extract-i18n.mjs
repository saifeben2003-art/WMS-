import fs from 'fs';

const src = fs.readFileSync('src/lib/i18n.ts', 'utf8');
const lines = src.split('\n');

// Strip comment lines and empty lines, keep object content
function extractObj(start, end) {
  const content = lines.slice(start - 1, end - 1)
    .map(l => l.replace(/\/\/.*$/, '').trim())
    .filter(l => l.length > 0 && !l.startsWith('//'))
    .join('\n');
  return new Function('return (' + content + ')')();
}

function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? prefix + '.' + key : key;
    if (typeof value === 'string') result[fullKey] = value;
    else if (typeof value === 'object' && value !== null && !Array.isArray(value))
      Object.assign(result, flatten(value, fullKey));
  }
  return result;
}

try {
  const arObj = extractObj(5, 362);
  const arFlat = flatten(arObj);
  fs.writeFileSync('messages/ar.json', JSON.stringify(arFlat, null, 2));
  console.log('ar keys:', Object.keys(arFlat).length);
  console.log('Sample ar:', Object.entries(arFlat).slice(0, 5));

  const enObj = extractObj(366, 724);
  const enFlat = flatten(enObj);
  fs.writeFileSync('messages/en.json', JSON.stringify(enFlat, null, 2));
  console.log('en keys:', Object.keys(enFlat).length);
  console.log('Sample en:', Object.entries(enFlat).slice(0, 5));
} catch(e) { console.error('Error:', e.message); process.exit(1); }
