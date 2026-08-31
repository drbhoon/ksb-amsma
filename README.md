# AMSMA Website Redesign Mockups

Three static, responsive design directions for the AMSMA Landing and About pages:

1. **Foundation** — editorial and institutional
2. **Living Landscapes** — cinematic, footage-led environmental storytelling
3. **National Network** — modern membership and association platform

## View the concepts

Open `index.html`, then choose a direction. Each concept has a **Landing / About** switch.

For the most reliable local video playback, serve the folder:

```bash
python3 -m http.server 8765
```

Then open <http://127.0.0.1:8765/>.

## Package notes

- Static HTML, CSS and JavaScript; no build step or external dependency.
- Uses the supplied aggregate-production, nesting-habitat, and quarry-water footage.
- The removed heading does not appear anywhere in the four HTML pages.
- No invented scale statistics, partners, awards, testimonials, or registration-completion claims.
- Production deployment and the upstream GitHub repository were not changed.

See `design-notes.md` for the concept rationale, source boundaries, recommendation, and implementation guidance.
