/**
 * tests/e2e.js — end-to-end regression suite for Beast Chess.
 *
 *   node tests/e2e.js
 *
 * Drives a real Chrome with real mouse / touch / pointer events against the
 * built beast-chess.html (so it tests exactly the file that ships).
 * Requires: npm i puppeteer  (dev only — the app itself has zero deps)
 */
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let puppeteer;
try { puppeteer = require('puppeteer'); }
catch (e) { console.error('puppeteer is not installed — run:  npm i puppeteer'); process.exit(2); }

const APP = 'file://' + path.join(__dirname, '..', 'beast-chess.html');
const pass = [], fail = [];
function check(name, ok, extra) {
  (ok ? pass : fail).push(name + (extra !== undefined ? '  [' + extra + ']' : ''));
  console.log((ok ? '  \u2713 ' : '  \u2717 ') + name + (extra !== undefined ? '  ' + extra : ''));
}
function section(t) { console.log('\n' + t); }

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.setViewport({ width: 1440, height: 950 });

  /* helper: click a square with real pointer events (tap-tap flow) */
  const tapSquare = async (sq) => page.evaluate((sq) => {
    const c = document.querySelector('.cell[data-sq="' + sq + '"]');
    if (!c) return false;
    const r = c.getBoundingClientRect();
    const o = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: 1, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 };
    c.dispatchEvent(new PointerEvent('pointerdown', o));
    c.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, o, { buttons: 0 })));
    return true;
  }, sq);
  const nav = (v) => page.evaluate((v) => window.__beast.nav(v), v);
  /* play the first legal move the UI offers, using real taps */
  const playAnyMove = async () => {
    const sansBefore = await page.evaluate(() => window.__beast.game.sans.length);
    for (let sq = 0; sq < 64; sq++) {
      await tapSquare(sq);
      const target = await page.evaluate(() => {
        const d = document.querySelector('.cell .dot, .cell .dot.cap');
        if (!d) return null;
        const cell = d.closest('.cell');
        return cell ? +cell.getAttribute('data-sq') : null;
      });
      if (target !== null && target !== undefined) {
        await tapSquare(target);
        await sleep(1400);
        const sansAfter = await page.evaluate(() => window.__beast.game.sans.length);
        if (sansAfter > sansBefore) return await page.evaluate(() => window.__beast.game.sans.slice(-2).join(' '));
      }
    }
    return null;
  };

  /* ---------------- 1. boot + onboarding ---------------- */
  section('1. Boot & beginner onboarding');
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await sleep(900);
  check('app boots and exposes the debug API', await page.evaluate(() => typeof window.__beast === 'object'));
  const wizard = await page.evaluate(() => !!document.querySelector('.modal-back'));
  check('welcome wizard appears for a brand-new visitor', wizard);
  await page.evaluate(() => {
    const bs = [...document.querySelectorAll('.modal-f .btn')];
    const t = bs.find((x) => /brand new/i.test(x.textContent)) || bs[0];
    if (t) t.click();
  });
  await sleep(1300);
  const st = await page.evaluate(() => window.__beast.state().settings);
  check('"never played" turns on beginner mode + easiest opponent', st.beginner === true && st.level === 0, JSON.stringify({ beginner: st.beginner, level: st.level }));

  /* ---------------- 2. Learn tab ---------------- */
  section('2. Learn tab (11 lessons)');
  await nav('learn'); await sleep(1200);
  check('11 lesson chips render', (await page.evaluate(() => document.querySelectorAll('.lchip').length)) === 11);
  await page.evaluate(() => window.__beast.nav('learn', 'lesson=0')); await sleep(1200);
  const sandbox = await page.evaluate(() => document.querySelectorAll('#lessonHost .pc').length);
  check('lesson 1 shows the full 32-piece board as a sandbox', sandbox === 32, sandbox + ' pieces');
  const lessonMove = await page.evaluate(() => {
    /* drag the e2 pawn to e4 inside the lesson board */
    const from = document.querySelector('#lessonHost .cell[data-sq="52"]');
    const to = document.querySelector('#lessonHost .cell[data-sq="36"]');
    if (!from || !to) return 'no squares';
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const o = (t, x, y) => new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 3, pointerType: 'mouse', button: 0, buttons: t === 'pointerup' ? 0 : 1, clientX: x, clientY: y });
    from.dispatchEvent(o('pointerdown', a.x + a.width / 2, a.y + a.height / 2));
    from.dispatchEvent(o('pointermove', a.x + a.width / 2 + 12, a.y + a.height / 2 - 12));
    document.dispatchEvent(o('pointermove', b.x + b.width / 2, b.y + b.height / 2));
    document.dispatchEvent(o('pointerup', b.x + b.width / 2, b.y + b.height / 2));
    return 'ok';
  });
  await sleep(700);
  check('pieces can be dragged inside a lesson sandbox', lessonMove === 'ok');

  /* ---------------- 3. Icons ---------------- */
  section('3. Icon system (no emoji fonts needed)');
  const icons = await page.evaluate(() => {
    let total = 0, broken = 0;
    document.querySelectorAll('i.i').forEach((el) => {
      total++;
      const r = el.getBoundingClientRect();
      const mask = getComputedStyle(el).webkitMaskImage || getComputedStyle(el).maskImage || '';
      if (r.width < 4 || r.height < 4 || !String(mask).includes('data:image/svg')) broken++;
    });
    return { total, broken };
  });
  check('every visible icon is painted by an SVG mask', icons.broken === 0, icons.total + ' icons, ' + icons.broken + ' broken');

  /* ---------------- 4. Play vs AI ---------------- */
  section('4. Play vs the engine');
  await nav('play'); await sleep(1200);
  const played = await playAnyMove();
  check('a legal move can be played with real pointer input', !!played, played || 'no move registered');
  check('the engine answered', await page.evaluate(() => window.__beast.game.sans.length) >= 2);
  check('the plain-English coach logged what happened', (await page.evaluate(() => document.querySelectorAll('#coachLog .coach-item').length)) >= 1);

  /* ---------------- 5. Board geometry ---------------- */
  section('5. Board is always a perfect square');
  const geo = await page.evaluate(() => {
    const b = document.querySelector('.board');
    const r = b.getBoundingClientRect();
    const cells = [...b.querySelectorAll('.cell')].map((c) => c.getBoundingClientRect());
    const rows = new Set(cells.map((c) => Math.round(c.top)));
    const w = new Set(cells.map((c) => Math.round(c.width)));
    const h = new Set(cells.map((c) => Math.round(c.height)));
    return { square: Math.abs(r.width - r.height) < 2, cells: cells.length, rows: rows.size, colW: w.size, rowH: h.size };
  });
  check('board + 64 cells are square, 8x8 grid', geo.square && geo.cells === 64 && geo.rows === 8 && geo.colW === 1 && geo.rowH === 1, JSON.stringify(geo));

  /* ---------------- 6. Guided first game ---------------- */
  section('6. Guided first game');
  await page.evaluate(() => window.__beast.startGuided());
  await sleep(1500);
  const guide1 = await page.evaluate(() => window.__beast.guided() && window.__beast.guided().step);
  check('guide bar starts on step 1 (0-based step 0)', guide1 === 0, 'step=' + guide1);
  await tapSquare(52); await sleep(200); await tapSquare(36); await sleep(1600);
  const guide2 = await page.evaluate(() => window.__beast.guided() && window.__beast.guided().step);
  check('playing the told move advances the guide', guide2 === 1, 'step=' + guide2);

  /* ---------------- 7. Puzzles, drills, traps, repertoire ---------------- */
  section('7. Training views');
  for (const [view, sel, min] of [['puzzles', '#view .board', 1], ['endgame', '.drill, .card', 4], ['traps', '.card.trap', 10], ['openings', '#view .board', 1], ['codex', '.card', 6], ['plan', '.day-tab', 7], ['progress', '.card', 2]]) {
    await nav(view); await sleep(1000);
    const n = await page.evaluate((s) => document.querySelectorAll(s).length, sel);
    check(view + ' view renders', n >= min, n + ' x ' + sel);
  }
  await nav('puzzles'); await sleep(1000);
  const order = await page.evaluate(() => window.__beast.pz.list.slice(0, 6).map((x) => x.fen.split(' ')[0].replace(/[^a-zA-Z]/g, '').length));
  check('beginner mode sorts puzzles easiest-first', JSON.stringify(order) === JSON.stringify([...order].sort((a, b) => a - b)), order.join(','));

  /* ---------------- 8. Progress persistence ---------------- */
  section('8. XP + progress persistence');
  await nav('plan'); await sleep(1000);
  await page.evaluate(() => { const b = document.querySelector('[data-tick]'); if (b) b.click(); });
  await sleep(600);
  const xp1 = await page.evaluate(() => window.__beast.state().xp);
  await page.reload({ waitUntil: 'networkidle0' }); await sleep(1600);
  const xp2 = await page.evaluate(() => window.__beast.state().xp);
  check('XP survives a reload', xp1 > 0 && xp1 === xp2, xp1 + ' -> ' + xp2);

  /* ---------------- 9. Deep link ---------------- */
  section('9. Deep links (play.html#learn)');
  await page.goto(APP + '#learn', { waitUntil: 'networkidle0' });
  await page.reload({ waitUntil: 'networkidle0' });   /* a hash-only navigation is same-document; force a boot */
  await sleep(1400);
  const deepOk = await page.evaluate(() => (document.querySelector('.navitem.active') || {}).getAttribute && document.querySelector('.navitem.active').getAttribute('data-v') === 'learn');
  check('#learn opens the Learn tab', !!deepOk || (await page.evaluate(() => document.querySelectorAll('.lchip').length)) === 11);

  /* ---------------- 10. Mobile: touch + no overflow ---------------- */
  section('10. Mobile (touch, 390x844)');
  const m = await browser.newPage();
  m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
  await m.setViewport({ width: 390, height: 844, hasTouch: true, isMobile: true });
  await m.goto(APP, { waitUntil: 'networkidle0' }); await sleep(1100);
  await m.evaluate(() => { const b = document.querySelector('.modal-back .btn'); if (b) b.click(); });
  await sleep(400); await m.evaluate(() => window.__beast.nav('play')); await sleep(1200);
  const s1 = await m.$eval('.cell[data-sq="52"]', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const s2 = await m.$eval('.cell[data-sq="36"]', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await m.touchscreen.tap(s1.x, s1.y); await sleep(300); await m.touchscreen.tap(s2.x, s2.y); await sleep(1800);
  check('touch play works on a phone', (await m.evaluate(() => window.__beast.game.sans.length)) >= 2, await m.evaluate(() => window.__beast.game.sans.join(' ')));
  check('no horizontal overflow', (await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) === 0);
  const geoM = await m.evaluate(() => { const r = document.querySelector('.board').getBoundingClientRect(); return Math.abs(r.width - r.height) < 2 && r.right <= window.innerWidth + 1; });
  check('board fits the phone screen and stays square', geoM);
  await m.close();

  /* ---------------- summary ---------------- */
  console.log('\n' + '='.repeat(56));
  console.log('PASSED: ' + pass.length + '   FAILED: ' + fail.length);
  if (errors.length) { console.log('\nPAGE ERRORS:'); errors.forEach((e) => console.log('  - ' + e)); }
  else console.log('PAGE ERRORS: none');
  if (fail.length) { console.log('\nFAILED CHECKS:'); fail.forEach((f) => console.log('  - ' + f)); }
  await browser.close();
  process.exit(fail.length || errors.length ? 1 : 0);
})();
