/* =========================================================================
   PUZZLE GENERATOR  — builds data/puzzles.json from scratch using the engine.
   No external data needed: every puzzle is legally verified.
   Types:
     mate1  — unique checkmate in 1   (auto-discovered on random sparse boards)
     mate2  — unique mate in 2        (auto-discovered)
     tactic — "find the best move", engine-verified winning continuation
   ========================================================================= */
const B = require('/home/user/chess-beast/src/engine.js');
const fs = require('fs');

const FILES = 'abcdefgh';
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const sqName = B.sqName;

function randSquare() { return rnd(64); }

function kingsOk(a, b) {
  const ra = a >> 3, fa = a & 7, rb = b >> 3, fb = b & 7;
  return Math.max(Math.abs(ra - rb), Math.abs(fa - fb)) >= 2;
}

/* ---------- random sparse board builder ---------- */
function randomSparseBoard(cfg) {
  const board = new Array(64).fill(null);
  const placed = [];
  const occupied = () => placed;

  function put(piece, bannedRanks) {
    for (let t = 0; t < 60; t++) {
      const s = randSquare();
      if (board[s]) continue;
      const r = s >> 3;
      if (bannedRanks && bannedRanks.includes(r)) continue;
      board[s] = piece; placed.push(s);
      return s;
    }
    return null;
  }

  // kings
  const wk = put('wk'); let bk;
  for (let t = 0; t < 200; t++) { const s = randSquare(); if (!board[s] && kingsOk(wk, s)) { board[s] = 'bk'; placed.push(s); bk = s; break; } }
  if (!board[bk]) return null;
  if (B.attacked({ board, castling: {} }, wk, 'b') || B.attacked({ board, castling: {} }, bk, 'w')) return null;

  // white force
  for (const p of cfg.white) put(p);
  // black force (pawns not on rank 1/8)
  for (const p of cfg.black) put(p, p.endsWith('p') ? [0, 7] : null);

  const st = {
    board, turn: 'w',
    castling: { wk: false, wq: false, bk: false, bq: false },
    ep: null, halfmove: 0, fullmove: 1
  };
  // legality: black (side not to move) must not be in check; white may not be in check either for simplicity
  if (B.attacked(st, B.findKing(st, 'b'), 'w')) return null;
  if (B.attacked(st, B.findKing(st, 'w'), 'b')) return null;
  // material sanity
  let wm = 0, bm = 0;
  for (const p of board) if (p) { (p[0] === 'w' ? null : null); }
  const mat = B.material(st);
  const diff = mat.w - mat.b;
  if (diff < cfg.minDiff * 100 || diff > cfg.maxDiff * 100) return null;
  return st;
}

function matingMoves(st) {
  const out = [];
  const lm = B.legalMoves(st);
  for (const m of lm) {
    const u = B.makeInPlace(st, m);
    const noReply = B.legalMoves(st).length === 0 && B.inCheck(st, st.turn);
    B.unmakeInPlace(st, u);
    if (noReply) out.push(m);
  }
  return out;
}

/* unique mate in 1 */
function findMate1(st) {
  if (B.inCheck(st, 'w')) return null;             // cleaner puzzles: not in check ourselves
  if (B.legalMoves(st).length < 2) return null;
  const mm = matingMoves(st);
  if (mm.length !== 1) return null;
  return mm[0];
}

/* unique mate in 2 (i.e. mate in 3 plies) */
function findMate2(st) {
  if (B.inCheck(st, 'w')) return null;
  if (matingMoves(st).length > 0) return null;      // that would be mate in 1
  const lm = B.legalMoves(st);
  if (lm.length < 2) return null;
  const keys = [];
  for (const m of lm) {
    const u = B.makeInPlace(st, m);
    const opp = B.legalMoves(st);
    let ok = opp.length > 0;
    if (ok) {
      for (const o of opp) {
        const u2 = B.makeInPlace(st, o);
        const found = matingMoves(st).length > 0;
        B.unmakeInPlace(st, u2);
        if (!found) { ok = false; break; }
      }
    }
    B.unmakeInPlace(st, u);
    if (ok) { keys.push(m); if (keys.length > 1) return null; }
  }
  return keys.length === 1 ? keys[0] : null;
}

/* classify a mate-in-1 by motif */
function classifyMate1(st, m) {
  const piece = st.board[m.from];
  const t = piece[1];
  const b = st.board.slice(); b[m.to] = piece; b[m.from] = null;
  const bkSq = m.to === B.findKing(st, 'b') ? m.to : null;
  let bk = -1;
  for (let i = 0; i < 64; i++) if (b[i] === 'bk') bk = i;
  const r = bk >> 3, f = bk & 7;

  // back-rank: mate on 1st/8th rank, king on 8th/1st with pawns in front
  if ((r === 0 || r === 7) && (t === 'r' || t === 'q')) {
    const shieldR = r === 0 ? 1 : 6;
    let shield = 0;
    for (const df of [-1, 0, 1]) { const ff = f + df; if (ff >= 0 && ff < 8 && b[shieldR * 8 + ff] === 'bp') shield++; }
    if (shield >= 2) return 'Back-rank Mate';
  }
  if (t === 'n') {
    // smothered: king surrounded by own pieces, no flight squares
    let ownAround = 0, flights = 0;
    for (const [dr, df] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const rr = r + dr, ff = f + df; if (rr < 0 || rr > 7 || ff < 0 || ff > 7) continue;
      const p = b[rr * 8 + ff];
      if (p && p[0] === 'b') ownAround++;
      if (!p) flights++;
    }
    if (ownAround >= 3) return 'Smothered Mate';
    return 'Knight Mate';
  }
  if (t === 'q') {
    // support mate (queen protected by a piece adjacent to king)
    return 'Queen Mate';
  }
  if (t === 'r') return 'Rook Mate';
  if (t === 'b') return 'Bishop Mate';
  if (t === 'p') return 'Pawn Mate';
  return 'Queen Mate';
}

/* ---------- 1. GENERATE MATE-IN-1 ---------- */
const mate1Configs = [
  { white: ['wq', 'wr'], black: ['bp', 'bp', 'bp'], minDiff: 9, maxDiff: 30, tags: ['basic'] },
  { white: ['wq', 'wq'], black: ['bn', 'bp'], minDiff: 12, maxDiff: 34, tags: ['two queens'] },
  { white: ['wq', 'wb'], black: ['bn', 'bp', 'bp'], minDiff: 6, maxDiff: 28, tags: ['q+b'] },
  { white: ['wr', 'wr'], black: ['bn', 'bp'], minDiff: 7, maxDiff: 22, tags: ['two rooks'] },
  { white: ['wq', 'wn'], black: ['br', 'bp'], minDiff: 4, maxDiff: 24, tags: ['q+n'] },
  { white: ['wq', 'wr', 'wb'], black: ['br', 'bn', 'bp'], minDiff: 5, maxDiff: 30, tags: ['bishop+heavy'] },
  { white: ['wq'], black: ['br', 'bp', 'bp'], minDiff: 3, maxDiff: 14, tags: ['queen only'] },
  { white: ['wq', 'wn'], black: ['bb', 'bn', 'bp'], minDiff: 2, maxDiff: 22, tags: ['pieces'] },
  { white: ['wr', 'wb'], black: ['bb', 'bp', 'bp'], minDiff: 2, maxDiff: 18, tags: ['r+b'] },
  { white: ['wq', 'wr', 'wp', 'wp'], black: ['br', 'bn', 'bp', 'bp'], minDiff: 4, maxDiff: 26, tags: ['mixed'] },
];

function generateMate1(target, timeLimitMs) {
  const found = new Map(); const t0 = Date.now(); let tried = 0;
  while (found.size < target && Date.now() - t0 < timeLimitMs) {
    tried++;
    const cfg = pick(mate1Configs);
    const st = randomSparseBoard(cfg);
    if (!st) continue;
    const m = findMate1(st);
    if (!m) continue;
    const fen = B.toFEN(st);
    if (found.has(fen)) continue;
    const mate = classifyMate1(st, m);
    found.set(fen, {
      type: 'mate1', fen, solution: [B.moveToUci(m)],
      san: B.toSAN(st, m), motif: mate, difficulty: 1,
      tags: cfg.tags
    });
  }
  console.log(`mate1: generated ${found.size} (tried ${tried} boards, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return [...found.values()];
}

/* ---------- 2. GENERATE MATE-IN-2 ---------- */
const mate2Configs = [
  { white: ['wq', 'wr'], black: ['br', 'bp', 'bp'], minDiff: 3, maxDiff: 18 },
  { white: ['wq', 'wb'], black: ['bb', 'bp', 'bp'], minDiff: 3, maxDiff: 18 },
  { white: ['wq', 'wn'], black: ['br', 'bp'], minDiff: 3, maxDiff: 16 },
  { white: ['wr', 'wr'], black: ['bn', 'bp', 'bp'], minDiff: 2, maxDiff: 14 },
  { white: ['wq', 'wr', 'wn'], black: ['br', 'bb', 'bp'], minDiff: 3, maxDiff: 22 },
  { white: ['wq', 'wr', 'wp'], black: ['br', 'bn', 'bp', 'bp'], minDiff: 3, maxDiff: 20 },
  { white: ['wq', 'wr', 'wb'], black: ['br', 'bn', 'bp', 'bp'], minDiff: 4, maxDiff: 24 },
];

function generateMate2(target, timeLimitMs) {
  const found = new Map(); const t0 = Date.now(); let tried = 0;
  while (found.size < target && Date.now() - t0 < timeLimitMs) {
    tried++;
    const st = randomSparseBoard(pick(mate2Configs));
    if (!st) continue;
    const key = findMate2(st);
    if (!key) continue;
    const fen = B.toFEN(st);
    if (found.has(fen)) continue;
    found.set(fen, {
      type: 'mate2', fen, solution: [B.moveToUci(key)],
      san: B.toSAN(st, key), motif: 'Mate in 2', difficulty: 2, tags: ['mate in two']
    });
  }
  console.log(`mate2: generated ${found.size} (tried ${tried} boards, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return [...found.values()];
}

/* ---------- 3. BEST-MOVE TACTICS from self-play scanning ---------- */
const OPENING_SEEDS = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2',
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  'rnbqkb1r/pppp1ppp/5n2/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
  'rnbqkb1r/ppp1pppp/5n2/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 4'
];

function randomGame(plies) {
  let st = B.parseFEN(pick(OPENING_SEEDS));
  const positions = [];
  for (let i = 0; i < plies; i++) {
    const lm = B.legalMoves(st);
    if (!lm.length) break;
    const check = B.status(st);
    if (check.over) break;
    positions.push(st);
    const m = pick(lm);
    st = B.makeMove(st, m);
  }
  return positions;
}

function attacksInfo(st, sq, color) {
  // list of squares from which `color` attacks sq
  const out = [];
  for (let i = 0; i < 64; i++) {
    const p = st.board[i];
    if (!p || p[0] !== color) continue;
    if (B.attacked({ board: (() => { const b = st.board.slice(); b[i] = null; b[sq] = p; return b; })(), castling: {} }, sq, color)) out.push(i);
  }
  return out;
}

function classifyTactic(st, m, bestScore) {
  const piece = st.board[m.from]; const t = piece[1];
  if (t === 'n') return 'Knight Jump';
  if (m.captured && !st.board[m.to]) {
    // capture of a piece that had no defender? approximate
    return 'Take the Loot';
  }
  if (t === 'q') return 'Queen Sortie';
  if (t === 'r') return 'Rook Lift';
  if (t === 'b') return 'Bishop Strike';
  if (t === 'p') return 'Pawn Break';
  return 'Best Move';
}

function generateTactics(target, timeLimitMs) {
  const found = new Map(); const seen = new Set(); const t0 = Date.now();
  let games = 0, scanned = 0;
  while (found.size < target && Date.now() - t0 < timeLimitMs) {
    games++;
    const positions = randomGame(14 + rnd(24));
    for (let idx = 6; idx < positions.length; idx += 2) {
      if (found.size >= target || Date.now() - t0 > timeLimitMs) break;
      const st = positions[idx];
      if (B.inCheck(st, st.turn)) continue;
      const key0 = B.positionKey(st);
      if (seen.has(key0)) continue; seen.add(key0);
      // only reasonably balanced positions
      const rawEval = B.evaluate(st) * (st.turn === 'w' ? 1 : 1);
      if (Math.abs(rawEval) > 500) continue;
      scanned++;
      const scored = B.rootScores(st, 3, { nodes: 0, stop: false, deadline: Date.now() + 400 });
      if (scored.length < 3) continue;
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0], second = scored[1];
      const gap = best.score - second.score;
      if (best.score < 60) continue;           // must be actually winning something
      if (gap < 220) continue;                 // must be clearly the only move
      const m = best.move;
      // opponent best reply + our follow-up
      const st1 = B.makeMove(st, m);
      const replyScored = B.rootScores(st1, 2, { nodes: 0, stop: false, deadline: Date.now() + 300 });
      if (!replyScored.length) continue;
      replyScored.sort((a, b) => a.score - b.score);   // opponent picks from their side (scores are from their perspective)
      const rep = replyScored[0].move;
      const st2 = B.makeMove(st1, rep);
      const followScored = B.rootScores(st2, 2, { nodes: 0, stop: false, deadline: Date.now() + 300 });
      if (!followScored.length) continue;
      followScored.sort((a, b) => b.score - a.score);
      const fol = followScored[0].move;
      // verify at greater depth that we are still winning after our "solution" move
      const deepScored = B.rootScores(st, 4, { nodes: 0, stop: false, deadline: Date.now() + 900 });
      deepScored.sort((a, b) => b.score - a.score);
      if (!deepScored.length) continue;
      const deepBest = deepScored[0];
      if (B.moveToUci(deepBest.move) !== B.moveToUci(m)) continue;  // deeper search must agree
      if (deepBest.score < 120) continue;

      const sanSeq = [B.toSAN(st, m), B.toSAN(st1, rep), B.toSAN(st2, fol)];
      const fen = B.toFEN(st);
      if (found.has(fen)) continue;
      found.set(fen, {
        type: 'tactic', fen,
        solution: [B.moveToUci(m), B.moveToUci(rep), B.moveToUci(fol)],
        san: sanSeq, motif: classifyTactic(st, m, best.score),
        gain: Math.round(deepBest.score / 100 * 10) / 10,
        difficulty: deepBest.score > 400 ? 3 : 2,
        tags: [m.captured ? 'capture' : 'quiet move']
      });
    }
  }
  console.log(`tactics: generated ${found.size} (games ${games}, scanned ${scanned}, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  return [...found.values()];
}

/* ---------- 4. VERIFY HANDCRAFTED MOTIF POSITIONS ---------- */
const handcrafted = [
  { name: 'Back-rank mate', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', expect: 'Ra8#', idea: 'The king is locked behind its own pawns. A rook or queen crashing onto the 8th rank is instant death.' },
  { name: 'Smothered mate', fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1', expect: 'Nf7#', idea: 'A knight mates a king boxed in by its own pieces. The knight cannot be blocked or captured.' },
  { name: 'Ladder mate with two rooks', fen: '7k/8/8/8/8/8/R7/1R5K w - - 0 1', expect: 'Rb8#', idea: 'Two rooks sweep the king to the edge: one cuts, one checks. The simplest mate in chess.' },
  { name: 'Queen + knight mate', fen: '5rk1/5ppp/8/8/8/8/5PPP/3QK2R w - - 0 1', expect: 'Qd8#', idea: 'Queen invades the 8th rank defended by nothing — the rook on f8 cannot stop it because the king has no escape.' },
  { name: 'Anastasia\'s mate', fen: '5rk1/4Nppp/8/8/8/8/5PPP/4R1K1 w - - 0 1', expect: 'Re8#', idea: 'Knight on e7 controls g8/d8 flight squares while a rook/queen mates along the edge file.' },
  { name: 'Arabian mate', fen: '7k/8/8/8/8/5N2/7R/4K3 w - - 0 1', expect: 'Rh8#', idea: 'Knight + rook: the knight covers the corner escape squares while the rook mates on the edge.' },
  { name: 'Fork: knight royal fork', fen: 'r3k3/8/4N3/8/8/8/8/4K3 w - - 0 1', expect: 'Nc7+', idea: 'Knight jumps to a square attacking king and rook at once — the classic "royal fork".' },
  { name: 'Fork wins the queen', fen: '3q3k/8/8/4N3/8/8/8/4K3 w - - 0 1', expect: 'Nf7+', idea: 'A knight check that also hits the queen. Forks are the #1 way beginners lose material.' },
  { name: 'Skewer through the king', fen: '4k3/8/8/8/8/8/8/q3K2R w - - 0 1', expect: 'Rh8+', idea: 'Check the king on a line, and when it steps aside you capture the queen behind it. The opposite of a pin.' },
  { name: 'Discovered check wins material', fen: '4k3/8/8/8/8/2N5/8/4KR2 w - - 0 1', expect: null, idea: 'Move the blocking piece away to unleash check from behind, then grab whatever you like with the moving piece.' },
  { name: 'Pin the defender', fen: 'rnbqkb1r/pppp1ppp/5n2/4p1B1/4P3/8/PPPP1PPP/RN1QKBNR w KQkq - 0 1', expect: null, idea: 'Bg5 pins the f6 knight to the queen. Pinned pieces cannot move — attack them repeatedly.' },
  { name: 'Win the queen with a deflection', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1', expect: null, idea: 'Deflect a defender away from its duty — the guarding piece is overloaded and something falls.' },
  { name: 'Promotion tricks', fen: '8/P6k/8/8/8/8/6K1/8 w - - 0 1', expect: 'a8=Q', idea: 'A pawn one step from promotion is often worth more than a piece. Push it before anything else.' },
  { name: 'Trapped queen (Nc3-d5 style)', fen: 'rnb1kbnr/pppp1ppp/8/4p3/4P2q/5P2/PPPP2PP/RNBQKBNR w KQkq - 0 1', expect: null, idea: 'An advanced queen with no retreat is a target. Trap it with calm developing moves.' },
  { name: 'Two bishops mating net', fen: '6k1/5p2/6p1/8/8/1B6/8/1B4K1 w - - 0 1', expect: null, idea: 'Bishops dominate long diagonals; two bishops sweep the king across the board.' },
  { name: 'Zugzwang in the endgame', fen: '8/8/p1p5/1p1p4/1P1P4/P1P5/8/K6k w - - 0 1', expect: null, idea: 'Sometimes the winning move is to force the opponent to move — every legal move loses.' }
];

function verifyHandcrafted() {
  console.log('\n--- handcrafted motif verification ---');
  const ok = [];
  for (const h of handcrafted) {
    const st = B.parseFEN(h.fen);
    const lm = B.legalMoves(st);
    let verdict = 'legal';
    if (!lm.length) verdict = 'NO LEGAL MOVES (position broken)';
    else {
      const scored = B.rootScores(st, 3, { nodes: 0, stop: false, deadline: Date.now() + 800 });
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      const bestSAN = B.toSAN(st, best.move);
      if (h.expect) {
        verdict = (bestSAN === h.expect || bestSAN.replace(/[+#]/g, '') === h.expect.replace(/[+#]/g, ''))
          ? `MATCH best=${bestSAN}` : `DIFF best=${bestSAN} (expected ${h.expect})`;
      } else {
        verdict = `legal, engine best=${bestSAN} (score ${best.score})`;
      }
    }
    console.log(`${h.name}: ${verdict}`);
    ok.push({ ...h, verdict });
  }
  return ok;
}

/* ---------- MAIN ---------- */
const MODE = process.argv[2] || 'all';
const out = { mate1: [], mate2: [], tactic: [] };
const existing = fs.existsSync('/home/user/chess-beast/data/puzzles.json')
  ? JSON.parse(fs.readFileSync('/home/user/chess-beast/data/puzzles.json', 'utf8')) : null;

if (MODE === 'all' || MODE === 'mate1') out.mate1 = generateMate1(160, 200000);
if (MODE === 'all' || MODE === 'mate2') out.mate2 = generateMate2(70, 240000);
if (MODE === 'all' || MODE === 'tactic') out.tactic = generateTactics(120, 300000);

if (MODE !== 'all') {
  if (existing) { for (const k of ['mate1', 'mate2', 'tactic']) if (!out[k].length) out[k] = existing[k] || []; }
}

const motifs = verifyHandcrafted();
const all = [...out.mate1, ...out.mate2, ...out.tactic];
fs.mkdirSync('/home/user/chess-beast/data', { recursive: true });
fs.writeFileSync('/home/user/chess-beast/data/puzzles.json', JSON.stringify({
  meta: { generated: new Date().toISOString(), counts: { mate1: out.mate1.length, mate2: out.mate2.length, tactic: out.tactic.length } },
  puzzles: all, motifs
}, null, 0));
console.log(`\nTOTAL puzzles: ${all.length}  ->  data/puzzles.json`);
console.log('by type:', out.mate1.length, 'mate1 /', out.mate2.length, 'mate2 /', out.tactic.length, 'tactics');
