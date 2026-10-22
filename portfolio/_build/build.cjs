// Build the self-contained Shisha King portfolio HTML:
// embed Google Fonts (latin woff2, base64) + local images (base64) into skeleton.html
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const CSS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;700&family=Manrope:wght@400;700;800&display=swap';

async function main() {
  // 1. Fetch the CSS and keep only the latin @font-face blocks
  const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();
  const blocks = css.split(/\/\*\s*(.+?)\s*\*\//).map((part, i, arr) => ({ subset: arr[i - 1] || null, body: part })).filter(b => b.subset && b.subset === 'latin' && b.body.includes('@font-face'));
  if (blocks.length === 0) throw new Error('no latin font-face blocks found');

  const urls = [...new Set([...blocks.flatMap(b => b.body)].join('').matchAll(/url\((https:[^)]+)\)/g).map(m => m[1]))];
  const cache = new Map();
  for (const u of urls) {
    const buf = Buffer.from(await (await fetch(u)).arrayBuffer());
    cache.set(u, 'data:font/woff2;base64,' + buf.toString('base64'));
    console.log('font', u.split('/').pop(), buf.length, 'bytes');
  }

  let fontsCss = blocks.map(b => {
    const out = b.body.replace(/url\((https:[^)]+)\)/g, (m, u) => 'url(' + cache.get(u) + ')');
    // minify a bit
    return out.replace(/\s{2,}/g, ' ');
  }).join('');

  // 2. Images -> base64 data URIs
  const dataUri = (f, mime) => 'data:' + mime + ';base64,' + fs.readFileSync(path.join(dir, '..', '..', f)).toString('base64');
  const assets = {
    '__LOGO180__': dataUri('logo-180.png', 'image/png'),
    '__HERO__': dataUri('hero-shisha.jpg', 'image/jpeg'),
    '__ESSENCE__': dataUri('essence.jpg', 'image/jpeg'),
  };

  // 3. Assemble
  let html = fs.readFileSync(path.join(dir, 'skeleton.html'), 'utf8').replace('__FONTS__', fontsCss);
  for (const [tok, val] of Object.entries(assets)) html = html.split(tok).join(val);

  if (/__FONTS__|__LOGO180__|__HERO__|__ESSENCE__/.test(html)) throw new Error('unreplaced token remains');
  const out = path.join(dir, '..', 'shisha-king-business-portfolio.html');
  fs.writeFileSync(out, html);
  console.log('written', out, (fs.statSync(out).size / 1024).toFixed(0), 'KB');
  // external-reference audit (only the live-site links should survive)
  const matches = [...html.matchAll(/https?:\/\/[^"')\s]+/g)].map(m => m[0].replace(/\/index\.html$/, '/')).filter(u => !u.startsWith('data:'));
  const ext = [...new Set(matches)];
  console.log('external refs:', JSON.stringify(ext, null, 1));
}

main().catch(e => { console.error(e); process.exit(1); });
