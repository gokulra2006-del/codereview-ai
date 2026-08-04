const fs = require('fs');

const code = fs.readFileSync('src/components/CodeEditor.jsx', 'utf8');
const lines = code.split('\n');

let count = 0;

for (let i = 1042; i < lines.length; i++) {
  const line = lines[i];
  
  const openMatch = line.match(/<div[^>]*>/g);
  const closeMatch = line.match(/<\/div>/g);
  const selfCloseMatch = line.match(/<div[^>]*\/>/g);
  let opens = openMatch ? openMatch.length : 0;
  if (selfCloseMatch) opens -= selfCloseMatch.length;
  let closes = closeMatch ? closeMatch.length : 0;
  count += opens;
  count -= closes;
  
  if (opens > 0 || closes > 0) {
    console.log(`${i + 1}: +${opens} -${closes} = ${count} | ${line.trim()}`);
  }
}
