# xNinja AI Workhub – English website

Static homepage for xNinja AI Workhub by Hundred Plus, built from the Figma file
**xNinja_website → `/en/home`** (1280px frame).

No build step and no dependencies: plain HTML, CSS and JavaScript.

## Structure

```
index.html            Homepage
assets/css/styles.css Styles (desktop layout matches the 1280px Figma frame; responsive down to phones)
assets/js/main.js     Mobile menu, language menu, FAQ accordion, skill-card scroll indicator,
                      AI-prompt typing loop, scaling of the hero/map compositions
assets/img/           Images and icons exported from Figma
assets/fonts/         Montserrat (self-hosted, SIL Open Font License – see OFL-LICENSE.txt)
```

## Run locally

```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy with GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)`.

## Notes

- Links to the other pages use the routes from the Figma file (`about-us/`, `skills/xninja-business-process-management/`,
  `skills/xninja-knowledge-management/`, `articles/approval-workflow-automation/`,
  `articles/maximize-eForm-with-xNinja/`). Those pages aren't built yet.
- "Book a Demo" opens an email to service@hundredplus.com; swap in a booking form URL when there is one.
- The hero video is the still image from the design; add the video source when it's available.
- Motion follows the Figma prototype notes (floating cards drift; prompts type in a loop) and is turned off for
  visitors who prefer reduced motion.
