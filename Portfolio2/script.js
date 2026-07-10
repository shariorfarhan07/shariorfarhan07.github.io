/* ============================================================
   Sharior Farhan — Portfolio
   script.js — vanilla JS modules, initialized on DOMContentLoaded:
   1. Water ripple (Canvas 2D, GPU-composited, rAF-driven)
   2. Typewriter
   3. Scroll: progress bar, nav state, scroll-spy (IntersectionObserver)
   4. Reveal-on-scroll (IntersectionObserver)
   5. Experience accordion
   6. Metric counters
   7. Magnetic buttons + click ripple
   8. Mobile nav
   9. Contact form (front-end only)
   ============================================================ */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Small utilities ------------------------------------------------ */
  const throttle = (fn, wait) => {
    let last = 0, timer = null;
    return function (...args) {
      const now = Date.now();
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        fn.apply(this, args);
      } else if (!timer) {
        timer = setTimeout(() => {
          last = Date.now();
          timer = null;
          fn.apply(this, args);
        }, remaining);
      }
    };
  };

  const debounce = (fn, wait) => {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  };

  /* ================================================================
     1. WATER RIPPLE — classic two-buffer wave propagation.
        Simulation runs at reduced resolution (1 cell ≈ 4px) and is
        drawn to an offscreen canvas, then scaled up on the visible
        canvas — cheap on CPU, composited on GPU. Ambient raindrops
        keep it alive; pointer movement adds subtle wakes.
     ================================================================ */
  function initRipple() {
    const canvas = document.getElementById("rippleCanvas");
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    const SCALE = 3;              // simulation cell size in px (finer = smoother water)
    const DAMPING = 0.99;         // energy loss per frame
    const REFRACT = 3;            // background displacement strength

    let W = 0, H = 0;             // simulation grid size
    let curr, prev;               // Float32 height fields
    let off, offCtx, imageData;   // offscreen low-res canvas
    let bg;                       // precomputed "under-water" scene, Uint8Clamped RGB
    let running = false;
    let rafId = 0;

    /* Paint the still-water scene the ripples will refract: a deep
       navy body with soft blue light pools — this is what makes it
       read as water instead of flat noise. */
    function paintScene(w, h) {
      const scene = document.createElement("canvas");
      scene.width = w;
      scene.height = h;
      const sctx = scene.getContext("2d");

      // Deep vertical body
      const body = sctx.createLinearGradient(0, 0, 0, h);
      body.addColorStop(0, "#0a1224");
      body.addColorStop(0.55, "#060b18");
      body.addColorStop(1, "#04070f");
      sctx.fillStyle = body;
      sctx.fillRect(0, 0, w, h);

      // Soft light pools (moon-through-water feel)
      const pools = [
        { x: 0.72, y: 0.30, r: 0.55, c: "rgba(56, 99, 204, 0.34)" },
        { x: 0.18, y: 0.72, r: 0.45, c: "rgba(38, 70, 150, 0.22)" },
        { x: 0.45, y: 0.05, r: 0.38, c: "rgba(96, 140, 235, 0.16)" },
      ];
      for (const p of pools) {
        const g = sctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, p.r * Math.max(w, h));
        g.addColorStop(0, p.c);
        g.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, w, h);
      }

      // Faint diagonal caustic streaks
      sctx.globalAlpha = 0.05;
      sctx.strokeStyle = "#7fa8f7";
      sctx.lineWidth = 1;
      for (let i = -h; i < w; i += 26) {
        sctx.beginPath();
        sctx.moveTo(i, 0);
        sctx.lineTo(i + h * 0.6, h);
        sctx.stroke();
      }
      sctx.globalAlpha = 1;

      return sctx.getImageData(0, 0, w, h).data;
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      W = Math.max(2, Math.ceil(rect.width / SCALE));
      H = Math.max(2, Math.ceil(rect.height / SCALE));
      curr = new Float32Array(W * H);
      prev = new Float32Array(W * H);
      off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      offCtx = off.getContext("2d");
      imageData = offCtx.createImageData(W, H);
      imageData.data.fill(255); // opaque alpha; RGB written every frame
      bg = paintScene(W, H);
    }

    function drop(x, y, radius, strength) {
      const gx = Math.floor(x / SCALE);
      const gy = Math.floor(y / SCALE);
      for (let j = -radius; j <= radius; j++) {
        for (let i = -radius; i <= radius; i++) {
          const px = gx + i, py = gy + j;
          if (px < 1 || px >= W - 1 || py < 1 || py >= H - 1) continue;
          const dist = Math.sqrt(i * i + j * j);
          if (dist <= radius) {
            // Smooth cosine profile — round drops, no square artifacts
            prev[py * W + px] += strength * (Math.cos((dist / radius) * Math.PI) + 1) * 0.5;
          }
        }
      }
    }

    function step() {
      // Wave equation: new = neighbors' average * 2 - old, then damp
      for (let y = 1; y < H - 1; y++) {
        const row = y * W;
        for (let x = 1; x < W - 1; x++) {
          const i = row + x;
          curr[i] = ((prev[i - 1] + prev[i + 1] + prev[i - W] + prev[i + W]) * 0.5 - curr[i]) * DAMPING;
        }
      }
      const tmp = prev; prev = curr; curr = tmp;
    }

    function paint() {
      const d = imageData.data;
      const maxX = W - 1, maxY = H - 1;
      for (let y = 1; y < maxY; y++) {
        const row = y * W;
        for (let x = 1; x < maxX; x++) {
          const i = row + x;
          // Wave surface gradient
          const gx = prev[i - 1] - prev[i + 1];
          const gy = prev[i - W] - prev[i + W];

          // Refraction: sample the scene displaced along the gradient
          let sx = x + (gx * REFRACT | 0);
          let sy = y + (gy * REFRACT | 0);
          if (sx < 0) sx = 0; else if (sx > maxX) sx = maxX;
          if (sy < 0) sy = 0; else if (sy > maxY) sy = maxY;
          const s = (sy * W + sx) * 4;
          const p = i * 4;

          // Specular glint on slopes facing the light (upper-left)
          const spec = (gx + gy) * 42;
          if (spec > 0) {
            const t = spec > 60 ? 60 : spec;
            d[p]     = bg[s]     + t * 0.55;
            d[p + 1] = bg[s + 1] + t * 0.75;
            d[p + 2] = bg[s + 2] + t;
          } else {
            // Shadowed slope — slightly deepen
            const t = 1 + spec * 0.003;
            const k = t < 0.82 ? 0.82 : t;
            d[p]     = bg[s] * k;
            d[p + 1] = bg[s + 1] * k;
            d[p + 2] = bg[s + 2] * k;
          }
        }
      }
      offCtx.putImageData(imageData, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
    }

    let lastRain = 0;
    function frame(t) {
      // Gentle ambient raindrop at a random spot
      if (t - lastRain > 900) {
        lastRain = t;
        drop(Math.random() * canvas.width, Math.random() * canvas.height, 4, 34);
      }
      step();
      paint();
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (!running) { running = true; rafId = requestAnimationFrame(frame); }
    }
    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    // Pointer wake — throttled by distance so it stays subtle
    let lastX = -100, lastY = -100;
    const hero = canvas.parentElement;
    hero.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = x - lastX, dy = y - lastY;
      if (dx * dx + dy * dy > 300) {
        drop(x, y, 3, 26);
        lastX = x; lastY = y;
      }
    }, { passive: true });

    hero.addEventListener("pointerdown", (e) => {
      const rect = canvas.getBoundingClientRect();
      drop(e.clientX - rect.left, e.clientY - rect.top, 6, 110);
    }, { passive: true });

    // Pause simulation when the hero is off-screen or the tab is hidden
    new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.02 }).observe(canvas);

    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    window.addEventListener("resize", debounce(resize, 200));
    resize();
    // Welcome drops so the water is alive on load
    drop(canvas.width * 0.68, canvas.height * 0.38, 6, 110);
    drop(canvas.width * 0.30, canvas.height * 0.70, 4, 60);
    start();
  }

  /* ================================================================
     2. TYPEWRITER — cycles through role phrases, no libraries.
     ================================================================ */
  function initTypewriter() {
    const el = document.getElementById("typewriter");
    if (!el) return;
    if (prefersReducedMotion) return; // keep the static default text

    const phrases = [
      "Backend Engineer",
      "Java · Spring Boot Specialist",
      "Microservices Architect",
      "Performance Engineer",
    ];
    let phrase = 0, char = phrases[0].length, deleting = true, delay = 2200;

    function tick() {
      const text = phrases[phrase];
      if (deleting) {
        char--;
        el.textContent = text.slice(0, char);
        delay = 34;
        if (char === 0) {
          deleting = false;
          phrase = (phrase + 1) % phrases.length;
          delay = 320;
        }
      } else {
        char++;
        el.textContent = phrases[phrase].slice(0, char);
        delay = 58;
        if (char === phrases[phrase].length) {
          deleting = true;
          delay = 2400;
        }
      }
      setTimeout(tick, delay);
    }
    setTimeout(tick, 2400);
  }

  /* ================================================================
     3. SCROLL — progress bar, nav background, scroll-spy.
        Progress uses rAF; spy uses IntersectionObserver (no scroll math).
     ================================================================ */
  function initScroll() {
    const progress = document.getElementById("scrollProgress");
    const nav = document.getElementById("nav");
    const hero = document.getElementById("home");
    let ticking = false;

    function update() {
      ticking = false;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
      nav.classList.toggle("is-scrolled", window.scrollY > 24);
    }

    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    // Nav is light-on-dark while the hero is under it
    new IntersectionObserver((entries) => {
      nav.classList.toggle("on-hero", entries[0].isIntersecting);
    }, { rootMargin: "-68px 0px 0px 0px", threshold: 0 }).observe(hero);

    // Scroll-spy: highlight the nav link of the section in view
    const links = new Map();
    document.querySelectorAll(".nav-link").forEach((a) => {
      links.set(a.getAttribute("href").slice(1), a);
    });
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = links.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove("is-active"));
          link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

    // Back to top
    document.getElementById("backTop").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  /* ================================================================
     4. REVEAL ON SCROLL
     ================================================================ */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (prefersReducedMotion) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => io.observe(el));
  }

  /* ================================================================
     5. EXPERIENCE ACCORDION — expandable cards, ARIA-correct.
     ================================================================ */
  function initAccordion() {
    document.querySelectorAll(".xp-head").forEach((head) => {
      const body = document.getElementById(head.getAttribute("aria-controls"));
      // `hidden` is only for the no-JS/initial state; CSS animates the rest
      body.hidden = false;
      head.addEventListener("click", () => {
        const open = head.getAttribute("aria-expanded") === "true";
        head.setAttribute("aria-expanded", String(!open));
      });
    });
  }

  /* ================================================================
     6. METRIC COUNTERS — count up when scrolled into view.
     ================================================================ */
  function initCounters() {
    const nums = document.querySelectorAll(".metric-num[data-count]");
    if (!nums.length) return;
    if (prefersReducedMotion) return; // static text is already correct

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || "";
        const t0 = performance.now();
        const DURATION = 1100;
        (function run(now) {
          const t = Math.min((now - t0) / DURATION, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (t < 1) requestAnimationFrame(run);
        })(t0);
      });
    }, { threshold: 0.6 });
    nums.forEach((el) => io.observe(el));
  }

  /* ================================================================
     7. MAGNETIC BUTTONS + CLICK RIPPLE
     ================================================================ */
  function initButtons() {
    if (!prefersReducedMotion && matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll(".magnetic").forEach((btn) => {
        let rafId = 0;
        btn.addEventListener("pointermove", (e) => {
          cancelAnimationFrame(rafId);
          rafId = requestAnimationFrame(() => {
            const r = btn.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            btn.style.transform = "translate(" + dx * 0.18 + "px," + dy * 0.22 + "px)";
          });
        });
        btn.addEventListener("pointerleave", () => {
          cancelAnimationFrame(rafId);
          btn.style.transform = "";
        });
      });
    }

    // Material-style click ripple on all .btn elements
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn");
      if (!btn || prefersReducedMotion) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const span = document.createElement("span");
      span.className = "btn-ripple";
      span.style.width = span.style.height = size + "px";
      span.style.left = (e.clientX - r.left - size / 2) + "px";
      span.style.top = (e.clientY - r.top - size / 2) + "px";
      btn.appendChild(span);
      span.addEventListener("animationend", () => span.remove());
    });
  }

  /* ================================================================
     7c. ACHIEVEMENT CAROUSEL — auto-advances every few seconds,
         pauses on hover/focus, click arrows or dots to jump.
     ================================================================ */
  function initCarousel() {
    const carousel = document.getElementById("achCarousel");
    const track = document.getElementById("carouselTrack");
    const dotsWrap = document.getElementById("carouselDots");
    const prevBtn = document.getElementById("carouselPrev");
    const nextBtn = document.getElementById("carouselNext");
    if (!carousel || !track || !dotsWrap) return;

    const slides = Array.from(track.children);
    if (!slides.length) return;

    const AUTO_MS = 4000;
    let index = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `Go to photo ${i + 1}`);
      dot.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function render() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", i === index ? "true" : "false");
      });
    }
    function goTo(i, manual) {
      index = (i + slides.length) % slides.length;
      render();
      if (manual) restart();
    }
    function stop() { clearInterval(timer); timer = null; }
    function start() {
      if (prefersReducedMotion) return;
      stop();
      timer = setInterval(() => goTo(index + 1), AUTO_MS);
    }
    function restart() { start(); }

    prevBtn && prevBtn.addEventListener("click", () => goTo(index - 1, true));
    nextBtn && nextBtn.addEventListener("click", () => goTo(index + 1, true));

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);

    // touch swipe (arrows are hidden on small screens)
    let touchX = null;
    carousel.addEventListener("touchstart", (e) => {
      touchX = e.touches[0].clientX;
      stop();
    }, { passive: true });
    carousel.addEventListener("touchend", (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      touchX = null;
      if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1), true);
      else start();
    }, { passive: true });

    render();
    start();
  }

  /* ================================================================
     7c. ROCKET — launches from the bottom of the Achievements
         section each time the reader reaches it.
     ================================================================ */
  function initRocket() {
    const rocket = document.getElementById("rocketLaunch");
    const sentinel = document.getElementById("rocketSentinel");
    if (!rocket || !sentinel || prefersReducedMotion) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        rocket.classList.remove("is-flying");
        void rocket.offsetWidth; // reflow so the animation replays
        rocket.classList.add("is-flying");
      });
    }, { threshold: 0 });
    io.observe(sentinel);

    rocket.addEventListener("animationend", (e) => {
      if (e.animationName === "rocket-fly") rocket.classList.remove("is-flying");
    });
  }

  /* ================================================================
     7d. PAPER PLANE — flies down the Achievements timeline,
         position driven by scroll progress through the section.
     ================================================================ */
  function initPlane() {
    const plane = document.getElementById("achPlane");
    const timeline = plane && plane.closest(".ach-timeline");
    if (!plane || !timeline || prefersReducedMotion) return;

    let ticking = false;
    let lastY = window.scrollY;
    function update() {
      ticking = false;
      const scrollY = window.scrollY;
      if (scrollY < lastY - 1) plane.classList.add("is-up");
      else if (scrollY > lastY + 1) plane.classList.remove("is-up");
      lastY = scrollY;
      const rect = timeline.getBoundingClientRect();
      const anchor = window.innerHeight * 0.55; // plane tracks just below mid-viewport
      const progress = Math.min(1, Math.max(0, (anchor - rect.top) / rect.height));
      const y = progress * (rect.height - 26);
      plane.style.transform = `translate(-50%, ${y}px)`;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
  }

  /* ================================================================
     7e. PAC-MAN — arcade-style cutscene strip at the bottom of the
         Tech Stack section. Classic loop: Blinky chases Pac-Man
         across the strip while he eats dots; Pac-Man grabs the
         power pellet, Blinky turns frightened-blue and flees,
         Pac-Man reverses, eats him ("200"), the eyes fly home,
         and the scene resets. Runs only while visible.
     ================================================================ */
  function initPacman() {
    const canvas = document.getElementById("pacCanvas");
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext("2d");
    const H = 80;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;

    const YELLOW = "#FFD800";   // classic pac-man yellow
    const RED = "#E33A2F";      // classic ghost red
    const FRIGHT = "#dbe6fd";   // frightened: soft accent
    const DOT = "#9aa1ab";
    const MAZE = "#dbe6fd";
    const FACE = "#2563eb";     // frightened face + pupils
    const BG = "#ffffff";

    const S = {};
    function resize() {
      W = canvas.clientWidth;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      reset();
    }
    function reset() {
      S.mode = "chase";        // chase → fright → eyes → pause
      S.t = 0;
      S.pauseT = 0;
      S.pac = { x: -40, dir: 1 };
      S.ghost = { x: -140 };
      S.popup = null;
      S.pellet = { x: W * 0.86, eaten: false };
      S.dots = [];
      for (let x = 26; x < W * 0.8; x += 26) S.dots.push(x);
    }

    function update(dt) {
      S.t += dt;
      if (S.popup) { S.popup.t -= dt; if (S.popup.t <= 0) S.popup = null; }

      if (S.mode === "chase") {
        S.pac.x += 105 * dt;
        S.ghost.x += 105 * dt;
        S.dots = S.dots.filter((d) => d > S.pac.x - 10);
        if (S.pac.x >= S.pellet.x) {
          S.pellet.eaten = true;
          S.pac.dir = -1;
          S.mode = "fright";
        }
      } else if (S.mode === "fright") {
        S.pac.x -= 140 * dt;
        S.ghost.x -= 80 * dt;
        if (S.pac.x - S.ghost.x <= 10) {
          S.popup = { x: S.ghost.x, t: 1.0 };
          S.mode = "eyes";
        }
      } else if (S.mode === "eyes") {
        S.pac.x -= 140 * dt;
        S.ghost.x -= 300 * dt;
        if (S.pac.x < -50 && S.ghost.x < -60) { S.mode = "pause"; S.pauseT = 0.9; }
      } else if (S.mode === "pause") {
        S.pauseT -= dt;
        if (S.pauseT <= 0) reset();
      }
    }

    function drawPacman(x, y, r, dir) {
      const mouth = 0.32 + 0.26 * Math.sin(S.t * 16);
      const base = dir === 1 ? 0 : Math.PI;
      ctx.fillStyle = YELLOW;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, r, base + mouth, base - mouth + Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    function drawGhost(x, y, w, opts) {
      const r = w / 2, top = y - 10, yb = y + 13;
      if (!opts.eyesOnly) {
        ctx.fillStyle = opts.fright ? FRIGHT : RED;
        ctx.beginPath();
        ctx.moveTo(x - r, yb);
        ctx.lineTo(x - r, top);
        ctx.arc(x, top, r, Math.PI, 0);
        ctx.lineTo(x + r, yb);
        // classic 3-scallop skirt
        const seg = w / 6;
        for (let i = 0; i < 3; i++) {
          ctx.lineTo(x + r - seg * (2 * i + 1), yb - 5);
          ctx.lineTo(x + r - seg * (2 * i + 2), yb);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (opts.fright && !opts.eyesOnly) {
        // frightened face: accent eyes + wavy mouth
        ctx.fillStyle = FACE;
        ctx.beginPath(); ctx.arc(x - 5, top + 1, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 5, top + 1, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = FACE;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x - 8, top + 9);
        for (let i = 0; i < 4; i++) {
          ctx.lineTo(x - 8 + (i * 4 + 2), top + 7);
          ctx.lineTo(x - 8 + (i * 4 + 4), top + 9);
        }
        ctx.stroke();
      } else {
        // normal eyes — pupils follow the mouse when it's around
        [-5, 5].forEach((off) => {
          const eyeX = x + off, eyeY = top + 1;
          let px = (opts.dir || 1) * 1.8, py = 1.5;
          if (S.mouse) {
            const dx = S.mouse.x - eyeX, dy = S.mouse.y - eyeY;
            const len = Math.hypot(dx, dy) || 1;
            px = (dx / len) * 2.2;
            py = (dy / len) * 2.2;
          }
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.ellipse(eyeX, eyeY, 4, 4.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = FACE;
          ctx.beginPath();
          ctx.arc(eyeX + px, eyeY + 1 + py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    function draw() {
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      // maze walls
      ctx.strokeStyle = MAZE;
      ctx.lineWidth = 2;
      ctx.strokeRect(4.5, 4.5, W - 9, H - 9);
      ctx.strokeRect(8.5, 8.5, W - 17, H - 17);

      const y = H / 2 + 4;
      // dots
      ctx.fillStyle = DOT;
      S.dots.forEach((d) => { ctx.fillRect(d - 2, y - 2, 4, 4); });
      // power pellet (blinks)
      if (!S.pellet.eaten && Math.floor(S.t * 5) % 2 === 0) {
        ctx.beginPath();
        ctx.arc(S.pellet.x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      // ghost
      const ghostOpts = S.mode === "eyes"
        ? { eyesOnly: true, dir: -1 }
        : { fright: S.mode === "fright", dir: S.mode === "fright" ? -1 : 1 };
      if (S.mode !== "pause") drawGhost(S.ghost.x, y, 26, ghostOpts);
      // pac-man
      if (S.mode !== "pause") drawPacman(S.pac.x, y, 13, S.pac.dir);
      // score popup
      if (S.popup) {
        ctx.fillStyle = "#1d4ed8";
        ctx.font = "700 13px 'Geist Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("200", S.popup.x, y - 18);
        ctx.font = "500 11px 'Geist Mono', monospace";
        ctx.fillText("focus is important", S.popup.x, y + 26);
      }
    }

    let rafId = null;
    let last = 0;
    function loop(ts) {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      update(dt);
      draw();
    }
    function start() { if (rafId == null) { last = performance.now(); rafId = requestAnimationFrame(loop); } }
    function stop() { if (rafId != null) { cancelAnimationFrame(rafId); rafId = null; } }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      S.mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    }, { passive: true });
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? start() : stop()));
    }, { threshold: 0.1 }).observe(canvas);
  }

  /* ================================================================
     8. MOBILE NAV
     ================================================================ */
  function initMobileNav() {
    const toggle = document.getElementById("navToggle");
    const menu = document.getElementById("navMenu");

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
    }

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("is-open", !open);
    });

    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    window.addEventListener("resize", throttle(() => {
      if (window.innerWidth > 820) close();
    }, 200));
  }

  /* ================================================================
     9. CONTACT FORM — front-end validation + mailto handoff.
     ================================================================ */
  function initForm() {
    const form = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll("[required]").forEach((field) => {
        const bad = !field.value.trim() ||
          (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value));
        field.classList.toggle("is-invalid", bad);
        if (bad) valid = false;
      });

      if (!valid) {
        status.textContent = "Please fill in your name, a valid email, and a message.";
        status.className = "form-status err";
        return;
      }

      // Front-end only: open the visitor's mail client, pre-filled
      const name = form.name.value.trim();
      const subject = form.subject.value.trim() || "Hello from your portfolio";
      const body = form.message.value.trim() + "\n\n— " + name + " (" + form.email.value.trim() + ")";
      window.location.href = "mailto:shariorfarhan07@gmail.com"
        + "?subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(body);

      status.textContent = "Opening your email client… Thanks for reaching out!";
      status.className = "form-status ok";
      form.reset();
    });

    form.addEventListener("input", (e) => {
      if (e.target.classList.contains("is-invalid") && e.target.value.trim()) {
        e.target.classList.remove("is-invalid");
      }
    });
  }

  /* ================================================================
     DINO — small auto-playing runner in the About section.
     Runs a simple lookahead AI until the visitor jumps (click/tap/
     Space/ArrowUp), at which point control switches to them; it
     reverts to auto-play a few seconds after they stop playing.
     ================================================================ */
  function initDino() {
    const canvas = document.getElementById("dinoCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const statusEl = document.getElementById("dinoStatus");
    const scoreEl = document.getElementById("dinoScore");
    const resetBtn = document.getElementById("dinoReset");

    const W = canvas.width, H = canvas.height;
    const GROUND_Y = H - 6;       // ground line sits flush with the canvas's bottom edge
    const GRAVITY = 0.0019;
    const JUMP_V = -0.66;

    /* ---- Sprites: real SVG silhouettes (data URIs), drawn via drawImage.
       Two dino frames alternate while running for a walking-leg feel;
       two cactus variants (single stem / saguaro with arms) for variety. */
    function svgImage(markup) {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
      return img;
    }
    const DINO_SVG_RAW = `<svg height="2500" viewBox="13.848000000000003 0 283.6449999999999 305.4" width="2328" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><path d="M269.352 91.664h-42.436V80.04h70.577v-65.73h-14.294V0H168.4v14.309h-13.848v91.664H140.26v13.861h-20.994v14.309H98.271v14.308H83.977v13.862H58.069v-14.309H44.222v-13.861H29.928v-28.17h-16.08v86.746h13.847v14.308h14.293v13.862h13.848v14.308H70.13v13.862h13.847v56.34h30.375V289.3h-13.848V277.23h13.848v-13.862h14.294V249.06h11.613v14.308h14.294V305.4h30.375V289.3h-14.294v-54.104h14.294V220.89h13.847v-21.016h14.294v-49.186h11.614v13.862h16.527v-30.406h-28.14v-25.934h56.282z" fill="__FILL__"></path><path d="M182.248 20.569h16.974V37.56h-16.974z" fill="__EYE__"></path></g></svg>`;
    const DINO_COLOR = "#2563eb";
    const DINO_DEAD_COLOR = "#9aa4b2";
    function dinoSvg(color, eyeColor) {
      return DINO_SVG_RAW.replace("__FILL__", color).replace("__EYE__", eyeColor);
    }
    const dinoFrames = [svgImage(dinoSvg(DINO_COLOR, "#ffffff"))];
    const dinoFramesDead = [svgImage(dinoSvg(DINO_DEAD_COLOR, "#e4e6ea"))];

    const CACTUS_COLOR = "#3d434d";
    const cactusSmallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32">
      <rect fill="${CACTUS_COLOR}" x="9" y="4" width="6" height="28" rx="3"/>
      <rect fill="${CACTUS_COLOR}" x="2" y="12" width="6" height="14" rx="3"/>
    </svg>`;
    const cactusTallSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 44">
      <rect fill="${CACTUS_COLOR}" x="10" y="2" width="6" height="42" rx="3"/>
      <rect fill="${CACTUS_COLOR}" x="2" y="14" width="6" height="20" rx="3"/>
      <rect fill="${CACTUS_COLOR}" x="18" y="9" width="6" height="18" rx="3"/>
    </svg>`;
    const cactusSmall = svgImage(cactusSmallSvg);
    const cactusTall = svgImage(cactusTallSvg);

    let dino, obstacles, speed, score, best = 0, dead, auto, idleTimer, last;

    function reset() {
      dino = { y: GROUND_Y, vy: 0, w: 30, h: 42, onGround: true };
      obstacles = [];
      speed = 0.24;
      score = 0;
      dead = false;
      last = null;
      spawnObstacle(560);
      updateHud();
    }

    function spawnObstacle(atX) {
      const tall = Math.random() < 0.35;
      obstacles.push({
        x: atX ?? W + 30,
        w: tall ? 20 : 18,
        h: tall ? 40 : 26,
        sprite: tall ? cactusTall : cactusSmall,
      });
    }

    function jump() {
      if (dead) { reset(); return; }
      if (dino.onGround) {
        dino.vy = JUMP_V;
        dino.onGround = false;
      }
    }

    function setAuto(isAuto) {
      auto = isAuto;
      statusEl.textContent = isAuto
        ? "Auto-playing — click or press Space to take over"
        : "You're playing — Space/click to jump";
      canvas.classList.toggle("is-manual", !isAuto);
    }

    function armIdleReturn() {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setAuto(true), 4000);
    }

    function updateHud() {
      scoreEl.textContent = "Score: " + Math.floor(score) + (best ? "  ·  Best: " + Math.floor(best) : "");
    }

    function step(dt) {
      // Auto-play: jump when the nearest obstacle enters a safe braking window.
      // Window is tuned to the dino's jump arc so it clears both obstacle heights.
      if (auto) {
        const dinoFrontX = 26 + dino.w;
        const next = obstacles.find((o) => o.x + o.w > dinoFrontX);
        if (next && dino.onGround) {
          const gap = next.x - dinoFrontX;
          const reactionWindow = 90 + speed * 170;
          if (gap < reactionWindow && gap > -6) jump();
        }
      }

      // Physics
      dino.vy += GRAVITY * dt;
      dino.y += dino.vy * dt;
      if (dino.y >= GROUND_Y) {
        dino.y = GROUND_Y;
        dino.vy = 0;
        dino.onGround = true;
      }

      // Obstacles
      speed = Math.min(speed + 0.0000035 * dt, 0.6);
      obstacles.forEach((o) => { o.x -= speed * dt; });
      if (obstacles.length && obstacles[0].x < -30) obstacles.shift();
      if (!obstacles.length || obstacles[obstacles.length - 1].x < W - (170 + Math.random() * 160)) {
        spawnObstacle();
      }

      // Collision (small forgiving hitbox, matches the dino's drawn position)
      const dLeft = 26 + 4, dRight = 26 + dino.w - 6;
      const dTop = dino.y - dino.h + 4;
      obstacles.forEach((o) => {
        const oTop = GROUND_Y - o.h;
        const overlapX = dRight > o.x + 2 && dLeft < o.x + o.w - 2;
        const overlapY = dTop < GROUND_Y && oTop < dino.y - 2;
        if (overlapX && overlapY) dead = true;
      });

      if (!dead) {
        score += dt * 0.012;
        updateHud();
      } else {
        best = Math.max(best, score);
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // Ground line — flush with the widget's own bottom rule
      ctx.strokeStyle = "rgba(107,114,128,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y + 1);
      ctx.lineTo(W, GROUND_Y + 1);
      ctx.stroke();

      // Dino — the real dinosaur-game silhouette, with a tiny running bob
      const dx = 26, dy = dino.y - dino.h - (dead || !dino.onGround ? 0 : Math.sin(performance.now() / 90) * 1.4);
      const frames = dead ? dinoFramesDead : dinoFrames;
      const sprite = frames[0];
      if (sprite.complete && sprite.naturalWidth) {
        ctx.drawImage(sprite, dx, dy, dino.w, dino.h);
      }

      // Obstacles — real SVG cactus sprites
      obstacles.forEach((o) => {
        if (o.sprite.complete && o.sprite.naturalWidth) {
          ctx.drawImage(o.sprite, o.x, GROUND_Y - o.h, o.w, o.h);
        }
      });

      if (dead) {
        ctx.fillStyle = "rgba(12,14,18,0.06)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#0c0e12";
        ctx.font = "600 14px " + getComputedStyle(document.body).fontFamily;
        ctx.textAlign = "center";
        ctx.fillText("Click to try again", W / 2, H / 2);
        ctx.textAlign = "left";
      }
    }

    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    let rafId, running = false, deadAt = 0;
    function frame(t) {
      if (!last) last = t;
      const dt = Math.min(t - last, 40);
      last = t;
      if (!dead) {
        step(dt);
      } else {
        if (!deadAt) deadAt = t;
        // In auto mode, restart on its own after a short beat so the
        // widget never sits frozen waiting for a click.
        if (auto && t - deadAt > 900) { deadAt = 0; reset(); }
      }
      draw();
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (!running) { running = true; last = null; rafId = requestAnimationFrame(frame); }
    }
    function stop() { running = false; cancelAnimationFrame(rafId); }

    function takeControl() {
      if (auto) { setAuto(false); armIdleReturn(); }
      else armIdleReturn();
      jump();
    }

    canvas.addEventListener("pointerdown", takeControl);
    canvas.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        takeControl();
      }
    });
    document.addEventListener("keydown", (e) => {
      if ((e.code === "Space" || e.code === "ArrowUp") && document.activeElement === canvas) return;
      if (e.code === "Space" && isInViewport(canvas)) {
        // Also allow Space to control the game when it's on-screen but unfocused
        e.preventDefault();
        takeControl();
      }
    });
    resetBtn.addEventListener("click", () => { reset(); setAuto(true); });

    function isInViewport(el) {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    }

    // Pause the loop off-screen / hidden tab to save cycles
    new IntersectionObserver((entries) => {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.05 }).observe(canvas);
    document.addEventListener("visibilitychange", () => {
      document.hidden ? stop() : start();
    });

    setAuto(true);
    reset();
  }

  /* Init all ------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initRipple();
    initTypewriter();
    initScroll();
    initReveal();
    initAccordion();
    initCounters();
    initButtons();
    initCarousel();
    initRocket();
    initPlane();
    initPacman();
    initDino();
    initMobileNav();
    initForm();
  });
})();
