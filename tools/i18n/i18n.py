#!/usr/bin/env python3
"""
Builds a translated copy of the English site under /<lang>/ (e.g. /id/).

  python3 tools/i18n/i18n.py extract id   # writes tools/i18n/id/strings.json (keeps existing translations)
  python3 tools/i18n/i18n.py build id     # writes id/**/index.html from the English pages + strings.json
  python3 tools/i18n/i18n.py menus        # after adding a language to LANGS: language menu on every page
  python3 tools/seo.py                    # then refresh canonical/hreflang/sitemap

Per-language extras live in tools/i18n/<lang>/config.json: "images" (English image → localized image, applied
to every page) and "replace" (page → exact text replacements, e.g. the homepage architecture diagram SVG).

How text is cut up: every run of text that only contains inline markup (a, strong, em, span, br, …) is one
string. Inline tags become numbered placeholders, e.g.  "Use <0>xNinja eForm</0> to build forms.<1/>"
— keep the placeholders in the translation (they may move). Attributes people read (alt, aria-label,
placeholder, title, data-msg-*, meta description, the Book a Demo widget texts) are strings too.
English pages are the source of truth: edit English, run extract, translate the new strings, run build.
"""
import html, json, os, re, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))

PAGES = [
    "index.html", "about-us/index.html", "apply/index.html",
    "skills/xninja-business-process-management/index.html", "skills/xninja-knowledge-management/index.html",
    "articles/index.html", "articles/approval-workflow-automation/index.html",
    "articles/maximize-eForm-with-xNinja/index.html",
    "articles/maximize-eForm-with-xNinja/how-manufacturers-can-digitize-forms-and-approval-workflows/index.html",
    "articles/restrict-ai-answers-by-user-permissions/index.html",
]
# every language of the site, in menu order: folder prefix, hreflang, menu label, short code on the button
LANGS = [("", "en", "English", "EN"), ("tw/", "zh-Hant-TW", "繁體中文", "繁中"),
         ("th/", "th", "ไทย", "TH"), ("id/", "id", "Bahasa Indonesia", "ID")]

INLINE = {"a", "strong", "b", "em", "i", "span", "br", "code", "sup", "sub", "small", "img", "mark",
          "abbr", "time", "u", "s", "wbr", "kbd"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SKIP = {"script", "style", "svg", "template", "code", "pre"}
ATTRS = {"alt", "aria-label", "placeholder", "title", "data-title", "data-tip", "data-close", "data-callout", "data-typing"}
META = {"description"}
LEFT_ALONE = re.compile(r"^[\s\d.,:;/|·•–—()+%*#&@!?×→←↑↓…\-]*$")


class Node:
    def __init__(self, tag, start, inner_start, parent):
        self.tag, self.start, self.inner_start, self.parent = tag, start, inner_start, parent
        self.end = self.inner_end = None
        self.children = []   # Node or ("text", a, b)
        self.attrs_src = None

    @property
    def is_inline(self):
        return self.tag in INLINE and all(c[0] == "text" if isinstance(c, tuple) else c.is_inline for c in self.children)


class Tree(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for m in re.finditer("\n", src):
            self.lines.append(m.end())
        self.root = Node("#root", 0, 0, None)
        self.cur = self.root
        self.feed(src)
        self.close()
        self.root.inner_end = len(src)

    def pos(self):
        l, c = self.getpos()
        return self.lines[l - 1] + c

    def handle_starttag(self, tag, attrs):
        a = self.pos()
        raw = self.get_starttag_text()
        n = Node(tag, a, a + len(raw), self.cur)
        n.attrs_src = raw
        self.cur.children.append(n)
        if tag in VOID:
            n.end = n.inner_end = n.inner_start
        else:
            self.cur = n

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.cur.tag == tag and tag not in VOID:
            self.cur = self.cur.parent

    def handle_endtag(self, tag):
        a = self.pos()
        n = self.cur
        while n is not self.root and n.tag != tag:
            n = n.parent
        if n is self.root:
            return
        while self.cur is not n:   # close anything left open
            self.cur.inner_end = self.cur.end = a
            self.cur = self.cur.parent
        n.inner_end = a
        n.end = self.src.index(">", a) + 1
        self.cur = n.parent

    def _text(self, a, b):
        if self.cur.children and isinstance(self.cur.children[-1], tuple) and self.cur.children[-1][2] == a:
            self.cur.children[-1] = ("text", self.cur.children[-1][1], b)
        else:
            self.cur.children.append(("text", a, b))

    def handle_data(self, d):
        a = self.pos()
        self._text(a, a + len(d))

    def handle_entityref(self, name):
        a = self.pos()
        self._text(a, a + len(name) + 2)

    def handle_charref(self, name):
        a = self.pos()
        self._text(a, a + len(name) + 3)


def has_text(src, items):
    for it in items:
        if isinstance(it, tuple):
            if src[it[1]:it[2]].strip():
                return True
        elif it.tag not in SKIP and has_text(src, it.children):
            return True
    return False


def runs(src, node, out):
    """Collect (a, b) source ranges that form one translatable string."""
    if node.tag in SKIP:
        return
    run = []

    def flush():
        loose = any(isinstance(it, tuple) and src[it[1]:it[2]].strip() for it in run)
        elems = [it for it in run if not isinstance(it, tuple)]
        if run and not loose and (len(elems) > 1 or (elems and not any(isinstance(c, tuple) and src[c[1]:c[2]].strip() for c in elems[0].children))):
            # only elements side by side (labels, menu items…): each one is its own string
            items = list(run)
            run.clear()
            for it in items:
                if not isinstance(it, tuple):
                    runs(src, it, out)
            return
        if run and has_text(src, run):
            a = run[0][1] if isinstance(run[0], tuple) else run[0].start
            b = run[-1][2] if isinstance(run[-1], tuple) else run[-1].end
            out.append((a, b))
        run.clear()

    for c in node.children:
        if isinstance(c, tuple) or c.is_inline:
            run.append(c)
        else:
            flush()
            runs(src, c, out)
    flush()


TAG = re.compile(r"<(/?)([a-zA-Z][\w-]*)\b[^>]*?(/?)>")


def to_key(raw):
    """Raw HTML run → (key with placeholders, list of tags, leading ws, trailing ws)."""
    lead = raw[:len(raw) - len(raw.lstrip())]
    trail = raw[len(raw.rstrip()):]
    body = raw.strip()
    tags, stack, out, i = [], [], [], 0
    for m in TAG.finditer(body):
        out.append(body[i:m.start()])
        i = m.end()
        closing, name = m.group(1), m.group(2).lower()
        if closing:
            k = stack.pop() if stack else len(tags) - 1
            out.append(f"</{k}>")
            tags.append(m.group(0))
        else:
            k = sum(1 for t in tags if not t.startswith("</"))
            tags.append(m.group(0))
            if name in VOID:
                out.append(f"<{k}/>")
            else:
                stack.append(k)
                out.append(f"<{k}>")
    out.append(body[i:])
    key = re.sub(r"\s+", " ", "".join(out)).strip()
    return key, tags, lead, trail


def unwrap(raw):
    """'<a href=..>Text</a>' → ('<a href=..>', 'Text', '</a>') when one element wraps the whole run."""
    pre, post = "", ""
    while True:
        s = raw.strip()
        m = re.match(r"^<([a-zA-Z][\w-]*)\b[^>]*>", s)
        if not m or m.group(1).lower() in VOID:
            break
        name = m.group(1)
        close = f"</{name}>"
        if not s.endswith(close):
            break
        inner = s[m.end():-len(close)]
        # the opening tag must match the final closing tag (no sibling of the same name)
        depth = 0
        ok = True
        for t in TAG.finditer(inner):
            if t.group(2).lower() == name.lower() and t.group(2).lower() not in VOID:
                depth += -1 if t.group(1) else 1
                if depth < 0:
                    ok = False
                    break
        if not ok or depth != 0 or not inner.strip():
            break
        lead = raw[:len(raw) - len(raw.lstrip())]
        trail = raw[len(raw.rstrip()):]
        pre += lead + m.group(0)
        post = close + trail + post
        raw = inner
    return pre, raw, post


def from_key(text, tags):
    opens = [t for t in tags if not t.startswith("</")]
    closes = {}
    # pair each closing tag with its opening index, in order
    stack, oi = [], 0
    for t in tags:
        if t.startswith("</"):
            closes[stack.pop()] = t
        else:
            name = TAG.match(t).group(2).lower()
            if name not in VOID:
                stack.append(oi)
            oi += 1

    def rep(m):
        k = int(m.group(2))
        if m.group(1):
            return closes[k]
        return opens[k]
    return re.sub(r"<(/?)(\d+)/?>", rep, text)


def strip_seo(s):
    return re.sub(r"\n  <!-- seo:start -->.*?<!-- seo:end -->", "", s, flags=re.S)


def units(s):
    """Yield (a, b, kind) ranges in s to translate. kind: 'run' or 'attr'."""
    tree = Tree(s)
    out = []
    runs(s, tree.root, out)
    for a, b in out:
        yield a, b, "run"
    for m in re.finditer(r"<(?!/)([a-zA-Z][\w-]*)\b[^>]*>", s):
        tag = m.group(0)
        for am in re.finditer(r'\s([\w:-]+)="([^"]*)"', tag):
            name, val = am.group(1), am.group(2)
            translate = (name in ATTRS or name.startswith("data-msg-")) and val.strip() and not LEFT_ALONE.match(html.unescape(val))
            if m.group(1) == "meta" and name == "content":
                nm = re.search(r'name="([^"]+)"', tag)
                translate = bool(nm and nm.group(1) in META)
            if translate:
                yield m.start() + am.start(2), m.start() + am.end(2), "attr"


def page_strings(s):
    found = []
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    if t:
        found.append(html.unescape(t.group(1)).strip())
    for a, b, kind in units(s):
        raw = s[a:b]
        if kind == "attr":
            found.append(raw)
            continue
        if re.search(r"<title>", raw):
            continue
        pre, inner, post = unwrap(raw)
        key, *_ = to_key(inner)
        if key and not LEFT_ALONE.match(html.unescape(re.sub(r"<\d+/?>|</\d+>", "", key))):
            found.append(key)
    return found


def extract(lang):
    path = os.path.join(HERE, lang, "strings.json")
    old = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {}
    new = {}
    for p in PAGES:
        s = strip_seo(open(os.path.join(ROOT, p), encoding="utf-8").read())
        for k in page_strings(s):
            if k not in new:
                new[k] = old.get(k, "")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    json.dump(new, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    todo = sum(1 for v in new.values() if not v)
    print(f"{len(new)} strings, {todo} to translate → {os.path.relpath(path, ROOT)}")


# ---------- build ----------

def rel_to(from_dir, target):
    return os.path.relpath(target, from_dir).replace(os.sep, "/") if target else "./"


def fix_url(url, src_dir, dst_dir):
    if re.match(r"^(?:[a-z][a-z0-9+.-]*:|//|/|#)", url, re.I) or not url:
        return url
    path, _, rest = url.partition("#")
    path, q, query = path.partition("?")
    target = os.path.normpath(os.path.join(src_dir, path)) if path else src_dir
    target = "" if target == "." else target
    is_page = not path or path.endswith("/") or path.endswith(".html")
    if is_page:
        return url   # pages are mirrored under /<lang>/
    new = rel_to(dst_dir or ".", target)
    return new + (q + query if q else "") + ("#" + rest if rest else "")


def lang_menu(base_path, here_prefix, page_dir):
    items = []
    for prefix, code, label, short in LANGS:
        target = (prefix + base_path).rstrip("/") or "."
        href = os.path.relpath(target, page_dir or ".").replace(os.sep, "/")
        href = "./" if href == "." else href + "/"
        cur = ' aria-current="true"' if prefix == here_prefix else ""
        items.append(f'<a href="{href}" lang="{code}" hreflang="{code}"{cur}>{label}</a>')
    return items


def set_lang_menu(s, base_path, prefix, page_dir):
    short = next(x[3] for x in LANGS if x[0] == prefix)
    items = lang_menu(base_path, prefix, page_dir)
    s = re.sub(r'(<div class="dropdown__menu" id="lang-menu" hidden>)(.*?)(\n\s*</div>)',
               lambda m: m.group(1) + "".join("\n            " + i for i in items) + m.group(3), s, count=1, flags=re.S)
    s = re.sub(r'(aria-controls="lang-menu">\s*)\S+(\s*<img)', lambda m: m.group(1) + short + m.group(2), s, count=1)
    return s


def build(lang):
    strings = json.load(open(os.path.join(HERE, lang, "strings.json"), encoding="utf-8"))
    cfg = json.load(open(os.path.join(HERE, lang, "config.json"), encoding="utf-8"))
    prefix = lang + "/"
    hreflang = next(x[1] for x in LANGS if x[0] == prefix)
    missing = set()

    def tr(k):
        v = strings.get(k)
        if not v:
            missing.add(k)
            return k
        return v

    for p in PAGES:
        s = strip_seo(open(os.path.join(ROOT, p), encoding="utf-8").read())
        src_dir = os.path.dirname(p)
        dst = prefix + p
        dst_dir = os.path.dirname(dst)
        base_path = p[:-len("index.html")]

        edits = []
        t = re.search(r"<title>(.*?)</title>", s, re.S)
        edits.append((t.start(1), t.end(1), html.escape(tr(html.unescape(t.group(1)).strip()), quote=False)))
        for a, b, kind in units(s):
            raw = s[a:b]
            if t.start() <= a < t.end():
                continue
            if kind == "attr":
                v = tr(raw)
                edits.append((a, b, v.replace('"', "&quot;")))
                continue
            pre, inner, post = unwrap(raw)
            key, tags, lead, trail = to_key(inner)
            if not key or LEFT_ALONE.match(html.unescape(re.sub(r"<\d+/?>|</\d+>", "", key))):
                continue
            edits.append((a, b, pre + lead + from_key(tr(key), tags) + trail + post))
        edits.sort()
        out, i = [], 0
        for a, b, v in edits:
            if a < i:
                continue   # attribute inside a run already replaced as a whole (translated separately below)
            out.append(s[i:a]); out.append(v); i = b
        out.append(s[i:])
        s = "".join(out)
        # attributes that sat inside translated runs (e.g. alt on an inline img, aria-label on a link)
        def attr_fix(m):
            name, val = m.group(1), m.group(2)
            if (name in ATTRS or name.startswith("data-msg-")) and val in strings and strings[val]:
                return f' {name}="{strings[val].replace(chr(34), "&quot;")}"'
            return m.group(0)
        s = re.sub(r'\s([\w:-]+)="([^"]*)"', attr_fix, s)

        # paths: assets move one level deeper, page links stay the same
        def url_fix(m):
            attr, val = m.group(1), m.group(2)
            if attr == "srcset":
                val = ", ".join(" ".join([fix_url(part.split()[0], src_dir, dst_dir)] + part.split()[1:]) for part in val.split(","))
            else:
                val = fix_url(val, src_dir, dst_dir)
            return f'{attr}="{val}"'
        s = re.sub(r'\b(href|src|srcset|poster|data-src)="([^"]*)"', url_fix, s)
        s = re.sub(r"url\((['\"]?)([^)'\"]+)\1\)", lambda m: f"url({m.group(1)}{fix_url(m.group(2), src_dir, dst_dir)}{m.group(1)})", s)

        s = re.sub(r'<html lang="[^"]*"', f'<html lang="{hreflang}"', s, count=1)
        s = set_lang_menu(s, base_path, prefix, dst_dir)
        for old, new in cfg.get("images", {}).items():
            s = s.replace(old, new)
        for old, new in sorted(cfg.get("replace", {}).get(p, {}).items(), key=lambda kv: -len(kv[0])):
            s = s.replace(old, new)

        os.makedirs(os.path.join(ROOT, dst_dir), exist_ok=True)
        open(os.path.join(ROOT, dst), "w", encoding="utf-8").write(s)
    if missing:
        print(f"{len(missing)} strings not translated yet (left in English):")
        for k in list(missing)[:40]:
            print("  ", k[:110])
    print(f"built {len(PAGES)} pages under /{prefix}")


def menus():
    """Rewrite the language menu on every page of every language (adds new languages, fixes links)."""
    n = 0
    for prefix, *_ in LANGS:
        for p in PAGES:
            f = os.path.join(ROOT, prefix + p)
            if not os.path.exists(f):
                continue
            s = open(f, encoding="utf-8").read()
            new = set_lang_menu(s, p[:-len("index.html")], prefix, os.path.dirname(prefix + p))
            if new != s:
                open(f, "w", encoding="utf-8").write(new); n += 1
    print(f"language menu updated on {n} pages")


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:]
    {"extract": lambda: extract(rest[0]), "build": lambda: build(rest[0]), "menus": menus}[cmd]()
