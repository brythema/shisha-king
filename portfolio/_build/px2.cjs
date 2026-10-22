const { createRequire } = require('module');
const Jimp = createRequire('C:/Users/bryth/.zcode/workspace/default/realto/package.json')('jimp').Jimp;
async function varAt(file, x, y, w, h, step = 3) {
  const img = await Jimp.read(file);
  const { data } = img.bitmap; const W = img.bitmap.width;
  let n = 0, sx = 0, sxx = 0, bright = 0;
  for (let yy = y; yy < y + h; yy += step) for (let xx = x; xx < x + w; xx += step) {
    const i = (yy * W + xx) * 4; const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
    if (a < 128) continue;
    const lum = 0.299*r + 0.587*g + 0.114*b; sx += lum; sxx += lum*lum; n++; if (lum > 160) bright++;
  }
  if (!n) return null; const mean = sx/n;
  return { var: Math.round(sxx/n - mean*mean), mean: Math.round(mean), brightFrac: +(bright/n).toFixed(2) };
}
(async () => {
  console.log('d1 nav logo @160,18', JSON.stringify(await varAt('slice-d1.png', 160, 18, 36, 34)));
  // King's Pick: big 300x300 scan in left-of-center band across slices 4-7
  for (let i = 4; i <= 7; i++) {
    for (const yy of [60, 360, 660, 940]) {
      const r = await varAt(`slice-d${i}.png`, 190, Math.min(yy, 680), 280, Math.min(280, 960 - Math.min(yy, 680)), 6);
      if (r && r.var > 1500) console.log(`d${i} y${yy} big photo block`, JSON.stringify(r));
    }
  }
  // footer E3 line: bottom 200px of slice-d8, look for gold-ish pixels (r>150,g>120,b<120)
  const img = await Jimp.read('slice-d8.png'); const { data } = img.bitmap; const W = img.bitmap.width;
  let gold = 0, tot = 0;
  for (let yy = img.bitmap.height - 220; yy < img.bitmap.height; yy += 2) for (let xx = 0; xx < W; xx += 2) {
    const i = (yy*W + xx)*4; const r = data[i], g = data[i+1], b = data[i+2];
    if (r > 150 && g > 120 && b < 140) gold++; tot++;
  }
  console.log('d8 footer gold pixels in bottom band:', gold, 'of', tot);
})();
