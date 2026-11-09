import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPage } from './lib/browser.mjs';

test('work page renders the 6 papers and the 1 project', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate('document.querySelectorAll("article.pub").length'), 7);
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
    const ok = await page.evaluate(`[...document.querySelectorAll('[data-section="research"] article.pub')].every(a =>
      a.querySelector('.entry-date') && a.querySelector('.pub-title') && a.querySelector('.pub-authors'))`);
    assert.ok(ok);
    assert.ok(await page.evaluate(`!!document.querySelector('.pub .links a') && !!document.querySelector('.pub .pub-summary')`));
  });
});

const visible = `[...document.querySelectorAll('article.pub')].filter(a => getComputedStyle(a).display !== 'none').length`;

test('filter bar shows All + one pill per area, with counts', async () => {
  await withPage({}, async page => {
    assert.notEqual(await page.evaluate(`getComputedStyle(document.querySelector('.area-filter')).display`), 'none');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area=""] .n').textContent`), '7');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="edge-ai"] .n').textContent`), '6');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="quantization"] .n').textContent`), '6');
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area=""]').getAttribute('aria-pressed')`), 'true');
  });
});

test('pills and chips read correctly to assistive tech and in plain text', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="edge-ai"] .n').getAttribute('aria-label')`), ' (6 entries)');
    const txt = await page.evaluate(`document.querySelector('.pub-areas').textContent.replace(/\\s+/g, ' ').trim()`);
    assert.ok(txt.includes('Wireless Communications Edge AI'), txt);
    await page.click('.area-pill[data-area="survey"]');
    assert.equal(await page.evaluate(`document.querySelector('[data-filter-status]').textContent`), 'Showing 1 of 7 entries: Survey');
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
    assert.equal(await page.evaluate(`document.querySelectorAll('.area-pill[data-area]:not([data-area=""])').length`), 12);
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
    const shown = await page.evaluate(`[...document.querySelectorAll('[data-section]')].filter(s => getComputedStyle(s).display !== 'none').map(s => s.dataset.section)`);
    assert.deepEqual(shown, ['research']); // the industry section has no Network Security entry, so it hides
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="network-security"]').getAttribute('aria-pressed')`), 'true');
  });
});

test('clicking the active pill returns to All', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 6);
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 7);
  });
});

test('paper chips are labels, not filter buttons', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate(`document.querySelectorAll('.pub-areas button, .pub-areas a').length`), 0);
    await page.click('.pub-areas [data-area="survey"]');
    assert.equal(await page.evaluate(visible), 7);
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
    assert.equal(await page.evaluate(visible), 7);
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
  ['Real-Time Student Engagement', '/images/fig-student-engagement.png'],
  ['Onboard Vision Guidance System', '/images/fig-uav-guidance.png'],
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

test('nav tab says Work and is current; page heading is Research & Projects', async () => {
  await withPage({}, async page => {
    const r = await page.evaluate(`({ cur: document.querySelector('nav a[aria-current="page"]')?.textContent.trim(),
      href: document.querySelector('nav a[aria-current="page"]')?.getAttribute('href'),
      h1: document.querySelector('h1.page-title').textContent.trim() })`);
    assert.deepEqual(r, { cur: 'Work', href: '/work/', h1: 'Research & Projects' });
  });
});

test('Research holds every paper; Industry Research & Development below; empty Research Projects not shown', async () => {
  await withPage({}, async page => {
    const r = await page.evaluate(`[...document.querySelectorAll('[data-section]')].map(s => ({
      key: s.dataset.section, title: s.querySelector('h2').textContent.trim(), n: s.querySelectorAll('article.pub').length }))`);
    assert.deepEqual(r, [{ key: 'research', title: 'Research', n: 6 }, { key: 'industry', title: 'Industry Research & Development', n: 1 }]);
  });
});

test('the old /research/ address lands on /work/', async () => {
  await withPage({ path: '/research/' }, async page => {
    let url = '';
    for (let i = 0; i < 40 && !url.endsWith('/work/'); i++) { await new Promise(r => setTimeout(r, 100)); url = await page.evaluate('location.pathname'); }
    assert.equal(url, '/work/');
  });
});

test('Kumrah project entry: ongoing label, org venue, no author line, four areas', async () => {
  await withPage({}, async page => {
    const r = await page.evaluate(`(() => { const a = document.querySelector('[data-section="industry"] article.pub');
      return { label: a.querySelector('.entry-date span').textContent.trim(),
               venue: a.querySelector('.pub-venue').textContent.replace(/\\s+/g, ' ').trim(),
               authors: !!a.querySelector('.pub-authors'), areas: a.dataset.areas }; })()`);
    assert.deepEqual(r, { label: 'ongoing', venue: 'Kumrah AI · Drone Leaf, Jun 2026 – present', authors: false,
      areas: 'autonomous-systems computer-vision quantization edge-ai' });
  });
});

test('filter pills run from most to fewest entries, All first, ties in data order', async () => {
  await withPage({}, async page => {
    const pills = await page.evaluate(`[...document.querySelectorAll('.area-pill')]
      .filter(p => getComputedStyle(p).display !== 'none')
      .map(p => ({ slug: p.dataset.area, n: +p.querySelector('.n').textContent }))`);
    assert.equal(pills[0].slug, '');
    const counts = pills.slice(1).map(p => p.n);
    assert.deepEqual(counts, [...counts].sort((x, y) => y - x));
    assert.deepEqual(pills.slice(1, 3).map(p => p.slug), ['edge-ai', 'quantization']); // tie at 6 keeps data order
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="autonomous-systems"] .n').textContent`), '1');
  });
});

test('spectrum sensing paper links its video', async () => {
  await withPage({}, async page => {
    const v = await page.evaluate(`(() => { const a = [...document.querySelectorAll('article.pub')]
      .find(a => a.textContent.includes('Cognitive Radio Spectrum Sensing'));
      const l = [...a.querySelectorAll('.links a')].find(l => l.textContent.trim() === 'Video');
      return l && { href: l.getAttribute('href'), icon: !!l.querySelector('i.fa-solid.fa-video') }; })()`);
    assert.deepEqual(v, { href: 'https://daravaram.github.io/video-library/spectrum-sensing/', icon: true });
  });
});

test('Paper links use a page icon, not a PDF icon (they open the publisher page)', async () => {
  await withPage({}, async page => {
    const r = await page.evaluate(`(() => { const ls = [...document.querySelectorAll('.pub .links a')].filter(l => l.textContent.trim() === 'Paper');
      return { n: ls.length, page: ls.filter(l => l.querySelector('i.fa-file-lines')).length, pdf: ls.filter(l => l.querySelector('i.fa-file-pdf')).length }; })()`);
    assert.ok(r.n > 0); assert.equal(r.page, r.n); assert.equal(r.pdf, 0);
  });
});
