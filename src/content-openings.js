/* BEAST CHESS — OPENING REPERTOIRE
   Every line is machine-verified legal by tools/gen-content.js
   Format: { id, side, name, vs, priority, lines: [{moves:[SAN], note:[per-move note or '']}], ideas:[], traps:[] }
*/
(function () {
  var R = {
    white: [
      {
        id: 'w-italian', name: 'Italian Game — Main Repertoire', side: 'white', priority: 1,
        vs: '1.e4 e5 2.Nf3 Nc6 3.Bc4 — your #1 weapon with White',
        why: 'Fast development, castle by move 6, easy plans (c3+d4, Re1, Nbd2-f1-g3), and a nasty trap if Black gets careless. Perfect for 7-day prep.',
        lines: [
          {
            name: 'Italian: Giuoco Pianissimo (the safe highway)',
            moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O', 'Re1', 'a6', 'Nbd2', 'Ba7'],
            notes: [
              'Take the center: e4.',
              'Black mirrors.',
              'Develop + attack e5.',
              'Black defends and develops.',
              'Bishop on the best diagonal — eyes on f7, the weakest square in Black\'s camp.',
              'Black copies you.',
              'The move that makes the whole system work: prepares d4, gives the bishop a retreat square on c2, keeps the center flexible.',
              'Black develops.',
              'Small, safe, and plans Nbd2-f1-g3 and d4 later. No theory, no traps, no blunders.',
              'Black is cautious too.',
              'CASTLE. King safety before anything. Your goal: castle by move 6-7 EVERY game.',
              'Both kings safe — now the real game begins.',
              'Rook to the open-ish e-file, supporting e4 and thinking about e5/d4 breaks.',
              'Black stops your b5/Nb5 ideas.',
              'Heading for f1 then g3: the knight joins the attack for free.',
              'Black keeps the bishop safe.'
            ],
            plans: ['Push d3-d4 when you can support it (after Nbd2/Nbd2-f1, or with b4 if Black plays a6/Ba7).',
              'Reroute: Nb1-d2-f1-g3 targeting f5/h5.',
              'Rook to e1, then Re2/Re3 for a kingside squeeze.',
              'If Black plays ...Bxf2+ (rare) or grabs on c2 — always check first, it is usually a trap.'
            ]
          },
          {
            name: 'Italian: 3...Bc5 4.c3 Nf6 5.d4 (the sharp but correct version)',
            moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4', 'exd4', 'cxd4', 'Bb4+', 'Bd2', 'Bxd2+', 'Nbxd2', 'd5'],
            notes: [
              'Same start.', '', '', '', '', '', '', 'Black develops.',
              'Now you strike: full center.',
              'Black must take or lose the e5/d4 fight.',
              'Recapture — you now have the ideal pawn duo e4+d4.',
              'Black checks to gain time.',
              'Block and offer a trade. Nothing scary: you are fine, your center is bigger.',
              'Black trades.',
              'Recapture with the knight (keeps the bishop pair dream alive and the rook connected).',
              'Black grabs space.'
            ],
            plans: ['This is the position you get in 70% of games: you have a big center, Black has an okay structure, you are better.',
              'Next moves: exd5/Nxd5 or exd5 then Re1+ ideas, or keep tension with Qb3 hitting d5/b7.',
              'Play slowly: Re1, Qb3, Rc1, and squeeze.']
          },
          {
            name: 'vs Petroff 2...Nf6',
            moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4', 'd5', 'Bd3', 'Bd6', 'O-O', 'O-O'],
            notes: ['', '', 'Black copies instead of defending e5.',
              'The most precise: take the pawn.',
              'Black has to kick the knight.',
              'Retreat — do not cling to material.',
              'Black recaptures, temporarily equal.',
              'You take the full center, Black must block.',
              'Develop and aim at h7.',
              'Black does the same.',
              'CASTLE EARLY — this line is all about king safety and central space.',
              'Both sides have smooth development — then outplay them positionally.']
          },
          {
            name: 'vs Sicilian 2...c5 — the Alapin (no theory needed)',
            moves: ['e4', 'c5', 'c3', 'd5', 'exd5', 'Qxd5', 'd4', 'Nf6', 'Nf3', 'Bg4', 'Be2', 'e6', 'O-O', 'Nc6'],
            notes: ['', 'Black fights for the center asymmetrically — the most common answer at district level.',
              'The Alapin: super solid, zero theory, and Black has to solve problems instead of playing their prepared lines.',
              'Black challenges immediately.',
              'Free trade.',
              'Black must recapture with the queen (or ...Nf6 later) — the queen is now a target.',
              'You get the perfect center for free.',
              'Black develops.',
              'Develop with tempo.',
              'Black pins your knight.',
              'Calm development — the bishop belongs here, defending the knight and preparing to castle.',
              'Black is solid too.',
              'Castle. Your structure is better, your plans are simpler: c4/d5 or Nbd2-b3 hitting the queen themes.',
              'Black eyeballs your center.']
          },
          {
            name: 'vs French 2...e6',
            moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5', 'c3', 'Nc6', 'Nf3', 'Qb6', 'Bd3', 'cxd4', 'cxd4', 'Bd7'],
            notes: ['', 'The French: solid but Black\'s light bishop stays bad all game.',
              'Take the center.',
              'Black challenges e4.',
              'The Advance Variation — you gain space and lock the position. Black\'s bishop on c8 becomes a spectator.',
              'Black hits the base of your pawn chain.',
              'Defend e5 with the classic chain (c3 then b4 or Nf3/Bd3).',
              'Black piles up.',
              'Develop and defend e5 again.',
              'Black pressures d4/e5.',
              'The key bishop: protects e4/e5 ideas and aims at h7.',
              'Black trades.',
              'You have the space; the game plays itself: Ne2, Be3, f4 squeeze.']
          },
          {
            name: 'vs Caro-Kann 2...c6',
            moves: ['e4', 'c6', 'd4', 'd5', 'e5', 'Bf5', 'Nf3', 'e6', 'Be2', 'c5', 'Be3', 'Qb6', 'O-O', 'Nc6'],
            notes: ['', 'The Caro: Black wants a safe game.',
              'Grab the full center immediately.',
              'Black challenges.',
              'Push past — space. This is the Advance/Caro-Kann structure you should know cold.',
              'Black develops the "problem bishop" before locking it in — good move by them.',
              'Develop.',
              'Black builds a wall.',
              'Simple: keep the king safe and prepare c4 or Nc3.',
              'Black fights for the center.',
              'Develop and connect.',
              'Black eyes b2.',
              'Castle. Then c4! is your plan to crack the center, and Ne1-c2/g3.'
            ]
          },
          {
            name: 'vs Scandinavian 2...d5',
            moves: ['e4', 'd5', 'exd5', 'Qxd5', 'Nc3', 'Qa5', 'd4', 'Nf6', 'Nf3', 'c6', 'Bc4', 'Bf5', 'Bd2', 'e6'],
            notes: ['', 'A free pawn offer — do not be greedy beyond one.',
              'Just take it.',
              'Black\'s queen comes out early — free development for you.',
              'Develop AND attack the queen. This is why 2.Qxd5 is bad for Black.',
              'The queen runs; every move you gain time.',
              'Full center.',
              'Black develops.',
              'Develop.',
              'Black makes a home for the queen.',
              'Point at f7 again.',
              'Black blocks the f7 ideas.',
              'Calm development — you are already better because Black wasted 3 queen moves.']
          },
          {
            name: 'vs Pirc / Modern 2...d6 or 2...g6',
            moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Nf3', 'Bg7', 'Be2', 'O-O', 'O-O', 'c6'],
            notes: ['', 'Black concedes the center — take it all.',
              'Take it.',
              'Black develops.',
              'Develop.',
              'Black fianchettoes.',
              'Develop.',
              'The long-diagonal bishop is Black\'s only real piece — keep it passive.',
              'Simple, flexible. (Bc4/c3-h3 plans also work.)',
              'Black castles.',
              'Castle. You have the center, Black has a slightly sad position — then play for a kingside push with h3/Be3/Qd2 and e5 ideas.',
              'Black prepares ...b5 expansion.']
          }
        ],
        traps: [
          { name: 'Scholars-style trap is for YOU to punish, not to play — never go for 4-move tricks at district level. The trap list in the Codex shows what to expect FROM opponents.' }
        ]
      }
    ],
    black: [
      {
        id: 'b-italian', name: 'Black vs 1.e4 — Sharp Italian (3.Bc4)', side: 'black', priority: 1,
        vs: '1.e4 e5 2.Nf3 Nc6 3.Bc4 — the most common thing you will face',
        why: 'You get an active, easy position with a simple plan: ...d6, ...Be7 or ...Bc5, castle, then ...Na5/...Nf6 to hit the bishop or ...Bg4 to pin.',
        lines: [
          {
            name: 'Main: develop normally, castle, hit the center',
            moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3', 'd6', 'O-O', 'O-O', 'Re1', 'a6', 'Bb3', 'Ba7'],
            notes: ['', 'Claim your share of the center immediately.',
              'White attacks e5 — defend it with a developing move.',
              'Best: develop and defend e5 at the same time.',
              'White eyes f7.',
              'Best square: active, safe, fights for d4.',
              'White prepares d4.',
              'Develop. (Move 4...Nf6 first is also fine.)',
              'White keeps it small.',
              'Needed: the center must stay under control, and ...Be6/...Ne7 ideas follow.',
              'White castles.',
              'You castle too — now your king is safe and the game is even. This is your comfort zone.',
              'White piles up on the e-file.',
              'The small but important move: your bishop gets a bolt-hole and b5/b4 expansion is coming.',
              'White steps aside.',
              'The bishop sits on a beautiful diagonal: it watches f2 and d4 forever.']
          },
          {
            name: 'vs 3.Bb5 — the Ruy Lopez: safe and solid',
            moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O'],
            notes: ['', '', 'White attacks your c6 knight (the defender of e5).',
              'The main move: ask the question immediately.',
              'Retreat or trade — you force White to decide.',
              'Develop and hit e4. Now you have both center control and development.',
              'White retreats.',
              'Simple development. (The Open 3...Nf6 without ...a6 is sharper — avoid, someone will know it.)',
              'White defends e4.',
              'Solid. Your plan: ...O-O, ...h6, ...Re8, ...Bf8/g7, and play ...d5 at the right moment.',
              'Small but necessary: your bishop gets its square. (Also d5-ideas.)',
              'White steps back.',
              'Control the center. Notice your structure is rock solid — a perfect district-level recipe.',
              'White prepares d4.',
              'CASTLE. Done: you have a safe king, all the pieces have good squares, and White has no attack.']
          },
          {
            name: 'vs the Scotch 3.d4 — the easy equalizer',
            moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Bc5', 'Be3', 'Qf6'],
            notes: ['', '', '', 'The Scotch: White frees the position early.',
              'Take the pawn — you get a fair trade and a free developing move.',
              'Recapture.',
              'Attack the knight AND develop.',
              'White defends/offers a trade.',
              'Best: centralize the queen and create double-attack threats on d4/f2 (attacking the knight and the bishop on e3 once it moves). Do not be scared — the queen is safe here.']
          },
          {
            name: 'vs King\'s Gambit 2.f4 — accept, then hit back with ...d5',
            moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'd5', 'exd5', 'Nf6', 'Bc4', 'Nxd5'],
            notes: ['', '', 'The old King\'s Gambit: White gives a pawn for the center.',
              'Take it. Do not be romantic — take the pawn and hit back.',
              'Development and threat on e4.',
              'The key counter: hit the e4 pawn immediately, do not let White build a monster center.',
              'Forced-ish trade.',
              'You activate everything, hitting d5/e4/d4.',
              'White tries to attack f7.',
              'The knight is active and your position is healthy — you are up a pawn with zero danger.']
          },
          {
            name: 'vs the Fried Liver attempt (4.Ng5) — the cold shower: ...d5!',
            moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Na5', 'Bb5+', 'c6', 'dxc6', 'bxc6'],
            notes: ['', '', '', '', 'White aims at f7 and wants a wild attack.',
              'THE move: counterattack the center. Do not panic, do not defend passively.',
              'The knight must take (or Black is better immediately).',
              'The precise square: chase the bishop while keeping an eye on c4/b3.',
              'White checks to gain time.',
              'Block with tempo (attacks nothing, but frees the c6 square and you recapture).',
              'White trades.',
              'You take back with the b-pawn: your structure is fine, you are up a piece for two pawns with a safe king. This is your answer to 90% of "attacking juniors".']
          }
        ],
        traps: [
          { name: 'If White ever plays Ng5/Bxf7 tricks, remember: ...d5 first, always!' },
          { name: 'Never play ...Nd4 (the Blackburne Shilling) unless you have studied it — see the Codex trap page.' }
        ]
      },
      {
        id: 'b-d4', name: 'Black vs 1.d4 / 1.c4 — the Stone Wall Setup', side: 'black', priority: 1,
        vs: '1.d4, 1.c4, 1.Nf3, 1.g3 — basically everything else',
        why: 'The same 6 moves work against almost anything: ...d5, ...Nf6, ...e6, ...Be7/...Bd6, ...O-O, ...c5. Zero theory, one plan. If you are a nervous Black player, this alone saves you from losing in the opening.',
        lines: [
          {
            name: 'The universal setup (memorize these 6 moves)',
            moves: ['d4', 'd5', 'Nf3', 'Nf6', 'e3', 'e6', 'Bd3', 'Be7', 'O-O', 'O-O', 'c4', 'c5'],
            notes: ['', 'Take your share of the center.',
              'White develops (1.Nf3).',
              'Develop and control e4/d5.',
              'Quiet (this is the Colle-ish setup).',
              'Solid: frees the bishop, protects d5.',
              'White points at h7.',
              'Perfectly safe — the bishop on e7 is doing its job. (...Bd6 first is also fine, inviting the trade.)',
              'White castles.',
              'CASTLE. Now everything is set.',
              'White grabs space.',
              'The break: hit White\'s center and open the position for your pieces. Your whole plan in one move.']
          },
          {
            name: 'vs the London System (Bf4) — build the wall, trade, then ...c5',
            moves: ['d4', 'd5', 'Bf4', 'Nf6', 'e3', 'e6', 'Nf3', 'c5', 'c3', 'Nc6', 'Bd3', 'Bd6', 'Bxd6', 'Qxd6', 'Nbd2', 'O-O'],
            notes: ['', 'Center.',
              'The London — the most common club system on earth.',
              'Develop and control the key squares.',
              'White keeps it slow.',
              'Free your bishop and shore up d5 — the same wall as always.',
              'White develops.',
              'The break. You are NOT passive: this hits d4 and opens lines for your pieces.',
              'White supports d4.',
              'Develop, adding a second attacker to d4.',
              'White points at h7.',
              'The bishop comes out (now that e7 is free) and offers the trade.',
              'White accepts — good for you: it relieves your position and you get the open d-file ideas.',
              'Recapture with the queen: she is active and looking at b4/b2 themes later.',
              'White develops the last piece.',
              'You castle. Now your plan is clear: ...cxd4 at the right moment, ...Rac8, ...Rfd8, ...Ne4 — Black is at least equal and club players score well here because the plan is simple and White\'s attack is non-existent.']
          },
          {
            name: 'vs 1.c4 (English) — take the center',
            moves: ['c4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Nf3', 'Be7', 'Bf4', 'O-O', 'e3', 'c5'],
            notes: ['', 'The English: White plays on the queenside... you play on the center.',
              'Quiet and correct.',
              'Center.',
              'Space.',
              'Develop.',
              'Develop, prepare ...dxc4 and ...b6/Bb7.',
              'Now it transposes to a normal QGD — transposition is your friend.',
              'Solid.',
              'Castle.',
              'White is careful.',
              'Same plan as always: hit the center. You have equalized without knowing any theory.']
          }
        ],
        traps: [
          { name: 'The setup survives almost anything — but always check: does White have a pawn on c4 attacking d5, and can you safely take? Only ...dxc4 if you can handle ...Qa4+ ideas.' }
        ]
      }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = R;
  else (typeof window !== 'undefined' ? window : globalThis).CONTENT_OPENINGS = R;
})();
