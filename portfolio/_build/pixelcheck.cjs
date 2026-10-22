const { createRequire } = require('module');
const path = require('path');
const fs = require('fs');
const rq = createRequire('C:/Users/bryth/.zcode/workspace/default/realto/package.json');
let Jimp;
try { Jimp = rq("jimp").Jimp; } catch (e) { console.log("jimp unavailable:", e.message); process.exit(2); }
async function variance(file, x, y, w, h) {
  const img = await Jimp.read(file);
  const { data } = img.bitmap;
  const W = img.bitmap.width;
  let n = 0, sx = 0, sxx = 0, bright = 0;
  for (let yy = y; yy < y + h; yy += 2) for (let xx = x; xx < x + w; xx += 2) {
    const i = (yy * W + xx) * 4;
    const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 128) continue;
    const lum = 0.299*r + 0.587*g + 0.114*b;
    sx += lum; sxx += lum*lum; n++;
    if (lum > 160) bright++;
  }
  if (!n) return { var: 0, mean: 0, brightFrac: 0 };
  const mean = sx/n, v = sxx/n - mean*mean;
  return { var: Math.round(v), mean: Math.round(mean), brightFrac: +(bright/n).toFixed(2) };
}
(async () => {
  // slice-d1: hero arch photo zone (x 938-1368, y 176-850 inside 880px header), nav logo tile (x 36-80, y 18-52)
  console.log('d1 hero arch  ', JSON.stringify(await variance('slice-d1.png', 1000, 300, 300, 400)));
  console.log('d1 nav logo   ', JSON.stringify(await variance('slice-d1.png', 40, 20, 34, 30)));
  // King's Pick square image in section 08: scan right-of-center band in each slice for a large high-variance block
  for (let i = 1; i <= 8; i++) {
    const f = `slice-d${i}.png`;
    const H = 1000;
    let hits = 0;
    for (let yy = 40; yy < H - 40; yy += 80) for (const xx of [200, 400, 600, 800, 1000]) {
      const r = await variance(f, xx, yy, 60, 60);
      if (r.var > 2500 && r.mean > 40 && r.mean < 220) hits++;
    }
    if (hits) console.log(`d${i} mid-content photo blocks: ${hits}`);
  }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
