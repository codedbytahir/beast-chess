/* BUILD: stamp a single self-contained HTML file (works offline, double-click to run) */
const fs = require('fs');
const P = '/home/user/chess-beast';
const read = (f) => fs.readFileSync(P + '/' + f, 'utf8');

const engine = read('src/engine.js');
const board = read('src/board.js');
const contentOpenings = read('src/content-openings.js');
const contentDays = read('src/content-days.js');
const contentCodex = read('src/content-codex.js');
const contentTraps = read('src/content-traps.js');
const puzzles = read('data/puzzles.json');
const content = read('data/content.json');
const app = read('src/app.js');

const data = `window.PUZZLES_DATA = ${puzzles};\nwindow.CONTENT_VERIFIED = ${content};\n`;

const bundle = [
  '/* ===== BEAST CHESS BUILT BUNDLE — engine + content + app (no dependencies) ===== */',
  engine, board, contentOpenings, contentDays, contentCodex, contentTraps, data, app
].join('\n;\n');

let html = read('src/index.html');
html = html.replace('/* __BUNDLE__ */', () => bundle);
fs.writeFileSync(P + '/beast-chess.html', html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`built beast-chess.html — ${kb} KB`);
const counts = JSON.parse(puzzles).meta.counts;
console.log('puzzles embedded:', JSON.stringify(counts));
console.log('meta verified:', JSON.parse(content).meta.problems, 'problems');
