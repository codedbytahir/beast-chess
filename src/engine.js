/* =========================================================================
   BEAST MODE CHESS ENGINE  (vanilla JS, zero dependencies)
   Board index 0 = a8 ... 63 = h1   (rank 8 on top, like a screen board)
   Piece = "wp","wn","wb","wr","wq","wk","bp",... or null
   ========================================================================= */
(function (root) {
  'use strict';

  var FILES = 'abcdefgh';
  var START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  var MATE = 200000;

  /* ------------------------- helpers ------------------------- */
  function sqName(i) { return FILES[i & 7] + (8 - (i >> 3)); }
  function nameToSq(s) { return (8 - parseInt(s[1], 10)) * 8 + FILES.indexOf(s[0]); }
  function other(c) { return c === 'w' ? 'b' : 'w'; }
  function onBoard(r, f) { return r >= 0 && r < 8 && f >= 0 && f < 8; }

  var KNIGHT_D = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  var KING_D = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var ROOK_D = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  var BISHOP_D = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  /* ------------------------- FEN ------------------------- */
  function parseFEN(fen) {
    var parts = fen.trim().split(/\s+/);
    var board = new Array(64).fill(null);
    var rows = parts[0].split('/');
    for (var r = 0; r < 8; r++) {
      var f = 0, row = rows[r] || '8';
      for (var k = 0; k < row.length; k++) {
        var ch = row[k];
        if (ch >= '1' && ch <= '8') { f += parseInt(ch, 10); }
        else {
          var color = ch === ch.toUpperCase() ? 'w' : 'b';
          board[r * 8 + f] = color + ch.toLowerCase();
          f++;
        }
      }
    }
    var cast = parts[2] || '-';
    var st = {
      board: board,
      turn: parts[1] || 'w',
      castling: { wk: cast.indexOf('K') >= 0, wq: cast.indexOf('Q') >= 0, bk: cast.indexOf('k') >= 0, bq: cast.indexOf('q') >= 0 },
      ep: (parts[3] && parts[3] !== '-') ? nameToSq(parts[3]) : null,
      halfmove: parts[4] ? parseInt(parts[4], 10) : 0,
      fullmove: parts[5] ? parseInt(parts[5], 10) : 1
    };
    return st;
  }

  function toFEN(s) {
    var out = '';
    for (var r = 0; r < 8; r++) {
      var empty = 0;
      for (var f = 0; f < 8; f++) {
        var p = s.board[r * 8 + f];
        if (!p) { empty++; continue; }
        if (empty) { out += empty; empty = 0; }
        out += p[0] === 'w' ? p[1].toUpperCase() : p[1];
      }
      if (empty) out += empty;
      if (r < 7) out += '/';
    }
    var cast = (s.castling.wk ? 'K' : '') + (s.castling.wq ? 'Q' : '') + (s.castling.bk ? 'k' : '') + (s.castling.bq ? 'q' : '');
    return out + ' ' + s.turn + ' ' + (cast || '-') + ' ' + (s.ep != null ? sqName(s.ep) : '-') + ' ' + s.halfmove + ' ' + s.fullmove;
  }

  function positionKey(s) {
    // board + turn + castling + ep  (enough for repetition detection)
    var f = toFEN(s).split(' ');
    return f[0] + ' ' + f[1] + ' ' + f[2] + ' ' + f[3];
  }

  function clone(s) {
    return {
      board: s.board.slice(),
      turn: s.turn,
      castling: { wk: s.castling.wk, wq: s.castling.wq, bk: s.castling.bk, bq: s.castling.bq },
      ep: s.ep,
      halfmove: s.halfmove,
      fullmove: s.fullmove
    };
  }

  function findKing(s, color) {
    var want = color + 'k';
    for (var i = 0; i < 64; i++) if (s.board[i] === want) return i;
    return -1;
  }

  /* ------------------------- attack detection ------------------------- */
  function attacked(s, sq, byColor) {
    var b = s.board, r = sq >> 3, f = sq & 7, i, rr, ff, p;

    // pawns
    if (byColor === 'w') {
      rr = r + 1;
      if (rr < 8) {
        if (f > 0 && b[rr * 8 + f - 1] === 'wp') return true;
        if (f < 7 && b[rr * 8 + f + 1] === 'wp') return true;
      }
    } else {
      rr = r - 1;
      if (rr >= 0) {
        if (f > 0 && b[rr * 8 + f - 1] === 'bp') return true;
        if (f < 7 && b[rr * 8 + f + 1] === 'bp') return true;
      }
    }
    // knights
    for (i = 0; i < 8; i++) {
      rr = r + KNIGHT_D[i][0]; ff = f + KNIGHT_D[i][1];
      if (onBoard(rr, ff) && b[rr * 8 + ff] === byColor + 'n') return true;
    }
    // king
    for (i = 0; i < 8; i++) {
      rr = r + KING_D[i][0]; ff = f + KING_D[i][1];
      if (onBoard(rr, ff) && b[rr * 8 + ff] === byColor + 'k') return true;
    }
    // sliders
    var dirs = ROOK_D.concat(BISHOP_D);
    for (i = 0; i < 8; i++) {
      rr = r + dirs[i][0]; ff = f + dirs[i][1];
      while (onBoard(rr, ff)) {
        p = b[rr * 8 + ff];
        if (p) {
          if (p[0] === byColor) {
            var t = p[1];
            if (t === 'q') return true;
            if (i < 4 && t === 'r') return true;
            if (i >= 4 && t === 'b') return true;
          }
          break;
        }
        rr += dirs[i][0]; ff += dirs[i][1];
      }
    }
    return false;
  }

  function inCheck(s, color) {
    if (color == null) color = s.turn;
    var k = findKing(s, color);
    if (k < 0) return false;
    return attacked(s, k, other(color));
  }

  /* ------------------------- move generation ------------------------- */
  function mk(o) { return o; }

  function genPseudo(s, color) {
    color = color || s.turn;
    var b = s.board, moves = [], i, r, f, p, t, dir, to, rr, ff, d;

    for (i = 0; i < 64; i++) {
      p = b[i];
      if (!p || p[0] !== color) continue;
      t = p[1]; r = i >> 3; f = i & 7;

      if (t === 'p') {
        dir = color === 'w' ? -1 : 1;
        var startR = color === 'w' ? 6 : 1;
        var promoR = color === 'w' ? 0 : 7;
        rr = r + dir;
        if (onBoard(rr, f) && !b[rr * 8 + f]) {
          to = rr * 8 + f;
          if (rr === promoR) { ['q', 'r', 'b', 'n'].forEach(function (pr) { moves.push(mk({ from: i, to: to, promo: pr })); }); }
          else {
            moves.push(mk({ from: i, to: to }));
            if (r === startR && !b[(r + 2 * dir) * 8 + f]) moves.push(mk({ from: i, to: (r + 2 * dir) * 8 + f, double: true }));
          }
        }
        for (d = -1; d <= 1; d += 2) {
          ff = f + d; rr = r + dir;
          if (!onBoard(rr, ff)) continue;
          to = rr * 8 + ff;
          var target = b[to];
          if (target && target[0] !== color) {
            if (rr === promoR) { ['q', 'r', 'b', 'n'].forEach(function (pr) { moves.push(mk({ from: i, to: to, promo: pr, captured: target })); }); }
            else moves.push(mk({ from: i, to: to, captured: target }));
          } else if (!target && s.ep === to) {
            moves.push(mk({ from: i, to: to, captured: other(color) + 'p', ep: true }));
          }
        }
      } else if (t === 'n') {
        for (d = 0; d < 8; d++) {
          rr = r + KNIGHT_D[d][0]; ff = f + KNIGHT_D[d][1];
          if (!onBoard(rr, ff)) continue;
          to = rr * 8 + ff; var q = b[to];
          if (!q || q[0] !== color) moves.push(mk({ from: i, to: to, captured: q || null }));
        }
      } else if (t === 'k') {
        for (d = 0; d < 8; d++) {
          rr = r + KING_D[d][0]; ff = f + KING_D[d][1];
          if (!onBoard(rr, ff)) continue;
          to = rr * 8 + ff; var q2 = b[to];
          if (!q2 || q2[0] !== color) moves.push(mk({ from: i, to: to, captured: q2 || null }));
        }
      } else {
        var dirs = t === 'r' ? ROOK_D : (t === 'b' ? BISHOP_D : ROOK_D.concat(BISHOP_D));
        for (d = 0; d < dirs.length; d++) {
          rr = r + dirs[d][0]; ff = f + dirs[d][1];
          while (onBoard(rr, ff)) {
            to = rr * 8 + ff; var q3 = b[to];
            if (!q3) moves.push(mk({ from: i, to: to }));
            else { if (q3[0] !== color) moves.push(mk({ from: i, to: to, captured: q3 })); break; }
            rr += dirs[d][0]; ff += dirs[d][1];
          }
        }
      }
    }

    // castling
    var c = s.castling;
    if (color === 'w') {
      if (c.wk && !b[61] && !b[62] && b[60] === 'wk' && b[63] === 'wr' && !attacked(s, 60, 'b') && !attacked(s, 61, 'b') && !attacked(s, 62, 'b'))
        moves.push(mk({ from: 60, to: 62, castle: 'K' }));
      if (c.wq && !b[59] && !b[58] && !b[57] && b[60] === 'wk' && b[56] === 'wr' && !attacked(s, 60, 'b') && !attacked(s, 59, 'b') && !attacked(s, 58, 'b'))
        moves.push(mk({ from: 60, to: 58, castle: 'Q' }));
    } else {
      if (c.bk && !b[5] && !b[6] && b[4] === 'bk' && b[7] === 'br' && !attacked(s, 4, 'w') && !attacked(s, 5, 'w') && !attacked(s, 6, 'w'))
        moves.push(mk({ from: 4, to: 6, castle: 'K' }));
      if (c.bq && !b[3] && !b[2] && !b[1] && b[4] === 'bk' && b[0] === 'br' && !attacked(s, 4, 'w') && !attacked(s, 3, 'w') && !attacked(s, 2, 'w'))
        moves.push(mk({ from: 4, to: 2, castle: 'Q' }));
    }
    return moves;
  }

  /* ------- in-place make/unmake (fast; used by search & perft) ------- */
  function makeInPlace(s, m) {
    var b = s.board;
    var piece = b[m.from];
    var undo = {
      m: m, piece: piece,
      captured: m.ep ? other(piece[0]) + 'p' : (b[m.to] || null),
      capSq: m.ep ? (m.to + (piece[0] === 'w' ? 8 : -8)) : m.to,
      castling: { wk: s.castling.wk, wq: s.castling.wq, bk: s.castling.bk, bq: s.castling.bq },
      ep: s.ep, halfmove: s.halfmove, fullmove: s.fullmove, turn: s.turn
    };
    if (m.ep) b[undo.capSq] = null;
    b[m.to] = m.promo ? (piece[0] + m.promo) : piece;
    b[m.from] = null;
    if (m.castle) {
      if (m.castle === 'K') { if (piece[0] === 'w') { b[61] = b[63]; b[63] = null; } else { b[5] = b[7]; b[7] = null; } }
      else { if (piece[0] === 'w') { b[59] = b[56]; b[56] = null; } else { b[3] = b[0]; b[0] = null; } }
    }
    var c = s.castling;
    if (piece[1] === 'k') { if (piece[0] === 'w') { c.wk = c.wq = false; } else { c.bk = c.bq = false; } }
    if (m.from === 63 || m.to === 63) c.wk = false;
    if (m.from === 56 || m.to === 56) c.wq = false;
    if (m.from === 7 || m.to === 7) c.bk = false;
    if (m.from === 0 || m.to === 0) c.bq = false;
    s.ep = m.double ? (m.from + m.to) / 2 : null;
    s.halfmove = (piece[1] === 'p' || undo.captured) ? 0 : s.halfmove + 1;
    if (s.turn === 'b') s.fullmove++;
    s.turn = other(s.turn);
    return undo;
  }

  function unmakeInPlace(s, u) {
    var b = s.board, m = u.m, piece = u.piece;
    b[m.from] = piece;
    b[m.to] = null;
    if (u.captured) b[u.capSq] = u.captured;
    if (m.castle) {
      if (m.castle === 'K') { if (piece[0] === 'w') { b[63] = b[61]; b[61] = null; } else { b[7] = b[5]; b[5] = null; } }
      else { if (piece[0] === 'w') { b[56] = b[59]; b[59] = null; } else { b[0] = b[3]; b[3] = null; } }
    }
    s.castling = u.castling; s.ep = u.ep; s.halfmove = u.halfmove; s.fullmove = u.fullmove; s.turn = u.turn;
  }

  /* move already validated by generator => king safety check by trial */
  function legalMoves(s, color) {
    var pseudo = genPseudo(s, color), out = [], i, u;
    for (i = 0; i < pseudo.length; i++) {
      u = makeInPlace(s, pseudo[i]);
      if (!inCheck(s, u.piece[0])) out.push(pseudo[i]);
      unmakeInPlace(s, u);
    }
    /* A KING IS NEVER CAPTURED. Chess is won by checkmate, not by taking the
       king off the board. Positions built for teaching (lesson sandboxes, the
       guided game, drills) force the side to move, and there the generator can
       otherwise produce "Rxe8" straight onto the enemy king — that move is
       illegal and must never be offered anywhere in the app. */
    return out.filter(function (m) { return !(m.captured && m.captured.charAt(1).toLowerCase() === 'k'); });
  }

  function makeMove(s, m) {
    var n = clone(s);
    makeInPlace(n, m);
    return n;
  }

  /* ------------------------- SAN ------------------------- */
  function toSAN(s, m) {
    var base;
    if (m.castle) base = m.castle === 'K' ? 'O-O' : 'O-O-O';
    else {
      var piece = s.board[m.from], t = piece[1], color = piece[0];
      if (t === 'p') {
        base = (m.captured ? FILES[m.from & 7] + 'x' : '') + sqName(m.to);
        if (m.promo) base += '=' + m.promo.toUpperCase();
      } else {
        // disambiguation
        var same = legalMoves(s, color).filter(function (x) {
          return x.to === m.to && x.from !== m.from && s.board[x.from] && s.board[x.from][1] === t;
        });
        var dis = '';
        if (same.length) {
          var sameFile = same.some(function (x) { return (x.from & 7) === (m.from & 7); });
          var sameRank = same.some(function (x) { return (x.from >> 3) === (m.from >> 3); });
          if (!sameFile) dis = FILES[m.from & 7];
          else if (!sameRank) dis = String(8 - (m.from >> 3));
          else dis = sqName(m.from);
        }
        base = t.toUpperCase() + dis + (m.captured ? 'x' : '') + sqName(m.to);
      }
    }
    var u = makeInPlace(s, m);
    var gives = inCheck(s, s.turn);
    var noMoves = gives ? legalMoves(s, s.turn).length === 0 : false;
    unmakeInPlace(s, u);
    if (gives) base += noMoves ? '#' : '+';
    return base;
  }

  function fromSAN(s, san) {
    var clean = san.replace(/[+#!?]/g, '');
    var list = legalMoves(s);
    for (var i = 0; i < list.length; i++) {
      var gen = toSAN(s, list[i]).replace(/[+#!?]/g, '');
      if (gen === clean) return list[i];
    }
    // tolerant fallback: allow "e8Q" style promotion or omitted capture notation
    var alt = clean.replace('=', '');
    for (var j = 0; j < list.length; j++) {
      var gen2 = toSAN(s, list[j]).replace(/[+#!?=]/g, '');
      if (gen2 === alt) return list[j];
    }
    return null;
  }

  function moveToUci(m) { return sqName(m.from) + sqName(m.to) + (m.promo || ''); }
  function uciToMove(s, uci) {
    if (!uci) return null;
    var from = nameToSq(uci.slice(0, 2)), to = nameToSq(uci.slice(2, 4)), promo = uci[4] || null;
    var list = legalMoves(s);
    for (var i = 0; i < list.length; i++) {
      if (list[i].from === from && list[i].to === to && (list[i].promo || null) === promo) return list[i];
    }
    return null;
  }

  /* ------------------------- game state ------------------------- */
  function insufficientMaterial(s) {
    var counts = {}, bishops = [];
    for (var i = 0; i < 64; i++) {
      var p = s.board[i]; if (!p) continue;
      counts[p[1]] = (counts[p[1]] || 0) + 1;
      if (p[1] === 'b') bishops.push(((i >> 3) + (i & 7)) % 2);
    }
    // pawns / rooks / queens on the board => always sufficient material
    if ((counts.p || 0) > 0 || (counts.r || 0) > 0 || (counts.q || 0) > 0) return false;
    var minors = (counts.n || 0) + (counts.b || 0);
    if (minors === 0) return true;                    // K vs K
    if (minors === 1) return true;                    // K+minor vs K
    if ((counts.n || 0) === 0 && (counts.b || 0) === 2 && bishops.length === 2 && bishops[0] === bishops[1]) return true;
    return false;
  }

  function status(s, keys) {
    var moves = legalMoves(s, s.turn);
    if (moves.length === 0) return inCheck(s, s.turn) ? { over: true, result: other(s.turn), reason: 'checkmate' } : { over: true, result: 'draw', reason: 'stalemate' };
    if (s.halfmove >= 100) return { over: true, result: 'draw', reason: '50-move rule' };
    if (insufficientMaterial(s)) return { over: true, result: 'draw', reason: 'insufficient material' };
    if (keys) {
      var last = keys[keys.length - 1], n = 0;
      for (var i = 0; i < keys.length; i++) if (keys[i] === last) n++;
      if (n >= 3) return { over: true, result: 'draw', reason: 'threefold repetition' };
    }
    return { over: false, result: null, reason: moves.length === 1 ? 'only one legal move' : null };
  }

  /* ------------------------- evaluation ------------------------- */
  var PST = {
    p: [0, 0, 0, 0, 0, 0, 0, 0,
      50, 50, 50, 50, 50, 50, 50, 50,
      10, 10, 20, 30, 30, 20, 10, 10,
      5, 5, 10, 25, 25, 10, 5, 5,
      0, 0, 0, 20, 20, 0, 0, 0,
      5, -5, -10, 0, 0, -10, -5, 5,
      5, 10, 10, -20, -20, 10, 10, 5,
      0, 0, 0, 0, 0, 0, 0, 0],
    n: [-50, -40, -30, -30, -30, -30, -40, -50,
      -40, -20, 0, 0, 0, 0, -20, -40,
      -30, 0, 10, 15, 15, 10, 0, -30,
      -30, 5, 15, 20, 20, 15, 5, -30,
      -30, 0, 15, 20, 20, 15, 0, -30,
      -30, 5, 10, 15, 15, 10, 5, -30,
      -40, -20, 0, 5, 5, 0, -20, -40,
      -50, -40, -30, -30, -30, -30, -40, -50],
    b: [-20, -10, -10, -10, -10, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 10, 10, 5, 0, -10,
      -10, 5, 5, 10, 10, 5, 5, -10,
      -10, 0, 10, 10, 10, 10, 0, -10,
      -10, 10, 10, 10, 10, 10, 10, -10,
      -10, 5, 0, 0, 0, 0, 5, -10,
      -20, -10, -10, -10, -10, -10, -10, -20],
    r: [0, 0, 0, 0, 0, 0, 0, 0,
      5, 10, 10, 10, 10, 10, 10, 5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      -5, 0, 0, 0, 0, 0, 0, -5,
      0, 0, 0, 5, 5, 0, 0, 0],
    q: [-20, -10, -10, -5, -5, -10, -10, -20,
      -10, 0, 0, 0, 0, 0, 0, -10,
      -10, 0, 5, 5, 5, 5, 0, -10,
      -5, 0, 5, 5, 5, 5, 0, -5,
      0, 0, 5, 5, 5, 5, 0, -5,
      -10, 5, 5, 5, 5, 5, 0, -10,
      -10, 0, 5, 0, 0, 0, 0, -10,
      -20, -10, -10, -5, -5, -10, -10, -20],
    k: [-30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30,
      -20, -30, -30, -40, -40, -30, -30, -20,
      -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 0, 20, 20,
      20, 30, 10, 0, 0, 10, 30, 20],
    ke: [-50, -40, -30, -20, -20, -30, -40, -50,
      -30, -20, -10, 0, 0, -10, -20, -30,
      -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30,
      -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -30, 0, 0, 0, 0, -30, -30,
      -50, -30, -30, -30, -30, -30, -30, -50]
  };

  function evaluate(s) {
    var b = s.board, score = 0, i, p, t, c, idx, phase = 0;
    // material + light structure
    var pawnFiles = { w: [0, 0, 0, 0, 0, 0, 0, 0], b: [0, 0, 0, 0, 0, 0, 0, 0] };
    var bishops = { w: 0, b: 0 };
    for (i = 0; i < 64; i++) {
      p = b[i]; if (!p) continue;
      c = p[0]; t = p[1];
      if (t !== 'k' && t !== 'p') phase += (t === 'q' ? 4 : t === 'r' ? 2 : 1);
      if (t === 'p') pawnFiles[c][i & 7]++;
      if (t === 'b') bishops[c]++;
      var v = VAL[t];
      idx = c === 'w' ? i : (i ^ 56);   // mirror for black
      var pst = (t === 'k') ? (phase > 12 ? PST.k[idx] : PST.ke[idx]) : PST[t][idx];
      score += (c === 'w' ? 1 : -1) * (v + pst);
    }
    // doubled / isolated pawns
    for (var col = 0; col < 2; col++) {
      var cc = col === 0 ? 'w' : 'b', sign = col === 0 ? 1 : -1, pf = pawnFiles[cc];
      for (var f = 0; f < 8; f++) {
        if (pf[f] > 1) score -= sign * 12 * (pf[f] - 1);
        if (pf[f] > 0 && (f === 0 || !pf[f - 1]) && (f === 7 || !pf[f + 1])) score -= sign * 14;
      }
      if (bishops[cc] >= 2) score += sign * 30;
    }
    // king safety: pawn shield when castled
    ['w', 'b'].forEach(function (cc) {
      var sign = cc === 'w' ? 1 : -1;
      var k = findKing(s, cc);
      if (k < 0) return;
      var kr = k >> 3, kf = k & 7;
      if ((cc === 'w' && kr === 7 && (kf === 6 || kf === 2)) || (cc === 'b' && kr === 0 && (kf === 6 || kf === 2))) {
        score += sign * 18;
        for (var d = -1; d <= 1; d++) {
          var ff2 = kf + d, rr2 = cc === 'w' ? kr - 1 : kr + 1;
          if (onBoard(rr2, ff2) && b[rr2 * 8 + ff2] === cc + 'p') score += sign * 8;
        }
      }
    });
    score += 12 * (s.turn === 'w' ? 1 : -1); // tempo
    return s.turn === 'w' ? score : -score;
  }

  /* ------------------------- search ------------------------- */
  function scoreMove(s, m) {
    var sc = 0;
    if (m.captured) sc += 1000 + 10 * VAL[m.captured[1]] - VAL[s.board[m.from][1]];
    if (m.promo) sc += 800 + VAL[m.promo];
    if (m.castle) sc += 60;
    return sc;
  }

  function orderMoves(s, moves, ply, ctx) {
    moves.sort(function (a, b) {
      var sa = scoreMove(s, a), sb = scoreMove(s, b);
      if (ctx && ctx.killers && ply != null) {
        var ks = ctx.killers[ply];
        if (ks) {
          var ka = a.from * 64 + a.to, kb = b.from * 64 + b.to;
          if (ks[0] === ka || ks[1] === ka) sa += 900;
          if (ks[0] === kb || ks[1] === kb) sb += 900;
        }
      }
      return sb - sa;
    });
    return moves;
  }

  function quiesce(s, alpha, beta, ctx, ply) {
    ctx.nodes++;
    if ((ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) { ctx.stop = true; }
    var stand = evaluate(s);
    if (stand >= beta) return beta;
    if (stand > alpha) alpha = stand;
    if (ctx.stop) return alpha;

    var moves = legalMoves(s).filter(function (m) { return m.captured || m.promo; });
    moves.sort(function (a, b) { return scoreMove(s, b) - scoreMove(s, a); });
    for (var i = 0; i < moves.length; i++) {
      if (ctx.stop) break;
      var u = makeInPlace(s, moves[i]);
      var sc = -quiesce(s, -beta, -alpha, ctx, ply + 1);
      unmakeInPlace(s, u);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function abSearch(s, depth, alpha, beta, ctx, ply) {
    if (!ctx.killers) ctx.killers = [];
    ctx.nodes++;
    if ((ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) { ctx.stop = true; return alpha; }

    var checked = inCheck(s, s.turn);
    if (checked) depth++;
    if (depth <= 0) return quiesce(s, alpha, beta, ctx, ply);

    var moves = legalMoves(s);
    if (moves.length === 0) return checked ? -MATE + ply : 0;
    if (s.halfmove >= 100) return 0;
    orderMoves(s, moves, ply, ctx);

    for (var i = 0; i < moves.length; i++) {
      var u = makeInPlace(s, moves[i]);
      var sc = -abSearch(s, depth - 1, -beta, -alpha, ctx, ply + 1);
      unmakeInPlace(s, u);
      if (ctx.stop) return alpha;
      if (sc >= beta) {
        if (!moves[i].captured) {           // killer move: quiet move that caused a cutoff
          var k = ctx.killers[ply] || (ctx.killers[ply] = [0, 0]);
          var code = moves[i].from * 64 + moves[i].to;
          if (k[0] !== code) { k[1] = k[0]; k[0] = code; }
        }
        return beta;
      }
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  /* returns scored list of root moves (for personality/noise levels) */
  function rootScores(s, depth, ctx, firstMove) {
    var moves = legalMoves(s);
    if (!moves.length) return [];
    orderMoves(s, moves, null, ctx);
    if (firstMove) {
      var idx = -1;
      for (var k = 0; k < moves.length; k++) if (moves[k].from === firstMove.from && moves[k].to === firstMove.to) { idx = k; break; }
      if (idx > 0) { var fm = moves.splice(idx, 1)[0]; moves.unshift(fm); }
    }
    var out = [];
    for (var i = 0; i < moves.length; i++) {
      if (ctx.stop) break;
      var u = makeInPlace(s, moves[i]);
      var sc = -abSearch(s, depth - 1, -MATE * 2, MATE * 2, ctx, 1);
      unmakeInPlace(s, u);
      out.push({ move: moves[i], score: sc });
    }
    return out;
  }

  var LEVELS = {
    0: { name: 'Friendly (brand new)', depth: 1, noise: 320, blunder: 0.35, time: 200, pureRandom: 0.45, forgetMate: 0.6, sloppy: 0.35, kind: 0.4 },
    1: { name: 'Rookie (≈800)', depth: 2, noise: 130, blunder: 0.45, time: 300 },
    2: { name: 'Club Player (≈1100)', depth: 3, noise: 70, blunder: 0.22, time: 700 },
    3: { name: 'District Strong (≈1400)', depth: 4, noise: 30, blunder: 0.07, time: 1200 },
    4: { name: 'BEAST (≈1650)', depth: 5, noise: 0, blunder: 0.01, time: 2200 },
    5: { name: 'NIGHTMARE (≈1900)', depth: 7, noise: 0, blunder: 0, time: 4500 }
  };

  function bestMove(s, opts) {
    opts = opts || {};
    var lvl = LEVELS[opts.level != null ? opts.level : 3] || LEVELS[3];
    var maxDepth = opts.depth || lvl.depth;
    var ctx = { nodes: 0, stop: false, deadline: Date.now() + (opts.timeMs || lvl.time), killers: [] };
    var scored = null, pv = null;
    for (var d = 1; d <= maxDepth; d++) {          // iterative deepening: always keep the last complete result
      var res = rootScores(s, d, ctx, pv);
      if (ctx.stop && scored) break;
      if (!res.length) return null;
      res.sort(function (a, b) { return b.score - a.score; });
      scored = res;
      pv = res[0].move;
      if (Math.abs(res[0].score) > MATE - 1000) break;   // mate found, no need to go deeper
      if (ctx.stop) break;
    }
    if (!scored || !scored.length) return null;

    var noise = opts.noise != null ? opts.noise : lvl.noise;
    var blunder = opts.blunder != null ? opts.blunder : lvl.blunder;

    /* level 0 plays like a real beginner: often just moves something at random */
    if (lvl.pureRandom && Math.random() < lvl.pureRandom) {
      /* NOTE: legalMoves() entries are MOVE objects, not {move: ...} wrappers */
      var all = legalMoves(s);
      var safeMoves = all.filter(function (x) { return !x.captured || Math.random() < 0.35; });   // rarely grabs material
      var pool2 = safeMoves.length ? safeMoves : all;
      return pool2[Math.floor(Math.random() * pool2.length)];
    }
    /* and it is kind: it often declines a free piece (lets the beginner keep learning) */
    if (lvl.kind && scored[0].move.captured && Math.random() < lvl.kind) {
      var nice = scored.filter(function (x) { return !x.move.captured && Math.abs(x.score) < MATE - 1000; });
      if (nice.length) return nice[Math.floor(Math.random() * Math.min(nice.length, 8))].move;
    }

    /* very friendly levels play like a beginner: they sometimes miss a mate or an obvious win */
    if (lvl.forgetMate && Math.abs(scored[0].score) > MATE - 1000 && Math.random() < lvl.forgetMate) {
      var harmless = scored.filter(function (x) { return Math.abs(x.score) < MATE - 1000; });
      if (harmless.length) return harmless[Math.floor(Math.random() * Math.min(harmless.length, 6))].move;
    }
    if (lvl.sloppy && Math.random() < lvl.sloppy) {
      var quiet = scored.filter(function (x) { return !x.move.captured && Math.abs(x.score) < MATE - 1000; });
      if (quiet.length > 2) return quiet[Math.floor(Math.random() * Math.min(quiet.length, 8))].move;
    }

    if (blunder > 0 && Math.random() < blunder && scored.length > 2) {
      // human-style slip: pick a plausible but inferior move
      var pool = scored.slice(1, Math.min(scored.length, 7));
      return pool[Math.floor(Math.random() * pool.length)].move;
    }
    if (noise > 0) {
      var best = scored[0].score;
      var cands = scored.filter(function (x) { return x.score >= best - noise; });
      cands.sort(function (a, b) {
        var wa = (a.score + Math.random() * noise) - (b.score + Math.random() * noise);
        return wa - b;
      });
      return cands[cands.length - 1].move;
    }
    return scored[0].move;
  }

  /* mate solver (n = 1 or 2 or 3) — used to verify/generate puzzles */
  function mateIn(state, n) {
    var s = clone(state);
    function m1(st) { // does side to move have mate in 1?
      var lm = legalMoves(st);
      for (var i = 0; i < lm.length; i++) {
        var u = makeInPlace(st, lm[i]);
        var mate = inCheck(st, st.turn) && legalMoves(st).length === 0;
        unmakeInPlace(st, u);
        if (mate) return lm[i];
      }
      return null;
    }
    function solve(st, k) {
      if (k === 1) { var f = m1(st); return f ? { move: f, replies: [] } : null; }
      var lm = legalMoves(st);
      for (var i = 0; i < lm.length; i++) {
        var u = makeInPlace(st, lm[i]);
        var opp = legalMoves(st);
        var allBad = true, child = null;
        if (opp.length === 0) { allBad = false; }
        for (var j = 0; j < opp.length; j++) {
          var u2 = makeInPlace(st, opp[j]);
          var r = solve(st, k - 1);
          unmakeInPlace(st, u2);
          if (!r) { allBad = false; break; }
          if (!child) child = r;
        }
        unmakeInPlace(st, u);
        if (allBad && opp.length > 0) return { move: lm[i], replies: opp, child: child };
      }
      return null;
    }
    return solve(s, n);
  }

  function perft(state, depth) {
    if (depth === 0) return 1;
    var s = clone(state);
    var moves = legalMoves(s), total = 0;
    for (var i = 0; i < moves.length; i++) {
      var u = makeInPlace(s, moves[i]);
      total += perft(s, depth - 1);
      unmakeInPlace(s, u);
    }
    return total;
  }

  /* material count helper for UI */
  function material(s) {
    var m = { w: 0, b: 0 };
    for (var i = 0; i < 64; i++) { var p = s.board[i]; if (p) m[p[0]] += VAL[p[1]]; }
    return m;
  }

  function allMoves(s) { return legalMoves(s); }

  var API = {
    START_FEN: START_FEN, MATE: MATE, VAL: VAL, LEVELS: LEVELS,
    sqName: sqName, nameToSq: nameToSq, other: other,
    parseFEN: parseFEN, toFEN: toFEN, positionKey: positionKey, clone: clone,
    attacked: attacked, inCheck: inCheck, findKing: findKing,
    genPseudo: genPseudo, legalMoves: legalMoves, allMoves: allMoves,
    makeMove: makeMove, makeInPlace: makeInPlace, unmakeInPlace: unmakeInPlace,
    toSAN: toSAN, fromSAN: fromSAN, moveToUci: moveToUci, uciToMove: uciToMove,
    status: status, insufficientMaterial: insufficientMaterial,
    evaluate: evaluate, bestMove: bestMove, rootScores: rootScores,
    mateIn: mateIn, perft: perft, material: material, scoreMove: scoreMove
  };
  root.BEAST = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
