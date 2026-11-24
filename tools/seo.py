#!/usr/bin/env python3
"""
Adds the technical SEO basics to every page and writes sitemap.xml + robots.txt.

  python3 tools/seo.py

Safe to run again at any time (it replaces its own block between <!-- seo:start --> and <!-- seo:end -->).
Run it after adding a page or an article, and after moving to the real domain:
change BASE below (e.g. "https://www.xninja.biz") and run it again.
"""
import html, json, os, re, datetime

BASE = "https://leafiaaa.github.io/en-xninja-new"   # ← change to the real domain when the site moves

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANGS = {  # folder prefix → (hreflang, og:locale, share image)
    "":    ("en",         "en_US", "assets/img/common/og-image-en.jpg"),
    "tw/": ("zh-Hant-TW", "zh_TW", "assets/img/common/og-image-tw.jpg"),
    "th/": ("th",         "th_TH", "assets/img/common/og-image-th.jpg"),
}
SKIP = {"404.html"}   # gets noindex, not in the sitemap
ORG = {
    "@type": "Organization", "@id": BASE + "/#org", "name": "Hundred Plus Co., Ltd.",
    "brand": {"@type": "Brand", "name": "xNinja AI Workhub"},
    "url": BASE + "/", "logo": BASE + "/assets/img/common/favicon-192.png",
    "email": "service@hundredplus.com", "telephone": "+886-2-2357-8866",
    "address": {"@type": "PostalAddress", "streetAddress": "5F., No.150, Sec. 1, Zhongxiao E. Rd., Zhongzheng Dist.",
                "addressLocality": "Taipei City", "postalCode": "100", "addressCountry": "TW"},
}


def text(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def pages():
    """Yield (url path like 'skills/x/', language prefix, path without language) for every page."""
    for dirpath, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("emails", "assets", "tools", "node_modules")]
        for f in files:
            if not f.endswith(".html"):
                continue
            rel = os.path.relpath(os.path.join(dirpath, f), ROOT).replace(os.sep, "/")
            url = rel[:-len("index.html")] if rel.endswith("index.html") else rel
            prefix = next((p for p in ("tw/", "th/") if url.startswith(p)), "")
            yield rel, url, prefix, url[len(prefix):]


def block(rel, url, prefix, base_path, s, siblings):
    hreflang, locale, image = LANGS[prefix]
    if rel in SKIP:
        return '<meta name="robots" content="noindex">'
    title = text(re.search(r"<title>(.*?)</title>", s, re.S).group(1))
    m = re.search(r'<meta name="description" content="([^"]*)"', s)
    desc = html.unescape(m.group(1)) if m else ""
    full = BASE + "/" + url
    out = [f'<link rel="canonical" href="{full}">']
    for p in LANGS:
        if p in siblings:
            out.append(f'<link rel="alternate" hreflang="{LANGS[p][0]}" href="{BASE}/{p}{base_path}">')
    if "" in siblings:
        out.append(f'<link rel="alternate" hreflang="x-default" href="{BASE}/{base_path}">')
    is_article = base_path.startswith("articles/") and base_path.count("/") > 1
    og = {"og:type": "article" if is_article else "website", "og:site_name": "xNinja AI Workhub",
          "og:title": title, "og:description": desc, "og:url": full, "og:image": f"{BASE}/{image}",
          "og:image:width": "1200", "og:image:height": "630", "og:locale": locale}
    out += [f'<meta property="{k}" content="{html.escape(v, quote=True)}">' for k, v in og.items()]
    out.append('<meta name="twitter:card" content="summary_large_image">')

    graph = []
    if base_path == "":
        graph += [ORG, {"@type": "WebSite", "@id": BASE + "/#site", "url": BASE + "/", "name": "xNinja AI Workhub",
                        "inLanguage": hreflang, "publisher": {"@id": BASE + "/#org"}}]
    if base_path.startswith("skills/"):
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
        graph.append({"@type": "SoftwareApplication", "name": text(h1.group(1)) if h1 else title,
                      "applicationCategory": "BusinessApplication", "operatingSystem": "Web, iOS, Android",
                      "description": desc, "url": full, "inLanguage": hreflang, "publisher": {"@id": BASE + "/#org"}})
    if is_article:
        h1 = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
        t = re.search(r'<time datetime="([^"]+)"', s)
        art = {"@type": "Article", "headline": text(h1.group(1)) if h1 else title, "description": desc,
               "image": f"{BASE}/{image}", "inLanguage": hreflang, "mainEntityOfPage": full,
               "author": {"@type": "Organization", "name": "xNinja AI Workhub"}, "publisher": {"@id": BASE + "/#org"}}
        if t:
            art["datePublished"] = t.group(1)
        graph.append(art)
    qs = re.findall(r'class="faq__q"[^>]*>(.*?)<span class="faq__icon"', s, re.S)
    ans = re.findall(r'<div class="faq__a"[^>]*>(.*?)</div>', s, re.S)
    if qs and len(qs) == len(ans):
        graph.append({"@type": "FAQPage", "inLanguage": hreflang, "mainEntity": [
            {"@type": "Question", "name": text(q), "acceptedAnswer": {"@type": "Answer", "text": text(a)}}
            for q, a in zip(qs, ans)]})
    if graph:
        data = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=1)
        out.append('<script type="application/ld+json">\n' + data.replace("</", "<\\/") + "\n  </script>")
    return "\n  ".join(out)


def main():
    all_pages = list(pages())
    by_base = {}
    for rel, url, prefix, base_path in all_pages:
        by_base.setdefault(base_path, set()).add(prefix)
    for rel, url, prefix, base_path in all_pages:
        path = os.path.join(ROOT, rel)
        s = open(path, encoding="utf-8").read()
        s = re.sub(r"\n  <!-- seo:start -->.*?<!-- seo:end -->", "", s, flags=re.S)
        new = "\n  <!-- seo:start -->\n  " + block(rel, url, prefix, base_path, s, by_base[base_path]) + "\n  <!-- seo:end -->"
        anchor = re.search(r'<meta name="description"[^>]*>', s) or re.search(r"</title>", s)
        s = s[:anchor.end()] + new + s[anchor.end():]
        open(path, "w", encoding="utf-8").write(s)

    today = datetime.date.today().isoformat()
    rows = []
    for rel, url, prefix, base_path in sorted(all_pages, key=lambda x: (x[3], x[2])):
        if rel in SKIP:
            continue
        alts = "".join(f'\n    <xhtml:link rel="alternate" hreflang="{LANGS[p][0]}" href="{BASE}/{p}{base_path}"/>'
                       for p in LANGS if p in by_base[base_path])
        rows.append(f"  <url>\n    <loc>{BASE}/{url}</loc>\n    <lastmod>{today}</lastmod>{alts}\n  </url>")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(rows) + "\n</urlset>\n")
    open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(
        f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")
    print(f"{len(all_pages)} pages updated, {len(rows)} in sitemap.xml")


if __name__ == "__main__":
    main()
