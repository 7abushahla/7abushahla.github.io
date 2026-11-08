# Research Page: Area Tags, Filter, and Website Figures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add area chips and an area filter to the Research page, and replace five papers' screenshot thumbnails with 16:10 figures rebuilt from each paper.

**Architecture:** Areas are a front-matter list on each publication. `publication.html` renders them as chips, and `research.html` renders an initially hidden filter bar. A small vanilla script (`assets/js/research-filter.js`) un-hides the bar, computes counts and shows/hides entries and sections. Each figure is hand-authored as an HTML/SVG page in `_figures/` (so web fonts work) and rasterized to a 1200×750 PNG with headless Chrome.

**Tech Stack:** Jekyll 3.9 / github-pages 228, Liquid, SCSS (`style.scss`), vanilla JS, Node 24 (`node --test`, built-in `WebSocket`) driving headless Google Chrome over the DevTools protocol, PyMuPDF for viewing source PDFs.

**Spec:** `docs/superpowers/specs/2026-11-08-research-page-design.md`

## Global Constraints

- Improvement, not redesign: the year/status column, title, authors, venue + impact metrics, link buttons and italic summary stay on every entry, unchanged.
- Status sections stay: Publications, Accepted Papers, Submitted Papers, Research Projects, with current headings and blurbs.
- Area chips only (no keyword chips), **at least 3 per paper**, in one row **after the summary**, styled with the existing `.chip` / `.chip-domain` classes.
- The active area's chip on a paper: teal border + soft teal background (`--live`, `--live-soft`).
- Filter bar under the page title, above the first section. "All" (default) plus one **rounded pill** per area with a count. Pills are in the `.links a` family (Archivo, `--surface` bg, 1px `--rule` border, 999px radius), ~.78rem, ~4px 11px padding. Active pill is filled `--live` with white text, and the count is in IBM Plex Mono at reduced opacity.
- Single-select. Clicking the active area (pill or paper chip) clears to All. Sections with no matches hide.
- No JS: all papers show and the filter bar is hidden.
- Light and dark themes via existing tokens only. Must work at the 900 / 760 / 420px breakpoints with no horizontal scroll at phone width.
- No new Jekyll plugins and no JS frameworks.
- Figures: **follow the approved template** in the spec ("Approved figure template") and copy the reference `docs/superpowers/specs/figure-reference/indoor-rf/indoor-rf.html`. That means a 2×2 grid of NICE-style panels (Input → Model → Model on hardware → Output), a distinct hue per panel, color only where it means something, no small text, the paper's real plots/photos/numbers, and only the argmax result in green. **16:10**, 1200×750 PNG. Hamza approves each before it replaces the old image. Old image files stay in `images/`.
- 16:10 applies to the new figures only. No CSS change crops, forces or letterboxes `.pub-thumb` (`height:auto` stays).
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work on branch `research-page`.

## Review Focus

1. **Borders after filtering:** the last *visible* entry in a section must drop its bottom rule, and the first *visible* section must drop its top rule. The existing `:last-child` / `:first-of-type` CSS won't track hidden elements. (Test in Task 3.)
2. **Toggling off:** clicking the active pill, or the active chip on a paper, returns to All with every paper visible. (Test in Task 3.)
3. **JavaScript disabled:** all 11 papers render and the filter bar stays hidden. (Test in Task 2.)
4. **Phone width (375px):** the filter bar wraps and the page has no horizontal scroll. (Test in Task 3.)
5. **Area typo in front matter:** every area on a paper must have a matching filter pill. A misspelled area would otherwise make a paper unreachable by filter. (Test in Task 2.)

---

## File Structure

| Path | Responsibility |
|---|---|
| `_config.yml` | Add `docs`, `vendor` to `exclude` (docs would otherwise be published) |
| `.gitignore` | Add `vendor/`, `.superpowers/` |
| `_data/research_areas.yml` | Ordered list of area display names (filter order) |
| `_publications/*.markdown` | New `areas:` list per paper; later, `image:` for 5 papers |
| `_includes/publication.html` | `data-areas` on `<article>`, chip row after summary |
| `research.html` | Filter bar markup, `data-section` on bands, script tag |
| `assets/js/research-filter.js` | Filter behavior |
| `style.scss` | Chip-row, pill, active-state and visibility-edge rules |
| `_tests/run.sh` | Build site, serve `_site`, run `node --test _tests/` |
| `_tests/lib/browser.mjs` | Headless Chrome over CDP: `withPage` helper |
| `_tests/research.test.mjs` | Research page behavior tests |
| `_tools/render-figure.sh` | `_figures/<slug>.html` → `images/fig-<slug>.png` (1200×750) |
| `_figures/<slug>.html` | Hand-authored website figure, one per paper |
| `images/fig-<slug>.png` | Rendered figures |

Underscore directories (`_tests`, `_tools`, `_figures`) are skipped by Jekyll automatically.

---

### Task 1: Local build and browser test harness

**Files:**
- Modify: `_config.yml` (exclude list), `.gitignore`
- Create: `_tests/run.sh`, `_tests/lib/browser.mjs`, `_tests/research.test.mjs`

**Interfaces:**
- Produces: `_tests/run.sh` (exit 0 = all pass). `withPage(opts, fn)` from `_tests/lib/browser.mjs`, where `opts = { path='/research/', width=1100, height=900, js=true, theme='light' }` and `fn` receives `page = { evaluate(expr: string) => Promise<any>, click(selector: string) => Promise<void> }`. Base URL is read from env `SITE_URL` (set by `run.sh`).

- [ ] **Step 1: Get Jekyll building.** System Ruby 2.6 and rbenv 2.7.0 can't run this bundle. Use Homebrew Ruby: `export PATH=/usr/local/opt/ruby/bin:$PATH; bundle config set --local path vendor/bundle; bundle install`. If `github-pages 228` fails on Ruby 3.4, use `~/.rvm/rubies/ruby-3.2.0/bin` instead. Whichever works, hard-code that PATH prefix in `run.sh`. **Ask Hamza before running `bundle install`** (it installs gems into `vendor/bundle`).
  Verify: `bundle exec jekyll build` exits 0 and `_site/research/index.html` exists.

- [ ] **Step 2: Exclude non-site folders.** Add `docs` and `vendor` to `exclude:` in `_config.yml`. Add `vendor/` and `.superpowers/` to `.gitignore`.
  Verify: after a build, `ls _site/docs` fails (no such directory).

- [ ] **Step 3: Write `_tests/lib/browser.mjs`.** Launch `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` with `--headless=new --remote-debugging-port=0 --user-data-dir=<mkdtemp>`. Read the port from `<user-data-dir>/DevToolsActivePort`. Open a target via `PUT /json/new`, then talk CDP over global `WebSocket`: `Emulation.setDeviceMetricsOverride` (width/height, scale 1), `Emulation.setScriptExecutionDisabled` when `js:false`, `Page.addScriptToEvaluateOnNewDocument` with `localStorage.setItem('theme', <theme>)` (the site's head script reads it), `Page.navigate` + wait for `Page.loadEventFired`. `evaluate` = `Runtime.evaluate` with `returnByValue:true, awaitPromise:true`. `click(sel)` = evaluate `document.querySelector(sel).click()`. Always kill Chrome in `finally`.

- [ ] **Step 4: Write `_tests/run.sh`.** It should: build with the PATH from Step 1, start `python3 -m http.server <free port> -d _site` in the background, export `SITE_URL=http://127.0.0.1:<port>`, run `node --test _tests/`, kill the server on exit (trap) and propagate node's exit code.

- [ ] **Step 5: Write the smoke test in `_tests/research.test.mjs`**

```js
test('research page renders all 11 papers', async () => {
  await withPage({}, async page => {
    assert.equal(await page.evaluate('document.querySelectorAll("article.pub").length'), 11);
  });
});
```

- [ ] **Step 6: Run** `bash _tests/run.sh`. Expected: 1 test, pass.

- [ ] **Step 7: Commit** `_config.yml .gitignore _tests/` with message `Add local build and headless-browser test harness`.

---

### Task 2: Area data and chips on each paper

**Files:**
- Create: `_data/research_areas.yml`
- Modify: all 11 `_publications/*.markdown`, `_includes/publication.html`, `style.scss` (publications block, ~line 511–580)
- Test: `_tests/research.test.mjs`

**Interfaces:**
- Consumes: `withPage` (Task 1).
- Produces:
  - `article.pub[data-areas]`: space-separated slugs (`area | slugify`, e.g. `edge-ai wireless-communications`).
  - Chip row `div.chips.pub-areas` as the **last child** of `.entry-body`, containing `button.chip.chip-domain[type=button][data-area="<slug>"]` with the display name as text.
  - `site.data.research_areas`: ordered array of display-name strings.

- [ ] **Step 1: Write failing tests**

```js
test('every paper has ≥3 area chips, after the summary', async () => {
  await withPage({}, async page => {
    const rows = await page.evaluate(`[...document.querySelectorAll('article.pub')].map(a => {
      const body = a.querySelector('.entry-body');
      const chips = body.querySelectorAll('.pub-areas .chip-domain[data-area]');
      return { n: chips.length, last: body.lastElementChild.classList.contains('pub-areas'),
               attr: a.dataset.areas.split(' ').length };
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
```

- [ ] **Step 2: Run** `bash _tests/run.sh`. Expected: the three new tests FAIL (no `data-areas`).

- [ ] **Step 3: Add data.** Create `_data/research_areas.yml` with this order (most-used first, ties in spec order): Edge AI, Wireless Communications, Quantization, Computer Vision, Survey, Cognitive Radio, Microcontrollers, Document Analysis, Arabic Manuscripts, Reinforcement Learning, Continual Learning, Radio, Network Security, IoT, Privacy, Robotics, Generative Models, Diffusion. Add `areas:` to each publication exactly as in the spec's "Area tags per paper" table, in table order. Leave `domain:` untouched.

- [ ] **Step 4: Render chips.** In `_includes/publication.html`: add `data-areas="{% for a in p.areas %}{{ a | slugify }}{% unless forloop.last %} {% endunless %}{% endfor %}"` to `<article class="pub">`, and after the `.pub-summary` block add the `.chips.pub-areas` row (Produces above). In `style.scss`: `.pub-areas { margin: 12px 0 0; }`. Reset button defaults on `.pub-areas .chip` (font inherit from `.chip`, `background: transparent`, `cursor: pointer`). Add `.chip.is-on { color: var(--live); border-color: var(--live); background: var(--live-soft); }`.

- [ ] **Step 5: Run** `bash _tests/run.sh`. Expected: all pass.

- [ ] **Step 6: Commit** `_data/research_areas.yml _publications/ _includes/publication.html style.scss _tests/research.test.mjs` with message `Tag each publication with research areas`.

---

### Task 3: Filter bar and behavior

**Files:**
- Create: `assets/js/research-filter.js`
- Modify: `research.html`, `style.scss`
- Test: `_tests/research.test.mjs`

**Interfaces:**
- Consumes: `article.pub[data-areas]`, `.pub-areas .chip[data-area]` (Task 2), `site.data.research_areas`.
- Produces (markup in `research.html`):
  - `<nav class="area-filter" aria-label="Filter by area" hidden>` placed before the first section, containing `<span class="mono">Filter by area</span>`, then `button.area-pill[type=button][data-area=""]` ("All"), then one `button.area-pill[data-area="<slug>"]` per `site.data.research_areas` entry. Each pill has text then `<span class="n"></span>`.
  - Each `<section class="band">` gets `data-section`.
  - `<script src="{{ '/assets/js/research-filter.js' | relative_url }}" defer></script>` at the end of `research.html`.
- Script state contract: active pill has `.is-on` + `aria-pressed="true"` (others `"false"`). Non-matching `article.pub` gets `hidden`. A section with no visible pub gets `hidden`. The last visible pub per section gets `.is-last`, the first visible section gets `.is-first`. Matching paper chips get `.is-on`.

- [ ] **Step 1: Write failing tests**

```js
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

test('selecting an area filters papers and hides empty sections', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="network-security"]');
    assert.equal(await page.evaluate(visible), 1);
    assert.equal(await page.evaluate(`document.querySelector('[data-section]:last-of-type').hidden`), true); // Research Projects
    assert.equal(await page.evaluate(`document.querySelector('.area-pill[data-area="network-security"]').getAttribute('aria-pressed')`), 'true');
  });
});

test('clicking the active pill, or a paper chip twice, returns to All', async () => {
  await withPage({}, async page => {
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 6);
    await page.click('.area-pill[data-area="edge-ai"]');
    assert.equal(await page.evaluate(visible), 11);
    await page.click('.pub-areas [data-area="survey"]');
    assert.equal(await page.evaluate(visible), 3);
    assert.equal(await page.evaluate(`document.querySelectorAll('.pub-areas .chip.is-on').length`), 3);
    await page.click('.pub-areas .chip.is-on');
    assert.equal(await page.evaluate(visible), 11);
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
    // evaluate still works via CDP when page scripts are disabled
    assert.equal(await page.evaluate(visible), 11);
    assert.equal(await page.evaluate(`document.querySelector('.area-filter').hidden`), true);
  });
});

test('phone width: filter wraps, no horizontal scroll', async () => {
  await withPage({ width: 375 }, async page => {
    assert.ok(await page.evaluate(`document.documentElement.scrollWidth <= document.documentElement.clientWidth`));
  });
});
```

- [ ] **Step 2: Run** `bash _tests/run.sh`. Expected: the new tests FAIL (no `.area-filter`).

- [ ] **Step 3: Add markup** to `research.html` per Produces. Use `{% for a in site.data.research_areas %}` with `{{ a | slugify }}`.

- [ ] **Step 4: Implement `assets/js/research-filter.js`** as an IIFE that exits if `.area-filter` is absent. On load: fill each pill's `.n` (All = number of pubs, others = number of pubs whose `data-areas` split includes the slug), remove `hidden` from the nav, and call `apply(null)`. One delegated click listener on `document` for `.area-pill, .pub-areas .chip`: `apply(slug === current || slug === '' ? null : slug)`. `apply(slug)` sets every class/attribute in the state contract above.

- [ ] **Step 5: Style** in `style.scss` with the Global Constraints pill values: `.area-filter { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin: 0 0 8px; }`, `.area-filter[hidden] { display:none; }`, `.area-pill`, `.area-pill:hover` (teal like `.links a:hover`), `.area-pill.is-on`, `.area-pill .n`. Add `.entries > .is-last { border-bottom: 0; }`, `.band.is-first { border-top: 0; }`, and make sure a non-first visible `.band:first-of-type` that is *not* `.is-first` still gets its top rule when an earlier band is hidden. Simplest: `.band[hidden] { display:none; }` plus `.band.is-first` winning over the existing rule. Also add `.pub[hidden] { display:none; }`, because `.pub { display:grid }` would otherwise override the `hidden` attribute.

- [ ] **Step 6: Run** `bash _tests/run.sh`. Expected: all pass.

- [ ] **Step 7: Visual check, both themes.** Screenshot `/research/` with Chrome headless at 1100px and 375px, in light and dark (`withPage` + `Page.captureScreenshot`, or the `--screenshot` CLI after setting the theme). Check that the active pill and highlighted chips read clearly in dark mode and that nothing else on the page changed. Show the 1100px light/dark shots to Hamza in the visual companion.

- [ ] **Step 8: Commit** `research.html assets/js/research-filter.js style.scss _tests/research.test.mjs` with message `Add area filter to the research page`.

---

## Figure workflow (shared by Tasks 4–8)

Each figure task follows these steps. The per-task section only gives what's specific to that paper.

- **F1. Study the source.** Render the candidate source figures to PNG for viewing with PyMuPDF (`python3 -I -c "import fitz,sys; d=fitz.open(sys.argv[1]); d[0].get_pixmap(dpi=200).save(sys.argv[2])" <src.pdf> <scratch>/<name>.png`). Read the figure's caption and the surrounding section in the `.tex`. EPS: convert with `gs -sDEVICE=png16m -r200 -o out.png in.eps`. Identify this paper's working system (input → model → model on hardware → output) and the real plots, photos and numbers to use in each panel.
- **F2. Author `_figures/<slug>.html`** by copying the reference `docs/superpowers/specs/figure-reference/indoor-rf/indoor-rf.html` and changing only the panel contents and titles. Keep the structure, CSS, panel hues pattern (distinct per panel), arrows and type. Fill the four panels with this paper's input, model, hardware and output, and follow every rule in the spec's "Approved figure template" (no caption lines, centered contents, real numbers, math typeset, neutral output tiles with a green argmax result). Pick the panel hues so all four stay clearly distinct. Assets go in `_figures/assets/`.
- **F3. Write `_tools/render-figure.sh <slug>`** (first figure task only, then reused). Run Chrome headless `--screenshot=images/fig-<slug>.png --window-size=600,375 --force-device-scale-factor=2 --hide-scrollbars --virtual-time-budget=3000 file://$PWD/_figures/<slug>.html`.
  Verify: `sips -g pixelWidth -g pixelHeight images/fig-<slug>.png` prints 1200 and 750.
- **F4. Review with Hamza.** Push a visual-companion screen showing the current image and the new one side by side at 168px wide, and the new one at ~375px (mobile). Iterate on F2 until Hamza approves. Do not continue without approval.
- **F5. Swap.** Set `image: /images/fig-<slug>.png` in the paper's front matter. Run `bash _tests/run.sh` (all pass). Commit `_figures/<slug>.html _figures/assets/ images/fig-<slug>.png _publications/<file> [_tools/render-figure.sh]` with message `Add website figure for <short paper name>`.

### Task 4: Figure: indoor environment ID (`indoor-rf`)
- **Already designed and approved by Hamza.** Port it, don't redesign it. Copy `docs/superpowers/specs/figure-reference/indoor-rf/indoor-rf.html` to `_figures/indoor-rf.html`, and its assets (`re.png`, `im.png`, `board.jpeg`) to `_figures/assets/`, fixing the image paths. Render with F3 and check that the output matches `figure-reference/indoor-rf/indoor-rf.png`. F4 is a quick confirmation only, then F5.
- Also writes `_tools/render-figure.sh` (F3).

### Task 5: Figure: Arabic writer identification (`writer-id`)
- Sources: `/Users/hamza/Downloads/prev-papers/Writer_Identification_IJDAR__Arxiv_/figs/`. Lead candidate `fig6.pdf` (end-to-end architecture with optional attention path). Use `fig1.png` (real Muharaf manuscript lines) as the input imagery.
- Panels: Input (real Muharaf manuscript line from `fig1.png`) → Model (CNN) → third panel = attention block, since there's no hardware stage (propose it to Hamza) → Output (writer identity, up to two writers per line, argmax-style).

### Task 6: Figure: IoT intrusion detection (`ids-iot`)
- Sources: `/Users/hamza/Downloads/prev-papers/The Security Paper (IEEE)/figures/`. Candidates `panop2.pdf` (framework: preprocessing → models → deployment on hardware) and `panop1.pdf` (edge / fog / cloud layers).
- Panels: Input (network traffic flows) → Model (lightweight ML / FCNN) → Model on hardware (edge / fog / cloud devices from the paper) → Output (benign vs attack classes, argmax-style). Use the paper's real deployment numbers.

### Task 7: Figure: MCU quantization review (`mcu-quantization-survey`)
- Sources: `/Users/hamza/Downloads/prev-papers/Neural Network Quantization for Microcontrollers/`. Candidates `Fig16.pdf` (deployment pipeline on MCU-class devices), `Fig1.pdf` (survey structure), `Fig7.pdf` (QAT vs PTQ).
- A survey has no single system, so map the 2×2 onto its scope: FP32 model → quantization methods → MCU platform families (ARM / RISC-V / NPU) → applications. Propose that mapping to Hamza at F4.

### Task 8: Figure: cognitive radio spectrum sensing (`qat-spectrum`)
- Source: `/Users/hamza/Documents/GitHub/Spectrum-Sensing/Spectrum Sensing System Diagram.png` (≈3.4:1; Hamza's choice). Chain: PUs → I/Q samples → preprocessing (window N=128/32, z-score) → DeepSense / ParallelCNN with QAT → FP32/INT8 × N=128/32 → Sony Spresense → spectrum-hole detection.
- Re-lay it out to 16:10 (e.g. two rows or a condensed chain). Don't crop it. The Spresense board photo may be reused from the PNG.

---

### Task 9: Final check

- [ ] **Step 1:** `bash _tests/run.sh`. Expected: all pass.
- [ ] **Step 2:** Screenshot `/research/` at 1100px and 375px in light and dark, and show them to Hamza in the visual companion.
- [ ] **Step 3:** `git status` shows nothing uncommitted except `.superpowers/` (ignored). Report to Hamza what's on `research-page` and the figures still pending (student engagement and the six projects).
