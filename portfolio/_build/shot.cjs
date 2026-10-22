// Full-page screenshots of the built portfolio via CDP (desktop 1440 + mobile 390@2x)
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PAGE = 'file:///C:/Users/bryth/.zcode/workspace/default/shisha-king/portfolio/shisha-king-business-portfolio.html';
const OUT = __dirname;
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const udd = fs.mkdtempSync(path.join(os.tmpdir(), 'sk-shot-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--no-first-run', '--disable-gpu', '--no-default-browser-check',
    `--remote-debugging-port=0`, `--user-data-dir=${udd}`, 'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  chrome.stdout.on('data', () => {});
  chrome.stderr.on('data', d => { const s = String(d); if (!/GPU|Gpu|gl_|EGL|WARNING/i.test(s)) process.stderr.write(s); });

  // discover the random debug port
  let port = null;
  for (let i = 0; i < 40; i++) {
    await sleep(250);
    try {
      const lines = fs.readFileSync(path.join(udd, 'DevToolsActivePort'), 'utf8').trim().split(/\r?\n/);
      port = lines[0]; break;
    } catch {}
  }
  if (!port) throw new Error('chrome did not open a debug port');

  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let seq = 0;
  const pending = new Map();
  const send = (method, params = {}) => new Promise((ok, err) => {
    const id = ++seq; pending.set(id, { ok, err });
    ws.send(JSON.stringify({ id, method, params }));
  });
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id);
      m.error ? p.err(new Error('CDP ' + m.method + ': ' + JSON.stringify(m.error))) : p.ok(m);
    }
  };
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
  await send('Page.enable');
  await send('Runtime.enable');

  async function shoot(name, w, h, dsf, mobile) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dsf, mobile });
    await send('Page.navigate', { url: PAGE });
    await sleep(1200); // data-URI decode + layout settle
    const { result: { result: { value: sh } } } = await send('Runtime.evaluate', { expression: 'document.body.scrollHeight', returnByValue: true });
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: sh, deviceScaleFactor: dsf, mobile });
    await sleep(600);
    const { result: { data } } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    const out = path.join(OUT, name);
    fs.writeFileSync(out, Buffer.from(data, 'base64'));
    console.log(name, w + 'x' + sh + ' @' + dsf + 'x ->', (fs.statSync(out).size / 1024).toFixed(0), 'KB');
  }

  // Slices at realistic viewports: desktop 1440x1000 in 1000 CSS px chunks,
  // mobile 390x844 in 1700 CSS px chunks (@2x). Capture with captureBeyondViewport
  // so clip offsets scroll the full document while vh units stay pinned to the viewport.
  async function slices(tag, count, chunk) {
    const isD = tag === 'd';
    const w = isD ? 1440 : 390, vh = isD ? 1000 : 844, dsf = isD ? 1 : 2, mobile = !isD, ch = isD ? 1000 : 1700;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: vh, deviceScaleFactor: dsf, mobile });
    await send('Page.navigate', { url: PAGE });
    await sleep(1500); // data-URI decode + layout settle
    const docH = (await send('Runtime.evaluate', { expression: 'document.body.scrollHeight', returnByValue: true })).result.result.value;
    await sleep(400);
    const n = Math.min(count, Math.ceil(docH / ch));
    for (let i = 0; i < n; i++) {
      const y = i * ch, hh = Math.min(ch, docH - y);
      const { result: { data } } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width: w, height: hh, scale: dsf } });
      const out = path.join(OUT, `slice-${tag}${i + 1}.png`);
      fs.writeFileSync(out, Buffer.from(data, 'base64'));
      console.log(out, w + 'x' + hh + ' CSS @' + dsf + 'x', (fs.statSync(out).size / 1024).toFixed(0) + 'KB');
    }
    console.log(tag, 'docH', docH, 'slices', n);
  }
  await slices('d', 8, 1000);
  await slices('m', 7, 1700);

  ws.close();
  chrome.kill();
  fs.rmSync(udd, { recursive: true, force: true });
  console.log('done');
}

main().catch(e => { console.error('FAIL', e.message); process.exit(1); });
