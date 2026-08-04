const fs = require('fs');
const parser = require('@babel/parser');

const code = fs.readFileSync('src/components/CodeEditor.jsx', 'utf8');

try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log("No syntax errors found by Babel.");
} catch (e) {
  console.log("Syntax Error:", e.message);
  console.log("Line:", e.loc.line, "Column:", e.loc.column);
}
