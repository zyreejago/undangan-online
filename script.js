/* ============================================================
   Undangan Digital Sekar & Bagas — logika halaman
   Nama tamu dibaca dari path URL: /nama-tamu/
   (fallback: ?to=, lalu sessionStorage dari 404.html)
   ============================================================ */
(function () {
  "use strict";

  var WEDDING_DATE = new Date("2026-06-20T08:00:00+07:00");
  var LS_KEY = "undangan-sekar-bagas:wishes:v1";
  var REPO_BASE = "undangan-online"; // segmen dasar repo di GitHub Pages

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

  /* ---------- buka undangan ---------- */
  function openInvitation() {
    document.getElementById("cover").classList.add("opened");
    document.getElementById("mainContent").hidden = false;
    document.getElementById("musicBtn").hidden = false;
    var gb = document.querySelector(".gift-btn");
    if (gb) gb.hidden = false;
    document.body.style.overflow = "";
    Music.start();
    syncMusicIcon();
    initReveal();
    window.scrollTo(0, 0);
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

  /* ---------- animasi saat scroll ---------- */
  var revealStarted = false;
  function initReveal() {
    if (revealStarted) return;
    revealStarted = true;
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

  /* ---------- init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.body.style.overflow = "hidden";
    setGuestName();
    tickCountdown();
    setInterval(tickCountdown, 1000);
    initCopy();
    initForm();
    renderWishes();
    document.getElementById("btnOpen").addEventListener("click", openInvitation);
    document.getElementById("musicBtn").addEventListener("click", function () {
      Music.toggle();
      syncMusicIcon();
    });
  });
})();
