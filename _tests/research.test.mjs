import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPage } from './lib/browser.mjs';

test('research page renders the 6 published papers', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate('document.querySelectorAll("article.pub").length'), 6);
  });
});

test('every paper has area chips, after the summary', async () => {
  await withPage({}, async page => {
    const rows = await page.evaluate(`[...document.querySelectorAll('article.pub')].map(a => {
      const body = a.querySelector('.entry-body');
      const chips = body.querySelectorAll('.pub-areas .chip-domain[data-area]');
      return { n: chips.length, last: body.lastElementChild.classList.contains('pub-areas'),
               attr: (a.dataset.areas || '').split(' ').filter(Boolean).length };
    })`);
    for (const r of rows) { assert.ok(r.n >= 1); assert.ok(r.last); assert.equal(r.attr, r.n); }
  });
});

test('indoor paper carries its four areas', async () => {
  await withPage({}, async page => {
    const areas = await page.evaluate(`[...document.querySelectorAll('article.pub')]
      .find(a => a.textContent.includes('Sub-Millisecond')).dataset.areas`);
    assert.equal(areas, 'wireless-communications edge-ai quantization microcontrollers');
  });
});

test('existing entry parts are unchanged', async () => {
  await withPage({}, async page => {
    const ok = await page.evaluate(`[...document.querySelectorAll('article.pub')].every(a =>
      a.querySelector('.entry-date') && a.querySelector('.pub-title') && a.querySelector('.pub-authors'))`);
    assert.ok(ok);
    assert.ok(await page.evaluate(`!!document.querySelector('.pub .links a') && !!document.querySelector('.pub .pub-summary')`));
  });
});

const visible = `[...document.querySelectorAll('article.pub')].filter(a => getComputedStyle(a).display !== 'none').length`;

test('filter bar shows All + one pill per area, with counts', async () => {
  await withPage({}, async page => {
    assert.notEqual(await page.evaluate(`getComputedStyle(document.querySelector('.area-filter')).display`), 'none');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area=""] .n').textContent`), '6');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="edge-ai"] .n').textContent`), '5');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="quantization"] .n').textContent`), '5');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area=""]').getAttribute('aria-pressed')`), 'true');
  });
});

test('pills and chips read correctly to assistive tech and in plain text', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="edge-ai"] .n').getAttribute('aria-label')`), ' (5 papers)');
    const txt = await page.evaluate(`document.querySelector('.pub-areas').textContent.replace(/\\s+/g, ' ').trim()`);
    assert.ok(txt.includes('Wireless Communications Edge AI'), txt);
    await page.click('.area-pill[data-area="survey"]');
    assert.equal(await page.evaluate(`document.querySelector('[data-filter-status]').textContent`), 'Showing 1 of 6 papers: Survey');
  });
});

test('every paper area has a pill (catches front-matter typos)', async () => {
  await withPage({}, async page => {
    const missing = await page.evaluate(`[...document.querySelectorAll('.pub-areas [data-area]')]
      .map(c => c.dataset.area).filter(s => !document.querySelector('.area-pill[data-area="'+s+'"]'))`);
    assert.deepEqual(missing, []);
  });
});

test('only the consolidated areas are offered', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelectorAll('.area-pill[data-area]:not([data-area=""])').length`), 11);
    assert.equal(await page.evaluate(`document.querySelectorAll('[data-area="radio"], [data-area="cognitive-radio"], [data-area="privacy"], [data-area="arabic-manuscripts"]').length`), 0);
  });
});

test('areas with no papers are not offered as pills', async () => {
  await withPage({}, async page => {
    const zero = await page.evaluate(`[...document.querySelectorAll('.area-pill[data-area]:not([data-area=""])')]
      .filter(p => p.querySelector('.n').textContent === '0').map(p => ({ slug: p.dataset.area, hidden: getComputedStyle(p).display === 'none' }))`);
    assert.ok(zero.length > 0, 'expected at least one empty area while projects are hidden');
    for (const z of zero) assert.equal(z.hidden, true, z.slug);
  });
});

test('selecting an area filters papers and hides empty sections', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="network-security"]');
    assert.equal(await page.evaluate(visible), 1);
    assert.equal(await page.evaluate(`document.querySelectorAll('[data-section]').length`), 1); // only Publications renders while projects are hidden
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="network-security"]').getAttribute('aria-pressed')`), 'true');
  });
});

test('clicking the active pill returns to All', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 5);
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 6);
  });
});

test('paper chips are labels, not filter buttons', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelectorAll('.pub-areas button, .pub-areas a').length`), 0);
    await page.click('.pub-areas [data-area="survey"]');
    assert.equal(await page.evaluate(visible), 6);
    await page.click('.area-pill[data-area="survey"]');
    assert.equal(await page.evaluate(visible), 1);
    assert.equal(await page.evaluate(`document.querySelectorAll('.pub-areas .chip.is-on').length`), 1);
  });
});

test('rules follow the visible entries, not the DOM', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="document-analysis"]'); // one paper, mid-list
    const r = await page.evaluate(`(() => {
      const sec = [...document.querySelectorAll('[data-section]')].find(s => !s.hidden);
      const pubs = [...sec.querySelectorAll('article.pub')].filter(a => !a.hidden);
      return { top: getComputedStyle(sec).borderTopWidth,
               bottom: getComputedStyle(pubs.at(-1)).borderBottomWidth };
    })()`);
    assert.equal(r.top, '0px'); assert.equal(r.bottom, '0px');
  });
});

test('no JavaScript: all papers visible, filter hidden', async () => {
  await withPage({ js: false }, async page => {
    assert.equal(await page.evaluate(visible), 6);
    assert.equal(await page.evaluate(`getComputedStyle(document.querySelector('.area-filter')).display`), 'none');
  });
});

test('phone width: filter wraps, no horizontal scroll', async () => {
  await withPage({ width: 375 }, async page => {
    assert.ok(await page.evaluate(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`));
  });
});

// Papers whose screenshot thumbnails have been replaced by rebuilt 16:10 figures.
const REBUILT = [
  ['Sub-Millisecond', '/images/fig-indoor-rf.png'],
  ['Different Strokes', '/images/fig-writer-id.png'],
  ['From Sensor to Server', '/images/fig-ids-iot.png'],
  ['Neural Network Quantization for Microcontrollers', '/images/fig-mcu-quantization-survey.png'],
  ['Cognitive Radio Spectrum Sensing on the Edge', '/images/fig-qat-spectrum.png'],
];

for (const [titleWord, src] of REBUILT) {
  test(`${titleWord} paper shows its rebuilt 16:10 figure`, async () => {
    await withPage({}, async page => {
      const img = await page.evaluate(`(async () => {
        const a = [...document.querySelectorAll('article.pub')].find(a => a.textContent.includes(${JSON.stringify(titleWord)}));
        const im = a.querySelector('img.pub-thumb');
        im.loading = 'eager';
        if (!im.complete) await new Promise((res, rej) => { im.onload = res; im.onerror = () => rej(new Error('image failed: ' + im.src)); setTimeout(() => rej(new Error('image timeout: ' + im.src)), 8000); });
        return { src: im.getAttribute('src'), w: im.naturalWidth, h: im.naturalHeight };
      })()`);
      assert.equal(img.src, src);
      assert.deepEqual([img.w, img.h], [1200, 750]);
    });
  });
}
