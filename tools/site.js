/**
 * tools/site.js — prepares the GitHub Pages build (repo root is the site root).
 *
 *   index.html  = landing page (generated from site-src/index.html)
 *   play.html   = the playable dashboard (byte-for-byte copy of beast-chess.html)
 *   og.png      = social preview image
 *   .nojekyll   = stop GitHub's Jekyll from hijacking the site with the README
 *
 * The dashboard itself stays ONE self-contained file, so nothing here can
 * break the offline promise: play.html === beast-chess.html.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const app = fs.readFileSync(path.join(ROOT, 'beast-chess.html'), 'utf8');
fs.writeFileSync(path.join(ROOT, 'play.html'), app);
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

const ico = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230b0f16'/%3E%3Cg fill='none' stroke='%23ffc400' stroke-width='2.1' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='16' cy='10' r='3.1'/%3E%3Cpath d='M14.1 13.1c-.6 2.4-1.8 4.2-2.8 5.9h9.4c-1-1.7-2.2-3.5-2.8-5.9'/%3E%3Cpath d='M10 25.5h12'/%3E%3Cpath d='M11.6 19 9.8 25.5M20.4 19l1.8 6.5'/%3E%3C/g%3E%3C/svg%3E";
const SITE = 'https://codedbytahir.github.io/beast-chess/';
let landing = fs.readFileSync(path.join(ROOT, 'site-src', 'index.html'), 'utf8');
landing = landing.replace(/__FAVICON__/g, ico).replace(/__OG__/g, SITE + 'og.png').replace(/__SITE__/g, SITE);
fs.writeFileSync(path.join(ROOT, 'index.html'), landing);

['site', 'site-src/README.md'].forEach(function (p) {
  const full = path.join(ROOT, p);
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) fs.rmSync(full, { recursive: true, force: true });
});
console.log('site ready: index.html (landing) + play.html (' + Math.round(app.length / 1024) + ' KB) + og.png + .nojekyll');
