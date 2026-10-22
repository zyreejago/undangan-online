/* ============================================================
   Undangan Digital Sekar & Bagas — logika halaman
   ============================================================ */
(function () {
  "use strict";

  var WEDDING_DATE = new Date("2026-06-20T08:00:00+07:00");
  var LS_KEY = "undangan-sekar-bagas:wishes:v1";

  /* ---------- nama tamu dari URL: ?to=Nama+Tamu ---------- */
  function setGuestName() {
    var params = new URLSearchParams(window.location.search);
    var to = (params.get("to") || "").trim();
    if (to) {
      document.getElementById("guestName").textContent = to;
      var nameInput = document.getElementById("fName");
      if (nameInput && !nameInput.value) nameInput.value = to;
    }
  }

  /* ---------- musik latar: petikan pentatonis lembut (WebAudio) ---------- */
  var Music = (function () {
    var ctx = null, timer = null, playing = false;
    var SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    var step = 0;

    function pluck(freq, when, vol) {
      var osc = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc2.type = "triangle";
      osc2.frequency.value = freq * 2;
      var g2 = ctx.createGain();
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
      var idx = pattern[step % pattern.length];
      var now = ctx.currentTime;
      pluck(SCALE[idx], now, 0.11);
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
      toggle: function () { playing ? stop() : start(); return playing; },
      isPlaying: function () { return playing; }
    };
  })();

  /* ---------- buka undangan ---------- */
  function openInvitation() {
    document.getElementById("cover").classList.add("opened");
    var main = document.getElementById("mainContent");
    main.hidden = false;
    document.getElementById("musicBtn").hidden = false;
    document.body.style.overflow = "";
    Music.start();
    syncMusicIcon();
    initReveal();
    window.scrollTo(0, 0);
  }

  function syncMusicIcon() {
    var btn = document.getElementById("musicBtn");
    var on = btn.querySelector(".ic-on");
    var off = btn.querySelector(".ic-off");
    var playing = Music.isPlaying();
    on.style.display = playing ? "" : "none";
    off.style.display = playing ? "none" : "";
    btn.classList.toggle("playing", playing);
  }

  /* ---------- hitung mundur ---------- */
  function pad(n) { return String(n).padStart(2, "0"); }
  function tickCountdown() {
    var diff = WEDDING_DATE - new Date();
    if (diff <= 0) {
      document.getElementById("cdDays").textContent = "00";
      document.getElementById("cdHours").textContent = "00";
      document.getElementById("cdMins").textContent = "00";
      document.getElementById("cdSecs").textContent = "00";
      return;
    }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor(diff % 86400000 / 3600000);
    var m = Math.floor(diff % 3600000 / 60000);
    var s = Math.floor(diff % 60000 / 1000);
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
        var text = target.textContent.trim();
        function done() {
          var old = btn.textContent;
          btn.textContent = "Tersalin";
          btn.classList.add("copied");
          setTimeout(function () { btn.textContent = old; btn.classList.remove("copied"); }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); done(); });
        } else { fallback(); done(); }
        function fallback() {
          var ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta);
        }
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
        '<div class="wish-head"><span class="wish-name">' + escapeHtml(w.name) + '</span>' +
        '<span class="wish-badge">' + escapeHtml(w.attend) + '</span></div>' +
        '<p class="wish-msg">' + escapeHtml(w.msg) + '</p></article>';
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
    }, { threshold: 0.12 });
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
