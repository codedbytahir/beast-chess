/* BEAST CHESS — BOARD COMPONENT (SVG pieces, zero dependencies) */
(function (root) {
  'use strict';
  var FILES = 'abcdefgh';

  /* ---------- piece art: 45x45 viewbox, geometric & crisp ---------- */
  var ART = {
    p: '<circle cx="22.5" cy="13.5" r="5.6"/><path d="M22.5 19c-3.2 3.6-5.4 8-6.2 12.6h12.4C28 27 25.7 22.6 22.5 19z"/><path d="M12.5 31.6h20c1 0 1.6 1.5 1.6 3.1 0 1.6-.8 2.7-2.2 2.7H13.1c-1.4 0-2.2-1.1-2.2-2.7 0-1.6.6-3.1 1.6-3.1z"/>',
    r: '<path d="M11.5 36.5h22v-4.2h-22z"/><path d="M14 32.3h17V17.6H14z"/><path d="M11.5 9.2h5.2v3.6h4.1V9.2h5.4v3.6h4.1V9.2h5.2v8.4h-24z"/>',
    n: '<path d="M24.6 9.4c-2.4-2.6-5.6-2.4-8 .2-1.6 1.7-2 3.6-2.1 5.4-.1 1.4-.9 2.3-2.4 3.4-2.8 2-4.6 4.6-4.6 7.6 0 1.9 1.1 3 2.7 3 1.2 0 2.1-.6 2.9-1.8l2.3-3.4c1 .9 1.7 2 1.7 3.3v5.4h13.4c0-6.6-1.2-11.6-3.3-15-1.5-2.4-2.3-4.6-2.6-8.1z"/><circle cx="18.4" cy="15.5" r="1.15" class="eye"/>',
    b: '<rect x="21" y="4.6" width="3" height="6.4" rx="1"/><rect x="19.3" y="6.3" width="6.4" height="3" rx="1"/><path d="M22.5 11.4c3.1 1.7 5.1 4.7 5.1 8 0 3.2-1.9 6-4.5 7.4h-1.2c-2.6-1.4-4.5-4.2-4.5-7.4 0-3.3 2-6.3 5.1-8z"/><path d="M13.4 29.5h18.2v3.4H13.4zM11 35.3h23v4.2H11z"/>',
    q: '<circle cx="9.6" cy="13.2" r="2.3"/><circle cx="16" cy="9.4" r="2.3"/><circle cx="22.5" cy="7.6" r="2.6"/><circle cx="29" cy="9.4" r="2.3"/><circle cx="35.4" cy="13.2" r="2.3"/><path d="M9.6 15.4L12.9 30h19.2l3.3-14.6-6 5.4-3.9-8.3-3 8.3-3-8.3-3.9 8.3z"/><path d="M12.4 30h20.2v3.6H12.4z"/><path d="M10.4 33.6h24.2v4.6H10.4z"/>',
    k: '<rect x="21.2" y="3.4" width="2.6" height="8"/><rect x="18.5" y="5.9" width="8" height="2.6"/><path d="M22.5 11.6c4.6 0 8.6 3.4 8.6 8.2 0 3.4-1.9 6-4.3 7.6h-8.6c-2.4-1.6-4.3-4.2-4.3-7.6 0-4.8 4-8.2 8.6-8.2z"/><path d="M14.4 27.6c4.4 1.7 12 1.7 16.2 0v3.2H14.4z"/><path d="M11.6 31h21.8v4H11.6z"/><path d="M9.6 35h25.8v4.6H9.6z"/>'
  };

  function pieceSVG(p) {
    var color = p[0], t = p[1];
    var isW = color === 'w';
    var fill = isW ? '#f7f5f0' : '#22252c';
    var stroke = isW ? '#22252c' : '#0a0c10';
    return '<svg viewBox="0 0 45 45" preserveAspectRatio="xMidYMid meet" class="pc pc-' + (isW ? 'w' : 'b') + '"><g fill="' + fill +
      '" stroke="' + stroke + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">' +
      ART[t] + '</g></svg>';
  }

  /* ---------- board ---------- */
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function createBoard(container, opts) {
    opts = opts || {};
    var orient = opts.orientation || 'w';
    var api = {
      orientation: orient,
      state: null,
      selected: null,
      targets: [],
      lastMove: null,
      arrows: [],
      checkSquare: null,
      onSquare: opts.onSquare || function () {},
      showCoords: opts.showCoords !== false,
      showHints: true,
      dragColor: null,
      interactive: opts.interactive !== false,
      freeDrag: !!opts.freeDrag,
      hints: [],
      flipped: orient === 'b'
    };

    var wrap = el('<div class="board-wrap"><div class="board"></div><svg class="arrows" viewBox="0 0 800 800" preserveAspectRatio="none"></svg>' +
      '<div class="stamp-layer" hidden><div class="stamp"><b></b><span></span></div></div><div class="promo-layer" hidden></div></div>');
    var boardEl = wrap.querySelector('.board');
    var stampLayer = wrap.querySelector('.stamp-layer');
    var stampEl = wrap.querySelector('.stamp');
    var svg = wrap.querySelector('.arrows');
    var promoLayer = wrap.querySelector('.promo-layer');
    container.innerHTML = '';
    container.appendChild(wrap);

    /* ------------------------------------------------------------------
       LAYOUT — the board is always an exact square, sized in pixels by JS.
       (Pure-CSS aspect-ratio breaks in some browsers/embeds: the board
       would collapse or stretch. Pixel sizing is bulletproof.)
       ------------------------------------------------------------------ */
    var MIN_SIDE = 260, MAX_SIDE = 700;
    function measure() {
      var host = container;
      var docW = (document.documentElement && document.documentElement.clientWidth) || window.innerWidth || 360;
      var hostW = host.clientWidth || 0;
      if (!hostW) hostW = wrap.clientWidth || 0;
      /* never exceed the visible page width, whatever the parent layout does */
      var availW = Math.min(Math.max(hostW, 220), docW - 16);
      var pad = 0;
      // toolbar/margins we should leave visible under the board
      var vh = window.innerHeight || document.documentElement.clientHeight || 800;
      var maxH = Math.max(MIN_SIDE, vh - 205);
      var mode = host.getAttribute ? (host.getAttribute('data-bsize') || 'auto') : 'auto';
      var side;
      if (mode === 'large') side = Math.min(availW - pad, MAX_SIDE);
      else if (mode === 'small') side = Math.min(availW - pad, maxH, 420);
      else side = Math.min(availW - pad, maxH, MAX_SIDE);
      return Math.max(MIN_SIDE, Math.round(side));
    }
    function layout() {
      var side = measure();
      wrap.style.width = side + 'px';
      wrap.style.height = side + 'px';
      boardEl.style.width = side + 'px';
      boardEl.style.height = side + 'px';
      if (stampLayer && !stampLayer.hidden) api.setStamp(stampEl.querySelector('b').textContent, stampEl.querySelector('span').textContent, (stampLayer.className.match(/k-(\w+)/) || [])[1]);
      renderArrows();
    }
    api.relayout = function () { layout(); };
    api.setSizeMode = function (mode) { try { container.setAttribute('data-bsize', mode || 'auto'); } catch (e) { } layout(); };
    function watchSize() {
      try {
        if (window.ResizeObserver) {
          if (api._ro) api._ro.disconnect();
          api._ro = new ResizeObserver(function () { layout(); });
          api._ro.observe(container);
        }
      } catch (e) { }
    }

    function squareOrder() {
      var out = [];
      for (var i = 0; i < 64; i++) out.push(api.flipped ? (63 - i) : i);
      return out;
    }
    function xyOf(sq) {
      var r = sq >> 3, f = sq & 7;
      var col = api.flipped ? 7 - f : f;
      var row = api.flipped ? r : 7 - r;
      return { col: col, row: row };
    }
    function nameOf(sq) { return FILES[sq & 7] + (8 - (sq >> 3)); }

    function render() {
      var st = api.state;
      var html = '';
      var order = squareOrder();
      for (var i = 0; i < 64; i++) {
        var sq = order[i];
        var r = sq >> 3, f = sq & 7;
        var light = (r + f) % 2 === 0;
        var cls = 'cell ' + (light ? 'lt' : 'dk');
        var marks = '';
        if (api.lastMove && (api.lastMove.from === sq || api.lastMove.to === sq)) cls += ' lastmove';
        if (api.selected === sq) cls += ' sel';
        if (api.targets.indexOf(sq) >= 0) marks += '<span class="dot' + (st && st.board[sq] ? ' cap' : '') + '"></span>';
        if (api.checkSquare === sq) cls += ' incheck';
        if (api.kingMark && api.kingMark.sq === sq) cls += ' ' + (api.kingMark.kind === 'mated' ? 'mated' : 'checked');
        if (api.hints && api.hints.indexOf(sq) >= 0) cls += ' hintable';
        var piece = st && st.board[sq] ? pieceSVG(st.board[sq]) : '';
        var coords = '';
        if (api.showCoords) {
          var rr = xyOf(sq);
          if (rr.row === 7) coords += '<span class="cf">' + FILES[f] + '</span>';
          if (rr.col === 0) coords += '<span class="cr">' + (8 - r) + '</span>';
        }
        html += '<div class="' + cls + '" data-sq="' + sq + '">' + piece + coords + marks + '</div>';
      }
      boardEl.innerHTML = html;
      /* never leave a floating "ghost" piece behind after a re-render */
      Array.prototype.forEach.call(document.querySelectorAll('.drag-ghost'), function (g) { g.remove(); });
      drag = null;
      layout();
    }

    function renderArrows() {
      var w = boardEl.clientWidth || parseInt(boardEl.style.width, 10) || 560, s = w / 8;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + w);
      var out = '';
      (api.arrows || []).forEach(function (a) {
        var from = a.from, to = a.to;
        var c1 = xyOf(from), c2 = xyOf(to);
        var x1 = c1.col * s + s / 2, y1 = c1.row * s + s / 2;
        var x2 = c2.col * s + s / 2, y2 = c2.row * s + s / 2;
        var ang = Math.atan2(y2 - y1, x2 - x1);
        var len = Math.hypot(x2 - x1, y2 - y1);
        var shorten = s * 0.42;
        var ex = x1 + Math.cos(ang) * (len - shorten), ey = y1 + Math.sin(ang) * (len - shorten);
        var color = a.color || 'rgba(255,190,60,.85)';
        out += '<defs><marker id="ah' + from + to + '" markerWidth="3.4" markerHeight="3.4" refX="2.1" refY="1.7" orient="auto"><path d="M0,0 L3.4,1.7 L0,3.4 z" fill="' + color + '"/></marker></defs>';
        out += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + ex + '" y2="' + ey + '" stroke="' + color + '" stroke-width="' + (s * 0.13) + '" stroke-linecap="round" marker-end="url(#ah' + from + to + ')"/>';
      });
      svg.innerHTML = out;
    }

    /* ---------- input: tap-to-move AND drag-and-drop (pointer events = works on touch + mouse) ---------- */
    var drag = null;

    function clearGhost() {
      Array.prototype.forEach.call(document.querySelectorAll('.drag-ghost'), function (g) { g.remove(); });
      Array.prototype.forEach.call(document.querySelectorAll('.cell.dragging'), function (c) { c.classList.remove('dragging'); });
    }

    function sqAt(x, y) {
      var el = document.elementFromPoint(x, y);
      var cell = el && el.closest ? el.closest('.cell') : null;
      return cell ? parseInt(cell.getAttribute('data-sq'), 10) : null;
    }

    boardEl.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      var cell = e.target.closest ? e.target.closest('.cell') : null;
      if (!cell) return;
      var sq = parseInt(cell.getAttribute('data-sq'), 10);
      var st = api.state;
      if (!st) return;
      var turnColor = api.dragColor || st.turn;
      var p = st.board[sq];
      var ownPiece = !!(p && (api.freeDrag || p[0] === turnColor)) && api.interactive !== false;
      if (ownPiece) e.preventDefault();          // no scrolling / text selection while handling a piece
      api.onSquare(sq);                          // selects, or completes a move (tap-tap flow)
      if (!ownPiece) return;
      drag = { sq: sq, x: e.clientX, y: e.clientY, moved: false, cell: cell, id: e.pointerId };
      try { boardEl.setPointerCapture(e.pointerId); } catch (err) { }
      window.addEventListener('pointermove', onWinMove, true);
      window.addEventListener('pointerup', onWinUp, true);
      window.addEventListener('pointercancel', onWinCancel, true);
    });

    function onWinMove(e) { boardMove(e); }
    function onWinUp(e) { endDrag(e, false); }
    function onWinCancel(e) { endDrag(e, true); }

    function boardMove(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 7) return;      // small movement = still a tap
        drag.moved = true;
        var pc = drag.cell.querySelector('.pc');
        if (pc) {
          var g = pc.cloneNode(true);
          g.setAttribute('class', 'drag-ghost');
          document.body.appendChild(g);
          drag.ghost = g;
          drag.cell.classList.add('dragging');
        }
      }
      if (drag.ghost) { drag.ghost.style.left = e.clientX + 'px'; drag.ghost.style.top = e.clientY + 'px'; }
      if (e.cancelable) e.preventDefault();
    }

    boardEl.addEventListener('pointermove', function (e) { if (e.pointerId && !drag) return; boardMove(e); });

    function endDrag(e, cancelled) {
      window.removeEventListener('pointermove', onWinMove, true);
      window.removeEventListener('pointerup', onWinUp, true);
      window.removeEventListener('pointercancel', onWinCancel, true);
      if (!drag) return;
      var d = drag; drag = null;
      clearGhost();
      try { boardEl.releasePointerCapture(d.id); } catch (err) { }
      if (cancelled || !d.moved || !e) return;   // a tap: selection already happened on pointerdown
      var to = sqAt(e.clientX, e.clientY);
      if (to != null && to !== d.sq) api.onSquare(to);
      else if (to === d.sq) api.onSquare(d.sq);
    }
    boardEl.addEventListener('pointerup', function (e) { endDrag(e, false); });
    boardEl.addEventListener('pointercancel', function (e) { endDrag(e, true); });
    boardEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    window.addEventListener('resize', function () { layout(); });
    window.addEventListener('orientationchange', function () { setTimeout(layout, 120); });
    watchSize();
    requestAnimationFrame(function () { layout(); requestAnimationFrame(layout); });

    api.render = render;
    api.set = function (o) {
      if (o.state) api.state = o.state;
      if ('selected' in o) api.selected = o.selected;
      if ('targets' in o) api.targets = o.targets || [];
      if ('lastMove' in o) api.lastMove = o.lastMove;
      if ('arrows' in o) api.arrows = o.arrows || [];
      if ('checkSquare' in o) api.checkSquare = o.checkSquare;
      if ('hints' in o) api.hints = o.hints || [];
      render();
    };
    api.flip = function (o) { api.flipped = (o || (api.flipped ? 'w' : 'b')) === 'b'; render(); };
    api.name = nameOf;
    api.element = wrap;
    /* ------------------------------------------------------------------
       STAMP — a big readable sign across the board: "CHECKMATE",
       "CHECK!", "DRAW", "DRILL COMPLETE". Beginners need to SEE that the
       game ended, not read it in a status line.
       ------------------------------------------------------------------ */
    api.setStamp = function (text, sub, kind) {
      if (!stampLayer) return;
      if (!text) { api.clearStamp(); return; }
      if (stampTimer) { clearTimeout(stampTimer); stampTimer = null; }
      stampAt = Date.now(); api.lastStampKind = kind || '';
      stampLayer.hidden = false;
      stampLayer.className = 'stamp-layer' + (kind ? ' k-' + kind : '');
      var bEl = stampEl.querySelector('b'), sEl = stampEl.querySelector('span');
      bEl.textContent = text;
      sEl.textContent = sub || '';
      sEl.style.display = sub ? '' : 'none';
      /* size the sign to the text so it always fits inside the board:
         start big, then shrink until it genuinely measures small enough
         (the board clips at its own edge, so overflow would cut the word off) */
      var side = boardEl.clientWidth || 400;
      var limit = side * 0.86;
      sEl.style.maxWidth = Math.round(side * 0.72) + 'px';
      bEl.style.fontSize = Math.round(side * 0.16) + 'px';
      sEl.style.fontSize = Math.round(side * 0.055) + 'px';
      var guard = 0;
      while (stampEl.scrollWidth > limit && guard++ < 60) {
        var fs = parseFloat(bEl.style.fontSize) - 1;
        if (fs < 10) break;
        bEl.style.fontSize = fs + 'px';
        sEl.style.fontSize = Math.max(9, fs * 0.36) + 'px';
      }
      /* Only animate when the sign actually CHANGES. The board repaints often
         (every render, toast, undo…), and re-triggering the pop each time would
         leave the sign caught mid-fade — i.e. looking see-through. */
      var key = kind + '|' + text;
      if (api._stampKey !== key) {
        api._stampKey = key;
        stampEl.classList.remove('pop'); void stampEl.offsetWidth; stampEl.classList.add('pop');
      }
    };
    /* A CHECK sign should stay readable even though the opponent answers in a
       fraction of a second, so clearing is delayed to a minimum display time. */
    var stampAt = 0, stampTimer = null, MIN_SHOW = 1700;
    api.clearStamp = function () {
      if (!stampLayer) return;
      var left = MIN_SHOW - (Date.now() - stampAt);
      if (stampTimer) { clearTimeout(stampTimer); stampTimer = null; }
      var hide = function () { stampLayer.hidden = true; stampEl.querySelector('b').textContent = ''; stampTimer = null; };
      if (left > 0 && !stampLayer.hidden && api.lastStampKind === 'check') stampTimer = setTimeout(hide, left);
      else hide();
    };
    api.markKing = function (sq, kind) { api.kingMark = (sq == null) ? null : { sq: sq, kind: kind || 'checked' }; };
    api.destroy = function () { try { if (api._ro) api._ro.disconnect(); } catch (e) { } clearGhost(); };
    api.promoPrompt = function (color, cb) {
      var html = '<div class="promo-box"><div class="promo-title">Promote to:</div><div class="promo-row">';
      ['q', 'r', 'b', 'n'].forEach(function (t) {
        html += '<button class="promo-btn" data-p="' + t + '">' + pieceSVG(color + t) + '</button>';
      });
      html += '</div></div>';
      promoLayer.innerHTML = html;
      promoLayer.hidden = false;
      promoLayer.querySelectorAll('.promo-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          promoLayer.hidden = true;
          cb(b.getAttribute('data-p'));
        });
      });
    };
    render();
    return api;
  }

  root.BeastBoard = { create: createBoard, pieceSVG: pieceSVG, el: el };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.BeastBoard;
})(typeof window !== 'undefined' ? window : globalThis);
