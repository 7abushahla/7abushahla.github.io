# Research page: area tags, filter, and website-native paper figures

Date: 2026-11-08
Site: Jekyll on GitHub Pages (`7abushahla.github.io`), page at `/research/`

## Intent

The Research page today is a list of papers grouped by status. It doesn't
show **the breadth of areas Hamza works in, or where they overlap** (Edge AI
runs through wireless, security, vision and quantization work). The figures
next to each paper are screenshots from the papers. They were made for print,
don't read at thumbnail size, and undersell the work. That matters most for
the newest IoTJ indoor-identification paper.

The audience is anyone judging Hamza as a researcher (faculty, admissions,
hiring). In a few seconds they should see what areas he has worked and
published in, how deep he goes in each, and where they meet.

This is an **improvement, not a redesign**. The page must keep looking like
the rest of the site.

## Goals

1. Each paper shows **at least 3 area tags** as chips.
2. A **filter bar** at the top of the page lets a visitor click an area to see
   only the papers tagged with it. With nothing selected, everything shows.
   This is modeled on the category buttons of the QuantizationSurvey site.
3. Each paper's image is replaced by a **figure made for the website**: drawn
   from a real figure in that paper and rebuilt to fit the thumbnail slot.

## Non-goals

- No change to page structure or look beyond the two additions above.
- No keyword chips (e.g. "MAX78002", "mixed-precision"). Only area chips show.
- No search box, multi-select filtering, or URL-shareable filter state.
- No new images for papers whose sources aren't available yet (see Scope).

## Anti-goals (a failure even if it works)

- The page looks redesigned or out of place next to the other pages.
- Anything currently on a paper entry disappears. The year/status column,
  title, authors, venue + impact metrics, link buttons (Paper / arXiv / Code /
  Poster / Slides / Webpage) and the italic summary all stay.
- Invented illustrations, stock art, or "headline number" cards replacing the
  figures. Hamza rejected these explicitly. The figure must come from the
  paper's own content.
- Tags shown as plain text, mono labels, eyebrows or margin notes. Hamza
  rejected these. They must be **defined chips**.

## Decided (by Hamza)

### Page structure: unchanged
- Keep the status sections exactly as now: Publications, Accepted Papers,
  Submitted Papers, Research Projects, each with its current heading and
  blurb, in [research.html](../../../research.html).
- Keep the entry layout in
  [_includes/publication.html](../../../_includes/publication.html): date
  column, thumbnail, body.

### Tag chips (option "C" from the mockups)
- **Placement:** one row of chips at the **end of each entry, after the
  summary**.
- **Content:** area chips only, at least 3 per paper.
- **Style:** the existing `.chip` / `.chip-domain` look in `style.scss`
  (Archivo, ~.75rem, 2px radius, 1px border, dark-ish border for areas).
  This is the "defined chips" look Hamza preferred over every lighter option.
- Clicking a chip on a paper applies the same filter as the filter bar.
  Clicking the active one again clears it.
- The chip matching the active filter is highlighted (teal border, soft teal
  background, using `--live` / `--live-soft`).

### Filter bar
- Placed at the top of the page, under the "Research" page title and above
  the first section.
- An "All" chip (default, selected) plus one chip per area, each with a small
  count of how many papers carry that area.
- Single-select. Choosing an area shows only the papers with that area in
  every section, and **sections with no matching papers hide**.
- Style: **rounded pills** (Hamza's choice over square chips), in the family of
  the existing `.links a` buttons (Archivo, surface background, 1px `--rule`
  border, 999px radius), but smaller (~.78rem, ~4px 11px padding). The selected
  pill is filled teal (`--live`) with white text. The count sits in IBM Plex
  Mono at reduced opacity.

### Area tags per paper

| Paper (file in `_publications/`) | Areas |
|---|---|
| `indoor-rf` | Wireless Communications · Radio · Edge AI · Quantization · Microcontrollers |
| `writer-id` | Arabic Manuscripts · Document Analysis · Computer Vision |
| `ids-iot` | Network Security · IoT · Edge AI |
| `mcu-quantization-survey` | Quantization · Edge AI · Microcontrollers · Survey |
| `qat-spectrum` | Cognitive Radio · Wireless Communications · Edge AI · Quantization |
| `student-engagement` | Computer Vision · Edge AI · Privacy |
| `spectrum-sdp` | Cognitive Radio · Wireless Communications · Edge AI |
| `arabic-htr` | Arabic Manuscripts · Document Analysis · Computer Vision |
| `crl-survey` | Reinforcement Learning · Continual Learning · Survey |
| `crl-webots` | Reinforcement Learning · Continual Learning · Robotics |
| `diffusion-survey` | Generative Models · Diffusion · Survey |

Hamza accepted the draft list and the additions that bring every paper to his
"at least 3" rule (Computer Vision on `arabic-htr`, "Survey" on the three
surveys). The list lives in data and can change freely.

### Paper figures
- Each figure **comes from the paper itself**: usually the overview/method
  figure, sometimes the key result. It is **rebuilt for the website**, not
  screenshotted.
- Rebuilt means:
  - **One fixed aspect ratio for all papers: 16:10.** Today each thumbnail
    keeps its natural ratio (`.pub-thumb { height:auto }`), so rows end up
    different heights.
  - **Readable at the slot size.** Desktop thumbnail column is 168px wide.
    On mobile (≤760px) the thumbnail goes full width. Cut labels and detail to
    what reads at 168px, enlarge the rest, keep the central idea.
  - **Consistent across papers.** Site palette (ink `#11161C`, secondary
    `#5C6670`, rule `#DCE0E1`, accent teal `#0B7A6A`) and site type (Archivo
    for labels, IBM Plex Mono for small annotations), so the set reads as one
    family, not five journals' styles.
- Claude picks the figure from each paper, and Hamza reviews each rebuilt
  figure before it replaces the old one.
- Each figure is made by hand per paper, not by a generic script.

## Scope of this round

**Figures:** only the five papers with sources in
`/Users/hamza/Downloads/prev-papers/` (LaTeX plus original figure files):

| Paper | Source folder | Candidate figures (by caption) |
|---|---|---|
| Indoor ID (`indoor-rf`) | `Indoor Environment Quantization/Figures/` | `pipeline.pdf` (system overview: preprocessing → (α,b) config space → QAT/MPQ → MAX78002 deployment). Also `pareto.pdf` (accuracy vs size Pareto frontier) and the four scene photos (`class/corridor/lab/sports.pdf`) |
| Writer ID (`writer-id`) | `Writer_Identification_IJDAR__Arxiv_/figs/` | `fig6.pdf` (end-to-end architecture, attention path), `fig1.png` (sample Muharaf manuscript lines) |
| IoT IDS (`ids-iot`) | `The Security Paper (IEEE)/figures/` | `panop2.pdf` (framework: preprocessing → models → deployment on hardware), `panop1.pdf` (edge / fog / cloud layers) |
| MCU review (`mcu-quantization-survey`) | `Neural Network Quantization for Microcontrollers/` | `Fig16.pdf` (deployment pipeline on MCUs), `Fig1.pdf` (survey structure), `Fig7.pdf` (QAT vs PTQ paths) |
| Spectrum QAT (`qat-spectrum`) | `/Users/hamza/Documents/GitHub/Spectrum-Sensing/Spectrum Sensing System Diagram.png` (from the paper's code repo, per Hamza) | **Use this system diagram.** It shows PUs → I/Q training samples → preprocessing (window N=128/32, z-score) → DeepSense / ParallelCNN with QAT → FP32/INT8 × N=128/32 configs → Sony Spresense → spectrum-hole detection. It's ~3.4:1, so it must be re-laid out (e.g. two rows or a condensed chain), not cropped, to fit 16:10. The paper's EPS plots (`IEEE Communication Letter QAT/Figures/`) are background only |

`GNSS_*` in that folder is unrelated to the site. Ignore it.

**Tags and filter:** all 11 papers (data only, no sources needed).

**Later:** figures for `student-engagement` and the six course projects,
once Hamza supplies sources (some projects link PDFs on GitHub).

**16:10 applies only to the new figures this round.** The six papers keeping
their old screenshots also keep their natural aspect ratio. No CSS change
forces, crops or letterboxes thumbnails (this respects the existing
`/* natural aspect — never crop the figure */` rule). Rows even out as the
remaining figures are replaced. *(Proposed by Claude, agreed by Hamza.)*

## Constraints

- GitHub Pages Jekyll. No new plugins. The filter is a small vanilla-JS
  enhancement in the page. No frameworks, no build step beyond Jekyll/Sass.
- **Works without JavaScript:** with JS off, all papers show (as today), and
  the filter bar is hidden or inert.
- **Light and dark themes** both exist (`data-theme` on `<html>`). Chips and
  the filter must use the existing CSS tokens so they theme correctly.
- Responsive breakpoints already exist at 900 / 760 / 420px. At ≤760px
  entries go single-column and the thumbnail goes full width. The filter bar
  must wrap cleanly at phone width with no horizontal scroll.
- Keep the existing front-matter fields. Add the areas as a new front-matter
  list field. The existing single `domain:` field is unused in templates and
  can be removed or left alone.

## Left to the builder

- Front-matter field name for areas. *(Suggest `areas:` rather than `tags:`,
  to stay clear of Jekyll's built-in tag handling.)*
- Where the canonical area list, order and labels live (e.g.
  `_data/research_areas.yml`) and the order of chips in the filter bar.
  *(Suggest most-used first.)*
- The exact markup/CSS for the filter bar and chips, within the style rules
  above.
- Figure file format and resolution. Note that an SVG used via `<img>` can't
  load web fonts, so either outline text in SVGs or export raster (e.g.
  1200×750 PNG/WebP). New files go in `images/`, and old images stay until the
  new ones are approved.
- How thumbnails behave in dark mode. *(Today they're white images with a
  border on the dark background. Keeping that is fine.)*
- Which candidate figure to adapt per paper. Hamza reviews the result.
- How to review figures with Hamza: show each candidate side by side with the
  current image at real size before swapping it in.
