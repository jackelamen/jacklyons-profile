/* =========================================================
   JACK LYONS — CINEMATIC PORTFOLIO
   Scroll choreography, lightweight canvas atmosphere, and
   performance guards (pause off-screen work, respect
   prefers-reduced-motion, cheap DOM writes via rAF/ScrollTrigger).
========================================================= */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* ---------------- Preloader ---------------- */
  const preloader = document.getElementById("preloader");
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

  /* ---------------- Custom cursor ---------------- */
  if (!isTouch) {
    const cursor = document.getElementById("cursor");
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

  /* ---------------- Nav / fullscreen menu ---------------- */
  const navToggle = document.getElementById("navToggle");
  const menu = document.getElementById("menu");
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

  /* ---------------- Text split into lines/words for reveal ---------------- */
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

  /* ---------------- GSAP setup ---------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: "power3.out" });

    // Hero entrance
    gsap.timeline({ delay: 0.4 })
      .from(".hero [data-split] .split-line", { yPercent: 110, duration: 1.1, stagger: 0.08 })
      .from(".hero__desc", { opacity: 0, y: 20, duration: 0.9 }, "-=0.6")
      .from(".hero__scroll, .hero__meta", { opacity: 0, duration: 0.9 }, "-=0.6");

    // Hero parallax on scroll
    gsap.to(".hero__content", {
      yPercent: 30,
      opacity: 0.2,
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__canvas", {
      yPercent: 15,
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Intro line reveal
    gsap.to(".intro__text .line-inner", {
      backgroundSize: "100% 100%",
      scrollTrigger: { trigger: ".intro", start: "top 70%", end: "top 20%", scrub: true },
    });
    gsap.from(".intro__text", {
      opacity: 0.25,
      scrollTrigger: { trigger: ".intro", start: "top 85%", end: "top 30%", scrub: true },
    });

    /* ---------------- Story: pinned chapters ---------------- */
    const chapters = gsap.utils.toArray(".chapter");
    const progressDots = gsap.utils.toArray(".story__progress span");
    const storyBg = document.getElementById("storyBg");

    ScrollTrigger.create({
      trigger: ".story",
      start: "top top",
      end: "bottom bottom",
      pin: ".story__pin",
      onUpdate: (self) => {
        const idx = Math.min(chapters.length - 1, Math.floor(self.progress * chapters.length));
        chapters.forEach((c, i) => c.classList.toggle("is-active", i === idx));
        progressDots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
        const tint = chapters[idx].dataset.tint;
        if (tint) storyBg.style.background = tint;
      },
    });

    /* ---------------- Work: horizontal pinned scroll ---------------- */
    const track = document.getElementById("workTrack");
    if (window.innerWidth > 760 && track) {
      const getScrollAmount = () => track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).fontSize) * 4;

      let scrollTween = gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: ".work__pin",
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      gsap.utils.toArray(".project__media").forEach((media) => {
        gsap.fromTo(media, { opacity: 0.4, scale: 1.06 }, {
          opacity: 1, scale: 1,
          scrollTrigger: {
            trigger: media,
            containerAnimation: scrollTween,
            start: "left 85%",
            end: "left 40%",
            scrub: true,
          },
        });
      });
    }

    /* ---------------- Milestones timeline ---------------- */
    gsap.to("#timelineFill", {
      height: "100%",
      ease: "none",
      scrollTrigger: { trigger: ".timeline", start: "top 60%", end: "bottom 80%", scrub: true },
    });

    gsap.utils.toArray(".milestone").forEach((m) => {
      ScrollTrigger.create({
        trigger: m,
        start: "top 75%",
        end: "top 30%",
        onEnter: () => m.classList.add("is-active"),
        onEnterBack: () => m.classList.add("is-active"),
      });
    });

    // Stat counters
    gsap.utils.toArray(".stat__num").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => {
          gsap.fromTo(el, { textContent: 0 }, {
            textContent: target,
            duration: 1.6,
            ease: "power2.out",
            snap: { textContent: 1 },
          });
        },
      });
    });

    // Generic headings reveal
    gsap.utils.toArray(".work__heading, .milestones__heading, .contact__heading").forEach((el) => {
      gsap.from(el.querySelectorAll(".split-line"), {
        yPercent: 110,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // Scroll progress rail
    gsap.to("#scrollFill", {
      height: "100%",
      ease: "none",
      scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: true },
    });

    // Nav mix-blend already handles contrast; fade nav on hero only if reduce motion off
  }

  /* ---------------- Hero canvas: lightweight ambient drift ----------------
     Pure CSS-gradient/particle animation stands in for a video background —
     no large media download, GPU-cheap, and paused whenever the hero is
     off-screen or the user prefers reduced motion.
     To swap in a real video later: replace this canvas with
     <video autoplay muted loop playsinline poster="..."><source src="..."></video>
     and keep the same IntersectionObserver pause/resume pattern.
  ------------------------------------------------------------------------ */
  const canvas = document.getElementById("heroCanvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, particles, running = true;

    function resize() {
      w = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      h = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
    }
    function makeParticles() {
      const count = Math.min(60, Math.floor((w * h) / 90000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.4,
        vy: Math.random() * 0.25 + 0.05,
        vx: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.5 + 0.1,
      }));
    }
    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.85, 0, w * 0.5, h * 0.85, h);
      grad.addColorStop(0, "rgba(217,123,79,0.10)");
      grad.addColorStop(1, "rgba(11,10,9,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      particles.forEach((p) => {
        p.y -= p.vy;
        p.x += p.vx;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(243,237,228,${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    resize();
    makeParticles();
    draw();
    window.addEventListener("resize", () => { resize(); makeParticles(); });

    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      if (running) requestAnimationFrame(draw);
    }, { threshold: 0 });
    io.observe(canvas);

    document.addEventListener("visibilitychange", () => {
      running = running && !document.hidden;
    });
  }

  /* ---------------- Refresh ScrollTrigger after full load (fonts/layout) ---------------- */
  window.addEventListener("load", () => {
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
})();
