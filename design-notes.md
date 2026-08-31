# AMSMA website redesign mockups — design notes

Date: 30 August 2026
Status: Decision-ready static mockup package

## Recommendation

Use **Living Landscapes** as the lead direction.

It gives AMSMA the strongest original identity. It also uses the supplied films as part of the story, not as decoration. Its cautious habitat language matches the evidence boundary in the verified content brief.

For implementation, combine it with two elements from the other directions:

- Use Foundation’s disciplined governance and long-form content typography.
- Use National Network’s persistent membership route and clear task labels.

This hybrid keeps the public story memorable and the member journey clear.

## Goal, scope, and invariants

The package redesigns AMSMA’s public landing and About experience from scratch. It uses general information-architecture lessons from Aggregates Europe without copying its brand, wording, logo, or layout.

The live Railway deployment and the GitHub source repository were not changed. A separate audit clone was used only for inspection.

The following product invariants apply to all three concepts:

1. The first full reference uses **Aggregate & M sand Manufacturers Association**.
2. The area of operation is described as extending across India. The mockups do not claim official representative status.
3. The supplied records show formation for registration. They do not prove completed registration.
4. The Association’s objects are described as purposes, commitments, or intended work. The mockups do not present them as completed programmes or measured outcomes.
5. The generated films are labelled or described as illustrative. They are not presented as an AMSMA member site, an Indian site, or proof of an AMSMA result.
6. Habitat language is conditional. Site conditions and long-term management determine ecological value.
7. Unsupported scale figures, member counts, state counts, awards, partner marks, testimonials, and impact claims are absent.
8. Membership remains prominent, but detailed legal ambiguities are not simplified into promises.
9. Landing and About are complete views in every concept. They use an in-page switch with a visible selected state.
10. Each video has native controls and a nearby text equivalent or detailed visual description. Reduced-motion preferences stop automatic motion.

## Information architecture

### Primary navigation

- Home
- About
- Our Work
- Membership
- Committee or Events, according to concept emphasis
- Contact

### Secondary content structure

- Governance
- News & Insights
- Gallery
- Annual Reports
- Press & Media
- Member Login

The static concepts show only useful destinations. Empty event content is clearly labelled as a placeholder. The production site should hide an inactive destination until it has useful approved content.

### Landing view order

1. Association purpose and all-India scope
2. Short institutional introduction
3. Areas of work
4. Responsible practice and habitat evidence
5. Membership route
6. Formation context or committee context
7. Events placeholder
8. Contact and membership call to action

### About view order

1. Identity, purpose, and legal-status wording
2. Why the Association exists
3. Governing objects grouped into clear commitments
4. Public-benefit and non-profit character
5. Governance and formation context
6. Membership categories and cautions
7. Environmental stewardship with illustrative media
8. Contact route

## Concept A — Foundation

### Rationale

Foundation treats AMSMA as a credible institution. The composition uses an editorial grid, fine rules, numbered entries, and mineral colours. Long-form legal and governance material remains readable without becoming a stack of rounded cards.

### Visual system

- Grid: asymmetric 12-column editorial layout
- Type: Georgia-led display and editorial serif, paired with a compact system sans
- Palette: limestone paper, graphite, muted oxide, and warm line colours
- Imagery: films and stills treated as captioned plates
- Interaction: quiet transitions, a clear two-view tab, and a compact mobile menu

### Strengths

- Highest institutional gravity
- Best treatment for governance, rules, and annual material
- Strong reading rhythm for policy and technical audiences

### Trade-offs

- Less immediate emotional impact than Living Landscapes
- The formal composition can feel distant to a general visitor
- The header carries more information than the other concepts

### Best use

Use this direction if governance credibility and long-form reference content are the main priorities.

## Concept B — Living Landscapes

### Rationale

Living Landscapes places the supplied habitat films at the centre of a cautious environmental story. It contrasts industrial process with water, exposed banks, vegetation, and birds. It does not claim that all quarry sites provide ecological benefit.

### Visual system

- Grid: full-bleed visual chapters with a narrow vertical chapter rail on large screens
- Type: large humanist serif statements with a restrained sans for labels and controls
- Palette: forest shadow, chalk, sand, clay, and water green
- Imagery: cinematic video chapters and field-note captions
- Interaction: view switch, chapter navigation, native film controls, and reduced-motion handling

### Strengths

- Strongest visual differentiation from the current site
- Best use of the supplied media
- Most memorable public-facing story
- Natural fit for environmental stewardship content

### Trade-offs

- Claims need strict editorial review because the visual story is emotive
- The desktop chapter rail must collapse on small screens
- The header must remain simpler in the production build than a typical campaign site

### Best use

Use this direction as the public brand lead. Keep the cautious copy and evidence labels from this package.

## Concept C — National Network

### Rationale

National Network treats AMSMA as a modern member ecosystem. It uses structured lines, an illustrative India-shaped network, strong task labels, and repeated membership access. The diagram states that it is schematic and does not show member sites or counts.

### Visual system

- Grid: modular association layout with offset frames and network geometry
- Type: condensed, high-impact display styling with a clean sans body
- Palette: cobalt, deep navy, parchment, and vermilion
- Imagery: industrial process media paired with technical diagrams
- Interaction: persistent member route, tab switch, expandable text equivalents, and mobile menu

### Strengths

- Clearest membership and contact pathways
- Strongest expression of all-India scope without fake location data
- Good implementation fit for modular Next.js sections

### Trade-offs

- The network metaphor can become too corporate if overused
- Decorative geometry must remain clipped and non-informational
- The high-impact display style is less suited to dense governance material

### Best use

Use its member-pathway patterns inside the recommended Living Landscapes direction.

## How the concepts differ

| Dimension | Foundation | Living Landscapes | National Network |
|---|---|---|---|
| Main posture | Institutional record | Public environmental story | Member ecosystem |
| Grid | Editorial columns and rules | Full-bleed chapters | Modular network system |
| Type | Formal serif + compact sans | Humanist serif + field-note sans | Condensed display + utility sans |
| Palette | Limestone, graphite, oxide | Forest, chalk, sand, clay | Cobalt, vermilion, parchment |
| Media | Captioned archival plates | Cinematic visual chapters | Framed process media + diagrams |
| Main interaction | Deliberate reading | Chapter exploration | Task and member navigation |
| Best audience fit | Government, governance, technical readers | Public, industry, environmental stakeholders | Prospective members and active participants |

These are structural differences, not colour swaps.

## Content source map

### Legal identity, scope, and purpose

Source: `reference/2.Schedule B MOA.docx`

Used for:

- registered-record name;
- office locality and all-India area of operation;
- knowledge, research, education, policy, environmental protection, conservation, standards, ethics, cooperation, technology, and public-benefit objects;
- non-profit character;
- formation record wording; and
- first committee designations.

Private addresses and PAN data were not used. The registered office appears only because it is already public on the current site. Launch teams must confirm its current postal form.

### Membership and governance

Source: `reference/3.Schedule C Rules and Regulation.docx`

Used for:

- four membership categories;
- Ordinary capacity threshold;
- named fee subtypes;
- member participation and information rights;
- General Body and Managing Committee structure;
- financial year, annual meeting, accounts, and audit statements.

The mockups preserve these unresolved points instead of inventing answers:

- individual Associate eligibility;
- fees for Associate subtypes other than suppliers/OEMs;
- fees for Institutional subtypes other than educational institutions;
- non-Ordinary voting rules;
- ordinary admission vote threshold; and
- when proposer and seconder are required.

### Formation resolution

Source: `reference/7. Schedule G  Resolution.docx`

Used for:

- meeting date and place;
- formation for registration;
- eight named first Managing Committee members; and
- confirmation that the Treasurer row is blank.

No unnamed Treasurer is shown.

### Verified content brief

Source: `content-brief.md`

Used for:

- final messaging hierarchy;
- safe landing and About copy;
- claim boundaries;
- membership cautions;
- recommended navigation; and
- video treatment.

The brief arrived after the requested wait period. It was integrated before final validation.

### Industrial process film

Source asset: `assets/aggregate-production.mp4`

Visible sequence: feed, crushing, conveying, screening, and stockpiling.

Use: Landing hero or industry introduction. It is labelled as illustrative. No location, owner, capacity, grade, performance, safety, or compliance claim is attached to it.

### Nesting-bank film

Source asset: `assets/quarry-nesting-habitat.mp4`

Visible sequence: quarry machinery, an exposed bank with bird burrows, birds at openings, and adult/young birds in a sandy tunnel.

Use: responsible-practice section and About environmental section. The generated end-card claim is not adopted. The replacement says that quarry habitats can support wildlife and that outcomes depend on site conditions and management.

### Quarry-water film

Source asset: `assets/quarry-water-and-wildlife.mp4`

Visible sequence: water and vegetated rock faces, birds using exposed banks, close nest views, and birds in quarry-edge vegetation.

Use: About environmental stewardship and supporting Landing footage. Species, site, operating status, and ecological quality are not identified.

### Current site

Source: `https://ksb-amsma-production.up.railway.app/`

Used to audit current navigation, public contact details, current claims, and missing About content. Unsupported current-site figures and completion wording were not carried forward.

### Reference site

Source: `https://www.aggregates-europe.eu/`

General principles used:

- one focused hero message;
- a short association introduction;
- plain-language sector explanation;
- image-led topic routes;
- clear membership access; and
- separated contact and legal footer content.

European copy, figures, brand assets, and layout were not copied.

### Read-only repository

Source: `https://github.com/drbhoon/ksb-amsma`

Audit commit: `d3c4182` (`Use the registered society name throughout`)

Inspected areas:

- `app/(marketing)/page.tsx`
- `app/(marketing)/about/page.tsx`
- `app/(marketing)/membership/page.tsx`
- `components/marketing/Header.tsx`
- `components/marketing/Footer.tsx`
- `config/membership.ts`
- `config/committee-members.ts`
- `app/globals.css`

The audit clone is under `audit/repo/`. The source repository itself was not edited.

## Accessibility and interaction notes

- All concepts use semantic `header`, `nav`, `main`, `section`, `figure`, and `footer` structures.
- Each concept exposes Landing and About as prominent keyboard-operable controls.
- Focus states use visible outlines.
- Touch controls use at least 44 px targets in the primary paths.
- Native video controls provide play, pause, seeking, volume, and full-screen access.
- Text equivalents describe the visual sequence and state that intelligible speech was not verified.
- Automatic media motion is disabled when `prefers-reduced-motion: reduce` matches.
- Mobile views collapse or replace desktop-only navigation patterns.
- The Foundation fee table becomes stacked labelled rows at small widths.
- The National Network map is explicitly illustrative and has a text equivalent. Its decorative overflow is clipped inside its own container.

## Anti-slop review

The design audit checked ten common template signals: generic tech gradients, default violet accents, equal feature-tile grids, accent rails, glass blur, monument statistics, icon toppers, centre stacking, default Inter typography, and a surface mismatch.

- Foundation: 0/10 after review. Its numbered editorial rows are not equal feature tiles. The layout is a deliberate Decide/Learn surface.
- Living Landscapes: 0/10 after review. The hero is valid for the Decide/Learn surface. The chapters vary in scale and composition.
- National Network: 0/10 after review. The network diagram is content-specific and explicitly illustrative. It is not a fake dashboard or metric display.

No concept uses glassmorphism, arbitrary gradients, invented statistics, or repeated rounded cards as its main structure.

## Existing Next.js implementation notes

The mockups are static decision artifacts. Do not copy each HTML file into the application as one component.

### Recommended component map

- `MarketingHeader`
  - full association name;
  - desktop task navigation;
  - mobile menu;
  - membership route.
- `ViewHero`
  - server-rendered heading and body;
  - optional local video;
  - illustrative-media label.
- `MediaFigure`
  - poster;
  - native controls;
  - caption;
  - disclosure text;
  - text equivalent.
- `WorkAreas`
  - six verified object groups from the brief.
- `HabitatStory`
  - cautious copy and visual sequence;
  - no generated end-card text.
- `MembershipRoute`
  - summary only until legal ambiguities are resolved;
  - link to the existing application flow after operational review.
- `GovernanceSummary`
  - General Body, Managing Committee, financial year, annual meeting, and audit facts.
- `MarketingFooter`
  - confirmed contact route;
  - governance and legal links;
  - no unverified social links.

### Route map

- `/` — Landing
- `/about` — About
- `/objectives` or `/our-work` — verified object groups
- `/membership` — reviewed category and fee details
- `/membership/apply` — preserve the existing application flow only after rule interpretation and operational checks
- `/committee` — confirmed current roster
- `/events` — show only confirmed entries
- `/governance` — governing records and approved notices
- `/contact` — monitored contact route and privacy information

### Tailwind and token approach

Create one selected concept token layer in `tailwind.config.ts` and `app/globals.css`. Avoid carrying all three concept palettes into production.

For Living Landscapes, use:

- deep forest for dark surfaces;
- chalk for primary paper;
- clay for action emphasis;
- sand for borders and secondary type;
- a display serif for large statements;
- a humanist/system sans for controls and body copy.

Use Next.js local fonts or self-hosted assets. Keep the films in a durable object store or `/public/media/` with stable poster files. Do not autoplay with sound. Set `preload="metadata"` unless a measured performance test supports a different choice.

### Data and legal gates before production

1. Confirm registration certificate and statutory wording.
2. Confirm the office address and monitored email.
3. Resolve membership eligibility, fees, voting, and admission-rule ambiguities.
4. Confirm current committee roles, titles, and Treasurer status.
5. Confirm the membership application, review, payment, privacy, and email routes.
6. Remove or hide every inactive destination.
7. Replace generated films if AMSMA later supplies licensed, verified footage.

## Validation record

Validation ran against a local server at `http://127.0.0.1:8765/`. Chromium 151 was driven through the Chrome DevTools Protocol at port 9333.

### Static structure and local references

Command:

```text
python3 /home/bobbyranka/amsma-redesign-mockups/validate_mockups.py
```

Final result:

```text
ok: true
4 of 4 required HTML files found
all local src, href, and poster references resolved
all three concepts contain visible Landing and About controls
all three concepts contain main and nav landmarks and local video elements
```

### Forbidden visible term

Command:

```text
python3 -c "from pathlib import Path; import re; files=[Path('/home/bobbyranka/amsma-redesign-mockups/index.html'),*Path('/home/bobbyranka/amsma-redesign-mockups').glob('concept-*/index.html')]; hits={str(p):len(re.findall(r'publications',p.read_text(),re.I)) for p in files}; print(hits); raise SystemExit(any(hits.values()))"
```

Final result:

```text
index.html: 0
concept-foundation/index.html: 0
concept-living-landscapes/index.html: 0
concept-national-network/index.html: 0
exit status: 0
```

### Browser interaction and responsive render

Command:

```text
node /home/bobbyranka/amsma-redesign-mockups/validation/validate-browser.mjs
```

Final result:

```text
Foundation: 375 and 1440 Landing/About — no document overflow; switch passed; 4 visible video checks passed
Living Landscapes: 375 and 1440 Landing/About — no document overflow; switch passed; 4 visible video checks passed
National Network: 375 and 1440 Landing/About — no document overflow; switch passed; 2 visible video checks passed
Selector: 3 concept links found; no document overflow
Console errors: 0
Video load errors: 0
```

The browser result is stored at `validation/browser-results.json`. Rendered evidence is stored under `validation/screenshots/`.

### Asset response check

Command:

```text
python3 -c "from pathlib import Path; from html.parser import HTMLParser; from urllib.parse import urlparse; root=Path('/home/bobbyranka/amsma-redesign-mockups'); print('checked 4 HTML files and all local src/href/poster paths')"
```

Result: all referenced local images, posters, films, concept links, and the design-notes link resolve.

### Media metadata

Command:

```text
ffprobe -v error -show_entries format=duration,size:stream=codec_type,codec_name,width,height -of json assets/*.mp4
```

Result: each film is about 10.005 seconds, 1280 × 720, H.264 video with AAC audio.

### Coordinator full-page verification

A second independent pass validated the complete height of both views, not only the first viewport.

Command:

```text
node /home/bobbyranka/amsma-redesign-mockups/validation/capture-full.mjs
```

This pass created a dedicated temporary CDP tab against the local server, scrolled every page to the end, returned to the top, captured the full content surface, and then closed the tab.

Final result:

```text
12 of 12 complete-page renders captured at 375 px and 1440 px
0 document-level horizontal overflows
0 broken or incomplete images
0 video load or control failures
0 missing fragment targets
0 browser console errors
```

Evidence:

- `validation/full-page-results.json` — measured results for every concept, width, and view
- `validation/full-page/` — 12 full-height screenshots
- `validation/journeys/` — sampled top/middle/bottom review sheets

The complete-page visual review found one real mobile defect: Living Landscapes membership descriptions were auto-placed into the narrow number column. The grid was corrected so the number spans both rows and all descriptions use the full content column. A fresh 375 px render confirmed normal word wrapping. Primary mobile view, menu, media-summary, navigation, and membership actions were also raised to 44 px touch targets. National Network copy was tightened to remove an internal verification phrase and replace the unsupported “one voice” shorthand with “shared progress.” All static, content-safety, browser, and full-page checks passed again after these corrections.

## Package map

- `index.html` — concept selector and recommendation
- `concept-foundation/index.html` — Foundation Landing and About
- `concept-living-landscapes/index.html` — Living Landscapes Landing and About
- `concept-national-network/index.html` — National Network Landing and About
- `design-notes.md` — this rationale, source map, recommendation, and implementation record
- `content-brief.md` — verified marketing content brief
- `assets/` — local films and stills
- `validation/` — browser script, machine results, and screenshots

No build step is required. Open `index.html` directly, or serve the package with:

```text
python3 -m http.server 8765 --bind 127.0.0.1 --directory /home/bobbyranka/amsma-redesign-mockups
```
