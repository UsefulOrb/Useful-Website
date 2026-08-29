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
    ".glass-card, .work-card, .showcase-card, .plan-card, .discord-card, .hero-badges, .section-head"
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

  /* ---------- Showcase Media View Switchers ---------- */
  document.querySelectorAll(".media-toggle-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var group = btn.closest(".media-toggle-group");
      if (group) {
        group.querySelectorAll(".media-toggle-btn").forEach(function (b) {
          b.classList.remove("active");
        });
      }
      btn.classList.add("active");

      var targetId = btn.getAttribute("data-target");
      var newSrc = btn.getAttribute("data-src");
      var newBadge = btn.getAttribute("data-badge");
      var newTitle = btn.getAttribute("data-title");
      var newType = btn.getAttribute("data-type") || "video";

      var targetMedia = document.getElementById(targetId);
      if (targetMedia && newSrc) {
        targetMedia.style.opacity = "0.3";
        
        if (targetMedia.tagName.toLowerCase() === "video") {
          var source = targetMedia.querySelector("source");
          if (source) {
            source.src = newSrc;
          } else {
            targetMedia.src = newSrc;
          }
          targetMedia.load();
          targetMedia.onloadeddata = function () {
            targetMedia.style.opacity = "1";
            targetMedia.play().catch(function () {});
          };
        } else {
          targetMedia.src = newSrc;
          targetMedia.onload = function () {
            targetMedia.style.opacity = "1";
          };
        }

        // Update lightbox reference on parent
        var frame = targetMedia.closest(".media-frame");
        if (frame) {
          frame.setAttribute("data-lightbox", newSrc);
          frame.setAttribute("data-type", newType);
          if (newTitle) frame.setAttribute("data-caption", newTitle);
        }
      }

      // Update badge if exists
      if (targetId) {
        var badgeId = targetId.replace("-media", "-badge");
        var badgeEl = document.getElementById(badgeId);
        if (badgeEl && newBadge) {
          badgeEl.textContent = newBadge;
        }
      }
    });
  });

  /* ---------- Lightbox Modal ---------- */
  var lightbox = document.getElementById("mediaLightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxVideo = document.getElementById("lightboxVideo");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxClose = document.getElementById("lightboxClose");
  var lightboxBackdrop = document.getElementById("lightboxBackdrop");

  function openLightbox(src, type, caption) {
    if (!lightbox) return;

    var isVideo = type === "video" || src.endsWith(".mp4") || src.endsWith(".webm");

    if (isVideo && lightboxVideo) {
      if (lightboxImg) lightboxImg.style.display = "none";
      lightboxVideo.style.display = "block";
      lightboxVideo.src = src;
      lightboxVideo.load();
      lightboxVideo.play().catch(function () {});
    } else if (lightboxImg) {
      if (lightboxVideo) {
        lightboxVideo.pause();
        lightboxVideo.style.display = "none";
      }
      lightboxImg.style.display = "block";
      lightboxImg.src = src;
    }

    if (lightboxCaption) lightboxCaption.textContent = caption || "";
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lightboxVideo) {
      lightboxVideo.pause();
      lightboxVideo.src = "";
      lightboxVideo.style.display = "none";
    }
    if (lightboxImg) {
      lightboxImg.src = "";
      lightboxImg.style.display = "none";
    }
  }

  document.querySelectorAll(".media-frame.zoomable").forEach(function (frame) {
    frame.addEventListener("click", function () {
      var src = frame.getAttribute("data-lightbox");
      var type = frame.getAttribute("data-type") || "image";
      var caption = frame.getAttribute("data-caption") || "";
      
      if (!src) {
        var vid = frame.querySelector("video source, video");
        var img = frame.querySelector("img");
        if (vid) {
          src = vid.src || vid.getAttribute("src");
          type = "video";
        } else if (img) {
          src = img.src;
          type = "image";
        }
      }
      
      if (src) openLightbox(src, type, caption);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lightbox && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
})();
