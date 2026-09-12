const B = require('../src/engine.js');
const tests = [
  ['startpos', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [20, 400, 8902, 197281, 4865609]],
  ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862, 4085603]],
  ['pos3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238, 674624]],
  ['pos4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467, 422333]],
  ['pos5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379, 2103487]],
  ['pos6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', [46, 2079, 89890, 3894594]],
];
let fails = 0;
for (const [name, fen, expected] of tests) {
  const st = B.parseFEN(fen);
  for (let d = 1; d <= expected.length; d++) {
    const t0 = Date.now();
    const got = B.perft(st, d);
    const ok = got === expected[d - 1];
    if (!ok) fails++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} d${d}: got ${got} expected ${expected[d - 1]}  (${Date.now() - t0}ms)`);
    if (!ok) break;
  }
}
// extra sanity
console.log('--- sanity ---');
let s = B.parseFEN(B.START_FEN);
console.log('start legal moves:', B.legalMoves(s).length);
const foolsFEN = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3';
console.log('checkmate detected:', B.status(B.parseFEN(foolsFEN)).reason);
console.log('stalemate detected:', B.status(B.parseFEN('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')).reason);
console.log('SAN sample:', B.toSAN(s, B.uciToMove(s, 'e2e4')), B.toSAN(s, B.uciToMove(s, 'g1f3')));
s = B.parseFEN('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1');
console.log('castle SAN:', B.toSAN(s, B.uciToMove(s, 'e1g1')));
console.log('mate in 1 solver:', JSON.stringify(B.mateIn(B.parseFEN('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1'), 1) ? 'found' : 'none'));
console.log(fails === 0 ? 'ALL PERFT TESTS PASS' : `${fails} FAILURES`);
