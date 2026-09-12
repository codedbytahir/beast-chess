/* VERIFY ALL CONTENT with the engine — nothing ships unverified.
   - every opening line: legality + first illegal move report + eval of final position
   - every trap: legality, final position status (mate?), engine verdict on the blunder move
   - motif + codex positions: legality and best move
   Output: data/content.json  (traps enriched with FENs; motif positions with engine verdicts)
*/
const path = '/home/user/chess-beast';
const B = require(path + '/src/engine.js');
const OP = require(path + '/src/content-openings.js');
const C = require(path + '/src/content-codex.js');
const T = require(path + '/src/content-traps.js');
const fs = require('fs');

let problems = 0;

function replay(sanList, verbose) {
  let st = B.parseFEN(B.START_FEN);
  const fens = [B.toFEN(st)];
  const sans = [];
  const moves = [];
  for (let i = 0; i < sanList.length; i++) {
    const san = sanList[i];
    let m = B.fromSAN(st, san);
    if (!m) {
      // try tolerance: add # or + or =Q etc
      m = B.fromSAN(st, san + '#') || B.fromSAN(st, san + '+');
    }
    if (!m) {
      if (verbose) console.log(`   !! ILLEGAL/UNKNOWN: "${san}" at ply ${i + 1} in position ${B.toFEN(st)}`);
      return { ok: false, atPly: i + 1, badSan: san, fen: B.toFEN(st), fens, sans, moves };
    }
    const actualSan = B.toSAN(st, m);
    sans.push(actualSan);
    if (verbose && actualSan.replace(/[+#]/g, '') !== san.replace(/[+#]/g, '')) {
      console.log(`   ~ notation adjusted: "${san}" -> "${actualSan}" (ply ${i + 1})`);
    }
    st = B.makeMove(st, m);
    moves.push(m);
    fens.push(B.toFEN(st));
  }
  const stt = B.status(st, [B.positionKey(st)]);
  return { ok: true, fen: B.toFEN(st), status: stt, fens, sans, moves, state: st };
}

console.log('=== OPENING LINES ===');
for (const side of ['white', 'black']) {
  for (const op of OP[side]) {
    console.log(`\n[${op.id}] ${op.name}`);
    for (const line of op.lines) {
      const r = replay(line.moves, true);
      if (!r.ok) { problems++; console.log(`  FAIL ${line.name}: illegal move ${r.badSan} at ply ${r.atPly}`); continue; }
      const notesMismatch = line.notes.length !== line.moves.length;
      if (notesMismatch) { console.log(`  (note count ${line.notes.length} vs ${line.moves.length} moves — app pads missing notes)`); }
      const lastEval = B.evaluate(r.state);
      console.log(`  OK ${line.name}  (${line.moves.length} plies, final eval w=${lastEval})`);
      line.sanVerified = r.sans;
      line.fensVerified = r.fens;
    }
  }
}

console.log('\n=== TRAPS ===');
const trapsOut = [];
for (const tr of T.traps) {
  console.log(`\n[${tr.id}] ${tr.name}`);
  const r = replay(tr.trapLine, true);
  if (!r.ok) { problems++; console.log(`  FAIL illegal ${r.badSan} at ply ${r.atPly} (fen ${r.fen})`); continue; }
  const lastSan = r.sans[r.sans.length - 1];
  const mate = lastSan.includes('#') || (r.status.over && r.status.reason === 'checkmate');
  console.log(`  trap line OK. final: ${lastSan}  status=${r.status.over ? r.status.reason : 'ongoing'} ${mate ? '(MATE ✓)' : ''}`);
  // evaluate the position just before the final move (the blunder position)
  const preState = B.parseFEN(r.fens[r.fens.length - 2]);
  const scored = B.rootScores(preState, 3, { nodes: 0, stop: false, deadline: Date.now() + 1500 });
  scored.sort((a, b) => b.score - a.score);
  console.log(`     best move in trap position: ${B.toSAN(preState, scored[0].move)} (${(scored[0].score / 100).toFixed(1)})`);
  const a = replay(tr.antidoteLine, true);
  if (!a.ok) { problems++; console.log(`  FAIL antidote illegal ${a.badSan} at ply ${a.atPly}`); continue; }
  console.log(`  antidote OK (${tr.antidoteLine.length} plies). final eval=${B.evaluate(a.state)}`);
  trapsOut.push({
    ...tr,
    trapSans: r.sans, trapFens: r.fens, trapFinalMate: !!mate,
    antidoteSans: a.sans, antidoteFens: a.fens,
    fenBeforeMate: r.fens[r.fens.length - 2] || null
  });
}

console.log('\n=== CODEX POSITIONS ===');
const codexFens = {};
for (const c of C.cards) {
  if (!c.fen) continue;
  const st = B.parseFEN(c.fen);
  const lm = B.legalMoves(st);
  if (!lm.length) { problems++; console.log(`  FAIL ${c.id}: no legal moves`); continue; }
  if (B.inCheck(st, 'b') && st.turn === 'w') { console.log(`  NOTE ${c.id}: black is in check in the diagram`); }
  const scored = B.rootScores(st, 3, { nodes: 0, stop: false, deadline: Date.now() + 1200 });
  scored.sort((x, y) => y.score - x.score);
  console.log(`  ${c.id}: legal (${lm.length} moves), engine best = ${B.toSAN(st, scored[0].move)}`);
  codexFens[c.id] = { fen: c.fen, bestSan: B.toSAN(st, scored[0].move), bestUci: B.moveToUci(scored[0].move) };
}

fs.writeFileSync(path + '/data/content.json', JSON.stringify({
  meta: { verified: new Date().toISOString(), problems },
  traps: trapsOut,
  codexFens
}, null, 0));
console.log(`\n=======================\nPROBLEMS: ${problems}`);
