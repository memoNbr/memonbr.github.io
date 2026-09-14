(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Scroll progress + active nav ---------- */
  var progressBar = document.querySelector(".scroll-progress");
  var navAnchors = document.querySelectorAll(".nav-links a");

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (progressBar) {
      progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    }

    var pos = window.scrollY + 90;
    var currentId = "";
    document.querySelectorAll("main section[id]").forEach(function (sec) {
      var top = sec.offsetTop;
      var bottom = top + sec.offsetHeight;
      if (pos >= top && pos < bottom) currentId = sec.id;
    });

    navAnchors.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + currentId);
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var d = parseInt(el.getAttribute("data-delay") || "0", 10);
        if (d) el.style.transitionDelay = d * 0.12 + "s";
        el.classList.add("in");
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Custom cursor ---------- */
  var cursor = document.querySelector(".cursor");
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var raf = null;
    var x = 0, y = 0;

    document.addEventListener("mousemove", function (e) {
      document.body.classList.add("cursor-on");
      x = e.clientX;
      y = e.clientY;
      if (!raf) {
        raf = requestAnimationFrame(function () {
          cursor.style.transform = "translate(" + (x - 15) + "px, " + (y - 15) + "px)";
          raf = null;
        });
      }
    }, { passive: true });

    var interactive = "a, button, .index-row, .mail-big, .btn";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(interactive)) cursor.classList.add("is-active");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(interactive)) cursor.classList.remove("is-active");
    });
  }

  /* ---------- COTAM simulator ---------- */
  if (document.getElementById("sim")) {
    (function () {
      var els = {
        rot:  document.getElementById("rotSlider"),
        hgt:  document.getElementById("hgtSlider"),
        dist: document.getElementById("distSlider"),
        br:   document.getElementById("brSlider"),
        pan:  document.getElementById("panSlider"),
        hr:   document.getElementById("hrSlider"),
        rotVal:  document.getElementById("rotVal"),
        hgtVal:  document.getElementById("hgtVal"),
        distVal: document.getElementById("distVal"),
        brVal:   document.getElementById("brVal"),
        panVal:  document.getElementById("panVal"),
        hrVal:   document.getElementById("hrVal"),
        rotNote: document.getElementById("rotNote"),
        distNote: document.getElementById("distNote"),
        planNote: document.getElementById("planNote"),
        planCanvas: document.getElementById("planCanvas"),
        abGrid: document.getElementById("abGrid"),
        outNum: document.getElementById("outNum"),
        outFill: document.getElementById("outFill"),
        outSub: document.getElementById("outSub"),
        bars: document.getElementById("bars")
      };

      /* surveyed data from the thesis (linear interpolation between the points) */
      var ROT = [[0,1.0],[30,0.5],[60,0.1429],[90,0.4286],[120,0.2143],[150,0.4286],[180,0.6071],[210,0.4286],[240,0.5333],[270,0.6],[300,0.2857],[330,0.8462],[360,1.0]];
      var HGT = [[38,0.4545],[40,0.2955],[42,0.1818],[44,0.04545],[46,0.02273]];
      var BR  = [[130,0.7143,0.5714],[131,0.6857,0.5714],[133,0.7143,0.5429],[134,0.6857,0.5429],[157,0.6857,0.4857]];
      var PAN = [[11,0.6857,0.5714],[14,0.7143,0.5429],[15,0.695238,0.54]];
      var HR  = [[95,0.6857,0.5714],[97,0.704762,0.5333]];
      var DIST = [[0,0,0],[44,0.588,0.08],[51,0.662,0.42],[58,0.654,0.19],[65,0.673,0.31]];

      var COMF = { vm: 0.4, fridge: 0.4, drawers: 0.6, table: 0.7, tb: 0.3, lunch: 0.8, curtain: 0.6 };
      var TRST = { vm: 0, fridge: 0.4, drawers: 0.3, table: 0.3, tb: 0.1, lunch: 0.4, curtain: 0.5 };
      var OHD = { trust: 0.7361111111111112, pu: 0.675, peou: 0.8 };

      var BETA = { t_int: 0.18, c_pu: 0.343, pu_att: 0.32, peou_pu: 0.02, peou_att: 0.09, att_int: 0.52 };

      var yn = {};
      var COMP = [
        { id: "ohd", name: "Overhead display" },
        { id: "vm", name: "Vending machine" },
        { id: "fridge", name: "Fridge" },
        { id: "drawers", name: "Drawers" },
        { id: "table", name: "Table" },
        { id: "tb", name: "Trash bin" },
        { id: "lunch", name: "Lunch server" },
        { id: "curtain", name: "E-Curtain" }
      ];

      /* linear interpolation: returns the rate row [y, ...] for x within the data range */
      function lerp(tbl, x) {
        var first = tbl[0], last = tbl[tbl.length - 1];
        if (x <= first[0]) return first.slice(1);
        if (x >= last[0]) return last.slice(1);
        for (var i = 0; i < tbl.length - 1; i++) {
          var a = tbl[i], b = tbl[i + 1];
          if (x >= a[0] && x <= b[0]) {
            var t = (x - a[0]) / (b[0] - a[0]);
            var row = [];
            for (var k = 1; k < a.length; k++) row.push(a[k] + t * (b[k] - a[k]));
            return row;
          }
        }
        return first.slice(1);
      }
      function rate1(tbl, x) { return lerp(tbl, x)[0]; }
      function rate2(tbl, x) { var v = lerp(tbl, x); return { pu: v[0], peou: v[1] }; }

      function buildPU(c, pu, peou) {
        return [].concat(
          pu,
          c.map(function (v) { return BETA.c_pu * v; }),
          pu.map(function (v, i) { return BETA.peou_pu * peou[i]; })
        );
      }

      /* the TAM chain (Eq. 4-2), identical to the thesis implementation */
      function chain(c, t, pu, peou, att) {
        var PU = buildPU(c, pu, peou);
        var Att_PEoU = peou.map(function (v) { return BETA.peou_att * v; });
        var Att_PU = PU.map(function (v) { return BETA.pu_att * v; });
        var Att = [].concat(att, Att_PEoU, Att_PU);
        var Int_T = t.map(function (v) { return BETA.t_int * v; });
        var Int_Att = Att.map(function (v) { return BETA.att_int * v; });
        return Int_Att.concat(Int_T).reduce(function (a, b) { return a + b; }, 0);
      }
      function sum(arr) { return arr.reduce(function (a, b) { return a + b; }, 0); }

      function compute() {
        var rot = +els.rot.value, hgt = +els.hgt.value, dist = +els.dist.value;
        var br = +els.br.value, pan = +els.pan.value, hr = +els.hr.value;
        var facing = (rot === 180);

        var brr = rate2(BR, br), panr = rate2(PAN, pan), hrr = rate2(HR, hr);
        var inPeriph = !(rot >= 160 && rot <= 280);
        var ohdOn = yn.ohd === 1;
        var ohd_c = ohdOn && inPeriph ? OHD.trust : 0;
        var ohd_pu = ohdOn && inPeriph ? OHD.pu : 0;
        var ohd_peou = ohdOn && inPeriph ? OHD.peou : 0;

        var crit_c = [
          facing ? rate2(DIST, dist).pu : 0,
          yn.vm * COMF.vm,
          yn.fridge * COMF.fridge,
          yn.drawers * COMF.drawers,
          yn.table * COMF.table,
          yn.tb * COMF.tb,
          yn.lunch * COMF.lunch,
          yn.curtain * COMF.curtain
        ];
        var crit_t = [
          ohd_c,
          yn.vm * TRST.vm,
          yn.fridge * TRST.fridge,
          yn.drawers * TRST.drawers,
          yn.table * TRST.table,
          yn.tb * TRST.tb,
          yn.lunch * TRST.lunch,
          yn.curtain * TRST.curtain
        ];
        var crit_pu = [ohd_pu, panr.pu, brr.pu, hrr.pu];
        var crit_peou = [ohd_peou, panr.peou, brr.peou, hrr.peou];
        var crit_att = [rate1(ROT, rot), rate1(HGT, hgt)];

        var Int_act = chain(crit_c, crit_t, crit_pu, crit_peou, crit_att);

        /* maximum acceptance value: all arrays at their best rates (thesis "top" arrays) */
        var c_top = [1, COMF.vm, COMF.fridge, COMF.drawers, COMF.table, COMF.tb, COMF.lunch, COMF.curtain];
        var t_top = [OHD.trust, 0, TRST.fridge, TRST.drawers, TRST.table, TRST.tb, TRST.lunch, TRST.curtain];
        var pu_top = [OHD.pu, 1, 1, 1];
        var pe_top = [OHD.peou, 1, 1, 1];
        var att_top = [1, 1];
        var Int_top = chain(c_top, t_top, pu_top, pe_top, att_top);

        var groupSeat = sum(crit_att.map(function (v) { return BETA.att_int * v; }));
        var groupPu = sum(buildPU(crit_c, crit_pu, crit_peou).map(function (v) { return BETA.pu_att * BETA.att_int * v; }));
        var groupPeou = sum(crit_peou.map(function (v) { return BETA.peou_att * BETA.att_int * v; }));
        var groupTrust = sum(crit_t.map(function (v) { return BETA.t_int * v; }));

        var rate = Int_top > 0 ? Math.max(0, Math.min(100, Int_act / Int_top * 100)) : 0;

        return {
          rate: rate,
          intAct: Int_act,
          intTop: Int_top,
          groups: { seat: groupSeat, pu: groupPu, peou: groupPeou, trust: groupTrust },
          facing: facing, inPeriph: inPeriph, ohdOn: ohdOn, rot: rot
        };
      }

      function render() {
        var r = compute();
        els.outNum.textContent = r.rate.toFixed(1) + "%";
        els.outFill.style.width = r.rate + "%";
        els.outSub.textContent = "Actual acceptance value " + r.intAct.toFixed(3) + " of a maximum acceptance value " + r.intTop.toFixed(3) + " — scaled to 0–100% (Eq. 4-3).";
        renderBars(r);
        drawPlan(r);
        updateNotes(r);
      }

      function updateNotes(r) {
        els.distNote.textContent = r.facing
          ? "Active — the seat faces the cabin, so facing distance " + els.distVal.textContent + " adds its comfort rate."
          : "Inactive — the facing-distance criterion only contributes at rotation = 180°.";
        els.rotNote.textContent = r.ohdOn
          ? (r.inPeriph
            ? "Overhead display inside the peripheral vision — its trust / usefulness / ease-of-use rates contribute."
            : "Overhead display is outside the 120° peripheral vision (160°–280°) — its criteria rates count as 0.")
          : "";
      }

      /* plan-view of the seat + peripheral-vision cone + overhead display */
      function drawPlan(r) {
        var c = els.planCanvas, ctx = c.getContext("2d");
        var cx = 110, cy = 110;
        var fRad = r.rot * Math.PI / 180;

        ctx.clearRect(0, 0, 220, 220);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(0, 0, 220, 220);
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI * 2); ctx.stroke();

        /* windshield at 0° (forward) */
        ctx.fillStyle = "#9fd8cf";
        ctx.fillRect(cx - 20, cy - 104, 40, 8);

        /* peripheral vision cone (120°, centred on the facing direction) */
        var blocked = r.ohdOn && !r.inPeriph;
        ctx.fillStyle = blocked ? "rgba(200,90,60,0.14)" : "rgba(60,180,160,0.16)";
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 90, fRad - Math.PI / 3, fRad + Math.PI / 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = blocked ? "rgba(200,90,60,0.55)" : "rgba(20,120,100,0.4)";
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.sin(fRad - Math.PI / 3) * 86, cy - Math.cos(fRad - Math.PI / 3) * 86); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.sin(fRad + Math.PI / 3) * 86, cy - Math.cos(fRad + Math.PI / 3) * 86); ctx.stroke();

        /* facing marker */
        ctx.fillStyle = "#0B4A41";
        ctx.beginPath(); ctx.arc(cx + Math.sin(fRad) * 30, cy - Math.cos(fRad) * 30, 5, 0, Math.PI * 2); ctx.fill();

        /* overhead display node at the forward cabin position */
        ctx.fillStyle = r.ohdOn ? (r.inPeriph ? "#0b0b0b" : "#c25a3c") : "#bbb";
        ctx.beginPath(); ctx.arc(cx, cy - 80, 6, 0, Math.PI * 2); ctx.fill();
        ctx.font = "9px Arial"; ctx.fillStyle = "#0E2C25"; ctx.textAlign = "center";
        ctx.fillText("OHD", cx, cy - 66);

        /* seat plan: cushion + backrest on the rear side */
        var bx = cx + Math.sin(fRad) * 6, by = cy - Math.cos(fRad) * 6;
        ctx.fillStyle = "#333";
        ctx.fillRect(bx - 12, by - 12, 24, 24);
        ctx.fillStyle = "#0b0b0b";
        ctx.save();
        ctx.translate(cx + Math.sin(fRad + Math.PI) * 20, cy - Math.cos(fRad + Math.PI) * 20);
        ctx.rotate(fRad + Math.PI);
        ctx.fillRect(-2.5, -11, 5, 22);
        ctx.restore();

        ctx.font = "11px Arial"; ctx.fillStyle = "#0B4A41"; ctx.textAlign = "center";
        ctx.fillText(r.rot + "°", cx, cy + 104);

        var parts = [];
        if (r.facing) parts.push("Facing distance active.");
        if (r.ohdOn) parts.push(r.inPeriph ? "OHD in peripheral vision — contributes." : "OHD outside peripheral vision — contribution 0.");
        if (!parts.length) parts.push("No overhead display.");
        els.planNote.textContent = parts.join(" ");
      }

      var BAR_ROWS = [
        { key: "seat", label: "Seat (attitude)" },
        { key: "pu", label: "Usefulness path" },
        { key: "peou", label: "Ease-of-use path" },
        { key: "trust", label: "Trust path" }
      ];

      function renderBars(r) {
        var max = Math.max(1e-6, r.groups.seat, r.groups.pu, r.groups.peou, r.groups.trust);
        els.bars.innerHTML = "";
        BAR_ROWS.forEach(function (b) {
          var v = r.groups[b.key];
          var row = document.createElement("div");
          row.className = "bar-row";
          var lab = document.createElement("span"); lab.className = "bar-label"; lab.textContent = b.label;
          var trk = document.createElement("span"); trk.className = "bar-track";
          var fill = document.createElement("span"); fill.className = "bar-fill"; fill.style.width = (v / max * 100) + "%";
          trk.appendChild(fill);
          var val = document.createElement("span"); val.className = "bar-val"; val.textContent = v.toFixed(2);
          row.appendChild(lab); row.appendChild(trk); row.appendChild(val);
          els.bars.appendChild(row);
        });
      }

      /* equipment toggles */
      COMP.forEach(function (c, i) {
        yn[c.id] = (i === 0) ? 1 : 0;
        var row = document.createElement("div");
        row.className = "ab-row";
        var name = document.createElement("span"); name.textContent = c.name;
        var tog = document.createElement("span"); tog.className = "ab-toggle";
        var yEl = document.createElement("span"); yEl.textContent = "Y";
        var nEl = document.createElement("span"); nEl.textContent = "N";
        function paint() {
          yEl.classList.toggle("on", yn[c.id] === 1);
          nEl.classList.toggle("on", yn[c.id] === 0);
        }
        yEl.addEventListener("click", function () { yn[c.id] = 1; paint(); render(); });
        nEl.addEventListener("click", function () { yn[c.id] = 0; paint(); render(); });
        tog.appendChild(yEl); tog.appendChild(nEl);
        row.appendChild(name); row.appendChild(tog);
        els.abGrid.appendChild(row);
        paint();
      });

      function bind(id, valEl, fmt) {
        var el = els[id];
        if (!el || !valEl) return;
        el.addEventListener("input", function () {
          valEl.textContent = fmt(+el.value);
          if (id === "rot") {
            var facing = (+el.value === 180);
            els.distSlider.disabled = !facing;
            els.distSlider.style.opacity = facing ? 1 : 0.45;
          }
          render();
        });
      }

      bind("rot", els.rotVal, function (v) { return v + "°"; });
      bind("hgt", els.hgtVal, function (v) { return v + " cm"; });
      bind("dist", els.distVal, function (v) { return v + " cm"; });
      bind("br", els.brVal, function (v) { return v + "°"; });
      bind("pan", els.panVal, function (v) { return v + "°"; });
      bind("hr", els.hrVal, function (v) { return v + "°"; });

      els.hgtVal.textContent = "38 cm";
      els.distVal.textContent = "44 cm";
      els.brVal.textContent = "130°";
      els.panVal.textContent = "11°";
      els.hrVal.textContent = "95°";
      els.distSlider.disabled = true;
      els.distSlider.style.opacity = 0.45;
      render();
    })();
  }
})();