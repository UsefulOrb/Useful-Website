(function () {
  "use strict";

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("scrolled", window.scrollY > 20);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");
  function closeNav() {
    if (!navToggle || !navLinks) return;
    navToggle.classList.remove("open");
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
  }

  /* ---------- Active link on scroll (scroll spy) ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var linkMap = {};
  document.querySelectorAll(".nav-link").forEach(function (link) {
    var id = (link.getAttribute("href") || "").replace("#", "");
    if (id) linkMap[id] = link;
  });

  var spy = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          Object.keys(linkMap).forEach(function (key) {
            linkMap[key].classList.toggle("active", key === id);
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach(function (s) { spy.observe(s); });

  /* ---------- Reveal on scroll ---------- */
  var revealTargets = document.querySelectorAll(
    ".glass-card, .work-card, .plan-card, .discord-card, .hero-badges, .section-head"
  );
  revealTargets.forEach(function (el) { el.classList.add("reveal"); });

  var revealObserver = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach(function (el) { revealObserver.observe(el); });

  /* ---------- Live Discord counters ---------- */
  // Real, live counts are pulled from the Discord invite API. If the request
  // is unavailable (offline/rate limited), we fall back to the last known
  // real values for the UsefulOrb server.
  var INVITE_CODE = "ApGsq8yGJT";
  var FALLBACK_ONLINE = 6;
  var FALLBACK_TOTAL = 16;

  function animateCount(el, target) {
    if (!el) return;
    var duration = 1400;
    var startTime = null;
    function step(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = String(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }

  var online = document.getElementById("onlineCount");
  var total = document.getElementById("totalCount");

  function renderCounts(onlineVal, totalVal) {
    animateCount(online, onlineVal);
    animateCount(total, totalVal);
  }

  function fetchLiveCounts() {
    return fetch(
      "https://discord.com/api/v9/invites/" + INVITE_CODE + "?with_counts=true",
      { headers: { Accept: "application/json" } }
    )
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data) return { o: FALLBACK_ONLINE, t: FALLBACK_TOTAL };
        var o = data.approximate_presence_count;
        var t = data.approximate_member_count;
        if (data.profile) {
          if (typeof data.profile.online_count === "number") o = data.profile.online_count;
          if (typeof data.profile.member_count === "number") t = data.profile.member_count;
        }
        return {
          o: typeof o === "number" ? o : FALLBACK_ONLINE,
          t: typeof t === "number" ? t : FALLBACK_TOTAL
        };
      })
      .catch(function () { return { o: FALLBACK_ONLINE, t: FALLBACK_TOTAL }; });
  }

  var countObserver = new IntersectionObserver(
    function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          fetchLiveCounts().then(function (c) { renderCounts(c.o, c.t); });
          obs.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );
  var discordCard = document.querySelector(".discord-card");
  if (discordCard) countObserver.observe(discordCard);
})();
