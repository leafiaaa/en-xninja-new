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
    close: me.getAttribute("data-close") || "Close",
    callout: me.getAttribute("data-callout") || "Have any questions? Feel free to ask us",
    calloutMs: 15000
  };

  // hover icon: a speech bubble with a "play demo" triangle, and a small shuriken spark (xNinja)
  var chat = '<svg class="demo-fab__chat" viewBox="0 0 32 32" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M15 5.5a10.5 10.5 0 1 0 0 21c1.2 0 2.3-.2 3.4-.5l5.1 2.5-1.1-4.9A10.5 10.5 0 0 0 25.5 16" fill="none" stroke="#fff" stroke-width="2.4"/>' +
    '<path d="M12.6 11.8v8.4a.8.8 0 0 0 1.2.7l6.6-4.2a.8.8 0 0 0 0-1.4l-6.6-4.2a.8.8 0 0 0-1.2.7z" fill="#fff"/>' +
    '<path class="demo-fab__star" d="M25.5 1.8l1.5 3.4 3.4 1.5-3.4 1.5-1.5 3.4-1.5-3.4-3.4-1.5 3.4-1.5z" fill="#bcd5ff"/>' +
    '<circle cx="25.5" cy="6.7" r=".9" fill="#0156d7"/></svg>';
  // resting icon: a solid gradient chat bubble with a light shimmer sweeping across it
  var bubblePath = "M10 5h12a7 7 0 0 1 7 7v4.5a7 7 0 0 1-7 7h-8.5l-5.6 4.3a.8.8 0 0 1-1.3-.7l.6-4A7 7 0 0 1 3 16.5V12a7 7 0 0 1 7-7z";
  var spark = '<svg class="demo-fab__spark" viewBox="0 0 32 32" aria-hidden="true"><defs>' +
    '<linearGradient id="demo-fab-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fb3ff"/><stop offset="1" stop-color="#0156d7"/></linearGradient>' +
    '<linearGradient id="demo-fab-shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<clipPath id="demo-fab-clip"><path d="' + bubblePath + '"/></clipPath></defs>' +
    '<path d="' + bubblePath + '" fill="url(#demo-fab-grad)"/>' +
    '<g clip-path="url(#demo-fab-clip)"><rect class="demo-fab__shine" x="-14" y="-4" width="12" height="40" fill="url(#demo-fab-shine)" transform="skewX(-20)">' +
    '<animate attributeName="x" values="-14;40;40" keyTimes="0;.4;1" dur="3.2s" repeatCount="indefinite"/></rect></g></svg>';
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

  // speech bubble above the launcher: shows the first time the launcher appears, for 15 seconds
  var callout = document.createElement("div");
  callout.className = "demo-callout";
  callout.innerHTML = '<button class="demo-callout__text" type="button"></button>' +
    '<button class="demo-callout__x" type="button" aria-label="' + cfg.close + '">' + x + "</button>";
  callout.querySelector(".demo-callout__text").textContent = cfg.callout;

  document.body.appendChild(panel);
  document.body.appendChild(callout);
  document.body.appendChild(fab);

  // the bubble shows twice per visit: when the launcher first appears, and again at the bottom of the page
  var calloutState = "new";   // new → showing → done
  var calloutTimer = 0;
  var bottomShown = false;
  function showCallout(force) {
    if (calloutState !== "new" && !force) return;
    if (isOpen) return;
    clearTimeout(calloutTimer);
    calloutState = "showing";
    callout.classList.add("is-shown");
    calloutTimer = setTimeout(hideCallout, cfg.calloutMs);
  }
  function hideCallout() {
    calloutState = "done";
    clearTimeout(calloutTimer);
    callout.classList.remove("is-shown");
  }
  callout.querySelector(".demo-callout__text").addEventListener("click", function () { hideCallout(); open(); });
  callout.querySelector(".demo-callout__x").addEventListener("click", hideCallout);

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
    hideCallout();
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
    var shown = isOpen || window.scrollY > limit;
    fab.classList.toggle("is-shown", shown);
    if (shown) showCallout();
    // reached the bottom (footer in view): show the bubble once more
    var atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
    if (atBottom && shown && !bottomShown) { bottomShown = true; showCallout(true); }
    callout.classList.toggle("is-away", !shown);   // tuck the bubble away with the launcher
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
