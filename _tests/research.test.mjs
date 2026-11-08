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
