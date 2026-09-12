/* BEAST CHESS — 7 DAY ZERO→HERO SYLLABUS
   Each day: goal, winning idea, sessions (tasks the app can launch), KPI, homework, key positions.
*/
(function () {
  var DAYS = [
    {
      day: 1, title: 'RESET THE MACHINE — The Blunder Firewall', badge: 'FOUNDATION',
      goal: 'Shake off 7 months of rust and install the one habit that wins district games: never give away a piece for free.',
      bigIdea: 'At district level, 80% of games are decided by one thing: the player who blunders less wins. Not strategy. Not brilliance. Blunders. Today you become the player who does not blunder.',
      sessions: [
        { name: 'Rust-shake Sprint', mins: 30, tool: 'play', config: { level: 1, hint: true, coach: true }, desc: 'Play 3 quick games vs ROOKIE with Blunder Guard ON. Do not try to win — try to never lose a piece for free. This is calibration, not competition.' },
        { name: 'The 6-Question Checklist (memorize tonight)', mins: 25, tool: 'codex', config: { card: 'checklist' }, desc: 'Learn the pre-move ritual you will use in EVERY game from now on, including the district match. Recite it out loud 5 times. Then use it in your next game.' },
        { name: 'Mate-in-1 Blitz', mins: 30, tool: 'mate', config: { type: 'mate1', count: 30 }, desc: '30 one-move mates. Speed matters: under 10 seconds each. Do not guess — check every escape square of the enemy king before moving.' },
        { name: 'Endgame Anchor: K+Q vs K', mins: 20, tool: 'endgame', config: { id: 'q-k' }, desc: 'Deliver mate with queen and king 3 times in a row, each in under 40 moves. Do not stalemate. This alone converts half the winning positions you will reach.' }
      ],
      kpi: 'Finish your last game of the day having given away ZERO pieces for free. Log every free piece you gave away before that.',
      homework: ['Play 2 more games vs LEVEL 1-2 with the checklist. Note every piece you lose without being attacked twice.', 'Recite the 6-question checklist 5x before sleeping.'],
      keySkills: ['Blunder firewall checklist', 'K+Q vs K mate', 'Basic mate recognition']
    },
    {
      day: 2, title: 'BUILD THE ENGINE — Center, Development, Castle', badge: 'OPENING',
      goal: 'Own the opening so you never lose in the first 10 moves again. You will leave this day with a personal repertoire you know from memory.',
      bigIdea: 'The opening is not about memorizing moves — it is about 3 goals: (1) control the center with pawns, (2) develop knights and bishops toward the center, (3) castle fast. Whoever finishes developing first usually wins the middlegame.',
      sessions: [
        { name: 'Repertoire Workshop — White', mins: 35, tool: 'openings', config: { side: 'white' }, desc: 'Walk through every White line with notes. Play each line out on the board twice. Then hit QUIZ mode until you are 100%.' },
        { name: 'Repertoire Workshop — Black', mins: 35, tool: 'openings', config: { side: 'black' }, desc: 'Same for Black. The Italian defence and the "Stone Wall" set-up. This is your shield for the whole tournament.' },
        { name: 'Opening Principles Combat', mins: 25, tool: 'play', config: { level: 2, hint: true, coach: true }, desc: '2 games where your ONLY goal is: castle before move 10, develop a new piece every move (no repeat moves), never move the queen before move 8.' },
        { name: 'Mate-in-2 Training', mins: 25, tool: 'mate', config: { type: 'mate2', count: 20 }, desc: 'Two-move mates force you to calculate one move deeper. This is exactly the calculation muscles the middlegame needs.' }
      ],
      kpi: 'Castle before move 10 in 100% of games. Opening quiz score 100% on both colours.',
      homework: ['Play 3 games with your new repertoire. Write the first 8 moves of each game from memory afterwards.', 'Say the 4 Opening Golden Rules before each game.'],
      keySkills: ['Italian Game structure', 'Castling race', 'Development discipline']
    },
    {
      day: 3, title: 'THE MONEY DAY — Tactics Arsenal', badge: 'TACTICS',
      goal: 'Install the 8 tactical patterns that win material in almost every club game. This is the single highest-value day of the week.',
      bigIdea: 'Tactics are not magic — they are 8 shapes you learn to see. Once your eyes know the shapes, you will start winning pieces in every game. Then games become easy.',
      sessions: [
        { name: 'Motif Classroom', mins: 30, tool: 'codex', config: { group: 'tactics' }, desc: 'Study all 8 tactical motif cards with diagrams: fork, pin, skewer, discovered attack, double attack, deflection, remove the defender, back rank. Say the pattern name out loud for each.' },
        { name: 'Puzzle Sprint I — Mates', mins: 30, tool: 'mate', config: { type: 'mix', count: 30 }, desc: '30 mixed mate puzzles (1 and 2 movers). Target: 80%+ accuracy, and name the motif for each.' },
        { name: 'Puzzle Sprint II — Win Material', mins: 35, tool: 'tactics', config: { count: 25 }, desc: '25 "find the tactic" puzzles. For each one, ask: what did he leave undefended? Which of my pieces attacks two things at once?' },
        { name: 'Apply It: 2 Games', mins: 30, tool: 'play', config: { level: 3, hint: false, coach: true }, desc: 'Every time you see a check or a capture — STOP and calculate it before moving. Write down the first tactic you spotted in each game.' }
      ],
      kpi: 'Puzzle accuracy above 80% and you can NAME the motif of every puzzle you solve.',
      homework: ['25 more puzzles before bed (mate1 + tactics).', 'Re-draw from memory: the fork, the pin, the skewer on a piece of paper.'],
      keySkills: ['Fork + double attack', 'Pin & skewer use', 'Discovered attack', 'Back-rank awareness']
    },
    {
      day: 4, title: 'THE ARMOR — Defense, King Safety & Trap Insurance', badge: 'DEFENSE',
      goal: 'Stop losing won games. Learn how to see threats coming and how to survive — and punish — every common club trap.',
      bigIdea: 'A district tournament is won by the player who does not get mated. Defense is not passive play — it is violent attention. Before every move ask one question: "What does his last move threaten?"',
      sessions: [
        { name: 'King Safety Classroom', mins: 25, tool: 'codex', config: { group: 'defense' }, desc: 'Study: pawn shield, f-pawn danger, back-rank weakness, the "only move" mindset. Then apply: in every game today, count the attackers and defenders around your king.' },
        { name: 'Defense Drills — Find the Only Move', mins: 30, tool: 'tactics', config: { mode: 'defense', count: 15 }, desc: '15 positions where you are under threat and only one move survives. These train the exact muscle that saves you in round 3 of the tournament.' },
        { name: 'Trap Library (both sides)', mins: 30, tool: 'traps', desc: 'Learn the 10 traps EVERY district player falls for — and the antidote to each. Also: the traps you can safely set when an opponent plays too fast.' },
        { name: 'Pressure Games', mins: 30, tool: 'play', config: { level: 3, hint: false, coach: true }, desc: '3 games with a rule: before each move, say out loud "his last move attacked ___". If you get mated, log it as a "trap paid" and study the position.' }
      ],
      kpi: 'Zero losses to a 1-2 move tactic in your last two games of the day.',
      homework: ['Replay your worst mate of the day and find the exact move where you should have defended.', 'Memorize the antidote list from the Trap Library.'],
      keySkills: ['Threat detection', 'Defensive resources', 'Trap avoidance & setting']
    },
    {
      day: 5, title: 'THE FINISHER — Endgame Conversion', badge: 'ENDGAME',
      goal: 'Once you are ahead, you must be able to finish. Endgame conversion is where points are banked.',
      bigIdea: 'District games are FULL of endgames (people trade everything). Players who can mate with a queen and can win a king+pawn ending convert 100% of their winning positions. Players who cannot, throw away hours of good chess in 5 minutes.',
      sessions: [
        { name: 'Endgame Classroom', mins: 30, tool: 'codex', config: { group: 'endgame' }, desc: 'Learn: the key squares, the opposition, rook behind passed pawn (Tarrasch rule), Lucena and Philidor, and how to avoid stalemate.' },
        { name: 'Fundamental Mates Drills', mins: 30, tool: 'endgame', desc: 'K+Q vs K (3x), K+R vs K (2x) — every mate in under 10 moves after you master the technique. Speed is safety.' },
        { name: 'Pawn & Rook Endgame Drills', mins: 35, tool: 'endgame', config: { ids: ['kp-win', 'q-vs-p', 'rp-k', 'kp-draw'] }, desc: 'Play each drill against the engine. Success = win the won ones, draw the drawn one. Rinse and repeat.' },
        { name: 'Trade Into Endgames', mins: 30, tool: 'play', config: { level: 3, coach: true }, desc: '2 games with a mission: when you are up material, trade pieces (not pawns!), centralize your king, and convert. Count when each trade is safe.' }
      ],
      kpi: 'Mate with K+Q and K+R within 10 moves each, 3 times in a row, with no stalemate.',
      homework: ['Re-do every drill you failed.', 'Play one full game where you deliberately go into an endgame.'],
      keySkills: ['Basic mates', 'Lucena & Philidor', 'Pawn endings & opposition', 'Stalemate avoidance']
    },
    {
      day: 6, title: 'WEAPONIZATION — Repertoire Mastery + Speed', badge: 'SPEED',
      goal: 'Make your openings automatic so your thinking time goes to the middle game. Learn time management like a tournament player.',
      bigIdea: 'Time is a weapon. At district level, most players run out of time or play their worst moves at move 25+. If your first 10 moves take 30 seconds total and you know your plans, you will simply have more thinking power when the game is decided.',
      sessions: [
        { name: 'Repertoire Quiz — Perfect Run', mins: 30, tool: 'openings', config: { quiz: true }, desc: 'Quiz mode on all lines, both colours, until you score 100% without hesitation. Speed = confidence on match day.' },
        { name: 'Anti-Odds: vs Non-Standard First Moves', mins: 25, tool: 'openings', config: { side: 'black' }, desc: 'Anything weird as White (1.b3/1.f4/1.Nc3)? Answer: center + develop + castle = equal or better. Practise the universal setup until it is muscle memory.' },
        { name: 'Timed Tactics Raid', mins: 30, tool: 'tactics', config: { count: 30, timed: true }, desc: '30 tactics with a 20-second clock each. This builds the "pattern recognition speed" that wins real games when your clock is low.' },
        { name: 'Clock Discipline Games', mins: 35, tool: 'play', config: { level: 4, hint: false, coach: true, timeControl: '15+10' }, desc: '3 games with a REAL clock (15+10). Rule: never let your clock go below 3 minutes before move 30. In each game, find the "critical moment" and spend 2 minutes there.' }
      ],
      kpi: '100% repertoire quiz; every game castled by move 10; no opening losses in the whole day.',
      homework: ['Write out your full repertoire (all lines) from memory on paper.', 'Watch your own worst game and find the moment you fell behind.'],
      keySkills: ['Repertoire recall under pressure', 'Time management', 'Critical-moment calculation']
    },
    {
      day: 7, title: 'MATCH DAY SIMULATION — Become the Beast', badge: 'BEAST',
      goal: 'Rehearse the real thing: full tournament protocol, pressure, review. Tomorrow you compete like a trained player, not a hope.',
      bigIdea: 'Confidence comes from having already done it. Today you play exactly like the tournament: same clock, same routine, no hints, no takebacks — and then you review every game like a pro. The player who reviews wins next time.',
      sessions: [
        { name: 'Full Simulation I', mins: 40, tool: 'play', config: { level: 4, hint: false, coach: false, tournament: true, timeControl: '15+10' }, desc: 'Game 1 vs BEAST under full tournament rules. Use the 6-question checklist on EVERY move. Write down the game (the app logs it for you).' },
        { name: 'Blunder Report Review', mins: 25, tool: 'review', desc: 'Open the Blunder Report for Game 1. Find your 3 worst moves. For each: what did I miss? (a check? a capture? his threat? a hanging piece?) Write the lesson in one line.' },
        { name: 'Full Simulation II + III', mins: 60, tool: 'play', config: { level: 4, tournament: true, timeControl: '15+10' }, desc: 'Two more tournament games. Between them: 5 minutes break, water, no phone. Simulate the real thing completely.' },
        { name: 'Final Tactics Sharpener + Mantra', mins: 25, tool: 'tactics', config: { count: 15 }, desc: '15 easy tactics to end on a high, then read the Match-Day Protocol card out loud. Sleep early. You are ready.' }
      ],
      kpi: 'Score at least 50% (1.5/3) vs the level-4 engine without hints, and complete a written blunder report for every game.',
      homework: ['Sleep 8 hours. No chess study tomorrow morning.', 'Reread the Match-Day Protocol card once, right before you leave.'],
      keySkills: ['Tournament discipline', 'Self-review skill', 'Confidence under pressure']
    }
  ];

  var PROTOCOL = {
    title: 'MATCH-DAY PROTOCOL — read this the night before and on the way',
    sections: [
      { h: 'Before you sit down', items: ['Arrive early. No last-minute study — nothing you learn in the last 30 minutes matters.', 'Water, bathroom, phone off. Ten slow breaths. You have trained 7 days for this.', 'Remember: your job is NOT to play brilliant chess. Your job is to play clean chess and let THEM make the mistake.'] },
      { h: 'The 6-Question Blunder Firewall (every single move, no exceptions)', items: ['1. What did his last move attack or threaten?', '2. Is anything of mine hanging right now (count attackers vs defenders)?', '3. Can I give a check, and does it actually help?', '4. Can I capture something — and is it really free?', '5. What is HIS best reply to my intended move?', '6. After my move, is my king safe and is every piece defended?'] },
      { h: 'Clock rules', items: ['Opening: 30 seconds total for your first 8 moves. You know the repertoire.', 'Middlegame: when there is a check or a capture on the board, spend 2 minutes. Think in candidates: list 3 moves, then eliminate.', 'Never drop below 3 minutes before move 30. When low on time: play simple, safe, developing moves and avoid complications.', 'If your opponent is in time trouble: do NOT rush him. Take your time, keep the position complicated but safe for you.'] },
      { h: 'When you are WINNING', items: ['Trade pieces, NOT pawns. Every trade brings you closer to a winning endgame.', 'Watch for back-rank mates and cheap swindles — this is where 90% of thrown games happen.', 'Activate your king in the endgame. It is a fighting piece.', 'Do not attempt anything fancy. Convert simply. A win is a win, 1-0 is not 10-0.'] },
      { h: 'When you are LOSING', items: ['Do not panic-resign at district level. Many games get thrown away by the winning side.', 'Create counterplay: a passed pawn, an attack, a threat — make him solve problems.', 'Trade the pieces that are attacking you. Simplify anything that is favourable to you.', 'Keep the position complicated if you are losing. Keep it simple if you are winning.'] },
      { h: 'After the game', items: ['Write down the moves (the app logs them anyway). Log your 3 worst moves and one lesson.', 'Win or lose: 10 minutes away from the board, then prepare for the next round like it is the first.', 'Never tilt. One game at a time. The tournament is 5 games, not 1.'] }
    ]
  };

  var W = {
    days: DAYS,
    protocol: PROTOCOL,
    mantra: 'I do not need to be brilliant. I need to be clean. Check, capture, threat — every move. Let them blunder. I finish what I win.'
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = W;
  else (typeof window !== 'undefined' ? window : globalThis).CONTENT_DAYS = W;
})();
