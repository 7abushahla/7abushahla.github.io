// Minimal headless-Chrome driver over the DevTools protocol (no dependencies).
// withPage(opts, fn) loads a page from SITE_URL and hands fn a tiny page API.
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitFor(check, timeoutMs, what) {
  const start = Date.now();
  for (;;) {
    const v = check();
    if (v) return v;
    if (Date.now() - start > timeoutMs) throw new Error(`timed out waiting for ${what}`);
    await sleep(50);
  }
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    const listeners = new Map();
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method && listeners.has(msg.method)) {
        listeners.get(msg.method).forEach(f => f(msg.params));
      }
    };
    ws.onerror = () => reject(new Error('CDP websocket error'));
    ws.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          pending.set(++id, { res, rej });
          ws.send(JSON.stringify({ id, method, params }));
        });
      },
      once(method) {
        return new Promise(res => {
          const f = p => { listeners.set(method, listeners.get(method).filter(g => g !== f)); res(p); };
          listeners.set(method, [...(listeners.get(method) || []), f]);
        });
      },
      close() { ws.close(); },
    });
  });
}

export async function withPage(opts, fn) {
  const { path = '/research/', width = 1100, height = 900, js = true, theme = 'light' } = opts;
  const base = process.env.SITE_URL;
  if (!base) throw new Error('SITE_URL is not set (run via _tests/run.sh)');

  const dir = mkdtempSync(join(tmpdir(), 'chrome-test-'));
  const chrome = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank',
  ], { stdio: 'ignore' });
  let cdp;
  try {
    const portFile = join(dir, 'DevToolsActivePort');
    await waitFor(() => existsSync(portFile) && readFileSync(portFile, 'utf8').includes('\n'), 15000, 'Chrome to start');
    const port = readFileSync(portFile, 'utf8').split('\n')[0].trim();
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    cdp = await connect(target.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    if (!js) await cdp.send('Emulation.setScriptExecutionDisabled', { value: true });
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `try { localStorage.setItem('theme', ${JSON.stringify(theme)}); } catch (e) {}`,
    });
    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: base + path });
    await loaded;

    const page = {
      async evaluate(expression) {
        const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw new Error(`evaluate failed: ${r.exceptionDetails.exception?.description || r.exceptionDetails.text}`);
        return r.result.value;
      },
      // Full-page PNG, for visual checks.
      async screenshot(file) {
        const { cssContentSize } = await cdp.send('Page.getLayoutMetrics');
        const shot = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true,
          clip: { x: 0, y: 0, width, height: Math.ceil(cssContentSize.height), scale: 1 },
        });
        writeFileSync(file, Buffer.from(shot.data, 'base64'));
      },
      async click(selector) {
        await page.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)});
          if (!el) throw new Error('no element for ' + ${JSON.stringify(selector)}); el.click(); })()`);
      },
    };
    return await fn(page);
  } finally {
    try { cdp?.close(); } catch {}
    chrome.kill('SIGKILL');
    await sleep(100);
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}
