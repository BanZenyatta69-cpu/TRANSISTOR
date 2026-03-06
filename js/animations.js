/**
 * animations.js — Scroll Reveals, Cursor, Progress Bar, Bands Visualizer
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── CUSTOM CURSOR ── */
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursor-ring');

  if (cursor && cursorRing) {
    let cx = -100, cy = -100;
    let rx = -100, ry = -100;

    document.addEventListener('mousemove', e => {
      cx = e.clientX; cy = e.clientY;
      cursor.style.left = cx + 'px';
      cursor.style.top  = cy + 'px';
    });

    // Ring follows with easing
    (function ringLoop() {
      rx += (cx - rx) * 0.12;
      ry += (cy - ry) * 0.12;
      cursorRing.style.left = rx + 'px';
      cursorRing.style.top  = ry + 'px';
      requestAnimationFrame(ringLoop);
    })();

    // Hide when leaving
    document.addEventListener('mouseleave', () => {
      cursor.style.opacity = '0';
      cursorRing.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      cursor.style.opacity = '1';
      cursorRing.style.opacity = '1';
    });
  }

  /* ── SCROLL PROGRESS BAR ── */
  const progressBar = document.getElementById('progress-bar');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pct = maxScroll > 0 ? scrolled / maxScroll : 0;
      progressBar.style.transform = `scaleX(${pct})`;
    }, { passive: true });
  }

  /* ── NAV SHRINK ON SCROLL ── */
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ── INTERSECTION OBSERVER — REVEAL ── */
  const revealEls = document.querySelectorAll('.reveal, .reveal-left');
  const tlItems   = document.querySelectorAll('.tl-item');

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObs.observe(el));

  const tlObs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        tlObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  tlItems.forEach((el, i) => {
    el.style.transitionDelay = (i * 0.06) + 's';
    tlObs.observe(el);
  });

  /* ── COUNTER ANIMATION ── */
  function animateCounter(el, end, duration = 1800) {
    const start = 0;
    const startTime = performance.now();
    const isFloat = String(end).includes('.');

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const value = start + (end - start) * eased;

      if (isFloat) {
        el.textContent = value.toFixed(1);
      } else if (end >= 1e9) {
        el.textContent = (value / 1e9).toFixed(0) + 'B+';
      } else if (end >= 1e6) {
        el.textContent = (value / 1e6).toFixed(0) + 'M';
      } else {
        el.textContent = Math.floor(value).toLocaleString();
      }

      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  const statEls = document.querySelectorAll('[data-count]');
  const statsObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el  = entry.target;
        const end = parseFloat(el.dataset.count);
        animateCounter(el, end);
        statsObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statEls.forEach(el => statsObs.observe(el));

  /* ── ENERGY BANDS VISUALIZER ── */
  const bandsCanvas = document.getElementById('bands-canvas');
  if (bandsCanvas) {
    const bCtx = bandsCanvas.getContext('2d');
    let bW, bH, bT = 0;

    function initBands() {
      bW = bandsCanvas.width  = bandsCanvas.offsetWidth;
      bH = bandsCanvas.height = 200;
    }
    initBands();

    function drawBands() {
      bCtx.clearRect(0, 0, bW, bH);
      bT += 0.015;

      // Background
      bCtx.fillStyle = 'rgba(0,0,0,0.3)';
      bCtx.fillRect(0, 0, bW, bH);

      const regions = [
        // [yTop, height, label, color, type]
        [0,    60,  'BANDA DE CONDUCCIÓN', 'rgba(0,180,220,', 'conduct'],
        [60,   80,  'BANDA PROHIBIDA (GAP ≈ 1.1 eV)', 'rgba(180,50,20,', 'gap'],
        [140,  60,  'BANDA DE VALENCIA', 'rgba(0,100,180,', 'valence'],
      ];

      regions.forEach(([yTop, h, label, colorBase, type]) => {
        // Region fill
        const grad = bCtx.createLinearGradient(0, yTop, 0, yTop + h);
        grad.addColorStop(0,   colorBase + '0.15)');
        grad.addColorStop(0.5, colorBase + '0.25)');
        grad.addColorStop(1,   colorBase + '0.1)');
        bCtx.fillStyle = grad;
        bCtx.fillRect(0, yTop, bW, h);

        // Top border
        bCtx.strokeStyle = colorBase + '0.5)';
        bCtx.lineWidth = 1;
        bCtx.beginPath();
        bCtx.moveTo(0, yTop);
        bCtx.lineTo(bW, yTop);
        bCtx.stroke();

        // Wavy energy levels
        if (type === 'conduct' || type === 'valence') {
          const lineCount = type === 'valence' ? 4 : 2;
          for (let l = 0; l < lineCount; l++) {
            const ly = yTop + (h / (lineCount + 1)) * (l + 1);
            bCtx.strokeStyle = colorBase + '0.35)';
            bCtx.lineWidth = 1;
            bCtx.beginPath();
            for (let x = 0; x <= bW; x += 2) {
              const wave = Math.sin(x * 0.015 + bT + l * 1.2) * 3;
              x === 0
                ? bCtx.moveTo(x, ly + wave)
                : bCtx.lineTo(x, ly + wave);
            }
            bCtx.stroke();
          }
        }

        // Label
        bCtx.fillStyle = colorBase + '0.7)';
        bCtx.font = '500 9px JetBrains Mono, monospace';
        bCtx.letterSpacing = '2px';
        bCtx.fillText(label, 12, yTop + h / 2 + 4);
      });

      // Electron jumping the gap (animation)
      const jumpCycle = (bT % (Math.PI * 2)) / (Math.PI * 2);
      if (jumpCycle > 0.5) {
        const t = (jumpCycle - 0.5) * 2; // 0→1
        const ex = bW * 0.75;
        const ey = 140 - t * 140; // from bottom of gap to top

        // Trail
        for (let i = 5; i >= 0; i--) {
          const ty = ey + i * 6;
          const ta = (6 - i) / 6 * 0.4;
          bCtx.beginPath();
          bCtx.arc(ex, ty, 3 - i * 0.3, 0, Math.PI * 2);
          bCtx.fillStyle = `rgba(0, 240, 255, ${ta})`;
          bCtx.fill();
        }

        // Electron
        bCtx.beginPath();
        bCtx.arc(ex, ey, 4, 0, Math.PI * 2);
        bCtx.fillStyle = '#00f0ff';
        bCtx.fill();
        bCtx.shadowColor = '#00f0ff';
        bCtx.shadowBlur = 15;
        bCtx.fill();
        bCtx.shadowBlur = 0;

        // "e⁻" label
        bCtx.fillStyle = 'rgba(0,240,255,0.8)';
        bCtx.font = '10px JetBrains Mono';
        bCtx.fillText('e⁻', ex + 8, ey + 4);
      }

      // Arrow showing energy direction
      bCtx.fillStyle = 'rgba(255,255,255,0.1)';
      bCtx.font = '9px JetBrains Mono';
      bCtx.fillText('E ↑', bW - 30, bH / 2);

      requestAnimationFrame(drawBands);
    }

    // Only run when visible
    const bandsObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) drawBands(); });
    }, { threshold: 0.1 });
    bandsObs.observe(bandsCanvas);

    window.addEventListener('resize', () => {
      initBands();
    }, { passive: true });
  }

  /* ── GLITCH EFFECT on hero title (subtle, random) ── */
  const glitchEl = document.querySelector('.hero-title .t2');
  if (glitchEl) {
    setInterval(() => {
      if (Math.random() > 0.85) {
        glitchEl.style.animation = 'glitch 0.15s steps(2) forwards';
        setTimeout(() => { glitchEl.style.animation = ''; }, 200);
      }
    }, 3000);
  }

  /* ── SMOOTH ACTIVE NAV LINKS ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const activeObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(a => {
          a.style.color = a.getAttribute('href') === `#${id}`
            ? 'var(--cyan)' : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });

  sections.forEach(s => activeObs.observe(s));
});
