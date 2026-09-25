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
          cursor.style.transform = "translate(" + (x - 13) + "px, " + (y - 13) + "px)";
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
})();