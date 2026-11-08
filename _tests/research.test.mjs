import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPage } from './lib/browser.mjs';

test('research page renders all 11 papers', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate('document.querySelectorAll("article.pub").length'), 11);
  });
});

test('every paper has ≥3 area chips, after the summary', async () => {
  await withPage({}, async page => {
    const rows = await page.evaluate(`[...document.querySelectorAll('article.pub')].map(a => {
      const body = a.querySelector('.entry-body');
      const chips = body.querySelectorAll('.pub-areas .chip-domain[data-area]');
      return { n: chips.length, last: body.lastElementChild.classList.contains('pub-areas'),
               attr: (a.dataset.areas || '').split(' ').filter(Boolean).length };
    })`);
    for (const r of rows) { assert.ok(r.n >= 3); assert.ok(r.last); assert.equal(r.attr, r.n); }
  });
});

test('indoor paper carries its five areas', async () => {
  await withPage({}, async page => {
    const areas = await page.evaluate(`[...document.querySelectorAll('article.pub')]
      .find(a => a.textContent.includes('Sub-Millisecond')).dataset.areas`);
    assert.equal(areas, 'wireless-communications radio edge-ai quantization microcontrollers');
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

const visible = `[...document.querySelectorAll('article.pub')].filter(a => !a.hidden).length`;

test('filter bar shows All + one pill per area, with counts', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelector('.area-filter').hidden`), false);
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area=""] .n').textContent`), '11');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="edge-ai"] .n').textContent`), '6');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area=""]').getAttribute('aria-pressed')`), 'true');
  });
});

test('every paper area has a pill (catches front-matter typos)', async () => {
  await withPage({}, async page => {
    const missing = await page.evaluate(`[...document.querySelectorAll('.pub-areas [data-area]')]
      .map(c => c.dataset.area).filter(s => !document.querySelector('.area-pill[data-area="'+s+'"]'))`);
    assert.deepEqual(missing, []);
  });
});

test('Diffusion is not offered as an area', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelectorAll('[data-area="diffusion"]').length`), 0);
  });
});

test('selecting an area filters papers and hides empty sections', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="network-security"]');
    assert.equal(await page.evaluate(visible), 1);
    assert.equal(await page.evaluate(`document.querySelector('[data-section]:last-of-type').hidden`), true); // Research Projects
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="network-security"]').getAttribute('aria-pressed')`), 'true');
  });
});

test('clicking the active pill returns to All', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 6);
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 11);
  });
});

test('paper chips are labels, not filter buttons', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelectorAll('.pub-areas button, .pub-areas a').length`), 0);
    await page.click('.pub-areas [data-area="survey"]');
    assert.equal(await page.evaluate(visible), 11);
    await page.click('.area-pill[data-area="survey"]');
    assert.equal(await page.evaluate(visible), 3);
    assert.equal(await page.evaluate(`document.querySelectorAll('.pub-areas .chip.is-on').length`), 3);
  });
});

test('rules follow the visible entries, not the DOM', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="reinforcement-learning"]'); // only projects match
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
    assert.equal(await page.evaluate(visible), 11);
    assert.equal(await page.evaluate(`document.querySelector('.area-filter').hidden`), true);
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
];

for (const [titleWord, src] of REBUILT) {
  test(`${titleWord} paper shows its rebuilt 16:10 figure`, async () => {
    await withPage({}, async page => {
      const img = await page.evaluate(`(async () => {
        const a = [...document.querySelectorAll('article.pub')].find(a => a.textContent.includes(${JSON.stringify(titleWord)}));
        const im = a.querySelector('img.pub-thumb');
        if (!im.complete) await new Promise(r => im.onload = r);
        return { src: im.getAttribute('src'), w: im.naturalWidth, h: im.naturalHeight };
      })()`);
      assert.equal(img.src, src);
      assert.deepEqual([img.w, img.h], [1200, 750]);
    });
  });
}
