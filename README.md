# xNinja AI Workhub – English website

Static website for xNinja AI Workhub by Hundred Plus, built from the Figma file **xNinja_website**.
Plain HTML, CSS and JavaScript with no build step and no dependencies, ready for GitHub Pages.

## Pages

| URL | File | Figma frame |
|---|---|---|
| `/` | `index.html` | `/en/home` |
| `/about-us/` | `about-us/index.html` | `/en/about-us` |
| `/skills/xninja-business-process-management/` | `skills/xninja-business-process-management/index.html` | `/en/skills/xninja-business-process-management` |
| `/skills/xninja-knowledge-management/` | `skills/xninja-knowledge-management/index.html` | `/en/skills/xninja-knowledge-management` |
| `/articles/` | `articles/index.html` | — (blog index: latest article + grid; CSS `pages/blog.css`) |
| `/articles/approval-workflow-automation/` | `articles/approval-workflow-automation/index.html` | `/en/articles/approval-workflow-automation` |
| `/articles/maximize-eForm-with-xNinja/` | `articles/maximize-eForm-with-xNinja/index.html` | `/en/articles/maximize-eForm-with-xNinja` |
| `/articles/maximize-eForm-with-xNinja/how-manufacturers-can-digitize-forms-and-approval-workflows/` | `…/index.html` | same path in Figma |
| `/articles/restrict-ai-answers-by-user-permissions/` | `articles/restrict-ai-answers-by-user-permissions/index.html` | `/en/articles/restrict-ai-answers-by-user-permissions` |
| `/apply/` | `apply/index.html` | `/en/apply` (3-step Book a demo form; `assets/js/apply.js`) |
| any missing page | `404.html` | — |

Every page also exists in Traditional Chinese (`/tw/`), Thai (`/th/`) and Bahasa Indonesia (`/id/`).
The Indonesian pages are generated from the English ones by `tools/i18n/i18n.py` (translations in
`tools/i18n/id/strings.json`) — edit English, then run `extract id`, translate new strings, `build id` and `tools/seo.py`.

All links between pages are relative, so the site works under `https://<user>.github.io/en-xninja-new/` and on a custom domain.
`404.html` uses `/en-xninja-new/` paths; change them if the site moves to its own domain.

## Folder structure

```
assets/
  css/
    base.css         tokens (colors, gradients, shadows), fonts, reset, type, buttons   – every page
    layout.css       header + Skills dropdown, mobile menu, footer                       – every page
    components.css   FAQ accordion, section headers, cards, checklists, tags             – every page
    pages/
      home.css       homepage only
      about.css      About Us only
      skill.css      both skill pages (theme via body.skill-page--bpm / --km)
      article.css    all article pages (title, table of contents, prose, tables, callouts)
      blog.css       blog index /articles/ (latest article, article grid, demo band)
  js/main.js         menus, dropdowns, FAQ, homepage animations, table-of-contents highlight
  img/
    common/          logo, icons and backgrounds used on several pages
    home/ about/ skills/ articles/
  fonts/             Montserrat + Sarabun Thai subset (self-hosted, SIL Open Font License)
```

Each page loads `base.css → layout.css → components.css → its page CSS`.
To change a brand color, edit the variables at the top of `base.css`.

## Still to add

- **Video links**: BPM and KM demo videos (skill pages + Approval Workflow article). The cover images are in place; add the link and they become clickable.
- **TikTok link**: "Watch on TikTok — Hundred Plus TH" (end of the Approval Workflow article).
- **Book a Demo**: currently opens an email to service@hundredplus.com. Swap in a booking form when there is one.

## Run locally

```
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.

## Traditional Chinese (Taiwan) version

The `/tw/` folder mirrors every English page in Traditional Chinese (Taiwan) and uses the same CSS, JS and images.
The language menu in the navigation switches between `English` and `繁體中文` on the same page.
Wording follows xninja.biz/tw where that page has it. Text inside illustrations and screenshots (PNG/WebP) is still in English.

## Thai version

The `/th/` folder mirrors every English page in Thai, using the same CSS, JS and images. The language menu offers English, 繁體中文 and ไทย on every page.
Wording follows the old xninja.biz/th site where it had a matching line (homepage headings, challenges, FAQ questions, "นัดหมายสาธิต"); the rest is a new translation.
Product names (xNinja.Business Process Management, Master Skills…) and the "Right When You Need It" slogan stay in English, as on the old Thai site.
