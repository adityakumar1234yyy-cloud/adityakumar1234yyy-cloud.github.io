(() => {
  'use strict';
  const canvas = document.getElementById('circle-background');
  const button = document.getElementById('motion-toggle');
  const ctx = canvas && canvas.getContext('2d');
  if (!ctx || !button) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(pointer: fine)');
  let paused = reduced.matches;
  let width = 0, height = 0, frame = 0, last = 0, circles = [];
  const pointer = { x: -1000, y: -1000, active: false };
  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = width < 700 ? 15 : 32;
    circles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width, y: Math.random() * height,
      r: 13 + Math.random() * (width < 700 ? 17 : 30),
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      tint: i % 3 === 0 ? '152,126,255' : '66,220,230'
    }));
    draw(0);
  }
  function draw(dt) {
    ctx.clearRect(0, 0, width, height);
    for (const c of circles) {
      if (dt) {
        if (pointer.active && fine.matches) {
          const dx = pointer.x - c.x, dy = pointer.y - c.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 330 && distance > 1) {
            c.vx += dx / distance * 0.075 * dt;
            c.vy += dy / distance * 0.075 * dt;
          }
        }
        c.vx *= Math.pow(0.994, dt); c.vy *= Math.pow(0.994, dt);
        const speed = Math.hypot(c.vx, c.vy);
        if (speed > 2.3) { c.vx *= 2.3 / speed; c.vy *= 2.3 / speed; }
        c.x += c.vx * dt; c.y += c.vy * dt;
        if (c.x < c.r) { c.x = c.r; c.vx = Math.abs(c.vx); }
        if (c.x > width - c.r) { c.x = width - c.r; c.vx = -Math.abs(c.vx); }
        if (c.y < c.r) { c.y = c.r; c.vy = Math.abs(c.vy); }
        if (c.y > height - c.r) { c.y = height - c.r; c.vy = -Math.abs(c.vy); }
      }
    }
    for (let i = 0; i < circles.length; i++) for (let j = i + 1; j < circles.length; j++) {
      const a = circles[i], b = circles[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const distance = Math.max(Math.hypot(dx, dy), 0.01), touch = a.r + b.r;
      if (dt && distance < touch) {
        const nx = dx / distance, ny = dy / distance, overlap = (touch - distance) / 2;
        a.x -= nx * overlap; a.y -= ny * overlap; b.x += nx * overlap; b.y += ny * overlap;
        const approaching = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (approaching > 0) { a.vx -= approaching * nx; a.vy -= approaching * ny; b.vx += approaching * nx; b.vy += approaching * ny; }
      }
      if (distance < touch + 65) {
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(90,215,230,${0.13 * (1 - Math.max(0, distance - touch) / 65)})`;
        ctx.lineWidth = 0.7; ctx.stroke();
      }
    }
    for (const c of circles) {
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c.tint},0.025)`; ctx.fill();
      ctx.strokeStyle = `rgba(${c.tint},0.24)`; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  function tick(time) {
    frame = 0;
    if (paused || document.hidden) return;
    draw(Math.min((time - (last || time)) / 16.67, 2)); last = time;
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    button.textContent = paused ? 'Circles: paused' : 'Circles: on';
    button.setAttribute('aria-pressed', String(!paused));
    button.setAttribute('aria-label', paused ? 'Resume background circle animation' : 'Pause background circle animation');
    if (!paused && !document.hidden) frame = requestAnimationFrame(tick);
  }
  button.addEventListener('click', () => { paused = !paused; sync(); });
  window.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = e.pointerType === 'mouse'; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('blur', () => { pointer.active = false; });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
  window.addEventListener('resize', resize, { passive: true });
  resize(); sync();
})();
