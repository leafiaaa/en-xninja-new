/* Book a demo — 3-step form: Next checks the current step's required fields, Back goes to the previous step.
   "Book Now" sends the answers to the Google Apps Script below, which emails them to you and sends the
   applicant the thank-you email (see emails/README.md). */
(function () {
  "use strict";

  // ← paste your Apps Script web app URL here (ends with /exec). Leave empty to disable sending.
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbzjQKjZs_9eMd0qOgkNORbV98uvxe1cmlM9TfIDg5kCP7eneLnqBuGe-1voRc6Rkkd1wA/exec";

  var form = document.querySelector(".apply-form");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var live = form.querySelector(".apply__live");
  var msg = {
    required: form.getAttribute("data-msg-required") || "This field is required.",
    email: form.getAttribute("data-msg-email") || "Please enter a valid email address."
  };
  var current = 0;

  // earliest demo date = today
  var date = form.querySelector('input[type="date"]');
  if (date) {
    var d = new Date(), pad = function (n) { return (n < 10 ? "0" : "") + n; };
    date.min = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function errorFor(input) { return document.getElementById(input.id + "-error"); }

  function check(input) {
    var err = errorFor(input);
    var text = "";
    if (!input.checkValidity()) {
      text = input.validity.valueMissing ? msg.required : (input.type === "email" ? msg.email : input.validationMessage);
    }
    input.setAttribute("aria-invalid", text ? "true" : "false");
    if (err) err.textContent = text;
    return !text;
  }

  function validStep(i) {
    var firstBad = null;
    steps[i].querySelectorAll(".input").forEach(function (input) {
      if (!check(input) && !firstBad) firstBad = input;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  function show(i) {
    steps[current].hidden = true;
    current = i;
    var step = steps[current];
    step.hidden = false;
    step.classList.remove("is-entering"); void step.offsetWidth; step.classList.add("is-entering");
    var title = step.querySelector(".step__title");
    if (live && title) live.textContent = title.textContent;
    var card = form.closest(".apply-card");
    if (card && card.getBoundingClientRect().top < 70) card.scrollIntoView({ behavior: "smooth", block: "start" });
    var first = step.querySelector(".input, input");
    if (first) first.focus({ preventScroll: true });
  }

  // re-check a field once the visitor fixes it
  form.addEventListener("input", function (e) {
    if (e.target.classList.contains("input") && e.target.getAttribute("aria-invalid") === "true") check(e.target);
  });
  form.addEventListener("change", function (e) {
    if (e.target.classList.contains("input") && e.target.getAttribute("aria-invalid") === "true") check(e.target);
  });

  form.addEventListener("click", function (e) {
    var next = e.target.closest("[data-next]");
    var back = e.target.closest("[data-back]");
    if (next) { e.preventDefault(); if (validStep(current)) show(current + 1); }
    if (back) { e.preventDefault(); show(current - 1); }
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validStep(current)) return;
    if (current < steps.length - 1) { show(current + 1); return; }   // Enter key on steps 1–2 acts as Next
    send();
  });

  /* ---------- sending ---------- */
  var submitBtn = form.querySelector('[type="submit"]');
  var errorBox = form.querySelector(".apply__error");
  if (!errorBox) {   // pages built before sending was added
    errorBox = document.createElement("p"); errorBox.className = "apply__error"; errorBox.setAttribute("role", "alert"); errorBox.hidden = true;
    submitBtn.parentNode.parentNode.insertBefore(errorBox, submitBtn.parentNode.nextSibling);
  }

  function collect() {
    var htmlLang = document.documentElement.lang;
    var data = { lang: htmlLang.indexOf("zh") === 0 ? "tw" : htmlLang.indexOf("th") === 0 ? "th" : "en", page: location.pathname };
    new FormData(form).forEach(function (value, key) {
      value = String(value).trim();
      if (key === "interests" || key === "challenges") { (data[key] = data[key] || []).push(value); }
      else data[key] = value;
    });
    return data;
  }

  function fail() {
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.getAttribute("data-label");
    errorBox.textContent = form.getAttribute("data-msg-error");
    errorBox.hidden = false;
  }

  function done(data) {
    var name = data["first-name"] || "";
    var wrap = form.parentNode.querySelector(".apply-done");
    wrap.querySelector(".apply-done__title").textContent = form.getAttribute("data-msg-done-title").replace("{name}", name);
    wrap.querySelector(".apply-done__text").textContent = form.getAttribute("data-msg-done-text").replace("{email}", data.email || "");
    form.hidden = true;
    wrap.hidden = false;
    wrap.focus();
  }

  function send() {
    var data = collect();
    errorBox.hidden = true;
    if (!ENDPOINT) { fail(); return; }
    submitBtn.setAttribute("data-label", submitBtn.textContent);
    submitBtn.disabled = true;
    submitBtn.textContent = form.getAttribute("data-msg-sending");
    // text/plain keeps this a "simple" request, which Google Apps Script accepts from another website
    fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(data) })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (res && res.ok) done(data); else fail(); })
      .catch(fail);
  }
})();
