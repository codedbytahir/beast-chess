/* DEFENSE PUZZLES: "find the only move that survives"
   Scans random games for positions where one move saves you and every alternative loses badly.
   Appends to data/puzzles.json (type: 'defense'). */
const B = require('/home/user/chess-beast/src/engine.js');
const fs = require('fs');
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];

const SEEDS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2',
  'rnbqkb1r/ppp1pppp/5n2/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 3',
  'r1bqkbnr/pppppppp/2n5/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 1 2'
];

function randomGame(plies) {
  let st = B.parseFEN(pick(SEEDS));
  const positions = [];
  for (let i = 0; i < plies; i++) {
    if (B.status(st).over) break;
    positions.push(st);
    const lm = B.legalMoves(st);
    if (!lm.length) break;
    st = B.makeMove(st, pick(lm));
  }
  return positions;
}

const MATE = B.MATE;
function generate(target, timeLimitMs) {
  const found = new Map(); const seen = new Set();
  const t0 = Date.now(); let scanned = 0, games = 0;
  while (found.size < target && Date.now() - t0 < timeLimitMs) {
    games++;
    const positions = randomGame(12 + rnd(26));
    for (let idx = 6; idx < positions.length; idx += 2) {
      if (found.size >= target || Date.now() - t0 > timeLimitMs) break;
      const st = positions[idx];
      const key = B.positionKey(st);
      if (seen.has(key)) continue; seen.add(key);
      scanned++;
      var quick = B.evaluate(st);            // side-to-move relative, cheap
      if (quick > 60) continue;              // nothing to defend, skip the expensive search
      const scored = B.rootScores(st, 3, { nodes: 0, stop: false, deadline: Date.now() + 260 });
      if (scored.length < 4) continue;
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0], second = scored[1];
      const gap = best.score - second.score;
      // we must be in trouble but not lost; one move saves us
      if (best.score > -80) continue;              // must actually be under pressure
      if (best.score < -600) continue;             // but not hopeless
      if (gap < 300) continue;                     // must be an "only move"
      const m = best.move;
      // opponent's best reply + our follow-up
      const st1 = B.makeMove(st, m);
      const repScored = B.rootScores(st1, 2, { nodes: 0, stop: false, deadline: Date.now() + 300 });
      if (!repScored.length) continue;
      repScored.sort((a, b) => a.score - b.score);
      const rep = repScored[0].move;
      const st2 = B.makeMove(st1, rep);
      const followScored = B.rootScores(st2, 2, { nodes: 0, stop: false, deadline: Date.now() + 300 });
      if (!followScored.length) continue;
      followScored.sort((a, b) => b.score - a.score);
      const fol = followScored[0].move;
      // verify at depth 4 that the "only move" is still the only move
      const deep = B.rootScores(st, 4, { nodes: 0, stop: false, deadline: Date.now() + 700 }).sort((a, b) => b.score - a.score);
      if (!deep.length || B.moveToUci(deep[0].move) !== B.moveToUci(m)) continue;
      if (deep[0].score < -900) continue;
      const dgap = deep.length > 1 ? deep[0].score - deep[1].score : 999;
      if (dgap < 250) continue;

      const mateless = second.score <= -MATE + 20;
      const fen = B.toFEN(st);
      if (found.has(fen)) continue;
      found.set(fen, {
        type: 'defense', fen,
        solution: [B.moveToUci(m), B.moveToUci(rep), B.moveToUci(fol)],
        san: [B.toSAN(st, m), B.toSAN(st1, rep), B.toSAN(st2, fol)],
        motif: mateless ? 'Survive the mate threat!' : 'Only move defense',
        threat: mateless ? 'Every other move gets mated!' : 'Every other move loses material!',
        evalAfter: (deep[0].score / 100).toFixed(1),
        difficulty: 3,
        tags: [B.inCheck(st, st.turn) ? 'you are in check' : 'quiet threat']
      });
    }
  }
  console.log(`defense: generated ${found.size} (games ${games}, scanned ${scanned}, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return [...found.values()];
}

const file = '/home/user/chess-beast/data/puzzles.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const defense = generate(30, 230000);
const keep = data.puzzles.filter(p => p.type !== 'defense');
data.puzzles = [...keep, ...defense];
data.meta.counts.defense = defense.length;
data.meta.counts.total = data.puzzles.length;
data.meta.defenseGenerated = new Date().toISOString();
fs.writeFileSync(file, JSON.stringify(data, null, 0));
console.log(`TOTAL now ${data.puzzles.length} puzzles (defense ${defense.length})`);
