const fs = require('fs');
const content = fs.readFileSync('src/lib/ivory-coast-divisions.ts', 'utf-8');
const objStr = content.substring(content.indexOf('export const divisions: Division = ') + 35);
const jsCode = 'const obj = ' + objStr + ';\nrequire("fs").writeFileSync("public/data/old_divisions.json", JSON.stringify(obj, null, 2), "utf-8");';
fs.writeFileSync('parse_temp.js', jsCode);
require('./parse_temp.js');
