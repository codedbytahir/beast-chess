/* =========================================================================
   BEAST CHESS — DASHBOARD APP
   ========================================================================= */
(function () {
  'use strict';
  var B = window.BEAST, BD = window.BeastBoard;
  var OPENINGS = window.CONTENT_OPENINGS, DAYS = window.CONTENT_DAYS, CODEX = window.CONTENT_CODEX, TRAPS = window.CONTENT_TRAPS.traps;
  var PUZZLES = (window.PUZZLES_DATA && window.PUZZLES_DATA.puzzles) || [];
  var CONTENT = window.CONTENT_VERIFIED || { traps: [], codexFens: {} };
  var FILES = 'abcdefgh';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function setText(sel, val) { var e = $(sel); if (e) e.textContent = val; }
  function setHTML(sel, val) { var e = $(sel); if (e) e.innerHTML = val; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }

  /* ---------------------------- storage ---------------------------- */
  var LS_OK = true;
  try { window.localStorage.setItem('__t', '1'); window.localStorage.removeItem('__t'); } catch (e) { LS_OK = false; }
  var MEM = {};
  function load() {
    try {
      var raw = LS_OK ? localStorage.getItem('beastchess.v1') : MEM.d;
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function save() { try { var s = JSON.stringify(S); if (LS_OK) localStorage.setItem('beastchess.v1', s); else MEM.d = s; } catch (e) { } }

  var DEFAULT = {
    xp: 0, createdAt: new Date().toISOString(), lastDay: null, streak: 0,
    days: {},                       // { dayNum: { t0:true, ... } }
    stats: {
      games: 0, wins: 0, draws: 0, losses: 0, bestWinStreak: 0, winStreak: 0,
      puzzles: { attempted: 0, solved: 0, firstTry: 0, byType: {} },
      drills: {}, moves: 0, blunders: 0, lastGameEvals: null
    },
    games: [], lessons: {},          // recent games + lesson progress
    settings: { level: 3, coach: true, hints: true, clock: 'off', sound: true, showCoords: true, showMoves: false, beginner: false, onboarded: false, theme: 'dark' },
    answered: {}                    // daily quiz answers
  };
  var S = Object.assign({}, DEFAULT, load() || {});
  S.stats = Object.assign({}, DEFAULT.stats, S.stats || {});
  S.stats.puzzles = Object.assign({}, DEFAULT.stats.puzzles, S.stats.puzzles || {});
  S.settings = Object.assign({}, DEFAULT.settings, S.settings || {});

  /* ---------------------------- ui helpers ---------------------------- */
  function toast(msg, type, ms) {
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = msg;
    $('#toasts').appendChild(t);
    setTimeout(function () { t.classList.add('in'); }, 10);
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 300); }, ms || 2600);
  }
  function modal(o) {
    var back = document.createElement('div');
    back.className = 'modal-back';
    var b = '<div class="modal ' + (o.wide ? 'wide' : '') + '"><div class="modal-h"><h3>' + o.title + '</h3>' +
      (o.closable === false ? '' : '<button class="x" data-close>&times;</button>') + '</div><div class="modal-b">' + o.body + '</div>';
    if (o.buttons) {
      b += '<div class="modal-f">' + o.buttons.map(function (x, i) { return '<button class="btn ' + (x.cls || '') + '" data-i="' + i + '">' + x.label + '</button>'; }).join('') + '</div>';
    }
    b += '</div>';
    back.innerHTML = b;
    document.body.appendChild(back);
    setTimeout(function () { back.classList.add('in'); }, 10);
    function close() { back.classList.remove('in'); setTimeout(function () { back.remove(); }, 250); }
    if (o.closable !== false) $$('[data-close]', back).forEach(function (x) { x.addEventListener('click', close); });
    back.addEventListener('click', function (e) { if (e.target === back && o.closable !== false) close(); });
    if (o.buttons) $$('.modal-f .btn', back).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cfg = o.buttons[parseInt(btn.getAttribute('data-i'), 10)];
        if (cfg.keepOpen) { cfg.onClick && cfg.onClick(back); } else { close(); cfg.onClick && cfg.onClick(); }
      });
    });
    if (o.onOpen) o.onOpen(back);
    return { close: close, el: back };
  }
  function sound(kind) {
    if (!S.settings.sound) return;
    try {
      var ctx = window.__actx || (window.__actx = new (window.AudioContext || window.webkitAudioContext)());
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = kind === 'cap' ? 210 : kind === 'bad' ? 130 : kind === 'good' ? 700 : 420;
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.start(); o.stop(ctx.currentTime + 0.13);
    } catch (e) { }
  }
  var LEVELS = [
    { 0: 'Rookie', 1: 'Club Player', 2: 'District Strong', 3: 'BEAST', 4: 'NIGHTMARE' }
  ];
  function levelName(l) { return (B.LEVELS[l] || {}).name || 'level ' + l; }
  function addXp(n, why) {
    S.xp += n;
    var before = rankOf(S.xp - n), after = rankOf(S.xp);
    if (after !== before) toast('<i class="i i-medal"></i> NEW RANK: <b>' + after + '</b> — ' + why, 'good', 4000);
    else if (why) toast('+' + n + ' XP — ' + why, 'xp', 1600);
    save();
  }
  function rankOf(xp) {
    if (xp >= 6000) return 'CHESS BEAST';
    if (xp >= 3500) return 'District Killer';
    if (xp >= 1800) return 'Tournament Ready';
    if (xp >= 800) return 'Tactician';
    if (xp >= 300) return 'Club Player';
    return 'Rookie';
  }
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  function bumpStreak() {
    if (S.lastDay !== todayStr()) {
      var y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      S.streak = (S.lastDay === y) ? (S.streak + 1) : 1;
      S.lastDay = todayStr();
      save();
    }
  }

  /* ---------------------------- navigation ---------------------------- */
  var VIEWS = [
    { id: 'home', label: 'Command Center', icon: '<i class="i i-target"></i>' },
    { id: 'play', label: 'Play', icon: '<i class="i i-pawn"></i>' },
    { id: 'learn', label: 'Learn Chess', icon: '<i class="i i-cap"></i>' },
    { id: 'puzzles', label: 'Puzzles', icon: '<i class="i i-puzzle"></i>' },
    { id: 'endgame', label: 'Endgame', icon: '<i class="i i-crown"></i>' },
    { id: 'openings', label: 'Repertoire', icon: '<i class="i i-book"></i>' },
    { id: 'traps', label: 'Traps', icon: '<i class="i i-grid"></i>' },
    { id: 'codex', label: 'Playbook', icon: '<i class="i i-layers"></i>' },
    { id: 'plan', label: '7-Day Plan', icon: '<i class="i i-calendar"></i>' },
    { id: 'progress', label: 'Progress', icon: '<i class="i i-chart"></i>' }
  ];
  /* ------------------------------------------------------------------
     ROUTER — does NOT depend on the URL.
     Sandboxed previews (file:// inside an iframe) block location.hash,
     so we keep the route in memory and only *try* to mirror it in the URL.
     ------------------------------------------------------------------ */
  var route = { view: 'home', params: {} };
  var currentView = 'home';

  function parseHash() {
    var h = (location.hash || '#/home').replace(/^#\//, ''), qs = '';
    var qi = h.indexOf('?');
    if (qi >= 0) { qs = h.slice(qi + 1); h = h.slice(0, qi); }
    if (!h) h = 'home';
    if (VIEWS.map(function (v) { return v.id; }).indexOf(h) < 0) h = 'home';
    return { view: h, params: parseQs(qs) };
  }
  function parseQs(qs) {
    var params = {};
    (qs || '').split('&').forEach(function (kv) { if (kv) { var p = kv.split('='); params[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); } });
    return params;
  }
  function setHash(view, qs) {
    try {
      var want = '#/' + view + (qs ? '?' + qs : '');
      if (location.hash !== want) location.hash = want;
    } catch (e) { /* sandboxed: ignore, internal routing still works */ }
  }
  function nav(view, qs) {
    route = { view: view, params: parseQs(qs) };
    setHash(view, qs);
    render();
  }
  function render() {
    var h = route.view, params = route.params;
    if (VIEWS.map(function (v) { return v.id; }).indexOf(h) < 0) { h = 'home'; route.view = 'home'; }
    currentView = h;
    $$('#nav .navitem').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-v') === h); });
    var view = $('#view');
    /* clean up anything left over from the previous view (drag ghosts, observers) */
    if (board && board.destroy) { try { board.destroy(); } catch (e) { } }
    Array.prototype.forEach.call(document.querySelectorAll('.drag-ghost'), function (g) { g.remove(); });
    view.innerHTML = '';
    try {
      ({ home: vHome, play: vPlay, learn: vLearn, puzzles: vPuzzles, endgame: vEndgame, openings: vOpenings, traps: vTraps, codex: vCodex, plan: vPlan, progress: vProgress })[h](view, params);
    } catch (e) {
      view.innerHTML = '<div class="card"><h3><i class="i i-alert"></i> Something went wrong in this tab</h3><p class="muted">' + esc(e && e.message) + '</p>' +
        '<button class="btn primary" id="recover"><i class="i i-arrowL"></i> Back to Command Center</button></div>';
      var rb = $('#recover'); if (rb) rb.addEventListener('click', function () { nav('home'); });
      if (window.console) console.error(e);
    }
    try { window.scrollTo({ top: 0 }); } catch (e) { }
  }
  window.addEventListener('hashchange', function () {
    var r = parseHash();
    if (r.view === route.view && JSON.stringify(r.params) === JSON.stringify(route.params)) return;
    route = r; render();
  });

  function headerBar(title, sub, right) {
    return '<div class="page-h"><div><h2>' + title + '</h2>' + (sub ? '<p class="sub">' + sub + '</p>' : '') + '</div>' + (right || '') + '</div>';
  }

  /* ============================ HOME ============================ */
  function dayProgress(d) {
    var day = DAYS.days[d - 1]; if (!day) return { done: 0, total: 0, pct: 0, complete: false };
    var ticks = S.days[d] || {};
    var total = day.sessions.length + 3; // 3 = KPI + homework + review
    var done = day.sessions.filter(function (_, i) { return ticks['s' + i]; }).length + (ticks.kpi ? 1 : 0) + (ticks.hw ? 1 : 0) + (ticks.review ? 1 : 0);
    return { done: done, total: total, pct: Math.round(done / total * 100), complete: done >= total };
  }
  function currentDayNum() {
    for (var d = 1; d <= 7; d++) if (!dayProgress(d).complete) return d;
    return 7;
  }
  function vHome(view) {
    var day = currentDayNum(), dp = dayProgress(day), D = DAYS.days[day - 1];
    var totalDone = 0, totalAll = 0;
    for (var d = 1; d <= 7; d++) { var p = dayProgress(d); totalDone += p.done; totalAll += p.total; }
    var overall = Math.round(totalDone / totalAll * 100);
    var st = S.stats;
    var pz = st.puzzles;
    var acc = pz.attempted ? Math.round(pz.solved / pz.attempted * 100) : 0;
    var newish = S.settings.beginner || !S.stats.games;
    var html = headerBar('Command Center', 'Rank: <b>' + rankOf(S.xp) + '</b> · ' + S.xp + ' XP · ' + S.streak + '-day streak') +
      (newish ? '<div class="card" style="border-color:rgba(96,165,250,.45)"><div class="row between wrap gap">' +
        '<div><span class="kicker">NEW TO CHESS? START HERE</span><h3>Learn → then play your first real game</h3>' +
        '<p class="muted small">Lesson 1 teaches you the board and the pieces in 3 minutes. Lesson by lesson, you drag pieces around with no pressure. When you are ready, the <b>guided first game</b> tells you every move to make and explains what the computer is doing back.</p></div>' +
        '<div class="row gap wrap"><button class="btn primary" data-go="learn"><i class="i i-cap"></i> Start Lesson 1</button>' +
        '<button class="btn" id="homeGuided"><i class="i i-gamepad"></i> Guided first game</button>' +
        '<button class="btn" id="homeGloss"><i class="i i-book"></i> Chess words</button></div></div></div>' : '') +
      '<div class="grid g-2">' +
      '<div class="card hero">' +
      '<div class="hero-top"><div><div class="kicker">TODAY — DAY ' + day + ' OF 7</div><h3>' + esc(D.title) + '</h3>' +
      '<p>' + esc(D.bigIdea) + '</p></div>' +
      '<div class="ring" style="--p:' + dp.pct + '"><span>' + dp.pct + '%</span></div></div>' +
      '<div class="sessions">' + D.sessions.map(function (s, i) {
        var done = (S.days[day] || {})['s' + i];
        return '<div class="session' + (done ? ' done' : '') + '"><button class="tick" data-tick="s' + i + '">' + (done ? '<i class="i i-check"></i>' : '') + '</button>' +
          '<div class="sess-body"><b>' + esc(s.name) + '</b><span class="muted">' + s.mins + ' min · ' + esc(s.desc.slice(0, 90)) + (s.desc.length > 90 ? '…' : '') + '</span></div>' +
          '<button class="btn sm primary" data-launch="' + i + '">Start <i class="i i-chevR"></i></button></div>';
      }).join('') + '</div>' +
      '<div class="hero-foot"><div class="kpi"><span class="kicker">KPI FOR THE DAY</span><p>' + esc(D.kpi) + '</p></div>' +
      '<div class="kpi"><span class="kicker">HOMEWORK</span><ul>' + D.homework.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="row gap"><button class="btn" data-tick="kpi">' + ((S.days[day] || {}).kpi ? '<i class="i i-check"></i> KPI done' : 'Mark KPI done') + '</button>' +
      '<button class="btn" data-tick="hw">' + ((S.days[day] || {}).hw ? '<i class="i i-check"></i> Homework done' : 'Mark homework done') + '</button>' +
      '<button class="btn" data-tick="review">' + ((S.days[day] || {}).review ? '<i class="i i-check"></i> Reviewed my games' : 'Mark: reviewed my games') + '</button></div>' +
      '</div>' +

      '<div class="col gap">' +
      '<div class="card"><h3>Quick launch</h3><div class="quick">' +
      '<button class="qbtn" data-go="play"><i class="i i-pawn"></i><span>Play vs AI<small>level 1–5</small></span></button>' +
      '<button class="qbtn" data-go="puzzles?mode=mate1"><i class="i i-puzzle"></i><span>Mate in 1<small>speed drill</small></span></button>' +
      '<button class="qbtn" data-go="puzzles?mode=tactic"><i class="i i-zap"></i><span>Find the tactic<small>win material</small></span></button>' +
      '<button class="qbtn" data-go="puzzles?mode=defense"><i class="i i-shield"></i><span>Only-move defense<small>survive</small></span></button>' +
      '<button class="qbtn" data-go="endgame"><i class="i i-crown"></i><span>Endgame drills<small>finish games</small></span></button>' +
      '<button class="qbtn" data-go="openings"><i class="i i-book"></i><span>Repertoire<small>quiz me</small></span></button>' +
      '<button class="qbtn" data-go="traps"><i class="i i-grid"></i><span>Trap library<small>10 traps</small></span></button>' +
      '<button class="qbtn" data-go="plan"><i class="i i-calendar"></i><span>7-day plan<small>syllabus</small></span></button>' +
      '</div></div>' +

      '<div class="card"><h3>Beast scoreboard</h3><div class="stats-grid">' +
      stat('Overall course', overall + '%') + stat('Games played', st.games) + stat('Wins', st.wins) +
      stat('Puzzles solved', pz.solved + '/' + pz.attempted + ' (' + acc + '%)') +
      stat('Drills passed', Object.keys(st.drills).filter(function (k) { return st.drills[k]; }).length) + stat('Win streak', st.winStreak) +
      '</div><p class="muted small">Play at least 2 games and 25 puzzles per day — that is the minimum dose for a 7-day transformation.</p></div>' +

      '<div class="card mantra"><span class="kicker">MATCH-DAY MANTRA — read it out loud</span><p>“' + esc(DAYS.mantra) + '”</p>' +
      '<button class="btn sm" data-go="codex?card=checklist">Open the 6-Question Checklist <i class="i i-chevR"></i></button></div>' +
      '</div></div>';

    view.innerHTML = html;
    $$('[data-go]', view).forEach(function (b) { b.addEventListener('click', function () { nav(b.getAttribute('data-go').split('?')[0], b.getAttribute('data-go').split('?')[1]); }); });
    $$('[data-tick]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-tick');
        var d = S.days[day] || (S.days[day] = {});
        var entry = day + ':' + key;
        d[key] = !d[key];
        if (d[key]) addXp(key === 's0' ? 20 : 30, 'Day ' + day + ' task complete');
        bumpStreak();
        var dp2 = dayProgress(day);
        if (dp2.complete) { toast('<i class="i i-trophy"></i> <b>DAY ' + day + ' COMPLETE.</b> The next day is unlocked.', 'good', 4200); addXp(150, 'day ' + day + ' finished!'); }
        save(); render();
      });
    });
    $$('[data-launch]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = parseInt(b.getAttribute('data-launch'), 10), sess = D.sessions[i];
        launchSession(sess);
      });
    });
    var hg = $('#homeGuided'); if (hg) hg.addEventListener('click', function () { nav('play'); setTimeout(startGuidedGame, 300); });
    var hgl = $('#homeGloss'); if (hgl) hgl.addEventListener('click', glossaryModal);
  }
  function stat(k, v) { return '<div class="stat"><span>' + k + '</span><b>' + v + '</b></div>'; }

  function launchSession(sess) {
    var t = sess.tool, c = sess.config || {};
    if (t === 'play') { S.settings.level = (c.level != null ? c.level : 3); S.settings.coach = c.coach !== false; S.settings.hints = c.hint !== false; S.settings.clock = c.timeControl || 'off'; save(); nav('play'); }
    else if (t === 'mate') { nav('puzzles', 'mode=' + (c.type || 'mate1') + '&n=' + (c.count || 20)); }
    else if (t === 'tactics') { nav('puzzles', 'mode=' + (c.mode || 'tactic') + '&n=' + (c.count || 20)); }
    else if (t === 'endgame') { nav('endgame', c.id ? 'id=' + c.id : ''); }
    else if (t === 'openings') { nav('openings', c.side ? 'side=' + c.side : ''); }
    else if (t === 'codex') { nav('codex', c.card ? 'card=' + c.card : (c.group ? 'group=' + c.group : '')); }
    else if (t === 'traps') { nav('traps'); }
    else if (t === 'review') { nav('progress'); }
    else nav('home');
  }

  /* ============================ PLAY ============================ */
  var game = null;
  var board = null;
  var clockTimer = null;

  function newGame(opts) {
    opts = opts || {};
    var color = opts.color || (game && game.humanColor) || 'w';
    game = {
      st: B.parseFEN(B.START_FEN), humanColor: color,
      level: (opts.level != null ? opts.level : S.settings.level),
      sans: [], fens: [B.toFEN(B.parseFEN(B.START_FEN))], ucis: [],
      selected: null, targets: [], lastMove: null, over: false, result: null,
      thinking: false, showHint: false, hintArrow: [], drill: opts.drill || null,
      coach: opts.coach != null ? opts.coach : S.settings.coach,
      allowHint: opts.hint != null ? opts.hint : S.settings.hints,
      clock: null, moveCount: 0, startFen: opts.fen || B.START_FEN
    };
    game.clock = (opts.timeControl && opts.timeControl !== 'off') ? { base: 900, inc: 10 } : null;
    if (opts.fen) game.st = B.parseFEN(opts.fen);
    if (opts.humanColor) game.humanColor = opts.humanColor;
    game.turnStart = Date.now();
    if (game.clock) { game.clock.w = game.clock.base; game.clock.b = game.clock.base; game.clock.on = true; game.clock.last = Date.now(); startClock(); }
    else stopClock();
  }
  function startClock() {
    stopClock();
    clockTimer = setInterval(function () {
      if (!game || !game.clock || game.over) return;
      var now = Date.now(), dt = (now - game.clock.last) / 1000;
      game.clock.last = now;
      game.clock[game.st.turn] = Math.max(0, game.clock[game.st.turn] - dt);
      var e = $('#clk' + game.st.turn);
      if (e) e.textContent = fmtClock(game.clock[game.st.turn]);
      $$('.clock .clk').forEach(function (c) { c.classList.toggle('active', c.getAttribute('data-c') === game.st.turn); });
      if (game.clock[game.st.turn] <= 0) {
        game.over = true; game.result = { over: true, result: B.other(game.st.turn), reason: 'flag fall (time)' };
        finishGame();
      }
    }, 250);
  }
  function stopClock() { if (clockTimer) clearInterval(clockTimer); clockTimer = null; }
  function fmtClock(s) { s = Math.ceil(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }

  function humanToMove() { return !game.over && game.st.turn === game.humanColor && !game.drillEngineThinking; }

  function computeStatus() {
    var stt = B.status(game.st, game.fens.map(function (f) { return f.split(' ').slice(0, 4).join(' '); }));
    if (stt.over) { game.over = true; game.result = stt; finishGame(); }
    return stt;
  }

  function coachNote(pre, m, byHuman) {
    if (!game || !game.coach) return;
    if (!game.log) game.log = [];
    var d = describeMove(pre, m, byHuman ? game.humanColor : B.other(game.humanColor));
    var who = byHuman ? 'You' : 'Computer';
    var txt = '<b>' + who + ' played ' + esc(d.san) + '</b>';
    if (d.bits.length) txt += ' — ' + esc(d.bits.join('; '));
    txt += '.';
    if (!byHuman) {
      var atk = attackedTargets(game.st, m.to, game.humanColor);
      if (atk.length) {
        var a0 = atk[0];
        txt += a0.defended
          ? ' It is looking at your ' + pieceName(a0.piece) + ' on ' + B.sqName(a0.sq) + ' — that one is defended, so it is not free.'
          : ' <b><i class="i i-alert"></i> It now attacks your ' + pieceName(a0.piece) + ' on ' + B.sqName(a0.sq) + '</b> and nothing of yours is defending it.';
      }
    }
    game.log.unshift({ type: byHuman ? 'you' : 'them', text: txt });
    if (!byHuman) {
      threatReport(game.st, game.humanColor).forEach(function (t) {
        game.log.unshift({ type: 'tip', text: (t.level === 'danger' ? '<i class="i i-alert"></i> ' : '<i class="i i-bulb"></i> ') + esc(t.text) });
      });
    }
    game.log = game.log.slice(0, 24);
  }
  function paintLog() {
    var el = $('#coachLog');
    if (!el) return;
    if (!game || !game.log || !game.log.length) {
      el.innerHTML = '<p class="muted small">Play a move and I will explain it here in plain English — what it did, and what the computer is threatening.</p>';
      return;
    }
    el.innerHTML = game.log.map(function (e) { return '<div class="coach-item ' + e.type + '">' + e.text + '</div>'; }).join('');
  }

  function pushMove(m, byHuman) {
    var pre = game.st;
    var san = B.toSAN(game.st, m);
    var wasCap = !!m.captured;
    game.st = B.makeMove(game.st, m);
    game.sans.push(san); game.ucis.push(B.moveToUci(m)); game.fens.push(B.toFEN(game.st));
    game.lastMove = { from: m.from, to: m.to };
    game.moveCount++;
    if (game.clock) { game.clock[game.st.turn] += game.clock.inc; game.clock.last = Date.now(); }
    S.stats.moves++; save();
    sound(wasCap ? 'cap' : 'move');
    if (game.coach) coachNote(pre, m, byHuman);
    return san;
  }

  function engineMove() {
    if (game.over) return;
    game.thinking = true; paintPlay();
    setTimeout(function () {
      var t0 = Date.now();
      var m = B.bestMove(game.st, { level: game.level });
      var thinkTime = Math.max(280, Math.min(1600, Date.now() - t0));
      setTimeout(function () {
        if (!m) { game.thinking = false; computeStatus(); paintPlay(); return; }
        pushMove(m, false);
        game.thinking = false;
        computeStatus();
        if (!game.over) maybeCoach();
        paintPlay();
      }, Math.max(0, thinkTime - (Date.now() - t0)));
    }, 40);
  }

  /* ---- blunder guard ---- */
  function quickEval(st, ms) {
    var sc = B.rootScores(st, 2, { nodes: 0, stop: false, deadline: Date.now() + (ms || 350) });
    if (!sc.length) return null;
    sc.sort(function (a, b) { return b.score - a.score; });
    return { best: sc[0], all: sc };
  }
  function guardMove(m, cb) {
    if (!game.coach) return cb(true);
    var pre = quickEval(game.st, 420);
    var after = B.makeMove(game.st, m);
    var rep = quickEval(after, 420);
    if (!pre || !rep) return cb(true);
    var oppBest = rep.best.score;              // from opponent's view
    var ourScore = -oppBest;
    var drop = pre.best.score - ourScore;
    var mateIncoming = ourScore < -B.MATE + 200;
    if (drop < 180 && !mateIncoming) return cb(true);
    var danger = '';
    var m2 = rep.best.move;
    var line = B.toSAN(after, m2) + (B.toSAN(game.st, m) || '');
    danger = mateIncoming ? 'This move allows a <b>forced mate</b>.' :
      drop >= 500 ? 'This move loses material — about <b>' + (drop / 100).toFixed(1) + ' pawns</b>.' :
        'This move is a mistake — about <b>' + (drop / 100).toFixed(1) + ' pawns</b> worse than your best.';
    var counters = rep.all.slice(0, 3).map(function (x) { return B.toSAN(after, x.move); });
    modal({
      title: '<i class="i i-shield"></i> Blunder Guard',
      body: '<p class="big-warn">' + danger + '</p>' +
        '<p>The engine would answer with <b>' + counters.map(esc).join('</b> or <b>') + '</b>.</p>' +
        '<p class="muted">Run the checklist: what did his last move attack? Is something of mine hanging? What is his best reply to my move?</p>',
      buttons: [
        { label: 'Let me take it back', cls: 'primary', onClick: function () { cb(false); } },
        { label: 'Show me the danger', onClick: function () { var best = pre.best.move; game.hintArrow = [{ from: best.from, to: best.to, color: 'rgba(80,220,140,.9)' }]; paintPlay(); cb(false); toast('The best move is shown with a green arrow. Try again.', 'good'); } },
        { label: 'Play it anyway', cls: 'danger', onClick: function () { cb(true); } }
      ]
    });
  }

  function maybeCoach() {
    if (!game.coach || game.over) return;
    /* silent: coach messages shown in the side panel */
  }

  function tryHumanMove(from, to) {
    var list = B.legalMoves(game.st);
    var cands = list.filter(function (m) { return m.from === from && m.to === to; });
    if (!cands.length) return false;
    if (cands.length > 1) { // promotion
      board.promoPrompt(game.st.board[from][0], function (p) {
        var m = cands.filter(function (x) { return x.promo === p; })[0];
        afterPromo(m);
      });
      return true;
    }
    afterPromo(cands[0]);
    return true;
  }
  function afterPromo(m) {
    guardMove(m, function (ok) {
      if (!ok) { game.selected = null; game.targets = []; game.hintArrow = []; paintPlay(); return; }
      pushMove(m, true);
      game.selected = null; game.targets = []; game.over = false;
      game.hintArrow = [];
      if (game.guide && !game.over) guideAfterHuman(m);
      computeStatus();
      if (!game.over) { if (game.drill) drillAfterHuman(); else engineMove(); }
      paintPlay();
    });
  }

  function onSquare(sq) {
    if (game.over || game.thinking) return;
    if (game.st.turn !== game.humanColor) return;
    var p = game.st.board[sq];
    if (game.selected != null) {
      if (sq === game.selected) { game.selected = null; game.targets = []; paintPlay(); return; }
      if (game.targets.indexOf(sq) >= 0) { tryHumanMove(game.selected, sq); return; }
    }
    if (p && p[0] === game.humanColor) {
      game.selected = sq;
      game.targets = B.legalMoves(game.st).filter(function (m) { return m.from === sq; }).map(function (m) { return m.to; });
    } else { game.selected = null; game.targets = []; }
    paintPlay();
  }

  function paintPlay() {
    if (!board || currentView !== 'play') return;
    var checkSq = null;
    if (B.inCheck(game.st, game.st.turn)) checkSq = B.findKing(game.st, game.st.turn);
    board.state = game.st;
    board.dragColor = game.humanColor;
    board.flipped = game.humanColor === 'b';
    var showMe = [];
    if (S.settings.showMoves && !game.over && game.st.turn === game.humanColor && !game.thinking) {
      var lm = B.legalMoves(game.st), seen = {};
      lm.forEach(function (mv) { if (!seen[mv.from]) { seen[mv.from] = 1; showMe.push(mv.from); } });
    }
    board.hints = showMe;
    board.set({ state: game.st, selected: game.selected, targets: game.targets, lastMove: game.lastMove, checkSquare: checkSq, arrows: game.hintArrow || [], hints: showMe });
    paintLog();
    guideTick();
    var ml = $('#moveList');
    if (ml) {
      var rows = '', i;
      for (i = 0; i < game.sans.length; i += 2) {
        rows += '<div class="mv-row"><span class="num">' + (i / 2 + 1) + '.</span><span class="mv">' + esc(game.sans[i]) + '</span>' +
          '<span class="mv">' + esc(game.sans[i + 1] || '') + '</span></div>';
      }
      ml.innerHTML = rows || '<p class="muted small">No moves yet.</p>';
      ml.scrollTop = ml.scrollHeight;
    }
    var statusEl = $('#gameStatus');
    if (statusEl) {
      if (game.over) statusEl.innerHTML = resultText(game.result);
      else if (game.thinking) statusEl.innerHTML = '<i class="i i-cpu"></i> <b>' + levelName(game.level) + '</b> is thinking…';
      else statusEl.innerHTML = (game.st.turn === game.humanColor ? '<i class="i i-dot"></i> <b>Your move</b>' : '<i class="i i-clock"></i> ' + levelName(game.level) + ' to move') +
        (game.coach ? ' · <span class="coach-on">Blunder Guard ON</span>' : '');
    }
  }
  function resultText(r) {
    if (!r) return '';
    if (r.reason === 'checkmate') return game.result && r.result === game.humanColor ? '<i class="i i-trophy"></i> Checkmate — you win!' : '<i class="i i-skull"></i> Checkmate — you lost.';
    if (r.result === 'draw') return '½–½ Draw — ' + r.reason;
    return r.result === game.humanColor ? '<i class="i i-trophy"></i> You win (' + r.reason + ')' : '<i class="i i-skull"></i> You lost (' + r.reason + ')';
  }

  function finishGame() {
    stopClock();
    if (game.drill) { finishDrill(); return; }
    var won = game.result.result === game.humanColor;
    var drew = game.result.result === 'draw';
    S.stats.games++;
    if (won) { S.stats.wins++; S.stats.winStreak++; S.stats.bestWinStreak = Math.max(S.stats.bestWinStreak, S.stats.winStreak); }
    else { S.stats.losses++; S.stats.winStreak = 0; }
    if (drew) S.stats.draws++;
    var rec = {
      id: 'g' + Date.now(), date: new Date().toISOString(), level: game.level, color: game.humanColor,
      result: game.result.result, reason: game.result.reason, sans: game.sans.slice(), ucis: game.ucis.slice(),
      fens: game.fens.slice(), plies: game.sans.length
    };
    S.games.unshift(rec); S.games = S.games.slice(0, 40);
    save();
    addXp(won ? 120 : drew ? 70 : 40, won ? 'game won vs ' + levelName(game.level) : (drew ? 'draw' : 'game finished — you still learned'));
    sound(won ? 'good' : 'bad');
    modal({
      title: won ? '<i class="i i-trophy"></i> Victory!' : drew ? '½–½ Draw' : '<i class="i i-skull"></i> Defeat',
      body: '<p class="big">' + resultText(game.result) + '</p>' +
        '<p class="muted">' + game.sans.length + ' moves played · opponent: ' + esc(levelName(game.level)) + '</p>' +
        '<p>The game is saved. <b>Run the Blunder Report</b> — this is where the real learning happens (Day 7 skill, use it every game).</p>',
      buttons: [
        { label: 'Run Blunder Report', cls: 'primary', onClick: function () { analyzeCurrentGame(); } },
        { label: 'Rematch', onClick: function () { startPlayView(); } },
        { label: 'Close' }
      ]
    });
    paintPlay();
  }

  /* ---- analysis ---- */
  function analyzeGame(rec, onDone, progressEl) {
    var st = B.parseFEN(rec.fens[0]);
    var steps = [];
    var i = 0;
    function chunk() {
      var t0 = Date.now();
      while (i < rec.ucis.length && Date.now() - t0 < 220) {
        var m = B.uciToMove(st, rec.ucis[i]);
        if (!m) break;
        var pre = B.rootScores(st, 2, { nodes: 0, stop: false, deadline: Date.now() + 260 });
        if (!pre.length) break;
        pre.sort(function (a, b) { return b.score - a.score; });
        var bestScore = pre[0].score, bestMove = pre[0].move;
        var st2 = B.makeMove(st, m);
        var rep = B.rootScores(st2, 2, { nodes: 0, stop: false, deadline: Date.now() + 260 });
        rep.sort(function (a, b) { return b.score - a.score; });
        var afterScore = rep.length ? -rep[0].score : bestScore;
        var drop = bestScore - afterScore;
        steps.push({
          ply: i, san: rec.sans[i], best: B.toSAN(st, bestMove), bestUci: B.moveToUci(bestMove),
          drop: Math.max(0, drop), fenBefore: rec.fens[i], byHuman: (i % 2 === 0) === (rec.color === 'w'),
          scoreBefore: bestScore, scoreAfter: afterScore
        });
        st = st2;
        i++;
      }
      if (progressEl) progressEl.textContent = Math.round(i / rec.ucis.length * 100) + '%';
      if (i >= rec.ucis.length) { onDone(steps); } else setTimeout(chunk, 0);
    }
    chunk();
  }

  function analyzeCurrentGame() {
    var m = modal({
      title: '<i class="i i-search"></i> Blunder Report', wide: true, closable: true,
      body: '<p class="muted">Analysing every move of your ' + game.sans.length + '-move game… <span id="anProg">0%</span></p><div id="anBody"></div>'
    });
    var rec = { fens: game.fens.slice(), ucis: game.ucis.slice(), sans: game.sans.slice(), color: game.humanColor };
    analyzeGame(rec, function (steps) {
      var mine = steps.filter(function (s) { return s.byHuman; });
      var blunders = mine.filter(function (s) { return s.drop >= 500; });
      var mistakes = mine.filter(function (s) { return s.drop >= 250 && s.drop < 500; });
      var inacc = mine.filter(function (s) { return s.drop >= 100 && s.drop < 250; });
      var good = mine.filter(function (s) { return s.drop < 100; });
      var flagged = mine.filter(function (s) { return s.drop >= 100; });
      var worst = (flagged.length ? flagged : mine).slice().sort(function (a, b) { return b.drop - a.drop; }).slice(0, 5);
      var html = (flagged.length === 0 ? '<p class="big" style="color:var(--green)"><i class="i i-checkc"></i> No real errors found — that was a clean game. Keep this standard.</p>' : '') +
        '<div class="stats-grid">' + stat('Your moves', mine.length) + stat('<i class="i i-checkc"></i> Good', good.length) +
        stat('<i class="i i-alert"></i> Inaccuracies', inacc.length) + stat('<i class="i i-xc"></i> Mistakes', mistakes.length) + stat('<i class="i i-skull"></i> Blunders', blunders.length) + '</div>';
      var tips = [];
      if (blunders.length) tips.push('Your blunders almost always start with an unchecked capture or check. Use the 6-question checklist before every capture.');
      if (mine.some(function (s) { return /K|Q/.test(s.san) === false; })) tips.push('Look for the quiet best moves — the engine often prefers a developing move over grabbing a pawn.');
      tips.push('Rule: every time your opponent moves, ask "what did that attack?" before you look at your own ideas.');
      html += '<h4>' + (flagged.length ? 'Your worst moments' : 'Closest decisions') + '</h4><div class="row wrap">' + worst.map(function (s) {
        return '<button class="mini-btn" data-fen="' + esc(s.fenBefore) + '" data-best="' + esc(s.bestUci) + '">Move ' + (Math.floor(s.ply / 2) + 1) +
          ' — you played <b>' + esc(s.san) + '</b>, best was <b>' + esc(s.best) + '</b> (−' + (s.drop / 100).toFixed(1) + ')</button>';
      }).join('') + '</div>';
      html += '<h4>Coach says</h4><ul class="bullets">' + tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
      $('#anBody').innerHTML = html;
      $$('#anBody .mini-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          var fen = b.getAttribute('data-fen'), best = b.getAttribute('data-best');
          m.close();
          S.stats.blunders += blunders.length; save();
          nav('play');
          setTimeout(function () {
            newGame({ humanColor: 'w', fen: fen, level: game.level, coach: false, hint: false });
            var mv = B.uciToMove(game.st, best);
            var best2 = B.rootScores(game.st, 3, { nodes: 0, stop: false, deadline: Date.now() + 700 }).sort(function (a, b) { return b.score - a.score; })[0];
            game.hintArrow = [{ from: best2.move.from, to: best2.move.to, color: 'rgba(120,230,150,.9)' }];
            game.coach = false; game.over = true; // study mode: arrows only
            setTimeout(function () { game.over = false; game.humanColor = game.st.turn; paintPlay(); toast('Study position: the green arrow is the move you missed.', 'good', 4000); }, 60);
            paintPlay();
          }, 80);
        });
      });
    }, $('#anProg'));
  }

  function vPlay(view, params) {
    if (params.level) S.settings.level = parseInt(params.level, 10);
    view.innerHTML =
      '<div class="play-wrap">' +
      '<div class="board-col"><div class="card board-card"><div class="clock-row">' +
      '<div class="clock" id="clkBoxW"><span class="clk" data-c="w" id="clkw">—</span><small>YOU' + '</small></div>' +
      '<div class="clock" id="clkBoxB"><span class="clk" data-c="b" id="clkb">—</span><small>ENGINE</small></div>' +
      '</div><div id="boardHost"></div>' +
      '<div class="board-foot"><div style="min-width:200px"><div id="gameStatus" class="status"></div>' +
      '<p class="hintline"><i class="i i-pointer"></i> <b>Tap your piece, then tap a green dot</b> — or just drag the piece. (Pieces with a blue glow can move.)</p></div>' +
      '<div class="row gap wrap"><button class="btn sm" id="btnWhy"><i class="i i-help"></i> Why?</button><button class="btn sm" id="btnHint"><i class="i i-bulb"></i> Show best move</button><button class="btn sm" id="btnUndo"><i class="i i-undo"></i> Undo</button>' +
      '<button class="btn sm" id="btnFlip"><i class="i i-flip"></i> Flip</button><button class="btn sm" id="btnSize"><i class="i i-search"></i> Size</button>' +
      '<button class="btn sm danger" id="btnResign"><i class="i i-flag"></i> Resign</button></div></div>' +
      '</div>' +
      '<div class="guide-bar" id="guideBar" hidden></div>' +
      '</div>' +
      '<div class="side-col">' +
      '<div class="card"><div class="row between"><h3>What just happened</h3><span class="badge">plain English</span></div>' +
      '<div class="coach-log" id="coachLog"></div></div>' +
      '<div class="card"><h3>Match setup</h3><div class="ctl">' +
      '<label>Engine level</label><select id="selLevel">' + [0, 1, 2, 3, 4, 5].map(function (l) { return '<option value="' + l + '"' + (S.settings.level === l ? ' selected' : '') + '>' + B.LEVELS[l].name + '</option>'; }).join('') + '</select>' +
      '<label>You play</label><select id="selColor"><option value="w">White</option><option value="b">Black</option></select>' +
      '<label>Clock</label><select id="selClock"><option value="off">No clock (training)</option><option value="15+10">15 + 10 (tournament)</option></select>' +
      '<label class="chk"><input type="checkbox" id="chkCoach"' + (S.settings.coach ? ' checked' : '') + '> <span><b>Blunder Guard</b> — warns me before I throw away material</span></label>' +
      '<label class="chk"><input type="checkbox" id="chkHint"' + (S.settings.hints ? ' checked' : '') + '> <span>Hints allowed</span></label>' +
      '<label class="chk"><input type="checkbox" id="chkMoves"' + (S.settings.showMoves ? ' checked' : '') + '> <span><b>Show all my moves</b> — blue glow on every piece I can move</span></label>' +
      '<label class="chk"><input type="checkbox" id="chkCoords"' + (S.settings.showCoords ? ' checked' : '') + '> <span>Board coordinates</span></label>' +
      '<label class="chk"><input type="checkbox" id="chkSound"' + (S.settings.sound ? ' checked' : '') + '> <span>Sound effects</span></label>' +
      '<button class="btn primary block" id="btnNew">Start new game</button>' +
      '</div></div>' +
      '<div class="card"><div class="row between"><h3>Moves</h3><span class="row gap"><button class="btn sm" id="btnPgn"><i class="i i-clipboard"></i> PGN</button><button class="btn sm" id="btnAnalyze"><i class="i i-search"></i> Blunder Report</button></span></div>' +
      '<div id="moveList" class="movelist"></div></div>' +
      '<div class="card coach-card"><h3>Reminders</h3><div id="coachPanel" class="coach-txt"></div></div>' +
      '</div></div>';

    board = BD.create($('#boardHost'), { orientation: 'w', onSquare: onSquare, showCoords: S.settings.showCoords });
    var keepLevel = game ? game.level : S.settings.level;
    newGame({ level: keepLevel, humanColor: $('#selColor').value, coach: S.settings.coach, hint: S.settings.hints, timeControl: S.settings.clock });

    $('#btnNew').addEventListener('click', function () {
      S.settings.level = parseInt($('#selLevel').value, 10);
      S.settings.coach = $('#chkCoach').checked; S.settings.hints = $('#chkHint').checked;
      S.settings.clock = $('#selClock').value;
      save();
      newGame({ level: S.settings.level, humanColor: $('#selColor').value, coach: S.settings.coach, hint: S.settings.hints, timeControl: S.settings.clock });
      board.flipped = game.humanColor === 'b';
      paintPlay();
      if (game.st.turn !== game.humanColor) engineMove();
    });
    $('#selColor').addEventListener('change', function () {
      newGame({ level: parseInt($('#selLevel').value, 10), humanColor: $('#selColor').value, coach: $('#chkCoach').checked, hint: $('#chkHint').checked, timeControl: $('#selClock').value });
      board.flipped = game.humanColor === 'b'; paintPlay();
      if (game.st.turn !== game.humanColor) engineMove();
    });
    $('#chkCoach').addEventListener('change', function () { game.coach = this.checked; S.settings.coach = this.checked; save(); toast(this.checked ? 'Blunder Guard ON — I will warn you before a blunder.' : 'Blunder Guard OFF (match mode).', 'xp'); paintPlay(); });
    $('#chkHint').addEventListener('change', function () { game.allowHint = this.checked; S.settings.hints = this.checked; save(); });
    var cc = $('#chkCoords'); if (cc) cc.addEventListener('change', function () { S.settings.showCoords = this.checked; save(); board.showCoords = this.checked; board.render(); });
    var cs = $('#chkSound'); if (cs) cs.addEventListener('change', function () { S.settings.sound = this.checked; save(); if (this.checked) sound('good'); });
    var cm = $('#chkMoves'); if (cm) cm.addEventListener('change', function () { S.settings.showMoves = this.checked; save(); paintPlay(); });
    $('#btnWhy').addEventListener('click', function () {
      if (game.over) return toast('The game is over — start a new one.', 'xp');
      if (game.st.turn !== game.humanColor) return toast('Wait for the computer to move first.', 'xp');
      toast('Thinking about the best plan…', 'xp');
      setTimeout(function () {
        var sug = suggestMove(game.st, game.humanColor);
        if (!sug) return;
        game.hintArrow = [{ from: sug.move.from, to: sug.move.to, color: 'rgba(96,165,250,.92)' }];
        paintPlay();
        modal({
          title: '<i class="i i-help"></i> Why ' + esc(sug.san) + '?',
          body: '<p class="big">Try <b>' + esc(sug.san) + '</b> — the blue arrow on the board shows where.</p>' +
            '<ul class="bullets">' + sug.why.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>' +
            '<p class="muted small">Take your time. Understanding one move properly is worth more than playing ten fast ones.</p>',
          buttons: [{ label: 'Got it — let me try', cls: 'primary' }, { label: 'Show me a different idea', onClick: function () { setTimeout(function () { $('#btnWhy').click(); }, 200); } }]
        });
      }, 30);
    });
    $('#btnFlip').addEventListener('click', function () { board.flip(); });
    $('#btnSize').addEventListener('click', function () {
      var sizes = ['auto', 'small', 'large'];
      var host = $('#boardHost');
      var cur = host.getAttribute('data-bsize') || 'auto';
      var next = sizes[(sizes.indexOf(cur) + 1) % sizes.length];
      board.setSizeMode(next);
      toast('Board size: <b>' + next + '</b>' + (next === 'auto' ? ' (always fits your screen)' : next === 'small' ? ' (compact)' : ' (maximum)'), 'xp', 1600);
    });
    $('#btnHint').addEventListener('click', function () {
      if (!game.allowHint) return toast('Hints are off for this game (competition mode). Use the checklist instead.', 'bad');
      toast('Thinking…'); 
      setTimeout(function () {
        var sc = B.rootScores(game.st, 3, { nodes: 0, stop: false, deadline: Date.now() + 900 }).sort(function (a, b) { return b.score - a.score; });
        if (!sc.length) return;
        game.hintArrow = [{ from: sc[0].move.from, to: sc[0].move.to, color: 'rgba(120,230,150,.9)' }];
        paintPlay();
        toast('Hint: play <b>' + esc(B.toSAN(game.st, sc[0].move)) + '</b> — the green arrow shows it.', 'good', 4000);
      }, 30);
    });
    $('#btnUndo').addEventListener('click', function () {
      if (game.sans.length < 2) return;
      var n = (game.st.turn === game.humanColor) ? 2 : 1;
      for (var i = 0; i < n; i++) {
        game.sans.pop(); game.ucis.pop(); game.fens.pop();
      }
      game.st = B.parseFEN(game.fens[game.fens.length - 1]);
      game.lastMove = null; game.over = false; game.selected = null; game.targets = []; game.hintArrow = [];
      paintPlay();
    });
    $('#btnResign').addEventListener('click', function () {
      if (game.over) return;
      game.over = true; game.result = { over: true, result: B.other(game.humanColor), reason: 'you resigned' };
      finishGame();
    });
    $('#btnPgn').addEventListener('click', function () {
      if (!game.sans.length) return toast('No moves yet.', 'bad');
      copyText(pgnOf({ sans: game.sans, color: game.humanColor, level: game.level, date: new Date().toISOString(), result: game.over && game.result ? game.result.result : null }), 'PGN copied');
    });
    $('#btnAnalyze').addEventListener('click', function () {
      if (!game.sans.length) return toast('Play some moves first.', 'bad');
      analyzeCurrentGame();
    });
    if (game.drill) { /* drill view handled separately */ }
    if (game.st.turn !== game.humanColor) engineMove();
    paintPlay();
    updateCoachPanel();
    var clkRow = $('.clock-row');
    if (!game.clock) clkRow.style.display = 'none'; else { $('#clkw').textContent = fmtClock(game.clock.w); $('#clkb').textContent = fmtClock(game.clock.b); }
  }
  function updateCoachPanel() {
    var p = $('#coachPanel'); if (!p) return;
    var tips = [
      'Before every move: <b>what did his last move attack?</b>',
      'Count attackers vs defenders before every capture.',
      'Castle before move 10. No exceptions.',
      'Develop a NEW piece every move in the opening — no repeat moves.',
      'If you are winning: trade pieces, not pawns.',
      'Look for checks and captures first — they are the most forcing moves.',
      'A knight on the rim is dim. Centralize.',
      'Two pieces attacking a defended king = bad. Count attackers vs defenders.'
    ];
    p.innerHTML = '<p class="muted small">Rotating reminders from the Playbook:</p><ul class="bullets">' +
      tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  }

  /* ============================ PUZZLES ============================ */
  var pz = null;
  function puzzlesOf(mode) {
    if (mode === 'mix') return PUZZLES.filter(function (p) { return p.type === 'mate1' || p.type === 'mate2'; });
    return PUZZLES.filter(function (p) { return p.type === mode; });
  }
  function vPuzzles(view, params) {
    var mode = params.mode || 'mate1';
    var n = parseInt(params.n || '20', 10);
    var pool = shuffle(puzzlesOf(mode));
    if (S.settings.beginner) {
      pool.sort(function (a, b) { return pieceCount(a.fen) - pieceCount(b.fen); });   // fewest pieces = easiest
    }
    var session = pool.slice(0, Math.min(n, pool.length));
    pz = { mode: mode, list: session, i: 0, correct: 0, firstTry: 0, attempts: 0, streak: 0, hints: 0, solvedFens: {}, done: false };
    view.innerHTML = headerBar('Puzzle Trainer', modeTitle(mode) + ' · engine-verified positions · ' + session.length + ' in this session',
      '<button class="btn sm" id="btnRestart"><i class="i i-refresh"></i> New session</button>') +
      '<div class="puzzle-modes">' + ['mate1', 'mate2', 'tactic', 'defense', 'mix'].map(function (m) {
        return '<button class="chip' + (m === mode ? ' on' : '') + '" data-mode="' + m + '">' + modeTitle(m) + '</button>';
      }).join('') + '</div>' +
      '<div class="play-wrap"><div class="board-col"><div class="card board-card"><div id="pzHost"></div>' +
      '<div class="board-foot"><div style="min-width:200px"><div id="pzStatus" class="status"></div>' +
      '<p class="hintline"><i class="i i-pointer"></i> Tap the piece, then tap the square you want <b>(or drag it)</b>.</p></div><div class="row gap">' +
      '<button class="btn sm" id="pzHint"><i class="i i-bulb"></i> Hint</button><button class="btn sm" id="pzShow">Show solution</button>' +
      '<button class="btn sm" id="pzRetry"><i class="i i-rccw"></i> Retry position</button></div></div></div></div>' +
      '<div class="side-col"><div class="card"><h3>Session</h3><div class="stats-grid">' +
      stat('Puzzle', '<span id="pzNo">1</span>/' + session.length) + stat('Solved', '<span id="pzOk">0</span>') +
      stat('First-try', '<span id="pzFt">0</span>') + stat('Streak', '<span id="pzSt">0</span>') + '</div>' +
      '<div class="progress"><div id="pzBar" style="width:0%"></div></div>' +
      '<p class="muted small" id="pzMotif"></p></div>' +
      '<div class="card"><h3>How to solve like a beast</h3><ul class="bullets small">' +
      '<li>When you see a <b>check</b>, calculate it before anything else.</li>' +
      '<li>Every <b>capture</b> is a candidate: is his piece defended?</li>' +
      '<li>Ask: which of my pieces attacks <b>two things at once</b>?</li>' +
      '<li>Name the motif out loud (fork / pin / skewer / back rank).</li></ul></div></div></div>';

    var pb = BD.create($('#pzHost'), { orientation: 'w', onSquare: pzSquare, showCoords: true });
    pz.board = pb;
    $$('.puzzle-modes .chip', view).forEach(function (c) { c.addEventListener('click', function () { nav('puzzles', 'mode=' + c.getAttribute('data-mode') + '&n=' + n); }); });
    $('#btnRestart').addEventListener('click', function () { nav('puzzles', 'mode=' + mode + '&n=' + n); });
    $('#pzHint').addEventListener('click', function () { pzHint(); });
    $('#pzShow').addEventListener('click', function () { pzShowSolution(); });
    $('#pzRetry').addEventListener('click', function () { pzLoad(pz.i); });
    pzLoad(0);
  }
  function modeTitle(m) {
    return ({ mate1: 'Mate in 1', mate2: 'Mate in 2', tactic: 'Win material', defense: 'Only-move defense', mix: 'Mixed mates' })[m] || m;
  }
  function pieceCount(fen) { var n = 0, b = fen.split(' ')[0]; for (var i = 0; i < b.length; i++) if (/[a-zA-Z]/.test(b[i])) n++; return n; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* replay a SAN list from the start position -> verified sans + fens (client side) */
  function replayLine(sans) {
    var st = B.parseFEN(B.START_FEN), fens = [B.toFEN(st)], out = [];
    for (var i = 0; i < sans.length; i++) {
      var m = B.fromSAN(st, sans[i]);
      if (!m) break;
      out.push(B.toSAN(st, m));
      st = B.makeMove(st, m);
      fens.push(B.toFEN(st));
    }
    return { sans: out, fens: fens };
  }

  function pzLoad(i) {
    if (!pz || currentView !== 'puzzles') return;
    if (i >= pz.list.length) return pzFinish();
    var p = pz.list[i];
    pz.p = p; pz.solIndex = 0; pz.tries = 0; pz.attempts = 0; pz.state = B.parseFEN(p.fen);
    if (!pz.board || !pz.board.element || !pz.board.element.isConnected) return;
    pz.board.set({ state: pz.state, selected: null, targets: [], lastMove: null, arrows: [], checkSquare: null });
    pz.board.flipped = pz.state.turn === 'b';
    setText('#pzNo', i + 1);
    if ($('#pzBar')) $('#pzBar').style.width = (i / pz.list.length * 100) + '%';
    var prompt = p.type === 'defense' ? '<i class="i i-shield"></i> You are under threat. Find the ONLY move that survives.' :
      p.type === 'mate1' ? '<i class="i i-crown"></i> Mate in 1 — one move ends the game.' :
        p.type === 'mate2' ? '<i class="i i-crown"></i> Mate in 2 — set it up (a check or a threat), then mate.' :
          '<i class="i i-zap"></i> Find the strongest move (you can win material).';
    setHTML('#pzStatus', prompt + ' <b>' + (pz.state.turn === 'w' ? 'White' : 'Black') + ' to move.</b>');
    setHTML('#pzMotif', '<b>Pool:</b> ' + modeTitle(pz.mode) + ' · <b>Puzzle id:</b> ' + esc(p.id || (p.type + '-' + i)));
  }
  function pzSquare(sq) {
    if (!pz || pz.solvedThis || pz.showing) return;
    var st = pz.state;
    if (pz.selected != null) {
      if (sq === pz.selected) { pz.selected = null; pz.targets = []; pz.board.set({ selected: null, targets: [] }); return; }
      if (pz.targets.indexOf(sq) >= 0) { pzAttempt(pz.selected, sq); return; }
    }
    var pc = st.board[sq];
    if (pc && pc[0] === st.turn) {
      pz.selected = sq;
      pz.targets = B.legalMoves(st).filter(function (m) { return m.from === sq; }).map(function (m) { return m.to; });
      pz.board.set({ selected: sq, targets: pz.targets });
    } else { pz.selected = null; pz.targets = []; pz.board.set({ selected: null, targets: [] }); }
  }
  function pzAttempt(from, to) {
    var p = pz.p, st = pz.state;
    var want = p.solution[pz.solIndex];
    var cands = B.legalMoves(st).filter(function (m) { return m.from === from && m.to === to; });
    if (!cands.length) return;
    var mv = cands.length > 1 ? (cands.filter(function (c) { return B.moveToUci(c) === want; })[0] || cands[0]) : cands[0];
    var uci = B.moveToUci(mv);
    pz.attempts++;
    if (uci === want) {
      var san = B.toSAN(st, mv);
      pz.state = B.makeMove(st, mv);
      pz.selected = null; pz.targets = [];
      pz.board.set({ state: pz.state, selected: null, targets: [], lastMove: { from: from, to: to } });
      sound('good');
      var nextWant = p.solution[pz.solIndex + 1];
      if (!nextWant) { pzCorrect(); return; }
      pz.solIndex++;
      // opponent reply
      setHTML('#pzStatus', '<i class="i i-checkc"></i> <b>' + esc(san) + '</b> — correct! Now watch his reply…');
      setTimeout(function () {
        var opp = B.uciToMove(pz.state, nextWant) || (B.legalMoves(pz.state).sort(function (a, b) { return (b.captured ? 1 : 0) - (a.captured ? 1 : 0); })[0]);
        if (!opp) { pzCorrect(); return; }
        var oppSan = B.toSAN(pz.state, opp);
        var f = opp.from, t = opp.to;
        pz.state = B.makeMove(pz.state, opp);
        pz.solIndex++;
        pz.board.set({ state: pz.state, lastMove: { from: f, to: t }, selected: null, targets: [] });
        var rem = p.solution.length - pz.solIndex;
        if (rem <= 0) { pzCorrect(oppSan); }
        else setHTML('#pzStatus', 'He played <b>' + esc(oppSan) + '</b>. Your move — finish it!');
      }, 520);
    } else {
      pz.tries++; sound('bad');
      var drop = want ? (' Find the move that ' + (p.type === 'defense' ? 'saves you.' : p.type === 'mate1' || p.type === 'mate2' ? 'mates him.' : 'wins material.')) : '';
      setHTML('#pzStatus', '<i class="i i-xc"></i> Not that. <b>Run the checklist:</b> what did you miss — a check, a capture, a fork, a back-rank, his threat?' + drop);
      pz.board.set({ selected: null, targets: [] });
      pz.selected = null; pz.targets = [];
      if (pz.tries >= 2) pzHint(true);
    }
  }
  function pzHint(lite) {
    var p = pz.p; if (!p) return;
    var want = p.solution[pz.solIndex];
    var mv = B.uciToMove(pz.state, want);
    if (!mv) return;
    pz.hints++;
    pz.board.set({ arrows: [{ from: mv.from, to: mv.to, color: 'rgba(120,230,150,.9)' }] });
    setHTML('#pzStatus', '<i class="i i-bulb"></i> ' + (lite ? 'Still not it. ' : '') + 'The green arrow shows the first move — <b>' + esc(B.toSAN(pz.state, mv)) + '</b>. Now find the point of it.');
  }
  function pzShowSolution() {
    var p = pz.p; if (!p) return;
    pz.showing = true;
    var st = B.parseFEN(p.fen), sans = [];
    p.solution.forEach(function (u) { var m = B.uciToMove(st, u); if (m) { sans.push(B.toSAN(st, m)); st = B.makeMove(st, m); } });
    pz.board.set({ state: st, arrows: [] });
    setHTML('#pzStatus', '<i class="i i-book"></i> Solution: <b>' + esc(sans.join(' ')) + '</b> — ' + esc(p.motif || '') + '.<br><span class="muted">' + esc(p.threat || solutionWhy(p)) + '</span>');
    S.stats.puzzles.attempted++; save();
    pz.solvedThis = true;
  }
  function solutionWhy(p) {
    if (p.type === 'mate1') return 'The king has no escape square and the checking piece cannot be captured.';
    if (p.type === 'mate2') return 'The first move forces the reply, then the mate lands.';
    if (p.type === 'defense') return 'Every other move loses material or gets mated.';
    return 'This move wins material or forces a winning attack.';
  }
  function pzCorrect(oppSan) {
    var p = pz.p;
    pz.solvedThis = true;
    var stats = S.stats.puzzles;
    stats.attempted++; stats.solved++;
    stats.byType[p.type] = stats.byType[p.type] || { a: 0, s: 0 };
    stats.byType[p.type].a++;
    if (pz.tries === 0 && pz.hints === 0) { stats.firstTry++; stats.byType[p.type].s++; pz.firstTry++; }
    pz.correct++;
    pz.streak++;
    pz.hints = 0;
    save();
    addXp(pz.tries === 0 && pz.hints === 0 ? 12 : 5, 'puzzle solved');
    sound('good');
    setText('#pzOk', pz.correct); setText('#pzFt', pz.firstTry); setText('#pzSt', pz.streak);
    setHTML('#pzStatus', (oppSan ? 'His reply: <b>' + esc(oppSan) + '</b> · ' : '') + '<i class="i i-checkc"></i> <b>SOLVED</b> — ' + esc(p.motif || p.type) +
      '.<br><span class="muted">' + esc(solutionWhy(p)) + '</span>' + (p.type === 'defense' && p.evalAfter ? ' <span class="muted">(Engine: you survive at ' + p.evalAfter + ')</span>' : ''));
    setTimeout(function () { pz.i++; pzLoad(pz.i); }, 1500);
  }
  function pzFinish() {
    $('#pzBar').style.width = '100%';
    $('#pzStatus').innerHTML = '<i class="i i-flagcheck"></i> Session complete.';
    var acc = pz.list.length ? Math.round(pz.firstTry / pz.list.length * 100) : 0;
    modal({
      title: '<i class="i i-flagcheck"></i> Puzzle session complete',
      body: '<p class="big">First-try accuracy: <b>' + acc + '%</b> (' + pz.firstTry + '/' + pz.list.length + ')</p>' +
        '<p>' + (acc >= 80 ? 'That is tournament-level accuracy. Move to the next mode or raise the level.' : acc >= 55 ? 'Good progress. Repeat this mode — speed and accuracy come from repetition.' : 'Below 55%: slow down. Solve 10 puzzles at walking pace and say the motif out loud for each one.') + '</p>',
      buttons: [{ label: 'New session', cls: 'primary', onClick: function () { nav('puzzles', 'mode=' + pz.mode); } }, { label: 'Play a game', onClick: function () { nav('play'); } }]
    });
    addXp(30, 'puzzle session finished');
  }

  /* ============================ ENDGAME LAB ============================ */
  var DRILLS = [
    {
      id: 'q-k', name: 'King + Queen vs King — the basic mate', goal: 'win', fen: '8/8/8/4k3/8/8/8/K6Q w - - 0 1', movelimit: 26,
      technique: '<b class="stepn">1</b> Bring your KING close — the queen only pushes, the king mates. <b class="stepn">2</b> Use the queen a knight-move away from their king to squeeze it to the edge. <b class="stepn">3</b> Stalemate trap: when their king is in the corner, never make a quiet queen move — bring your king or give a check. <b class="stepn">4</b> Mate on the edge with the queen protected by your king.',
      why: 'Half of all winning positions at club level end here. Drill it and it is a guaranteed point.'
    },
    {
      id: 'r-k', name: 'King + Rook vs King — the box method', goal: 'win', fen: '8/8/8/4k3/8/8/8/K6R w - - 0 1', movelimit: 36,
      technique: '<b class="stepn">1</b> Cut the enemy king off with a rook wall (a "box"). <b class="stepn">2</b> Shrink the box one line at a time. <b class="stepn">3</b> When the kings face each other (opposition), check with the rook — the king must step back and you repeat. <b class="stepn">4</b> Bring your king up, then mate on the edge.',
      why: 'The most common "I was winning but could not finish" ending in club chess.'
    },
    {
      id: 'rr-k', name: 'Two Rooks — the ladder mate', goal: 'win', fen: '8/8/8/4k3/8/8/8/K1R4R w - - 0 1', movelimit: 24,
      technique: '<b class="stepn">1</b> One rook cuts the rank, the other checks — the king is driven up the board like a ladder. <b class="stepn">2</b> Never let the rooks be capturable: keep them far from the king. <b class="stepn">3</b> Check, cut, check, cut — mate in the middle of the edge.',
      why: 'The simplest forced mate in chess and the fastest way to finish when you are up material.'
    },
    {
      id: 'kp-win', name: 'King + Pawn vs King — convert the won pawn', goal: 'win', fen: '8/8/4k3/4P3/4K3/8/8/8 w - - 0 1', movelimit: 40,
      technique: '<b class="stepn">1</b> Your king goes IN FRONT of the pawn — always. <b class="stepn">2</b> Key squares: for a pawn on the 5th rank they are the three squares two ranks ahead (d7/e7/f7 style). Reach one and the pawn promotes by force. <b class="stepn">3</b> Opposition: when the kings face off, whoever is NOT to move wins the fight — use your pawn as a waiting move to hand the move to your opponent. <b class="stepn">4</b> Never push the pawn past the support of your own king.',
      why: 'A pawn up should mean a win. This single drill converts those games instead of drawing them.'
    },
    {
      id: 'q-vs-p', name: 'Queen vs Pawn on the 7th — win it', goal: 'win', fen: '7Q/8/8/8/8/1K6/2p5/2k5 w - - 0 1', movelimit: 30,
      technique: '<b class="stepn">1</b> Never let the pawn promote — checking the king forces it to block its own pawn. <b class="stepn">2</b> Walk your king closer while the queen gives checks / controls the queening square. <b class="stepn">3</b> When your king arrives, the pawn falls and you mate. <b class="stepn">4</b> Beware stalemate: always leave the enemy king a square until your king is close.',
      why: 'You will reach this ending — and half the club throws it away with a stalemate or a promotion.'
    },
    {
      id: 'rp-k', name: 'Rook + Pawn vs King — escort the pawn', goal: 'win', fen: '1R6/8/8/8/K7/8/1P3k2/8 w - - 0 1', movelimit: 34,
      technique: '<b class="stepn">1</b> Push the pawn, use the rook as a shield and a wall. <b class="stepn">2</b> Cut the enemy king off with the rook from the side — then the pawn walks. <b class="stepn">3</b> When the king attacks your rook, slide it to the far side and start again. <b class="stepn">4</b> Simple rule: rook BEHIND the pawn (Tarrasch) when you are the one pushing.',
      why: 'Rook + pawn endings are everywhere; the technique is one drill away.'
    },
    {
      id: 'kp-draw', name: 'Defend King + Pawn vs King — hold the draw', goal: 'draw', fen: '8/8/4k3/8/4P3/4K3/8/8 w - - 0 1', humanColor: 'b', movelimit: 60,
      technique: '<b class="stepn">1</b> Get IN FRONT of the pawn — never chase it from behind. <b class="stepn">2</b> When the attacker advances his king, take the opposition: mirror his moves so he must move away. <b class="stepn">3</b> If the pawn reaches the 5th rank without your king in front, it is usually lost — so get in front NOW. <b class="stepn">4</b> Rook pawns are the easiest draw: head for the corner (a/h-pawns cannot be won if you reach the queening corner).',
      why: 'Holding a pawn-down ending is worth half a point in every tournament — and it is mostly technique, not talent.'
    }
  ];
  function vEndgame(view, params) {
    view.innerHTML = headerBar('Endgame Lab', 'Drill the endings that convert wins into points. The engine defends perfectly — no mercy.') +
      '<div class="grid g-2">' + DRILLS.map(function (d) {
        var passed = S.stats.drills[d.id];
        return '<div class="card drill' + (passed ? ' passed' : '') + '"><div class="row between"><h3>' + esc(d.name) + '</h3>' +
          (passed ? '<span class="badge good">PASSED <i class="i i-check"></i></span>' : '<span class="badge">' + (d.goal === 'win' ? '<i class="i i-flag"></i> WIN IT' : '<i class="i i-hand"></i> DRAW IT') + '</span>') + '</div>' +
          '<p class="muted small">' + esc(d.why) + '</p>' +
          '<div class="drill-board" data-drill="' + d.id + '"></div>' +
          '<details><summary>Technique (read this first)</summary><p>' + esc(d.technique) + '</p></details>' +
          '<button class="btn primary block" data-start="' + d.id + '">Start drill <i class="i i-chevR"></i></button></div>';
      }).join('') + '</div>';
    $$('[data-drill]', view).forEach(function (host) {
      var d = DRILLS.filter(function (x) { return x.id === host.getAttribute('data-drill'); })[0];
      var mini = BD.create(host, { orientation: 'w', showCoords: false, interactive: false, onSquare: function () { } });
      mini.set({ state: B.parseFEN(d.fen) });
      mini.flipped = (B.parseFEN(d.fen).turn === 'b');
    });
    $$('[data-start]', view).forEach(function (b) {
      b.addEventListener('click', function () { startDrill(b.getAttribute('data-start')); });
    });
  }
  function startDrill(id) {
    var d = DRILLS.filter(function (x) { return x.id === id; })[0];
    nav('play');
    setTimeout(function () {
      var host = $('#boardHost');
      if (!host) return;
      board = BD.create(host, { orientation: 'w', onSquare: onSquare, showCoords: S.settings.showCoords });
      newGame({ fen: d.fen, humanColor: d.humanColor || B.parseFEN(d.fen).turn, level: 5, coach: false, hint: false });
      game.drill = d; game.drillMoves = 0;
      board.flipped = game.humanColor === 'b';
      $('#gameStatus').innerHTML = '<i class="i i-target"></i> <b>' + esc(d.name) + '</b> — goal: <b>' + (d.goal === 'win' ? 'WIN' : 'DRAW') + '</b> in under ' + d.movelimit + ' moves. Perfect defense.';
      $('.clock-row').style.display = 'none';
      $('#selLevel').value = '5';
      paintPlay();
      if (game.st.turn !== game.humanColor) engineMove();
      toast('Drill: ' + d.name + ' — ' + (d.goal === 'win' ? 'convert the win' : 'hold the draw'), 'good', 4000);
    }, 120);
  }
  function drillAfterHuman() {
    pushCount();
    if (checkDrillEnd()) return;
    engineMove();
  }
  function pushCount() { if (game && game.drill) game.drillMoves = (game.drillMoves || 0) + 1; }
  function checkDrillEnd() {
    var stt = B.status(game.st);
    var d = game.drill;
    if (!stt.over) {
      if ((game.drillMoves || 0) >= d.movelimit) {
        game.over = true; game.result = { over: true, result: 'draw', reason: 'move limit reached' };
        finishDrill(); return true;
      }
      return false;
    }
    game.over = true; game.result = stt;
    finishDrill();
    return true;
  }
  function finishDrill() {
    var d = game.drill, r = game.result;
    var success = (d.goal === 'win' && r.reason === 'checkmate' && r.result === game.humanColor) ||
      (d.goal === 'draw' && r.result === 'draw');
    /* for 'defense' drills the human is the one who must survive */
    var passed = success;
    if (passed) {
      S.stats.drills[d.id] = true;
      addXp(90, 'drill passed: ' + d.name);
    } else {
      addXp(20, 'drill attempted');
    }
    save();
    modal({
      title: passed ? '<i class="i i-checkc"></i> Drill passed!' : '<i class="i i-xc"></i> Not yet',
      body: '<p class="big">' + esc(d.name) + '</p>' +
        '<p>' + (passed ? 'You converted it against perfect defense. That is a tournament point banked.' :
          'Result: ' + esc(r.reason + (r.result === 'draw' ? ' (draw)' : '')) + '. Read the technique again, then repeat — the second attempt is usually the one that sticks.') + '</p>' +
        '<details open><summary>Technique recap</summary><p>' + esc(d.technique) + '</p></details>',
      buttons: [{ label: 'Retry drill', cls: 'primary', onClick: function () { startDrill(d.id); } }, { label: 'Back to lab', onClick: function () { nav('endgame'); } }]
    });
    var host = $('#gameStatus'); if (host) host.innerHTML = passed ? '<i class="i i-checkc"></i> Drill passed' : '<i class="i i-xc"></i> Drill failed — retry';
  }

  /* ============================ OPENINGS ============================ */
  var op = null;
  function vOpenings(view, params) {
    var side = params.side || 'white';
    if (!op) op = { side: side, gi: 0, li: 0, idx: -1, quiz: false, quizSide: 'white', score: 0, total: 0, quizLine: null };
    op.side = side;
    view.innerHTML = headerBar('Opening Repertoire', 'Machine-verified lines. Learn them cold — then you never lose in the first 10 moves again.',
      '<button class="btn sm" id="btnQuiz"><i class="i i-cap"></i> Quiz mode</button>') +
      '<div class="puzzle-modes">' + ['white', 'black'].map(function (s) {
        return '<button class="chip' + (s === side ? ' on' : '') + '" data-side="' + s + '">' + (s === 'white' ? 'As White' : 'As Black') + '</button>';
      }).join('') + '</div>' +
      '<div class="play-wrap"><div class="board-col"><div class="card board-card"><div id="opHost"></div>' +
      '<div class="board-foot"><div id="opStatus" class="status"></div><div class="row gap">' +
      '<button class="btn sm" id="opPrev"><i class="i i-chevL"></i> Back</button><button class="btn sm primary" id="opNext">Next <i class="i i-chevR"></i></button>' +
      '<button class="btn sm" id="opReplay"><i class="i i-rccw"></i> Replay</button></div></div></div>' +
      '<div class="card"><h3>Line notes</h3><div id="opNotes" class="notes"></div></div></div>' +
      '<div class="side-col"><div class="card"><h3>Your lines</h3><div id="opList" class="line-list"></div></div>' +
      '<div class="card" id="opPlans"></div></div>' +
      '</div>';
    $$('[data-side]', view).forEach(function (c) { c.addEventListener('click', function () { op.side = c.getAttribute('data-side'); op.gi = 0; op.li = 0; nav('openings', 'side=' + op.side); }); });
    $('#btnQuiz').addEventListener('click', function () { startOpeningQuiz(); });
    $('#opNext').addEventListener('click', function () { opStep(1); });
    $('#opPrev').addEventListener('click', function () { opStep(-1); });
    $('#opReplay').addEventListener('click', function () { opLoad(op.gi, op.li); });
    renderOpList();
    opLoad(op.gi, op.li);
  }
  function renderOpList() {
    var groups = OPENINGS[op.side];
    $('#opList').innerHTML = groups.map(function (g, gi) {
      return '<div class="line-group"><div class="lg-title">' + esc(g.name) + '</div><p class="muted small">' + esc(g.why) + '</p>' +
        g.lines.map(function (l, li) { return '<button class="line-btn' + (gi === op.gi && li === op.li ? ' on' : '') + '" data-g="' + gi + '" data-l="' + li + '">' + esc(l.name) + '</button>'; }).join('') + '</div>';
    }).join('');
    $$('#opList .line-btn').forEach(function (b) {
      b.addEventListener('click', function () { opLoad(parseInt(b.getAttribute('data-g'), 10), parseInt(b.getAttribute('data-l'), 10)); });
    });
  }
  function opLoad(gi, li) {
    op.gi = gi; op.li = li; op.idx = 0;
    var g = OPENINGS[op.side][gi], l = g.lines[li];
    op.line = l;
    var rp = replayLine(l.moves);
    op.sans = rp.sans; op.fens = rp.fens;
    op.notesArr = l.notes || [];
    if (!op.board) op.board = BD.create($('#opHost'), { orientation: op.side === 'white' ? 'w' : 'b', showCoords: true, onSquare: function () { } });
    op.board.flipped = op.side === 'black';
    opPaint();
    $('#opPlans').innerHTML = '<h3>Plans & ideas</h3>' + (g.plans || l.plans || []).map(function (p) { return '<p class="small">• ' + esc(p) + '</p>'; }).join('') +
      (l.plans ? '<h4>For this line</h4>' + l.plans.map(function (p) { return '<p class="small">• ' + esc(p) + '</p>'; }).join('') : '');
    renderOpList();
  }
  function opPaint() {
    var st = B.parseFEN(op.fens[op.idx]);
    var last = null;
    if (op.idx > 0) {
      var prev = B.parseFEN(op.fens[op.idx - 1]), mv = B.uciToMove(prev, op.lastUci || '');
      if (mv) last = { from: mv.from, to: mv.to };
    }
    op.board.set({ state: st, lastMove: last, selected: null, targets: [], arrows: [] });
    var note = op.notesArr[op.idx - 1] || (op.idx === 0 ? 'Starting position — ' + esc(op.line.name) : '');
    $('#opStatus').innerHTML = 'Move <b>' + op.idx + '/' + op.sans.length + '</b>' + (op.idx ? ' — ' + esc(op.sans[op.idx - 1]) + (op.side === 'white' ? (op.idx % 2 === 1 ? ' (you)' : ' (them)') : (op.idx % 2 === 0 ? ' (you)' : ' (them)')) : '');
    $('#opNotes').innerHTML = '<p class="note-line">' + esc(note) + '</p>' +
      '<div class="move-strip">' + op.sans.map(function (s, i) { return '<button class="ms' + (i + 1 === op.idx ? ' on' : '') + '" data-i="' + (i + 1) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
    $$('#opNotes .ms').forEach(function (b) { b.addEventListener('click', function () { op.idx = parseInt(b.getAttribute('data-i'), 10); op.lastUci = null; opPaint(); }); });
  }
  function opStep(d) {
    if (op.idx + d < 0 || op.idx + d > op.sans.length) return;
    if (d > 0) { var prev = B.parseFEN(op.fens[op.idx]); var mv = B.fromSAN(prev, op.sans[op.idx]); if (mv) op.lastUci = B.moveToUci(mv); }
    op.idx += d;
    opPaint();
  }
  function startOpeningQuiz() {
    var groups = OPENINGS[op.side];
    var pool = [];
    groups.forEach(function (g) { g.lines.forEach(function (l) { pool.push(l); }); });
    var l = pool[Math.floor(Math.random() * pool.length)];
    var sans = replayLine(l.moves).sans;
    var userColor = op.side === 'white' ? 'w' : 'b';
    op.quiz = { line: l, sans: sans, state: B.parseFEN(B.START_FEN), i: 0, userColor: userColor, score: 0, mistakes: 0, done: false };
    nav('play');
    setTimeout(function () {
      board = BD.create($('#boardHost'), { orientation: op.side === 'white' ? 'w' : 'b', onSquare: opQuizSquare, showCoords: true });
      board.dragColor = userColor;
      board.flipped = op.side === 'black';
      $('.clock-row').style.display = 'none';
      $('#moveList').innerHTML = '';
      $('#gameStatus').innerHTML = '<i class="i i-cap"></i> <b>Opening quiz</b> — replay <b>' + esc(l.name) + '</b> from memory as ' + (op.side === 'white' ? 'White' : 'Black') + '.';
      game = { over: true, st: op.quiz.state, humanColor: userColor, sans: [], fens: [], ucis: [], drill: null, coach: false, hintArrow: [] };
      opQuizPaint();
      if (op.quiz.state.turn !== userColor) opQuizReply();
      toast('Quiz: play the line from memory. Wrong move = the app shows the book move.', 'xp', 4000);
    }, 120);
  }
  function opQuizPaint(extra) {
    var st = op.quiz.state;
    board.set({ state: st, selected: null, targets: [], lastMove: op.quiz.lastMove || null, arrows: op.quiz.arrow || [] });
    if (extra) $('#gameStatus').innerHTML = extra;
  }
  function opQuizSquare(sq) {
    var q = op.quiz; if (!q || q.done) return;
    if (q.state.turn !== q.userColor) return;
    var st = q.state;
    if (op.selected != null) {
      if (op.targets.indexOf(sq) >= 0) { opQuizTry(op.selected, sq); return; }
    }
    var pc = st.board[sq];
    if (pc && pc[0] === st.turn) {
      op.selected = sq; op.targets = B.legalMoves(st).filter(function (m) { return m.from === sq; }).map(function (m) { return m.to; });
      board.set({ selected: sq, targets: op.targets });
    } else { op.selected = null; op.targets = []; board.set({ selected: null, targets: [] }); }
  }
  function opQuizTry(from, to) {
    var q = op.quiz;
    var wantSan = q.sans[q.i];
    var want = B.fromSAN(q.state, wantSan);
    if (!want) { opQuizDone(); return; }
    if (want.from === from && want.to === to) {
      q.state = B.makeMove(q.state, want); q.lastMove = { from: from, to: to }; q.i++; q.arrow = [];
      q.score++;
      board.set({ state: q.state, lastMove: q.lastMove, arrows: [], selected: null, targets: [] });
      op.selected = null; op.targets = [];
      if (q.i >= q.sans.length) { opQuizDone(true); return; }
      $('#gameStatus').innerHTML = '<i class="i i-checkc"></i> <b>' + esc(wantSan) + '</b> — correct.';
      opQuizReply();
    } else {
      q.mistakes++;
      var mv = B.uciToMove(q.state, B.moveToUci(want));
      board.set({ arrows: [{ from: want.from, to: want.to, color: 'rgba(255,120,120,.95)' }], selected: null, targets: [] });
      op.selected = null; op.targets = [];
      $('#gameStatus').innerHTML = '<i class="i i-xc"></i> Book move is <b>' + esc(wantSan) + '</b> (red arrow). Play it to continue. Mistakes: ' + q.mistakes;
    }
  }
  function opQuizReply() {
    var q = op.quiz;
    setTimeout(function () {
      if (q.i >= q.sans.length) { opQuizDone(true); return; }
      var m = B.fromSAN(q.state, q.sans[q.i]);
      if (!m) { opQuizDone(); return; }
      q.state = B.makeMove(q.state, m); q.lastMove = { from: m.from, to: m.to }; q.i++;
      board.set({ state: q.state, lastMove: q.lastMove, arrows: [], selected: null, targets: [] });
      if (q.i >= q.sans.length) { opQuizDone(true); return; }
      $('#gameStatus').innerHTML = 'They played <b>' + esc(q.sans[q.i - 1]) + '</b>. Your move.';
    }, 420);
  }
  function opQuizDone(finished) {
    var q = op.quiz; if (!q) return;
    q.done = true;
    var perfect = finished && q.mistakes === 0;
    if (perfect) addXp(60, 'opening line recalled perfectly');
    else addXp(20, 'opening quiz done');
    var stats = S.stats;
    modal({
      title: perfect ? '<i class="i i-cap"></i> Perfect recall!' : '<i class="i i-cap"></i> Quiz finished',
      body: '<p class="big">' + esc(q.line.name) + '</p><p>Moves played: ' + q.i + '/' + q.sans.length + ' · mistakes: <b>' + q.mistakes + '</b></p>' +
        '<p>' + (perfect ? 'That is match-ready. Do the same for every line in your repertoire — then your first 10 moves cost you zero thinking time.' :
          'Repeat the line twice more in Learn mode, then quiz again until it is 0 mistakes.') + '</p>',
      buttons: [{ label: 'Another line', cls: 'primary', onClick: function () { startOpeningQuiz(); } }, { label: 'Back to repertoire', onClick: function () { nav('openings', 'side=' + op.side); } }]
    });
  }

  /* ============================ TRAPS ============================ */
  function vTraps(view, params) {
    var vf = {}; (CONTENT.traps || []).forEach(function (t) { vf[t.id] = t; });
    view.innerHTML = headerBar('Trap Library', '10 traps that decide district games — learn them from BOTH sides, then punish anyone who falls in.',
      '<button class="btn sm" id="btnTrapQuiz"><i class="i i-grid"></i> Quick quiz</button>') +
      '<div class="grid g-2">' + TRAPS.map(function (t) {
        var isMate = (vf[t.id] && vf[t.id].trapFinalMate) || /#$/.test(t.trapLine[t.trapLine.length - 1]);
        var lastSan = t.trapLine[t.trapLine.length - 1];
        return '<div class="card trap"><div class="row between"><h3>' + esc(t.name) + '</h3><span class="badge ' + (isMate ? 'good' : '') + '">' + (isMate ? 'MATE <i class="i i-check"></i>' : 'WINS MATERIAL') + '</span></div>' +
          '<p class="muted small">' + esc(t.who) + ' · danger <b style="color:var(--gold)">' + t.danger + '/5</b></p>' +
          '<div class="trap-board" data-trap="' + t.id + '"></div>' +
          '<p class="small">' + esc(t.explanation) + '</p>' +
          '<div class="trap-line">' + t.trapLine.map(function (s, i) { return '<span class="' + (i + 1 === t.blunderAtPly ? 'blunder' : (i === t.trapLine.length - 1 ? 'mate' : '')) + '">' + esc(s) + '</span>'; }).join(' ') + '</div>' +
          (isMate ? '<p class="small"><b>Line verified by engine:</b> ends in ' + esc(lastSan) + ' — checkmate.</p>' : '') +
          '<details><summary>The antidote (what to do instead)</summary><p>' + esc(t.antidote) + '</p>' +
          '<div class="trap-line antidote">' + t.antidoteLine.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join(' ') + '</div></details>' +
          '<p class="small lesson"><i class="i i-cap"></i> ' + esc(t.lesson) + '</p>' +
          '<div class="row gap"><button class="btn sm primary" data-play-trap="' + t.id + '">Practice (play the winning side)</button>' +
          '<button class="btn sm" data-antidote="' + t.id + '">Practice the antidote</button></div>' +
          '</div>';
      }).join('') + '</div>';

    $$('.trap-board', view).forEach(function (host) {
      var t = TRAPS.filter(function (x) { return x.id === host.getAttribute('data-trap'); })[0];
      var rp = replayLine(t.trapLine);
      var at = Math.max(0, Math.min((t.blunderAtPly || 1) - 1, rp.fens.length - 1));
      var state = B.parseFEN(rp.fens[at]);
      var mini = BD.create(host, { orientation: 'w', showCoords: false, interactive: false, onSquare: function () { } });
      mini.set({ state: state });
      mini.flipped = state.turn === 'b';
    });
    $('#btnTrapQuiz').addEventListener('click', function () { trapQuiz(); });
    $$('[data-play-trap]', view).forEach(function (b) { b.addEventListener('click', function () { playTrapSequence(b.getAttribute('data-play-trap'), 'trap'); }); });
    $$('[data-antidote]', view).forEach(function (b) { b.addEventListener('click', function () { playTrapSequence(b.getAttribute('data-antidote'), 'antidote'); }); });
  }
  function easySelect(list, want, from, to) {
    var exact = list.filter(function (m) { return m.from === from && m.to === to; });
    if (!exact.length) return null;
    if (exact.length === 1) return exact[0];
    return exact.filter(function (m) { return B.moveToUci(m) === want; })[0] || exact[0];
  }
  function playTrapSequence(id, kind) {
    var t = TRAPS.filter(function (x) { return x.id === id; })[0];
    var vf = {}; (CONTENT.traps || []).forEach(function (x) { vf[x.id] = x; });
    var v = vf[id];
    var sans = kind === 'trap' ? t.trapLine : t.antidoteLine;
    if (!sans) return;
    /* trap mode  -> you play the side that DELIVERS the trap (the side making the last move of the line)
       antidote   -> you play the VICTIM's side, but with the correct defence */
    var ply = kind === 'trap' ? sans.length : (t.blunderAtPly || sans.length);
    var userColor = (ply % 2 === 1) ? 'w' : 'b';
    nav('play');
    setTimeout(function () {
      board = BD.create($('#boardHost'), { orientation: userColor === 'w' ? 'w' : 'b', onSquare: trapSquare, showCoords: true });
      board.dragColor = userColor;
      board.flipped = userColor === 'b';
      $('.clock-row').style.display = 'none';
      $('#selLevel').value = '5';
      game = { over: false, st: B.parseFEN(B.START_FEN), humanColor: userColor, sans: [], fens: [B.toFEN(B.parseFEN(B.START_FEN))], ucis: [], drill: { id: 'trap-', name: 'Trap drill', goal: 'win', movelimit: 40 }, coach: false, hintArrow: [], trap: { sans: sans, i: 0, kind: kind, name: t.name } };
      game.trap.userColor = userColor;
      paintPlay();
      $('#gameStatus').innerHTML = '<i class="i i-grid"></i> <b>' + esc(t.name) + '</b> — ' + (kind === 'trap' ? 'play the winning side and deliver the blow.' : 'play the correct defence and stay safe.');
      if (game.st.turn !== userColor) trapReply();
    }, 120);
  }
  function trapSquare(sq) {
    var tr = game.trap; if (!tr) return;
    if (game.st.turn !== game.humanColor) return;
    var st = game.st;
    if (game.selected != null && game.targets.indexOf(sq) >= 0) {
      var want = B.fromSAN(st, tr.sans[tr.i]);
      var cands = B.legalMoves(st).filter(function (m) { return m.from === game.selected && m.to === sq; });
      if (!cands.length) return;
      var mv = cands.length > 1 ? (cands.filter(function (m) { return B.moveToUci(m) === B.moveToUci(want); })[0] || cands[0]) : cands[0];
      var san = B.toSAN(st, mv);
      pushMove(mv, true);
      game.selected = null; game.targets = [];
      if (want && B.moveToUci(mv) === B.moveToUci(want)) {
        tr.i++;
        sound('good');
        $('#gameStatus').innerHTML = '<i class="i i-checkc"></i> <b>' + esc(san) + '</b> — exactly right.';
      } else {
        sound('bad');
        $('#gameStatus').innerHTML = '<i class="i i-alert"></i> You played <b>' + esc(san) + '</b>. Book move is <b>' + esc(tr.sans[tr.i]) + '</b> — follow the red arrow.';
        game.hintArrow = [{ from: want.from, to: want.to, color: 'rgba(255,120,120,.95)' }];
        paintPlay();
        return;
      }
      if (tr.i >= tr.sans.length) { trapDone(); return; }
      paintPlay();
      trapReply();
      return;
    }
    var pc = st.board[sq];
    if (pc && pc[0] === st.turn) { game.selected = sq; game.targets = B.legalMoves(st).filter(function (m) { return m.from === sq; }).map(function (m) { return m.to; }); }
    else { game.selected = null; game.targets = []; }
    paintPlay();
  }
  function trapReply() {
    var tr = game.trap;
    setTimeout(function () {
      if (tr.i >= tr.sans.length) { trapDone(); return; }
      var st = game.st;
      var m = B.fromSAN(st, tr.sans[tr.i]);
      if (!m) { trapDone(); return; }
      pushMove(m, false);
      tr.i++;
      game.hintArrow = [];
      paintPlay();
      if (tr.i >= tr.sans.length) { trapDone(); return; }
      $('#gameStatus').innerHTML = 'They played <b>' + esc(game.sans[game.sans.length - 1]) + '</b>. Your move — keep the thread!';
    }, 460);
  }
  function trapDone() {
    var tr = game.trap;
    addXp(50, 'trap drilled: ' + tr.name);
    toast('<i class="i i-grid"></i> Trap drilled: ' + tr.name + ' — you have now seen it from the winning side.', 'good', 4200);
    modal({
      title: '<i class="i i-grid"></i> Trap drilled',
      body: '<p class="big">' + esc(tr.name) + '</p><p>You have now played this trap yourself. Next time you see it — or play it — your hands will know what to do before your brain catches up.</p>',
      buttons: [{ label: 'Another trap', onClick: function () { nav('traps'); } }, { label: 'Play a game', cls: 'primary', onClick: function () { nav('play'); } }]
    });
    game.over = true;
  }
  function trapQuiz() {
    var t = TRAPS[Math.floor(Math.random() * TRAPS.length)];
    var isWhiteBlunder = t.blunderAtPly % 2 === 1;
    modal({
      title: '<i class="i i-grid"></i> Trap quiz',
      body: '<p class="big">' + esc(t.name) + '</p>' +
        '<p class="muted">Line (the highlighted move is the blunder):</p>' +
        '<div class="trap-line">' + t.trapLine.map(function (s, i) { return '<span class="' + (i + 1 === t.blunderAtPly ? 'blunder' : '') + '">' + esc(s) + '</span>'; }).join(' ') + '</div>' +
        '<p>' + esc(t.explanation) + '</p>',
      buttons: [
        { label: 'I know the antidote — show it', cls: 'primary', onClick: function () { modal({ title: 'Antidote', body: '<p>' + esc(t.antidote) + '</p><p class="small lesson"><i class="i i-cap"></i> ' + esc(t.lesson) + '</p>', buttons: [{ label: 'Practice it', cls: 'primary', onClick: function () { playTrapSequence(t.id, 'antidote'); } }, { label: 'Close' }] }); } },
        { label: 'Practice the trap', onClick: function () { playTrapSequence(t.id, 'trap'); } },
        { label: 'Close' }
      ]
    });
  }

  /* ============================ CODEX ============================ */
  function vCodex(view, params) {
    var groups = [
      { id: 'fundamentals', label: 'Fundamentals' },
      { id: 'tactics', label: 'Tactics — the money' },
      { id: 'defense', label: 'Defense & traps' },
      { id: 'endgame', label: 'Endgames' },
      { id: 'strategy', label: 'Middlegame strategy' },
      { id: 'psychology', label: 'Mindset & tournament' }
    ];
    if (params.card) {
      var c = CODEX.cards.filter(function (x) { return x.id === params.card; })[0];
      if (c) return codexDetail(view, c);
    }
    view.innerHTML = headerBar('The Beast Playbook', 'Every winning strategy in the course. Read one card per session — then apply it in your next game.') +
      groups.map(function (g) {
        var cards = CODEX.cards.filter(function (c) { return c.group === g.id; });
        return '<h3 class="group-h">' + g.label + '</h3><div class="grid g-3">' + cards.map(function (c) {
          return '<button class="card codex-card' + (c.star ? ' star' : '') + '" data-card="' + c.id + '">' +
            (c.star ? '<span class="badge warn"><i class="i i-star"></i> MOST IMPORTANT</span>' : '') +
            '<h4>' + esc(c.title) + '</h4><p class="muted small">' + esc(c.subtitle) + '</p>' +
            '<span class="meta">' + (c.trains || 0) + ' x trained</span></button>';
        }).join('') + '</div>';
      }).join('');
    $$('[data-card]', view).forEach(function (b) { b.addEventListener('click', function () { nav('codex', 'card=' + b.getAttribute('data-card')); }); });
  }
  function codexDetail(view, c) {
    var cf = (CONTENT.codexFens || {})[c.id];
    view.innerHTML = headerBar(esc(c.title), esc(c.subtitle), '<button class="btn sm" id="btnBack"><i class="i i-chevL"></i> All cards</button>') +
      '<div class="play-wrap"><div class="side-col"><div class="card"><p>' + esc(c.body) + '</p>' +
      (c.questions ? '<ol class="numlist">' + c.questions.map(function (q) { return '<li>' + esc(q) + '</li>'; }).join('') + '</ol>' : '') +
      (c.do ? '<h4>DO</h4><ul class="bullets good">' + c.do.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      (c.dont ? '<h4>DON\'T</h4><ul class="bullets bad">' + c.dont.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '</div><div class="card"><h3>Train this now</h3><div class="row gap wrap">' +
      '<button class="btn sm primary" data-go="puzzles?mode=tactic">Find the tactic</button>' +
      '<button class="btn sm" data-go="puzzles?mode=defense">Defense puzzles</button>' +
      '<button class="btn sm" data-go="play">Play a game</button></div></div></div>' +
      '<div class="board-col">' + (c.fen ? '<div class="card"><h3>Study position</h3><div id="cdxHost"></div>' +
        (cf ? '<p class="muted small">Engine best move in this position: <b>' + esc(cf.bestSan) + '</b></p>' : '') +
        '<p class="small">Look at the position and describe aloud why it demonstrates the idea.</p>' +
        '<button class="btn sm" id="cdxPlay"><i class="i i-chevR"></i> Play it out</button></div>' : '') + '</div></div>';
    if (c.fen) {
      var st = B.parseFEN(c.fen);
      var bd = BD.create($('#cdxHost'), { orientation: st.turn === 'b' ? 'b' : 'w', showCoords: true, interactive: false, onSquare: function () { } });
      bd.set({ state: st });
      $('#cdxPlay').addEventListener('click', function () {
        nav('play');
        setTimeout(function () {
          board = BD.create($('#boardHost'), { orientation: 'w', onSquare: onSquare, showCoords: true });
          newGame({ fen: c.fen, humanColor: st.turn, level: 3, coach: true, hint: true });
          board.flipped = game.humanColor === 'b';
          paintPlay();
        }, 120);
      });
    }
    $('#btnBack').addEventListener('click', function () { nav('codex'); });
    $$('[data-go]', view).forEach(function (b) { b.addEventListener('click', function () { nav(b.getAttribute('data-go').split('?')[0], b.getAttribute('data-go').split('?')[1]); }); });
  }

  /* ============================ 7-DAY PLAN ============================ */
  function vPlan(view, params) {
    var day = params.day ? parseInt(params.day, 10) : currentDayNum();
    view.innerHTML = headerBar('The 7-Day Zero→Hero Syllabus', 'Two hours a day. Each day attacks one weakness. Follow the order — it is deliberately built so each day builds on the last.',
      '<button class="btn sm" id="btnProtocol"><i class="i i-clipboard"></i> Match-day protocol</button>') +
      '<div class="day-tabs">' + DAYS.days.map(function (d) {
        var p = dayProgress(d.day);
        return '<button class="day-tab' + (d.day === day ? ' on' : '') + (p.complete ? ' done' : '') + '" data-day="' + d.day + '">Day ' + d.day + '<small>' + (p.complete ? '<i class="i i-check"></i>' : p.pct + '%') + '</small></button>';
      }).join('') + '</div>' +
      (function () {
        var D = DAYS.days[day - 1], dp = dayProgress(day);
        return '<div class="card day-card"><div class="row between"><div><span class="kicker">' + D.badge + '</span><h3>Day ' + D.day + ' — ' + esc(D.title) + '</h3></div>' +
          '<div class="ring sm" style="--p:' + dp.pct + '"><span>' + dp.pct + '%</span></div></div>' +
          '<p class="goal"><b>Goal:</b> ' + esc(D.goal) + '</p><p class="bigidea">' + esc(D.bigIdea) + '</p>' +
          '<div class="sessions">' + D.sessions.map(function (s, i) {
            var done = (S.days[day] || {})['s' + i];
            return '<div class="session' + (done ? ' done' : '') + '"><button class="tick" data-tick="s' + i + '">' + (done ? '<i class="i i-check"></i>' : '') + '</button>' +
              '<div class="sess-body"><b>' + esc(s.name) + ' <span class="muted">· ' + s.mins + ' min</span></b><span class="muted">' + esc(s.desc) + '</span></div>' +
              '<button class="btn sm primary" data-launch="' + i + '">Open tool <i class="i i-chevR"></i></button></div>';
          }).join('') + '</div>' +
          '<div class="grid g-2"><div class="kpi"><span class="kicker">KPI — do not move on until</span><p>' + esc(D.kpi) + '</p></div>' +
          '<div class="kpi"><span class="kicker">Homework</span><ul>' + D.homework.map(function (h) { return '<li>' + esc(h) + '</li>'; }).join('') + '</ul>' +
          '<p class="muted small">Skills: ' + D.keySkills.map(esc).join(' · ') + '</p></div></div>' +
          '<div class="row gap"><button class="btn" data-tick="kpi">' + ((S.days[day] || {}).kpi ? '<i class="i i-check"></i> KPI done' : 'Mark KPI done') + '</button>' +
          '<button class="btn" data-tick="hw">' + ((S.days[day] || {}).hw ? '<i class="i i-check"></i> Homework done' : 'Mark homework done') + '</button>' +
          (day < 7 ? '<button class="btn primary" data-next="' + (day + 1) + '">Next day <i class="i i-chevR"></i></button>' : '') + '</div></div>';
      })() +
      '<div class="card"><h3>Why this order works</h3><ul class="bullets">' +
      '<li><b>Day 1</b> stops the bleeding (blunders cost you more games than lack of theory).</li>' +
      '<li><b>Day 2</b> gives you a repeatable opening so you are never lost by move 10.</li>' +
      '<li><b>Day 3</b> installs the tactics that win material in every single game.</li>' +
      '<li><b>Day 4</b> makes you hard to beat — the most under-rated tournament skill.</li>' +
      '<li><b>Day 5</b> makes sure the games you win actually end 1-0.</li>' +
      '<li><b>Day 6</b> automates your openings and teaches clock discipline.</li>' +
      '<li><b>Day 7</b> rehearses the real thing so match day feels like a repeat.</li></ul></div>';
    $$('[data-day]', view).forEach(function (b) { b.addEventListener('click', function () { nav('plan', 'day=' + b.getAttribute('data-day')); }); });
    $$('[data-tick]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-tick');
        var d = S.days[day] || (S.days[day] = {});
        d[key] = !d[key];
        if (d[key]) addXp(25, 'day ' + day + ' task ticked');
        if (dayProgress(day).complete) addXp(150, 'DAY ' + day + ' COMPLETE!');
        save(); render();
      });
    });
    $$('[data-launch]', view).forEach(function (b) { b.addEventListener('click', function () { launchSession(DAYS.days[day - 1].sessions[parseInt(b.getAttribute('data-launch'), 10)]); }); });
    $$('[data-next]', view).forEach(function (b) { b.addEventListener('click', function () { nav('plan', 'day=' + b.getAttribute('data-next')); }); });
    $('#btnProtocol').addEventListener('click', showProtocol);
  }
  function showProtocol() {
    modal({
      title: '<i class="i i-clipboard"></i> ' + DAYS.protocol.title, wide: true,
      body: DAYS.protocol.sections.map(function (s) {
        return '<h4>' + esc(s.h) + '</h4><ul class="bullets">' + s.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
      }).join('') + '<p class="mantra-line">' + esc(DAYS.mantra) + '</p>',
      buttons: [{ label: 'Got it — let\'s go', cls: 'primary' }]
    });
  }

  /* ============================ PROGRESS ============================ */
  function vProgress(view) {
    var st = S.stats, pz = st.puzzles;
    var acc = pz.attempted ? Math.round(pz.solved / pz.attempted * 100) : 0;
    var ft = pz.attempted ? Math.round(pz.firstTry / pz.attempted * 100) : 0;
    var daysDone = 0; for (var d = 1; d <= 7; d++) if (dayProgress(d).complete) daysDone++;
    view.innerHTML = headerBar('Progress & History', 'Your training log. The Blunder Report on each game is where the real improvement hides.') +
      '<div class="stats-grid big">' + stat('XP', S.xp) + stat('Rank', '<span class="rank">' + rankOf(S.xp) + '</span>') + stat('Streak', S.streak + ' days') +
      stat('Days completed', daysDone + '/7') + stat('Games', st.games) + stat('Record', st.wins + 'W ' + st.draws + 'D ' + st.losses + 'L') +
      stat('Puzzle accuracy', acc + '%') + stat('First-try accuracy', ft + '%') + stat('Best win streak', st.bestWinStreak) + '</div>' +
      '<div class="card"><div class="row between"><h3>Recent games</h3><button class="btn sm danger" id="btnReset">Reset all progress</button></div>' +
      (S.games.length ? '<div class="games">' + S.games.map(function (g, i) {
        var res = g.result === g.color ? 'win' : (g.result === 'draw' ? 'draw' : 'loss');
        return '<div class="game-row"><span class="res ' + res + '">' + (res === 'win' ? 'W' : res === 'draw' ? 'D' : 'L') + '</span>' +
          '<span class="muted small">' + new Date(g.date).toLocaleString() + '</span>' +
          '<span class="muted small">vs ' + esc(levelName(g.level)) + ' as ' + (g.color === 'w' ? 'White' : 'Black') + ' · ' + g.plies + ' moves · ' + esc(g.reason || '') + '</span>' +
          '<button class="btn sm" data-replay="' + i + '">Replay + report</button>' +
          '<button class="btn sm" data-pgn="' + i + '"><i class="i i-clipboard"></i> Copy PGN</button></div>';
      }).join('') + '</div>' : '<p class="muted">No games yet. Play your first game in the Play & Train tab.</p>') + '</div>' +
      '<div class="card"><h3>Puzzle breakdown</h3><div class="stats-grid">' +
      ['mate1', 'mate2', 'tactic', 'defense'].map(function (t) {
        var b = pz.byType[t] || { a: 0, s: 0 };
        return stat(modeTitle(t), b.a ? Math.round(b.s / b.a * 100) + '% of ' + b.a : '—');
      }).join('') + '</div><p class="muted small">First-try accuracy above 80% means you are reading tactics, not guessing.</p></div>' +
      (LS_OK ? '<div class="card"><h3><i class="i i-save"></i> Your progress is saved automatically</h3><p class="muted small">Everything (XP, plan ticks, game history, puzzle accuracy) is stored in this browser. Copy <b>beast-chess.html</b> to your phone or laptop and keep using the same file to keep your streak.</p></div>'
        : '<div class="card"><h3><i class="i i-alert"></i> Storage is blocked in this preview window</h3><p class="muted small">You are viewing this inside a sandbox, so progress is kept in memory only and will reset on reload. <b>Download beast-chess.html and open it directly</b> (double-click) — then all progress, XP, game history and reports save permanently, and the app works fully offline.</p></div>') +
      '<div class="card"><h3>Rank ladder</h3><ul class="bullets">' +
      ['Rookie (0 XP)', 'Club Player (300)', 'Tactician (800)', 'Tournament Ready (1800)', 'District Killer (3500)', 'CHESS BEAST (6000)'].map(function (r) { return '<li>' + r + '</li>'; }).join('') +
      '</ul><p class="muted small">Each puzzle ≈ 12 XP · each game ≈ 40–120 XP · each day completed = 150 XP.</p></div>';

    $$('[data-pgn]', view).forEach(function (b) {
      b.addEventListener('click', function () { copyText(pgnOf(S.games[parseInt(b.getAttribute('data-pgn'), 10)]), 'PGN copied'); });
    });
    $$('[data-replay]', view).forEach(function (b) {
      b.addEventListener('click', function () {
        var g = S.games[parseInt(b.getAttribute('data-replay'), 10)];
        var step = { i: 0 };
        var m = modal({
          title: '<i class="i i-refresh"></i> Replay game', wide: true,
          body: '<div class="replay-wrap"><div id="repHost"></div><div class="replay-side"><div id="repInfo"></div><div class="row gap"><button class="btn sm" id="repPrev"><i class="i i-chevL"></i></button><button class="btn sm" id="repNext"><i class="i i-chevR"></i></button>' +
            '<button class="btn sm primary" id="repReport"><i class="i i-search"></i> Blunder report</button></div></div></div>'
        });
        var rb = BD.create($('#repHost'), { orientation: g.color === 'b' ? 'b' : 'w', showCoords: true, interactive: false, onSquare: function () { } });
        function paint() {
          var stt = B.parseFEN(g.fens[step.i]);
          rb.set({ state: stt, lastMove: step.i > 0 ? (function () { var mv = B.uciToMove(B.parseFEN(g.fens[step.i - 1]), g.ucis[step.i - 1]); return mv ? { from: mv.from, to: mv.to } : null; })() : null });
          $('#repInfo').innerHTML = '<p><b>Move ' + Math.ceil(step.i / 2) + '</b> — ' + (step.i ? esc(g.sans[step.i - 1]) : 'start') + '</p><p class="muted small">' + (g.result === g.color ? 'Win' : g.result === 'draw' ? 'Draw' : 'Loss') + ' · ' + esc(g.reason || '') + '</p>' +
            '<div class="move-strip">' + g.sans.map(function (s, i) { return '<button class="ms' + (i + 1 === step.i ? ' on' : '') + '" data-i="' + (i + 1) + '">' + esc(s) + '</button>'; }).join('') + '</div>';
          $$('#repInfo .ms').forEach(function (x) { x.addEventListener('click', function () { step.i = parseInt(x.getAttribute('data-i'), 10); paint(); }); });
        }
        paint();
        $('#repPrev').addEventListener('click', function () { step.i = Math.max(0, step.i - 1); paint(); });
        $('#repNext').addEventListener('click', function () { step.i = Math.min(g.sans.length, step.i + 1); paint(); });
        $('#repReport').addEventListener('click', function () {
          m.close();
          analyzeGame(g, function (steps) {
            var mine = steps.filter(function (s) { return s.byHuman; });
            var worst = mine.slice().sort(function (a, b) { return b.drop - a.drop; }).slice(0, 6);
            modal({
              title: '<i class="i i-search"></i> Blunder report', wide: true,
              body: '<p class="muted">Your worst moves in this game (click one to study the position with the engine move shown):</p>' +
                '<div class="row wrap">' + worst.map(function (s) {
                  return '<button class="mini-btn" data-fen="' + esc(s.fenBefore) + '">Move ' + (Math.floor(s.ply / 2) + 1) + ': <b>' + esc(s.san) + '</b> → best <b>' + esc(s.best) + '</b> (−' + (s.drop / 100).toFixed(1) + ')</button>';
                }).join('') + '</div>' +
                '<p class="muted small">Anything ≥ 5.0 is a blunder: that is a piece. ≥ 2.5 is a mistake. Under 1.0 is fine.</p>',
              buttons: [{ label: 'Close' }]
            });
            $$('.mini-btn').forEach(function (bb) {
              bb.addEventListener('click', function () {
                nav('play');
                setTimeout(function () {
                  board = BD.create($('#boardHost'), { orientation: 'w', onSquare: function () { }, showCoords: true, interactive: false });
                  board.set({ state: B.parseFEN(bb.getAttribute('data-fen')) });
                  $('#gameStatus').innerHTML = 'Study the position — find the move you missed, then check the playbook card for that motif.';
                  $('.clock-row').style.display = 'none';
                }, 120);
              });
            });
          });
        });
      });
    });
    $('#btnReset').addEventListener('click', function () {
      modal({
        title: 'Reset everything?', body: '<p>This deletes your XP, plan progress and game history.</p>',
        buttons: [{ label: 'Keep my data' }, { label: 'Yes, reset', cls: 'danger', onClick: function () { S = JSON.parse(JSON.stringify(DEFAULT)); save(); nav('home'); toast('Progress reset.', 'bad'); } }]
      });
    });
  }



  /* ============================ LEARN CHESS ============================ */
  var lp = { i: 0, state: null, selected: null, targets: [], board: null, moved: false };

  function vLearn(view, params) {
    var idx = Math.max(0, Math.min(LESSONS.length - 1, parseInt(params.lesson || '0', 10) || 0));
    if (params.lesson == null) idx = firstUnfinishedLesson();
    lp.i = idx;
    view.innerHTML = headerBar('Learn Chess', 'Never played before? Start at lesson 1, go in order, and drag the pieces around — you cannot break anything here.',
      '<button class="btn sm" id="btnGloss"><i class="i i-book"></i> Chess words</button>') +
      '<div class="puzzle-modes" id="lessonNav">' + LESSONS.map(function (l, i) {
        return '<button class="lchip' + (i === idx ? ' on' : '') + '" data-lesson="' + i + '">' + esc(l.title) + ((S.lessons || {})[l.id] ? ' <i class="i i-check"></i>' : '') + '</button>';
      }).join('') + '</div>' +
      '<div class="card"><div class="lesson">' +
      '<div class="ltxt"><span class="kicker">Lesson ' + (idx + 1) + ' of ' + LESSONS.length + '</span>' +
      '<h3>' + esc(LESSONS[idx].title) + '</h3><p>' + esc(LESSONS[idx].text) + '</p>' +
      '<div class="kpi"><span class="kicker">TRY IT</span><p>' + esc(LESSONS[idx].tryThis) + '</p></div>' +
      '<div class="row gap wrap" style="margin-top:12px">' +
      (idx > 0 ? '<button class="btn sm" id="lPrev"><i class="i i-chevL"></i> Previous</button>' : '') +
      (idx < LESSONS.length - 1 ? '<button class="btn sm primary" id="lNext">Next lesson <i class="i i-chevR"></i></button>' : '') +
      '<button class="btn sm" id="lGuided"><i class="i i-gamepad"></i> Start guided first game</button>' +
      '<button class="btn sm" id="lPractice"><i class="i i-puzzle"></i> 3 easy mate-in-1 puzzles</button>' +
      '</div>' +
      '<p class="muted small" style="margin-top:10px">Stuck on a word? Open <b>Chess words</b> above, or read the Playbook tab. Nothing here is timed.</p>' +
      '</div>' +
      '<div class="lboard"><div id="lessonHost"></div><p class="hintline" id="lessonHint">' +
      (LESSONS[idx].sandbox ? '<i class="i i-pointer"></i> Click a piece, then click a highlighted square (or drag the piece).' : 'This is just a reference board — read the text, then press the button.') +
      '</p></div>' +
      '</div></div>';

    var host = $('#lessonHost');
    lp.board = BD.create(host, {
      orientation: 'w', showCoords: true, freeDrag: !!LESSONS[idx].sandbox,
      interactive: !!LESSONS[idx].sandbox, onSquare: lessonSquare
    });
    lp.state = B.parseFEN(LESSONS[idx].fen);
    lp.selected = null; lp.targets = []; lp.moved = false;
    lp.board.set({ state: lp.state });
    lp.board.dragColor = 'w';

    var L = LESSONS[idx];
    if (!(S.lessons || {})[L.id]) { S.lessons = S.lessons || {}; S.lessons[L.id] = true; save(); addXp(15, 'lesson read: ' + L.title); }
    $$('#lessonNav .lchip', view).forEach(function (b) {
      b.addEventListener('click', function () { nav('learn', 'lesson=' + b.getAttribute('data-lesson')); });
    });
    $('#btnGloss').addEventListener('click', glossaryModal);
    if ($('#lPrev')) $('#lPrev').addEventListener('click', function () { nav('learn', 'lesson=' + (idx - 1)); });
    if ($('#lNext')) $('#lNext').addEventListener('click', function () { nav('learn', 'lesson=' + (idx + 1)); });
    $('#lGuided').addEventListener('click', function () { nav('play'); setTimeout(startGuidedGame, 250); });
    $('#lPractice').addEventListener('click', function () { nav('puzzles', 'mode=mate1&n=3'); });
  }
  function firstUnfinishedLesson() {
    for (var i = 0; i < LESSONS.length; i++) if (!(S.lessons || {})[LESSONS[i].id]) return i;
    return 0;
  }
  function lessonSquare(sq) {
    var st = lp.state;
    if (!LESSONS[lp.i].sandbox) return;
    if (lp.selected != null && lp.targets.indexOf(sq) >= 0) { lessonMove(lp.selected, sq); return; }
    var p = st.board[sq];
    if (p) {
      var work = B.clone(st); work.turn = p[0];
      lp.selected = sq;
      lp.targets = B.legalMoves(work).filter(function (m) { return m.from === sq; }).map(function (m) { return m.to; });
      lp.board.set({ selected: sq, targets: lp.targets });
    } else { lp.selected = null; lp.targets = []; lp.board.set({ selected: null, targets: [] }); }
  }
  function lessonMove(from, to) {
    var st = lp.state, p = st.board[from];
    var work = B.clone(st); work.turn = p[0];
    var cands = B.legalMoves(work).filter(function (m) { return m.from === from && m.to === to; });
    if (!cands.length) return;
    var doMove = function (m) {
      var st2 = B.clone(st); st2.turn = p[0];
      var m2 = B.uciToMove(st2, B.moveToUci(m));
      var after = B.makeMove(st2, m2);
      after.turn = B.other(p[0]);          // free play: no strict turns
      lp.state = after; lp.selected = null; lp.targets = [];
      var san = B.toSAN(st2, m2);
      lp.board.set({ state: lp.state, selected: null, targets: [], lastMove: { from: from, to: to } });
      var msg = 'You played ' + san + '. ';
      if (m2.castle) msg += 'You just castled — the king is safe and the rook is active. Well done!';
      else if (m2.promo) msg += 'Promotion! Your pawn became a queen.';
      else if (m2.captured) msg += 'Nice — you captured the ' + pieceName(m2.captured) + '.';
      else if (B.inCheck(lp.state, lp.state.turn)) msg += 'Check! Their king must deal with that.';
      else msg += 'Keep experimenting — try the other pieces too.';
      var hint = $('#lessonHint'); if (hint) hint.innerHTML = '<i class="i i-checkc"></i> ' + esc(msg);
      if (!lp.moved) { lp.moved = true; addXp(10, 'practised: ' + LESSONS[lp.i].title); }
    };
    if (cands.length > 1) lp.board.promoPrompt(p[0], function (t) { doMove(cands.filter(function (x) { return x.promo === t; })[0]); });
    else doMove(cands[0]);
  }

  /* ---------------- GUIDED FIRST GAME ---------------- */
  var GUIDE = [
    {
      want: ['e2e4'], also: ['d2d4'],
      prompt: 'Move the pawn in front of your KING two squares forward: tap the pawn on <b>e2</b>, then tap <b>e4</b> (or drag it there).',
      yes: 'Perfect! e4 grabs the center of the board — the most important squares. It also opens the way for your bishop and queen.'
    },
    {
      want: ['g1f3'], also: ['b1c3'],
      prompt: 'Now bring out a knight: tap your knight on <b>g1</b> and move it to <b>f3</b>. Knights develop (come out) before bishops.',
      yes: 'Great — Nf3 develops a piece AND already attacks their e5 pawn. That is the golden rule: one new piece every move.'
    },
    {
      want: ['f1c4', 'f1b5', 'f1e2', 'f1d3', 'c1g5', 'c1f4', 'c1e3', 'c1d2', 'b1c3'],
      prompt: 'Develop a bishop: tap the bishop on <b>f1</b> and put it on <b>c4</b>. It looks at the square next to their king (f7) — their weakest spot in the opening.',
      yes: 'Excellent. Pieces that aim at the enemy king create threats all by themselves.'
    },
    {
      want: ['e1g1', 'e1c1'],
      prompt: 'Time for the most important move in chess: <b>CASTLE</b>. Tap your king on <b>e1</b> and move him two squares to <b>g1</b> — the rook will hop over automatically and your king is safe.',
      yes: 'You castled! Your king is safe behind its pawns and your rook is ready to fight. From here the coach will let you play on your own.',
      fin: true
    }
  ];
  function startGuidedGame() {
    if (!$('#boardHost')) { nav('play'); }
    newGame({ level: 0, humanColor: 'w', coach: true, hint: true });
    S.settings.showMoves = true; save();
    game.guide = { step: 0, done: false };
    paintPlay();
    $('#gameStatus').innerHTML = '<i class="i i-gamepad"></i> <b>Guided first game</b> — follow the blue box under the board.';
    if (game.st.turn !== game.humanColor) engineMove();
    guideTick();
  }
  function guideTick() {
    var bar = $('#guideBar');
    if (!bar) return;
    if (!game || !game.guide) { bar.hidden = true; return; }
    bar.hidden = false;
    var g = game.guide;
    if (g.done) {
      bar.innerHTML = '<b>Free play from here!</b> The coach will keep explaining the computer\'s moves in the panel on the right. ' +
        'Remember the two questions before every move: <b>is anything of mine attacked?</b> and <b>can I take something safely?</b>';
      return;
    }
    var st = GUIDE[g.step];
    bar.innerHTML = '<span class="kicker">STEP ' + (g.step + 1) + ' OF ' + GUIDE.length + '</span><div>' + st.prompt + '</div>' +
      '<p class="hintline">Not sure? Tap <b><i class="i i-help"></i> Why?</b> below. You can also <button class="btn sm" id="guideSkip" style="padding:2px 8px">skip this step</button> and keep playing.</p>';
    var sk = $('#guideSkip');
    if (sk) sk.addEventListener('click', function () { g.step++; g.done = g.step >= GUIDE.length; guideTick(); });
  }
  function guideAfterHuman(m) {
    var g = game.guide;
    if (!g || g.done) return;
    var st = GUIDE[g.step];
    var uci = B.moveToUci(m);
    var bar = $('#guideBar');
    if (st.want.indexOf(uci) >= 0) {
      if (bar) bar.innerHTML = '<span class="kicker"><i class="i i-checkc"></i> NICE</span><div>' + st.yes + '</div>';
      g.step++;
      if (st.fin || g.step >= GUIDE.length) g.done = true;
      setTimeout(guideTick, 1200);
    } else if (st.also.indexOf(uci) >= 0) {
      if (bar) bar.innerHTML = '<span class="kicker"><i class="i i-checkc"></i> GOOD</span><div>That works too — it does the same job. ' + st.yes + '</div>';
      g.step++;
      if (st.fin || g.step >= GUIDE.length) g.done = true;
      setTimeout(guideTick, 1200);
    } else {
      if (bar) bar.innerHTML = '<span class="kicker"><i class="i i-bulb"></i> TRY THIS</span><div>That is a legal move — nothing is broken — but the stronger idea here is: ' +
        st.prompt + '</div><p class="hintline">You can play it now, or <button class="btn sm" id="guideSkip2" style="padding:2px 8px">skip</button> and continue with your own idea.</p>' +
        '<p class="hintline" id="guideTries"></p>';
      var sk = $('#guideSkip2');
      if (sk) sk.addEventListener('click', function () { g.step++; g.done = g.step >= GUIDE.length; guideTick(); });
      /* highlight the suggested move so a beginner is never stuck */
      var want = B.uciToMove(game.st, st.want[0]);
      if (want) { game.hintArrow = [{ from: want.from, to: want.to, color: 'rgba(96,165,250,.9)' }]; paintPlay(); }
    }
  }


  /* ============================ BEGINNER MODE ============================ */
  function applyBeginnerMode(on, silent) {
    S.settings.beginner = !!on;
    if (on) {
      S.settings.level = 0; S.settings.coach = true; S.settings.hints = true;
      S.settings.showMoves = true; S.settings.showCoords = true; S.settings.clock = 'off';
    } else {
      S.settings.level = Math.max(2, S.settings.level);
      S.settings.showMoves = false;
    }
    save();
    updateModePill();
    if (!silent) toast(on ? '<i class="i i-cap"></i> Beginner mode ON — friendly opponent, all your moves shown, coach explains everything in plain English.'
      : '<i class="i i-trophy"></i> Training mode ON — stronger opponent, no training wheels.', on ? 'good' : 'xp', 4200);
  }
  function updateModePill() {
    var mp = $('#modePill');
    if (!mp) return;
    mp.classList.toggle('on', !!S.settings.beginner);
    mp.innerHTML = S.settings.beginner ? '<i class="i i-cap"></i> Beginner mode' : '<i class="i i-trophy"></i> Training mode';
  }
  function howToPlayModal() {
    modal({
      title: '<i class="i i-help"></i> How to play — the 30-second version', wide: true,
      body:
        '<h4>The goal</h4><p>Trap the enemy <b>king</b> so it cannot escape. That is <b>checkmate</b> — you win. If a king is attacked but can escape, that is just <b>check</b> and the game continues.</p>' +
        '<h4>How to move in this app</h4><ul class="bullets">' +
        '<li><b>Tap</b> your piece, then <b>tap</b> one of the green dots. Or just <b>drag</b> the piece.</li>' +
        '<li>Green dots = where that piece can go. A red ring = you would capture something there.</li>' +
        '<li>Use <b><i class="i i-undo"></i> Undo</b> freely — no shame in training. Nothing here is timed (unless you switch the clock on).</li>' +
        '<li><b><i class="i i-help"></i> Why?</b> explains the best move and the reason in plain words. <b><i class="i i-bulb"></i> Show best move</b> just draws the arrow.</li>' +
        '<li><i class="i i-shield"></i> <b>Blunder Guard</b> stops you before you lose a piece — leave it ON while learning.</li></ul>' +
        '<h4>The four rules that beat most beginners</h4><ol class="numlist">' +
        '<li>Push a center pawn first (e4 or d4).</li><li>Bring out knights and bishops — a new piece every move.</li>' +
        '<li>Castle early (move your king two squares toward a rook) so your king is safe.</li>' +
        '<li>Before every move ask: <b>what did his last move attack?</b></li></ol>' +
        '<h4>Piece values (so you know what is a good trade)</h4>' +
        '<p>Pawn <b>1</b> · Knight <b>3</b> · Bishop <b>3</b> · Rook <b>5</b> · Queen <b>9</b> · King <b>priceless</b>. If you give a knight (3) and take a rook (5), you are winning.</p>' +
        '<p class="muted small">New to chess? Go to <b>Learn Chess</b> — 11 short lessons where you drag pieces around freely, then a guided first game where I tell you every move.</p>',
      buttons: [
        { label: '<i class="i i-cap"></i> Learn Chess (start at lesson 1)', cls: 'primary', onClick: function () { nav('learn', 'lesson=0'); } },
        { label: '<i class="i i-gamepad"></i> Guided first game', onClick: function () { nav('play'); setTimeout(startGuidedGame, 300); } },
        { label: '<i class="i i-book"></i> Chess words', onClick: glossaryModal },
        { label: 'Close' }
      ]
    });
  }
  function welcomeWizard() {
    modal({
      title: '<i class="i i-layers"></i> Welcome to BEAST CHESS',
      body: '<p class="big">First — where are you starting from? This sets everything up for you (you can change it any time).</p>' +
        '<div class="gloss" style="grid-template-columns:1fr">' +
        '<div><b><i class="i i-cap"></i> I have never played chess</b><br>I will teach you from absolute zero: how each piece moves, then a guided first game where I tell you every single move and explain what the computer is doing back.</div>' +
        '<div><b><i class="i i-pawn"></i> I know how the pieces move</b><br>You get a friendly opponent, hints, and a coach that explains every move in plain English. Learn openings and tactics as you go.</div>' +
        '<div><b><i class="i i-flame"></i> I am training for the tournament</b><br>Straight to the 7-day Zero→Hero plan: the full syllabus, strong engine, puzzles and blunder reports.</div>' +
        '</div>',
      buttons: [
        { label: '<i class="i i-cap"></i> I am brand new to chess', cls: 'primary', onClick: function () { applyBeginnerMode(true, true); S.settings.onboarded = true; save(); nav('learn', 'lesson=0'); toast('Welcome! Lesson 1 is open — just read and drag the pieces around.', 'good', 5000); } },
        { label: '<i class="i i-pawn"></i> I know the basics', onClick: function () { S.settings.onboarded = true; S.settings.level = 1; S.settings.coach = true; S.settings.hints = true; S.settings.showMoves = true; S.settings.beginner = true; save(); updateModePill(); nav('play'); toast('Set up for learning: friendly opponent, coach ON. Press <i class="i i-help"></i> Why? any time.', 'good', 5000); } },
        { label: '<i class="i i-flame"></i> I am training for the tournament', onClick: function () { S.settings.onboarded = true; save(); nav('plan'); } }
      ]
    });
  }

  /* =====================================================================
     PLAIN-ENGLISH LAYER — everything a total beginner needs
     ===================================================================== */
  var PNAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  function pieceName(p) { return p ? (PNAME[p[1]] || 'piece') : 'piece'; }
  function colorName(c) { return c === 'w' ? 'White' : 'Black'; }
  function valOf(p) { return Math.round((B.VAL[p[1]] || 0) / 100 * 10) / 10; }

  /* does the piece standing on `from` attack `target`? (ignores its own other pieces) */
  function pieceAttacks(st, from, target) {
    var b = st.board, p = b[from];
    if (!p) return false;
    var color = p[0], copy = b.slice();
    for (var i = 0; i < 64; i++) if (copy[i] && copy[i][0] === color && i !== from) copy[i] = null;
    return B.attacked({ board: copy, castling: {} }, target, color);
  }
  /* is `sq` defended by `color`? (ignores the piece standing there) */
  function isDefended(st, sq, color) {
    var b = st.board.slice();
    b[sq] = null;
    return B.attacked({ board: b, castling: {} }, sq, color);
  }
  /* list of enemy pieces the piece on `from` attacks */
  function attackedTargets(st, from, victimColor) {
    var out = [];
    for (var i = 0; i < 64; i++) {
      var p = st.board[i];
      if (!p || p[0] !== victimColor) continue;
      if (pieceAttacks(st, from, i)) out.push({ sq: i, piece: p, defended: isDefended(st, i, victimColor) });
    }
    return out;
  }
  /* does `color` have a mate in one right now? returns the move or null */
  function mateThreat(st, color) {
    var work = B.clone(st); work.turn = color;
    var lm = B.legalMoves(work);
    for (var i = 0; i < lm.length; i++) {
      var u = B.makeInPlace(work, lm[i]);
      var mated = (B.legalMoves(work).length === 0) && B.inCheck(work, work.turn);
      B.unmakeInPlace(work, u);
      if (mated) return { move: lm[i], san: B.toSAN(st, lm[i]) };
    }
    return null;
  }

  /* -- "what did that move do?" in plain words -- */
  function describeMove(pre, m, mover) {
    var san = B.toSAN(pre, m);
    var piece = pre.board[m.from], t = piece[1];
    var bits = [];
    if (m.castle) bits.push('castles — the king is now safe behind its pawns and the rook joins in');
    if (m.captured) bits.push('captures the ' + pieceName(m.captured) + (valOf(m.captured) >= 3 ? ' (worth ' + valOf(m.captured) + ' pawns!)' : ''));
    if (m.promo) bits.push('promotes the pawn into a QUEEN — the strongest piece');
    var toName = B.sqName(m.to);
    if (t === 'p' && ['d4', 'e4', 'd5', 'e5'].indexOf(toName) >= 0 && !m.captured) bits.push('takes the center of the board');
    var after = B.makeMove(pre, m);
    var givesCheck = B.inCheck(after, after.turn);
    var mate = givesCheck && B.legalMoves(after).length === 0;
    if (mate) bits.push('CHECKMATE!');
    else if (givesCheck) bits.push('gives CHECK — their king is under attack');
    return { san: san, bits: bits, after: after, mate: mate };
  }

  /* -- "what is he threatening?" in plain words -- */
  function threatReport(st, humanColor) {
    var out = [];
    var opp = B.other(humanColor);
    var lastTo = null;
    /* mate threats first */
    var mt = mateThreat(st, opp);
    if (mt) out.push({ level: 'danger', text: 'Careful! The computer can mate you next move with ' + mt.san + '. You must stop it (block, capture, or move your king).' });
    /* undefended / attacked pieces of mine */
    for (var i = 0; i < 64; i++) {
      var p = st.board[i];
      if (!p || p[0] !== humanColor) continue;
      var attackers = [];
      for (var j = 0; j < 64; j++) {
        var q = st.board[j];
        if (!q || q[0] !== opp) continue;
        if (pieceAttacks(st, j, i)) attackers.push(j);
      }
      if (!attackers.length) continue;
      var defended = isDefended(st, i, humanColor);
      var lowest = attackers.map(function (a) { return st.board[a]; }).sort(function (a, b) { return valOf(a) - valOf(b); })[0];
      var cheapAttack = valOf(lowest) < valOf(p);
      if (!defended) out.push({ level: valOf(p) >= 3 ? 'danger' : 'warn', text: 'Your ' + pieceName(p) + ' on ' + B.sqName(i) + ' is under attack and nothing is defending it.' });
      else if (cheapAttack) out.push({ level: 'warn', text: 'Their ' + pieceName(lowest) + ' is attacking your ' + pieceName(p) + ' on ' + B.sqName(i) + ' (it is defended, so it is a fair trade, not a disaster).' });
    }
    return out.slice(0, 3);
  }

  /* -- "what should I do?" — a suggestion with a reason, in plain words -- */
  function suggestMove(st, humanColor) {
    var work = B.clone(st); work.turn = humanColor;
    var sc = B.rootScores(work, 3, { nodes: 0, stop: false, deadline: Date.now() + 1200 });
    if (!sc.length) return null;
    sc.sort(function (a, b) { return b.score - a.score; });
    var m = sc[0].move;
    var piece = work.board[m.from], t = piece[1];
    var after = B.makeMove(work, m);
    var why = [];
    if (m.castle) why.push('Castling puts your king in safety and brings your rook into the game — do it as early as you can.');
    if (m.captured) why.push('You win their ' + pieceName(m.captured) + ' (worth ' + valOf(m.captured) + ' pawns) — always check first that they cannot take something bigger back.');
    if (m.promo) why.push('Your pawn becomes a queen — that usually decides the game.');
    var toName = B.sqName(m.to);
    if (t === 'p' && ['d4', 'e4', 'd5', 'e5'].indexOf(toName) >= 0) why.push('It takes the center of the board, which is the best real estate for your pieces.');
    if (t === 'n' || t === 'b') {
      var centerish = (m.to >> 3) >= 2 && (m.to >> 3) <= 5 && (m.to & 7) >= 2 && (m.to & 7) <= 5;
      why.push(centerish ? 'It develops a piece toward the center — one new piece every move is the golden rule.' : 'It develops a piece and gets it out of the way so you can castle.');
    }
    if (t === 'q' && st.fullmove <= 8 && !m.captured) why.push('Careful: the queen is strong but a target. Usually knights and bishops should come out first.');
    var check = B.inCheck(after, after.turn);
    if (check) why.push('It gives check — their king must respond to it.');
    var atk = attackedTargets(after, m.to, B.other(humanColor));
    if (atk.length && !m.captured) why.push('It attacks their ' + pieceName(atk[0].piece) + ' on ' + B.sqName(atk[0].sq) + '.');
    if (t === 'k' && !m.castle) why.push('Moving the king — only do this when you have no better move, or to escape a check.');
    var defendsMyPiece = false;
    for (var i = 0; i < 64; i++) {
      var p = after.board[i];
      if (!p || p[0] !== humanColor) continue;
      if (isDefended(after, i, humanColor) && !isDefended(st, i, humanColor)) { defendsMyPiece = true; break; }
    }
    if (defendsMyPiece && !why.length) why.push('It defends a piece of yours that was in trouble.');
    if (!why.length) why.push('It quietly improves your position and keeps everything safe — that is often the best kind of move.');
    return { move: m, san: B.toSAN(work, m), why: why, score: sc[0].score };
  }

  /* =====================================================================
     LESSONS (Learn Chess tab) — interactive, drag anything, zero rules
     ===================================================================== */
  var LESSONS = [
    {
      id: 'board', title: '1. The board and the pieces',
      text: 'Chess is played on 64 squares. Columns are called "files" (a-h, shown along the bottom) and rows are "ranks" (1-8, shown up the side). Each player starts with 8 pawns, 2 knights, 2 bishops, 2 rooks, 1 queen and 1 king. White always moves first. The goal: trap the enemy KING so it cannot escape (that is checkmate).',
      tryThis: 'Look at the starting position. Find your king (the piece with the cross) and the queen next to it. Click the "Start guided first game" button below when you are ready — the coach will talk you through every move.',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      sandbox: true, freePieces: true
    },
    {
      id: 'pawn', title: '2. The pawn (worth 1)',
      text: 'A pawn moves straight forward ONE square (two squares on its very first move). It captures DIAGONALLY, one square forward-left or forward-right. It can never move backwards. If a pawn reaches the far end of the board it turns into a queen — that is called promotion.',
      tryThis: 'Drag the white pawn forward. Then drag it onto the black pawn diagonally to capture it. Try pushing a pawn all the way to the last row to see it become a queen.',
      fen: '4k3/3p4/8/8/4P3/8/8/4K3 w - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'knight', title: '3. The knight (worth 3)',
      text: 'The knight moves in an "L": two squares one way, then one square sideways. It is the only piece that can JUMP over other pieces. Because it attacks squares no other piece can reach, it is the best piece for surprise attacks (called forks).',
      tryThis: 'Drag the knight around — notice the 8 squares it reaches. Click it, then look at the shape of its moves.',
      fen: '4k3/8/8/8/4N3/8/8/4K3 w - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'bishop', title: '4. The bishop (worth 3)',
      text: 'The bishop moves any number of squares DIAGONALLY — as far as it likes, as long as nothing blocks it. Each bishop stays on its own colour for the whole game: one bishop lives on light squares, the other on dark squares.',
      tryThis: 'Drag the bishop. Notice it can never switch colour — that is why you need both of them.',
      fen: '4k3/8/8/6b1/8/8/8/4K1B1 w - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'rook', title: '5. The rook (worth 5)',
      text: 'The rook moves any number of squares in straight lines — along files (up and down) and ranks (side to side). Rooks are strongest when they get onto open lines with no pawns blocking them.',
      tryThis: 'Drag the rook up and down, left and right. Now try to capture the black rook.',
      fen: 'r3k3/8/8/8/8/8/8/R3K3 w - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'queen', title: '6. The queen (worth 9)',
      text: 'The queen combines the rook and the bishop: she moves any number of squares in straight lines AND diagonally. She is the most powerful piece — so do not send her out early where she can be chased and captured.',
      tryThis: 'Drag the queen. Count how many squares she controls from the middle — from a central square she controls up to 27!',
      fen: '4k3/8/8/8/8/8/8/3QK3 w - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'king', title: '7. The king, check and checkmate (priceless)',
      text: 'The king moves ONE square in any direction. He can never move onto a square where he would be attacked. If he is attacked, that is CHECK — you must get him out of it (move him, block the attack, or capture the attacker). If he is attacked and cannot escape, that is CHECKMATE and the game is over.',
      tryThis: 'Drag the white rook all the way to the top row to give check. Then try to trap the black king so it has no squares left — that is checkmate.',
      fen: '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'mate', title: '8. Your first checkmate pattern: the back rank',
      text: 'Here the black king is trapped behind its own pawns. A rook or queen that reaches the far row gives checkmate — the king cannot move sideways (its own pawns are in the way), cannot capture, and nobody can block. This is the most common checkmate in real games.',
      tryThis: 'Move the white rook to the top (8th) row: a8. That is checkmate — the king has no escape.',
      fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'special', title: '9. The two special moves: castling and promotion',
      text: 'CASTLING is a move where the king jumps two squares towards a rook and the rook hops to the other side of him. You may castling only if neither piece has moved yet, nothing is between them, and the king is not in check or passing through an attacked square. It is the fastest way to make your king safe — do it early!',
      tryThis: 'Drag your white king two squares to the right (e1 to g1). You just castled! You can also castle to the left, and with the black pieces too.',
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'stalemate', title: '10. Draws: stalemate and repetition',
      text: 'Not every game ends with a win. If a player has NO legal move but is NOT in check, the game is a draw — that is STALEMATE (it is the classic way to throw away a winning position). Games are also drawn by threefold repetition, the 50-move rule, or if neither side has enough pieces to mate.',
      tryThis: 'Look at this position: the black king is not in check but has no legal move at all — the game is drawn. When you are winning, always leave the enemy king a square until you are ready to mate.',
      fen: '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', sandbox: true, freePieces: true
    },
    {
      id: 'plan', title: '11. How to play your first real game (the 4 golden rules)',
      text: 'You do not need to memorise anything to play well as a beginner. Follow these four rules every game: (1) Put a pawn in the center — e4 or d4 as White, e5 or d5 as Black. (2) Bring out your knights and bishops (never move the same piece twice). (3) CASTLE early — by move 6-10. (4) Before every move ask: "what did his last move attack?" That one question saves more games than any opening theory.',
      tryThis: 'Ready? Start a guided game below — the coach will tell you exactly what to do, one move at a time, and explain what the computer is doing back.',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', sandbox: false
    }
  ];

  var GLOSSARY = [
    ['Check', 'Your king is being attacked. You must escape it right now.'],
    ['Checkmate', 'The king is attacked and cannot escape — the game ends and you win (or lose).'],
    ['Castling', 'A special king-and-rook move that makes your king safe. Move the king two squares toward a rook.'],
    ['Stalemate', 'The player to move has no legal move but is NOT in check — the game is a draw.'],
    ['Draw', 'Nobody wins: by stalemate, by repeating the same position three times, or after 50 moves with no pawn move or capture.'],
    ['Promotion', 'A pawn that reaches the last row becomes a queen (or rook, bishop, knight).'],
    ['Material', 'Your pieces counted up in pawns: pawn 1, knight 3, bishop 3, rook 5, queen 9.'],
    ['Development', 'Getting your knights and bishops off their starting squares and toward the center.'],
    ['The center', 'The four squares in the middle (d4, e4, d5, e5). Pieces there control more of the board.'],
    ['Tempo', 'One move. "Losing a tempo" means wasting a move.'],
    ['Fork', 'One piece attacking two enemy pieces at once — they can only save one.'],
    ['Pin', 'A piece cannot move because a more valuable piece is behind it (often the king).'],
    ['Skewer', 'Like a pin, but backwards: attack the big piece and win the smaller one behind it.'],
    ['Hanging', 'A piece that is undefended and can simply be captured.'],
    ['Trade', 'Both sides capture a piece of equal value.'],
    ['Sacrifice', 'Giving up material on purpose to get something better (an attack, or a win).'],
    ['Back rank', 'The first/last row where a castled king can get mated by a rook or queen.'],
    ['Double attack', 'Attacking two things with one move — the basis of almost every tactic.'],
    ['Passed pawn', 'A pawn with no enemy pawn left to stop it. Push it!'],
    ['Open file', 'A column with no pawns on it — perfect for your rooks.'],
    ['Zugzwang', 'Being forced to move when every move makes your position worse.'],
    ['Blunder', 'A really bad move that loses material or the game. It happens to everyone — the Blunder Guard exists to stop you.'],
    ['En passant', 'A rare pawn capture: if a pawn moves two squares past your pawn, you may capture it as if it had moved only one square (only immediately).'],
    ['Insufficient material', 'Neither player has enough pieces left to checkmate — the game is drawn.']
  ];
  function glossaryModal() {
    modal({
      title: '<i class="i i-book"></i> Chess words explained (plain English)', wide: true,
      body: '<p class="muted">Click any tab or the Playbook whenever you meet a word you do not know — or keep this open next to the board.</p>' +
        '<div class="gloss">' + GLOSSARY.map(function (g) { return '<div><b>' + esc(g[0]) + '</b><br>' + esc(g[1]) + '</div>'; }).join('') + '</div>',
      buttons: [{ label: 'Start a guided game', cls: 'primary', onClick: function () { nav('play'); setTimeout(startGuidedGame, 300); } }, { label: 'Close' }]
    });
  }

  /* ============================ PGN EXPORT ============================ */
  function pgnOf(g) {
    var res = g.result === 'w' ? '1-0' : g.result === 'b' ? '0-1' : '1/2-1/2';
    var date = (g.date || '').slice(0, 10).replace(/-/g, '.');
    var head = ['[Event "Beast Chess training game"]', '[Site "Beast Chess dashboard"]', '[Date "' + date + '"]',
      '[White "' + (g.color === 'w' ? 'You' : 'Engine ' + levelName(g.level)) + '"]',
      '[Black "' + (g.color === 'b' ? 'You' : 'Engine ' + levelName(g.level)) + '"]',
      '[Result "' + res + '"]'].join('\n');
    var out = '', line = '', fullmove = 1;
    for (var i = 0; i < g.sans.length; i++) {
      if (i % 2 === 0) line = fullmove + '. ' + g.sans[i];
      else { line += ' ' + g.sans[i]; out += (out ? ' ' : '') + line; fullmove++; line = ''; }
    }
    if (line) out += (out ? ' ' : '') + line;
    return head + '\n\n' + out + ' ' + res + '\n';
  }
  function copyText(txt, label) {
    function done() { toast('<i class="i i-clipboard"></i> ' + (label || 'Copied') + ' — paste it into lichess.org/paste or chess.com/analysis', 'good', 4200); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () { fallback(); });
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { modal({ title: 'Copy this text', body: '<textarea style="width:100%;height:220px;background:#0d131f;color:#e9eef8;border:1px solid #243149;border-radius:10px;padding:10px">' + esc(txt) + '</textarea>' }); }
      ta.remove();
    }
  }

  /* ============================ BOOT ============================ */
  function boot() {
    var navEl = $('#nav');
    navEl.innerHTML = VIEWS.map(function (v) { return '<a class="navitem" data-v="' + v.id + '" href="#/' + v.id + '">' + v.icon + '<span>' + v.label + '</span></a>'; }).join('');
    /* clicks are handled in-app: hash links do not work inside sandboxed previews */
    $$('#nav .navitem').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); nav(a.getAttribute('data-v')); });
    });
    $('#dailyTip').innerHTML = DAILY_TIPS[new Date().getDate() % DAILY_TIPS.length];
    route = parseHash();
    /* deep links work on the web (play.html#learn); inside a sandboxed preview
       reading the hash can throw, so every access is guarded and we simply
       fall back to the Command Center. */
    try {
      var deep = (location.hash || '').replace(/^#\/?/, '') || (location.search || '').replace(/^\?v=/, '');
      if (deep) { var qs = ''; var qi = deep.indexOf('?'); if (qi >= 0) { qs = deep.slice(qi + 1); deep = deep.slice(0, qi); }
        var known = VIEWS.some(function (v) { return v.id === deep; });
        if (known) { route = { view: deep, params: parseQs(qs) }; }
      }
    } catch (e) { }
    setHash(route.view, '');
    render();
    bumpStreak();
    updateModePill();
    var hb = $('#helpBtn');
    if (hb) hb.addEventListener('click', howToPlayModal);
    var mp = $('#modePill');
    if (mp) mp.addEventListener('click', function () { applyBeginnerMode(!S.settings.beginner); });
    if (!S.settings.onboarded) setTimeout(welcomeWizard, 600);
  }
  var DAILY_TIPS = [
    'Before every move: <b>what did his last move attack?</b>',
    'Castle by move 10. Every game. No exceptions.',
    'When you are winning: trade pieces, not pawns.',
    'A knight on the rim is dim — centralize it.',
    'Never play f3/f6 with your king behind it unless you must.',
    'Count attackers vs defenders before every capture.',
    'If you see a good move, look for a better one.',
    'Nothing is free in the opening — calculate the checks first.',
    'Rook behind the passed pawn. Always.',
    'The player who recaptures last usually wins — count the sequence to the end.',
    'Time trouble: play simple, safe moves. Let the clock beat him.',
    'Checks, captures, threats — in that order, every move.'
  ];
  /* ---- debug hook (also handy for power users in the console) ---- */
  window.__beast = {
    get pz() { return pz; }, get game() { return game; }, get op() { return op; },
    state: function () { return S; }, nav: nav, solve: function (uci) {
      if (!pz) return 'no puzzle session';
      var m = B.uciToMove(pz.state, uci); if (!m) return 'illegal';
      pzAttempt(m.from, m.to); return 'ok';
    }, engineMove: function () { engineMove(); }, newGame: function (o) { newGame(o); },
    startGuided: function () { startGuidedGame(); }, guided: function () { return game && game.guide; },
    suggest: function () { return suggestMove(game.st, game.humanColor); }
  };
  boot();
})();
