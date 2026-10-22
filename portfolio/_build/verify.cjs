// Self-contained verification for the rebuilt Shisha King portfolio (certify.js command).
// Exit 0 = all checks pass; exit 1 = any named check fails.
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const file = path.join(dir, '..', 'shisha-king-business-portfolio.html');
const html = fs.readFileSync(file, 'utf8');
let failed = 0;
const check = (name, ok, detail = '') => {
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' — ' + detail : ''));
  if (!ok) failed++;
};

check('file exists, sane size', html.length > 500 * 1024, (html.length / 1024).toFixed(0) + ' KB');
check('no unreplaced build tokens', !/__FONTS__|__LOGO180__|__HERO__|__ESSENCE__/.test(html));
check('fonts embedded (2 woff2 payloads)', (html.match(/data:font\/woff2;base64,/g) || []).length >= 2);
check('photos embedded (2 jpeg + 1 png)',
  (html.match(/data:image\/jpeg;base64,/g) || []).length >= 2 &&
  (html.match(/data:image\/png;base64,/g) || []).length >= 1);
const ext = [...new Set([...html.matchAll(/https?:\/\/[^"')\s<>]+/g)].map(m => m[0].replace(/\/index\.html$/, '/')))];
check('zero external resource refs (only live-site link allowed)',
  ext.every(u => u.startsWith('https://shisha-king.vercel.app/')) && ext.length > 0, JSON.stringify(ext));
check('E3 packaging credit present (hero + footer)', html.includes('Packaged by E³') && (html.match(/Packaged by E³/g) || []).length >= 2);
check('business-idea tone copy present',
  html.includes('A business idea') && html.includes("Why it's a good idea") && html.includes('ready to be explored'));
check('no investor/investment language', !(html.match(/investor|investment/i) || []).length);
check('live-site link intact', html.includes('https://shisha-king.vercel.app/index.html'));
check('pulse CTA intact', html.includes('View the Webpage'));

// rendered previews
const previews = [];
for (let i = 1; i <= 8; i++) previews.push(`slice-d${i}.png`);
for (let i = 1; i <= 7; i++) previews.push(`slice-m${i}.png`);
let pv = 0;
for (const p of previews) {
  const b = fs.readFileSync(path.join(dir, p));
  const magic = b.slice(1, 4).toString('ascii') === 'PNG' ? b.slice(0, 8).toString('hex') === '89504e470d0a1a0a' : false;
  if (b.length > 30 * 1024 && magic) pv++;
}
check('15 rendered preview slices valid PNGs >30KB', pv === 15, pv + '/15');

console.log(failed ? 'VERDICT: FAIL (' + failed + ' checks failed)' : 'VERDICT: PASS (all checks)');
process.exit(failed ? 1 : 0);
