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

  var chat = '<svg class="demo-fab__chat" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M6.5 8.5h11.5a3.5 3.5 0 0 1 3.5 3.5v5a3.5 3.5 0 0 1-3.5 3.5H12l-4.5 3.5v-3.6A3.5 3.5 0 0 1 3 17v-5a3.5 3.5 0 0 1 3.5-3.5z"/>' +
    '<path d="M24.5 15.5a3 3 0 0 1 1.5 2.6v3.4a3 3 0 0 1-2.4 2.9V27l-3.6-2.6h-3.5" opacity=".6"/>' +
    '<path d="M26 3.5q.4 3.6 4 4-3.6.4-4 4-.4-3.6-4-4 3.6-.4 4-4z" fill="currentColor" stroke="none"/>' +
    '<path d="M3.5 25q.25 2 2.25 2.25-2 .25-2.25 2.25-.25-2-2.25-2.25 2-.25 2.25-2.25z" fill="currentColor" stroke="none" opacity=".75"/></svg>';
  var spark = '<svg class="demo-fab__spark" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">' +
    '<path d="M13 4q1 9.5 10.5 10.5Q14 15.5 13 25q-1-9.5-10.5-10.5Q12 13.5 13 4z"/>' +
    '<path d="M24.5 3q.5 4 4.5 4.5-4 .5-4.5 4.5-.5-4-4.5-4.5 4-.5 4.5-4.5z"/>' +
    '<path d="M24 20q.4 3.1 3.5 3.5-3.1.4-3.5 3.5-.4-3.1-3.5-3.5 3.1-.4 3.5-3.5z"/></svg>';
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
