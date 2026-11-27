/* Floating "Book a Demo" launcher (homepages).
   It appears once the visitor scrolls past the hero. Pressing it opens a panel with the
   real 3-step form (apply/?embed=1), loaded the first time the panel opens.
   Texts and the form address come from the <script> tag's data-* attributes. */
(function () {
  "use strict";

  var me = document.currentScript;
  if (!me) return;
  var cfg = {
    form: me.getAttribute("data-form") || "apply/",
    title: me.getAttribute("data-title") || "Book a Demo",
    tip: me.getAttribute("data-tip") || "Book a free demo",
    close: me.getAttribute("data-close") || "Close"
  };

  var chat = '<svg class="demo-fab__chat" viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 14.5h3.5a3 3 0 0 1 3 3v3.5a3 3 0 0 1-2.5 3v2.8l-3.6-2.8h-4.2a3 3 0 0 1-2.4-1.2" stroke="#a9c6f7" stroke-width="2.2"/>' +
    '<path d="M6.5 8h11a3.5 3.5 0 0 1 3.5 3.5v5a3.5 3.5 0 0 1-3.5 3.5H12l-4.5 3.6V20A3.5 3.5 0 0 1 3 16.5v-5A3.5 3.5 0 0 1 6.5 8z" stroke="#fff" stroke-width="2.4"/>' +
    '<path d="M25.5 2.5q.45 3.55 4 4-3.55.45-4 4-.45-3.55-4-4 3.55-.45 4-4z" fill="#fff"/>' +
    '<path d="M5 25.5q.25 1.75 2 2-1.75.25-2 2-.25-1.75-2-2 1.75-.25 2-2z" fill="#fff"/></svg>';
  var spark = '<svg class="demo-fab__spark" viewBox="0 0 32 32" aria-hidden="true">' +
    '<defs><linearGradient id="demo-fab-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fbcff"/><stop offset="1" stop-color="#1765dc"/></linearGradient></defs>' +
    '<g fill="url(#demo-fab-grad)">' +
    '<path d="M11.5 7q1 8.5 9.5 9.5-8.5 1-9.5 9.5-1-8.5-9.5-9.5 8.5-1 9.5-9.5z"/>' +
    '<path d="M22.5 3q.55 4.45 5 5-4.45.55-5 5-.55-4.45-5-5 4.45-.55 5-5z"/>' +
    '<path d="M24 19q.4 3.1 3.5 3.5-3.1.4-3.5 3.5-.4-3.1-3.5-3.5 3.1-.4 3.5-3.5z"/></g></svg>';
  var chevron = '<svg class="demo-fab__close" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12.5l8 8 8-8"/></svg>';
  var bubble = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 3.5V17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>';
  var x = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var fab = document.createElement("button");
  fab.type = "button";
  fab.className = "demo-fab";
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "demo-panel");
  fab.setAttribute("aria-label", cfg.title);
  fab.innerHTML = chat + spark + chevron + '<span class="demo-fab__tip" aria-hidden="true">' + cfg.tip + "</span>";

  var panel = document.createElement("div");
  panel.className = "demo-panel";
  panel.id = "demo-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", cfg.title);
  panel.innerHTML =
    '<div class="demo-panel__head"><span class="demo-panel__title">' + bubble + "<span></span></span>" +
    '<button class="demo-panel__x" type="button" aria-label="' + cfg.close + '">' + x + "</button></div>" +
    '<div class="demo-panel__body"><span class="demo-panel__loading" aria-hidden="true"></span></div>';
  panel.querySelector(".demo-panel__title span").textContent = cfg.title;

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  var body = panel.querySelector(".demo-panel__body");
  var frame = null;
  var isOpen = false;

  function load() {
    if (frame) return;
    frame = document.createElement("iframe");
    frame.className = "demo-panel__frame";
    frame.title = cfg.title;
    frame.src = cfg.form + (cfg.form.indexOf("?") < 0 ? "?" : "&") + "embed=1";
    frame.addEventListener("load", function () { panel.classList.add("is-loaded"); });
    body.appendChild(frame);
  }

  function open() {
    load();
    isOpen = true;
    panel.classList.add("is-open");
    fab.classList.add("is-open", "is-shown");
    fab.setAttribute("aria-expanded", "true");
    fab.setAttribute("aria-label", cfg.close);
    panel.querySelector(".demo-panel__x").focus({ preventScroll: true });
  }

  function close(returnFocus) {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("is-open");
    fab.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("aria-label", cfg.title);
    if (returnFocus !== false) fab.focus({ preventScroll: true });
    update();
  }

  fab.addEventListener("click", function () { if (isOpen) close(); else open(); });
  panel.querySelector(".demo-panel__x").addEventListener("click", function () { close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  // the embedded form asks to close (Esc inside it, or "Back to home" after sending)
  window.addEventListener("message", function (e) {
    if (e.origin === location.origin && e.data === "xn-demo-close") close();
  });

  // show the launcher once the visitor has scrolled past (most of) the hero
  var hero = document.querySelector(".hero");
  var ticking = false;
  function update() {
    ticking = false;
    var limit = hero ? hero.offsetTop + hero.offsetHeight * 0.5 : 400;
    fab.classList.toggle("is-shown", isOpen || window.scrollY > limit);
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
