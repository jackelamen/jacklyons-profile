/* =========================================================
   SITE CHROME — shared across every page (homepage + journal).
   Preloader, custom cursor, fullscreen nav menu, clock, text-split
   helper, and scroll progress rail. No GSAP dependency — pages that
   don't need scroll-jacked cinematics (like journal posts) can skip
   loading it entirely.
========================================================= */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;
  window.siteReduceMotion = reduceMotion;

  /* ---------------- Preloader ---------------- */
  const preloader = document.getElementById("preloader");
  if (preloader) {
    const countEl = document.getElementById("preloaderCount");
    const fillEl = document.getElementById("preloaderFill");
    let progress = 0;
    const loadTimer = setInterval(() => {
      progress += Math.random() * 18;
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadTimer);
        setTimeout(() => preloader.classList.add("is-done"), 350);
      }
      countEl.textContent = Math.floor(progress);
      fillEl.style.width = progress + "%";
    }, 120);
  }

  /* ---------------- Custom cursor ---------------- */
  if (!isTouch) {
    const cursor = document.getElementById("cursor");
    if (cursor) {
      let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      let rx = cx, ry = cy;
      window.addEventListener("pointermove", (e) => { cx = e.clientX; cy = e.clientY; });
      (function loop() {
        rx += (cx - rx) * 0.18;
        ry += (cy - ry) * 0.18;
        cursor.style.transform = `translate(${rx}px, ${ry}px)`;
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll("a, button, [data-project]").forEach((el) => {
        el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
      });
    }
  }

  /* ---------------- Nav / fullscreen menu ---------------- */
  const navToggle = document.getElementById("navToggle");
  const menu = document.getElementById("menu");
  if (navToggle && menu) {
    navToggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open);
      menu.setAttribute("aria-hidden", !open);
    });
    menu.querySelectorAll("[data-menu-link]").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Clock (small cinematic detail) ---------------- */
  const clockEl = document.getElementById("clock");
  if (clockEl) {
    const tick = () => {
      const d = new Date();
      clockEl.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------------- Text split into lines for reveal ---------------- */
  function splitLines(el) {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines
      .map((line) => `<span class="reveal-mask"><span class="split-line">${line.trim()}</span></span>`)
      .join("<br>");
  }
  document.querySelectorAll("[data-split]").forEach(splitLines);

  document.querySelectorAll("[data-lines]").forEach((el) => {
    const text = el.textContent.trim();
    el.innerHTML = `<span class="line-inner">${text}</span>`;
  });

  /* ---------------- Scroll progress rail (vanilla — no GSAP needed) ---------------- */
  const scrollFill = document.getElementById("scrollFill");
  if (scrollFill) {
    let ticking = false;
    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      scrollFill.style.height = pct + "%";
      ticking = false;
    };
    update();
    window.addEventListener("scroll", () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------------- Lightweight reveal-on-scroll for non-GSAP pages ----------------
     Exposed globally as window.observeReveals(root) so scripts that inject content
     after this runs (e.g. the journal card renderer, which waits on a fetch) can
     register their new [data-reveal-up] elements too — otherwise anything added
     post-load would sit at opacity:0 forever, never having been observed.
  ------------------------------------------------------------------------------- */
  const revealIO = !reduceMotion && "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revealIO.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 })
    : null;

  window.observeReveals = function observeReveals(root) {
    const scope = root || document;
    const els = scope.querySelectorAll ? scope.querySelectorAll("[data-reveal-up]") : [];
    els.forEach((el) => {
      if (reduceMotion || !revealIO) {
        el.classList.add("is-in");
      } else {
        revealIO.observe(el);
      }
    });
  };

  window.observeReveals(document);
})();
