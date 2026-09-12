/* BEAST CHESS — TRAP LIBRARY (every line machine-verified by tools/gen-content.js) */
(function () {
  var TRAPS = [
    {
      id: 'scholars', name: "Scholar's Mate (the 4-move illusion)", danger: 5, who: 'Both colours — you WILL see this at district level',
      trapLine: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'Nf6', 'Qxf7#'],
      blunderAtPly: 6, blunderMove: 'Nf6', antidoteLine: ['e4', 'e5', 'Bc4', 'Nc6', 'Qh5', 'g6', 'Qf3', 'Nf6'],
      explanation: 'White sends the queen and bishop at f7. The ONLY defender that matters is the pawn... there is no pawn — f7 is guarded by the king and the rook, but the queen attacks it protected by the bishop. If Black defends e5 with the natural-looking ...Nf6, Qxf7 is instant mate.',
      antidote: 'Defend e5 with a move that does NOT block the f7 escape: 2...Nc6 first, then after Qh5 play ...g6! The queen must retreat (Qf3/Qd1) and THEN you develop ...Nf6. You gain time and White\'s attack is dead. Never play ...Nf6 while Qh5 is on the board unless f7 is covered.',
      lesson: 'f7/f2 is the weakest square in the opening — count attackers on it before every move.'
    },
    {
      id: 'fools', name: "Fool's Mate — the 2-move disaster", danger: 5, who: 'White must never do this',
      trapLine: ['f3', 'e5', 'g4', 'Qh4#'],
      blunderAtPly: 3, blunderMove: 'g4', antidoteLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
      explanation: 'White pushes f3 and then g4, opening the e1-h4 diagonal. Black\'s queen delivers mate on move 2. This is the purest illustration of the f-pawn/g-pawn rule: pushing the pawns in front of your king opens the road to your own king.',
      antidote: 'Never push f3/g4 (or f6/g5) while your king sits on e1/e8. Develop e4/d4 and castle. If you ever feel the urge to play f3 — play e4, Nf3, or castle instead.',
      lesson: 'Your king\'s pawn shield is armour. Do not open it voluntarily.'
    },
    {
      id: 'legal', name: "Légal's Mate (the 250-year-old queen sacrifice trap)", danger: 4, who: 'White traps Black',
      trapLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'Nc3', 'Bg4', 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'],
      blunderAtPly: 10, blunderMove: 'Bxd1', antidoteLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'd6', 'Nc3', 'Bg4', 'Nxe5', 'Nxe5'],
      explanation: 'White deliberately leaves the queen on d1 for the taking. If Black grabs it (Bxd1), White unleashes Bxf7+ Ke7 Nd5# — a beautiful double-checkmate where the black king suffocates in the center of the board.',
      antidote: 'When you see a FREE queen in the opening — stop. Calculate the checks first. Here Black must simply take the knight (Nxe5) and after Qxg4/dxe5 the game is normal and equal.',
      lesson: 'Nothing in the opening is "free". Before grabbing material, list every check your opponent has.'
    },
    {
      id: 'shilling', name: 'Blackburne Shilling Gambit (the 3...Nd4 trap)', danger: 4, who: 'Black traps White',
      trapLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4', 'Nxe5', 'Qg5', 'Nxf7', 'Qxg2', 'Rf1', 'Qxe4+', 'Be2', 'Nf3#'],
      blunderAtPly: 7, blunderMove: 'Nxe5', antidoteLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4', 'Nxd4', 'exd4', 'O-O'],
      explanation: 'Black offers a pawn on e5 to lure you into grabbing. After Nxe5?! Qg5! Black attacks f7 and g2 simultaneously and the attack plays itself — the final position is a picturesque mate with the knight on f3.',
      antidote: 'Do not take the bait. Simply 4.Nxd4 exd4 5.O-O. You get a clean development advantage while Black\'s "attack" evaporates — a pawn on d4 with no follow-up is just a weak pawn.',
      lesson: 'A gambit pawn is bait on a hook. If you cannot calculate the whole attack, refuse it and develop.'
    },
    {
      id: 'stafford', name: 'Stafford Gambit — "Oh no my queen!"', danger: 3, who: 'Black traps White',
      trapLine: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6', 'Nxc6', 'dxc6', 'd3', 'Bc5', 'Bg5', 'Nxe4', 'Bxd8', 'Bxf2+', 'Ke2', 'Bg4#'],
      blunderAtPly: 11, blunderMove: 'Bg5', antidoteLine: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6', 'Nxc6', 'dxc6', 'Nc3'],
      explanation: 'The Stafford Gambit: Black gives a pawn for a raging initiative. If White develops carelessly with Bg5 and then greedily grabs the queen (Bxd8), Black mates in three moves: Bxf2+ Ke2 Bg4#. The queen was never the point.',
      antidote: 'Take the pawn but develop normally: 5.Nc3 (or 5.d3 then Nc3/Bd2). Never put the bishop on g5 in this line, and NEVER take a queen when your king is still on e1 with the black bishops raining down. Defend f2 first.',
      lesson: 'The most expensive piece is the one you cannot recapture. Safety of the king beats material, always.'
    },
    {
      id: 'friedliver', name: 'Fried Liver Attack (4.Ng5) — the classic junior attack', danger: 4, who: 'White attacks; Black must know the antidote',
      trapLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7', 'Kxf7', 'Qf3+'],
      blunderAtPly: 10, blunderMove: 'Nxd5', antidoteLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Na5', 'Bb5+', 'c6', 'dxc6', 'bxc6'],
      explanation: 'If Black defends routinely with 5...Nxd5, White plays the Fried Liver: Nxf7! Kxf7 Qf3+ with a brutal attack on the exposed king. In practice this wins many games at junior/club level.',
      antidote: 'The cold shower: 5...Na5! (not Nxd5). Black kicks the bishop and after 6.Bb5+ c6 7.dxc6 bxc6 Black is a piece for two pawns with a safe king — and White\'s attack never happens.',
      lesson: 'Against an attacker, counterattack a bigger piece (the bishop) instead of defending passively.'
    },
    {
      id: 'damiano', name: "Damiano's Defence — never defend e5 with ...f6", danger: 3, who: 'White punishes Black',
      trapLine: ['e4', 'e5', 'Nf3', 'f6', 'Nxe5', 'fxe5', 'Qh5+', 'Ke7', 'Qxe5+', 'Kf7', 'Bc4+', 'd5', 'Bxd5+', 'Kg6', 'h4'],
      blunderAtPly: 4, blunderMove: 'f6',
      antidoteLine: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd3', 'Nf6'],
      explanation: 'Black defends the e5 pawn with the f-pawn — the single worst idea in the open game. White simply takes twice and starts checking: Nxe5! fxe5 Qh5+ Ke7 Qxe5+ Kf7 Bc4+ d5 Bxd5+ Kg6 and the black king is dragged out to the middle of the board while every white piece arrives with tempo. This attack plays itself — which is exactly why you must never do it.',
      antidote: 'Defend e5 with a PIECE, never the f-pawn: ...Nc6 (best), ...d6 (Philidor), or ...Nf6 when it is safe. If your ...f6/...f5 is ever the only defence, you have already made an opening mistake — accept a slightly worse position and keep your king safe.',
      lesson: 'The f-pawn is the guardian of your king. Do not use it as a defender in the opening.'
    },
    {
      id: 'elephant', name: 'The Elephant Trap (QGD 6.Nxd5??)', danger: 4, who: 'Black traps White',
      trapLine: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'cxd5', 'exd5', 'Nxd5', 'Nxd5', 'Bxd8', 'Bb4+', 'Qd2', 'Bxd2+', 'Kxd2', 'Kxd8'],
      blunderAtPly: 11, blunderMove: 'Nxd5',
      antidoteLine: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'e3', 'Be7'],
      explanation: 'The oldest trick in the Queen\'s Gambit Declined. White grabs the pawn on d5 and thinks the pin on the black queen wins — but after Nxd5! Nxd5 Bxd8 Bb4+! Black regains everything with a check, and White ends up with a broken position (kingside pawns wrecked, rook trapped).',
      antidote: 'Do not take on d5 with the knight while your bishop is pinning the queen. Play the normal moves (e3, Nf3, Bd3, O-O) and keep your good structure. The d5 pawn is not going anywhere.',
      lesson: 'When your piece is pinning something, be suspicious of captures that "win" the pinned piece — it is the classic deflection setup.'
    },
    {
      id: 'englund', name: 'Englund Gambit (1.d4 e5?! and ...Qb4+)', danger: 3, who: 'Black gambles vs 1.d4',
      trapLine: ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7', 'Bf4', 'Qb4+', 'Bd2', 'Qxb2', 'Bc3', 'Bb4', 'Qd2', 'Bxc3', 'Qxc3', 'Qc1#'],
      blunderAtPly: 11, blunderMove: 'Bc3',
      antidoteLine: ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7', 'Qd5', 'f6', 'exf6', 'Nxf6', 'Qb3'],
      explanation: 'The Englund Gambit is a pure trap: Black gives a pawn, hops the queen into b4, and if White defends carelessly (5.Bd2 Qxb2 6.Bc3?!) the queen cleans up and mates on c1. This trap decides a shocking number of club games.',
      antidote: 'The engine-approved refutation: 4.Qd5! (attacking the black knight AND the f7 pawn) 4...f6 5.exf6 Nxf6 6.Qb3 — you are a pawn up with a safe king and the black queen is exposed. Also fine: 4.Bf4 Qb4+ 5.Qd2 (not Bd2!) and just be solid. Never allow ...Qxb2 and then defend with the bishop on c3.',
      lesson: 'You do not have to defend the check with a "natural" move. Look for checks and counter-threats first — and count the b2/c2 trap squares.'
    },
    {
      id: 'qgatrap', name: 'Queen\'s Gambit Accepted — the b5 blunder', danger: 3, who: 'White punishes Black',
      trapLine: ['d4', 'd5', 'c4', 'dxc4', 'e3', 'b5', 'a4', 'c6', 'axb5', 'cxb5', 'Qf3'],
      blunderAtPly: 6, blunderMove: 'b5',
      antidoteLine: ['d4', 'd5', 'c4', 'dxc4', 'e3', 'e5', 'Bxc4', 'exd4', 'exd4'],
      explanation: 'Black tries to cling to the c4 pawn with ...b5, but after a4! the b5-pawn is overloaded: it cannot defend the c4 pawn any more. Qf3 hits the rook on a8 and the c4 pawn at the same time — Black loses material for nothing.',
      antidote: 'If you take on c4 as Black, give the pawn back at the right moment: ...e5 (or ...Nf6 and ...e6) and develop. Fighting to keep a gambit pawn with pawn moves is how you lose the game.',
      lesson: 'Grabbing and holding a gambit pawn with pawn moves creates more weaknesses than it is worth. Return it for development.'
    }
  ];

  var OUT = { traps: TRAPS };
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
  else (typeof window !== 'undefined' ? window : globalThis).CONTENT_TRAPS = OUT;
})();
