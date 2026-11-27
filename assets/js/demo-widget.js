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

  // hover icon: a speech bubble with a "play demo" triangle, and a small shuriken spark (xNinja)
  var chat = '<svg class="demo-fab__chat" viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M15 5.5a10.5 10.5 0 1 0 0 21c1.2 0 2.3-.2 3.4-.5l5.1 2.5-1.1-4.9A10.5 10.5 0 0 0 25.5 16" stroke="#fff" stroke-width="2.4"/>' +
    '<path d="M12.6 11.8v8.4a.8.8 0 0 0 1.2.7l6.6-4.2a.8.8 0 0 0 0-1.4l-6.6-4.2a.8.8 0 0 0-1.2.7z" fill="#fff"/>' +
    '<path class="demo-fab__star" d="M25.5 1.8l1.5 3.4 3.4 1.5-3.4 1.5-1.5 3.4-1.5-3.4-3.4-1.5 3.4-1.5z" fill="#bcd5ff"/>' +
    '<circle cx="25.5" cy="6.7" r=".9" fill="#0156d7"/></svg>';
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
