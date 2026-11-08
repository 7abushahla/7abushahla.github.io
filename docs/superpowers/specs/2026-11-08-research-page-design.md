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

1. Each paper shows its broad **area tags** as chips (Hamza later consolidated to 11 broad areas and dropped the ≥3 minimum).
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
  paper's own content, in the approved template below.
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
- Chips on a paper are **labels only, not buttons**. Filtering is the job of
  the top strip alone (Hamza, during the build).
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
| `indoor-rf` | Wireless Communications · Edge AI · Quantization · Microcontrollers |
| `writer-id` | Document Analysis · Computer Vision |
| `ids-iot` | Network Security · Edge AI · Quantization |
| `mcu-quantization-survey` | Quantization · Edge AI · Microcontrollers · Survey |
| `qat-spectrum` | Wireless Communications · Edge AI · Quantization · Microcontrollers |
| `student-engagement` | Computer Vision · Edge AI · Quantization · Microcontrollers |
| `spectrum-sdp` | Wireless Communications · Edge AI |
| `arabic-htr` | Document Analysis · Computer Vision |
| `crl-survey` | Reinforcement Learning · Survey |
| `crl-webots` | Reinforcement Learning · Robotics |
| `diffusion-survey` | Generative Models · Survey |

Hamza accepted the draft list and the additions that bring every paper to his
"at least 3" rule (Computer Vision on `arabic-htr`, "Survey" on the three
surveys). The list lives in data and can change freely.

### Paper figures
- Each figure **comes from the paper itself**: usually the overview/method
  figure, sometimes the key result. It is **rebuilt for the website**, not
  screenshotted.
- **One fixed aspect ratio for all papers: 16:10.** Today each thumbnail
  keeps its natural ratio (`.pub-thumb { height:auto }`), so rows end up
  different heights.
- Hamza reviews each rebuilt figure before it replaces the old one. Each is
  made by hand per paper, not by a generic script.

#### Approved figure template (settled with Hamza on the indoor paper)

The approved figure is the reference for every other paper:
`docs/superpowers/specs/figure-reference/indoor-rf/indoor-rf.html`
(rendered `indoor-rf.png`, with its assets alongside). It went through many
rounds. These rules are what Hamza settled on:

- **Content: a system diagram of the working system, input → output.**
  Exactly four stages: **Input → Model → Model on hardware → Output**. Leave
  out data preprocessing, training pipelines and dataset splits. Papers
  without a hardware stage (writer ID, and the MCU review, which is a survey)
  keep the 2×2 template but put that paper's own key stage in the third
  panel. For example, writer ID could use the attention block, and the survey
  could use the three MCU platform families. Propose that panel to Hamza
  when showing the figure. Don't invent a deployment.
- **Layout: a 2×2 grid of four equal panels** on a 600×375 canvas, with
  arrows between them (right, then a bend down to the second row, then
  right). The arrowhead must clear the bend and land on the panel edge, not
  overlap the line.
- **Panel style:** copy Hamza's NICE 2027 paper figure
  (`/Users/hamza/Documents/GitHub/Thesis/00-Vault/04-Writing/2026-10-04 NICE 2027 Paper/figures/overview-focused.png`):
  a tinted header band with a bold title, thin dark-gray border, 10px
  radius, light body tint, Helvetica.
- **Each panel gets a clearly distinct hue.** Indoor uses: input yellow
  (`#F2DF9C` / `#FBF4DA`), model blue (`#C6DAF0` / `#E8F1FB`), hardware pink
  (`#F1CACA` / `#FBEDED`), output lavender (`#DACDF0` / `#F3EEFB`). Tints that
  are too close to each other were rejected.
- **Color only where it means something.** In the network drawing, node
  color encodes bit width (blue for 8-bit layers, green for 2-bit), with
  matching bit-width tags under the layers. The argmax result uses the same
  green as the network's output layer. Don't copy colors from another
  paper's figure just because they were there.
- **Nothing too small to read at thumbnail size.** No caption or explanation
  lines inside panels (Hamza removed them). Contents are centered in each
  panel and fill it without crowding. Oversized elements were rejected, and
  so were empty-looking panels.
- **Use real things from the paper:** its actual plots, its board photo, and
  its real numbers (the indoor figure shows "< 1 ms latency" and
  "≈ 28 µJ energy", from the paper's best MPQ configuration, 178.8 µs /
  27.871 µJ). Every metric shown gets a value. Don't repeat a word in a panel
  that is already in its title (e.g. the board name).
- **Math is typeset as math** (STIX Two serif, bold Re/Im, italic variables
  and subscripts), not plain text with braces.
- **Output panel:** small, neutral (white) icon tiles for the classes
  (Google Material Symbols Rounded), then an "argmax → [icon] Class" line, as
  in the NICE figure. **Only the argmax result is green.** Highlighting the
  winning tile as well marked the prediction twice, so that was dropped. Room photos were rejected because they're illegible at thumbnail
  size. Score bars were rejected as fitting the NICE paper, not this one.
  Short labels are fine ("Class", not "Classroom").
- **Rejected along the way (don't retry):**
  - invented illustrations
  - "headline number" cards
  - photo collages
  - saturated paper colors behind the network
  - preprocessing and training stages
  - a journal name inside the figure

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
- Figure rendering: author each figure as an HTML page (like the reference)
  and rasterize it with headless Chrome to a 1200×750 PNG
  (`--window-size=600,375 --force-device-scale-factor=2`). New files go in
  `images/`, and old images stay until the new ones are approved.
- How thumbnails behave in dark mode. *(Today they're white images with a
  border on the dark background. Keeping that is fine.)*
- Which candidate figure to adapt per paper. Hamza reviews the result.
- How to review figures with Hamza: show each candidate side by side with the
  current image at real size before swapping it in.
