/* BEAST CHESS — WINNING STRATEGIES CODEX
   The complete playbook: fundamentals, tactics, defense, endgames, strategy, psychology.
*/
(function () {
  var CARDS = [
    /* ---------------- FUNDAMENTALS ---------------- */
    {
      id: 'checklist', group: 'fundamentals', title: 'The 6-Question Blunder Firewall', subtitle: 'The single most valuable habit in this entire course',
      star: true,
      body: 'This is the ritual that turns a 1000 player into a 1400 player almost overnight. Before you touch a piece, run these 6 questions. Every move. Even when you think it is obvious — especially then. Most district-level games are lost by one careless move in a "quiet" position.',
      questions: [
        'What did his LAST MOVE attack or threaten? (Look at the piece he moved: what does it now hit?)',
        'Is anything of mine hanging? Count his attackers vs my defenders on every piece and pawn.',
        'Can I give a check — and does it actually improve my position? (Checks are not automatically good.)',
        'Can I capture something? Is it REALLY free? What recaptures, and what happens after?',
        'If I play my intended move, what is HIS best reply? (Play his move in your head first.)',
        'After my move: is my king safe, and is every piece defended?'
      ],
      do: ['Run it on every move', 'Spend 2 extra minutes when a capture or check is available', 'Say it out loud in training until it is automatic'],
      dont: ['Never play "instinctively" in a position with captures on the board', 'Never rush because your opponent moved fast'],
      trains: 5
    },
    {
      id: 'center', group: 'fundamentals', title: 'The Four Opening Golden Rules', subtitle: 'Opening play reduced to 4 rules you can always follow',
      body: 'You do not need opening theory at district level. You need these four rules, executed ruthlessly, every game.',
      questions: [
        'Take the center with pawns (e4/d4 as White; e5/d5 as Black). The center is the high ground — pieces there control more squares.',
        'Develop knights and bishops toward the center — one new piece per move. Never move the same piece twice in the opening.',
        'Castle by move 6-10. King safety beats every material temptation. A king in the center loses games.',
        'Do not bring your queen out early. She becomes a target and you lose time. (Your opponent will break this rule — punish it!)'
      ],
      do: ['Develop with a threat when possible', 'Connect your rooks', 'Fight for open files by move 12'],
      dont: ['Do not grab pawns in the opening with the queen', 'Do not move pawns in front of your castled king without a real reason', 'Do not "attack" with 2 pieces against 4 defenders'],
      trains: 8
    },
    {
      id: 'material', group: 'fundamentals', title: 'Material Values + The Counting Rule', subtitle: 'How to never lose a piece again',
      body: 'Pawn = 1, Knight = 3, Bishop = 3, Rook = 5, Queen = 9, King = priceless. In the opening and middlegame the bishop is usually worth slightly more than the knight (3.25 vs 3). Count BEFORE every capture: how many of my pieces attack this square, how many of his defend it, and what is the value sequence?',
      questions: [
        'Same number of attackers as defenders? Then the exchange must WIN material or improve your position — otherwise do not start it.',
        'Attacker-counting example: his knight on d5 is defended once. You attack it twice (say Nc3 + e4). If you take twice and he recaptures once, you win a piece — but only if your second attacker is not hanging or if recaptures are safe. Always continue the sequence to the end.',
        'A pawn in the endgame is worth much more than 1 (up to 3-4 in rook endings). Do not judge with opening values in the endgame.',
        'Two minor pieces (6) are usually stronger than a rook + pawn (6) in the middlegame. The bishop pair is worth about half a pawn.',
        'The exchange (rook for bishop/knight) is worth roughly 1.5-2 pawns — good when you have a position to exploit.'
      ],
      do: ['Count attackers and defenders every single time', 'Prefer winning a clean pawn to a complicated "maybe"'],
      dont: ['Do not trade when you are losing — the losing side should keep pieces on', 'Do not give up the bishop pair for nothing'],
      fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
      trains: 6
    },

    /* ---------------- TACTICS (the money) ---------------- */
    {
      id: 'fork', group: 'tactics', title: 'THE FORK / DOUBLE ATTACK', subtitle: 'Attack two things at once — one of them cannot run',
      body: 'A fork attacks two (or more) enemy units with one piece. The opponent can only save one. Knights are the fork kings (they attack 8 squares and are hard to see). Pawns fork surprisingly often. Queens fork constantly — look for any check that also hits a piece.',
      questions: [
        'Knights: look for ANY enemy pieces 2+1 squares away from each other. A knight placing itself in the middle hits both.',
        'Royal fork: a knight check that also attacks the queen or a rook. This is the #1 tactic that decides club games.',
        'Pawn forks: two pieces on adjacent files, one rank apart, are fork targets for a pawn advance.',
        'The move BEFORE the fork: the fork is usually not the first move — set it up (a check, a threat, a capture) that forces them into the fork.',
        'Defence: after every enemy knight move, ask "what is now forked?" and check if any of your pieces can be hit next move.'
      ],
      do: ['Scan for forks whenever your knight can move forward', 'Look for the CHECK that also attacks something', 'Watch for the pawn push that forks two pieces'],
      dont: ['Do not fork into a square where the forking piece is simply captured for free', 'Do not forget he can respond with a COUNTER-fork'],
      fen: 'r3k3/8/4N3/8/8/8/8/4K3 w - - 0 1',
      trains: 7
    },
    {
      id: 'pin', group: 'tactics', title: 'THE PIN', subtitle: 'Freeze it first, harvest it later',
      body: 'A pin is a piece that cannot move because something more valuable sits behind it. Absolute pin = behind it is the king (the piece is literally frozen). Relative pin = behind it is a queen/rook (moving loses material). A pinned piece is not defending! That is how you win material from pins.',
      questions: [
        'The attack-pattern: put a bishop on g5 (pinning Nf6 to the queen) or a bishop on b5 (pinning Nc6 to the king), then pile up: add more attackers on the pinned piece.',
        'The killer combo: the pinned piece is not defending, so any piece it "defends" is actually loose. Example: knight f6 pinned by Bg5 is not defending d5/h5/e4 → you can grab those pawns.',
        'Break an absolute pin only with a purpose: a counter-check, a mate, or a capture that wins material.',
        'Escape hooks: if someone pins your piece, either add a defender, attack the pinning piece, break the line by moving a piece to the square between, or counter-attack.',
        'The "pin-and-win" pattern: pile up on the pinned piece with a pawn (c3 + Qb3, Nc3, etc.) until it simply falls.'
      ],
      do: ['Ask after every enemy bishop/rook move: what is now pinned?', 'Exploit with the pawn — pawns attack for free'],
      dont: ['Do not "attack" a pinned piece with pieces only, if a pawn can do it', 'Do not allow your own pieces to be pinned to your queen and just wait — counterattack the pinner'],
      fen: 'rnbqkb1r/ppp1pppp/5n2/3p2B1/3P4/2N5/PPP1PPPP/R2QKBNR b KQkq - 5 3',
      trains: 7
    },
    {
      id: 'skewer', group: 'tactics', title: 'THE SKEWER', subtitle: 'A pin backwards — hit the big piece, win the small one',
      body: 'The skewer is a reverse pin: you attack a valuable piece (usually the king or queen) which MUST move, and a piece behind it falls. Check the long lines: rooks and bishops love skewers, and they happen along files, ranks and diagonals.',
      questions: [
        'Most common: check the king along a rank/file/diagonal — when it steps aside, capture the queen or rook behind it.',
        'Setting it up: get your rook or bishop on the same line as king + queen with nothing in between. If there is something in between, remove it with a sacrifice.',
        'Queen and king lined up on the same line = win the queen. Look for it after every king move your opponent makes.',
        'Also works against a king that has just castled: your bishop on the long diagonal + his king + his rook on the same diagonal.',
        'Defence: do not line your king and queen up. When checked by a rook/bishop that also attacks your queen — interpose with something (you may save the queen or lose it cleanly).'
      ],
      do: ['Always check lines: king behind a piece, queen behind a piece', 'Move your attacked big piece; do not "defend" it if the skewer is coming'],
      dont: ['Do not put your own queen directly behind your king on a line', 'Do not overlook that the skewered king can sometimes capture your checking piece'],
      fen: '8/8/8/q3k3/8/8/8/6KR w - - 0 1',
      trains: 6
    },
    {
      id: 'discovered', group: 'tactics', title: 'DISCOVERED ATTACK & DOUBLE CHECK', subtitle: 'One piece moves, two attacks land',
      body: 'A discovered attack is the chess free lunch: your piece was blocking another of your pieces. When the front piece moves (usually with a capture or threat of its own), the piece behind it suddenly attacks something enormous — often the king. You get a "free" move, because they must deal with the discovered attack.',
      questions: [
        'Discovered CHECK is the strongest: they MUST answer the check, so whatever your moving piece just captured is untouchable. Free material.',
        'Double check (moved piece + revealed piece both check) — the king MUST move. No blocking, no capturing. This is usually a mating net.',
        'Set it up: line your rook/queen/bishop up with their king, put a piece (knight or bishop) in between pointing at a juicy target, then move that piece with gain.',
        'Classic patterns: Nd5 + Bb2 on the long diagonal; Nf5/Nd5 with a rook on the e-file; a knight in front of a bishop on the same diagonal.',
        'Defence: do NOT casually allow a knight/bishop in front of your opponent\'s rook/queen with targets behind. Watch the line before it becomes a discovery.'
      ],
      do: ['Look at your own blocked lines every move — what is hidden behind my knight?', 'Prefer discoveries that come with CHECK'],
      dont: ['Do not ignore discovered checks from your opponent that also capture material'],
      fen: 'k7/3q4/8/8/B7/8/8/R3K3 w - - 0 1',
      trains: 6
    },
    {
      id: 'removedefender', group: 'tactics', title: 'REMOVE / DEFLECT THE DEFENDER', subtitle: 'Kill the guard, take the treasure',
      body: 'Every attacked piece has a keeper. If you can eliminate, distract, or overload the keeper, the piece falls. This is the highest-level tactical motif and it appears in nearly every combination: capture the defender, pin it, decoy it away, or attack something it must defend.',
      questions: [
        'Capture the defender: if the piece defending your target can be taken (even with a sacrifice), calculate it.',
        'Decoy/deflect: force the defender away with a sacrifice or a threat. "Overloaded" defenders are the classic: a queen defending two pieces cannot do both.',
        'Pin the defender: if the keeper is pinned, it cannot guard.',
        'Attack a bigger prize: if his rook defends his queen, attack the rook and the queen falls.',
        'Set it up with a CHECK: checks are the best way to force the defender to move away, because they are forced replies.'
      ],
      do: ['Before every capture, list who defends the target and how to remove them', 'Use checks and threats as the can-opener'],
      dont: ['Do not attack a defended target with pieces alone — first ask "who is guarding it?"'],
      trains: 7
    },
    {
      id: 'backrank', group: 'tactics', title: 'BACK-RANK MATE & THE CASTLED KING\'S SOFT SPOT', subtitle: 'The most common mate at club level — see it in both directions',
      body: 'A castled king behind three unmoved pawns has a hidden weakness: the back rank. Any rook or queen that reaches the 8th rank (or 1st) mates instantly if there is no escape square. This is why you should make "luft" (h3/h6 or g3/g6) at a quiet moment.',
      questions: [
        'Attack: double your rooks on the back rank, or deflect the defender with a sacrifice (e.g. Rxe8+ forcing the rook away from guarding the rank).',
        'The classic sacrifice: a rook or queen sacrifice that removes the last defender of the back rank — then your second rook delivers mate.',
        'Defence: play h3/h6 or g3/g6 early enough. Keep one of your own pieces on your back rank, or keep your queen on the e1/d1 square able to interpose.',
        'Do not move your h-pawn recklessly — that weakens the very spot the back rank weakness lives.',
        'In the endgame a lone rook behind the enemy king is often enough: combine with a passed pawn or a strong piece and the back rank becomes fatal.'
      ],
      do: ['Give yourself luft (h6/h3/g6/g3) once development is complete', 'When the enemy king is castled — count the escape squares every single move'],
      dont: ['Do not trade all your pieces and leave your rook alone defending the back rank', 'Do not ignore a rook that reaches your 8th rank'],
      fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
      trains: 8
    },
    {
      id: 'zwischenzug', group: 'tactics', title: 'THE IN-BETWEEN MOVE (Zwischenzug)', subtitle: 'The sneaky move that wins material — always check it',
      body: 'You see a capture, you recapture automatically — and you lose. In-between moves (checks, bigger captures, threats) insert themselves into the sequence and change everything. Before every recapture, ask: "Is there something better I can do first?"',
      questions: [
        'You expect a recapture — but instead play a CHECK first, then recapture on your terms (often winning extra material).',
        'A bigger capture first: "if I take his queen now while his piece is still en prise, then take the other piece — I win both!"',
        'Defensive zwischenzug: before recapturing, play a defensive move that stops his follow-up.',
        'Always check-in-first during long forcing sequences: checks are the most forcing moves and change the move order.',
        'This is where a district player wins most material from class-level opponents: the automatic recapture that isn\'t forced.'
      ],
      do: ['Before recapturing, look for a check or a bigger capture', 'Calculate the WHOLE sequence, not just the next hit'],
      dont: ['Never recapture automatically without one second of thought', 'Do not insert a zwischenzug that leaves you worse — calculate it'],
      trains: 6
    },

    /* ---------------- DEFENSE ---------------- */
    {
      id: 'kingsafety', group: 'defense', title: 'King Safety: The Shield and the F-Pawn Trap', subtitle: 'Lose the shield, lose the game',
      body: 'The 3 pawns in front of your castled king are armour. Every one you push is a crack in it. The f-pawn is the most dangerous one to push — moving it opens the diagonal to the king and creates the classic Bd3/Be2 + Qh5 style attacks (Fool\'s mate is the extreme version).',
      questions: [
        'Keep the pawn shield intact unless you have a concrete reason (e.g. kicking a strong piece or creating a passed pawn).',
        'Never play f3 or f6 while your king is castled on that side unless forced. It is the #1 way club players get mated.',
        'Choose your castling side based on where the enemy pawn chain is pointing. Attacking pieces aim at your king — put it where pawns are still healthy.',
        'Watch for the "Greek gift": Bxh7+ sacrifices. If you see the enemy bishop pointing at h7/h2 and the queen and knight ready — check every single line before it lands.',
        'Count attackers vs defenders around your king at all times. 3 attackers vs 2 defenders = you are in danger. Defend, trade an attacker, or open an escape route.'
      ],
      do: ['Castle early and keep your king\'s pawns home', 'Trade off the piece that is its best attacker'],
      dont: ['Do not open the center while your own king is still uncastled', 'Do not "win" a pawn while your king\'s shield collapses'],
      trains: 7
    },
    {
      id: 'defenseprophylaxis', group: 'defense', title: 'Prophylaxis: Ask What He WANTS', subtitle: 'The habit that turns you into a hard player to beat',
      body: 'Most club players only ask "what do I want?" The moment you start asking "what does HE want?", you stop being surprised. This costs 5 seconds per move, and it saves you the game 3 times in a tournament.',
      questions: [
        'Before every move: what is his plan with his last move? Which square/piece is he aiming at?',
        'Prevent it cheaply — a quiet move that kills his idea is often stronger than your own plan.',
        'Look for his NEXT move that would hurt you the most, and assume he will play it.',
        'Keep a piece on your weak colour square (the colour of the squares your pawns do not control). Most club attacks come through the weak square complex.',
        'If you cannot stop his plan, make your threats bigger. Counterplay is the best defense.'
      ],
      do: ['Say out loud every move: "his idea is ___"', 'Take the defensive move that also improves your position'],
      dont: ['Do not play a "quiet move" without checking his threats first', 'Do not defend passively if you can counterattack'],
      trains: 6
    },
    {
      id: 'trapsdefense', group: 'defense', title: 'Trap Insurance: The 10 Classic Traps You MUST Know', subtitle: 'Know them from BOTH sides — see the Trap Library tab',
      body: 'Every district tournament has that one player who wins with 5-move traps. If you know them, he is not a threat — he is a free point (you get a better position by refusing). And when your opponent plays loosely, you can use two or three of the safe traps yourself. The full interactive library is in the Trap Library tab.',
      questions: [
        'Learn the FIRST MOVE of each trap and the correct, safe response',
        'Never play "natural" defensive-looking moves against early queen/knight sorties — calculate the cheap mates first (f7/f2 is the soft spot)',
        'If your opponent casts a "mouse-trap" (e.g. Nd4 shilling gambit, the Fishing Pole, the Légal), the antidote is always: develop calmly, give the attacked piece a safe square, and castle',
        'Remember the Scholar\'s defence: after 1.e4 e5 2.Qh5, play 2...Nc6! first (not Nf6), then 3...g6 and 4...Nf6 — you win time and the queen must retreat',
        'Then: when ahead on development, take control of the center and the cheap tricks dry up'
      ],
      do: ['See the Trap Library and play each one on the board', 'Practise the safe replies until they are automatic'],
      dont: ['Do not fall for "but everyone plays that" moves — calculate!'],
      trains: 5
    },

    /* ---------------- ENDGAME ---------------- */
    {
      id: 'egmating', group: 'endgame', title: 'Basic Mates: Q, R, Two Rooks, Two Bishops', subtitle: 'Drill them until they are reflex — never stalemate again',
      body: 'Learn the techniques, then drill them in the Endgame Lab. These are guaranteed points when you are ahead.',
      questions: [
        'K+Q vs K: bring your king close (or the queen a knight-move away), drive the enemy king to the edge with the queen, then use a "knight-distance" waiting move to avoid stalemate, bring the king, mate. Never follow the king with the queen (that is how you stalemate).',
        'K+R vs K: the Ladder/Box method — cut the king off with a rook wall, then shrink the box, then check when the kings are facing. This is a guaranteed mate in under 15 moves.',
        'Two rooks: the ladder mate — one rook cuts the rank, the other checks along the next rank. Roll it up the board.',
        'Two bishops: bishops on adjacent diagonals create a net that the king cannot cross. Drive to the corner, king follows, then mate.',
        'STALEMATE IS THE ONLY DANGER: when the enemy king has no legal moves and it is HIS move without check — it is a draw. Always give the enemy king a spare square until your own king arrives.'
      ],
      do: ['Bring the king — the pieces just push, the king checkmates', 'Check every move: does my opponent still have a legal move?'],
      dont: ['Do not make "quiet" moves when the enemy king is confined to the corner — use checks or a tempo move with the king'],
      fen: '8/8/8/4k3/8/8/8/K6Q w - - 0 1',
      trains: 9
    },
    {
      id: 'egpawn', group: 'endgame', title: 'King + Pawn vs King — Key Squares & Opposition', subtitle: 'The most valuable endgame lesson you will ever learn',
      body: 'A single extra pawn wins the game if you know where the king goes. Rule of thumb: the attacker needs to get his king IN FRONT of the pawn (2 squares ahead). The defender must get in front (blocking). Then it is a battle of "opposition" — the player NOT to move is the one who wins the square battle.',
      questions: [
        'KEY SQUARES: for a pawn on e4 the key squares are d6, e6, f6. If your king reaches any of them, the pawn promotes — the exact position does not matter.',
        'Once the pawn reaches the 5th rank (with the king in front), it wins on its own with "opposition": step your king to the side and give the defender the move.',
        'The DEFENDER draws when he reaches the queening square first (get in front, not behind). "Get in front of the pawn."',
        'THE SQUARE RULE (for when the king cannot support the pawn): draw an imaginary square from the pawn to its promotion square. If the enemy king is inside that square, he catches the pawn. If outside — the pawn runs home.',
        'Always be careful with the rook pawn (a/h pawns) — they only win if the defender\'s king is far away.',
        'In a race: count moves, not feelings. "If he takes my pawn, my pawn queens first."'
      ],
      do: ['Push the king forward first, then the pawn', 'Get in front of the pawn as the defender, and block'],
      dont: ['Do not push the pawn and leave the king behind — that is how won endings become draws'],
      fen: '8/8/8/4k3/4P3/4K3/8/8 w - - 0 1',
      trains: 9
    },
    {
      id: 'egrook', group: 'endgame', title: 'Rook Endgames: Lucena, Philidor & the Back Rank Rule', subtitle: 'The 2 positions that decide most real endgames',
      body: 'Rook endings are the most common in practice. Two positions decide them: LUCENA (you have the pawn — how to win) and PHILIDOR (you are defending — how to draw). Learn both and drill them.',
      questions: [
        'LUCENA (you have rook + pawn vs rook, pawn on 7th): use your rook to shield your king from checks — put the rook on the 4th rank, then walk the king out; the rook blocks the checks with its body ("building a bridge").',
        'PHILIDOR (you are defending rook vs rook+pawn): keep your rook on the 3rd rank (blocking the pawn) while the enemy king advances, then when the king attacks your rook, swing it to the back rank and check forever from behind.',
        'TARRASCH RULE: put your rook BEHIND the passed pawn — yours or his. Always, at the earliest opportunity.',
        'The passive defender loses: never sit behind your own pawns. The active rook draws.',
        'Rook + pawn vs rook: if the defender can reach the queening square, it is a draw unless the attacker can reach Lucena. Get your rook active!'
      ],
      do: ['Rook behind the passed pawn — always', 'Activate your rook in a losing position: check from behind'],
      dont: ['Do not put your rook in front of your own passed pawn', 'Do not trade rooks when you are the defender without checking the pawn ending is drawn'],
      fen: '1K1k4/1P6/8/8/8/8/8/2r4R w - - 0 1',
      trains: 9
    },
    {
      id: 'egprinciples', group: 'endgame', title: 'Endgame Principles: Simplify, King Up, Watch the Half-Point', subtitle: 'How to convert 100% of winning positions',
      body: 'You played a great game — now finish it. A winning position is not a win until the king is mated or the clock is stopped. Bank the point with method, not magic.',
      questions: [
        'TRADE PIECES, NOT PAWNS. If you have more material, every safe trade brings you closer to a trivially winning endgame.',
        'ACTIVATE YOUR KING. In the endgame the king is a 4-point attacking piece. Centralize it immediately.',
        'Watch the 50-move rule and repetition: if you are winning, do not repeat positions and do not wander. Make progress.',
        'Watch stalemate and cheap perpetuals: the enemy rook checking from behind is the classic swindle. Deal with it before pushing pawns.',
        'When you are still in the middlegame: always check whether the endgame you are heading to is actually better for you before trading. An extra outside passed pawn wins; a bad bishop loses.',
        'If you are worse, aim for opposite-coloured bishops or rook endings with an active rook — the most drawish structures in chess.'
      ],
      do: ['Trade into a simple win, use the king, and give a check when unsure', 'Keep the clock and count the half-point rule'],
      dont: ['Do not get greedy — winning by 1 pawn or by 5 pawns counts the same', 'Do not let the enemy rook get active with checks'],
      trains: 7
    },

    /* ---------------- STRATEGY / MIDDLEGAME ---------------- */
    {
      id: 'middlegame', group: 'strategy', title: 'Middlegame Plans: Files, Outposts, Weak Squares', subtitle: 'What to DO after the opening — the question that beats most club players',
      body: 'You are developed and castled. Now what? You need a PLAN. At club level, plans win games: most opponents just shuffle while you squeeze. Pick one of these plans every game.',
      questions: [
        'Find the weakest point in his camp (an isolated pawn, a backward pawn, a hole, a pinned piece) and attack it with everything.',
        'Rooks on open files: the first rook to an open file with two of your pieces supporting it is worth more than a pawn. Open the file with a pawn break.',
        'Outposts: a knight on a square that cannot be attacked by enemy pawns (e.g. on d5 or e5 protected by your pawn) is a monster. Plant it and build the attack around it.',
        'Improve your worst piece: look at your army, find the one piece doing nothing, and give it a job (that is what the Italian Nb1-d2-f1-g3 reroute is).',
        'Pawn breaks: identify the break that opens lines (d4/d5, e5, c5, b4). Prepare it with pieces, then execute.',
        'If your opponent is passive: gain space, do not rush. If he is cramped, he will blunder when he runs out of good moves.'
      ],
      do: ['Ask "what is my plan?" every 3-4 moves', 'Trade YOUR bad pieces for HIS good pieces'],
      dont: ['Do not attack with 2 pieces against 4 defenders', 'Do not open the position when you are behind in development'],
      trains: 6
    },
    {
      id: 'pawnstructure', group: 'strategy', title: 'Pawn Structure: Doubled, Isolated, Passed, Chains', subtitle: 'Pawns cannot go back — every pawn move is permanent',
      body: 'Pawns are the skeleton of the position. Structure decides which pieces are good and which are bad. Before pushing a pawn, ask whether it helps or hurts your structure for the rest of the game.',
      questions: [
        'ISOLATED pawn (no friendly pawns on adjacent files): a long-term weakness. If it is yours, trade it or defend it; if it is his, blockade it and win it in the endgame.',
        'DOUBLED pawns: usually a weakness if they are isolated; they can be a strength if they control the center (e.g. after ...exd5 in the Italian).',
        'PASSED pawn: no enemy pawn in front — it must be pushed. Rule: rook behind it (Tarrasch), king in front of it, protect it with everything.',
        'Pawn chains think backwards: attack the BASE of the chain, not the head (the French chain e5/d4 — hit c5-d4 ... hmm, hit the base at d4 with ...c5 and ...Nc6).',
        'Colour complexes: if you trade your light-squared bishop and your pawns sit on light squares, you will suffer forever. Do not trade the bishop that matches your weak squares.',
        'Create a plan before you touch pawns: "how will this pawn help me in the endgame?"'
      ],
      do: ['Look at the pawn structure first when deciding a plan', 'Attack the base of the chain'],
      dont: ['Do not push pawns in front of your own king', 'Do not accept a structural weakness without a real compensation (attack, space, development)'],
      trains: 5
    },
    {
      id: 'piecequality', group: 'strategy', title: 'Good Bishop, Bad Bishop, Bishop Pair, Knight Rights', subtitle: 'Get your worst piece into the game',
      body: 'Positional chess in one sentence: put your pieces on their best squares, and make his pieces sit on bad ones. A "bad bishop" is one locked behind its own pawns — at club level this single factor decides dozens of games.',
      questions: [
        'A bishop is good if your pawns are on the opposite colour and its diagonals are open. Bad if blocked by your own central pawns.',
        'Knights love CLOSED positions, outposts and central squares; they hate the board edge ("a knight on the rim is dim").',
        'Bishops love OPEN positions and long diagonals. The bishop pair (both bishops vs bishop+knight) is worth about half a pawn in the middlegame — keep it if the position is open.',
        'Bishop vs knight: usually the player who gets the OPEN position should have the bishop; the one with a fixed centre should keep the knight.',
        'Check your worst piece every 5 moves and give it a new job.'
      ],
      do: ['Trade your bad pieces, keep your good ones', 'Put knights on outposts and bishops on open diagonals'],
      dont: ['Do not trade your bishop for a knight for no reason when the position is open'],
      trains: 5
    },
    {
      id: 'attackplay', group: 'strategy', title: 'How to Attack the Castled King (the 4-Condition Test)', subtitle: 'Do not attack unless these 4 things are true',
      body: 'Every piece of advice you hear is "attack the king!" — and that is exactly how club players lose. A real attack needs four conditions. Check them; if fewer than 3 are true, improve your position instead.',
      questions: [
        'Condition 1: More attackers than defenders near his king (count them! typically 3 vs 2).',
        'Condition 2: No counterattack that is faster than yours (if his attack hits your king first, defend).',
        'Condition 3: A clear way in — a weak pawn (g6/h6/h7), a pinned defender, an open file or a diagonal leading to the king.',
        'Condition 4: Your own king is safe. Every attack is launched from a safe home.',
        'Standard acceleration methods: sacrifice on h7/f7 (Bxh7+ Greek gift), h-pawn push with a rook lift, knight to g5/f5, queen+bishop battery on the b1-h7 diagonal, and trading out the defender (offer the trade of his strong defender).',
        'If the attack fails, you must have a fallback: the closed position, the extra space, or the passed pawn you created.'
      ],
      do: ['Count attackers and defenders before starting', 'Bring the maximum number of pieces — the queen and knight last'],
      dont: ['Do not launch a two-piece attack against a solid king with pawn shield', 'Do not sacrifice without a forced follow-up'],
      trains: 6
    },
    {
      id: 'tradeplay', group: 'strategy', title: 'When to Trade: The 5 Trade Rules', subtitle: 'Every trade changes the game — make sure it changes it your way',
      body: 'Beginners trade at random. Strong players trade with purpose. Every trade changes both armies; you must be sure it is favourable before you do it.',
      questions: [
        'Ahead in material → trade pieces (not pawns). Every pair gone makes your extra material more decisive.',
        'Behind in material → avoid trades. Keep pieces on, create complications, attack.',
        'Cramped / less space → trade pieces. Your lack of space hurts less with fewer pieces on the board.',
        'Your bad piece for his good piece → always trade (the classic: your bad bishop for his strong knight).',
        'Attacking → keep your attacking pieces, trade his DEFENDERS. Defending → trade his attackers.',
        'Also: trade when you have an endgame edge (passed pawn, better structure). The endgame plan must be visible.'
      ],
      do: ['Ask before every trade: after this trade, whose position has improved?', 'Use trades to kill his attack — remove the attacker, not the defender'],
      dont: ['Do not trade when you need to win and you have no plan for the endgame'],
      trains: 5
    },

    /* ---------------- PSYCHOLOGY / TOURNAMENT ---------------- */
    {
      id: 'psychology', group: 'psychology', title: 'The Winning Mindset & Time Management', subtitle: 'How to play a 5-round tournament without tilting',
      body: 'Tournament chess is 50% skill and 50% discipline. The clock and your emotions are weapons you must control — they are also weapons your opponent does not control at district level. Win the waiting game.',
      questions: [
        'Rating is not destiny. In a district tournament the difference between a 1200 and a 1400 is mostly consistency, not brilliance. Play clean and the "better" player will crack.',
        'Clock discipline: spend 30 seconds on your first 8 moves (repertoire!), 1-3 minutes on critical moments (captures, checks, king attacks), and never let the clock drop below 3 minutes before move 30.',
        'When your opponent thinks forever, he is uncomfortable — do not match his tension. Play your own calm game.',
        'When your opponent is in time trouble: keep the position complicated but safe for you. Let the clock beat him.',
        'Never tilt after a loss: one loss is 1 round. A tilt spiral costs 3 rounds. Reset with the 10-minute rule: walk, water, breathe, back to the board.',
        'Best-of-tournament thinking: you do not need to win all 5 — 3.5/5 wins a district event usually. Draw with the strongest player if needed and take full points from the rest.',
        'Beating a stronger player: trade into an equal endgame, keep your pieces active, never take unnecessary risks. They will over-push and blunder — they always do at club level.',
        'Playing a weaker player: no tricks, no early queen attacks. Develop, castle, take the center, and wait. They will lose material by move 15.'
      ],
      do: ['Pre-game ritual: 3 breaths, "check, capture, threat", then play', 'Write down your own games — you cannot improve what you do not remember'],
      dont: ['Do not play for the gallery with risky sacrifices — 1-0 has no style points', 'Do not study new openings the night before the tournament'],
      trains: 4
    },
    {
      id: 'review', group: 'psychology', title: 'The 10-Minute Review Ritual After Every Game', subtitle: 'This is how you get better between rounds instead of between tournaments',
      body: 'The difference between a player who improves and a player who stays the same is 10 minutes of review. The app gives you a Blunder Report automatically — use it.',
      questions: [
        'Open the Blunder Report and find your 3 worst moves.',
        'For each one answer: what did I miss? (a check I had, a capture, his threat, my hanging piece, his tactic)',
        'Write the lesson in ONE line: "Before capturing, check his knight checks" etc. Keep a running list — your personal weakness profile.',
        'Ask of the opening: at move 10, was I developed and castled? If not, why?',
        'Ask of the endgame: did I know my plan? Did I trade into an endgame I could convert?',
        'Then let it go. Next round is a new game.'
      ],
      do: ['Review EVERY game, win or lose — you learn most from games you won', 'Keep the one-line lesson list and read it before the next round'],
      dont: ['Do not blame luck, the clock, or the venue — find the move that cost you'],
      trains: 3
    }
  ];

  var OUT = { cards: CARDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = OUT;
  else (typeof window !== 'undefined' ? window : globalThis).CONTENT_CODEX = OUT;
})();
