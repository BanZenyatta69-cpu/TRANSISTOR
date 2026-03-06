/**
 * canvas.js — Quantum Particle Field
 * Simulates an electron/node network with quantum-style behavior
 */

(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, nodes, mouse = { x: -9999, y: -9999 };
  const NODE_COUNT = 90;
  const CONNECT_DIST = 160;
  const MOUSE_REPEL = 120;

  class Node {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x  = Math.random() * W;
      this.y  = initial ? Math.random() * H : -10;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.r  = Math.random() * 1.5 + 0.5;
      this.alpha = Math.random() * 0.6 + 0.2;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = 0.02 + Math.random() * 0.03;
      // Color variety: cyan, blue, or slight green
      const hue = 170 + Math.floor(Math.random() * 40);
      this.hue = hue;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.pulse += this.pulseSpeed;

      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_REPEL) {
        const force = (MOUSE_REPEL - dist) / MOUSE_REPEL;
        this.x += (dx / dist) * force * 1.5;
        this.y += (dy / dist) * force * 1.5;
      }

      // Soft wrap
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
    }

    draw() {
      const a = this.alpha * (0.7 + 0.3 * Math.sin(this.pulse));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 75%, ${a})`;
      ctx.fill();
    }
  }

  function init() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    nodes = Array.from({ length: NODE_COUNT }, () => new Node());
  }

  function drawConnections() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx   = nodes[i].x - nodes[j].x;
        const dy   = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DIST) {
          const t = 1 - dist / CONNECT_DIST;
          const alpha = t * 0.45;

          // Gradient line
          const grad = ctx.createLinearGradient(
            nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y
          );
          grad.addColorStop(0, `hsla(${nodes[i].hue}, 100%, 70%, ${alpha})`);
          grad.addColorStop(1, `hsla(${nodes[j].hue}, 100%, 70%, ${alpha})`);

          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = t * 1.2;
          ctx.stroke();
        }
      }
    }
  }

  // Electron particles that travel along connections
  const electrons = Array.from({ length: 8 }, () => ({
    nodeA: 0, nodeB: 1, t: Math.random(), speed: 0.003 + Math.random() * 0.004
  }));

  function drawElectrons() {
    electrons.forEach(e => {
      const a = nodes[e.nodeA], b = nodes[e.nodeB];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);

      if (dist < CONNECT_DIST) {
        e.t += e.speed;
        if (e.t >= 1) {
          e.t = 0;
          e.nodeA = e.nodeB;
          e.nodeB = Math.floor(Math.random() * nodes.length);
        }

        const x = a.x + (b.x - a.x) * e.t;
        const y = a.y + (b.y - a.y) * e.t;

        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
        ctx.fill();

        // Trail glow
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 8);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        e.nodeB = Math.floor(Math.random() * nodes.length);
      }
    });
  }

  let raf;
  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    nodes.forEach(n => { n.update(); n.draw(); });
    drawElectrons();
    raf = requestAnimationFrame(loop);
  }

  // Resize handler (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(raf);
      init();
      loop();
    }, 200);
  });

  // Mouse tracking
  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // Init
  init();
  loop();
})();
