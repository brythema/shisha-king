const fs = require('fs');
const b64 = f => fs.readFileSync(f).toString('base64');
// downscale the big mobile slice for a lighter payload
async function shrink(file, out, scale) {
  try {
    const Jimp = require('module').createRequire('C:/Users/bryth/.zcode/workspace/default/realto/package.json')('jimp').Jimp;
    const img = await Jimp.read(file);
    img.scale(scale);
    await img.write(out);
    return out;
  } catch { return file; }
}
(async () => {
  const m1 = await shrink('slice-m1.png', 'slice-m1-small.png', 0.5);
  const imgs = [
    { file: 'slice-d1.png', label: 'image 1 = desktop hero (nav + headline + arch photo)' },
    { file: 'slice-d5.png', label: 'image 2 = desktop mid-page (packages + square King\'s Pick bottle photo)' },
    { file: 'slice-d8.png', label: 'image 3 = desktop bottom (CTA + case section + footer with gold E3 credit line)' },
    { file: m1, label: 'image 4 = mobile top (nav + stacked hero + arch photo below text)' },
  ];
  const body = {
    model: 'openrouter/free',
    temperature: 0.2,
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Visual QA of a dark-luxury business portfolio (near-black bg, gold accents, serif headlines). ' +
          'Check each image for: (a) photos rendering correctly, not broken/stretched, (b) overlapping or clipped text, (c) readable contrast, (d) clean aligned card grids. ' +
          imgs.map(i => i.label).join('; ') + '. ' +
          'Reply with compact JSON only: {"image1":{"issues":[...],"verdict":"pass|fail"},"image2":{...},"image3":{...},"image4":{...}}. Empty issues array when clean. Cite locations for any issue.' },
        ...imgs.map(i => ({ type: 'image_url', image_url: { url: 'data:image/png;base64,' + b64(i.file) } })),
      ],
    }],
  };
  const res = await fetch('http://127.0.0.1:19099/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const j = await res.json();
  if (!res.ok) { console.log('HTTP', res.status, JSON.stringify(j).slice(0, 600)); process.exit(1); }
  console.log('model:', j.model || body.model);
  console.log(j.choices?.[0]?.message?.content ?? JSON.stringify(j).slice(0, 800));
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
