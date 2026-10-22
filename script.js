/* ============================================================
   Undangan Digital Sekar & Bagas — logika halaman + gerak
   Nama tamu dari path URL: /nama-tamu/
   Animasi: GSAP + ScrollTrigger, cadangan IntersectionObserver
   ============================================================ */
(function () {
  "use strict";

  var WEDDING_DATE = new Date("2026-06-20T08:00:00+07:00");
  var LS_KEY = "undangan-sekar-bagas:wishes:v1";
  var REPO_BASE = "undangan-online";
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAS_GSAP = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  if (HAS_GSAP) window.gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- nama tamu ---------- */
  function slugToName(slug) {
    var name = String(slug || "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!name) return "";
    if (name === name.toLowerCase()) {
      name = name.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    return name;
  }

  function guestFromPath() {
    var parts = window.location.pathname
      .split("/")
      .filter(Boolean)
      .map(function (p) { try { return decodeURIComponent(p); } catch (e) { return p; } });
    if (parts.length && parts[parts.length - 1] === "index.html") parts.pop();
    if (parts.length && parts[0] === REPO_BASE) parts.shift();
    if (!parts.length) return "";
    var candidate = parts[parts.length - 1];
    if (!candidate || candidate.indexOf(".") !== -1) return "";
    return slugToName(candidate);
  }

  function resolveGuestName() {
    var fromPath = guestFromPath();
    if (fromPath) return fromPath;
    var params = new URLSearchParams(window.location.search);
    var to = (params.get("to") || "").trim();
    if (to) return to;
    try {
      var saved = sessionStorage.getItem("guestName");
      if (saved) return saved;
    } catch (e) {}
    return "";
  }

  function setGuestName() {
    var name = resolveGuestName();
    if (!name) return;
    document.getElementById("guestName").textContent = name;
    var input = document.getElementById("fName");
    if (input && !input.value) input.value = name;
  }

  /* ---------- musik latar: petikan pentatonis lembut (WebAudio) ---------- */
  var Music = (function () {
    var ctx = null, timer = null, playing = false, step = 0;
    var SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];

    function pluck(freq, when, vol) {
      var osc = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var g2 = ctx.createGain();
      var gain = ctx.createGain();
      osc.type = "sine"; osc.frequency.value = freq;
      osc2.type = "triangle"; osc2.frequency.value = freq * 2;
      g2.gain.value = 0.25;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(vol, when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 1.6);
      osc.connect(gain); osc2.connect(g2); g2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when); osc2.start(when);
      osc.stop(when + 1.7); osc2.stop(when + 1.7);
    }

    function tick() {
      if (!ctx) return;
      var pattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 2, 3, 4, 6, 5, 4, 2];
      var now = ctx.currentTime;
      pluck(SCALE[pattern[step % pattern.length]], now, 0.11);
      if (step % 4 === 0) pluck(SCALE[0] / 2, now, 0.07);
      step++;
    }

    function start() {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
      }
      if (ctx.state === "suspended") ctx.resume();
      if (playing) return;
      playing = true;
      tick();
      timer = setInterval(tick, 1150);
    }

    function stop() {
      playing = false;
      if (timer) { clearInterval(timer); timer = null; }
    }

    return {
      start: start,
      stop: stop,
      toggle: function () { if (playing) { stop(); } else { start(); } return playing; },
      isPlaying: function () { return playing; }
    };
  })();

  function syncMusicIcon() {
    var btn = document.getElementById("musicBtn");
    var playing = Music.isPlaying();
    btn.querySelector(".ic-on").style.display = playing ? "" : "none";
    btn.querySelector(".ic-off").style.display = playing ? "none" : "";
    btn.classList.toggle("playing", playing);
  }

  /* ---------- animasi ---------- */
  var animStarted = false;

  function fallbackReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  }

  function heroIntro() {
    if (!HAS_GSAP || REDUCED) return;
    var gsap = window.gsap;
    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(".hero-gun", { autoAlpha: 0, y: -26, scale: 0.7 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.85 })
      .fromTo(".hero .kicker", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.4")
      .fromTo(".hero-names span", { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.95, stagger: 0.13 }, "-=0.35")
      .fromTo(".hero-ribbon", { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.6 }, "-=0.5")
      .fromTo([".hero-date", ".hero-place"], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.1 }, "-=0.35")
      .fromTo(".hero-btn", { autoAlpha: 0, y: 16, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55 }, "-=0.3")
      .fromTo(".hero-flourish", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 }, "-=0.4")
      .fromTo(".hero .wave", { yPercent: 100 }, { yPercent: 0, duration: 0.7 }, "-=0.6");
    gsap.to(".hero-gun", { y: 8, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.4 });
  }

  function initAnimations() {
    if (animStarted) return;
    animStarted = true;
    if (!HAS_GSAP || REDUCED) { fallbackReveal(); return; }
    var gsap = window.gsap;
    document.documentElement.classList.add("gsap-on");

    function reveal(el, from, vars) {
      if (!el) return;
      gsap.fromTo(el, Object.assign({ autoAlpha: 0 }, from), Object.assign({
        autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: 0, rotationX: 0,
        duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      }, vars || {}));
    }

    /* tiap bagian punya gaya masuk sendiri */
    var sectionFrom = {
      "verse": { scale: 0.92, y: 44 },
      "couple-sec": { y: 40 },
      "savethedate": {},
      "events": { y: 54 },
      "story": { y: 40 },
      "gallery": { y: 40 },
      "gift": { y: 40 },
      "rsvp": { y: 40 },
      "closing": {}
    };
    gsap.utils.toArray(".reveal").forEach(function (el) {
      if (el.classList.contains("hero")) return;
      var key = null;
      Object.keys(sectionFrom).forEach(function (k) { if (el.classList.contains(k)) key = k; });
      reveal(el, key ? sectionFrom[key] : { y: 34 }, {});
    });

    /* mempelai: masuk dari kiri dan kanan */
    gsap.utils.toArray(".couple-grid .person").forEach(function (person, i) {
      reveal(person, { x: i === 0 ? -64 : 64 }, { duration: 1.1 });
    });
    reveal(document.querySelector(".couple-amp"), { scale: 0, rotation: -40 }, { ease: "back.out(2)", duration: 0.8 });

    /* foto mempelai: terbuka seperti tirai dari atas */
    gsap.utils.toArray(".arch-photo img").forEach(function (img) {
      gsap.fromTo(img, { clipPath: "inset(0 0 100% 0)" }, {
        clipPath: "inset(0 0 0% 0)", duration: 1.25, ease: "power3.inOut",
        scrollTrigger: { trigger: img, start: "top 86%", once: true }
      });
    });

    /* countdown: kotak berputar jatuh satu per satu */
    gsap.set(".countdown", { perspective: 700 });
    gsap.fromTo(".countdown .cd-box", { autoAlpha: 0, rotationX: -92, y: 10 }, {
      autoAlpha: 1, rotationX: 0, y: 0, duration: 0.85, ease: "back.out(1.8)", stagger: 0.1,
      scrollTrigger: { trigger: ".savethedate", start: "top 80%", once: true }
    });

    /* kartu acara: membalik masuk dari bawah */
    gsap.set(".events-grid", { perspective: 900 });
    gsap.utils.toArray(".events-grid .event-card").forEach(function (card, i) {
      gsap.fromTo(card, { autoAlpha: 0, y: 60, rotationX: 24, transformOrigin: "50% 100%" }, {
        autoAlpha: 1, y: 0, rotationX: 0, duration: 1, ease: "power3.out", delay: i * 0.14,
        scrollTrigger: { trigger: card, start: "top 88%", once: true }
      });
    });

    /* kisah: meluncur bergantian dari dua sisi, sedikit miring */
    gsap.utils.toArray(".story-item").forEach(function (item, i) {
      reveal(item, { x: i % 2 ? 64 : -64, rotation: i % 2 ? 1.4 : -1.4 }, { duration: 1.05 });
    });

    /* galeri: membesar dengan urutan acak */
    gsap.fromTo(".gallery-grid .g-item", { autoAlpha: 0, scale: 0.78, rotation: -3 }, {
      autoAlpha: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.6)",
      stagger: { each: 0.07, from: "random" },
      scrollTrigger: { trigger: ".gallery-grid", start: "top 85%", once: true }
    });

    /* kartu amplop: naik sambil membuka */
    gsap.utils.toArray(".gift-grid .bank-card").forEach(function (card, i) {
      reveal(card, { y: 48, rotationX: 14 }, { delay: i * 0.13, duration: 0.95 });
    });

    /* judul bagian: garis emas tumbuh di bawahnya */
    gsap.utils.toArray(".section-title").forEach(function (t) {
      gsap.fromTo(t, { backgroundSize: "0% 2px" }, {
        backgroundSize: "110px 2px", duration: 1, ease: "power2.out",
        scrollTrigger: { trigger: t, start: "top 88%", once: true }
      });
    });

    /* ucapan: masuk dari kiri berurutan */
    gsap.utils.toArray(".wish").forEach(function (w, i) {
      reveal(w, { x: -30 }, { delay: (i % 3) * 0.08 });
    });

    /* foto latar bergeser pelan mengikuti scroll */
    [".hero", ".savethedate", ".closing"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      gsap.fromTo(el, { backgroundPosition: "0px 0%" }, {
        backgroundPosition: "0px 100%", ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* foto isi: zoom sangat pelan saat melewati layar */
    gsap.utils.toArray(".arch-photo img, .story-photo img").forEach(function (img) {
      gsap.fromTo(img, { scale: 1.14 }, {
        scale: 1, ease: "none",
        scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true }
      });
    });

    /* gelombang hero bergoyang pelan */
    gsap.to(".hero .wave", { xPercent: -1.6, duration: 5, ease: "sine.inOut", repeat: -1, yoyo: true });

    /* debu emas melayang naik di hero */
    var hero = document.querySelector(".hero");
    if (hero) {
      for (var i = 0; i < 16; i++) {
        var d = document.createElement("span");
        d.className = "dust";
        var size = 2 + Math.random() * 4;
        d.style.width = size + "px";
        d.style.height = size + "px";
        d.style.left = (Math.random() * 100) + "%";
        d.style.top = (55 + Math.random() * 45) + "%";
        hero.appendChild(d);
        gsap.fromTo(d, { autoAlpha: 0 }, {
          autoAlpha: 0.25 + Math.random() * 0.5, duration: 2 + Math.random() * 2,
          repeat: -1, yoyo: true, delay: Math.random() * 2, ease: "sine.inOut"
        });
        gsap.to(d, {
          y: -(60 + Math.random() * 130), x: "+=" + (Math.random() * 40 - 20),
          duration: 7 + Math.random() * 7, repeat: -1, yoyo: true, ease: "sine.inOut"
        });
      }
    }

    window.addEventListener("load", function () { window.ScrollTrigger.refresh(); });
  }

  function startSway() {
    if (!HAS_GSAP || REDUCED) return;
    window.gsap.to(".cover-ribbon, .hero-ribbon", {
      rotation: 2.6, transformOrigin: "50% 0%", duration: 2.8,
      ease: "sine.inOut", repeat: -1, yoyo: true
    });
  }

  function coverIntro() {
    if (!HAS_GSAP || REDUCED) return;
    window.gsap.fromTo(".cover-inner",
      { autoAlpha: 0, y: 28, scale: 0.98 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.95, ease: "power3.out", delay: 0.15 });
  }

  /* ---------- buka undangan ---------- */
  function showContent() {
    document.getElementById("mainContent").hidden = false;
    document.getElementById("musicBtn").hidden = false;
    var gb = document.querySelector(".gift-btn");
    if (gb) gb.hidden = false;
    document.body.style.overflow = "";
    Music.start();
    syncMusicIcon();
    window.scrollTo(0, 0);
  }

  function openInvitation() {
    var cover = document.getElementById("cover");
    if (HAS_GSAP && !REDUCED) {
      var gsap = window.gsap;
      showContent();
      initAnimations();
      gsap.to(".cover-inner", { y: -18, autoAlpha: 0, duration: 0.45, ease: "power2.in" });
      gsap.to(cover, {
        autoAlpha: 0, duration: 0.65, delay: 0.15, ease: "power2.inOut",
        onComplete: function () { cover.classList.add("opened"); }
      });
      gsap.delayedCall(0.4, heroIntro);
    } else {
      cover.classList.add("opened");
      showContent();
      initAnimations();
    }
  }

  /* ---------- hitung mundur ---------- */
  function pad(n) { return String(n).padStart(2, "0"); }
  function tickCountdown() {
    var diff = WEDDING_DATE - new Date();
    var d = 0, h = 0, m = 0, s = 0;
    if (diff > 0) {
      d = Math.floor(diff / 86400000);
      h = Math.floor(diff % 86400000 / 3600000);
      m = Math.floor(diff % 3600000 / 60000);
      s = Math.floor(diff % 60000 / 1000);
    }
    document.getElementById("cdDays").textContent = pad(d);
    document.getElementById("cdHours").textContent = pad(h);
    document.getElementById("cdMins").textContent = pad(m);
    document.getElementById("cdSecs").textContent = pad(s);
  }

  /* ---------- salin teks ---------- */
  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = document.getElementById(btn.getAttribute("data-copy"));
        if (!target) return;
        var text = target.innerText.replace(/\s*\n\s*/g, ", ").trim();
        if (btn.getAttribute("data-copy") !== "giftAddress") {
          text = target.textContent.trim();
        }
        function done() {
          var old = btn.textContent;
          btn.textContent = "Tersalin";
          btn.classList.add("copied");
          setTimeout(function () { btn.textContent = old; btn.classList.remove("copied"); }, 1800);
        }
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); done(); });
        } else { fallback(); done(); }
      });
    });
  }

  /* ---------- ucapan & RSVP (localStorage) ---------- */
  var SEED_WISHES = [
    { name: "Keluarga Besar Sutrisno", attend: "Hadir", msg: "Selamat menempuh hidup baru, Nak Sekar dan Nak Bagas. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah sampai ke Jannah-Nya." },
    { name: "Rani & Dimas", attend: "Hadir", msg: "Akhirnyaaa, happy wedding Sekar dan Bagas! Lancar sampai hari H, kami siap datang meramaikan Kotagede." },
    { name: "Pakde Harjo", attend: "Belum Pasti", msg: "Nderek bingah untuk kedua mempelai. Semoga diberi kelancaran, kesehatan, dan rezeki yang berkah." }
  ];

  function loadWishes() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return SEED_WISHES.slice();
  }

  function saveWishes(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function renderWishes() {
    var list = loadWishes();
    var box = document.getElementById("wishList");
    if (!list.length) {
      box.innerHTML = '<p class="wish-empty">Belum ada ucapan. Jadilah yang pertama memberi doa untuk kedua mempelai.</p>';
      return;
    }
    box.innerHTML = list.map(function (w) {
      return '<article class="wish">' +
        '<div class="wish-head"><span class="wish-name">' + escapeHtml(w.name) + "</span>" +
        '<span class="wish-badge">' + escapeHtml(w.attend) + "</span></div>" +
        '<p class="wish-msg">' + escapeHtml(w.msg) + "</p></article>";
    }).join("");
  }

  function initForm() {
    document.getElementById("rsvpForm").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var attend = document.getElementById("fAttend").value;
      var msg = document.getElementById("fMsg").value.trim();
      if (!name || !msg) return;
      var list = loadWishes();
      list.unshift({ name: name, attend: attend, msg: msg });
      saveWishes(list);
      renderWishes();
      document.getElementById("fMsg").value = "";
      var first = document.querySelector("#wishList .wish");
      if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.body.style.overflow = "hidden";
    setGuestName();
    tickCountdown();
    setInterval(tickCountdown, 1000);
    initCopy();
    initForm();
    renderWishes();
    coverIntro();
    startSway();
    document.getElementById("btnOpen").addEventListener("click", openInvitation);
    document.getElementById("musicBtn").addEventListener("click", function () {
      Music.toggle();
      syncMusicIcon();
    });
  });
})();
