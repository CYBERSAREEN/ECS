/* ECS — front-end interactions (vanilla JS) */
(function () {
  "use strict";

  /* ---------- Loader ---------- */
  function initLoader() {
    var loader = document.getElementById("loader");
    if (!loader) return;
    var lines = loader.querySelectorAll(".loader__lines p");
    lines.forEach(function (p, i) {
      setTimeout(function () { p.classList.add("show"); }, 300 + i * 420);
    });
    window.addEventListener("load", function () {
      setTimeout(function () { loader.classList.add("hide"); }, 1700);
    });
    setTimeout(function () { loader.classList.add("hide"); }, 2600);
  }

  /* ---------- Navbar scroll ---------- */
  function initNavbar() {
    var nav = document.getElementById("navbar");
    if (!nav) return;
    var onScroll = function () {
      if (window.scrollY > 12) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    var toggle = document.getElementById("navToggle");
    var menu = document.getElementById("mobileMenu");
    if (toggle && menu) {
      toggle.addEventListener("click", function () { menu.classList.toggle("open"); });
      menu.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () { menu.classList.remove("open"); });
      });
    }
  }

  /* ---------- Typewriter ---------- */
  function initTypewriter() {
    var el = document.getElementById("typewriter");
    if (!el) return;
    var quotes;
    try { quotes = JSON.parse(el.getAttribute("data-quotes")); } catch (e) { quotes = []; }
    if (!quotes || !quotes.length) return;
    var out = el.querySelector(".tw-text");
    var idx = 0, char = 0, deleting = false;
    function tick() {
      var target = quotes[idx];
      if (!deleting && char < target.length) { char++; out.textContent = target.slice(0, char); setTimeout(tick, 45); }
      else if (!deleting && char === target.length) { deleting = true; setTimeout(tick, 2400); }
      else if (deleting && char > 0) { char--; out.textContent = target.slice(0, char); setTimeout(tick, 22); }
      else { deleting = false; idx = (idx + 1) % quotes.length; setTimeout(tick, 300); }
    }
    tick();
  }

  /* ---------- Counters ---------- */
  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var start = 0, step = Math.max(1, Math.ceil(target / 60));
    var iv = setInterval(function () {
      start += step;
      if (start >= target) { start = target; clearInterval(iv); }
      el.textContent = start + suffix;
    }, 18);
  }

  /* ---------- Scroll reveal + counters ---------- */
  function initObserver() {
    var reveals = document.querySelectorAll(".reveal");
    var counters = document.querySelectorAll("[data-count]");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach(function (r) { r.classList.add("in"); });
      counters.forEach(animateCounter);
      return;
    }
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "-40px" });
    reveals.forEach(function (r) { ro.observe(r); });

    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCounter(e.target); co.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- Accordions (services / patents) ---------- */
  function initAccordions() {
    document.querySelectorAll("[data-accordion]").forEach(function (head) {
      head.addEventListener("click", function () {
        var item = head.closest("[data-accordion-item]");
        if (item) item.classList.toggle("open");
      });
    });
  }

  /* ---------- Tabs (projects) ---------- */
  function initTabs() {
    document.querySelectorAll("[data-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.getAttribute("data-tab-group");
        var name = btn.getAttribute("data-tab");
        document.querySelectorAll('[data-tab-group="' + group + '"]').forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        document.querySelectorAll('[data-tab-panel-group="' + group + '"]').forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-tab-panel") === name);
        });
      });
    });
  }

  /* ---------- Radio cards (scan) ---------- */
  function initRadioCards() {
    document.querySelectorAll(".radio-row").forEach(function (row) {
      row.addEventListener("click", function () {
        var input = row.querySelector("input");
        if (!input) return;
        document.querySelectorAll('.radio-row input[name="' + input.name + '"]').forEach(function (i) {
          i.closest(".radio-row").classList.remove("active");
        });
        input.checked = true;
        row.classList.add("active");
      });
    });
  }

  /* ---------- GSAP layer (ScrollTrigger) — IO fallback kept ---------- */
  function initGsap() {
    if (!window.gsap || !window.ScrollTrigger) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    gsap.registerPlugin(ScrollTrigger);
    document.body.classList.add("gsap-on");

    var hero = document.querySelector(".hero__inner");
    if (hero) {
      var intro = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.25 });
      var pick = function (sel) { return hero.querySelectorAll(sel); };
      intro
        .from(pick(".hero__badge"), { y: 20, opacity: 0, duration: 0.5 })
        .from(pick("h1"), { y: 36, opacity: 0, duration: 0.7 }, "-=0.25")
        .from(pick(".hero__sub, .hero__type"), { y: 24, opacity: 0, duration: 0.55, stagger: 0.12 }, "-=0.35")
        .from(pick(".hero__cta .btn"), { y: 18, opacity: 0, duration: 0.45, stagger: 0.1 }, "-=0.25")
        .from(pick(".hero__stats .stat"), { y: 22, opacity: 0, duration: 0.5, stagger: 0.12 }, "-=0.2");
    }

    document.querySelectorAll("section:not(.hero), .page-header").forEach(function (sec) {
      var items = sec.querySelectorAll(".reveal");
      if (!items.length) return;
      gsap.from(items, {
        y: 40, opacity: 0, duration: 0.75, ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: sec, start: "top 78%", once: true },
      });
    });

    document.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: "power2.out",
        snap: { v: 1 },
        onUpdate: function () { el.textContent = obj.v + suffix; },
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLoader();
    initNavbar();
    initTypewriter();
    if (!initGsap()) initObserver();
    initAccordions();
    initTabs();
    initRadioCards();
  });
})();

/* ── GA4 event tracking (no-ops when GA is not configured) ───── */
(function () {
  function track(name, params) {
    if (window.ECS_GA && typeof window.gtag === "function") {
      window.gtag("event", name, params || {});
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
      a.addEventListener("click", function () {
        track("whatsapp_click", {
          location: a.classList.contains("wa-badge") ? "floating_badge" : "inline",
          page: window.location.pathname,
        });
      });
    });

    document.querySelectorAll("a.btn-primary, button.btn-primary").forEach(function (el) {
      el.addEventListener("click", function () {
        track("cta_click", {
          label: (el.textContent || "").trim().slice(0, 60),
          page: window.location.pathname,
        });
      });
    });

    var contactForm = document.getElementById("contactForm");
    if (contactForm) contactForm.addEventListener("submit", function () {
      track("generate_lead", { form: "contact", page: window.location.pathname });
    });
    var scanForm = document.getElementById("scanForm");
    if (scanForm) scanForm.addEventListener("submit", function () {
      track("scan_request", { form: "quickscan", page: window.location.pathname });
    });
  });
})();
