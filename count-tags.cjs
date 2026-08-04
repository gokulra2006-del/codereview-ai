const fs = require('fs');

const code = fs.readFileSync('src/components/CodeEditor.jsx', 'utf8');
const lines = code.split('\n');

let tagStack = [];

for (let i = 1042; i < lines.length; i++) {
  const line = lines[i];
  
  // Very crude tag counter
  // We only care about div tags for now.
  const openMatch = line.match(/<div[^>]*>/g);
  const closeMatch = line.match(/<\/div>/g);
  const selfCloseMatch = line.match(/<div[^>]*\/>/g);
  
  // Exclude self-closing from open matches
  let opens = openMatch ? openMatch.length : 0;
  if (selfCloseMatch) opens -= selfCloseMatch.length;
  
  let closes = closeMatch ? closeMatch.length : 0;
  
  // There's JSX inside `{ ... }` but we will just count literal strings
  for (let j = 0; j < opens; j++) tagStack.push({ line: i + 1 });
  for (let j = 0; j < closes; j++) {
    if (tagStack.length > 0) tagStack.pop();
    else console.log(`Extra </div> at line ${i + 1}`);
  }
}

console.log("Unclosed tags remaining on stack:");
console.log(tagStack);
