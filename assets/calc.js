/* All Over The Moon · "What is it costing you?" calculators.
   Markup contract: <form class="calc" data-calc="automations|booking"> with number inputs named as below,
   <output data-out="hours">, <output data-out="money">, <output data-out="year">, and <p data-out="how">.
   The result summary is copied into <input type="hidden" name="calc"> inside #lead-form, if present.
   Every assumption is written on the page ("How we count"), so the owner can check the math. */
(function () {
  var MODELS = {
    automations: {
      defaults: { missed_week: 5, close_of_10: 2, customer_value: 150, admin_hours_week: 3, noshows_month: 2, hourly_value: 40 },
      run: function (v) {
        var weeks = 4.3;
        var hours = v.admin_hours_week * weeks * 0.5;                       // half of the admin time goes away
        var calls = v.missed_week * weeks * 0.5 * (v.close_of_10 / 10) * v.customer_value; // half of missed callers reached again
        var noshow = v.noshows_month * v.customer_value * 0.5;              // reminders + deposits save half
        var money = calls + noshow;
        return {
          hours: hours, money: money, timeValue: hours * v.hourly_value,
          how: "We assume half of your missed callers get reached again, deposits and reminders save half of your no-shows, " +
               "and half of the time you spend on booking calls, reminders and chasing payments goes away. 4.3 weeks a month."
        };
      }
    },
    booking: {
      defaults: { phone_bookings_week: 10, minutes_each: 8, noshows_month: 2, booking_value: 180, site_bookings_month: 10, commission_pct: 15, hourly_value: 40 },
      run: function (v) {
        var weeks = 4.3;
        var hours = v.phone_bookings_week * weeks * (v.minutes_each / 60) * 0.7;   // 7 in 10 phone bookings move online
        var noshow = v.noshows_month * v.booking_value * 0.5;                      // deposits + reminders save half
        var direct = v.site_bookings_month * 0.2 * v.booking_value * (v.commission_pct / 100); // 2 in 10 book you direct
        var money = noshow + direct;
        return {
          hours: hours, money: money, timeValue: hours * v.hourly_value,
          how: "We assume 7 in 10 phone bookings move online, deposits and reminders save half of your no-shows, " +
               "and 2 in 10 guests who now book through booking sites book you direct (mostly returning guests). 4.3 weeks a month."
        };
      }
    }
  };

  function money(n) { return "$" + Math.round(n).toLocaleString("en-US"); }
  function hrs(n) { var r = Math.round(n); return r + (r === 1 ? " hour" : " hours"); }

  document.querySelectorAll("form.calc").forEach(function (form) {
    var model = MODELS[form.getAttribute("data-calc")];
    if (!model) return;
    Object.keys(model.defaults).forEach(function (k) {
      var el = form.elements[k];
      if (el && el.value === "") el.value = model.defaults[k];
    });
    function out(name) { return form.querySelector('[data-out="' + name + '"]'); }
    function update() {
      var v = {};
      Object.keys(model.defaults).forEach(function (k) {
        var el = form.elements[k];
        var n = el ? parseFloat(el.value) : NaN;
        v[k] = isFinite(n) && n >= 0 ? n : 0;
      });
      var r = model.run(v);
      var total = r.money + r.timeValue;
      if (out("hours")) out("hours").textContent = hrs(r.hours);
      if (out("money")) out("money").textContent = money(r.money);
      if (out("time-value")) out("time-value").textContent = money(r.timeValue);
      if (out("total")) out("total").textContent = money(total);
      if (out("year")) out("year").textContent = money(total * 12);
      if (out("how")) out("how").textContent = r.how;
      var hidden = document.querySelector('#lead-form input[name="calc"]');
      if (hidden) hidden.value = form.getAttribute("data-calc") + ": " + hrs(r.hours) + "/mo back, " + money(r.money) +
        "/mo recovered, " + money(total) + "/mo total · inputs " + JSON.stringify(v);
    }
    form.addEventListener("input", update);
    form.addEventListener("submit", function (e) { e.preventDefault(); update(); });
    update();
  });
})();
