/* xNinja site interactions — shared by every page, no dependencies.
   Each block only runs if its elements exist on the page. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Scale fixed-size compositions (hero visuals, about map) ---------- */
  var stages = $$(".stage[data-stage]");
  function fitStages() {
    stages.forEach(function (stage) {
      var s = Math.min(1, stage.clientWidth / parseFloat(stage.getAttribute("data-stage")));
      stage.style.setProperty("--s", s.toFixed(4));
    });
  }
  if (stages.length) { fitStages(); window.addEventListener("resize", fitStages); }

  /* ---------- Sticky header: add a shadow once the page has scrolled ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveal: sections after the hero fade and rise in ---------- */
  var canObserve = "IntersectionObserver" in window && !reduceMotion;
  var revealEls = $$(".hero ~ section:not(.challenges), .feature, .ai-skills__inner > *, .ai-skill");
  if (revealEls.length && canObserve) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealIO.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function (el) { el.classList.add("reveal"); revealIO.observe(el); });
  }

  /* ---------- Expanding panels (homepage challenges, skill-page AI skills): the dark panel widens to full bleed
     while the section crosses the viewport (--grow 0 → 1 on the way in, 1 → 0 on the way out). ---------- */
  var panels = $$(".challenges, .ai-skills");
  if (panels.length && !reduceMotion) {
    var smooth = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    var growTicking = false;
    var updateGrow = function () {
      growTicking = false;
      var vh = window.innerHeight, hh = header ? header.offsetHeight : 0;
      panels.forEach(function (panel) {
        var r = panel.getBoundingClientRect();
        var enter = (vh - r.top) / (vh * 0.7);          // full width once the top is ~30% down the screen
        var leave = (r.bottom - hh) / (vh * 0.7);       // narrows again as the bottom heads under the header
        panel.style.setProperty("--grow", smooth(Math.min(enter, leave)).toFixed(3));
        if (r.top < vh * 0.6) panel.classList.add("is-entered");   // homepage challenge cards rise in
      });
    };
    panels.forEach(function (panel) { panel.classList.add("grow-panel", "is-growing"); });
    updateGrow();
    window.addEventListener("scroll", function () { if (!growTicking) { growTicking = true; window.requestAnimationFrame(updateGrow); } }, { passive: true });
    window.addEventListener("resize", updateGrow);
  }

  /* ---------- About: "800+ customers" counts up quickly, slightly blurred until it lands ---------- */
  var counter = document.querySelector("[data-count]");
  if (counter && canObserve) {
    var target = parseInt(counter.getAttribute("data-count"), 10);
    counter.textContent = "0";
    var countIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      countIO.disconnect();
      var start = null, duration = 1100;
      counter.classList.add("is-counting");
      var step = function (now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        counter.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) window.requestAnimationFrame(step); else counter.classList.remove("is-counting");
      };
      window.setTimeout(function () { window.requestAnimationFrame(step); }, 500);
    }, { threshold: 0.6 });
    countIO.observe(counter);
  }

  /* ---------- Solutions Architecture: play the layer-by-layer animation once in view ---------- */
  var archSvg = document.querySelector(".arch-svg");
  if (archSvg && canObserve) {
    archSvg.classList.add("arch-svg--ready");
    var archIO = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { archSvg.classList.add("is-playing"); archIO.disconnect(); }
    }, { threshold: 0.4 });
    archIO.observe(archSvg);
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a[href]")) { toggle.setAttribute("aria-expanded", "false"); menu.classList.remove("is-open"); }
    });
  }

  /* ---------- Dropdowns (Skills, language) ---------- */
  var dropdowns = $$(".dropdown");
  function setDropdown(dd, open) {
    var btn = dd.querySelector(".dropdown__btn");
    var list = document.getElementById(btn.getAttribute("aria-controls"));
    btn.setAttribute("aria-expanded", String(open));
    list.hidden = !open;
  }
  dropdowns.forEach(function (dd) {
    var btn = dd.querySelector(".dropdown__btn");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = btn.getAttribute("aria-expanded") !== "true";
      dropdowns.forEach(function (other) { if (other !== dd) setDropdown(other, false); });
      setDropdown(dd, open);
    });
  });
  document.addEventListener("click", function (e) {
    dropdowns.forEach(function (dd) { if (!dd.contains(e.target)) setDropdown(dd, false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    dropdowns.forEach(function (dd) {
      var btn = dd.querySelector(".dropdown__btn");
      if (btn.getAttribute("aria-expanded") === "true") { setDropdown(dd, false); btn.focus(); }
    });
  });

  /* ---------- Homepage: skill cards scroll indicator ---------- */
  var scroller = document.querySelector(".skills__scroller");
  var track = document.querySelector(".scrollbar");
  var thumb = document.querySelector(".scrollbar__thumb");
  if (scroller && track && thumb) {
    var updateThumb = function () {
      var max = scroller.scrollWidth - scroller.clientWidth;
      var trackW = track.clientWidth;
      var thumbW = Math.max(40, trackW * (scroller.clientWidth / scroller.scrollWidth));
      thumb.style.width = thumbW + "px";
      thumb.style.transform = "translateX(" + (max > 0 ? (scroller.scrollLeft / max) * (trackW - thumbW) : 0) + "px)";
      track.style.visibility = max > 1 ? "visible" : "hidden";
    };
    scroller.addEventListener("scroll", updateThumb, { passive: true });
    window.addEventListener("resize", updateThumb);
    updateThumb();
  }

  /* ---------- Homepage: AI prompt typing loop ----------
     Figma spec: N steps @ 80ms, hold 1800ms on full text, clear, pause 500ms, repeat. */
  if (!reduceMotion) {
    $$("[data-typing]").forEach(function (el) {
      var full = el.getAttribute("data-typing");
      var steps = parseInt(el.getAttribute("data-steps"), 10) || full.length;
      var out = el.querySelector(".prompt__text");
      var timer = null, running = false;
      function frame(i) {
        if (!running) return;
        if (i <= steps) {
          out.textContent = full.slice(0, Math.round((full.length * i) / steps));
          timer = setTimeout(function () { frame(i + 1); }, 80);
        } else {
          timer = setTimeout(function () { out.textContent = ""; timer = setTimeout(function () { frame(1); }, 500); }, 1800);
        }
      }
      function start() { if (running) return; running = true; el.classList.add("is-typing"); out.textContent = ""; frame(1); }
      function stop() { running = false; clearTimeout(timer); el.classList.remove("is-typing"); out.textContent = full; }
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
        }, { threshold: 0.3 }).observe(el);
      } else { start(); }
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$(".faq__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq__item");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      // one answer at a time: close the others in this FAQ before opening a new one
      if (!open) {
        $$(".faq__q[aria-expanded='true']", btn.closest(".faq") || document).forEach(function (other) {
          if (other === btn) return;
          other.setAttribute("aria-expanded", "false");
          other.closest(".faq__item").classList.remove("is-open");
          document.getElementById(other.getAttribute("aria-controls")).hidden = true;
        });
      }
      btn.setAttribute("aria-expanded", String(!open));
      item.classList.toggle("is-open", !open);
      panel.hidden = open;
    });
  });

  /* ---------- Articles: highlight the current section in the table of contents ---------- */
  var tocLinks = $$(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      tocLinks.forEach(function (a) { var id = a.getAttribute("href").slice(1); if (!current && visible[id]) current = id; });
      if (current) tocLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + current); });
    }, { rootMargin: "-20% 0px -60% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }
})();
