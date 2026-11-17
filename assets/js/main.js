/* xNinja homepage interactions – no dependencies */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scale fixed-size compositions (hero visuals, about map) to fit ---------- */
  var stages = Array.prototype.slice.call(document.querySelectorAll(".stage[data-stage]"));
  function fitStages() {
    stages.forEach(function (stage) {
      var base = parseFloat(stage.getAttribute("data-stage"));
      var s = Math.min(1, stage.clientWidth / base);
      stage.style.setProperty("--s", s.toFixed(4));
    });
  }
  fitStages();
  window.addEventListener("resize", fitStages);

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
      if (e.target.closest("a")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("is-open");
      }
    });
  }

  /* ---------- Language dropdown ---------- */
  var langBtn = document.querySelector(".lang__btn");
  var langList = document.getElementById("lang-list");
  if (langBtn && langList) {
    var setLang = function (open) {
      langBtn.setAttribute("aria-expanded", String(open));
      langList.hidden = !open;
    };
    langBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setLang(langList.hidden);
    });
    document.addEventListener("click", function (e) {
      if (!langList.hidden && !e.target.closest(".lang")) setLang(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !langList.hidden) { setLang(false); langBtn.focus(); }
    });
  }

  /* ---------- Skill cards: custom scroll indicator ---------- */
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

  /* ---------- AI prompt typing loop ----------
     Figma spec: N steps @ 80ms, hold 1800ms on full text, clear, pause 500ms, repeat. */
  var prompts = Array.prototype.slice.call(document.querySelectorAll("[data-typing]"));
  if (!reduceMotion && prompts.length) {
    prompts.forEach(function (el) {
      var full = el.getAttribute("data-typing");
      var steps = parseInt(el.getAttribute("data-steps"), 10) || full.length;
      var out = el.querySelector(".prompt__text");
      var timer = null;
      var running = false;

      function frame(i) {
        if (!running) return;
        if (i <= steps) {
          out.textContent = full.slice(0, Math.round((full.length * i) / steps));
          timer = setTimeout(function () { frame(i + 1); }, 80);
        } else {
          timer = setTimeout(function () {
            out.textContent = "";
            timer = setTimeout(function () { frame(1); }, 500);
          }, 1800);
        }
      }
      function start() { if (running) return; running = true; el.classList.add("is-typing"); out.textContent = ""; frame(1); }
      function stop() { running = false; clearTimeout(timer); el.classList.remove("is-typing"); out.textContent = full; }

      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
        }, { threshold: 0.3 }).observe(el);
      } else {
        start();
      }
    });
  }

  /* ---------- FAQ accordion ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".faq__q"), function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq__item");
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      item.classList.toggle("is-open", !open);
      panel.hidden = open;
    });
  });
})();
