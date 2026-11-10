/* All Over The Moon · lead form (shared by every landing).
   Contract: <form id="lead-form" data-offer="never-miss-a-call"> with fields
   name, business, phone, email, town, missed_calls (radio, optional), best_time (optional),
   a hidden honeypot input name="website", a .form-ok and a .form-error block (hidden).
   Optional: rubro (select, business type), interest (select), calc (hidden, filled by calc.js). */
(function () {
  var form = document.getElementById("lead-form");
  if (!form) return;
  var started = Date.now();
  var params = new URLSearchParams(location.search);
  var src = (params.get("src") || params.get("utm_source") || "direct").slice(0, 40);
  var okBox = document.querySelector(".form-ok");
  var errBox = document.querySelector(".form-error");
  var button = form.querySelector('button[type="submit"]');
  var buttonText = button ? button.textContent : "";

  function val(name) {
    var el = form.elements[name];
    if (!el) return "";
    if (el.length && !el.tagName) { // radio group
      for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value;
      return "";
    }
    return (el.value || "").trim();
  }

  function digits(s) { return (s || "").replace(/\D/g, ""); }

  function showFieldError(name, message) {
    var el = form.elements[name];
    if (!el || !el.closest) return;
    var wrap = el.closest(".field");
    if (!wrap) return;
    wrap.classList.add("has-error");
    var msg = wrap.querySelector(".field-error");
    if (msg) msg.textContent = message;
    el.setAttribute("aria-invalid", "true");
  }

  function clearErrors() {
    form.querySelectorAll(".has-error").forEach(function (w) { w.classList.remove("has-error"); });
    form.querySelectorAll("[aria-invalid]").forEach(function (e) { e.removeAttribute("aria-invalid"); });
    form.querySelectorAll(".field-error").forEach(function (m) { m.textContent = ""; });
    if (errBox) errBox.hidden = true;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    clearErrors();
    var data = {
      name: val("name"), business: val("business"), phone: val("phone"),
      email: val("email"), town: val("town"), missed_calls: val("missed_calls"),
      best_time: val("best_time"), website: val("website"),
      rubro: val("rubro"), interest: val("interest"), calc: val("calc"),
      offer: form.getAttribute("data-offer") || "unknown",
      page: location.pathname, src: src, elapsed_ms: Date.now() - started
    };
    var bad = [];
    if (data.name.length < 2) bad.push(["name", "Please add your name."]);
    if (data.business.length < 2) bad.push(["business", "Please add your business name."]);
    var d = digits(data.phone);
    if (d.length < 10 || d.length > 11) bad.push(["phone", "Please add a 10-digit phone number."]);
    if (!data.email) bad.push(["email", "Please add your email. That's where your Online Check goes."]);
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) bad.push(["email", "That email doesn't look right."]);
    if (bad.length) {
      bad.forEach(function (b) { showFieldError(b[0], b[1]); });
      var first = form.elements[bad[0][0]];
      if (first && first.focus) first.focus();
      return;
    }
    if (button) { button.disabled = true; button.textContent = "Sending…"; }
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 15000);
    fetch(window.AOTM.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller ? controller.signal : undefined
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json().catch(function () { return {}; });
    }).then(function () {
      form.hidden = true;
      if (okBox) { okBox.hidden = false; okBox.focus && okBox.focus(); }
    }).catch(function () {
      if (errBox) { errBox.hidden = false; errBox.focus && errBox.focus(); }
      if (button) { button.disabled = false; button.textContent = buttonText; }
    });
  });
})();
