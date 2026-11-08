import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPage } from './lib/browser.mjs';

test('research page renders all 11 papers', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate('document.querySelectorAll("article.pub").length'), 11);
  });
});
